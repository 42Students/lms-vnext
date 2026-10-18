# Chat-7 adversarial defect log — 2026-10-18

Owner lanes: chat-7 learner courses + Learner/Faculty Projects journeys; chat-14 remains overall Projects ledger owner. Each row identifies a persisted defect fixed on `chatgpt/chat-7-b`. **Tests authored but not executed** in this connector-only session. Defects require an independent lane review and green PostgreSQL/CI before they can be treated as production-verified.

| ID | Severity | Reproduction / invalid state | Fix (commit) | Regression |
|---|---|---|---|---|
| PROJ7-01 | MAJOR | Learner creates TODO/IN_PROGRESS task while persisting nonempty blockerReason; non-blocked record still reports blocker. Former create schema checked only missing blocked notes. | Extract strict `learnerOwnTaskCreateInputSchema` and reject contradictory note; `c60a288`, `b01e020`. | `PROJ-BREAK-LEARNER-01.test.ts` |
| PROJ7-02 | MAJOR | Learner status update `BLOCKED` with no reason, or `TODO` with leftover blockerNote, previously reached service before rejection/clearing. | Validate discriminated command before mutation; `672421e`. | `PROJ-BREAK-LEARNER-01.test.ts` |
| PROJ7-03 | MAJOR | Faculty/Mentor meeting client converts impossible dates (e.g. 2026-02-30) through `Date.parse`, silently rescheduling to March. | Calendar-exact IST input validation; `b77d8f0`. | `PROJ-BREAK-FACULTY-01.test.ts` |
| PROJ7-04 | MAJOR | Faculty/Mentor transition of BLOCKED task to IN_PROGRESS/TODO retained historical blockerReason. Entering BLOCKED could reuse prior stale note. | Clear blockerReason on unblocked transition; require new meaningful blocker note on block; `f5e2782`, `54df217`. | `PROJ-BREAK-FACULTY-01.test.ts` |
| COURSES7-01 | BLOCKER — tenant inference | Super Admin lesson bulk-visibility counts were gathered by caller-supplied lesson IDs before applying acting-college conditions. Forged foreign IDs could influence `matchedContents`, `unchanged` response counts even though per-record mutations were scoped. | Joined content → lesson → offering → course → department/period and required both college IDs equal acting scope; `fed5431`. | `chat7-superadmin-course-tenant-bulk.test.ts` (query contract; actual DB IDOR still pending) |
| COURSES7-02 | MAJOR — error exposure | Three bulk course/lesson visibility writers forwarded caught `Error.message` (including SQL/provider messages) to API failure rows. | Shared safe mapper, applied in College and Super Admin services; `c1329f2`, `2be68e7`, `5c8755e`, `da2aca0`. | `chat7-superadmin-course-tenant-bulk.test.ts` |
| COURSES7-03 | BLOCKER — SQL | `listCollegeCourseSetupRelations` delivery query inner-joined `academicPeriods` twice without an alias, causing PostgreSQL duplicate relation name at runtime. | Removed duplicate join; `4c3dedb`. | `chat7-college-course-setup-weak.test.ts`; integration SQL required |
| COURSES7-04 | MAJOR — stale college selection | Super Admin authoring kept a lesson ID from previous acting college, leaving current tenant's content composer empty until manually changing select. | Reconcile selection only against new authorized lesson list; `ba5ae58`, `4712b0c`, `214889d`. | `chat7-superadmin-course-authoring-break.test.ts` |
| COURSES7-05 | UX MAJOR | Course and lesson bulk selection scrollbars were globally hidden; long lists had no vertical affordance and 40px controls. | Shared vertical `ScrollCue`, 44px controls; `b972a76`, `1b63f32`. | Covered by previous and follow-up UX tests |

## Open verification gates

1. Require an independent breaker to reproduce/confirm the expected failure on prior branch and verify fixes in a real PostgreSQL database, not just source assertions.
2. Run `npx vitest run` for the named files, strict TypeScript, source coverage scripts, 320/375/768px browser tours, actor-swap/expired-session/duplicate-submit probes.
3. Do not mark the Projects role matrix or courses endpoint matrix 100% based on this subset; `docs/audit/coverage/chat7-learner-course-file-inventory.md` enumerates remaining work.


## New high-risk findings in the 2026-10-18 learner hardening pass

All rows below are **implemented on the lane branch but not yet green-CI or PostgreSQL verified**. The code changes and subsequent policy corrections are real; independent breaker review and integration checks remain mandatory.

| ID | Severity | Evidence / attempted break | Code commit | Behavioural regression |
|---|---|---|---|---|
| COURSES7-06 | BLOCKER — result fairness | Learner assessment overview propagated `resultsPublished=true` for `PUBLISHED` quizzes, while the authoritative attempt service only released for `CLOSED && resultsPublished`. The RESULTS facet could advertise unavailable results. | `74ef887`, `a9216c7` | `chat7-learner-assessment-result-release.test.ts`, `chat7-learner-quiz-discussion-guard-coverage.test.ts` |
| COURSES7-07 | RETRACTED — policy correction | A proposed per-delivery attempt filter was reverted: quiz max-attempt quotas are per `(quiz, membership)` across section transfers. Keep access checked against the requested delivery but keep the learner’s own history and quota consistent. No cross-tenant read is permitted. | `0ab6990` reverted by `ce841f5`; `8090ff4` tests | `chat7-learner-results-service-scoping.test.ts` |
| COURSES7-08 | RETRACTED — policy correction | A proposed per-delivery submission filter was reverted: a shared assignment has one submission per `(assignment, membership)` regardless of section transfer; hiding prior own work would leave submit blocked by the unique constraint. Current delivery is still authorized before reading. | `ee4ca56` reverted by `97cd0e5`; `8090ff4` tests | `chat7-learner-results-service-scoping.test.ts` |
| PROJ7-05 | BLOCKER — lifecycle integrity | A learner could delete an own TODO task in a still-ACTIVE sprint after parent release reached SHIPPED, because deletion checked sprint state but not the parent release. | `d80f730` | `PROJ-BREAK-LEARNER-RELEASE-01.test.ts` |
| COURSES7-09 | HIGH — stale assignment form | React reused the same assignment form component when a drawer or course delivery changed, allowing an unsent answer/method selection from the previous assignment to persist on the next form. Key the component by exact delivery + assignment to fully reset local state. | `2e1d947`, `70b8b60` | Additional mounted React UI race test **OPEN**; static source check pending |
| SA-courses-visibility-01 | HIGH — stale Super Admin course bulk selection | Switching acting college or filter/page could retain course selections in local state and submit stale IDs; backend scoped writes but frontend showed invalid counts and avoidable denied operations. Key UI by acting college + visible IDs; re-filter all bulk requests and controls to visible course IDs. | `2ea0875`, `fc3c9e6` | `chat7-superadmin-course-bulk-page-isolation.test.ts`; PostgreSQL actor-switch test **OPEN** |
| COURSES7-10 | HIGH — learner deadline misdirection | Learner Course Home labelled expired assignments as “late submission available” and promoted them as actionable despite the submission service rejecting deadlines under the DB lock. Removed overdue priority and uses strict future due dates. | `4b0801f` | `chat7-learner-overview-deadline-parity.test.ts` |
| PROJ7-06 | HIGH — optimistic concurrency | Learner backlog pull used direct timestamp equality for a PostgreSQL `updated_at`, incompatible with millisecond-token semantics when database stores microseconds; valid tabs could fail CAS. | `2211d79`, `2e317b7` | `PROJ-BREAK-LEARNER-BACKLOG-01.test.ts` |

### Typechecking maintenance

`chat7-course-resource-materials-weak.test.ts` and `chat7-learner-assignment-methods-weak.test.ts` were given sound type annotations/casts without dropping any behavioural assertion (`48483d9`, `1ec962e`). Four project route recovery fixture failures from the current CI snapshot were corrected to agree with the expected safe recovery copy (`e99883f`). These changes **do not prove the CI job is green**.

### Remaining release gates

- Real PostgreSQL integration: cross-tenant actor swaps, expired sessions, same-millisecond concurrent retries, release shipment races, grade publication races, disk/storage failures.
- Executable Vitest and TypeScript runs of these additions; the GitHub connector can mutate source but does not provide a checked-out npm environment. Re-run the branch CI and investigate new failures before merging.
- Exhaustive courses ledger (336 source files, 871 exported symbols in the latest weak-area inventory) is not closed. The separate `docs/audit/coverage/courses-ledger.md` states known evidence and outstanding matrix explicitly; do not report 100% coverage.

## Follow-up: learner Projects and assessment regressions after main sync (18 October 2026)

| Gap | Severity | Repro / root cause | Fix and test | Remaining independent proof |
|---|---|---|---|---|
| PROJ-BREAK-LEARNER-ACTOR-02 | Critical, session and tenancy | In learner own-task create/delete, backlog pull, and task progress/reorder, the initial Projects actor/grant check ran outside the write transaction. The persisted learner project membership could be revoked/disabled or transfer between the read and subsequent transaction; there was no common transactional recheck. | `learner-mutation-guard.ts`, called under project lock by all 4 writes; `PROJ-BREAK-LEARNER-ACTOR-02.test.ts`, `PROJ-BREAK-LEARNER-RELEASE-01.test.ts`, `PROJ-BREAK-LEARNER-BACKLOG-03.test.ts` | Real concurrent membership UPDATE racing transaction; DB integration and independent breaker |
| PROJ-BREAK-LEARNER-RELEASE-RACE-03 | Critical, lifecycle race | Learner backlog pull, own-task creation, task status and progress checked the release without a row lock, potentially racing concurrent SHIPPED mutation after the check. | Shared release row lock used in each mutation, with regression in `PROJ-BREAK-LEARNER-BACKLOG-03.test.ts` and source checks; test enforces shipped rejection | Real PG share-lock vs update/ship race, lock-order deadlock probe |
| COURSES7-RESULT-RELEASE-11 | Critical, assessment fairness | Learner quiz detail required closed + resultsPublished + due reached for answer keys; learner attempt history/overview had weaker guards, allowing unreleased-before-due scores in inconsistent persisted states. | `learner-quiz-result-release-policy.ts` now shared across quiz detail, attempt history and overview; `COURSES-BREAK-LEARNER-RESULT-11.test.ts` plus scope tests | Real Faculty early close/release race; unit CI; verify historic records |
| COURSES7-SECTION-TRANSFER-12 | High, result correctness | `listOwnLearnerAssessmentRows` ignored a prior section's own shared assignment submission and counted quiz attempts only in the current delivery, despite persisted unique/attempt quota being global per assessment and membership. This made old submissions look pending and attempt remaining counts inflated after a section change. | Removed delivery predicate only from own persisted submission join and own quiz attempt subqueries; retained authorized current delivery outer query; `COURSES-BREAK-SECTION-TRANSFER-12.test.ts` | Real two-section transfer with learner and faculty accounts, role/tenant IDOR, PostgreSQL counts |

### Version control
The current `main` was integrated into `chatgpt/chat-7-b` via PR 169 (`7824cea`) before these follow-up changes. Cloud test snapshots in `docs/orchestrator/typecheck-errors-latest.md` and `unit-failures-latest.md` are snapshots from `main`, not proof that the new branch changes passed. Retain every failing test and fix its real contract. **Do not close this lane without the exhaustive ledger's OPEN rows, new cloud verification and PostgreSQL races being resolved.**

## Unit-failure triage and additional learner hardening (18 October 2026)

The complete cloud unit-job logs (not just truncated `unit-failures-latest.md`) confirmed the following issues. All code fixes are on the chat-7 branch, but **CI has not reported green for this branch**.

| ID / failing test | Root cause and repair | Commits |
|---|---|---|
| COURSES-WEAK-EXPORT-SERVICE-01 (two tests) | Aggregate mock received missing `kind` and missing `query.page`. Export now explicitly calls the context/kind/query service for every capped page, and the test's mock boundary forwards all three arguments while retaining all 1,000-row and CSV assertions. | `2561565`, `f87d639` |
| COURSES-WEAK-DELIVERY-ROSTER-01 | Fragile single-line source substring did not match formatted `eq(sectionEnrollments.academicPeriodId, scope.academicPeriodId)`. Whitespace-insensitive regex still requires the exact equality; other tenant and learner role assertions remain. | `fe64c88` |
| COURSES-WEAK-RESOURCE-MATERIALS-01 | Zod 4 `safeParse` executed a refinement on an invalid URL and threw `TypeError: Invalid URL`. URL refinement now catches invalid URL construction and returns false; invalid resource links are still rejected. `ProcessEnv` fixture typing also corrected. | `8329ef0`, `b4f410c` |
| LEARNER-placements-47 | Listed in stale snapshot; the inspected newer workflow job log shows its three tests passed. Hardened URL action projection further against embedded credentials/fragments and added corresponding assertions. | `af77e88`, `544d104` |

**Validation:** Draft PR [#175](https://github.com/42Students/lms-vnext/pull/175) triggered a cloud CI run, but the unit/typecheck/lint/build jobs were queued on last inspection. Until results arrive, do not claim zero failures. No test was weakened, disabled or deleted.

**Projects continuation:** `PROJ-BREAK-LEARNER-SCALE-05` replaces repeated per-project task filtering/sorting with a linear earliest-due aggregation and a Set of eligible project IDs, paired with `PROJ-BREAK-LEARNER-DUE-05.test.ts` at 1,000 projects. `PROJ-BREAK-LEARNER-PROGRESS-04.test.ts` exercises revoked/wrong-role actor, forged project IDs, dedupe and empty states. `PROJ-BREAK-LEARNER-RELEASE-RACE-03` now accepts only mutable release states under row locks. PostgreSQL race and independent breaker checks remain open.

### Subsequent main snapshot after 473-commit synchronization

The refreshed `unit-failures-latest.md` on main listed two additional lane-7 failures that were absent from the immediately preceding snapshot:

- `COL-projects-legacy-01`: College Projects `PageHeader` was again titled `Project workspaces` on the unauthenticated-college, invalid-filter and normal states, contrary to the exact `Workspaces` legacy test. Repaired all three source titles in `8e944e7`.
- `COURSES7-07/08`: `chat7-learner-results-service-scoping.test.ts` release-positive fixture supplied `status=CLOSED` and `resultsPublished=true` but omitted the persisted `dueAt` now required by the common quiz embargo rule. Added an elapsed due timestamp to the fixture rather than relaxing result secrecy in `4bafe06`.

No test was weakened, disabled or deleted. This branch still requires an executed unit/typecheck/build run. Draft PR #175 is CI-only and must not be merged for release based on these source fixes alone.


## Late chat-7 breaker findings: private response caching, retries, and discussion UX (2026-10-18)

Source committed on `chatgpt/chat-7-b`, **not CI or database verified**.

| ID | Risk before fix | Corrective source / direct test | Residual gate |
|---|---|---|---|
| COURSES7-07/08 | Private quiz attempt answers and assignment grades GET responses lacked explicit anti-cache headers | `src/app/api/courses/quizzes/[quizId]/my-attempts/route.ts`, `assignments/[assignmentId]/my-submission/route.ts`; `tests/unit/chat7-learner-assessment-route-boundaries.test.ts` | Browser/proxy header verification and role/college switch |
| COURSES7-09 | Learner roster, course workspace and content-progress GET lacked explicit no-store; authenticated progress data could remain in shared caches | `src/app/api/courses/learner/route.ts`, `learner/workspace/route.ts`, `progress/[contentId]/route.ts`; `tests/unit/chat7-learner-course-progress-route-privacy.test.ts` | Live browser cache and session revocation tests |
| COURSES7-11 | Discussion guard permitted over-3,900-character input even though persisted messages reject them | `src/modules/courses/learner-discussion-submit-guard-model.ts` now reuses `learnerDiscussionDraftValid`; `tests/unit/chat7-learner-discussion-scope-and-race.test.ts` | Browser submit/refresh race and PostgreSQL moderation checks |
| SA-academics-people-52/53 | Bulk visibility Retry failed replayed successfully changed courses after partial failure | Bulk service returns selected-college `failedCourseIds`; client re-sends only that subset; `chat7-final-sprint-superadmin-course-visibility.test.ts` | Real tenant swap and content-version CAS races |
| SA-academics-people-62 | Older stored public links could render credentials or URL fragments in Super Admin content preview | `super-admin-content-public-link-model.ts`, `chat7-superadmin-content-public-link-safety.test.ts` | Browser external link verification; storage scanning separate |
| COURSES-WEAK-EXPORT-SERVICE-01 | Assignment CSV accepted quiz-only results and CLOSED filter before query | `college-assessment-export-service.ts` validates kind-aware filter before read; extended `chat7-college-assessment-export-service-weak.test.ts` | Full 1,000-row CSV live fixture and cloud CI |
| PROJ-BREAK-LEARNER-91..101 | Needed explicit coverage for forged actor/task status and learner task route origin and error boundaries | `tests/unit/PROJ-BREAK-chat7-learner-role-journey.test.ts`, `tests/unit/PROJ-BREAK-chat7-learner-task-route-boundaries.test.ts` | PostgreSQL transaction races and independent Projects master ledger review |

All existing tests remain present and unchanged in intent. The originally listed chat-7 failing unit tests require a new CI verdict before clearing their failure status.
