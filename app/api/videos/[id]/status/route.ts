import type { NextRequest } from "next/server";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const video = await prisma.video.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      status: true,
      processingError: true,
      thumbnailPath: true,
      durationSeconds: true,
      language: true,
      retryCount: true,
    },
  });

  if (!video) {
    return Response.json(
      { error: "Video not found.", code: "PROC001" },
      { status: 404 }
    );
  }

  return Response.json({
    id: video.id,
    status: video.status,
    processingError: video.processingError,
    thumbnailPath: video.thumbnailPath,
    durationSeconds: video.durationSeconds,
    language: video.language,
    retryCount: video.retryCount,
  });
}
