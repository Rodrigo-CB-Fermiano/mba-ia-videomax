"use client";

import { useEffect, useState } from "react";

interface QuotaData {
  usedBytes: number;
  totalBytes: number;
  remainingBytes: number;
}

interface QuotaIndicatorProps {
  refreshToken?: number;
}

export default function QuotaIndicator({ refreshToken = 0 }: QuotaIndicatorProps) {
  const [quota, setQuota] = useState<QuotaData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
    fetch("/api/upload/quota")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setQuota)
      .catch(() => setError(true));
  }, [refreshToken]);

  if (error) return null;
  if (!quota) {
    return (
      <div className="mb-6 text-sm text-gray-400">Loading storage info...</div>
    );
  }

  const usedMB = Math.round(quota.usedBytes / 1_048_576);
  const totalGB = 1;
  const percent = Math.min(100, (quota.usedBytes / quota.totalBytes) * 100);

  return (
    <div className="mb-6">
      <p className="text-sm text-gray-600 mb-1">
        {usedMB} MB used of {totalGB} GB
      </p>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
