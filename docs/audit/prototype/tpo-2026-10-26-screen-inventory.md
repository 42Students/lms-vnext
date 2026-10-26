# TPO prototype — 33-screen implementation inventory (26 October 2026)

Source of truth: user-uploaded `42LMS pages prototype-png-tpo(1).zip`, 33 PNG screenshots.
The prototype is **newer** than the prior LMS, and its visible structure/interaction is the acceptance target.
Retain proven vNext behavior that is safer or stronger, without misrepresenting it as pixel acceptance.

**Evidence rule:** a route existing is not proof of prototype parity. Every row below remains `VISUAL/BEHAVIOR ACCEPTANCE OPEN` until a fresh same-viewport prototype-versus-runtime screenshot and interaction check is recorded. Source-level tests are not runtime acceptance.

| # | Prototype screenshot | vNext entry / expected backing | Current evidence and next check |
|---|---|---|---|
| 01 | Companies → Today | `/tpo/companies/today` | Focus queue and real actions exist; validate screenshot layout and all stage-specific cards |
| 02 | Companies → Recruiters | `/tpo/recruiters` | Added source-backed selected-contact inspector; exact-viewport and interaction comparison remain open |
| 03 | Companies → Companies | `/tpo/companies?directory=1` | Added selected-company inspector with real contacts, drives, accepted offers and confirmed joins; historical comparison and visual acceptance remain open |
| 04 | Agenda | `/tpo/companies/today?view=agenda` | Added real-data alternate view and `day=0..6` selection; needs browser and visual comparison |
| 05 | Brief | `/tpo/companies/today?view=brief` | Added real-data Answer/Reach/Week panels; needs browser and visual comparison |
| 06 | EmailSent | `/tpo/recruiters/campaigns/drafts/[campaignId]` or sent ledger detail | Shared split-view campaign sidebar and real provider receipts; screenshot and provider verification remain open |
| 07 | Companies → Emails (sent email open) | `/tpo/recruiters/campaigns/drafts/[campaignId]` | Added split list/detail layout with actual campaign status and recipient receipts; runtime acceptance still open |
| 08 | Companies → Emails (writing a new email) | `/tpo/recruiters/campaigns/new` | Added split list/composer, four draft-wording presets and Insert tokens; two-step send and provider acceptance still need live testing |
| 09 | Companies → Messages | `/tpo/messages?tab=recruiters` | Added searchable template selection, preview and non-sending insertion into draft; thread interactions and screenshots remain unaccepted |
| 10 | Students → All students | `/tpo/students` | **Code updated:** selected student right-side preview with actual verification/journey/counts; advanced drawer retained on demand. Runtime and visual acceptance open |
| 11 | Students → Who's in placements | `/tpo/batches` | **Code updated:** source-backed batch decision table with selected batch panel; older cards retained in Advanced. Authenticated UI, lifecycle actions and visual comparison still need acceptance |
| 12 | Students → To verify | `/tpo/verification` | **Code updated:** visible verification queue and selected evidence summary; original private review drawer and bulk/table tools retained. Runtime document interaction and visual acceptance open |
| 13 | Students → Requests | `/tpo/requests` | **Code updated:** authorized selected-request list/detail with persisted decision control; bulk tools/table retained in Advanced. Runtime and visual acceptance open |
| 14 | Students → Announcements | `/tpo/announcements` | **Code updated:** grouped searchable page-scoped sidebar, selected detail, existing edit/delete/read/delivery actions. Runtime and visual acceptance open |
| 15 | Drives | `/tpo/placements/lifecycle` | **Code updated:** compact prototype operations list with action links, authorized recruiter request cards above tabs, advanced grid retained. Browser and visual acceptance open |
| 16 | Drives → A recruiter's drive request | `/tpo/placements/lifecycle?view=REQUESTS&request=[id]` | **Code updated:** selected recruiter request pane with persisted facts, optional change comparison, and real approve-to-draft/send-back/decline control. Exact-viewport and live decision acceptance open |
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
| 30 | Settings | `/tpo/settings` | Inline sentence-style placement rules, Save/Discard and collapsed advanced policy details; persistence and visual acceptance remain open |
| 31 | Settings → Audit log | `/tpo/audit` | Verify filters, actor rows, pagination and exports |
| 32 | Everywhere search, bell, notifications, profile | Shared authenticated shell, `/tpo/find`, `/tpo/notifications`, `/tpo/profile` | Verify overlays, counts, keyboard, profile flows |
| 33 | Companies → One recruiter (full page) | `/tpo/recruiters/[leadId]` | Verify recruiter history, updates and access restrictions |

## Material implementation coverage (code only; not screenshot acceptance)

- `src/components/tpo/tpo-today-alternate-views.tsx`: real-data Agenda and Brief, separate presentation layouts, links to existing message and follow-up workflows
- `src/app/(authenticated)/tpo/companies/today/page.tsx`: accepts validated `view`, Agenda `day`, and focus `lead`; reads college-scoped CRM and recruiter message sources independently
- `src/components/tpo/tpo-companies-today.tsx`: select a particular focus follow-up from the alternate views
- `src/modules/placements/tpo-companies-today-model.ts`: stable IST day grouping, bounded seven-day links, uncontacted summary based on real stage and owner
- `tests/unit/tpo-today-prototype-views.test.ts`: unit/source contracts, not yet evidence of a green runtime run
- #03: `tpo-companies-spreadsheet.tsx` now shows a selected-company inspector without attributing unlinked CRM companies to verified employer records or inventing last-season outcomes
- #02: `recruiter-leads-workspace.tsx` and `recruiter-prototype-inspector.tsx` now show an independently focused recruiter inspector; no invented contacts, accepted hires or phone dial codes
- #06–08: `tpo-campaign-prototype-sidebar.tsx`, `tpo-campaign-compose.tsx`, `tpo-campaign-compose-presets.ts` and the campaign index/new/detail routes now support a split campaign list/editor, verified author filtering, safe copy suggestions and existing two-step send
- #09: `tpo-recruiter-message-reply.tsx` and `tpo-message-template-library.ts` expose a searchable template picker with preview and explicit Insert without auto-sending or fabricating student eligibility
- #30: `tpo-college-rules-control.tsx` renders persisted offer rules as inline editable sentences, retains custom numeric values, Save/Discard and optimistic version checks; rules page keeps advanced details in disclosure
- `tests/unit/tpo-prototype-{recruiter-inspector,email-workspace,message-templates,placement-rules}-2026.test.ts`: source contracts
- `.github/workflows/tpo-prototype-source-acceptance.yml`: dedicated non-cancelling source/unit CI for these prototype slices, independent of the global suite

## Further Students prototype implementation (26 October 2026)

Based on the supplied Students screenshot set (assets labeled `tpo_09.png` to `tpo_13.png`):

- Screen **10 / All students**: `src/components/tpo/tpo-student-roster-inspector.tsx` adds a right-hand real-data overview. `tpo-students-spreadsheet.tsx` connects row selection while preserving full `TpoStudentQuickPanel` in a separate detail action. Tests: `tests/unit/tpo-students-prototype-inspector-2026.test.ts`.
- Screen **13 / Requests**: `src/components/tpo/tpo-request-prototype-workspace.tsx` presents authorized list/selection, request reason, current drive context and persisted decision control, while existing bulk operations and report table remain in Advanced. Tests: `tests/unit/tpo-requests-prototype-workspace-2026.test.ts`.
- Screen **11 / Who\'s in placements**: `/tpo/batches` now provides a prototype batch comparison table and selected batch summary. It uses existing authorized eligibility and journey counts, enforces selected-batch UUID validation, does not substitute other batches for stale selections, and preserves full batch cards/lifecycle tools in Advanced. Tests: `tests/unit/tpo-batches-prototype-workspace-2026.test.ts`.
- Screen **12 / To verify**: `src/components/verification/TpoVerificationPrototypeQueue.tsx` displays a student queue and authorized evidence summary while keeping `VerificationReviewDrawer` for document comparison, decision confirmation and server-enforced version checks. `TpoVerificationPanel.tsx` retains the full table and bulk operations in Advanced. Tests: `tests/unit/tpo-verification-prototype-queue-2026.test.ts`.
- Screen **14 / Announcements**: `src/components/tpo/tpo-notice-prototype-sidebar.tsx` groups scheduled, current and ended notices on the loaded page. `/tpo/announcements` renders the selected detail and original audited mutation/read/retry controls. Tests: `tests/unit/tpo-announcements-prototype-workspace-2026.test.ts`.
- Typecheck regression in first Announcements iteration normalized optional `audienceKind` to `null` in the sidebar mapping. The fix is committed, but awaits a subsequent green typecheck.
- **All four Students screens worked on in this batch are code updated but still require actual interactive browser checks, responsive screenshots and prototype visual comparison.** Do not mark them visually accepted based on source tests.

## Drives overview prototype implementation (26 October 2026)

- Screen **16 / Recruiter drive request**: selected request details now appear beside the authorized request list on `/tpo/placements/lifecycle?view=REQUESTS&request=[id]`. The review uses persisted recruiter status/contact metadata, optionally recorded changed-field comparisons, and the existing `TpoDriveRequestActions` policy: **approval produces an unpublished draft**, never directly publishes or claims email delivery. Original advanced request list remains accessible. Live user-flow/browser acceptance is pending.
- Screen **15 / Drives**: `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx` now displays the prototype-style Drive / Where it is / Next / Needs you / Who grid, using persisted applied count, rounds, offers, schedule and owner fields. It keeps the original authorized advanced drive grid and export/mutation controls behind a disclosure.
- Recruiter drive-request cards are retrieved independently through `getTpoDriveLifecycleList(context,{view:"REQUESTS",page:"1"})`, bounded to two preview cards with a Review link. On read failure an explicit warning is shown; the valid main drives list stays available.
- `tests/unit/tpo-drives-prototype-overview-2026.test.ts` covers these source and authorization contracts and is included in the dedicated TPO source CI.
- Pending: full live data browser walkthrough, exact-viewport comparison against `tpo_14.png`, stage-specific actions, and final visual acceptance.

## Known acceptance boundaries

1. GitHub Actions runs for rapid sequential `main` commits have been superseded/cancelled; no green CI claim is made in this inventory. A standalone source acceptance workflow was added, but its result must be checked before reporting a pass.
1a. Global `npm run lint` is blocked by the expired legacy UX waiver (`docs/design-system/UX-GUARD-WAIVERS.json`, expires 2026-10-25). Do not extend the waiver or rewrite the immutable baseline without the prescribed residual-finding review; dedicated source tests are not a substitute for the global gate.
2. Both Today feed sources are page-limited; the UI must show when the preview is incomplete, rather than pretend its totals are exhaustive.
3. "Not contacted" means recruiter stage `NEW`, never merely a missing scheduled follow-up. My Work includes genuinely unassigned and actor-owned leads only, Everyone remains college-scoped.
4. CRM actions must not claim an email was sent or delivered without an actual provider receipt. Message replies and bulk email campaign receipts are separate ledgers.
5. Same-viewport screenshot acceptance for all 33 remains open, including 01/04/05, even when their data pathways are implemented.
