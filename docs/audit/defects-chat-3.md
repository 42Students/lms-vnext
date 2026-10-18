# chat-3 defects — Faculty/Projects and courses (18 October 2026)

This is the independent chat-3 log. The hardening brief treats data integrity, access denial, and customer-safe errors as release blockers.

| ID | Severity | Area | Reproduction/evidence | Remediation | Regression coverage | Verification |
|---|---|---|---|---|---|---|
| FAC-GRADEBOOK-001 | S1 integrity | Faculty published gradebook | A persisted score collection contains an invalid first score for one assessment, followed by a valid published score for the same learner and assessment. `facultyPublishedGradeRows` skips invalid evidence and uses the valid score, but `facultyPublishedLearnerBreakdown` previously used `scores.find` before validity checking, so the learner detail displayed **Unknown** while the Section total counted that score. | Use the same predicate for Section totals and learner detail; select the first **valid** published score. Commit `e01284b2ea0659442b2ffdd3b1d9d5809f1776fd`. | `tests/unit/chat3-faculty-gradebook-integrity.test.ts` — invalid-first retry, duplicate retries, foreign memberships, total/detail parity. | Committed, **not executed** in this tool environment. |
| FAC-GRADEBOOK-002 | S2 resilience | Faculty published gradebook | With 101 published assessment rows the service threw an untyped `Error("GRADEBOOK_TOO_MANY_PUBLISHED_ASSESSMENTS")`. The page did not provide an actionable inline recovery; the CSV route treated the failure as an internal fault. | Typed domain error, safe shared message, and a keyboard-usable on-page recovery to the course; the 100-report read cap remains, so no unbounded N+1 queries. Commits `238b964cff07012578d84fec6b381aec28b7d978`, `7dbf8e580bc4173e0c92add70c85e4092d07c0fa`, `0db62160a4735f5bfb8254dea31c5bd78655b186`, `5b6ef30b5cd69a27930dcd800eed2c25a691aa48`. | `tests/unit/chat3-faculty-gradebook-service-journey.test.ts`, `tests/unit/chat3-faculty-gradebook-integrity.test.ts`, `tests/unit/UX-teacher-gradebook-limit-chat3.test.ts`. | Committed, **not executed** in this tool environment. |
| TPO-DRIVE-DEADLINE-003 | S2 draft loss | Drive create application deadline | The uncontrolled `datetime-local` `onChange` could auto-fill 23:59 IST but did not immediately mark a dirty form or save the updated deadline. Another tab/navigation could leave a stale browser backup. | Explicitly mark dirty and save the **current form snapshot** after the field changes. Commit `44ddfd83b3c7822a354efe49b0cb31ea5b38b2f0`. | `tests/unit/tpo-drives-chat-3-round4.test.ts` source assertions for update and retry path. | Committed; not executed; browser refresh and local-storage failure cases still required. |

| FAC-CSV-004 | S2 resilience / export integrity | Faculty report CSV | The CSV serializer accepted unbounded `score`, `submittedAt`, and `note` strings for up to 500 rows; untrusted persisted feedback could allocate excessively large export bodies. | Bound score to 120 chars, timestamp to 80 chars, and note to 10,000 chars in `facultyReportCsvSchema`, before materializing CSV. Commit `16f54d8fe3108cdc4f35c6053a8199eff0d553c3`. | `tests/unit/COURSES-BREAK-FACULTY-04.test.ts` (formula-neutralization, row limits, malicious lengths, IST rollover, no PII). | Commit pushed to `chatgpt/chat-3-b`; test execution unavailable in connector-only environment. |

| FAC-CSV-005 | S1 spreadsheet-injection risk | Faculty results and follow-up exports | Both aggregate CSV serializers used `/^\\s*[=+@-]/`, which misses zero-width U+200B and BOM U+FEFF before a spreadsheet formula. A malicious persisted assessment title could survive CSV quoting as a formula when imported by a spreadsheet. | Shared `neutralizeFacultyCsvCell` is now used after control-byte stripping in both exports; commits `116c5c061cab0c5acf745fa7a36e1beb8f6678f5` and `fbf067979485a27fed28d6ced6a211e665be7d9a`. | `tests/unit/COURSES-BREAK-FACULTY-04.test.ts` includes U+200B prefixed formulas in both serializers (commit `39b749d92b38cac2749b4df1b893102d83e3d192`). | Code and tests committed; execution remains unverified. |

| FAC-CSV-006 | S2 report integrity | Faculty results aggregate CSV | The results export accepted negative, fractional, NaN, or greater-than-eligible response counts, making report numbers inconsistent or unparsable even after spreadsheet escaping. | Reject unsafe counts before serialization, never fabricate totals. Commit `78bbe80dfc8fdf3f1a0ff69de74b256d136d0530`. | `tests/unit/COURSES-BREAK-FACULTY-04.test.ts` invalid-count matrix (`51ecd0dff3d3071941453587a243b9423393ca5e`). | Commit pushed; unexecuted until Vitest. |

| FAC-REPORT-007 | S1 cross-roster report privacy/integrity | Faculty Quiz and Assignment reports | Even though the caller is authorized for an exact teaching Section, a stale/foreign learner record returned by a report dependency entered `attempts`, `submissions`, histograms, question accuracy, and counts without intersecting the freshly authorized Section roster. A guessed/ended enrollment could appear in a report or make submitted count exceed eligible. | Intersect report evidence with the current verified Section roster before computing either report, including attempt history and question accuracy; `facultyReportCurrentRosterRows` in `faculty-assessment-report-service.ts`, commit `7af04d2b434500278ec63c32fdf69ca5397cc0e4`. | `tests/unit/COURSES-BREAK-FACULTY-06.test.ts` proves the foreign learner is absent from all report rows/counts and checks guessed delivery/ambiguous shared quiz (commit `2dd6cce142a00834482e625ee60dd6a3abde7635`). | Mocked boundary regression only; run integration tests on real PostgreSQL enrollment removal and CSV route before release. |

| PROJ-BODY-008 | S1 resilience / hostile payload | Faculty/Mentor task, meeting, sprint and final-delivery API routes | Six project mutation endpoints accepted arbitrary `request.json()` payloads with no streamed byte cap, exposing the Node route process to oversized, malformed UTF-8 and incorrect-media-type requests before domain-level Zod validation. | Add bounded 128 KiB strict UTF-8 JSON reader (`src/modules/projects/mentor-command-body.ts`) and apply to all six endpoints, returning actionable 400/413/415 without passing requests into services. Parser commit `814db473e11b584580343916b7cdc538dc01cb7b`; route updates `459cad2b`, `a1958002`, `7a50cf6e`, `94a51f67`, `47cdc720`, `4781f783`. | `tests/unit/PROJ-BREAK-FACULTY-05.test.ts` and expanded `PROJ-BREAK-FACULTY-04.test.ts` validate byte limits, content types, malformed streams, and zero service invocations. | Committed to lane; real CI and independent Projects review still required. |

| PROJ-MEETING-009 | S2 concurrency/recovery | Mentor meeting decisions and post-meeting notes | A stale tab replaying an already-saved note or repeating a completed meeting decision was rejected as `PROJECT_MEETING_INVALID_STATE` because unchanged/terminal checks ran before the stored `updatedAt` token comparison. Users could not distinguish a parallel edit from an invalid action. | Compare persisted version before no-op/terminal-state decisions (after checking meeting existence) in `mentor-meeting-notes-service.ts` and `mentor-meeting-decision-service.ts`. Commits `217973fb2c6d57971600986517ac060469818794`, `1801b331d96cbafe575da7398e394d4e6807a153`. | `tests/unit/PROJ-BREAK-FACULTY-06.test.ts` covers stale duplicate rejection, matched-version no-ops, audit once, team-notification counts (commit `4bc88ed5be6d587d49c26d8dbd2c3a37266ea857`). | Mocked transaction; real PostgreSQL lock/CAS and independent lane review still outstanding. |

| COL-PEOPLE-010 | S2 legacy/UI copy regression | College Project bulk mentor reassignment | Current page description `Move multiple active workspaces to a new mentor at once.` differed from the audit-approved copy asserted by `COL-people-24`: `Move selected non-archived project workspaces to a new primary mentor.` | Restored exact approved copy without changing safeguards, commit `001e152256005ad48f8d9960afcbecdb4f5ebc18`. | Existing `tests/unit/college-people-gap-closure.test.ts` contains exact-copy and confirmation assertions. | Pending refreshed CI report; older published failure should not be claimed resolved without actual run. |

## Adversarial journeys added

- `PROJ-BREAK-FACULTY-03-01..04`: mocked transactional state machine checks a single audit emission per valid edit, stale/double submit rejection without additional writes, and denial for terminal project, closed sprint and shipped release. PostgreSQL serializability and actual WHERE-clause CAS are **not** established by this mock.
- `PROJ-BREAK-FACULTY-02-01..07`: pure Faculty versus assigned Mentor, approved member roles, wrong college, suspended/ended or deactivated principal, read-only reviewer, disabled Projects module, malformed project ID. The service dependencies are mocked; PostgreSQL tenancy, race, and rollback checks are **not** inferred from mocked fixtures.
- Faculty gradebook: unauthorized principals are rejected before roster access; a foreign Section selector fails closed at the mocked roster boundary; private/unpublished grades and foreign learners never appear in the compiled result; guessed learner IDs return the same private not-found code; 101 assessments fail before report queries. These are service tests with mocks, not a substitute for PostgreSQL-backed route/integration tests.

## Outstanding release gates

1. Strict TypeScript check and Vitest for all changed files; local Git checkout and package execution are unavailable in the present connector-only environment. GitHub branch write success is not proof tests passed.
2. PostgreSQL integration tests for live role and membership revocation, concurrent role change, teaching assignment removal, cross-college project member joins, and faculty grade persistence/publication races.
3. Exhaustive ledger and role matrix for remaining faculty attendance, assessment, quiz, authoring, discussion, and reporting services; *further* Super Admin Academics and People route/service audits (a targeted authorization, CSV, scoped query test has been added); full teacher-route functional and responsive acceptance. No coverage completion is asserted.
4. Independent review of each Projects fix by a different lane, as required by `projects-iit-dharwad-hardening.md`.

- Added `COURSES-BREAK-FACULTY-03` service-level mocked quiz release journeys for wrong-tenant role/session, revoked assignment, double submit, stale expectedVersion, published/private transition and exactly one audit event. Tests remain unexecuted pending CI.
- `docs/audit/coverage/faculty-ledger.md` inventories 121 faculty-prefixed modules at export-symbol level plus 36 `/teacher` pages and 11 faculty API route paths; unmapped direct behaviour tests are explicit release gaps, not assumed passing.
- Remaining `docs/orchestrator/unit-failures-latest.md` chat-3 runtime failures were not reproducible without local dependencies or an accessible CI test runner; no pass claim is made.

- `UX-teacher-01` browser acceptance: `tests/e2e/faculty-role-denial-chat3.spec.ts` tests Learner deep-link denial, Faculty switching college, phone/desktop routes, and keyboard skip focus, using only seeded E2E identities. Requires E2E-enabled CI to execute; skipped when harness is unavailable.

## 2026-10-18 — CI failure-list source reconciliation (priority rerun)

The published `docs/orchestrator/unit-failures-latest.md` identifies three chat-3 expectations from CI snapshot `ff6819dd`, but those failures predate the current `main` branch (`f1dcc4855d901c5ffb2a89c89103a4359f2487ea`). Every literal expectation in the failing test functions was checked against the current branch source **without weakening, disabling, deleting, or changing tests**:

- `TPO-drives-51`: `src/app/(authenticated)/college/placements/new/page.tsx` already has the exact `hasMembershipRole(context, "COLLEGE_ADMIN")` sequence plus `PlacementJobCreateWorkspace` and `basePath="/college/placements"`. No missing source assertion remains.
- `COL-people-20`: both add/remove membership service commands still have the exact Super Admin `admin-scope.select` permission guard; the central policy and membership UI contain both expected authorization and user-facing messages. The legacy wording is unchanged.
- `COL-people-24`: the current mentor reassignment component has the exact confirmed title, saved-success title, empty/no-op text, `ConfirmDialog`, no `window.confirm` or raw `failure.code`; the page description has the exact `Move selected non-archived project workspaces to a new primary mentor.` copy, corrected by a prior merge.

**Verification limitation:** this is an exact source-assertion reconciliation, **not** a claim of a fresh passing Vitest run. CI for recent `main` commits was queued when checked. The orchestrator must refresh the failure report from that run before declaring zero failures. Do not revert these current guards or change the tests just to match an older report.

### SA-PEOPLE-BREAK-01 — false-success and unhandled network failure on membership writes

- **Area:** Super Admin and College Admin membership role/lifecycle controls.
- **Severity:** S2 data-state integrity and resilience.
- **Reproduction from source:** Before this patch, `PersonMembershipActions.mutateRole` called `setCurrentRoles(payload.roles)` even after an HTTP 200 with HTML/invalid JSON, resulting in a thrown exception. Lifecycle treated a 200 without a valid `person.membership.status` as a successful change, closed dialogs, cleared the typed suspension reason and announced the old state. Neither action caught network errors, and simultaneous role/lifecycle actions had no shared immediate lock.
- **Fix:** Validate that role responses contain unique known roles consistent with the requested grant/revoke, and that lifecycle receipts confirm exactly SUSPENDED/ACTIVE/ENDED for the requested action. Do not announce success or destroy unsent suspension reasons for malformed receipts. Catch failed network requests and offer reload-before-retry. Use ref locks to block double submissions and conflicting role/lifecycle writes. No legacy copy assertions were weakened.
- **Evidence:** `src/modules/people/membership-action-receipt.ts`, `src/components/admin/person-membership-actions.tsx`, `tests/unit/SA-PEOPLE-BREAK-chat3-01.test.ts`. Tests have not been run in this connector-only environment; awaiting cloud TypeScript and Vitest verification.


### PROJ-FAC-ROLE-011 — stale actor and project Mentor grant across transaction boundary (S1)

- **Evidence:** `transitionMentorProjectTask` loaded `requireProjectLifecycleMutationAccess` before opening its write transaction and then locked the project/task rows without reloading the actor or Project Member grant. A suspended/disabled user, revoked Mentor membership role, or ended/read-only project membership after the page check could reuse a stale session for a write.
- **Fix:** New `assertPersistedProjectMutationActor` reconstructs and SHARE-locks the persisted platform user, selected college membership and role assignments inside the write transaction and then SHARE-locks the exact active project Mentor row; rejects missing/stale membership, non-Mentor, Observer/Reviewer/QA, and `can_mutate=false`. Super Admin / College Admin use a persisted `projects.manage` check. `transitionMentorProjectTask` invokes it **after the project row lock but before reading or updating the task**.
- **Tests:** `tests/unit/PROJ-BREAK-FACULTY-07.test.ts` exercises revocation, terminated assignment, wrong role, readonly kind and admin path; `tests/unit/PROJ-BREAK-FACULTY-03.test.ts` checks revocation before any task read/write/activity. Full PostgreSQL concurrent-UPDATE races and reviewer signoff remain required.
- **State:** Code/tests committed to `chatgpt/chat-3-b`; waiting for cloud CI and independent Projects reviewer. Remaining Mentor write surfaces must receive the same persisted-actor gate before calling the module complete.


### PROJ-FAC-ROLE-012 — stale Mentor session meeting mutation (S1)

- **Affected actions:** complete/cancel meeting, edit outcome notes, reschedule a meeting.
- **Defect:** each action authorized using a request-context snapshot **outside** its DB transaction and did not recheck the persisted user's platform status, membership status, Mentor role, and active writable project membership after locking the project. An expired or removed Mentor grant could therefore race against a meeting write.
- **Fix:** invoke `assertPersistedProjectMutationActor(tx,context,scope)` inside the write transaction, after locking the exact project and before reading/changing its meeting. Reject deleted/read-only/foreign grants under SHARE locks; leave notification and audit routines untouched on rejection.
- **Evidence:** `src/modules/projects/mentor-meeting-decision-service.ts`, `mentor-meeting-notes-service.ts`, `mentor-meeting-reschedule-service.ts`, plus `tests/unit/PROJ-BREAK-FACULTY-06.test.ts` for all three revoked-state writes. Existing `tests/integration/mentor-meeting-notes.test.ts` and `mentor-meeting-reschedule.test.ts` cover canonical seeded PostgreSQL activity. Fresh CI and independent review remain mandatory.


### PROJ-FAC-ROLE-013 — stale Mentor grant across sprint create or transition (S1)

`createMentorProjectSprint` and `transitionMentorProjectSprint` both performed Project Mentor access checks before beginning the write transaction, allowing an already-deactivated Mentor or ended project grant to race the write after project locking. Both now call `assertPersistedProjectMutationActor` under the same transaction/locked project row before releasing any new Sprint, changing status or emitting activity. Unit regression `tests/unit/PROJ-BREAK-FACULTY-09.test.ts` verifies role revocation and terminal Project states produce no inserts, updates or activity. Cloud CI and independent review are pending; real multi-session PostgreSQL concurrency is not yet proven.


### FAC-METHODS-014 — ambiguous Faculty assignment methods selector (S2)

A Faculty `GET /api/courses/faculty/assignments/[deliveryId]/methods` used `new URL(request.url).searchParams.get("assignmentId")` without rejecting duplicate or unrelated selectors. Two conflicting `assignmentId` keys could silently select the first, making the request's actual target ambiguous during stale-tab and cross-Section checks. This now uses a strict `parseFacultyAssignmentMethodsQuery` requiring exactly one UUID `assignmentId` and no extra parameters before session read. The service still independently requires the same currently authorized Section. New adversarial test `tests/unit/COURSES-BREAK-FACULTY-11.test.ts` covers duplicate/conflicting selectors, extra forged college keys, malformed UUIDs, no-store headers and safe failures. Code/tests committed but CI pending.


### FAC-QUIZ-015 — role revocation between quiz page load and result publication (S1)

`commandFacultyQuizResults` checked `requireDeliveryContentMutation` before opening the transaction, then updated the quiz and logged activity under a quiz row lock. A concurrently disabled user, suspended college membership, removed Faculty role, or ended teaching assignment could publish/hide results using a stale request. The quiz was scoped, but the actor's persisted permissions were not reconstructed in the write transaction.

**Fix:** `assertPersistedFacultyTeachingMutation` (`src/modules/courses/faculty-persisted-teaching-guard.ts`) rechecks the persisted actor, active membership and Faculty role, college/organization and live teaching assignment under SHARE locks in the quiz publication transaction. The check runs after the quiz is locked and before a write/audit. Existing CAS and legacy wording remain unchanged.

**Tests:** `tests/unit/COURSES-BREAK-FACULTY-03.test.ts` checks mid-transaction revocation causes zero writes/activity; `tests/unit/COURSES-BREAK-FACULTY-12.test.ts` checks revoked actor, changed membership, other tenant, suspended/ended member, removed Faculty role and ended teaching grant. **Open:** fresh CI and real two-session PostgreSQL race / independent reviewer.


### FAC-QUIZ-016 — nonfinite score inflates Faculty distribution (S2)

`getFacultyQuizReport` used only range comparisons for the histogram input, allowing `score=5,maxScore=Infinity` to contribute 0% even though `scoreSummary` rejects nonfinite scores. This made grade distribution disagree with valid graded count and average. The scoring projection now validates both score and maximum with `Number.isFinite` before computing percent.

Behavioural evidence: `tests/unit/COURSES-BREAK-FACULTY-06.test.ts` adds NaN and Infinity variants and checks that invalid score evidence contributes no histogram count while retaining the submitted learner count. Await fresh CI and database-corruption integration tests.


### FAC-METHODS-017 — stale Assignment A methods overwrite Assignment B editor (S1)

Rapidly switching a Faculty editor between different assignments triggered overlapping GET requests for saved permitted submission methods. The old response could resolve after a new selection and overwrite that assignment's visible policy; the old code also used `normalizeAssignmentMethods` on malformed 200 responses, silently broadening an uncertain policy to every allowed type. A Faculty could then edit B based on A's method choices, unintentionally changing which learner submissions are accepted.

**Fix:** A per-editor `facultyAssignmentMethodsLoadVersion` invalidates pending requests whenever selection changes. Late resolve/reject handlers return without mutating B. `verifiedFacultyAssignmentMethodsResponse` requires a valid nonempty unique method list for a successful fetch; invalid responses leave loading false and display a retry instruction. Editing an assignment cannot proceed until methods are confirmed when this feature is enabled.

**Evidence:** `src/components/courses/faculty-assignment-editor.tsx`, `src/modules/courses/faculty-assignment-method-load-model.ts`, `tests/unit/COURSES-BREAK-FACULTY-13.test.ts` (stale async requests, retry invalidation, malformed methods). React/browser network-race acceptance and CI remain outstanding.


### FAC-ASSIGNMENT-BODY-019 — unbounded Faculty assignment authoring request input (S1)

The Faculty assignment mutation route previously called `request.json()` directly. Unlike its sibling quiz command route, this allowed an arbitrarily large request body to be buffered before the Zod schema and teaching-scope service could reject it. An authenticated user or stale authoring page could force needless application memory consumption or error on malformed UTF-8.

**Fix:** The route now delegates to `readFacultyAssignmentCommandBody`, a 128 KiB maximum streaming JSON parser with both trustworthy declared-length preflight and measured byte enforcement. Strict content type, malformed Content-Length, invalid UTF-8 and empty/incomplete JSON fail before the assignment write, with customer-safe recovery messages and a request ID. Existing cross-site POST rejection and canonical service authorization are unchanged.

**Tests:** `tests/unit/chat3-faculty-assignment-body-route.test.ts` cases FAC-assignment-body-01 and FAC-assignment-body-02 cover unicode, stream limit, forged origin, no-service-call on failed parse and safe error mapping. CI, PostgreSQL, and actual browser attempts remain unexecuted.
### FAC-QUIZ-TRANSPORT-020 — malformed size header and opaque authoring failure (S2)

The Quiz POST route already bounded streams, but silently ignored non-decimal Content-Length, while emitting only a raw transport error code for unsupported JSON types, corrupt JSON or oversized bodies. These failure states offered no customer-safe recovery or correlation reference.

**Fix:** Reject invalid declared length as `INVALID_QUIZ_JSON` (400), retaining strict measured 16 MiB payload cap. Route preserves existing status/error keys but adds friendly recovery `message`, `requestId`, and `x-request-id`. Existing same-origin rejection, persisted permission checks, and quiz validation remain unchanged.

**Tests:** `tests/unit/chat3-faculty-quiz-transport-errors.test.ts` FAC-QUIZ-TRANSPORT-01/02; static authoring only, pending cloud CI.

### SA3-PEOPLE-09 — stale scoped People directory deep link displays false empty page (S2)

The selected-college `listAdminScopedPeople` service used `offset((query.page-1)*pageSize)` before knowing the current number of matching Faculty/Learner memberships. An old bookmarked page could produce “page 999 of 1” and an incorrect no-matches state after a role revocation, status/filter change or removal. Unlike the global Super Admin directory, the selected-college directory did not clamp pagination.

**Fix:** Count under the server-selected organization/college SQL scope, compute `totalPages`, clamp `page`, then issue the row query with the corrected offset. Return corrected query state so existing navigation can render truthful page numbers. `tests/unit/chat3-superadmin-scoped-people-pagination.test.ts` (SA-people-scoped-01) includes service-level role/tenant preflight, bounded pages, stale page and empty results. CI and live PG verification pending.

### FAC-TENANT-COURSES-022 — Faculty assigned-deliveries list omitted Section/cohort/term tenant consistency joins (S1)

`listFacultyCourseDeliveries` verified the assigned Faculty's active membership and selected course department college, but then joined the Section by its ID and the cohort/academic period by other IDs without asserting they matched the course offering and selected college. Foreign/corrupt cross-college Section/cohort links could therefore appear as plausible Faculty teaching deliveries even though the deeper `loadCourseSectionDeliveryScope` path would reject them. This is a preexisting defense gap at the primary Faculty course list.

**Fix:** Join Section only when both its cohort and academic period match the teaching delivery's offering. Resolve the cohort program's department through a distinct Drizzle alias and require it belongs to the current Faculty college; require the academic period also belongs to that college. The original active status, membership, Faculty role and persisted teaching grant filters remain in force. Test `tests/unit/chat3-faculty-course-roster-cross-tenant-joins.test.ts` (FAC-TENANT-COURSES-01) compiles the real join predicates through PgDialect and rejects wrong-role/inactive callers before DB queries. Full PostgreSQL cross-college fixtures, EXPLAIN and current CI remain release gates.

### SA3-FAC-ASSIGNMENTS-023 — mismatched Faculty Section/term joins and stale assignment page (S1/S2)

The selected-college Super Admin Faculty assignment directory joined course offerings, Sections and cohorts by independent foreign keys. It did not require `sections.cohort_id = course_offerings.cohort_id` or `sections.academic_period_id = course_offerings.academic_period_id`. Malformed cross-Section teaching deliveries could appear authoritative in the assignment roster. Its page query also used an un-clamped deep-link offset, producing false empty pages after removal.

**Fix:** Match offering and Section's cohort and term in the inner joins; maintain college/organization scope; count and clamp the requested page before rows. The class selector requires a selected-college academic period. `tests/unit/chat3-sa-faculty-assignments-tenant-pages.test.ts` checks compiled joins and role denial. PostgreSQL fixtures and CI remain outstanding.

### SA3-PEOPLE-ORG-025 — Super Admin selected-college facets did not verify organization ownership (S1)

The Faculty teaching-assignment class picker and four People filter-option SQL readers enforced the selected `college_id`, but did not join the `colleges` table to establish that the selected college belongs to the selected `organization_id`. Since `requireSuperAdminSelectedCollege` compares the request to the already selected scope without querying the owning tenant row, a stale or inconsistent selected organization+college pair could expose class, cohort, program and department facet names from the wrong organization.

**Fix:** Require the persisted college row and matching `colleges.organization_id` in the Faculty classes picker and all four People facet queries. Keep the existing department, academic term, count limits and active Super Admin selected-scope checks. Tests: `tests/unit/chat3-sa-faculty-assignments-tenant-pages.test.ts` (SA3-FAC-ORG-01) and `tests/unit/chat3-sa-people-facets-organization-scope.test.ts` (SA3-PEOPLE-ORG-01). Requires CI and PostgreSQL mismatch fixtures before claiming runtime acceptance.

### SA3-FAC-EXPORT-024 — duplicate Faculty export filters silently overwritten (S2)

`Object.fromEntries(searchParams)` dropped duplicate `status`, `page`, or `q` selectors before validation, allowing a request with ambiguous selection to download a different CSV than its visible filters suggested. The export now rejects duplicate keys with a 400 response and preserves the existing 300-row cap and safe cache headers. `tests/unit/chat3-sa-faculty-assignments-csv-http.test.ts` exercises actual HTTP behavior. CI pending.

### FAC-QUIZ-PII-026 — masked learner email leaked into Faculty quiz attempt display names (S2)

`getFacultyQuizAttemptDrilldown` fell back from a missing `learnerDisplayName` to `learnerEmail`. A Faculty member opening a quiz attempt list would therefore see the student's email in the visible name field even when the rest of the report withheld contact details. Whitespace-only display names were also treated as valid labels.

**Fix:** Use the trimmed display name or existing neutral `Learner` fallback; do not expose learner email as display copy. Preserve the exact current Section and persisted teaching checks and the existing question-result projection. Test `tests/unit/chat3-faculty-quiz-attempts-privacy-service.test.ts` (FAC-QUIZ-PII-01) covers absent names, email/answer-selection non-disclosure, wrong roles, invalid selectors and revoked assignment errors. CI and browser accessibility/PII checks pending.

### FAC-WORKSPACE-TENANT-027 — historical attendance records could expose departed or foreign learner contacts (S1)

`getFacultyAttendanceWorkspace` authorized the Faculty delivery and found the current Section sessions, but then selected **all** attendance-record memberships for those event IDs. The join had no `college_memberships.college_id`, current active membership, active platform user, or current enrolled delivery roster constraint. A historically valid but subsequently moved, disabled or departed learner record (or a malformed foreign membership reference) could therefore appear with `email`, `phoneE164`, `note` and `rollNumber` in a Faculty workspace outside the current audience.

**Fix:** Calculate the verified current delivery roster before querying records. Skip historical record reads for empty rosters; constrain the record SQL by both authorized event IDs and currently enrolled membership IDs and enforce active same-college memberships/users. `tests/unit/chat3-faculty-attendance-workspace-tenant-boundary.test.ts` compiles the actual Drizzle WHERE predicate and checks empty/unauthorized no-read paths. The separate grade/submission mutation ownership and historical audit retention remain unchanged. Real PostgreSQL malformed-record and college-transfer fixtures, UI attendance comparison and CI are still outstanding.

### FAC-HEALTH-RATE-029 — corrupt assessment response totals produce misleading percentages (S2)

`responseCoverage` previously clamped negative or overcounted submissions into plausible 0% or 100%, and could emit `NaN` for nonfinite inputs. Since the report reflects actual persisted response state, impossible numerator/denominator values are integrity defects, not evidence of completion. The model now returns `null` for noninteger/nonfinite/negative/overcounted values, while preserving 0–100% for valid scores. Test: `tests/unit/chat3-faculty-course-health-closed-quiz-model.test.ts`, `FAC-HEALTH-RATE-03` (authored; CI pending).

### FAC-HEALTH-CLOSED-028 — completed quizzes silently absent from Faculty Section health (S2)

The Faculty Section health model filtered assessment rows to `status === "PUBLISHED"` only. A quiz becomes `CLOSED` after its deadline or results release while remaining legitimate teaching evidence; both the Faculty results and reports-hub models already include closed quizzes. The health page therefore dropped completed quizzes from its count, response coverage and drilldown, misleading instructors about earlier assessments.

**Fix:** Include `status === "CLOSED"` **only for quizzes** in the Section-scoped health selector. Draft and archived quizzes and non-published assignments remain excluded. `tests/unit/chat3-faculty-course-health-closed-quiz-model.test.ts` checks the state matrix, exact delivery, five-row page cap and invalid selector, and `tests/unit/chat3-faculty-course-health-service-permissions.test.ts` now exercises a CLOSED quiz through the actual service. Tests authored only; cloud CI and browser historical-quiz checks pending.

### SA3-PEOPLE-CLASS-033 — learner class name subquery ignored selected college and enrollment relationships (S1)

The selected-college People directory uses an inline learner class name subquery. It previously joined `section_enrollments`, `learner_program_enrollments` and `sections` by independent identifiers but never checked the Section's cohort, academic period, program, or owning college. A malformed transferred learner assignment could disclose the name of a Section from another college in a superficially authorized Learner row.

**Fix:** The class projection now verifies Section-to-enrollment cohort and academic-period equality, joins the cohort's own program and department, matches the learner enrollment's program and requires department college ID to equal the selected college. The correlated membership check and newest-class order remain. `tests/unit/chat3-superadmin-scoped-people-pagination.test.ts` has a `SA3-PEOPLE-CLASS-01` compiled SQL projection test. Database cross-college/transfer fixtures and cloud CI pending.

### SA-PEOPLE-ROOT-032 — selected People and Faculty assignment pages lacked page-level Super Admin role gate (S2)

The selected `/admin/faculty-assignment`, `/admin/people/directory`, and global `/admin/people/unassigned` pages relied on shared layouts or service authorization alone. With a stale or inconsistent session, those pages could render partial privileged UI or load administrative workspace services before their own platform role preflight. Defense in depth requires a local active Super Admin check.

**Fix:** Each entrypoint now redirects non-Super-Admin actors before the list data load. Existing central permission service checks remain in force. `tests/unit/chat3-sa-academics-people-root-platform-roles.test.ts` explicitly verifies `SA-PEOPLE-ROOT-02`. Tests authored, not run; browser and CI checks pending.

### PROJ-BREAK-chat3-FACULTY-040 — read-only project observer reached Mentor task mutation dispatch (S1)

The task-create API routed **every non-Learner** project access type into `createMentorProjectTask`, including `OBSERVER`. That downstream service contained another role/transaction check, but a read-only Observer (including a Faculty/Mentor dual-role account that had been demoted) should never reach a privileged command handler at all. The route also used unbounded `request.json()`, exposing a resource-exhaustion path before service Zod validation.

**Fix:** Explicitly allow only `LEARNER`, `MENTOR` and `ADMIN` access at route dispatch; read-only observers now fail with `PROJECT_ACCESS_DENIED` before a write function is called. Use the existing strict UTF-8, 128 KiB `readMentorProjectCommandBody` parser for all task-create calls, returning friendly bounded 400/413/415 errors. `tests/unit/PROJ-BREAK-chat3-faculty-project-task-route.test.ts` exercises the actual route for CSRF, role routing, denied grants and malformed/oversized bodies. Transaction and network retry tests remain with the Projects hardening squad; no cloud CI was run.

### SA-ACADEMICS-SECTION-OPS-039 — Faculty could probe private Section identifiers before administrative role denial (S1)

`getSectionOperationsWorkspace` fetched `loadSectionScope(sectionId)` before its `academics.manage` check. Ordinary Faculty, Mentor and Learner principals lacked permission to manage a Section but could still cause a Section lookup and distinguish internal scope failures from privileged-access denial when supplying arbitrary IDs.

**Fix:** Explicitly require active `COLLEGE_ADMIN` or `SUPER_ADMIN` actor role before the Section ID lookup, then preserve the existing resource-specific `academics.manage` authorization. Direct behavioral `tests/unit/chat3-sa-section-workspace-permission-matrix.test.ts` checks wrong-role no-read, selected-college period SQL, authorized child views and foreign-period fail-closed behavior. CI/database tests pending.

### SA-ACADEMICS-PROGRAM-READ-038 — college program deletion-readiness counts exposed to ordinary academic readers (S2)

`listProgramContents` returns counts of program semesters, batches and classes for future deletion safety. It required only `academics.read`, which is also granted to active Faculty, Mentor and Learner in the same college and was insufficient as a service boundary for privileged bulk program lifecycle controls.

**Fix:** Require `academics.manage` for same-college dependent counts. College Admin and scoped Super Admin can still view, Faculty/Mentor/Learner and wrong-tenant admins are denied before the three aggregate SQL reads. `tests/unit/chat3-sa-program-dependency-count-roles.test.ts` tests actual service SQL/roles and zero-program guard. No CI/DB execution performed.

### SA-LEARNING-FILTER-ROLE-037 — Faculty teaching read permission leaked full-college Super Admin filter options (S1)

The Super Admin learning filter service called `resolveActingCollege(context, "courses.read")` directly. Since this permission also allows regular Faculty/Learner accounts to read courses inside their college, a future direct request or shared call path could expose all course and cohort names as selectable administrative filters despite no active Super Admin system role.

**Fix:** Reject non-`SUPER_ADMIN` or disabled contexts before scoped college resolution and SQL. Persisted selected-college predicates and 2,000-row caps remain. Behavioural test `tests/unit/chat3-sa-learning-facets-platform-role.test.ts`, SA-LEARNING-FILTER-ROLE-01. Browser/CI verification pending.

### SA-ACADEMICS-ROLE-035 — Super Admin batch and Student Register service allowed College Admin role fallback (S1)

Both the batch census and Student Register options services delegated directly to `resolveActingCollege`. This helper intentionally permits active College Admins to act inside their own college, but it is not an appropriate sole actor guard for **Super Admin-only** service entry points. Calling these exported functions from a future API or action would inherit that broader authorization despite the page naming.

**Fix:** Both services now explicitly deny principals lacking active `SUPER_ADMIN` system role before even resolving a college scope. No College Admin service was changed. Direct service tests: `tests/unit/chat3-sa-academics-batch-roster-privacy.test.ts` and `tests/unit/chat3-sa-student-register-options-role-scope.test.ts`, case SA-ACADEMICS-ROLE-01. Cloud CI, signed-in Super Admin and College Admin browser journeys pending.

### SA-ACADEMICS-BATCH-COUNT-033 — disabled account included in class occupancy but absent from roster (S1)

In the selected-college Super Admin batch detail, class occupancy counted `college_memberships.id` for an active program and Section enrollment. The detailed roster instead joins `users.platform_status = ACTIVE`. A suspended platform user with a still-active membership could inflate a classroom's occupancy and capacity warning while never appearing in the roster or CSV.

**Fix:** Left-join active users into the occupancy query and count `users.id`, retaining cohort, class and college restrictions. `tests/unit/chat3-sa-academics-batch-roster-privacy.test.ts` asserts the compiled Drizzle predicates, legitimate query and authorization guard. PostgreSQL mismatched-account fixtures and browser counts remain unverified.

### SA-ACADEMICS-BATCH-CSV-034 — invisible-prefix CSV formula injection in batch roster export (S2)

Batch roster CSV encoding neutralized formulas after ordinary whitespace and ASCII controls, but not U+200B, U+2066, U+FEFF and bidirectional controls. Spreadsheet imports may interpret a concealed `=+` expression after stripping these characters. The batch CSV model now neutralizes those prefixes, preserving standard quoting/BOM and all four fields; `tests/unit/chat3-sa-batch-roster-csv-formula-protection.test.ts` exercises direct behavioral serialization. CI and spreadsheet-app import verification pending.

### SA-ACADEMICS-ROOT-031 — administrative Academics and People pages delegated role separation only to layout (S1)

The root `/admin/academics` page read the selected college workspace without a local platform-role gate, relying on the shared route layout to stop an ordinary user reaching it. `/admin/people` similarly relied on layout and deeper membership permission checks. Generic `academics.read` is valid for Faculty and Learner memberships within their own college; it must not accidentally authorize a platform-admin page when a stale session carries an `adminScope`.

**Fix:** Both root pages now check `isSuperAdmin(context)` before any tenant data fetch and redirect nonadministrators to `/dashboard`. The no-college selected-scope prompt for genuine Super Admins remains intact. `tests/unit/chat3-sa-academics-people-root-platform-roles.test.ts` asserts the guard placement and actor role matrix. Requires current CI and authenticated browser checks.

### SA-ACADEMICS-SECTION-030 — generic academic read permission on Super Admin Section page (S1)

The `resolveSuperAdminSectionDetail` service checked `academics.read` and a selected `adminScope`, but that permission is also granted to active nonadministrative Faculty, Mentor and Learner memberships for their own college. With an inconsistent or accidentally propagated admin scope, such a principal could pass the initial service permission check into the Super Admin Section detail path. The page layer's separate authorization should not be relied upon as the only boundary.

**Fix:** Require `isSuperAdmin(context)` up front and raise the canonical `AuthorizationError("academics.read")` before scoped database reads. Preserve the Super Admin no-college prompt (null) and private foreign/not-found behavior. `tests/unit/chat3-sa-academics-section-platform-role.test.ts` covers active and disabled principals, forged role/adminScope combinations, correct and foreign Section records and database failures. CI and authenticated page tests pending.

### UX-teacher-notices-redirect-036 — malformed legacy Notices URL surfaced an uncaught validation error (S2)

The retired Faculty notices bookmark path used `facultyNoticeParamsSchema.parse(await params)` without a safe-parse or private not-found mapping. A mistyped/hostile delivery ID therefore surfaced as an unhandled Zod error rather than the standard private 404 used by the other Faculty Section legacy aliases.

**Fix:** `safeParse` and `notFound()` before any request context or Section read; still call `getFacultySectionNotices` before redirect on valid IDs, so revoked teaching assignments cannot be bypassed. `tests/unit/UX-teacher-redirect-no-shared-route-journey.test.tsx` verifies this and three additional alias routes. Runtime/browser acceptance pending.

### FAC-GRADEBOOK-UX-032 — repeated page key bypassed strict Faculty query rules (S2)

The Faculty gradebook only verified allowed query-key **names**, not that Next.js had received exactly one value per key. For example `?page=1&page=999` becomes `page: ["1","999"]`; the Zod `coerce.number` path can also accept an array of one value. This silently accepts an ambiguous deep link despite the code's intended strict filter validation.

**Fix:** Explicitly reject all array-valued query keys before the gradebook view schema or any current-teaching report read. Preserve the existing invalid-link recovery and exact Section scope. Direct SSR tests in `tests/unit/UX-teacher-gradebook-strict-query-journey.test.tsx` cover forged, duplicated, malformed, empty and filtered states. Browser/CI acceptance pending.

### FAC-HTTP-BODY-021 — unbounded live-class and attendance scheduling commands (S1)

Both Faculty live-class and attendance scheduling POST routes previously called `request.json()` directly. The Zod/authorization service subsequently rejected bad fields, but the HTTP input body had already been fully buffered, permitting oversized metadata requests to waste memory in a stale or malicious session.

**Fix:** Shared `readFacultyAuthoringBody` enforces 128 KiB on both declared and streamed bytes, strict supported JSON media type, valid Content-Length and UTF-8. Both routes preserve same-origin and delegated identity behavior but return customer-safe 400/413/415 messages with request IDs for transport failures. The domain services still validate payloads and persisted Faculty assignment independently.

**Tests:** `tests/unit/chat3-faculty-authoring-body-routes.test.ts` covers the pure parser and both actual POST entrypoints, including cross-origin before auth, malformed/oversized before write, valid actor context and safe canonical error handling. CI, integration and browser tests pending.

### FAC-SCHEDULE-018 — revoked Faculty could create/reschedule attendance classes (S1)

`commandFacultyAttendanceSchedule` checked the Faculty role and Section ownership before the transaction but, after advisory-locking the actor and Section, proceeded to insert/update session rows without rebuilding the persisted user/membership/teaching grant. Removing the Faculty role or ending the teaching assignment between those steps could leave a new schedule and activity from a revoked account.

**Fix:** Call shared `assertPersistedFacultyTeachingMutation` in the schedule write transaction immediately after the two advisory locks and before any scheduled-event reads or writes. This also requires current college and organization authority, currently active membership and currently assigned Faculty teaching rights.

**Test:** `tests/unit/COURSES-BREAK-FACULTY-14.test.ts` checks a revoke after preflight but before write, valid author, disabled and non-Faculty sessions, invalid confirmation, malformed windows and extra spoofed college fields. Release still requires live PostgreSQL concurrent revoke/schedule tests and current CI.
