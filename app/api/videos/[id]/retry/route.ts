import type { NextRequest } from "next/server";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

export async function POST(
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
    select: { id: true, status: true },
  });

  if (!video) {
    return Response.json(
      { error: "Video not found.", code: "PROC001" },
      { status: 404 }
    );
  }

  if (video.status !== "Failed") {
    return Response.json(
      {
        error: "Video is not in Failed status. Retry is only available after failure.",
        code: "PROC002",
      },
      { status: 409 }
    );
  }

  await prisma.video.update({
    where: { id },
    data: {
      status: "Queued",
      retryCount: 0,
      processingError: null,
    },
  });

  return Response.json({
    success: true,
    video: { id, status: "Queued" },
  });
}
