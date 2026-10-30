# ChatGPT orchestration queue

> **ARCHIVED WORK QUEUE — NOT FOR CURRENT CHATS (2026-10-31).** The four-tab Claude/direct-push/patch-mode queue below is historical. Do not assign, execute, or calculate completion from it. The sole current plan is `docs/tracker.json`, with ten exclusive lanes and `execution.closureFirstProtocol`. Every ChatGPT session starts with `AGENTS.md` and `npm run progress -- --closure-next --lane=LNN`; choose one `done:false` task, close its exact executed acceptance gate, then freeze/move. After two unsuccessful passes, hand off the precise blocker and switch to an independent open task. Never reopen `done:true` without a demonstrated regression.


Claude orchestrates several ChatGPT chats (browser pane tabs). Each chat gets one work item at a time sized for about 30 minutes.

## Modes
- **Direct push** (chat 1 only, the owner pasted the standing order there): ChatGPT commits to main itself; Claude polls, pulls, runs typecheck, lint and tests, and fixes or reverts.
- **Patch mode** (chats 2 to 4): ChatGPT replies with whole files as `#### FILE: path` plus a fenced block; Claude applies them with `node scripts/orchestrator/apply-reply.mjs reply.md --write` (refuses protected paths), runs checks, then commits and pushes.

## Verification gate (every item)
`npx tsc --noEmit`, `npx eslint <changed paths>`, `npx vitest run tests/unit`, plus real-database tests when the item added one (`set -a; . ./.env.local; set +a; npx vitest run --config vitest.db.config.ts <file>`). Never claim DONE for a parity row; PARTIAL with an honest note.

## Items
| # | Chat tab | Item | Mode | Status |
| --- | --- | --- | --- | --- |
| 1 | tab-1 | College Admin Attendance center | direct push | DONE f7bb1c82 (+ repair 78e7bf11) |
| 5 | tab-1 | Super Admin Lecture Halls | direct push | sent |
| 2 | tab-2 | College Admin Projects aggregates (At Risk, Readiness, Submissions, Audit) | patch | part 1 applied 67423cd7; part 2 requested |
| 3 | tab-3 | Super Admin HR Accounts | patch | redirected (chat answered item 2 by mistake), part 1 requested |
| 4 | tab-4 | Placement calendar read side (TPO + College Admin) | patch | redirected (chat answered item 2 by mistake), part 1 requested |

## Backlog (send the next one when a chat finishes)
- Super Admin: Platform & auth settings, SMS settings, Course/Attendance/Placement settings, Operational caps (read/edit settings surfaces; auth-sensitive ones read-only).
- Super Admin: Feature Controls; Module Access hierarchy and access trace.
- Super Admin: Projects Templates list/new/overview/sprints/tasks/resources/colleges/versions.
- Super Admin: Lecture Halls, Attendance, Placement Calendar, Projects aggregates (reuse the College Admin services with platform scope).
- TPO: Students intelligence summary and roster filters; Requests tab; bulk Add to Drive; Reports gallery, placement summary, by branch.
- TPO: Company detail, Leads companies view, Round-focused Drive Day, Export applicants, Share with company.
- College Admin: Programs, Semesters, Batches, Classes dedicated surfaces; Batch Promotion; Faculty/Students pages; Hiring analytics.

## Lessons
- New chats can pick up other chats' tasks through ChatGPT memory; every message must restate that this conversation's first message is the only source, or use a temporary chat.
- ChatGPT cannot run tools (no GitHub DNS in its container): it must grep all consumers of anything it changes; Claude verifies tsc/eslint/tests after every commit and repairs.

## Progress log (2026-10-14 overnight)
Done and verified on main: 1 attendance, 5 SA lecture halls, 2+8 project aggregates (College and Super Admin), 4+9 placement calendars (TPO, College Admin, Super Admin), 3 SA HR accounts, 6 TPO reports (gallery, placement summary, by branch, CSV). In progress: 7 TPO students (read side committed, pages requested), 10 more TPO reports, 11 SA project templates (list/overview), 12 College Admin programs/semesters lists. Not applied yet: tests/integration/project-admin-aggregate-isolation.test.ts (chat 2 reply), tests/unit/super-admin-hr-validation.test.ts (chat 3 reply), the 672-line calendar service test (chat 4 reply).
Pitfall found: staged tables (placement_batch_registrations, placement_external_offers) are not migrated; guard with placementTableExists.

## Progress log (2026-10-14, morning handoff)
Applied, verified (tsc, eslint, unit tests, and a real-database test where a service reads data) and pushed to main, in order: 7 TPO Students + Requests + CSV, 13 College Admin attendance policy settings, 11b Super Admin template sub-views, 14 TPO export applicants, 15 TPO failure reasons + leads reports, 16 TPO audit log, 18 TPO companies directory + detail, 19 TPO profile + More, 20 TPO settings season/rules, 22 TPO settings team/trusted, 21 recruiter calendar, 23 Super Admin platform settings, 24 college readiness gate, 25 TPO messages (notification fallback), 26 TPO student notices (nothing persisted: delivered nothing, row stays MISSING), 27 What Companies See, 28 Feature Controls + Module Access hierarchy, 29 round-focused Drive Day, 30 TPO My Notifications, 31 Placement Branding, 32 HR company reports, 33 module access trace, 34 HR interview slots/messages (no migrated source: nothing), 35 HR profile grants, 36 TPO Recruiter access.
Dev (never prod) redeployed with image c2d5bd38 (before items 35 and 36); redeploy again to pick up the last two.
Remaining MISSING parity rows all need writes, external sending, file uploads or tables that are not migrated (see account-surface-parity.md). No browser acceptance has been done for any of these pages.
Pitfalls: ChatGPT prose sometimes trails the last FILE block (check the end of each applied file); Node ICU renders 'Sep' vs 'Sept' differently, keep date assertions tolerant; no JSX inside try/catch (react-hooks/error-boundaries); never name a variable module in tests (next lint rule); name collisions across parallel chats (rename the later file).
Tooling: scratchpad dump2reply.mjs converts a saved browser dump to an apply-reply file; pad tool output past ~50KB so it is saved to a file instead of entering context.
