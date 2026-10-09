# DB10-B1 — Bug tracker relational + lifecycle parity handoff

**Date:** 2026-10-10 · **Owner:** db10-shared-operations-2026 · **Claim:** issue #12  
**Legacy oracle:** 42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5 · **Frontend oracle:** 42Students/lms2-fe@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2  
**State:** SOURCE-REVIEWED AND CODE-STAGED; **NOT integrated/migrated/verified**. No GitHub Actions green run or disposable PostgreSQL replay evidence.

## Concrete deliverables on this branch

- src/modules/bug-tracker/workflow.ts: pure state transition and expected-version logic for issue workflow and retests; emits actor-attributed audit intent, not a DB write.
- src/modules/bug-tracker/access-and-attachments.ts: deny-by-default issue access and screenshot upload/confirmation rules. Requires server-verified active access token identity, not client form fields.
- src/db/schema/db10-bug-tracker.draft.ts: five isolated Drizzle table declarations, deliberately **NOT imported by shared schema/index.ts**, and no Drizzle journal or SQL migrations. Must not be treated as an actual database table.
- tests/unit/bug-tracker-workflow.test.ts and tests/unit/bug-tracker-access-and-attachments.test.ts: authored adversarial tests. **Not executed**, so no assertion of passing runtime tests.
- tests/db-parity-db10-bugtracker.test.mjs: source-coverage and draft-schema guard. Execute explicitly with node --test.
- docs/planning/database-parity-db10-field-ledger.json: 58 source-review annotations from BugReport, access/session, history and attachment migrations/models. All 58 remain UNMAPPED and none is WORKFLOW_VERIFIED. Global DB10 total remains 221 candidate fields / zero verified.

## Legacy behavior reproduced in pure model

- Statuses exactly NEW, CHECKING, FIXING, READY_FOR_RETEST, CLOSED.
- Resolutions: FIXED, DUPLICATE, NOT_A_BUG, CANNOT_REPRODUCE, WONT_FIX.
- A nonblank resolution on a workflow update forces CLOSED; reopening/nonterminal state clears old resolution. READY_FOR_RETEST clears past retest state/time.
- A retest is permitted only from READY_FOR_RETEST: PASS -> CLOSED/FIXED and timestamp; FAIL -> FIXING, clears resolution and productionVerified.
- Regression test statuses: NOT_REVIEWED, NOT_REQUIRED, PLANNED, ADDED. Affected layers: FRONTEND, BACKEND, BOTH, UNKNOWN.
- Legacy permits nonsequential status jumps and CLOSED with no resolution. Do not strengthen these rules silently until explicit parity-exception approval.
- Workflow and retest updates must be Super Admin authorized. Local model checks actor role/activity, yet **server identity resolution has not been wired**; never trust a client-supplied actor object.

## Intentional safety deviations and risks

1. Legacy PublicBugTrackerController exposed issue lists/details/activity and attachment operations under a JWT-exempt path. It also returned engineering root-cause/fix notes in its response. vNext public unauthenticated access MUST NOT expose this data. The staged policy is owner-reporter or Super Admin, with credentials checked server-side.
2. Legacy tracker access was seeded with fixed SHA-256 token hashes in V151; do **not** import seeded identities/tokens. New credentials are generated only via vNext enrollment and stored hashed. Hashes must not appear in logs/UI.
3. Legacy SuperAdminBugTrackerController correctly moved status/workflow/retest mutation off the public bypass path. Keep this access control even if the tracker has its own guest reporter session.
4. Legacy attachments use R2 and return public URLs. vNext must use private managed object storage and short-lived authorized download URLs; GCP storage is preferable under the project architecture. Never expose raw storage keys or unsigned public links.
5. Legacy BugReportActivity on delete cascades; vNext staging specifies RESTRICT for history preservation. This is a retention redesign, not proven parity, and immutable-event enforcement is still required in service/DB privileges.
6. Legacy report uses a numeric auto-increment ID and a public ID like LMS-0001. New UUID IDs require independent public-reference allocation and uniqueness, not an assumed sequential UUID number.
7. **Concurrency is incomplete until DB integration:** a pure expected-version check is not a transaction. Update must use conditional version compare-and-swap and append history in the same transaction; report lock/advisory lock must serialize screenshot capacity enforcement.
8. Staged screenshots enforce up to 3 files, 8 MiB, PNG/JPEG/WebP, safe display filename and issue-bound UUID storage key. Actual object metadata must be validated after upload; the pure helper cannot attest storage state or token ownership alone.
9. Reporter-session expiry, session hashing, access revoke, rate limits, anti-abuse controls, GCS object retention and management operations remain to be designed/tested against their legacy producer/consumer behavior.
10. DB10 is cross-account shared, but does not grant unrestricted cross-college disclosure; the draft has nullable collegeId to represent global versus college-specific bugs. Final scope contract still needs admin/owner UI verification.

## Source inventory: 58 reviewed fields, 5 proposed draft tables

| Legacy table | Source fields | Draft target | Stage |
|---|---:|---|---|
| bug_report | 31 | bug_reports | Source reviewed / proposal only |
| bug_report_activity | 8 | bug_report_activities | Source reviewed / proposal only |
| bug_report_attachment | 7 | bug_report_attachments | Source reviewed / proposal only |
| bug_tracker_access | 7 | bug_tracker_access | Source reviewed / proposal only |
| bug_tracker_session | 5 | bug_tracker_sessions | Source reviewed / proposal only |
| **Total** | **58** | **5** | **0 verified** |

Authoritative source migrations: V151, V152, V153, V154. Related Java: BugTrackerService, BugTrackerWorkflowService, BugTrackerAttachmentService, BugReport, BugReportActivity, BugReportAttachment, BugTrackerAccess, PublicBugTrackerController, SuperAdminBugTrackerController, BugTrackerRateLimitFilter. The no-login frontend surfaces must be re-reviewed before API parity sign-off.

## Required integration transaction (not implemented)

For workflow:
1. Resolve current server-side session and require Super Admin.
2. Begin transaction, fetch issue by publicId and enforce any scope.
3. Build state transition from expectedVersion and server actor, then update only where id and version both match. If zero rows, return conflict.
4. Append all returned audit events with actorUserId and DB-assigned timestamps inside the same transaction.
5. Commit, then return the persisted issue. Never acknowledge a fake success from a stale writer.

For screenshot confirmation:
1. Resolve reporter ownership or Super Admin from server-verified principal.
2. Verify the staged key belongs to the same issue and that stored GCS object size/type matches the request.
3. Lock the parent issue row; check existing key for idempotency before checking the 3-file count.
4. Insert metadata in a transaction or return the already-owned metadata. Do not delete a confirmed shared object on a losing concurrent attempt.
5. Generate download URL only after the current user authorization check.

For data permissions:
- Anonymous user: no issue list/detail, notes, attachment metadata or screenshot download.
- Active reporter: only own issue details with engineering-private fields redacted; may upload only to own issue.
- Active Super Admin: issue triage, fix/retest actions and private evidence.
- Disabled/revoked reporter: no reads or writes. MANAGER semantics require explicit authorization decision from legacy UX (not treated as Super Admin).

## Verification gates and next steps

- [x] Inspect legacy DDL V151–V154 and main bug workflow/service/controllers.
- [x] Record 58 source-reviewed fields; retain UNMAPPED status.
- [x] Stage pure workflow + screenshot access policies.
- [x] Stage source-derived Drizzle definitions without shared migration edits.
- [x] Author workflow, access, screenshot and source-coverage tests.
- [ ] Run tsc + lint + Vitest; repair compiler and test failures.
- [ ] Review exact FE standalone Bug Tracker forms, filters, modal actions, role and token UI.
- [ ] Agree on source-compatible state and intentional privacy deviations.
- [ ] Integrate DB10 schema only after database branch migration ownership is free; generate SQL and migration snapshot, then disposable Postgres replay.
- [ ] Implement transactional CRUD/API with real auth and tenant isolation; no exposed storage URLs.
- [ ] Test version conflict, concurrent screenshot capacity, session revocation, replay, attachment access and audit atomicity on real PostgreSQL.
- [ ] Recheck all legacy and vNext SHAs, then close individual 58 field records based on executed evidence.

No claims of DB10 database verification or production readiness until these gates pass.
