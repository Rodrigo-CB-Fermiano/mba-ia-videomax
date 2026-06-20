import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";
import { QUOTA_BYTES } from "@/app/lib/validations/upload";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await prisma.video.aggregate({
    where: { userId: session.user.id },
    _sum: { fileSizeBytes: true },
  });

  const usedBytes = Number(result._sum.fileSizeBytes ?? BigInt(0));
  const totalBytes = QUOTA_BYTES;
  const remainingBytes = totalBytes - usedBytes;

  return Response.json({ usedBytes, totalBytes, remainingBytes });
}
