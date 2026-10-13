# ChatGPT orchestration queue

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
