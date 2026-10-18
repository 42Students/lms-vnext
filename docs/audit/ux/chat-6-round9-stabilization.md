# Chat-6 round-9 unit stabilization and UX continuity

**Branch:** `chatgpt/chat-6-b`  
**Source baseline:** `74091c56f58150cf9bc2279ff781f730da7fee5c` (origin/main when this batch began)  
**Cloud report:** `docs/orchestrator/unit-failures-r9.md`, chat-6

## Before → after

1. **COL-placements-08** — `tests/unit/chat6-college-placements-read-parity.test.ts` still expected the deleted, duplicated `aria-label="Drives mobile cards"` element. The owner-approved UX migration uses the shared `DataTable`. The updated test checks its scoped caption, mobile primary/action priorities, expandable secondary details, lifecycle controls, and preserved desktop column names. No feature removed.
2. **COL-placements-25** — `tests/unit/chat6-college-placements-round3-ui.test.ts` similarly expected a separate drives-card subtree. The shared `DataTable` now presents the mobile cards from one accessible table DOM; the test retains the applicant selection/row action contracts and checks the shared responsive details.
3. **REC-home-drives-R05** — `tests/unit/chat6-final-sprint-rec-home-drives-r05.test.ts` tested whitespace-specific pre-Drawer shortcut source. It now checks N/P navigation guards and `router.push` against the live native Drawer handler, retaining Escape/focus return assertions unchanged.
4. **SA-academics-people-75** — `tests/unit/chat6-people-phone-session-and-mobile-round6.test.ts` expected an always-table `w-full border-collapse` string. It now asserts card/block phone layout, the `sm:table sm:border-collapse` desktop boundary, and horizontal scrolling only within the desktop table region. Create controls remain present.
5. **GR-09** — `src/components/tpo/tpo-company-memory-workspace.tsx` used `setError(result.error)` with a locally authored friendly error message, which matched the forbidden API error pattern. Renamed the local `LoadResult` field to `message` to distinguish it from a server error object; backend error codes are not rendered.
6. **GR-31** — `src/components/electives/college-elective-lifecycle-action.tsx` and `src/components/verification/SuperAdminVerificationPanel.tsx` now each use a synchronous `inFlightRef` to reject overlapping writes. Existing pending UI and failure recovery remain; refs are released in `finally`.

## Scope and verification

- No changes to `tests/unit/graceful-raw-error-scan.test.ts` or its allowlist; GR-09/GR-31 protections remain enabled.
- CI failure-log offender paths came from the unit-job log for CI run `39082623533`.
- Verified exact updated source patterns and branch ancestry remotely. Focused Vitest, typecheck, lint, browser and native WebView have **not** been executed by this lane.
- `/admin` middle-third slice (37 routes, from `/admin/inbound-mail` through `/admin/placements/seasons/[seasonId]`) was previously source-reviewed with 37 route notes and UX tests. No newly unreviewed routes were identified in that slice; full checklist sign-off still requires orchestrator test/browser acceptance.
