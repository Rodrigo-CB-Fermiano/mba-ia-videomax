import type { NextRequest } from "next/server";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  const video = await prisma.video.findFirst({
    where: { id, userId: session.user.id },
    select: { thumbnailPath: true },
  });

  if (!video?.thumbnailPath) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const absolutePath = join(process.cwd(), video.thumbnailPath);
    const data = await readFile(absolutePath);
    return new Response(data, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
