# HR, Recruiter and Tracker defects — chat-15

Scope: `chatgpt/chat-15-b`. Findings are source-reviewed; **test execution is pending** (this connected GitHub session has no executable checkout, disposable PostgreSQL or browser). No row below is a claim of release certification. Each ID is a dedicated audit gap.

| ID | Severity | Evidence and user impact | Fix commit(s) | Behavioural regression |
|---|---|---|---|---|
| HR-ROUND-STALENESS-01 | S2 | `editHrJobRound` compared `target.updatedAt.toISOString()` with the raw `expectedUpdatedAt`. The Zod schema expressly accepts timezone offsets, so `2026-10-18T15:30:00.123+05:30` and `2026-10-18T10:00:00.123Z` represented the same version but returned `PLACEMENT_ROUND_STALE`. | `37553d77`, `809be2b7`, `f6d9de6e` | `tests/unit/HR-BREAK-chat15-round-versions-02.test.ts`: same instant with three offsets passes, 1ms stale/missing/invalid tokens fail |
| HR-ROUND-CAS-02 | S1 | `editHrJobRound` compared `placement_job_rounds.updated_at` with JavaScript Date using exact SQL `eq`. PostgreSQL `clock_timestamp()` stores microseconds but JS `Date` only milliseconds; updates could report stale even with a current token. Maintain row lock and compare timestamps at milliseconds without discarding CAS. | `47298976` | Model-version unit matrix; real PostgreSQL edit/update/remove concurrent integration test **OPEN** |
| HR-REQUEST-CAS-01 | S1 | `updateOwnRecruiterDriveRequest` used `updatedAt:new Date()`. Two writes in the same millisecond could return the same optimistic version, allowing an older tab's token to be reused after a successful edit. Fix uses `greatest(clock_timestamp(), updated_at + interval '1 millisecond')` in transaction. | `9bcf8a67` | `tests/integration/recruiter-drive-requests-0101.test.ts` now requires strictly advanced timestamps on edit and resubmit (`45389989`); parallel-session test **OPEN** |
| HR-ROUND-ROLE-01 | S2 | Pure `canRecruiterEditRound` accepted `createdByUserId === recruiterUserId === ""`, making the eligibility predicate true without any actor identity when the round was pending/unused. Real DB columns are non-null UUIDs, but client/view-model logic must still fail closed. | `f6d9de6e` | `tests/unit/HR-BREAK-chat15-round-versions-02.test.ts`: empty/whitespace actor IDs, wrong creator, nonpending, results/slots |
| UX-tracker-mine-publicId-02 | S1 | `/tracker/mine/[publicId]` caught *all* `getMyTrackerReport` rejections and treated them as `notFound()`. A DB timeout therefore became a misleading 404 with no retry, despite the record possibly existing. Only `TrackerAdminError("ISSUE_NOT_FOUND")` now maps to 404; operational exceptions propagate to a retryable error boundary. | `4bfd1daa`, `a90202e7` | `tests/unit/HR-BREAK-tracker-detail-chat15-02.test.ts` (`9051a252`): disabled actor, invalid public ID, not found, timeout, disabled runtime and valid owned context |
| UX-tracker-admin-detail-01 | S3 | Tracker detail's temporarily-unavailable UI exposed `DB10_TRACKER_READY=DB10_VERIFIED` and migration 0076 rather than actionable nontechnical copy. Replaced with safe user copy. | `aacc6dd8` | Source review done; page rendering/a11y test **OPEN** |

## Unresolved release checks

1. **Do not merge or certify solely from this defect register.** The branch still needs strict typecheck, Vitest (including new tests), full PostgreSQL role/tenancy and concurrency integration, event/notification rollback verification, and phone/keyboard recovery checks.
2. Exhaustive HR/Recruiter exported-function + route ledger closure is still open in `docs/audit/coverage/hr-ledger.md`. Current ledger is a high-risk slice, not full module acceptance.
3. Validate TPO, HR and recruiter roles on project data for IIT Dharwad: unauthorized tenant data, revoked membership, stale tabs, duplicate actions, expired sessions.


## 2026-10-18 chat-15 follow-up (source fixes; not run)

| Defect ID | Severity | Defect and change | Branch commit | Acceptance evidence |
|---|---|---|---|---|
| HR-SLOT-ACTOR-01 | S2 | `canRecruiterMutateOwnSlot(" "," ")` previously returned true, even though neither actor identity was meaningful. The ownership predicate now rejects whitespace-only actors before comparing identity strings. | `bf7227245751de3009256069fec54349c17840b3` | `tests/unit/hr-interview-slot-model.test.ts` tests correct owner, empty, whitespace, and mismatched creator; authored not run. |
| HR-ROUND-INPUT-01 / HR-ROUND-CREATE-01 / HR-ROUND-REMOVE-01 | Regression expansion | Exercises invalid body rejection prior to SQL, duplicate/cap protection, correct create/remove receipts, single audit insertion and TPO notification and forbidden edit after slots/results. No production regression observed from source review. | `8362c16b26f262aa3d6fca4904697539bee115d4` | `tests/unit/HR-BREAK-chat15-round-service-03.test.ts` expanded mocked service matrix; PostgreSQL races and rollback remain open. |
