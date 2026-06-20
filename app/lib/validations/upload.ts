export const MAX_FILE_BYTES = 314_572_800; // 300 MB
export const QUOTA_BYTES = 1_073_741_824; // 1 GB

export function isVideoMime(mime: string): boolean {
  return mime.startsWith("video/");
}
