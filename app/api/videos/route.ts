import type { NextRequest } from "next/server";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";
import type { VideoStatus } from "@/app/lib/types/library";

type Chip = { id: string; name: string; slug: string };
type RawVideo = {
  id: string;
  title: string;
  originalName: string;
  status: VideoStatus;
  processingError: string | null;
  durationSeconds: number | null;
  thumbnailPath: string | null;
  uploadedAt: Date;
  isArchived: boolean;
  language: string | null;
  categories: { category: Chip }[];
  tags: { tag: Chip }[];
};

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") as VideoStatus | null;
  const categoryIdsParam = searchParams.get("categoryIds");
  const tagIdsParam = searchParams.get("tagIds");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const isArchivedParam = searchParams.get("isArchived");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));

  const categoryIds = categoryIdsParam
    ? categoryIdsParam.split(",").filter(Boolean)
    : [];
  const tagIds = tagIdsParam ? tagIdsParam.split(",").filter(Boolean) : [];
  const isArchived = isArchivedParam === "true";

  const where = {
    userId: session.user.id,
    isArchived,
    ...(status ? { status } : {}),
    ...(categoryIds.length > 0
      ? { categories: { some: { categoryId: { in: categoryIds } } } }
      : {}),
    ...(tagIds.length > 0
      ? { tags: { some: { tagId: { in: tagIds } } } }
      : {}),
    ...(dateFrom || dateTo
      ? {
          uploadedAt: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo + "T23:59:59.999Z") } : {}),
          },
        }
      : {}),
  };

  const [videos, total] = await Promise.all([
    prisma.video.findMany({
      where,
      orderBy: [{ uploadedAt: "desc" }, { title: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        originalName: true,
        status: true,
        processingError: true,
        durationSeconds: true,
        thumbnailPath: true,
        uploadedAt: true,
        isArchived: true,
        language: true,
        categories: {
          select: { category: { select: { id: true, name: true, slug: true } } },
        },
        tags: {
          select: { tag: { select: { id: true, name: true, slug: true } } },
        },
      },
    }),
    prisma.video.count({ where }),
  ]);

  return Response.json({
    videos: (videos as RawVideo[]).map((v) => ({
      ...v,
      uploadedAt: v.uploadedAt.toISOString(),
      categories: v.categories.map((vc) => vc.category),
      tags: v.tags.map((vt) => vt.tag),
    })),
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
  });
}
