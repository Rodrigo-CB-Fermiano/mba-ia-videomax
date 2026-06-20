"use client";

interface UploadProgressProps {
  filename: string;
  percentComplete: number;
  speedBytesPerSec: number;
  etaSeconds: number;
  onCancel: () => void;
}

function formatSpeed(bps: number): string {
  if (bps >= 1_048_576) return `${(bps / 1_048_576).toFixed(1)} MB/s`;
  if (bps > 0) return `${Math.round(bps / 1024)} KB/s`;
  return "Calculating...";
}

function formatEta(seconds: number): string {
  if (seconds <= 0) return "Calculating...";
  if (seconds < 60) return `${Math.round(seconds)}s remaining`;
  return `${Math.round(seconds / 60)}m remaining`;
}

export default function UploadProgress({
  filename,
  percentComplete,
  speedBytesPerSec,
  etaSeconds,
  onCancel,
}: UploadProgressProps) {
  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-700 truncate max-w-xs" title={filename}>
          {filename}
        </span>
        <button
          onClick={onCancel}
          className="ml-4 text-red-500 hover:text-red-700 text-sm font-medium shrink-0"
        >
          Cancel
        </button>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all"
          style={{ width: `${percentComplete}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>{percentComplete}%</span>
        <span>{formatSpeed(speedBytesPerSec)}</span>
        <span>{formatEta(etaSeconds)}</span>
      </div>
    </div>
  );
}
