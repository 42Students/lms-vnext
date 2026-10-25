# TPO prototype — 33-screen implementation and acceptance ledger

Reference: user-supplied `42LMS pages prototype-png-tpo(1).zip`, 33 PNGs, each 2880 px wide.
Reference is the **newest design**. The code's improved scoped permissions, verified data,
auditable writes, safety checks, failure handling, and existing richer workflows stay intact.

**Evidence rule:** An existing route/component is **not** visual or functional acceptance.
The explicit 33 screenshot comparisons, browser journeys, responsive captures, provider
integration and CI checks remain required. No screenshot is marked pixel-accepted here.

| # | Reference PNG | Current implementation entry / target | Verified in this effort |
|---|---|---|---|
| 01 | Companies › Today | `/tpo/companies/today`, `tpo-companies-today.tsx` | Focus route exists; detailed design and company-verification queue not accepted |
| 02 | Companies › Recruiters | `/tpo/recruiters`, `recruiter-leads-workspace.tsx` | Route exists; full comparison pending |
| 03 | Companies › Companies | `/tpo/companies?directory=1` | Route exists; full comparison pending |
| 04 | Agenda | `/tpo/companies/today?view=agenda` | NEW screen rendered from actual due and message data; tests added; browser acceptance pending |
| 05 | Brief | `/tpo/companies/today?view=brief` | NEW screen rendered from actual due and message data; tests added; browser acceptance pending |
| 06 | EmailSent | `/tpo/recruiters/campaigns/drafts/[campaignId]` plus provider receipts | Route exists; exact screenshot mapping/acceptance pending |
| 07 | Companies › Emails (a sent email open) | `/tpo/recruiters/campaigns/[batchId]` | Route exists; full comparison pending |
| 08 | Companies › Emails (writing a new email) | `/tpo/recruiters/campaigns/new` | Route exists; full comparison pending |
| 09 | Companies › Messages | `/tpo/messages?tab=recruiters` | Route exists; full comparison pending |
| 10 | Students › All students | `/tpo/students` | Route exists; full comparison pending |
| 11 | Students › Who’s in placements | `/tpo/batches` | Route exists; full comparison pending |
| 12 | Students › To verify | `/tpo/verification` | Route exists; full comparison pending |
| 13 | Students › Requests | `/tpo/requests` | Route exists; full comparison pending |
| 14 | Students › Announcements | `/tpo/announcements` | Route exists; full comparison pending |
| 15 | Drives | `/tpo/placements/lifecycle` | Route exists; full comparison pending |
| 16 | Drives › A recruiter's drive request | `/tpo/requests` / drive request within operations | Route/workflow exists; exact screen mapping pending |
| 17 | Drives › New drive (and edit) | `/tpo/placements/new`, `/tpo/placements/jobs/[jobId]/edit` | Routes exist; full comparison pending |
| 18 | Drive › Students (review one by one, share with company) | `/tpo/placements/jobs/[jobId]/applicants` | Route exists; full comparison pending |
| 19 | Drive › Rounds (results, slots) | `/tpo/placements/jobs/[jobId]/rounds` | Route exists; full comparison pending |
| 20 | Drive › Offers | `/tpo/placements/jobs/[jobId]/offers` | Route exists; full comparison pending |
| 21 | Drive day (at the gate) | `/tpo/drive-day/[roundId]` | Route exists; full comparison pending |
| 22 | Drive › Talk (recruiter, change requests, team) | `/tpo/placements/jobs/[jobId]/discussion`, `change-requests` | Routes exist; full comparison pending |
| 23 | Drive › About | `/tpo/placements/jobs/[jobId]/about` | Route exists; full comparison pending |
| 24 | Home | `/tpo/home` | Route exists; full comparison pending |
| 25 | Calendar | `/tpo/calendar` | Route exists; full comparison pending |
| 26 | Team › Chat | `/tpo/team`, `/tpo/messages?tab=team` | Routes exist; full comparison pending |
| 27 | Team › People | `/tpo/settings/team` | Route exists; full comparison pending |
| 28 | Reports | `/tpo/reports` | Route exists; full comparison pending |
| 29 | Reports › One report | `/tpo/reports/by-branch` and named reports | Routes exist; full comparison pending |
| 30 | Settings | `/tpo/settings`, `/tpo/settings/rules` | Routes exist; full comparison pending |
| 31 | Settings › Audit log | `/tpo/audit` | Route exists; full comparison pending |
| 32 | Everywhere search, bell, notifications, profile | global shell finder/bell; `/tpo/notifications`, `/tpo/profile` | Routes/components exist; full comparison pending |
| 33 | Companies › One recruiter (full page) | `/tpo/recruiters/[leadId]` | Route exists; full comparison pending |

## Current implementation delta

- **New**: dedicated Today Agenda and Brief variants; preserves Today Focus as the default.
- **New**: drill-through from a follow-up in either variant to that exact record in
  Focus with a strict UUID selector; alternative views use the same already scoped service.
- **New**: shared, unit-tested IST follow-up grouping and scope-preserving deep links.
- **Not yet closed**: the prototype Focus screenshot includes a **new-company verification**
  task/card. The current Focus feeds are recruiter replies and scheduled follow-ups;
  a verified company-onboarding queue is not yet integrated into that mixed priority list.
- **Not yet closed**: the screenshot shows an integrated Today reply/follow-up task list;
  current Focus shows replies above the follow-up workspace rather than in one selection list.
- **Not yet closed**: seven-day Brief/Agenda currently show limited data only; uncontacted
  recruiters are linked to the recruiter directory rather than displayed as a fabricated count.
- **Not yet closed**: exact typography, spacing, responsive/mobile behavior, design tokens,
  every CTA/modal, empty/loading/error/permission state, browser database round-trip,
  and screenshot-to-render comparison remain to be accepted **per PNG**.

## Follow-up acceptance gate

For each row capture the implemented screen at the prototype viewport and at 375 px,
compare geometry/content/state to the PNG, test keyboard navigation, every visible
CTA, permissions (including a separate college), API failure and retry, data retention
across refresh, and absence of invented counters/records. Record CI run/commit IDs.
Keep screenshot parity distinct from green unit tests. Never assign DONE solely from
an existing page path or an unexecuted test.
