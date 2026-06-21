"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { VideoGrid } from "./video-grid";
import { VideoList } from "./video-list";
import { FilterPanel } from "./filter-panel";
import { ActiveFilters } from "./active-filters";
import type {
  LibraryCategory,
  LibraryFilters,
  LibraryResponse,
  LibraryTag,
  LibraryVideo,
} from "@/app/lib/types/library";

const POLL_INTERVAL = 10_000;

const DEFAULT_FILTERS: LibraryFilters = {
  status: "",
  categoryIds: [],
  tagIds: [],
  dateFrom: "",
  dateTo: "",
  isArchived: false,
};

type Props = {
  initialData: LibraryResponse;
  categories: LibraryCategory[];
  tags: LibraryTag[];
};

function buildQuery(filters: LibraryFilters, page: number): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.categoryIds.length > 0)
    params.set("categoryIds", filters.categoryIds.join(","));
  if (filters.tagIds.length > 0)
    params.set("tagIds", filters.tagIds.join(","));
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.isArchived) params.set("isArchived", "true");
  params.set("page", String(page));
  return params.toString();
}

export function LibraryClient({ initialData, categories, tags }: Props) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filters, setFilters] = useState<LibraryFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<LibraryResponse>(initialData);
  const [loading, setLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchVideos = useCallback(
    async (f: LibraryFilters, p: number) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/videos?${buildQuery(f, p)}`);
        if (res.ok) {
          const json: LibraryResponse = await res.json();
          setData(json);
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Refetch when filters or page change
  useEffect(() => {
    fetchVideos(filters, page);
  }, [filters, page, fetchVideos]);

  // Poll every 10s for videos not yet in a terminal state
  useEffect(() => {
    function hasPending(videos: LibraryVideo[]) {
      return videos.some(
        (v) => v.status === "Queued" || v.status === "Processing"
      );
    }

    function startPoll() {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => {
        if (hasPending(data.videos)) {
          fetchVideos(filters, page);
        }
      }, POLL_INTERVAL);
    }

    startPoll();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [data.videos, filters, page, fetchVideos]);

  function handleFiltersChange(next: LibraryFilters) {
    setFilters(next);
    setPage(1);
  }

  const hasFilters =
    filters.status !== "" ||
    filters.categoryIds.length > 0 ||
    filters.tagIds.length > 0 ||
    filters.dateFrom !== "" ||
    filters.dateTo !== "" ||
    filters.isArchived;

  const activeFilterCount = [
    filters.status ? 1 : 0,
    filters.categoryIds.length,
    filters.tagIds.length,
    filters.dateFrom ? 1 : 0,
    filters.dateTo ? 1 : 0,
    filters.isArchived ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Minha Biblioteca</h1>
          <Link
            href="/upload"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Enviar vídeo
          </Link>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-4">
          {/* View toggle */}
          <div className="flex rounded-md border border-gray-300 overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 text-sm ${
                viewMode === "grid"
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
              aria-label="Visualização em grade"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 text-sm border-l border-gray-300 ${
                viewMode === "list"
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
              aria-label="Visualização em lista"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          {/* Filter button */}
          <button
            onClick={() => setFilterOpen(true)}
            className="relative flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
              />
            </svg>
            Filtros
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Total count */}
          <span className="ml-auto text-sm text-gray-400">
            {loading ? "Carregando…" : `${data.total} vídeo${data.total !== 1 ? "s" : ""}`}
          </span>
        </div>

        {/* Active filter chips */}
        {hasFilters && (
          <div className="mb-4">
            <ActiveFilters
              filters={filters}
              categories={categories}
              tags={tags}
              onChange={handleFiltersChange}
            />
          </div>
        )}

        {/* Video content */}
        <div className={loading ? "opacity-60 pointer-events-none" : ""}>
          {viewMode === "grid" ? (
            <VideoGrid videos={data.videos} hasFilters={hasFilters} />
          ) : (
            <VideoList videos={data.videos} hasFilters={hasFilters} />
          )}
        </div>

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-600">
              Página {data.page} de {data.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page === data.totalPages}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Próxima
            </button>
          </div>
        )}
      </div>

      {/* Filter drawer */}
      <FilterPanel
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onChange={handleFiltersChange}
        categories={categories}
        tags={tags}
      />
    </div>
  );
}
