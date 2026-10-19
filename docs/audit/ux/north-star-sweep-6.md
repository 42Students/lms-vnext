# NORTH STAR visual sweep — chat-6

Date: 2026-10-19. Target branch: `chatgpt/chat-6-b`. Baseline: `main` @ `371eb3168b5aa494ab29926e915003ee7a765d66`, fast-forwarded.

## Scope

The second third of the 111 routes in `docs/orchestrator/ui-ux/pages-admin.md` (entries 38–74), plus session revocation and auth handoff UI. Page contents and behavior stay unchanged. Shared components in `src/components/ui`, global tokens and shell are owned by chat-17/19/13 and must not be edited in this lane. Per `docs/design/old-lms-shell-spec.md`, `old-lms-shell.css`, `old-lms-pages.md`, `vnext-vs-old-lms-gap.md` and `legacy-styles/`: one white canvas, Inter, page title 30px/600 #172033, primary button #0a7c88 with white text, 36px height, 9px radius, slim borders and neutral token colours.

## Every assigned page (inventory)

| # | Route | File | Status |
| --- | --- | --- | --- |
| 38 | `/admin/inbound-mail` | `src/app/(authenticated)/admin/inbound-mail/page.tsx` | To audit / sweep |
| 39 | `/admin/lecture-halls` | `src/app/(authenticated)/admin/lecture-halls/page.tsx` | To audit / sweep |
| 40 | `/admin/lecture-halls/[hallId]` | `src/app/(authenticated)/admin/lecture-halls/[hallId]/page.tsx` | To audit / sweep |
| 41 | `/admin/lessons` | `src/app/(authenticated)/admin/lessons/page.tsx` | To audit / sweep |
| 42 | `/admin/live-classes` | `src/app/(authenticated)/admin/live-classes/page.tsx` | To audit / sweep |
| 43 | `/admin/module-access` | `src/app/(authenticated)/admin/module-access/page.tsx` | To audit / sweep |
| 44 | `/admin/organizations` | `src/app/(authenticated)/admin/organizations/page.tsx` | To audit / sweep |
| 45 | `/admin/people` | `src/app/(authenticated)/admin/people/page.tsx` | To audit / sweep |
| 46 | `/admin/people/directory` | `src/app/(authenticated)/admin/people/directory/page.tsx` | To audit / sweep |
| 47 | `/admin/people/directory/[membershipId]` | `src/app/(authenticated)/admin/people/directory/[membershipId]/page.tsx` | To audit / sweep |
| 48 | `/admin/people/directory/[membershipId]/audit` | `src/app/(authenticated)/admin/people/directory/[membershipId]/audit/page.tsx` | To audit / sweep |
| 49 | `/admin/people/unassigned` | `src/app/(authenticated)/admin/people/unassigned/page.tsx` | To audit / sweep |
| 50 | `/admin/placements` | `src/app/(authenticated)/admin/placements/page.tsx` | To audit / sweep |
| 51 | `/admin/placements/analytics` | `src/app/(authenticated)/admin/placements/analytics/page.tsx` | To audit / sweep |
| 52 | `/admin/placements/applications` | `src/app/(authenticated)/admin/placements/applications/page.tsx` | To audit / sweep |
| 53 | `/admin/placements/applications/[applicationId]` | `src/app/(authenticated)/admin/placements/applications/[applicationId]/page.tsx` | To audit / sweep |
| 54 | `/admin/placements/calendar` | `src/app/(authenticated)/admin/placements/calendar/page.tsx` | To audit / sweep |
| 55 | `/admin/placements/drives` | `src/app/(authenticated)/admin/placements/drives/page.tsx` | To audit / sweep |
| 56 | `/admin/placements/hiring` | `src/app/(authenticated)/admin/placements/hiring/page.tsx` | To audit / sweep |
| 57 | `/admin/placements/interviews` | `src/app/(authenticated)/admin/placements/interviews/page.tsx` | To audit / sweep |
| 58 | `/admin/placements/interviews/[roundId]` | `src/app/(authenticated)/admin/placements/interviews/[roundId]/page.tsx` | To audit / sweep |
| 59 | `/admin/placements/job-settings` | `src/app/(authenticated)/admin/placements/job-settings/page.tsx` | To audit / sweep |
| 60 | `/admin/placements/job-settings/[jobId]` | `src/app/(authenticated)/admin/placements/job-settings/[jobId]/page.tsx` | To audit / sweep |
| 61 | `/admin/placements/jobs/[jobId]` | `src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx` | To audit / sweep |
| 62 | `/admin/placements/jobs/[jobId]/applications` | `src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx` | To audit / sweep |
| 63 | `/admin/placements/jobs/[jobId]/schedule` | `src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx` | To audit / sweep |
| 64 | `/admin/placements/jobs/[jobId]/settings` | `src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx` | To audit / sweep |
| 65 | `/admin/placements/joining` | `src/app/(authenticated)/admin/placements/joining/page.tsx` | To audit / sweep |
| 66 | `/admin/placements/joining/[offerId]` | `src/app/(authenticated)/admin/placements/joining/[offerId]/page.tsx` | To audit / sweep |
| 67 | `/admin/placements/new` | `src/app/(authenticated)/admin/placements/new/page.tsx` | To audit / sweep |
| 68 | `/admin/placements/offers` | `src/app/(authenticated)/admin/placements/offers/page.tsx` | To audit / sweep |
| 69 | `/admin/placements/offers/[offerId]` | `src/app/(authenticated)/admin/placements/offers/[offerId]/page.tsx` | To audit / sweep |
| 70 | `/admin/placements/retention` | `src/app/(authenticated)/admin/placements/retention/page.tsx` | To audit / sweep |
| 71 | `/admin/placements/screenings` | `src/app/(authenticated)/admin/placements/screenings/page.tsx` | To audit / sweep |
| 72 | `/admin/placements/screenings/[applicationId]` | `src/app/(authenticated)/admin/placements/screenings/[applicationId]/page.tsx` | To audit / sweep |
| 73 | `/admin/placements/seasons` | `src/app/(authenticated)/admin/placements/seasons/page.tsx` | To audit / sweep |
| 74 | `/admin/placements/seasons/[seasonId]` | `src/app/(authenticated)/admin/placements/seasons/[seasonId]/page.tsx` | To audit / sweep |

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
