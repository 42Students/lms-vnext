# UX-G081 and UX-G082 — Recruiter drive route journeys

8 November 2026 · `42Students/lms-vnext` main. **The canonical group status and ownership live only in `docs/tracker.json#uxReview.groups`**; this page records scoped audit, fixes, tests and boundaries.

## UX-G081 — drive detail, change requests, interview slots, messages and rounds

Group includes 18 route files under `/recruiter/drives/[jobId]/...` (pages, loaders and errors). All six exported/route screens were reviewed. The job detail, interviews, discussion, rounds editor and removal pages delegate to existing protected HR pages; no duplicated backend logic or alternative authorization is introduced. `change-requests/page.tsx` obtains a signed-in request context, loads only authorized company change requests and recruiter placement workspace, and renders its own navigation.

Implementation `9dde7e70fcae4e32808a17bc86fbc96ad528c221`:
- Fixed a contextual navigation defect: **Discussion and messages** from a selected change-request page now opens `/recruiter/drives/{jobId}/messages`, not the global recruiter inbox. `recruiterDriveMessageHref` URL-encodes the jobId; the destination re-checks recruiter/college scope.
- All six nested route error fallbacks recover to canonical recruiter Today, instead of a second redirect through `/recruiter`. Error retry still resets the failed route and its current URL.
- Change-request and drive-detail loading screens now announce the actual destination; other loaders/exports were audited and left unchanged to avoid visual churn.
- Existing server-side not-found/authorization handling and full drive workflow are retained.

## UX-G082 — drive creation, proposals, outside drives, Today, messages and profile

Group includes 18 route files across six recruiter aliases with their loading/error states. Protected HR pages remain the only actual business workflow implementation. `/recruiter/home` forwards its selected college query to the existing HR Today page, without trusting query values to grant access.

Implementation `236fcf26282bf407b2b34cb9882d5988e5d6f972`:
- All six new/proposal/outside-drive/home/messages/profile error states now recover directly to canonical `/recruiter/home`, including the previous cross-account `/hr/home` profile fallback.
- Three previously generic loading skeletons now state the specific action: new drive request, proposals and outside-platform drive records.
- No changes to authenticated HR page exports, mutation handlers, permissions, selected-college validation or origin boundaries.

## Shared, independent acceptance

Workflow `.github/workflows/ux-g081-g082-recruiter-acceptance.yml` on SHA `236fcf26282bf407b2b34cb9882d5988e5d6f972`: <https://github.com/42Students/lms-vnext/actions/runs/42463920367>.

Unit `tests/unit/ux-g081-g082-recruiter-drive-journeys.test.tsx` renders all **12 actual route error boundaries** to verify canonical, non-sensitive recovery, all selected loading routes, and the drive-scoped discussion URL including punctuation encoding. Responsive Playwright `tests/e2e/ux-g081-g082-recruiter-drive-journeys.spec.ts` renders the actual error/loading components in a guarded synthetic fixture, tests retry, drive context, no exception leakage, and no horizontal overflow at 1280×800 / 390×844. Scoped ESLint and full TypeScript are required. Fixture `/e2e/ux-recruiter-drive-journeys` is available only in development plus explicit `E2E_AUTH_ENABLED=true`; no data access or backend mutation.

**Closure is independent:** both G081 and G082 require this exact-SHA run's successful lint, unit, browser, TypeScript and screenshot upload; the same suite supports two independently documented groups, not a merged tracker status.

## Security/regression boundary

Only recruiter UI route fallbacks, explicit transition copy and an encoded internal drive discussion link were modified. No authorization checks were removed or weakened; no DB, tenancy, role, grant, OAuth, file upload or signed-link policy changed. The fixture tests URL/UX behavior without impersonating a recruiter; live college-scope and role-denial regression remain a separate authenticated integration and release gate. Do not mark either DONE on a commit alone.
