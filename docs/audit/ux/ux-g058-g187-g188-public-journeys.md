# UX-G058, UX-G187 and UX-G188 — public route recovery (2026-11-07)

Canonical status: `docs/tracker.json#uxReview.groups`. Claimed by `chat-ux-external-jobs-global-states-2026-11-07`; maintain DOING until exact-SHA accepted.

## G058 — public external employer job details
- `/jobs/external/[slug]` retains `readPublicExternalJob`, `runAsSystem` and the existing permission-safe `notFound` fallback. The job service validates an exact bearer slug, current published job, tenant and organization state, active employer, unrevoked link and strictly HTTPS destination.
- The new route-local `PublicExternalJobDetails` adds a responsive role summary, accessible description heading, visible work mode, explicit external application disclaimer, a 44px minimum employer action and `target="_blank" rel="noopener noreferrer"` so applicants do not lose the LMS context. It does **not** invent submission tracking.
- Route-local loading and error recovery were added; no auth/provider/DB/schema/service behavior changed.
- Browser acceptance uses a development-only synthetic job fixture for layout/new tab and the real invalid bearer route for denial. It does not synthesize valid authorization or bypass a production database.

## G187 — global loading
- Root `src/app/loading.tsx` no longer falsely assumes loading means sign-in. Role-neutral announcement: `Loading 42 LMS...`.
- Existing `PublicPageLoading` delegates 12-second timeout to `GracefulPageLoading`, with an accessible delayed Try again. The UI fixture renders this unchanged boundary in development only; browser asserts the actual delay rather than racing React hydration.
- `/login/loading.tsx` stays sign-in-specific.

## G188 — not found
- Keep noindex, the 404 legacy presentation and the first authorized sidebar destination for signed-in accounts.
- Offer a second `/login` recovery to genuinely anonymous visitors, even when the generic dashboard is present in the unselected-role navigation. No guessed Learner role, external redirect, or protected data.
- Browser uses an actual malformed external-job slug and checks branded denial, safe navigation and no employer data. Next's development streaming can render a 404 UI with an HTTP 200 response; this UX run does not assert HTTP production semantics.

## Verification contract
- Exact-SHA workflow: `.github/workflows/ux-public-jobs-fallback-acceptance.yml`.
- Tests: `tests/unit/ux-public-job-and-fallback-groups.test.tsx`, existing `security-public-external-job-page-boundary.test.ts`, `public-error-pages.test.ts`, `chat16-public-platform-error-loading-pages-16.test.tsx`; 390/1280 Chromium suite `tests/e2e/ux-public-jobs-fallback.spec.ts`.
- Acceptance requires scoped ESLint, full TypeScript, all focused unit/security cases and **6/6 Chromium cases without unexpected, flaky or skipped tests**, plus attached viewport screenshots.
- A preliminary CI run returned green despite browser failures; current workflow reads Playwright's machine JSON stats and exits nonzero if any browser case fails, preventing that false closure.
- Production authorization, independent security/security-control closure, external employer submission, release parity, full 404 HTTP semantics and actual provider integration remain separate gates.
