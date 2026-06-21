# Implementation Plan: F03. Background Processing

**Prerequisites:**
- F02 Video Upload complete (`Video` model with `status`, `filePath`, `userId` in DB)
- System FFmpeg installed and available in `PATH` (`ffmpeg` and `ffprobe` commands work in terminal)
- Python with `openai-whisper` installed: `pip install openai-whisper` (this pulls torch/numpy)
- `tsx` installed as a dev dependency for running the TypeScript worker: `npm install -D tsx`
- `storage/thumbnails/` and `storage/audio/` directories added to `.gitignore`; `.gitkeep` files committed to both so the directories exist in version control
- PostgreSQL running on port 5433 (Docker, from F01)
- Two terminal processes in dev: `npm run dev` (Next.js) + `npm run worker:dev` (worker)

---

### Phase 1: Data Foundation

**1. Prisma Schema — Video Changes** — Add `retryCount` and `searchVector` fields to the existing `Video` model in `prisma/schema.prisma`, following the spec. Add the `transcriptionSegments` relation field. Mark `searchVector` as `Unsupported("tsvector")` since Prisma 7 has no native tsvector type.

**2. Prisma Schema — TranscriptionSegment Model** — Add the new `TranscriptionSegment` model to `prisma/schema.prisma` with the `videoId` FK, `startMs`, `endMs`, and `text` fields and the `@@index([videoId])` directive. Run `npx prisma migrate dev --create-only --name add-retry-and-segments` to generate the migration file, then manually append the raw SQL for the `search_vector` column and its GIN index before committing. Finally run `npx prisma migrate dev` (or `npx prisma db push`) to apply and regenerate the Prisma client.

---

### Phase 2: External Tool Wrappers

**3. FFmpeg Wrapper** — Create `worker/ffmpeg.ts` implementing three exported async functions: `getDuration` (invokes `ffprobe` and parses JSON stream metadata), `generateThumbnail` (invokes `ffmpeg` with `-ss 5` and retries at `-ss 0` if the first attempt fails; writes to `storage/thumbnails/`), and `extractAudio` (invokes `ffmpeg` to produce a 16 kHz mono WAV file in `storage/audio/`). Each function wraps `child_process.spawn`, collects stdout/stderr, and rejects on non-zero exit codes with a descriptive error message derived from stderr. Create the destination directories with `fs.mkdir({ recursive: true })` before writing files.

**4. Python Whisper Script** — Create `worker/whisper_transcribe.py`. The script accepts an audio file path as `sys.argv[1]`, loads the Whisper `"base"` model, runs `model.transcribe(path)`, and prints a single JSON object with `language` and `segments` (each segment has `start`, `end` in seconds and `text`) to stdout. On any exception, write to stderr and exit with code 1.

**5. TypeScript Whisper Wrapper** — Create `worker/whisper.ts` implementing `transcribe(audioPath): Promise<WhisperResult>`. The function spawns `python worker/whisper_transcribe.py <audioPath>` via `child_process.spawn`, accumulates stdout, parses JSON on process close, converts `start`/`end` seconds to `startMs`/`endMs` integers, and normalizes any detected language code outside `['pt','en','es']` to `'pt'`. Rejects if the Python process exits with a non-zero code.

---

### Phase 3: Job Processing Logic

**6. Processor — FFmpeg Phase** — Create `worker/processor.ts` and implement the first part of `processVideo(videoId, filePath)`: update video status to Processing, call `getDuration` and store the result, call `generateThumbnail` and store the path, then call `extractAudio` to produce a temporary WAV file. Persist `durationSeconds` and `thumbnailPath` on the Video row via Prisma at the end of this phase. Any exception thrown here triggers the retry gate (step 9).

**7. Processor — Whisper Phase** — Extend `processVideo` to call `transcribe(audioPath)` from `worker/whisper.ts`, then write the resulting segments as `TranscriptionSegment` rows via `prisma.transcriptionSegment.createMany`. Store the detected `language` on the Video row. Delete the temporary WAV file via `deleteFile(audioPath)` from `app/lib/storage.ts` after the segments are committed regardless of success or failure (use try/finally).

**8. Processor — Finalization** — After segments are written, update `search_vector` on the `videos` row via `prisma.$executeRaw` using the PostgreSQL `to_tsvector` function, passing the concatenated segment text and the appropriate language config name (`'portuguese'`, `'english'`, or `'spanish'`). Set video status to Ready. Log the completed job with `videoId` and elapsed time.

**9. Processor — Retry Gate** — Wrap the full pipeline in a try/catch. On any caught error: read the current `retryCount` from the Video row; if `retryCount < 3`, increment `retryCount` and reset status to Queued so the worker picks it up again; if `retryCount >= 3`, set status to Failed and store the error message in `processingError`. Map known FFmpeg/Whisper error conditions to the user-facing messages specified in the PRD (e.g., "Could not extract audio from this file.", "Transcription timed out.", "File is corrupted or cannot be read.").

**10. Worker Entry Point — Polling Loop** — Create `worker/index.ts`. On each tick (every 10 s), query one Video where `status = 'Queued'` ordered by `uploadedAt ASC` (FIFO). If a job is found, call `processVideo`; await completion before the next tick fires (no concurrent processing). Log each tick result (job found / no jobs).

**11. Worker Entry Point — Shutdown + Scripts** — Register `process.on('SIGINT')` and `process.on('SIGTERM')` handlers that clear the polling interval and close the Prisma connection before exiting. Add `"worker:dev": "tsx worker/index.ts"` to the `scripts` block in `package.json` so the worker can be started alongside Next.js during development.

---

### Phase 4: API Routes

**12. Status Endpoint** — Create `app/api/videos/[id]/status/route.ts` with an exported `GET` handler. Authenticate with `auth()`, resolve the id with `await params` per Next.js 16 conventions, query the Video row filtered by both `id` and `userId` (ownership check), and return the card fields as JSON. Return 404 with code `PROC001` if not found.

**13. Retry Endpoint** — Create `app/api/videos/[id]/retry/route.ts` with an exported `POST` handler. Authenticate, resolve params, verify ownership (PROC001 on failure), verify `status === 'Failed'` (PROC002 on failure), then update the Video row: `status → Queued`, `retryCount → 0`, `processingError → null`. Return 200 with the updated id and new status.

---

### Phase 5: Infrastructure & End-to-End Verification

**14. Storage Directory Setup** — Create `storage/thumbnails/.gitkeep` and `storage/audio/.gitkeep` to ensure the directories are tracked. Add `storage/thumbnails/` and `storage/audio/` (excluding `.gitkeep`) to `.gitignore`. Verify both directories are created on worker startup before FFmpeg writes to them.

**15. End-to-End Smoke Test** — Start both processes concurrently (`npm run dev` + `npm run worker:dev`), upload a video via `/upload`, and verify the full pipeline: status transitions from Queued → Processing → Ready, the thumbnail appears in `storage/thumbnails/`, `TranscriptionSegment` rows exist in the database, and `search_vector` is non-null on the `videos` row. Test the failure + retry path by temporarily making the audio path invalid and confirming `retryCount` increments across multiple worker cycles until `Failed` is set.
