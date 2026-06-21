export type VideoStatus = "Queued" | "Processing" | "Ready" | "Failed";

export type LibraryCategory = {
  id: string;
  name: string;
  slug: string;
};

export type LibraryTag = {
  id: string;
  name: string;
  slug: string;
};

export type LibraryVideo = {
  id: string;
  title: string;
  originalName: string;
  status: VideoStatus;
  processingError: string | null;
  durationSeconds: number | null;
  thumbnailPath: string | null;
  uploadedAt: string;
  isArchived: boolean;
  language: string | null;
  categories: LibraryCategory[];
  tags: LibraryTag[];
};

export type LibraryFilters = {
  status: VideoStatus | "";
  categoryIds: string[];
  tagIds: string[];
  dateFrom: string;
  dateTo: string;
  isArchived: boolean;
};

export type LibraryResponse = {
  videos: LibraryVideo[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
