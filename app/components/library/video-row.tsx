"use client";

import Link from "next/link";
import { StatusBadge } from "./status-badge";
import type { LibraryVideo } from "@/app/lib/types/library";

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function VideoRow({ video }: { video: LibraryVideo }) {
  const visibleCategories = video.categories.slice(0, 3);
  const visibleTags = video.tags.slice(0, 3);

  return (
    <Link
      href={`/video/${video.id}`}
      className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3 hover:border-blue-400 hover:shadow-sm transition-all"
    >
      {/* Small thumbnail */}
      <div className="flex-shrink-0 w-20 h-12 rounded bg-gray-100 overflow-hidden">
        {video.thumbnailPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/videos/${video.id}/thumbnail`}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M4 8a2 2 0 012-2h9a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V8z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-gray-900">{video.title}</p>
        <p className="truncate text-xs text-gray-500 mt-0.5">{video.originalName}</p>
      </div>

      {/* Duration */}
      <span className="hidden sm:block w-16 text-right text-sm text-gray-600 flex-shrink-0">
        {formatDuration(video.durationSeconds)}
      </span>

      {/* Categories */}
      <div className="hidden md:flex items-center gap-1 w-40 flex-shrink-0 flex-wrap">
        {visibleCategories.map((cat) => (
          <span
            key={cat.id}
            className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600"
          >
            {cat.name}
          </span>
        ))}
      </div>

      {/* Tags */}
      <div className="hidden lg:flex items-center gap-1 w-40 flex-shrink-0 flex-wrap">
        {visibleTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-block rounded border border-gray-200 px-1.5 py-0.5 text-xs text-gray-500"
          >
            {tag.name}
          </span>
        ))}
      </div>

      {/* Status */}
      <div className="flex-shrink-0">
        <StatusBadge status={video.status} />
      </div>

      {/* Date */}
      <span className="hidden sm:block w-24 text-right text-xs text-gray-400 flex-shrink-0">
        {formatDate(video.uploadedAt)}
      </span>
    </Link>
  );
}
