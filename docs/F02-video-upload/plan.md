# Implementation Plan: F02. Video Upload

**Prerequisites:**
- F01 Authentication System complete (Auth.js session, Prisma, proxy.ts)
- Docker PostgreSQL running on port 5433
- `uuid` package (`npm install uuid @types/uuid`)
- `storage/videos/` directory excluded in `.gitignore`; add `storage/videos/.gitkeep` to track the folder

---

### Phase 1: Data Foundation

**1. Video Model and Migration** — Add the `VideoStatus` enum and `Video` model to `prisma/schema.prisma` following the full schema in the spec (all columns through F06, including `fileSizeBytes` as `BigInt`, the three composite indexes, and the cascade FK to `User`). Add the `videos Video[]` relation field to the existing `User` model. Run `npx prisma migrate dev --name add-video-model` and regenerate the Prisma client.

**2. Storage Utility** — Create `app/lib/storage.ts` with two exported functions: `saveFile` (receives userId, file extension, and a Buffer; writes to `storage/videos/<userId>/<uuid>.<ext>` creating the directory if needed; returns the relative path string) and `deleteFile` (receives a relative path and unlinks the file idempotently without throwing if the file is missing). Add `storage/videos/` to `.gitignore` and commit a `.gitkeep` inside to preserve the directory in version control.

**3. Upload Validation Constants** — Create `app/lib/validations/upload.ts` exporting `MAX_FILE_BYTES` (314_572_800), `QUOTA_BYTES` (1_073_741_824), and a helper `isVideoMime(mime: string): boolean` that checks whether the string starts with `video/`. These constants are shared between the client-side guard and the server-side route handler.

---

### Phase 2: API Layer

**4. Quota Endpoint** — Implement `GET /api/upload/quota` in `app/api/upload/quota/route.ts`. Authenticate the request using `auth()` from `app/lib/auth.ts`; return 401 if no session. Query the `videos` table with Prisma's `aggregate` (`_sum { fileSizeBytes }`) filtered to the authenticated user. Serialize the BigInt sum to a Number and return `{ usedBytes, totalBytes, remainingBytes }` as JSON.

**5. Upload Endpoint** — Implement `POST /api/upload` in `app/api/upload/route.ts`. Authenticate, then parse `request.formData()` to extract the file part. Validate MIME type against `isVideoMime` (UPLOAD002 on failure) and file size against `MAX_FILE_BYTES` (UPLOAD001 on failure). Aggregate current quota usage and reject with UPLOAD003 if the new file would exceed `QUOTA_BYTES`. Register an abort listener on `request.signal` before writing so that if the client disconnects, any partial file is deleted before the handler exits. Write the file via `saveFile`, insert a `Video` record with status `Queued`, and return the video object as 201 JSON. Wrap the write-and-insert block in try/catch to return UPLOAD004 on unexpected errors.

---

### Phase 3: Frontend

**6. Quota Indicator Component** — Create `app/components/upload/quota-indicator.tsx` as a Client Component that fetches `GET /api/upload/quota` on mount using `useEffect`. Render the result as "X MB used of 1 GB" with a thin progress bar. Accept an optional `refreshToken` prop so the parent can trigger a re-fetch after upload completes (increment the token value to force a new effect run).

**7. Upload Progress Component** — Create `app/components/upload/upload-progress.tsx` as a Client Component that accepts `filename`, `percentComplete`, `speedBytesPerSec`, and `etaSeconds` as props. Render the filename, a percentage bar, a human-readable speed (auto-switches between KB/s and MB/s), and an ETA string ("X seconds remaining" or "Calculating…" when speed is zero). Include a Cancel button that calls an `onCancel` callback prop.

**8. Upload Zone Component** — Create `app/components/upload/upload-zone.tsx` as a Client Component containing the drag-and-drop area and a hidden `<input type="file" accept="video/*">`. On file selection (via drop or picker), run client-side validation (MIME type via `isVideoMime`, size via `MAX_FILE_BYTES`) and display inline error messages without starting a transfer on failure. For valid files, create an `XMLHttpRequest`, attach an `upload.onprogress` handler to compute and store speed and ETA in component state, open `POST /api/upload`, append the file to a `FormData`, and call `xhr.send`. Expose a cancel function that calls `xhr.abort()` and clears progress state. On `xhr.load`, parse the 201 response, display a success toast ("Upload complete. Processing started."), and invoke the `onUploadComplete` callback with the returned video object.

**9. Upload Page** — Create `app/upload/page.tsx` as a React Server Component. Render the page heading and compose `UploadZone` with `QuotaIndicator`. Pass an `onUploadComplete` → `onRefresh` wiring so that when UploadZone signals completion, QuotaIndicator re-fetches usage. Add a link to `/library` in the page header so the user can navigate to their video collection.

**10. Post-upload Navigation** — After `onUploadComplete` fires in `UploadZone`, in addition to the toast, reset the drop zone to its idle state (ready for the next file). The video card in the library is rendered by F04; F02 only needs to ensure the Video record exists with status `Queued`. Confirm end-to-end by uploading a file and verifying the record in the database via Prisma Studio or a direct query.
