import { extname } from "path";
import type { NextRequest } from "next/server";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";
import { saveFile, deleteFile } from "@/app/lib/storage";
import {
  isVideoMime,
  MAX_FILE_BYTES,
  QUOTA_BYTES,
} from "@/app/lib/validations/upload";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (request.signal.aborted) {
    return new Response(null, { status: 499 });
  }

  const userId = session.user.id;
  let savedPath: string | null = null;

  const cleanup = () => {
    if (savedPath) deleteFile(savedPath).catch(() => {});
  };
  request.signal.addEventListener("abort", cleanup);

  try {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return Response.json(
        { error: "Upload interrupted. Check your connection and try again." },
        { status: 400 }
      );
    }

    if (request.signal.aborted) return new Response(null, { status: 499 });

    const entry = formData.get("file");
    if (!(entry instanceof File)) {
      return Response.json(
        { error: "Only video files are accepted.", code: "UPLOAD002" },
        { status: 400 }
      );
    }

    const file = entry;

    if (!isVideoMime(file.type)) {
      return Response.json(
        { error: "Only video files are accepted.", code: "UPLOAD002" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_BYTES) {
      return Response.json(
        {
          error: "File too large. Maximum allowed size is 300 MB.",
          code: "UPLOAD001",
        },
        { status: 400 }
      );
    }

    const quotaResult = await prisma.video.aggregate({
      where: { userId },
      _sum: { fileSizeBytes: true },
    });
    const currentUsedBytes = Number(quotaResult._sum.fileSizeBytes ?? BigInt(0));

    if (currentUsedBytes + file.size > QUOTA_BYTES) {
      const remainingBytes = QUOTA_BYTES - currentUsedBytes;
      const remainingMB = Math.floor(remainingBytes / 1_048_576);
      return Response.json(
        {
          error: `Not enough storage. You have ${remainingMB} MB remaining. Delete videos to free space.`,
          code: "UPLOAD003",
          remainingBytes,
        },
        { status: 400 }
      );
    }

    if (request.signal.aborted) return new Response(null, { status: 499 });

    const ext = extname(file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    savedPath = await saveFile(userId, ext, buffer);

    if (request.signal.aborted) {
      cleanup();
      return new Response(null, { status: 499 });
    }

    const title = file.name.replace(/\.[^/.]+$/, "");
    const video = await prisma.video.create({
      data: {
        userId,
        title,
        originalName: file.name,
        filePath: savedPath,
        mimeType: file.type,
        fileSizeBytes: BigInt(file.size),
      },
    });

    return Response.json(
      {
        video: {
          id: video.id,
          filePath: video.filePath,
          originalName: video.originalName,
          mimeType: video.mimeType,
          fileSizeBytes: Number(video.fileSizeBytes),
          status: video.status,
          uploadedAt: video.uploadedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch {
    cleanup();
    return Response.json(
      {
        error: "Upload failed. Please try again in a few moments.",
        code: "UPLOAD004",
      },
      { status: 500 }
    );
  } finally {
    request.signal.removeEventListener("abort", cleanup);
  }
}
