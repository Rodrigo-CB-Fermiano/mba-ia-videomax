"use client";

import { useEffect, useRef } from "react";
import type {
  LibraryCategory,
  LibraryFilters,
  LibraryTag,
  VideoStatus,
} from "@/app/lib/types/library";

const STATUS_OPTIONS: { value: VideoStatus | ""; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "Queued", label: "Na fila" },
  { value: "Processing", label: "Processando" },
  { value: "Ready", label: "Pronto" },
  { value: "Failed", label: "Falhou" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  filters: LibraryFilters;
  onChange: (filters: LibraryFilters) => void;
  categories: LibraryCategory[];
  tags: LibraryTag[];
};

export function FilterPanel({
  open,
  onClose,
  filters,
  onChange,
  categories,
  tags,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  function toggleCategory(id: string) {
    const next = filters.categoryIds.includes(id)
      ? filters.categoryIds.filter((c) => c !== id)
      : [...filters.categoryIds, id];
    onChange({ ...filters, categoryIds: next });
  }

  function toggleTag(id: string) {
    const next = filters.tagIds.includes(id)
      ? filters.tagIds.filter((t) => t !== id)
      : [...filters.tagIds, id];
    onChange({ ...filters, tagIds: next });
  }

  function clearAll() {
    onChange({
      status: "",
      categoryIds: [],
      tagIds: [],
      dateFrom: "",
      dateTo: "",
      isArchived: false,
    });
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-30"
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl z-40 flex flex-col"
        role="dialog"
        aria-label="Filtros"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Filtros</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={clearAll}
              className="text-xs text-blue-600 hover:underline"
            >
              Limpar tudo
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Fechar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Status */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Status
            </h3>
            <div className="space-y-1">
              {STATUS_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value={opt.value}
                    checked={filters.status === opt.value}
                    onChange={() => onChange({ ...filters, status: opt.value })}
                    className="accent-blue-600"
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Categories */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Categorias
            </h3>
            <div className="space-y-1">
              {categories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.categoryIds.includes(cat.id)}
                    onChange={() => toggleCategory(cat.id)}
                    className="accent-blue-600"
                  />
                  <span className="text-sm text-gray-700">{cat.name}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Tags */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Tags
            </h3>
            <div className="space-y-1">
              {tags.map((tag) => (
                <label key={tag.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.tagIds.includes(tag.id)}
                    onChange={() => toggleTag(tag.id)}
                    className="accent-blue-600"
                  />
                  <span className="text-sm text-gray-700">{tag.name}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Date range */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Data de envio
            </h3>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">De</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Até</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </section>

          {/* Archived toggle */}
          <section>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.isArchived}
                onChange={(e) => onChange({ ...filters, isArchived: e.target.checked })}
                className="accent-blue-600"
              />
              <span className="text-sm text-gray-700">Mostrar arquivados</span>
            </label>
          </section>
        </div>
      </div>
    </>
  );
}
