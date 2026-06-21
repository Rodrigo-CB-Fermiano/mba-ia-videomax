"use client";

import Link from "next/link";
import { StatusBadge } from "./status-badge";
import type { LibraryVideo } from "@/app/lib/types/library";

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function VideoCard({ video }: { video: LibraryVideo }) {
  const duration = formatDuration(video.durationSeconds);
  const visibleCategories = video.categories.slice(0, 2);

  return (
    <Link
      href={`/video/${video.id}`}
      className="group flex flex-col rounded-lg border border-gray-200 bg-white overflow-hidden hover:border-blue-400 hover:shadow-md transition-all"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100 flex-shrink-0">
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
              className="w-10 h-10 text-gray-300"
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
        {duration && (
          <span className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
            {duration}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
          {video.title}
        </p>
        <div className="flex items-center gap-1.5 flex-wrap mt-auto">
          {visibleCategories.map((cat) => (
            <span
              key={cat.id}
              className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600"
            >
              {cat.name}
            </span>
          ))}
          <div className="ml-auto">
            <StatusBadge status={video.status} />
          </div>
        </div>
      </div>
    </Link>
  );
}
