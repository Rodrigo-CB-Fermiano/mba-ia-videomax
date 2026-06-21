"use client";

import Link from "next/link";
import { VideoRow } from "./video-row";
import type { LibraryVideo } from "@/app/lib/types/library";

type Props = {
  videos: LibraryVideo[];
  hasFilters: boolean;
};

export function VideoList({ videos, hasFilters }: Props) {
  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <svg
          className="w-12 h-12 text-gray-300 mb-4"
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
        {hasFilters ? (
          <p className="text-gray-500">Nenhum vídeo corresponde aos filtros.</p>
        ) : (
          <>
            <p className="text-gray-500 mb-3">Nenhum vídeo ainda.</p>
            <Link
              href="/upload"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Enviar primeiro vídeo
            </Link>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {videos.map((video) => (
        <VideoRow key={video.id} video={video} />
      ))}
    </div>
  );
}
