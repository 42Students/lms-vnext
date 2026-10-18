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
