import { auth } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/db";
import { LibraryClient } from "@/app/components/library/library-client";
import type { LibraryResponse, VideoStatus } from "@/app/lib/types/library";

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

export default async function LibraryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [videosRaw, total, categories, tags] = await Promise.all([
    prisma.video.findMany({
      where: { userId, isArchived: false },
      orderBy: [{ uploadedAt: "desc" }, { title: "asc" }],
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
    prisma.video.count({ where: { userId, isArchived: false } }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
    prisma.tag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
  ]);

  const initialData: LibraryResponse = {
    videos: (videosRaw as RawVideo[]).map((v) => ({
      ...v,
      uploadedAt: v.uploadedAt.toISOString(),
      categories: v.categories.map((vc) => vc.category),
      tags: v.tags.map((vt) => vt.tag),
    })),
    total,
    page: 1,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
  };

  return (
    <LibraryClient
      initialData={initialData}
      categories={categories}
      tags={tags}
    />
  );
}
