"use client";

import type {
  LibraryCategory,
  LibraryFilters,
  LibraryTag,
  VideoStatus,
} from "@/app/lib/types/library";

const STATUS_LABELS: Record<VideoStatus, string> = {
  Queued: "Na fila",
  Processing: "Processando",
  Ready: "Pronto",
  Failed: "Falhou",
};

type Props = {
  filters: LibraryFilters;
  categories: LibraryCategory[];
  tags: LibraryTag[];
  onChange: (filters: LibraryFilters) => void;
};

type Chip = { key: string; label: string; onRemove: () => void };

export function ActiveFilters({ filters, categories, tags, onChange }: Props) {
  const chips: Chip[] = [];

  if (filters.status) {
    chips.push({
      key: "status",
      label: `Status: ${STATUS_LABELS[filters.status]}`,
      onRemove: () => onChange({ ...filters, status: "" }),
    });
  }

  for (const id of filters.categoryIds) {
    const cat = categories.find((c) => c.id === id);
    if (cat) {
      chips.push({
        key: `cat-${id}`,
        label: cat.name,
        onRemove: () =>
          onChange({
            ...filters,
            categoryIds: filters.categoryIds.filter((c) => c !== id),
          }),
      });
    }
  }

  for (const id of filters.tagIds) {
    const tag = tags.find((t) => t.id === id);
    if (tag) {
      chips.push({
        key: `tag-${id}`,
        label: `#${tag.name}`,
        onRemove: () =>
          onChange({
            ...filters,
            tagIds: filters.tagIds.filter((t) => t !== id),
          }),
      });
    }
  }

  if (filters.dateFrom) {
    chips.push({
      key: "dateFrom",
      label: `De: ${filters.dateFrom}`,
      onRemove: () => onChange({ ...filters, dateFrom: "" }),
    });
  }

  if (filters.dateTo) {
    chips.push({
      key: "dateTo",
      label: `Até: ${filters.dateTo}`,
      onRemove: () => onChange({ ...filters, dateTo: "" }),
    });
  }

  if (filters.isArchived) {
    chips.push({
      key: "archived",
      label: "Arquivados",
      onRemove: () => onChange({ ...filters, isArchived: false }),
    });
  }

  if (chips.length === 0) return null;

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

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs text-blue-700"
        >
          {chip.label}
          <button
            onClick={chip.onRemove}
            className="ml-0.5 text-blue-400 hover:text-blue-700"
            aria-label={`Remover filtro ${chip.label}`}
          >
            ×
          </button>
        </span>
      ))}
      <button
        onClick={clearAll}
        className="text-xs text-gray-500 hover:text-gray-700 underline"
      >
        Limpar tudo
      </button>
    </div>
  );
}
