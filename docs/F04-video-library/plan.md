# Implementation Plan: F04. Video Library

**Prerequisites:**
- F03 Background Processing complete — `Video` table has `status`, `durationSeconds`, `thumbnailPath`, `isArchived`, `processingError`, and `retryCount` columns; `GET /api/videos/[id]/status` endpoint is live
- `storage/thumbnails/` directory exists (created in F03)
- Node.js 20, TypeScript, Next.js App Router, Prisma 7 — all configured from F01–F03
- No new npm packages required; Tailwind CSS, react-hook-form, and Zod already installed

---

### Phase 1: API Foundation

**1. Video List Endpoint** — Create `app/api/videos/route.ts` with a `GET` handler that authenticates with `auth()`, parses and validates query parameters using a new Zod schema in `app/lib/validations/library.ts`, builds a Prisma `where` clause for the authenticated user with optional filters (status, archived, date range), and returns a paginated response of 20 videos per page ordered by `uploadedAt DESC` then `title ASC`. Serialize `fileSizeBytes` from BigInt to Number, and include stub `categories` and `tags` empty arrays per the spec's forward-compatibility contract.

**2. Thumbnail Serving Endpoint** — Create `app/api/videos/[id]/thumbnail/route.ts` with a `GET` handler that authenticates, resolves `id` via `await params` following the Next.js 16 convention, looks up the video by `id + userId`, checks that `thumbnailPath` is non-null and the file exists on disk, then streams the JPEG binary with `Content-Type: image/jpeg`. Return error codes `LIB002` and `LIB003` per the spec.

---

### Phase 2: Polling Hook and Shared Utilities

**3. Status Polling Hook** — Create `app/hooks/use-status-polling.ts`. The hook accepts a list of video objects and a state-update callback. It runs a `setInterval` at 10 s, calls `GET /api/videos/[id]/status` only for videos currently in `Queued` or `Processing` state, and merges updated status fields into local state via the callback. The interval is cleared in a `useEffect` cleanup to prevent memory leaks on unmount, consistent with the polling pattern described in the F03 spec.

---

### Phase 3: UI Components

**4. VideoCard Component** — Create `app/components/library/video-card.tsx`. The card displays a thumbnail image (via `<img>` pointing at the thumbnail endpoint), a 2-line-clamped title, a formatted duration badge (HH:MM:SS), up to 2 category chips (empty in F04), and a color-coded status badge. The component accepts a video prop with the shape returned by `GET /api/videos` and integrates with the polling hook to update its status badge in-place when the status changes.

**5. VideoRow Component** — Create `app/components/library/video-row.tsx`. The row layout displays a small thumbnail, the video title, formatted duration, up to 3 category chips, up to 3 tag chips (all empty in F04), the status badge, and the formatted `uploadedAt` date. It accepts the same video prop shape as VideoCard and integrates with the same polling hook pattern for in-flight status updates.

**6. Filter Drawer Component** — Create `app/components/library/filter-drawer.tsx`. The drawer opens as a right-side panel triggered by a toolbar button. It contains a status single-select (Queued / Processing / Ready / Failed / all), an upload date range with start and end date pickers, a "Show archived" toggle, and category/tag multi-selects (rendered but empty in F04 — to be populated by F05). An "Apply" button propagates the filter values to the parent via callback; a "Clear all" button resets all fields within the drawer.

**7. Active Filter Chips and Empty State** — Create `app/components/library/active-filter-chips.tsx` and `app/components/library/empty-state.tsx`. The chips bar reads current URL search params and renders one removable chip per active filter; the "Clear all" link resets all params at once. The empty-state component accepts a `variant` prop and renders either the no-videos message (with upload CTA) or the no-results message (with "Clear filters" link) as described in the spec.

---

### Phase 4: Library Page Assembly

**8. LibraryClient Component** — Create `app/components/library/library-client.tsx` as the top-level Client Component. It manages the view-mode toggle (grid vs. list) in local state, reads and writes URL search params for filters and pagination, renders the toolbar (Upload button, view-mode toggle icons, filter drawer trigger, sort label), the `ActiveFilterChips` bar, the `FilterDrawer`, the grid or list of video cards/rows, and the pagination controls. It calls `GET /api/videos` on filter or page changes and passes results to the appropriate display components. It also initializes the `useStatusPolling` hook with any in-flight video IDs from the current page.

**9. Library Page RSC** — Replace the placeholder `app/library/page.tsx` with an RSC that calls `auth()` for the session and fetches the first page of videos server-side (default sort, no filters, `showArchived=false`), then passes the initial data as props to `LibraryClient` to avoid a loading flash on first render. Unauthenticated access is handled by the existing middleware.

---

### Phase 5: Testing

**10. API Integration Tests** — Write `app/api/videos/__tests__/route.test.ts` and `app/api/videos/[id]/thumbnail/__tests__/route.test.ts` using Vitest with a real test database. Cover all scenarios listed in the spec: pagination, status filter, date range filter, archived toggle, BigInt serialization, ownership isolation, unauthenticated access, and thumbnail serve/not-found paths.

**11. Hook Unit Tests** — Write `app/hooks/__tests__/use-status-polling.test.ts` using Vitest with mocked `fetch`. Verify polling interval, state update callback, terminal-status skip, and cleanup on unmount.

**12. E2E Tests** — Write `tests/e2e/library.spec.ts` using Playwright. Seed test data via API calls in `beforeEach`, then exercise the full library UI: grid/list toggle, filter drawer apply, chip removal, "Clear all", archived toggle, and both empty-state variants. Run against the dev server on `APP_PORT` with migrations applied to the session database.
