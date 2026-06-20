"use client";

import { useRef, useState } from "react";
import UploadProgress from "./upload-progress";
import { isVideoMime, MAX_FILE_BYTES } from "@/app/lib/validations/upload";

interface UploadedVideo {
  id: string;
  filePath: string;
  originalName: string;
  mimeType: string;
  fileSizeBytes: number;
  status: string;
  uploadedAt: string;
}

interface UploadZoneProps {
  onUploadComplete?: (video: UploadedVideo) => void;
}

interface ProgressState {
  filename: string;
  percent: number;
  speedBytesPerSec: number;
  etaSeconds: number;
}

export default function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const startTimeRef = useRef<number>(0);

  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const startUpload = (file: File) => {
    setError(null);
    setSuccess(false);
    startTimeRef.current = Date.now();

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const speed = elapsed > 0 ? e.loaded / elapsed : 0;
      const remaining = speed > 0 ? (e.total - e.loaded) / speed : 0;
      setProgress({
        filename: file.name,
        percent: Math.round((e.loaded / e.total) * 100),
        speedBytesPerSec: speed,
        etaSeconds: remaining,
      });
    };

    xhr.onload = () => {
      xhrRef.current = null;
      setProgress(null);
      if (xhr.status === 201) {
        const data = JSON.parse(xhr.responseText);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 5000);
        onUploadComplete?.(data.video);
      } else {
        try {
          const data = JSON.parse(xhr.responseText);
          setError(data.error ?? "Upload failed. Please try again in a few moments.");
        } catch {
          setError("Upload failed. Please try again in a few moments.");
        }
      }
    };

    xhr.onerror = () => {
      xhrRef.current = null;
      setProgress(null);
      setError("Upload interrupted. Check your connection and try again.");
    };

    xhr.onabort = () => {
      xhrRef.current = null;
      setProgress(null);
    };

    const formData = new FormData();
    formData.append("file", file);
    xhr.open("POST", "/api/upload");
    xhr.send(formData);
  };

  const handleFile = (file: File) => {
    setError(null);
    if (!isVideoMime(file.type)) {
      setError("Only video files are accepted.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("File too large. Maximum allowed size is 300 MB.");
      return;
    }
    startUpload(file);
  };

  const handleCancel = () => {
    xhrRef.current?.abort();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleZoneClick = () => {
    if (!progress) fileInputRef.current?.click();
  };

  return (
    <div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleZoneClick}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          progress
            ? "border-blue-400 bg-blue-50 cursor-default"
            : isDragging
            ? "border-blue-500 bg-blue-50 cursor-copy"
            : "border-gray-300 hover:border-gray-400 cursor-pointer"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />

        {!progress && (
          <>
            <p className="text-gray-600 text-sm font-medium">
              Drag and drop a video file here
            </p>
            <p className="text-gray-400 text-sm mt-1">or</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="mt-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Choose File
            </button>
            <p className="text-xs text-gray-400 mt-2">
              Video files only · Max 300 MB
            </p>
          </>
        )}

        {progress && (
          <UploadProgress
            filename={progress.filename}
            percentComplete={progress.percent}
            speedBytesPerSec={progress.speedBytesPerSec}
            etaSeconds={progress.etaSeconds}
            onCancel={handleCancel}
          />
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {success && (
        <div className="mt-2 rounded-md bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">
          Upload complete. Processing started.
        </div>
      )}
    </div>
  );
}
