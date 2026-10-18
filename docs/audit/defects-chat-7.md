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
