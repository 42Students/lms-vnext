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
| 1 | tab-1 | College Admin Attendance center | direct push | sent, awaiting commit |
| 2 | tab-2 | College Admin Projects aggregates (At Risk, Readiness, Submissions, Audit) | patch | sent |
| 3 | tab-3 | Super Admin HR Accounts | patch | sent |
| 4 | tab-4 | Placement calendar read side (TPO + College Admin) | patch | sent |

## Backlog (send the next one when a chat finishes)
- Super Admin: Platform & auth settings, SMS settings, Course/Attendance/Placement settings, Operational caps (read/edit settings surfaces; auth-sensitive ones read-only).
- Super Admin: Feature Controls; Module Access hierarchy and access trace.
- Super Admin: Projects Templates list/new/overview/sprints/tasks/resources/colleges/versions.
- Super Admin: Lecture Halls, Attendance, Placement Calendar, Projects aggregates (reuse the College Admin services with platform scope).
- TPO: Students intelligence summary and roster filters; Requests tab; bulk Add to Drive; Reports gallery, placement summary, by branch.
- TPO: Company detail, Leads companies view, Round-focused Drive Day, Export applicants, Share with company.
- College Admin: Programs, Semesters, Batches, Classes dedicated surfaces; Batch Promotion; Faculty/Students pages; Hiring analytics.
