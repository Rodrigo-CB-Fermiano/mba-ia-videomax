# Implementation Plan: F01 — Authentication System

**Prerequisites:**
- Node.js 20+ and pnpm installed
- Docker Desktop running (for PostgreSQL container)
- Google OAuth credentials: Client ID + Secret (from Google Cloud Console, callback URL: `http://localhost:3000/api/auth/callback/google`)
- GitHub OAuth credentials: Client ID + Secret (from GitHub Developer Settings, callback URL: `http://localhost:3000/api/auth/callback/github`)
- Resend account with API key (free tier is sufficient for development)
- Environment variables required in `.env.local`:
  - `DATABASE_URL` — PostgreSQL connection string
  - `NEXTAUTH_SECRET` — random 32-byte secret for JWT signing (`openssl rand -base64 32`)
  - `AUTH_URL` — app base URL (e.g., `http://localhost:3000`)
  - `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`
  - `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`
  - `RESEND_API_KEY`

---

### Stage 1: Project Foundation

**1. Project Initialization** — Bootstrap a new Next.js 15 project with TypeScript using `create-next-app` with the App Router. Install all required dependencies: `next-auth@beta` (Auth.js v5), `@prisma/client`, `prisma`, `bcryptjs`, `@types/bcryptjs`, `resend`, `@react-email/components`, `react-email`, `zod`, `react-hook-form`, `@hookform/resolvers`. Create `.env.local` from a committed `.env.example` template listing every required variable. Set up Docker Compose with a PostgreSQL 16 service on port 5432 for local development.

**2. Database Setup** — Initialize Prisma (`prisma init`) and configure `DATABASE_URL` to point to the local Docker container. Write the Prisma schema defining the `User`, `Account`, and `PasswordResetToken` models exactly as specified in the spec's data model, including all custom columns (`password_hash`, `failed_login_attempts`, `locked_until`) and the Prisma adapter field naming conventions required by Auth.js v5. Run the initial migration to create all tables, indexes, and constraints in the database.

---

### Stage 2: Auth.js Configuration

**3. Prisma Client Singleton** — Create `src/lib/db.ts` exporting a single cached `PrismaClient` instance using the Next.js global caching pattern to prevent connection pool exhaustion during development hot-reload. This module is the sole entry point for database access throughout the application.

**4. Auth.js Core Configuration** — Create `src/lib/auth.config.ts` with the edge-compatible configuration: `pages` (pointing sign-in to `/login`) and the `authorized` callback that reads the session token to determine whether a request should be allowed through. Create `src/lib/auth.ts` with the full Node.js configuration: Prisma adapter wired to the `db` singleton, Google and GitHub providers using the environment-variable credentials, and a custom credentials provider implementing the lockout logic — querying `users` by email, checking `locked_until`, verifying the bcrypt hash, incrementing `failed_login_attempts` on failure (setting `locked_until` when the count reaches 5), and resetting both fields on success. Include JWT and session callbacks to propagate `userId` into the session token. See the spec's API Contracts and Data Model sections for the exact lockout thresholds and field names.

**5. Route Protection Middleware** — Create `src/middleware.ts` importing `authConfig` from `auth.config.ts`. Configure the middleware matcher to run on all routes except `/login`, `/register`, `/reset-password`, and `/reset-password/[token]`, plus Next.js internals (`/_next/**`, `/favicon.ico`, etc.). Unauthenticated requests to any matched route must redirect to `/login`.

**6. Auth.js API Route** — Create `src/app/api/auth/[...nextauth]/route.ts` that re-exports the `{ GET, POST }` handlers from `auth.ts`. This single file enables all Auth.js-managed flows: OAuth authorization, OAuth callback, session retrieval (`/api/auth/session`), and sign-out.

---

### Stage 3: Custom API Endpoints

**7. Registration Endpoint** — Create `src/app/api/auth/register/route.ts` with a POST handler. Parse and validate the request body using `registerSchema` from `src/lib/validations/auth.ts`; return `AUTH001` on validation failure. Query `users` by email and return `AUTH002` (HTTP 409) if a record already exists. Hash the validated password with bcrypt at cost factor 12 and insert a new row into `users`. Return HTTP 201 on success. See the spec's API Contracts section for request/response shapes and error codes.

**8. Password Reset Request Endpoint** — Create `src/app/api/auth/reset-password/route.ts` with a POST handler. Validate the email with `resetPasswordSchema`; return `AUTH003` on invalid format. Look up the email in `users`. If found: delete any existing rows in `password_reset_tokens` for that email, generate a 32-byte random token via `crypto.randomBytes`, compute its SHA-256 hex hash, insert a `password_reset_tokens` row with `expires_at = now() + 1 hour`, and call `sendPasswordResetEmail` from `src/lib/email.ts`. Always return the same HTTP 200 response regardless of whether the email was found, to prevent user enumeration.

**9. Password Reset Confirm Endpoint** — Create `src/app/api/auth/reset-password/confirm/route.ts` with a POST handler. Validate the request with `newPasswordSchema`; return `AUTH006` on failure. Compute the SHA-256 hash of the incoming plain token and query `password_reset_tokens` by `token_hash`; return `AUTH004` if not found. Check `expires_at > now()`; return `AUTH005` if expired. Hash the new password with bcrypt, update `password_hash` on the matching `users` row, and delete the `password_reset_tokens` row. Return HTTP 200. See the spec's API Contracts section for exact request/response shapes.

---

### Stage 4: Email

**10. Email Template and Client** — Create `src/emails/password-reset.tsx` as a React Email component rendering the reset email: user's name, the reset link (constructed from `AUTH_URL + /reset-password/<plain-token>`), and a clear 1-hour expiry notice. Create `src/lib/email.ts` with the Resend client (initialized from `RESEND_API_KEY`) and the `sendPasswordResetEmail(to, name, resetUrl)` function that renders the template and sends it. Wire this function into the reset request endpoint (Step 8).

---

### Stage 5: Frontend

**11. Root Layout and Auth Provider** — Create `src/app/layout.tsx` as the root layout wrapping all pages in a `SessionProvider` from Auth.js. Configure global styles, font variables (e.g., via `next/font`), and the HTML `lang` attribute. This layout is the only place `SessionProvider` is mounted; all child layouts inherit the session context.

**12. Login Page** — Create `src/app/(auth)/login/page.tsx` as a Server Component that redirects already-authenticated users to `/library`. Create `src/components/auth/login-form.tsx` as a Client Component with email and password fields managed by react-hook-form with the `loginSchema` resolver. The submit handler calls `signIn("credentials", { email, password, redirectTo: "/library" })`. Two additional buttons call `signIn("google")` and `signIn("github")` respectively. Display Auth.js error codes as user-facing messages per the spec's Error Handling section (wrong credentials → "Email or password is incorrect.", lockout → "Too many attempts. Try again in 15 minutes.").

**13. Registration Page** — Create `src/app/(auth)/register/page.tsx` and `src/components/auth/register-form.tsx`. The form collects name, email, and password, and submits to `POST /api/auth/register`. On success (201), redirect to `/login` with a query param that triggers a "Account created. You can now log in." banner. On 409, display "An account with this email already exists. Log in instead." inline. On 400, show field-level validation errors from the response.

**14. Password Reset Pages** — Create `src/app/(auth)/reset-password/page.tsx` with `src/components/auth/reset-password-form.tsx`: an email field that POSTs to `/api/auth/reset-password` and always displays the confirmation message ("If that email is registered, a reset link has been sent.") on any 200 response. Create `src/app/(auth)/reset-password/[token]/page.tsx` with `src/components/auth/new-password-form.tsx`: password and confirm-password fields that POST to `/api/auth/reset-password/confirm` with the URL token. On success, redirect to `/login` with a success banner. On `AUTH004`/`AUTH005`, display "This link has expired. Request a new password reset." with a link back to the reset request page.
