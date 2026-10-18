# Courses / Learner coverage ledger — chat-7

**Status: PARTIAL / NOT RELEASE-VERIFIED** · 18 October 2026 · Branch `chatgpt/chat-7-b`. This is a behavioural evidence ledger, not a declaration of exhaustive coverage. No direct Vitest, TypeScript or PostgreSQL run was available in this connector session; a listed regression is **authored**, not necessarily passing. Do not interpret a test filename as sufficient proof of a closed permission or state-transition matrix.

## Scope and baseline

The orchestrator's `docs/audit/coverage/WEAK-AREAS.md` reports **336 courses source files, 871 exports, 313 referenced files and 710 named exports** on a snapshot of main. These are search-reference heuristics, not branch statement/branch coverage. `docs/audit/coverage/chat7-learner-course-file-inventory.md` inventories 128 learner-prefixed modules and 79 Courses API route files; the earlier inventory reported 114 models and all 79 API handlers not independently verified. Every outstanding symbol/handler below remains **OPEN** until direct behavioural, tenant/role and PostgreSQL tests are green.

### Tested or newly authored behaviour (one row per verified target, not a blanket export claim)

| ID / source function or route | Direct evidence | Behaviour asserted | Status |
|---|---|---|---|
| `COURSES-BREAK-LEARNER-ACCESS-01` · `requireOwnCourseLearnerRead` (`src/modules/courses/learner-access-guard.ts`) | `tests/unit/COURSES-BREAK-LEARNER-ACCESS-01.test.ts` | Persisted active learner, signed-in user match, selected tenant match, wrong role/tenant, missing membership, revoked membership, suspended platform user, permission denial and invalid UUID | Authored; DB integration and CI pending |
| `COURSES-WEAK-LEARNER-METHODS-02` · `getLearnerAssignmentMethods` | `tests/unit/chat7-learner-assignment-methods-weak.test.ts` | Malformed IDs, visibility/authoring state, delivery audience, faculty denial, policy row absent and fallback of legacy permitted methods | Authored; CI pending |
| `COURSES7-06` · `listOwnLearnerAssessmentRows` | `tests/unit/chat7-learner-assessment-result-release.test.ts` | No authorized deliveries triggers no DB read; assignment marks/feedback withheld until release; quizzes need `CLOSED && resultsPublished` before reporting released results | Authored; DB/CAS integration pending |
| `COURSES7-06` · `learnerAssessmentMatchesState` | `tests/unit/chat7-learner-quiz-discussion-guard-coverage.test.ts`, `tests/unit/chat7-learner-assessment-result-release.test.ts` | RESULT filter never treats published-but-open quizzes as released; assignment results require submission and publication; time window and stale status permutations | Authored; CI pending |
| `COURSES7-07` · `getMyQuizAttempts` | `tests/unit/chat7-learner-results-service-scoping.test.ts` | Authorized requested delivery at read boundary, persisted own quiz+membership records spanning section transfer (quota is global per quiz/member); hidden scores/correctness until closed+released; wrong role denied before DB | Authored; real-tenant DB test pending |
| `COURSES7-08` · `getMyAssignmentSubmission` | `tests/unit/chat7-learner-results-service-scoping.test.ts` | Authorized requested delivery then persisted own assignment+membership result even after section transfer, matching unique assignment/member submission constraint; mask marks, private comments and grader identity until publication | Authored; real-tenant DB test pending |
| `COURSES-WEAK-RESOURCE-MATERIALS-01` · `resourceMaterialLinkSchema`, `resourceMaterialCommandSchema`, `resourceMaterialIdSchema`, `resourceMaterialsWriteReady` | `tests/unit/chat7-course-resource-materials-weak.test.ts` | Strict credential-free HTTPS, title/notes bounds, duplicate/unknown actions, migration readiness fail-closed | Existing tests, TypeScript annotation repaired; CI pending |
| `COURSES-WEAK-DELIVERY-ROSTER-01` · `listActiveDeliveryLearners` | `tests/unit/chat7-course-delivery-roster-weak.test.ts` | Elective group vs regular section, active college membership, user/role and section constraints; source + mock query assertions | Existing failures in CI snapshot; **OPEN**, needs real PostgreSQL validation |
| `COURSES-WEAK-EXPORT-SERVICE-01` · `exportCollegeAssessments` | `tests/unit/chat7-college-assessment-export-service-weak.test.ts` | Query key/shape validation, pagination continuation, 1000-row cap, CSV truncation notices, sensitive grade withholding | Existing two failures in snapshot; **OPEN** |
| `COURSES7-06` · `canReviewLearnerQuizCorrectAnswers`, `learnerQuizSubmitDeadlineOpen`, `learnerQuizDraftCanPersist`, `parseLearnerQuizDraft`, `normalizeLearnerQuizDraftForQuestions`, `learnerQuizRequestCurrent`, `learnerQuizRouteScopeCurrent` | `tests/unit/chat7-learner-quiz-discussion-guard-coverage.test.ts` | Fail-closed review, deadline equality, cross-quiz draft tampering, races, malformed session storage | Existing behavioural tests; CI pending |
| `COURSES7-06` · `learnerDiscussionMayPost`, `createSubmissionFlightGuard` | `tests/unit/chat7-learner-quiz-discussion-guard-coverage.test.ts` | Empty/unauthorized post and double-click submission fail closed | Existing model tests; persistence and retry integration **OPEN** |
| `COURSES7-06` · `learnerCourseTabPath`, `learnerQuizRefreshFailureMessage`, `learnerAssignmentFinalConfirmation`, `requireLearnerQuizResponseId` | `tests/unit/chat7-learner-quiz-discussion-guard-coverage.test.ts` | Invalid descendants, friendly recovery, irreversible submission copy and mismatched response IDs | Existing model tests; phone and keyboard browser check **OPEN** |
| `COURSES-WEAK-EXPORT-SERVICE-01` · `collectCollegeExportRows` | `tests/unit/chat7-college-assessment-export-service-weak.test.ts` indirectly; `src/modules/academics/college-directory-export-model.ts` implements cap and page boundedness | Verify 1000 cap and page accounting on real query; snapshot failures **OPEN** |
| `SA-academics-people-52/53` · `safeCourseVisibilityFailure`, `superAdminCourseBulkSchema`, `studentCourseCompletion` | `tests/unit/chat7-superadmin-course-tenant-bulk.test.ts` | Strict bulk shape, selected-college WHERE predicates, safe per-record message, bounded admin content filters, progress denominator | Source+model assertions; actual admin actor-swap PostgreSQL **OPEN** |
| `LEARNER-learning-misc-05` · `assertAssignmentSubmissionDeadline` | Existing module use inside `submitCourseAssignment`; need dedicated direct tests | Server deadline equality, 23:59 IST, late/extension grace, missing due date | **OPEN** direct behavioural integration |
| `quiz-attempt-service.ts` · `submitCourseQuiz` | Existing transaction lock, persisted role check, advisory lock, max-attempt constraint in code; integration probe not completed | Duplicate submit, exact deadline, revocation between authorize/commit, no early results | **OPEN** real PostgreSQL integration |
| `assignment-submission-service.ts` · `submitCourseAssignment` | Existing transaction lock, method policy and unique constraint mapping in code; integration probe not completed | Double submission, late/withdraw, receipt reuse, session expiry, activity+notification atomicity | **OPEN** real PostgreSQL integration |

| `COURSES7-09` · `AssignmentSubmissionControl` mounting | `tests/unit/UX-chat7-course-assignment-scope-reset.test.ts` | Form remount on assignment/delivery switch, protect drafts and submission methods, duplicate-click and finality guard; no live browser rendering | Authored source and model tests; real Playwright journey **OPEN** |
| `COURSES7-10` · `LearnerCourseOverview` priority vs `assertAssignmentSubmissionDeadline` | `tests/unit/chat7-learner-overview-deadline-parity.test.ts` | Do not offer late submissions that server rejects; both assignment and quiz deadlines reject exact equality | Authored; live tab/deadline rollover **OPEN** |

### Projects role-journey evidence (cross-ledger, chat-14 owns Projects master ledger)

| ID / target | Direct test | Risks exercised / known gap |
|---|---|---|
| `PROJ-BREAK-LEARNER-01` · task-create and status/progress policies | `tests/unit/PROJ-BREAK-LEARNER-01.test.ts` | Unauthorized role/body spoofing, invalid statuses, stale version, impossible date, blocker rules, assignment ownership |
| `PROJ-BREAK-LEARNER-ROUTES-01` · status/progress/delete/backlog HTTP verbs | `tests/unit/PROJ-BREAK-LEARNER-ROUTES-01.test.ts` | CSRF, request user spoofing, friendly failed-write mapping; snapshot's misleading mock copy corrected; route boundary suite still needs CI |
| `PROJ7-05` · `deleteLearnerOwnTask` | `tests/unit/PROJ-BREAK-LEARNER-RELEASE-01.test.ts` | Shipped release with still-active sprint; inactive/foreign role, comments/submissions present, audit and notify success; real DB race **OPEN** |
| `PROJ7-06` · `learnerBacklogPullInputSchema` / `pullOwnBacklogTask` | `tests/unit/PROJ-BREAK-LEARNER-BACKLOG-01.test.ts` | Forged actor, malformed command, denied non-learner role, millisecond CAS SQL; concurrent retries on actual PostgreSQL **OPEN** |

### Learner and faculty permission matrix (requirements for every route)

| Scenario | Learner-own | Faculty (assigned) | College Admin (acting own college) | Super Admin (explicit college scope) | Wrong college / expired session |
|---|---|---|---|---|---|
| Read own quiz/assignment in enrolled course | Allow published and proper audience only; results after release | Separate teaching-scope read | Use authorized admin read, not learner endpoint | Explicit acting-college authorized read | Deny before content, file grant or attempt lookup |
| Write own assessment | Allow until server-enforced deadline, quota and exact delivery | Deny learner mutation | Deny learner mutation | Deny learner mutation | Deny and do not commit audit/activity |
| Read another learner's responses, grade, answers | Deny | Allow only assigned delivery and rubric limits | Scoped college authorization | Explicit acting college | Deny |
| Manage offerings, quizzes and grade publication | Deny | Assigned teaching scope only | Manage own college | Acting-college scope and route policy | Deny |
| Project learner status/backlog/delete | Allow assigned own task in active project/sprint/release, CAS | Deny unless separately authorized role | Deny learner endpoint | Deny learner endpoint | Deny |

Each cell must be tested for deactivated user, revoked membership, archived offering, stale tab and tenant switch. A row above is a specification, **not** evidence of passing all cells.

### Unclosed exhaustive coverage items

1. The remaining learner model symbols, quiz question/answer services, assessment authoring and moderation, discussions, and certificates require a generated **one-row-per-export inventory**, test linkage and branch + statement coverage.
2. The 79 Courses API routes listed in `chat7-learner-course-file-inventory.md` need **per-handler** own/other tenant, role/expiry, GET no writes, CSRF on mutations, duplicate requests and friendly failures. Current focused tests do not discharge this requirement.
3. `/admin/courses*` and content builder pages, `components/courses`, attendance, `/learn` and `/quiz` need route-by-route empty, loading, partial, denied, error and 320/375/768px keyboard/scroll review.
4. PostgreSQL integration harness from chat-17 is necessary for actual quiz/assignment deadline locks, duplicate submits, grade/result visibility and release/task concurrency. No end-to-end run has established 90% project module branch coverage.
5. CI's newest lane 7 failure inventory is not fully green: export, roster, legacy copy, College Projects heading, mentor loading, learner placements and Recruiter drawer tests remain to investigate without dropping assertions.

**Release recommendation:** Keep Learner/Courses marked **BLOCKED FOR RELEASE** pending CI + PostgreSQL tenant/action matrix + independent breaker review. Existing implementation progress is not the same as an unbreakable account.

## Repeatable full source inventory

Run `node scripts/audit/generate-chat7-coverage-ledger.mjs` in the checked-out repository to regenerate `docs/audit/coverage/chat7-generated-symbol-ledger.md`. The generator uses TypeScript AST rather than filename heuristics to enumerate exports across Courses services/models, 79 Courses API handlers, Learner/Quiz/Super Admin course pages, Courses and Attendance UI, and learner Projects services/routes. It scans test source for symbol-name references as **candidate evidence only**; it leaves every row OPEN pending direct behavioural review and passing CI. A passing symbol-name search is not branch coverage, a tenant/role test, or a service integration test.

The orchestrator should commit the deterministic generated ledger after execution, then close every row only when a specific role/state/tenant/expiry/double-submit behavioural assertion and PostgreSQL fixture apply. This does not replace the independent Projects master ledger or its 90% branch-coverage gate.


## Chat-7 corrective batch — scoped retry, exports, and Learner embargo (2026-10-18)

| Contract | Source and direct test | Review status |
|---|---|---|
| `SA-academics-people-52/53` selected-course Retry failed | `src/modules/courses/super-admin-course-bulk-visibility.ts`, `super-admin-lesson-bulk-visibility.ts`, `src/components/courses/super-admin-course-bulk-visibility.tsx`, `tests/unit/chat7-final-sprint-superadmin-course-visibility.test.ts` | Retry now maps failed content to its course and retries only failed, currently scoped course IDs. No all-success replay after a partial failure. Batch course count 100 and lesson lookup remains capped at 500. Source authored; cloud CI pending. |
| `SA-academics-people-62` public link preview | `src/modules/courses/super-admin-content-public-link-model.ts`, `tests/unit/chat7-superadmin-content-public-link-safety.test.ts` | Persisted old content URLs are revalidated before a public-link action. Non-HTTPS, credentialed and fragment-bearing URLs fail closed. Source authored; CI pending. |
| `COURSES-WEAK-EXPORT-SERVICE-01` assignment CSV kind | `src/modules/courses/college-assessment-export-service.ts`, `tests/unit/chat7-college-assessment-export-service-weak.test.ts` | Kind-aware directory filter parity blocks quiz-only `results` and `CLOSED` assignment status before any service query. The previously reported export-pagination failures still need fresh CI verification; this is not proof they are green. |
| `COURSES7-07` result embargo | `src/modules/courses/learner-quiz-result-release-policy.ts`, `tests/unit/chat7-quiz-result-release-embargo.test.ts` | Server-clock strict release boundary: closed, explicitly published, valid past-or-equal due time; stale open-state flags never disclose answer keys. Authored; CI pending. |
| `PROJ-BREAK-LEARNER-91..94` project role journey | `tests/unit/PROJ-BREAK-chat7-learner-role-journey.test.ts` | Source and pure-model adversarial tests exercise forged learner ownership, forbidden completion, nonactive/archived role-state guards, tenant IDOR suppression and persisted actor enforcement. Not a substitute for transactional PostgreSQL concurrency tests. |

All prior failing unit tests are retained. The snapshot's failing cases have not been executed in this session; no release closure is asserted.

## Learner assessment and Projects HTTP route breaker batch (2026-10-18)

| Surface / handler | New direct route test | Observed contract and remediation | Status |
|---|---|---|---|
| POST `/api/courses/quizzes/[quizId]/submit` | `tests/unit/chat7-learner-assessment-route-boundaries.test.ts` — `COURSES7-07 prevents cross-origin quiz mutation before context, decoding, or submission` | CSRF denial precedes auth and service; server-derived actor and path ID forwarded exactly | Authored, not executed |
| POST `/api/courses/assignments/[assignmentId]/submit` | Same file — `COURSES7-08 prevents cross-origin assignment mutation before context or submission` | CSRF denial precedes auth and service; route does not trust an actor from the JSON body | Authored, not executed |
| GET `/api/courses/quizzes/[quizId]/my-attempts` | Same file — `COURSES7-07 and COURSES7-08 read only authenticated own results for the supplied delivery` | Added explicit `Cache-Control: private, no-store` to prohibit retention of released answer keys on shared caches | Source fixed, CI pending |
| GET `/api/courses/assignments/[assignmentId]/my-submission` | Same file — own results test | Added explicit `Cache-Control: private, no-store` to protect graded feedback and submission history | Source fixed, CI pending |
| GET `/api/courses/learner/workspace` | Same file — `COURSES7-08 learner workspace GET keeps private course progress uncached` | Added `Cache-Control: private, no-store`; service remains the scope and enrollment authorization boundary | Source fixed, CI pending |
| DELETE `/api/projects/[projectId]/tasks/[taskId]/learner-own` | `tests/unit/PROJ-BREAK-chat7-learner-task-route-boundaries.test.ts` — `PROJ-BREAK-LEARNER-95`, `98` | Cross-origin denied before actor/service, exact scoped ID delegated, response no-store | Authored, not executed |
| PATCH `/api/projects/[projectId]/tasks/[taskId]/learner-progress` | Same file — `PROJ-BREAK-LEARNER-96`, `99` | Cross-origin denied before service, authenticated actor and path-bound version payload forwarded | Authored, not executed |
| POST `/api/projects/[projectId]/tasks/[taskId]/learner-status` | Same file — `PROJ-BREAK-LEARNER-97`, `100`, `101` | CSRF, actor identity, denied status, error mapping via centralized helper; service remains persisted-role gate | Authored, not executed |

Remaining: real PostgreSQL concurrency cases, live role revocation between preflight and transaction, the other Courses API routes, Super Admin UI page-level browser checks, all Learner certificates and discussion transitions. Do not infer execution or passing coverage from authored tests alone.

## Learner discussion direct model suite (2026-10-18)

`tests/unit/chat7-learner-discussion-scope-and-race.test.ts` now exercises six direct behaviors: UUID-scoped remount keys across tenant/delivery switches, explicit-boolean posting capability, no whitespace or double-submits, the canonical 3,900-character persisted text cap, refresh ordering for overlapping requests, and response projection preserving authorized off-page pins without forwarding private fields. `learnerDiscussionMayPost` now delegates message validation to `learnerDiscussionDraftValid`, so oversized drafts do not begin requests guaranteed to fail server-side. No browser/DB runs were performed; discussion service tenant filters and moderation still require independent PostgreSQL checks.
