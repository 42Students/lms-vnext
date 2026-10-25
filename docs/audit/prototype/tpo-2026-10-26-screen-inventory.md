# TPO prototype — 33-screen implementation inventory (26 October 2026)

Source of truth: user-uploaded `42LMS pages prototype-png-tpo(1).zip`, 33 PNG screenshots.
The prototype is **newer** than the prior LMS, and its visible structure/interaction is the acceptance target.
Retain proven vNext behavior that is safer or stronger, without misrepresenting it as pixel acceptance.

**Evidence rule:** a route existing is not proof of prototype parity. Every row below remains `VISUAL/BEHAVIOR ACCEPTANCE OPEN` until a fresh same-viewport prototype-versus-runtime screenshot and interaction check is recorded. Source-level tests are not runtime acceptance.

| # | Prototype screenshot | vNext entry / expected backing | Current evidence and next check |
|---|---|---|---|
| 01 | Companies → Today | `/tpo/companies/today` | Focus queue and real actions exist; validate screenshot layout and all stage-specific cards |
| 02 | Companies → Recruiters | `/tpo/recruiters` | Recruiter workspace present; compare roster, filters, right inspector |
| 03 | Companies → Companies | `/tpo/companies?directory=1` | Directory present; compare summary, CRM company detail and actions |
| 04 | Agenda | `/tpo/companies/today?view=agenda` | Added real-data alternate view and `day=0..6` selection; needs browser and visual comparison |
| 05 | Brief | `/tpo/companies/today?view=brief` | Added real-data Answer/Reach/Week panels; needs browser and visual comparison |
| 06 | EmailSent | `/tpo/recruiters/campaigns/drafts/[campaignId]` or sent ledger detail | Verify actual sent receipts and provider semantics |
| 07 | Companies → Emails (sent email open) | `/tpo/recruiters/campaigns/drafts/[campaignId]` | Verify sent detail, recipients, follow-up actions |
| 08 | Companies → Emails (writing a new email) | `/tpo/recruiters/campaigns/new` | Verify composer, save, send/disable states, templates and actual provider |
| 09 | Companies → Messages | `/tpo/messages?tab=recruiters` | Verify inbox list, selected thread, read/reply state |
| 10 | Students → All students | `/tpo/students` | Verify filterable student table and detail |
| 11 | Students → Who's in placements | `/tpo/batches` | Verify batch lifecycle, invitation, count semantics |
| 12 | Students → To verify | `/tpo/verification` | Verify staff authorization, bulk and individual actions |
| 13 | Students → Requests | `/tpo/requests` | Verify request triage and state transitions |
| 14 | Students → Announcements | `/tpo/announcements` | Verify compose, targeting and receipts |
| 15 | Drives | `/tpo/placements/lifecycle` | Verify drive list, lifecycle filters and actions |
| 16 | Drives → A recruiter's drive request | `/tpo/requests` / drive change-request flow | Verify requested drive review, approval and safe decline |
| 17 | Drives → New drive (and edit) | `/tpo/placements/new`, `/tpo/placements/jobs/[jobId]/edit` | Verify form fields, save/publish, validation |
| 18 | Drive → Students (review and share) | `/tpo/placements/jobs/[jobId]/applicants` | Verify shortlist, one-by-one review and sharing |
| 19 | Drive → Rounds (results and slots) | `/tpo/placements/jobs/[jobId]/rounds` | Verify schedule, round results and slot allocation |
| 20 | Drive → Offers | `/tpo/placements/jobs/[jobId]/offers` | Verify issue, state transitions and acceptance |
| 21 | Drive day (at the gate) | `/tpo/drive-day` | Verify attendance/no-show and source freshness |
| 22 | Drive → Talk (recruiter/change requests/team) | `/tpo/placements/jobs/[jobId]/discussion` | Verify all three threads and authorization |
| 23 | Drive → About | `/tpo/placements/jobs/[jobId]/about` | Verify company/drive details and edits |
| 24 | Home | `/tpo/home` | Verify live work cards and pending needs |
| 25 | Calendar | `/tpo/calendar` | Verify events, blocked dates and filters |
| 26 | Team → Chat | `/tpo/team`, `/tpo/messages?tab=team` | Verify private thread/ask/decision operations |
| 27 | Team → People | `/tpo/settings/team` | Verify roster, roles and availability |
| 28 | Reports | `/tpo/reports` | Verify report navigation, filtered data and exports |
| 29 | Reports → One report | `/tpo/reports/[slug]` | Verify selected report against screenshot |
| 30 | Settings | `/tpo/settings` | Verify settings sections, inputs and persistence |
| 31 | Settings → Audit log | `/tpo/audit` | Verify filters, actor rows, pagination and exports |
| 32 | Everywhere search, bell, notifications, profile | Shared authenticated shell, `/tpo/find`, `/tpo/notifications`, `/tpo/profile` | Verify overlays, counts, keyboard, profile flows |
| 33 | Companies → One recruiter (full page) | `/tpo/recruiters/[leadId]` | Verify recruiter history, updates and access restrictions |

## Implementation currently committed for screenshots 01, 04 and 05

- `src/components/tpo/tpo-today-alternate-views.tsx`: real-data Agenda and Brief, separate presentation layouts, links to existing message and follow-up workflows
- `src/app/(authenticated)/tpo/companies/today/page.tsx`: accepts validated `view`, Agenda `day`, and focus `lead`; reads college-scoped CRM and recruiter message sources independently
- `src/components/tpo/tpo-companies-today.tsx`: select a particular focus follow-up from the alternate views
- `src/modules/placements/tpo-companies-today-model.ts`: stable IST day grouping, bounded seven-day links, uncontacted summary based on real stage and owner
- `tests/unit/tpo-today-prototype-views.test.ts`: unit/source contracts, not yet evidence of a green runtime run

## Known acceptance boundaries

1. GitHub Actions runs for rapid sequential `main` commits have been superseded/cancelled; no green CI claim is made in this inventory.
2. Both Today feed sources are page-limited; the UI must show when the preview is incomplete, rather than pretend its totals are exhaustive.
3. "Not contacted" means recruiter stage `NEW`, never merely a missing scheduled follow-up. My Work includes genuinely unassigned and actor-owned leads only, Everyone remains college-scoped.
4. CRM actions must not claim an email was sent or delivered without an actual provider receipt. Message replies and bulk email campaign receipts are separate ledgers.
5. Same-viewport screenshot acceptance for all 33 remains open, including 01/04/05, even when their data pathways are implemented.
