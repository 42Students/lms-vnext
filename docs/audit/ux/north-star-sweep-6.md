# NORTH STAR visual sweep — chat-6

Date: 2026-10-19. Target branch: `chatgpt/chat-6-b`. Baseline: `main` @ `371eb3168b5aa494ab29926e915003ee7a765d66`, fast-forwarded.

## Scope

The second third of the 111 routes in `docs/orchestrator/ui-ux/pages-admin.md` (entries 38–74), plus session revocation and auth handoff UI. Page contents and behavior stay unchanged. Shared components in `src/components/ui`, global tokens and shell are owned by chat-17/19/13 and must not be edited in this lane. Per `docs/design/old-lms-shell-spec.md`, `old-lms-shell.css`, `old-lms-pages.md`, `vnext-vs-old-lms-gap.md` and `legacy-styles/`: one white canvas, Inter, page title 30px/600 #172033, primary button #0a7c88 with white text, 36px height, 9px radius, slim borders and neutral token colours.

## Every assigned page (inventory)

| # | Route | File | Status |
| --- | --- | --- | --- |
| 38 | `/admin/inbound-mail` | `undefined` | To audit / sweep |
| 39 | `/admin/lecture-halls` | `undefined` | To audit / sweep |
| 40 | `/admin/lecture-halls/[hallId]` | `undefined` | To audit / sweep |
| 41 | `/admin/lessons` | `undefined` | To audit / sweep |
| 42 | `/admin/live-classes` | `undefined` | To audit / sweep |
| 43 | `/admin/module-access` | `undefined` | To audit / sweep |
| 44 | `/admin/organizations` | `undefined` | To audit / sweep |
| 45 | `/admin/people` | `undefined` | To audit / sweep |
| 46 | `/admin/people/directory` | `undefined` | To audit / sweep |
| 47 | `/admin/people/directory/[membershipId]` | `undefined` | To audit / sweep |
| 48 | `/admin/people/directory/[membershipId]/audit` | `undefined` | To audit / sweep |
| 49 | `/admin/people/unassigned` | `undefined` | To audit / sweep |
| 50 | `/admin/placements` | `undefined` | To audit / sweep |
| 51 | `/admin/placements/analytics` | `undefined` | To audit / sweep |
| 52 | `/admin/placements/applications` | `undefined` | To audit / sweep |
| 53 | `/admin/placements/applications/[applicationId]` | `undefined` | To audit / sweep |
| 54 | `/admin/placements/calendar` | `undefined` | To audit / sweep |
| 55 | `/admin/placements/drives` | `undefined` | To audit / sweep |
| 56 | `/admin/placements/hiring` | `undefined` | To audit / sweep |
| 57 | `/admin/placements/interviews` | `undefined` | To audit / sweep |
| 58 | `/admin/placements/interviews/[roundId]` | `undefined` | To audit / sweep |
| 59 | `/admin/placements/job-settings` | `undefined` | To audit / sweep |
| 60 | `/admin/placements/job-settings/[jobId]` | `undefined` | To audit / sweep |
| 61 | `/admin/placements/jobs/[jobId]` | `undefined` | To audit / sweep |
| 62 | `/admin/placements/jobs/[jobId]/applications` | `undefined` | To audit / sweep |
| 63 | `/admin/placements/jobs/[jobId]/schedule` | `undefined` | To audit / sweep |
| 64 | `/admin/placements/jobs/[jobId]/settings` | `undefined` | To audit / sweep |
| 65 | `/admin/placements/joining` | `undefined` | To audit / sweep |
| 66 | `/admin/placements/joining/[offerId]` | `undefined` | To audit / sweep |
| 67 | `/admin/placements/new` | `undefined` | To audit / sweep |
| 68 | `/admin/placements/offers` | `undefined` | To audit / sweep |
| 69 | `/admin/placements/offers/[offerId]` | `undefined` | To audit / sweep |
| 70 | `/admin/placements/retention` | `undefined` | To audit / sweep |
| 71 | `/admin/placements/screenings` | `undefined` | To audit / sweep |
| 72 | `/admin/placements/screenings/[applicationId]` | `undefined` | To audit / sweep |
| 73 | `/admin/placements/seasons` | `undefined` | To audit / sweep |
| 74 | `/admin/placements/seasons/[seasonId]` | `undefined` | To audit / sweep |

## Auth and sessions (inventory)

- `src/app/auth/handoff/page.tsx` — to audit/sweep.
- `src/app/auth/handoff/loading.tsx` — to audit/sweep.
- `src/app/auth/handoff/error.tsx` — to audit/sweep.
- `src/components/admin/admin-revoke-sessions.tsx` — to audit/sweep.
- `src/components/auth/session-response-guard.tsx` — to audit/sweep.

## Inspection and edit protocol

- Inspect each file's custom `bg-`, `text-`, `rounded-`, `shadow-`, `border-` and hard-coded hexadecimal styles. Replace page-scope hardcodes with shared `var(--lms-*)` token utilities, normalize primary/secondary button appearance and inputs; retain intentional semantic status colours.
- Respect existing `PageHeader` and authenticated layout's single `PageCanvas`. Do not add canvas nesting or restructure controls, tables, sections, copy, or authorization.
- Review locally imported `src/components/admin`, `src/components/placements`, and auth/session components for page-level styles. Do not change shared shell or components owned by other lanes.
- No app execution or CI. Keep TSX JSX syntax valid. Commit only on lane branch with `[chat-6]`.

## Completion ledger

Initial state: 37 page routes and 5 auth/session UI files pending inspection; update with changed paths and commits as edits land.
