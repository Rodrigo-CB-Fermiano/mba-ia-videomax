# Implementation Plan: F06 — Video Player with Transcription Panel

**Prerequisites:**
- F03 Background Processing complete — `transcription_segments` table populated, `GET /api/videos/[id]/status` and `POST /api/videos/[id]/retry` endpoints exist
- F02 Video Upload complete — `storage/videos/<userId>/` directory exists with video files; `videos` table has `filePath`, `mimeType`, `originalName`, `fileSizeBytes` columns
- Node.js 20 + TypeScript (existing project setup)
- FFmpeg not required for this feature (F03 handles processing)
- No new npm packages required — native HTML5 `<video>` API used for the player

---

### Phase 1: Backend API Routes

**1. Video Metadata Endpoint** — Create `app/api/videos/[id]/meta/route.ts` with a GET handler that authenticates the session, resolves the video ID with `await params`, and queries the `videos` table joined with a segment count. Return the lightweight metadata payload the page needs (title, status, language, durationSeconds, uploadedAt, segmentCount). Return 404 with code `PLAY001` if the video is not found or belongs to a different user.

**2. Transcription Segments Endpoint** — Create `app/api/videos/[id]/transcription/route.ts` with a GET handler that authenticates the session, verifies ownership, and returns all `transcription_segments` for the video ordered by `start_ms ASC`. Return an empty array when no segments exist, so the client can distinguish "no segments yet" from an error. Follow the PLAY001 / 401 error pattern from other `/api/videos/[id]/*` routes.

**3. Video Streaming Endpoint** — Create `app/api/videos/[id]/stream/route.ts` that authenticates the session, verifies ownership, reads the video's `filePath` and `mimeType` from the database, and serves the file via `fs.createReadStream`. Parse the `Range` request header to support partial content (HTTP 206), which is required for native browser seeking. Respond with `Accept-Ranges: bytes` on all responses and return 416 if the requested range exceeds the file size.

**4. Video Download Endpoint** — Create `app/api/videos/[id]/download/route.ts` that authenticates the session, verifies ownership, and streams the full video file with `Content-Disposition: attachment; filename="<originalName>"`. Serialize `fileSizeBytes` as `Number` for the `Content-Length` header to avoid BigInt serialization issues.

---

### Phase 2: Shared Validation and Page Scaffold

**5. Zod Validation Schema** — Create or update `app/lib/validations/video.ts` with a `videoIdSchema` that validates a UUID string. Reuse this schema across all four new route handlers for consistent video ID parameter validation.

**6. Video Detail Page RSC** — Create `app/video/[id]/page.tsx` as a React Server Component. It should query the video by ID and authenticated user ID via Prisma, and redirect to `/library` using `next/navigation` if the result is null. Pass the initial video metadata and an empty or populated segments array as props to the two Client Component children rendered in the two-column layout. Use a responsive CSS grid: player on the left column, transcription panel on the right on desktop; stacked vertically on mobile.

---

### Phase 3: Player Components

**7. VideoPlayer Component** — Create `app/components/video/video-player.tsx` as a `forwardRef` Client Component that wraps a native HTML5 `<video>` element. Manage playback state (`isPlaying`, `currentTime`, `duration`, `volume`, `playbackRate`, `isFullscreen`) with `useState` and sync them via `<video>` event listeners (`timeupdate`, `loadedmetadata`, `ended`, `volumechange`, `fullscreenchange`). Expose a `seekTo(ms: number)` method via `useImperativeHandle` so F07 can seek the video without coupling to internal state. The video `src` should point to `GET /api/videos/[id]/stream`.

**8. VideoControls Component** — Create `app/components/video/video-controls.tsx` as a pure presentational Client Component that receives all player state values and callback props from VideoPlayer. Render a play/pause button, a seek bar (`<input type="range">` synchronized to `currentTime/duration`), elapsed/total time labels formatted as `HH:MM:SS`, a volume slider, a speed selector dropdown with all six options (0.5, 0.75, 1, 1.25, 1.5, 2), a fullscreen button that calls the browser Fullscreen API, and a download anchor pointing to `GET /api/videos/[id]/download`.

---

### Phase 4: Transcription Components

**9. TranscriptionSegment Component** — Create `app/components/video/transcription-segment.tsx` as a Client Component that receives a single segment object, an `isActive` boolean, and an `onClick` callback. Format `startMs` to `HH:MM:SS` for display, render the timestamp and text on the same line, and apply a blue-background highlight class when `isActive` is true. Forward click events to the `onClick(segment.startMs)` callback.

**10. LanguageBadge Component** — Create `app/components/video/language-badge.tsx` as a Client Component that accepts a `language: string | null` prop and renders an uppercase pill badge (`PT`, `EN`, `ES`). Render nothing when `language` is null.

**11. TranscriptionPanel Component** — Create `app/components/video/transcription-panel.tsx` as a Client Component that receives `segments`, `videoStatus`, `language`, and a `videoRef` prop (pointing to the VideoPlayer imperative handle). Use a `setInterval` at 250 ms to read the current `currentTime` from the `<video>` DOM element and identify the active segment by comparing `currentTimeMs` against each segment's `startMs`/`endMs` range. Update `activeSegmentId` state on each tick and call `scrollIntoView` on the active segment's DOM element. Handle `onSeek` by calling `videoRef.current.seekTo(ms)`. Render the panel header with LanguageBadge, total segment count, and a search icon placeholder (wired to F07 in Phase 5). Render status-based states: processing message for `Queued`/`Processing`, failure message with Retry button for `Failed`, full segment list for `Ready`.

---

### Phase 5: Status Polling and F07 Integration Hook

**12. Status Polling in Panel** — Add a `setInterval` at 10 s inside TranscriptionPanel that fires only when `videoStatus` is `Queued` or `Processing`. On each tick, call `GET /api/videos/[id]/status` (the F03 endpoint). When the response shows status `Ready`, clear the polling interval, fetch `GET /api/videos/[id]/transcription` to load the segments, and update local state so the panel transitions from the processing message to the segment list without a page reload.

**13. seekTo Interface Wiring** — Ensure the `videoRef` forwarding chain from `app/video/[id]/page.tsx` down through `TranscriptionPanel` to each `TranscriptionSegment`'s click handler is complete and type-safe. The ref should be a `React.RefObject` typed to the VideoPlayer imperative handle shape `{ seekTo: (ms: number) => void }`. Verify the wiring by clicking a segment in the panel and confirming `videoElement.currentTime` updates correctly.

---

### Phase 6: Testing

**14. API Route Integration Tests** — Write integration tests for all four new API routes against a real test database following the pattern used in F03. Cover: happy path with valid owned video, 404 for wrong-user and missing video, 401 for unauthenticated requests, 206 partial content and 416 invalid range for the stream route, and `Content-Disposition: attachment` header for the download route. Verify BigInt-to-Number serialization in the download `Content-Length` header.

**15. Component Unit Tests** — Write jsdom unit tests for `TranscriptionPanel` covering the active-segment highlight logic, the click-to-seek callback, the processing and failed state rendering, and the Retry button interaction. Write unit tests for `VideoPlayer` covering `seekTo(ms)` setting `currentTime`, speed selection changing `playbackRate`, and the presence of all six speed options.

**16. E2E Tests** — Write Playwright E2E tests in `tests/e2e/video-player.spec.ts` covering the full user journey: page loads within 3 seconds, all six speeds selectable and effective, segment click seeks video within 500 ms, active segment highlights and scrolls during playback, download button initiates a download, processing message shown for Queued status, Retry button shown for Failed status, and language badge matches the detected language.
