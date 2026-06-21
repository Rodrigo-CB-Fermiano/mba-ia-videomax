import type { VideoStatus } from "@/app/lib/types/library";

const CONFIG: Record<VideoStatus, { label: string; className: string }> = {
  Queued: {
    label: "Na fila",
    className: "bg-yellow-100 text-yellow-800",
  },
  Processing: {
    label: "Processando",
    className: "bg-blue-100 text-blue-800",
  },
  Ready: {
    label: "Pronto",
    className: "bg-green-100 text-green-800",
  },
  Failed: {
    label: "Falhou",
    className: "bg-red-100 text-red-800",
  },
};

export function StatusBadge({ status }: { status: VideoStatus }) {
  const { label, className } = CONFIG[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {(status === "Queued" || status === "Processing") && (
        <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
      )}
      {label}
    </span>
  );
}
