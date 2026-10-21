# U008 — AdminAssignmentPublishController gap audit v2

## File mapping and source closure
- `LC` = `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentPublishController.java`
- `LS` = `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AssignmentService.java`
- `LM` = `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/StudentAssignment.java`
- `LF` = `docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js`
- `LA` = `docs/legacy-source/frontend/src/api/Services/AdminAssignmentService.js`
- `NP` = `src/components/courses/college-assignment-review.tsx`
- `NR` = `src/app/api/courses/assignment-submissions/[submissionId]/publish/route.ts`
- `NS` = `src/modules/courses/assignment-submission-service.ts`
- `NV` = `src/modules/courses/assignment-validation.ts`
- `NB` = `src/db/schema/assessments.ts`

Scope: legacy college/admin whole-assignment publish-all controller + StudentAssignment/AssignmentService + Admin Assignment row/modal; vNext college per-Section bulk UI, scoped submissions route, transactional individual grade publish, optimistic version and in-app notification model. Alias `LC:63-83` means the full legacy controller path shown above with 1-based line range. User-visible UI facets refer to the legacy publish trigger and vNext bulk trigger, not all assessment pages.

## Mandatory F01–F23 comparison
| ID | Facet | Legacy behaviour (file:line) | vNext behaviour (file:line or NONE) | Verdict | Severity | Concrete fix | Effort |
|---|---|---|---|---|---|---|---|
| G2-2-008-001 | F01 | LC:41-46 admin assignment POST /{lessonContentId}/publish-grades | NP:29-70 UI loops submission POST path NR:17-44; no single bulk route | GAP | P1 | Add guarded server bulk publish endpoint or document batch client semantics. | S |
| G2-2-008-002 | F01 | LF:365-371 Publish grades button in each assignment table row | NP:91-94 button inside per-Section submissions disclosure | GAP | P2 | Surface publishing action from assignment row with same disabled rules. | S |
| G2-2-008-003 | F02 | LC:63-133 auth, query first 1000, loop, audit, response | NP:29-70 load all section pages and publish sequentially client-side | GAP | P1 | Keep server-side snapshot/retryable batch and audited summary semantics. | S |
| G2-2-008-004 | F03 | LF:365-371 Publish grades with Popconfirm title and description | NP:29-33 window.confirm and NP:91-94 Publish grades | GAP | P2 | Use ConfirmDialog and exact legacy wording. | S |
| G2-2-008-005 | F03 | LF:365-370 disabled when stats.totalGraded === 0 with tooltip Nothing graded yet | NP:91-94 disabled only bulkBusy | GAP | P2 | Disable when no grades and show the same tooltip. | S |
| G2-2-008-006 | F04 | LC:126-130 response published, skippedUngraded, alreadyPublished, failed[{studentAssignmentId,studentId,reason}] | NP:35-64 tracks only published,failedIds,failed count; no ungraded/alreadyPublished breakdown | GAP | P2 | Track and display all four distinct counters and per-row reason. | S |
| G2-2-008-007 | F04 | LC:110-115 response exposes failed student IDs/reasons only after authorize all | NP:56-58 failed row IDs collected but no reason | GAP | P2 | Return accessible failure details without exposing learner IDs across tenants. | S |
| G2-2-008-008 | F05 | LC:85-87 first page 1000 by created_at DESC | NP:41-46 paginates every Section's submissions, page order by repository | GAP | P2 | Specify stable batch snapshot and deterministic sort; avoid skips on live concurrent changes. | S |
| G2-2-008-009 | F05 | LC:48-49 hard cap 1000, oversized cohorts truncated | NP:40-46 reads all page counts without fixed cap | EXTRA | P2 | Retain safe bounded pagination or guarded server job for large rosters. | S |
| G2-2-008-010 | F06 | LC:70-72 path ID must positive integer | NR:31-37 submission UUID, NV:169-172 integer version | GAP | P2 | Validate assignment identity UUID and exact college scope at bulk boundary. | S |
| G2-2-008-011 | F06 | LC:94-102 skip already published first then ungraded | NP:48-49 skips ungraded or published; same effect, counters absent | GAP | P3 | Preserve skip classification and counts, not just effect. | S |
| G2-2-008-012 | F07 | LC:71 'lessonContentId must be a positive integer' | NR:31-37 UUID route and Zod errors | GAP | P3 | Map invalid path to stable validation error, document identifier migration. | S |
| G2-2-008-013 | F07 | LC:75-76 401 'Authentication required' | NR:29-42 context/API error wrapper | GAP | P2 | Confirm unauthenticated response and preserve 401 semantics. | S |
| G2-2-008-014 | F07 | LC:83 upfront ensureCanViewOrGradeAssignment prevents ID leakage | NP:38-45 GET section submissions and NR:33-38 per-submission publish | GAP | P1 | Authorize selected assignment + section before listing/fetching any learner IDs. | S |
| G2-2-008-015 | F08 | LC:131-132 'Published N grade(s)' JSON message | NP:63-64 'N grade(s) published' inline status | GAP | P3 | Restore result copy and details. | S |
| G2-2-008-016 | F08 | LF:302-313 summary 'N published · X not yet marked · Y already published' | NP:63-64 only N published, failed | GAP | P2 | Display skipped/not graded/already published counts. | S |
| G2-2-008-017 | F08 | LF:305-309 Modal.warning shows one row per failure Student #id reason | NP:62-69 inline generic failures and retry only | GAP | P2 | Provide sanitized failure list with meaningful retry guidance. | S |
| G2-2-008-018 | F09 | LF:365-371 Popconfirm; LF:305-309 failed modal | NP:30-33 native window.confirm; NP:96-101 inline Alert | GAP | P2 | Use shared accessible dialog and reviewable failure table. | S |
| G2-2-008-019 | F10 | LC:32-35 deliberate independent commit per grade | NP:51-59 independent POST each; NS:844-897 per submission transaction | MATCH | P3 | Keep independent persistence. | S |
| G2-2-008-020 | F10 | LC:103-107 delegates to normal publishGrade for access,audit,notification | NR:33-38 invokes NS:804-897 same audited single row path | MATCH | P3 | No change per-submission. | S |
| G2-2-008-021 | F10 | LC:118-124 summary AdminAuditLogService event once when published>0 | NS:866-881 individual activity events only; NP:29-70 no batch summary log | MISSING | P1 | Record one batch-level audit event with counts & actor after publish processing. | S |
| G2-2-008-022 | F10 | LC:85-86 server loads first 1000 once, predictable snapshot | NP:41-61 client fetches pages and issues network requests per grade | GAP | P2 | Design resumable bounded bulk path robust to tab closes and network disconnections. | S |
| G2-2-008-023 | F11 | LC:73-83 authenticated principal and whole-assignment authorizer before repository query | NS:818-825 per-submission scope; NP:38-45 GET scoped Section list | GAP | P1 | Add first-class whole-assignment bulk permission guard. | S |
| G2-2-008-024 | F11 | LC:45 CORS explicit localhost/42lms domains, cookies | NR:21-26 same-origin mutation guard | EXTRA | P3 | Retain stronger origin checks; document cross-origin client contract. | S |
| G2-2-008-025 | F12 | LC:94-115 skip ungraded/already published but do not count those as errors | NP:47-59 skips them; counts only failed published attempts | GAP | P3 | Surface skip counts explicitly in output. | S |
| G2-2-008-026 | F12 | LC:32-35 publish success persists independently, per-row failure doesn't abort loop | NP:50-58 inner try/catch allows rest; NS:844-897 per grade transaction | MATCH | P3 | No change. | S |
| G2-2-008-027 | F12 | LC:106 publishGrade accepts publishedBy principal ID or 0 | NS:823-825 request context identity, NS:845 persisted faculty grader | EXTRA | P3 | Retain no spoofing, no fake admin user ID. | S |
| G2-2-008-028 | F13 | LC:108-115 failures returned with reason; no abort | NP:50-64 count only and retry; NP:66-69 whole-page errors can retain partial count | GAP | P2 | Track failed reason/status and partial completion across navigations. | S |
| G2-2-008-029 | F13 | LC:75-76 unauthorized 401 before DB | NR:21-42 origin rejection and context | MATCH | P3 | Preserve authentication and deny before any learner enumeration. | S |
| G2-2-008-030 | F13 | LF:365-371 disables when no graded records | NP:91-94 action available whenever PUBLISHED, even zero grade rows | GAP | P2 | Disable or show no-op informative state instead of confusing '0 published'. | S |
| G2-2-008-031 | F14 | LC:63-133 no export/upload/import/attachments | NP:29-70 no export/upload/import in bulk action | MATCH | P3 | N/A. | S |
| G2-2-008-032 | F15 | LC:103-107 normal publishGrade triggers per-row notification unchanged | NS:882-895 inserts per-user in-app notification in committed grade transaction | MATCH | P3 | Keep notification after success only. | S |
| G2-2-008-033 | F15 | LC:118-124 optional AdminAuditLogService summary action | NS:866-881 individual activity events; no summary | GAP | P2 | Emit summary audit while retaining individual trail. | S |
| G2-2-008-034 | F16 | LC:41-139 backend only; LF:365-371 compact button/popconfirm | NP:87-101 responsive buttons + alerts | GAP | P3 | Use equivalent touch affordances and accessible confirmation on mobile. | S |
| G2-2-008-035 | F17 | LF:365-371 Popconfirm keyboard focus/Cancel | NP:30-33 window.confirm blocks UI, native focus dependent | GAP | P2 | Use UI-managed dialog with accessible focus return and descriptive button. | S |
| G2-2-008-036 | F18 | LF:365-370 tooltip 'Nothing graded yet', 'Publish all graded submissions?' | NP:31-32 'Publish grades for every graded submission in this Section?' | GAP | P3 | Restore exact wording and explain Section-only scope. | S |
| G2-2-008-037 | F19 | LC:48-49 <=1000 records via single PageRequest; no unbounded processing | NP:40-61 any number of pages and per-grade calls | GAP | P1 | Bound calls by max records/work budget, provide progress + resumable cursor. | S |
| G2-2-008-038 | F19 | LC:32-35 one HTTP invocation, server loops; constant 1 browser request | NP:41-58 1 page GET per page plus N publish POSTs | GAP | P2 | Shift bulk work server-side or bounded chunk endpoint to avoid high latency/timeouts. | S |
| G2-2-008-039 | F20 | LC:85-87 descending createdAt, loaded once; concurrent new submission not in current snapshot | NP:41-61 fresh pages may reorder under concurrent grading changes | UNKNOWN | P2 | Test concurrent insert/grade while publishing; define cursor stability. | S |
| G2-2-008-040 | F20 | LC:95-107 idempotent skip gradePublished, independent commits | NS:835-842 expects version, returns current for already published if fresh token | GAP | P2 | On retry refresh versions from server, avoid treating stale token as permanent failure. | S |
| G2-2-008-041 | F21 | LC:103-107 AssignmentService service + StudentAssignmentRepository | NS:804-897 Drizzle plus inAppNotifications + recordActivityEvent | MATCH | P3 | Keep provider-agnostic grading. | S |
| G2-2-008-042 | F21 | LC:118-124 AdminAuditLogService audit integration optional | NP:29-70 client aggregator; NS:866-881 only per-row audit | MISSING | P1 | Add audit batch summary integration with original count keys. | S |
| G2-2-008-043 | F22 | LM:50-58 graded,version, LM:80-82 gradePublished boolean | NB:167-190 pointsAwarded,gradingStatus,gradePublished,version fields | MATCH | P3 | Maintain atomic version/visibility constraints. | S |
| G2-2-008-044 | F22 | LC:111-114 failure payload has studentAssignmentId,studentId,reason | NB:140-155 membershipId rather than stored studentId, private identity | GAP | P2 | Use scoped recipient label in failure diagnostics, never leak raw IDs to unauthorized users. | S |
| G2-2-008-045 | F23 | LC:63-133 dedicated atomic caller contract for all assignment grades | NP:29-70 Section-only client orchestrator; no bulk server API | GAP | P1 | Preserve whole-assignment scope or explicitly approve Section-by-Section segmentation. | S |
| G2-2-008-046 | F23 | LC:85-87 ignores >1000 beyond first page | NP:40-61 traverses all Section pages | EXTRA | P3 | Keep bounded comprehensive coverage with guard, not legacy truncation bug. | S |

## Unit summary
- Rows 46. Verdicts GAP 31; EXTRA 4; MATCH 8; MISSING 2; UNKNOWN 1; severity P1 8; P2 21; P3 17.
- **Top 1 (P1):** Bulk publish moved from secure, audited whole-assignment server command to client orchestration of per-Section publishes. Whole-scope authorization, batch auditing and stable coverage need explicit design (F01/F02/F10/F11/F21/F23).
- **Top 2 (P1):** Client loops unbounded pages and issues N writes; closed tab/network errors risk incomplete results and more load (F19/F20).
- **Top 3 (P2):** Legacy summary records skippedUngraded, alreadyPublished, published and failure reason/student; vNext counts only successes/failures and shows generic notices (F04/F08/F13).

**UNKNOWN/live:** Concurrent inserts can change page ordering; inspect paging query and simulate page churn. Confirm per-grade recipient notifications and audit events commit only after permission/CAS checks; do not assume SMTP/SMS delivery because this service inserts in-app notices only.
