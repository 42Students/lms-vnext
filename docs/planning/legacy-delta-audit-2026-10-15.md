# Legacy delta audit (read-only) - 2026-10-15

## 0. Sources examined (nothing modified, no servers run)

- Legacy FE: `C:\Users\LENOVO\Desktop\42lms\42LMS-FRONTEND\lms2-fe` (git). Local refs only, no fetch performed, so "current" means what is cloned locally.
  - Matrix baseline `38cdd38e` is an ancestor of `origin/prod-2026` = `e6b09e6d` (2026-10-09), **148 commits ahead**, 439 files changed. (Manifest header mentions `008d113d`; that SHA is not a local ref, `e6b09e6d` is the newest local prod-2026 tip. Same delta set per the manifest's own list of added routes.)
  - `origin/lms-dev-2026` (2026-10-14) is 1307 FE commits ahead of prod-2026. It is the DEV branch, not prod. Anything below tagged **[DEV-ONLY]** is not in prod-2026 and needs an owner decision on whether it is in the cutover oracle.
- Legacy BE: `C:\Users\LENOVO\Desktop\42lms\42LMS-BACKEND\lms` (git). `origin/prod-2026` 2026-10-07, `lms-dev-2026` (checked out) 2026-10-14, 630 commits ahead of prod. 21 controllers added since 2026-10-03 are mostly DEV-ONLY (listed per row).
- `C:\Users\LENOVO\local-stack\new` is a local runner (backend.cjs, copy of BE under `be`), not an independent source of routes.
- Other folders (`_hr-tpo-fe`, `_prod-current-frontend`, ...) are older copies; not used. `42lms-mobile` not audited (out of scope for web matrix).
- Route method: `git diff --name-status 38cdd38e origin/prod-2026 -- src/pages` (Pages Router; nav configs `src/common/adminNavGroups.js`, `superAdminNavGroups.js`, `recruiterRoutes.js`), then compared to `docs/planning/account-surface-parity.md` and the manifest.
- Mechanical check: every non-artifact route in `legacy-ui-route-manifest.md` was searched in the matrix. Only `/tpo/leads` and `/tpo/leads/[leadId]` have no literal match, and both are renamed in current legacy to `/tpo/recruiters*` which the matrix already uses. So the old manifest is fully covered; the gap is purely the post-baseline delta.

## 1. Summary

Net new / renamed ROUTES in prod-2026 since baseline: 7 added product routes plus 1 rename family
(added: `/college-admin/verification`, `/superadmin/verification`, `/tpo/verification`, `/tpo/batches`, `/tpo/batches/[batchId]`, `/superadmin/recruiters`, `/recruiter-invite/[token]`; renamed: `/hr/*` to `/recruiter/*` (9 pages), `/hr-invite` to `/recruiter-invite`, `/superadmin/hr` to `/superadmin/recruiters`, `/tpo/leads*` to `/tpo/recruiters*`). Deleted: the old `/hr/*`, `/hr-invite`, `/superadmin/hr`, `/tpo/leads*`.

| Portal | Missing surfaces (prod-2026) | Under-scoped matrix rows (prod-2026) | DEV-ONLY surfaces (lms-dev-2026) |
| --- | --- | --- | --- |
| Learner | 0 | 0 (profile verification already in row 99) | 1 family (placements Schedule/Offers/Announcements tabs, DriveJourney) |
| Faculty | 0 | 1 (lesson-content visibility rule) | 0 |
| Mentor | 0 | 0 | 0 |
| College Admin | 1 (Profile verification) | 4 | 3 (overview cards, course teachers panel, workspace editors) |
| Super Admin | 2 (Profile verification, Recruiter accounts route rename) | 2 | 6 (announcements, inbound mail, company curation, sign-in methods, subdomain, placements nav group) |
| TPO | 3 (Verification, Batches list, Batch detail) | 9 | 6 (announcements, team, drive change requests/discussion, public link/join, placements page, campaigns) |
| HR / Recruiter | 1 rename family (matrix still says `/hr/*`) | 2 (Today/queue, invite page) | 2 (change requests, no-college session) |
| Shared / public | 0 | 1 (`/recruiter-invite`) | 4 (`/college-join`, `/company-join`, `/placements`, `/campaign-unsubscribe`) |
| Ops / tracker | 0 | 0 | 1 (`/tracker/audit-findings`) |
| Cross-cutting engines | 5 (bulk-action engine, spreadsheet grid + filter panel, Choices source, bell panel/finder, private signed docs) | - | 1 (grid saved views) |

Total: 12 missing prod surfaces/engines + 1 rename family, 19 under-scoped rows, 25 DEV-ONLY surfaces.

## 2. Missing surfaces (table)

Priority: H/M/L by centrality. "Needs" column: F = file storage, S = external sending (email/SMS/WhatsApp), O = owner decision.

| # | Portal / role | Legacy route | What it does (from source) | Key sub-surfaces / actions | Legacy source paths | Suggested vNext route | Pri | Needs |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | College Admin | `/college-admin/verification` | Staff queue to verify each student's Education and Identity profile sections against uploaded documents; plus switch that decides whether the placement cell may verify too. | Views Waiting / Sent back / Verified with counts; "Needs a closer look" (marksheet missing, update to verified details, waiting over a week); filters section/kind/marksheets/batch/branch/waiting since; review drawer (values beside marksheets, resume, Aadhaar/PAN last-4 + signed doc link); Verify, Send back with reason (preset reasons); bulk Verify without opening (confirm), bulk Send back, Send message to students; Switch "placement cell can verify"; table export | `src/pages/college-admin/verification.js`, `src/components/verification/VerificationWorkspace.jsx`, `src/api/Services/VerificationService.js`; BE `controller/tpo/ProfileVerificationController.java` (prod) | `/college/verification` | H | F (private docs via signed link), S (student notifications), O (who may verify) |
| P2 | Super Admin | `/superadmin/verification` | Same workspace for the college picked in the scope selector; shows info alert until a college is chosen. | Same as P1 (canChangeSetting) scoped by `collegeId` | `src/pages/superadmin/verification.js`, `VerificationWorkspace.jsx` | `/admin/colleges/[collegeId]/verification` (or `/admin/verification` with scope picker) | M | F, S |
| P3 | TPO | `/tpo/verification` | Same workspace for the placement cell when the college admin allows it; eligibility uses verified marks. | Same as P1 minus setting toggle; adds "Send a message" bulk action; header selectors; Retry state | `src/pages/tpo/verification.js`, `VerificationWorkspace.jsx` | `/tpo/verification` | H | F, S, O |
| P4 | TPO | `/tpo/batches` | "Decide who is in placements, batch by batch." Card per batch (cohort/program year) with state, eligible/ineligible/not-decided bar, journey counts and one Next step button. | KPI strip (batches in placements, eligible, not decided, placed); search; filter panel; Undo last decision banner; per-card next step (invite, remind, continue, view) | `src/pages/tpo/batches/index.js`, `src/components/tpo/batches/batchRules.js`, `api/Services/BatchesService.js`; BE `controller/tpo/TpoBatchesController.java` (prod) | `/tpo/batches` | H | S (invite/remind), O (batch/season model: legacy dropped "season" in favour of batches) |
| P5 | TPO | `/tpo/batches/[batchId]` | Batch workspace: eligibility decision grid for every student, batch rules, decision history with exact undo. | Tabs Students / Rules / History; "Who is in" (batch, classes, individuals); Next-step card; eligibility grid with inline decisions, IneligibleModal (reason); import eligibility (preview matched/can't-use, commit); invite batch with deadline, remind; Mark finished / Reopen; Undo last decision; WhatsApp prepared messages modal; student actions window | `src/pages/tpo/batches/[batchId].js`, `components/tpo/batches/{BatchRulesTab,BatchTop,EligibilityGrid,IneligibleModal}.jsx`, `ImportPreviewModal`, `PreparedMessagesModal`, `StudentActions.jsx` | `/tpo/batches/[batchId]` | H | S (WhatsApp/email invites are prepared text), O |
| P6 | Super Admin | `/superadmin/recruiters` (was `/superadmin/hr`) | Global Recruiter accounts page (HR renamed to Recruiter across product). | Same content as matrix rows 289-291; nav label "Recruiter accounts", global | `src/pages/superadmin/recruiters.js`, `sections/RecruiterAccounts.js`, `common/superAdminNavGroups.js` | `/admin/recruiters` (alias of `/admin/hr`) | M | O (naming) |
| P7 | Recruiter | `/recruiter/*` (home, drives, drives/new, drives/[jobId], calendar, messages, company, profile, colleges, index) and `/recruiter-invite/[token]` | Whole HR portal renamed Recruiter; old `/hr/*` and `/hr-invite/[token]` deleted. Matrix rows still cite deleted routes. | Today (RecruiterToday), Focused applicant review, pending invites, notification bell, college panel, drive overview strip | `src/pages/recruiter/**`, `src/components/recruiter/*`, `recruiterRoutes.js` | existing `/hr/*` or move to `/recruiter/*` | M | O (route naming) |
| P8 | Cross-cutting (TPO) | all TPO tables | Bulk-actions engine: preview (who goes, who is skipped and why), run, result with failures, exact undo, one audit line. Used on Students, Engage, Applicants, Offers, Drives, Requests, Verification, Batch grid. | ActionsWindow (grouped actions, help text, danger variants), act bar, per-reason skip labels, Undo | `src/components/tpo/bulk/BulkAction.jsx`, `components/tpo/ui/ActionsWindow.jsx` | shared component under `/tpo` | H | O (undo semantics), S (some actions send) |
| P9 | Cross-cutting (TPO) | all TPO tables | Spreadsheet grid on every TPO table: column chooser, header filters, side filter panel kept in URL, inline cell edit (registration, stage, owner), export (CSV/Excel) that differs from screen (marks export-only), mobile card fallback. Matrix mentions "saved filter" only in parity/tpo.md. | `components/tpo/grid/{TpoGrid,GridWorkspace,HeaderFilter,ChoiceEditor,gridExport}`, `components/tpo/filters/{FilterPanel,useUrlFilters,filterModel}` | shared grid | M | - |
| P10 | Cross-cutting | n/a | Single source of dropdown values (`useChoices`, `config/choices.js`, BE `ChoicesController`): job types, after-college outcomes, coding platforms, etc. | | `src/hooks/useChoices.js`, `src/config/choices.js`; BE `controller/ChoicesController.java` | shared config | L | O |
| P11 | TPO | bell + search in top bar | Bell opens a right Drawer (per-person read state, mark all read) instead of navigating to `/tpo/notifications`; TPO search is a record finder (records only, no pages/actions). | | `src/components/tpo/TpoBellPanel.jsx`, `RecruiterNotificationBell.jsx` | `/tpo` shell | L | - |
| P12 | Cross-cutting | profile docs | Private identity docs and marksheets open through a signed link with learnerId authorization (`PrivateDocLink`, `MarksheetUpload`). Learner side covered by row 99; staff side not. | | `components/profile/{PrivateDocLink,MarksheetUpload}.jsx`, `VerificationService.getDocumentUrl` | via P1-P3 | M | F |

## 3. Under-scoped matrix rows

| Matrix row (line) | Gap vs current prod-2026 legacy | Source |
| --- | --- | --- |
| TPO Home command center (401) | Legacy replaced the dashboard with a "calm" Home: greeting, one "Next up" card with one button, six quiet rows with attention dots, "Nothing is waiting on you" state. Row describes the old needs-you/funnel dashboard. Redefine target. | `pages/tpo/home.js`, `components/tpo/home/homeRows.js` |
| Settings 6.4 "explicit ten sections" (474-483) | Legacy settings regrouped into 3 groups: Placement policy (rules, **Job types**, **After college** outcomes, **Prep readiness**, **Blocked dates**), People (team, recruiters), Students and companies (notices, see, branding). Season, trusted, templates, notifications MERGED (`MOVED = trusted/templates->recruiters, notifications->rules`). Matrix lists season/trusted/templates/notifications as separate tabs and has no Job types, After college, Blocked dates rows. Recruiters tab now has approval switch, access length, end date, Extend, WhatsApp invite. Notices tab holds the monthly optional-SMS cap. | `pages/tpo/settings.js`, `components/tpo/settings/{JobTypesTab,OutcomeLabelsTab}.jsx` |
| Leads rows (403-409) | Renamed **Engage** / "recruiter" (not lead). Adds "Needs doing" links (due, no next step, quiet, unassigned), ActionsWindow (owner, contacted, not now, WhatsApp/email invites), "Where did you find them?" source field, filter panel sections, inline stage/owner edit, grid. | `pages/tpo/recruiters/index.js`, `[recruiterLeadId].js`, `recruiterLeadStages.js`, `ui/recruiterLeadBoardRules.js` |
| Students roster rows (411-418) | Roster limited to students in placements (batch model); Batch (by program) and Department selectors, journey strip with clickable steps and gaps filter, marks as percentages, **After college** column/filter (five choices), coding-platform profiles in panel and filter, Stage/Profile in words, export differs from screen. | `pages/tpo/students/index.js`, `components/tpo/students/*` |
| Drives list / Drive page (421-447) | "Drives that happened outside the platform can be recorded" (`recordedOutside` flag, "Recorded from outside" filter and where-it-is value); Needs-doing links (no deadline, closing in 7 days, passed but open, nobody applied); filter sections Drive/Timing/Pay/People; ActionsWindow (remind, deadline); drive journey strip with got-this-far; Next-step card; Offers: record several selections at once, finalists first, rules check with reasons, hours-left; Rounds: results entry filters, waitlist rank, see who is in a round. | `pages/tpo/drives/index.js`, `[jobId].js`, `components/tpo/DriveFormPage.js`, `drive/ApplicantsTab.js` |
| Requests (412/452/498) | Needs-doing (urgent, waiting long, proof missing), approve per kind with confirm, reject with reason, decided by/on/why columns, "After college" wording. | `pages/tpo/requests.js` |
| Reports (458-469) | Journey on index (each number opens its report), one export, honest placement rate, each report's own columns and chart, outcomes report with no company filters. | `pages/tpo/reports/*`, `components/tpo/reportViews.js` |
| TPO Calendar (453-457) | Today card with Needs doing (overdue follow-ups, rounds on blocked dates, busy days) opening a focused list; one row of type chips with counts. Depends on Blocked dates (missing). | `pages/tpo/calendar.js` |
| TPO Profile (497) | Focused profile card (photo, name, role, contact). Matrix is read-only membership; add photo. | `components/tpo/TpoProfileCard.jsx` |
| Audit Log (495) | Quick-look link per event kind, date pick loads up to 5000 rows, readable export with About and Detail columns, Open link instead of #id. | `pages/tpo/audit.js` |
| College Admin Student Groups (214) | Legacy **hid** Student Groups from the college-admin sidebar ("hidden until a feature uses generic groups"); route still exists. Decide whether row should become hidden/RETIRED-by-nav or stay. | `common/adminNavGroups.js` |
| College Admin Projects: workspace create (230-265) | New "Split a class into teams" mode (team size default 5, order by roll or shuffle with seeded preview, teams differ by at most one), "Add a whole class", clean URLs; shared with Super Admin projects. | `pages/college-admin/projects/workspaces/new.js`, `components/admin/projects/useProjectTeamSplit.jsx`, `utils/projectTeams.js` |
| College Admin Profile (not itemised) | Profile reduced to personal, contact, address, social sections only. | `pages/college-admin/profile.js` |
| College Admin / Super Admin Lesson content, Lessons, Courses | One "Visible to students" switch (real hide), only administrators choose visibility; faculty always add to own class; single Add Video drawer; admin course home shows "In this course"; admin syllabus notes shared-only view. | `pages/college-admin/lesson-content.js`, `superadmin/sections/{Courses,Lessons,LessonContent}.js`, `Dashboard/course/syllabus/*` |
| Super Admin Feature Controls / Module Access (284) | Placements is college-only in Module Access; turning Placements off states what closes and that nothing is deleted; TPO "module off" closed screen. | `superadmin/sections/{ModuleAccess,FeatureControlsHub}.js`, `components/tpo/TpoModuleOff.jsx` |
| Super Admin HR rows 289-291 | Naming changed to Recruiter accounts; no behavior change otherwise (see P6). | `superadmin/sections/RecruiterAccounts.js` |
| HR Home / Today (511-512) | New Today queue with typed tasks (sent-back drive, review applicants, messages) and deep links `?tab=` / `&review=1`; focused applicant review; pending invites panel. | `components/recruiter/{RecruiterToday,RecruiterFocusedReview,RecruiterPendingInvites,recruiterRoutes}` |
| HR new drive / Fix / Hire again (514-516) | Legacy flow: `/recruiter/drives/new` with `?fix=<jobId>` and `?from=<jobId>`, JD upload, status vocabulary (Waiting for approval, Sent back, Not accepted, Approved not yet live, Live, Closed), six-step drive progress. Already MISSING in matrix; add the status vocabulary and JD upload (file storage). | `pages/recruiter/drives/new.js`, `components/recruiter/RecruiterDriveOverview.jsx` |
| Public invite acceptance (541) | Route is now `/recruiter-invite/[token]`: name, designation, mobile, join, "Not hiring from this college this season", "Stop contacting me". | `pages/recruiter-invite/[token].js` |
| Recruiter Messages (533) | Company/time on threads, teammates named, Seen, refresh on return, only recruiters with access, composer stops when access ended, start conversation from inbox. | `pages/recruiter/messages.js`, `pages/tpo/messages.js` |

## 4. DEV-ONLY surfaces (lms-dev-2026, not in prod-2026) - need owner confirmation they are in the cutover oracle

| # | Portal | Route | What it does | Sources | Suggested vNext | Pri | Needs |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D1 | TPO + Super Admin + Learner | `/tpo/announcements`, `/superadmin/announcements`, `/learn/my-placements/announcements` | TPO composes announcements to students (audience preview, edit, delete, undo, remind, "hasn't read" list); 42 posts to placement cells (pinned, link, show until, per-college targeting); learner reads under Placements. Tabs From 42 / Yours. | `pages/tpo/announcements.js`, `pages/superadmin/announcements.js`, `learn/my-placements/announcements.js`, `components/tpo/announcements/*`; BE `TpoAnnouncementController`, `SuperAdminAnnouncementController`, `LearnerAnnouncementController` | `/tpo/announcements`, `/admin/announcements`, `/learn/my-placements/announcements` | H | S (in-app + possibly email/SMS), O |
| D2 | TPO | `/tpo/team` | Placement-team conversations (threads, follow/mute/leave, about-record threads, people tab); invisible to recruiters/students. Also drive-level Discussion tab (company vs internal). | `pages/tpo/team.js`, `components/tpo/team/*`, `components/tpo/drive/DiscussionTab.jsx`; BE `TpoTeamThreadController` | `/tpo/team` | M | O |
| D3 | TPO + Recruiter | drive detail | Drive change requests both ways (college and company), invite reviewer, internal notes. | `components/tpo/drive/{ChangeRequests,InviteReviewer,RequestLine}.jsx`, `components/recruiter/RecruiterChangeRequests.jsx`; BE `TpoChangeRequestController`, `RecruiterChangeRequestController` | job workspace tab | M | S, O |
| D4 | Public + TPO | `/placements` | College public placements page on its own address: lines about placements, live numbers (suppressed under 5), "Recruit from us" form with emailed code. Settings card to switch on. | `pages/placements/index.js`, `components/tpo/settings/PlacementsPageSettings.jsx`; BE `PublicPlacementsPageController`, `TpoPlacementsPageController` | `/placements` + `/tpo/settings/placements-page` | M | S (code email), O |
| D5 | Public + TPO | `/college-join/[token]`, `/company-join/[token]` | Recruiter joins college via public link (work email, code, company from email) or via company-specific link; trusted switch and open/joined counts on TPO side. | `pages/college-join`, `pages/company-join`, `components/tpo/settings/PublicLinkCard.jsx`, `components/tpo/company/CompanyLinkCard.jsx`; BE `PublicCollegeJoinController`, `PublicCompanyJoinController`, `TpoPublicLinkController`, `TpoCompanyController` | same | M | S, O |
| D6 | TPO + Public | Engage Campaigns, `/campaign-unsubscribe/[token]` | Email one message to chosen recruiters (own copy, unsubscribe link), sent-history with outcomes; unsubscribe button page (opening link changes nothing). | `components/tpo/engage/Campaigns.jsx`, `pages/campaign-unsubscribe/[token].js`; BE `TpoEmailCampaignController`, `PublicCampaignUnsubscribeController` | `/tpo/recruiters` campaigns; `/campaign-unsubscribe/[token]` | M | S (email), O |
| D7 | Super Admin | `/superadmin/inbound-mail` | Inbound email inbox (received, from, status) with detail drawer. | `pages/superadmin/inbound-mail.js`; BE `SuperAdminInboundMailController`, `PublicInboundEmailController` | `/admin/inbound-mail` | L | S (inbound webhook), O |
| D8 | Super Admin | Company curation section | Verify, edit, domains, merge, aliases for companies across colleges. | `superadmin/sections/CompanyCuration.js`; BE `SuperAdminCompanyController` | `/admin/companies` | M | O |
| D9 | Super Admin | College Sign-in, Web address sections | Per-college sign-in methods (email+phone, phone+email, email only, phone only); subdomain move/remove. Replaces TenantDomains. | `sections/CollegeSignIn.js`, `CollegeSubdomain.js` | `/admin/colleges/[id]/signin`, `/subdomain` | M | O |
| D10 | Ops | `/tracker/audit-findings` | Audit findings board (Open / Release blockers / All, severity, status, assignee, files with result/why, drawer). | `pages/tracker/audit-findings.js`, `components/tracker/auditFindings/*`; BE `SuperAdminAuditFindingsController` | with tracker VERIFY decision (rows 572-575) | L | O |
| D11 | Learner | `/learn/my-placements/{schedule,offers,announcements}` | Placements tabs layout: month schedule with day drawer and deadlines, offers card list, notices; DriveJourney/RoundTrack per drive. | `learn/my-placements/*`, `components/Placements/student/*`, `layouts/PlacementsTabsLayout.js` | same | M | - |
| D12 | College/Super Admin | overview cards and editors | AdminControlOverview, People and Placements overviews, project workspace section editors (overview, sprints, tasks, meetings, resources, readiness, team), CourseTeachersPanel (who teaches which section/semester). | `components/admin/**` | existing routes | L | - |
| D13 | TPO | grid Views | Saved views: pin up to 5, rename, update, delete, Excel/CSV per view, unused-60-days mark. Closes the "saved filter" checkbox in parity/tpo.md. | `components/tpo/grid/SavedViewsManager.jsx`, `viewMemory.js` | grid | L | - |
| D14 | Super Admin nav | | Placements group now holds Recruiter accounts and Announcements; Inbound mail added to global group. | `common/superAdminNavGroups.js` | nav | L | - |

## 5. Legacy features intentionally NOT cloned per docs

From the matrix, manifest and protocol (RETIRED / REDESIGNED / VERIFY):
- RETIRED (redirect stubs/test helpers): `/learn`, `/teacher`, `/teacher/fileExplorer`, `/mentor/courses/*`, `/mentor/contacts/*`, `/mentor/allQuizzes`, `/mentor/fileExplorer`, `/mentor/profile`, `/tpo`, `/hr`, `/hr/colleges`, `/e2e/superadmin-login`.
- REDESIGNED: separate `/superadmin-login` (unified sign-in on platform host); `/login` handled at `/`.
- Manifest classes never copied as UI: LEGACY_PAGE_ARTIFACT (e.g. `/superadmin/sections/Batches`), FRAMEWORK, TEST_ONLY, REDIRECT_STUB.
- Open VERIFY (owner decision pending, not yet cloned): Deleted Workspaces (college admin and super admin), custom free-form config keys, `/privacy-policy`, tracker (`/tracker`, `/tracker/issues`, `/tracker/issues/[id]`, `/tracker/logs`), marketing pages (`/home`, `/platform`, `/universities`, `/enterprises`, `/request-demo`).
- Legacy itself removed in prod-2026 (so should NOT be cloned): Learner Job Preferences / Placement Academic Record / "Who has my data"; backlogs everywhere; Readiness column; TPO Students stats strip and placement-by-branch; admin comms pages (`chore/remove-admin-comms-pages`); per-drive resume upload (profile resume is sent); HR "Leave access" button (access managed by college; matrix rows 538 still list it, conflicts); HR search; college-admin Student Groups nav entry.

## 6. Proposed new matrix rows (paste-ready)

### College Admin (append to section 4.4 People or 4.5)

| Profile verification queue | `/college-admin/verification` | `/college/verification` | Staff queue for learner Education/Identity verification: Waiting / Sent back / Verified views with counts, needs-a-closer-look links (marksheet missing, update to verified details, waiting over a week), filters (section, kind, marksheets, batch, branch, waiting since), review drawer with values beside signed-link marksheets/resume/Aadhaar-PAN last four, Verify, Send back with reason, bulk verify/send back/message, export. Includes toggle for whether the placement cell may verify. Needs private-document signed links and student notifications. | MISSING |
| Verification: placement cell permission toggle | `/college-admin/verification` header switch | `/college/verification` | `tpoCanVerify` setting; TPO verification route is hidden/blocked when off. | MISSING |
| Create workspace: split class into teams | `/college-admin/projects/workspaces/new` (mode Teams) | `/college/projects/workspaces/new` | Team size (default 5), order by roll or seeded shuffle, preview adjustable before create, team sizes differ by at most one; plus Add a whole class. Shared with Super Admin. | MISSING |

### Super Admin

| Profile verification (scoped college) | `/superadmin/verification` | `/admin/colleges/[collegeId]/verification` | Same workspace as College Admin for the college chosen in scope picker; info alert until a college is chosen. | MISSING |
| Recruiter accounts (renamed from HR Accounts) | `/superadmin/recruiters` | `/admin/hr` (alias `/admin/recruiters`) | Legacy renamed HR to Recruiter; confirm route alias and labels; behavior as rows for HR Accounts. | PARTIAL |

### TPO

| Verification queue | `/tpo/verification` | `/tpo/verification` | Same workspace, available only when college admin allows; add Send-a-message bulk action; export; Retry state. | MISSING |
| Batches list | `/tpo/batches` | `/tpo/batches` | Cards per batch with state, eligible/ineligible/not-decided bar, journey counts, one Next step; KPI strip; search; filters; Undo last decision. | MISSING |
| Batch detail: Students eligibility grid | `/tpo/batches/[batchId]` Students tab | `/tpo/batches/[batchId]` | Who is in (batch, classes, individuals), eligibility grid with inline decision and ineligible reason, bulk actions with preview and undo, WhatsApp prepared messages. | MISSING |
| Batch detail: Rules tab | `/tpo/batches/[batchId]` Rules tab | `/tpo/batches/[batchId]?tab=rules` | Per-batch placement rules (BatchRulesTab) and drive job type. | MISSING |
| Batch detail: History tab and undo | `/tpo/batches/[batchId]` History tab | `/tpo/batches/[batchId]?tab=history` | Decision history timeline, exact undo of last action, Mark finished / Reopen batch. | MISSING |
| Batch eligibility import | batch Students action | `/tpo/batches/[batchId]` | Import preview (matched / can't use) then commit. | MISSING |
| Batch invite / remind | batch Next step | `/tpo/batches/[batchId]` | Invite batch with deadline, remind. External sending needs owner decision. | MISSING |
| Settings: Job types | `/tpo/settings?tab=jobtypes` | `/tpo/settings/job-types` | Own job types, counts-as-placed flag, switch off unused. | MISSING |
| Settings: After college outcomes | `/tpo/settings?tab=outcomes` | `/tpo/settings/outcomes` | Fixed NAAC/NIRF outcome list with own labels; drives Students After-college column and Outcomes report. | MISSING |
| Settings: Prep readiness | `/tpo/settings?tab=prep` | `/tpo/settings/prep` | Courses defining readiness bar; Students marks below-bar as needing prep. | MISSING |
| Settings: Blocked dates | `/tpo/settings?tab=blocked` | `/tpo/settings/blocked-dates` | Exam weeks/holidays; scheduling and Calendar warn on collision. | MISSING |
| Settings: regrouped navigation | `/tpo/settings` 3 groups | `/tpo/settings` | Season/trusted/templates/notifications merged into Recruiters/Rules/Notices; redirect map MOVED. | PARTIAL |
| Bulk-actions engine | all TPO tables | shared component | Preview who goes and who is skipped by reason, run, per-row failures, exact undo, one audit line. | MISSING |
| Spreadsheet grid and filter panel | all TPO tables | shared component | Column chooser, header filters, URL-kept side panel, inline edit, export-only columns. | MISSING |
| Drive recorded from outside platform | TPO drive form / drives filter | `/tpo/placements/new` | `recordedOutside` flag, "Recorded from outside" filter, skipped by reminder actions. | MISSING |
| Calm Home (Next up + six rows) | `/tpo/home` | `/tpo` | One Next up card, six rows with attention dots, clear state. | PARTIAL |
| TPO bell panel and record finder | top bar | `/tpo` shell | Drawer with per-person read state; finder over records only. | MISSING |
| After college column/filter | `/tpo/students` | `/tpo/students` | Five choices incl. higher studies, entrepreneurship, competitive exams, looking for job, not decided. | MISSING |
| Coding platform profiles | student profile, TPO panel, Students filter | `/tpo/students` | Coding-platform links and filter. | MISSING |

### HR / Recruiter

| Route rename HR to Recruiter | `/recruiter/*` (home, drives, drives/new, drives/[jobId], calendar, messages, company, profile) | `/hr/*` | Legacy deleted `/hr/*`; every HR row maps to `/recruiter/*`. Decide alias. | PARTIAL |
| Recruiter invite (renamed) | `/recruiter-invite/[token]` | `/recruiter-invite/[token]` | Name, designation, mobile, join; Not hiring this season; Stop contacting me. vNext route exists (check `/hr-invite` still present). | PARTIAL |
| Today task deep links | `/recruiter/home` | `/hr` home | Typed tasks: sent-back drive to `/recruiter/drives/new?fix=`, review applicants to `...?tab=applicants&review=1`, messages. | MISSING |
| Focused applicant review | drive Applicants `review=1` | job workspace | Step-through review with rating notes. | MISSING |

### Shared / public (DEV-ONLY; confirm oracle first)

| College public link join | `/college-join/[token]` | none | Work email + code, company from email, ALREADY_JOINED state. | MISSING |
| Company join link | `/company-join/[token]` | none | Company-specific link with email code. | MISSING |
| Public placements page | `/placements` | none | Public numbers (min 5) and Recruit from us form. | MISSING |
| Campaign unsubscribe | `/campaign-unsubscribe/[token]` | none | Confirm button; opening link does not unsubscribe. | MISSING |

### TPO / Super Admin / Learner (DEV-ONLY)

| TPO announcements | `/tpo/announcements` | none | Compose with audience preview, edit/delete/undo, remind, unread list, From 42 tab. | MISSING |
| Super Admin announcements | `/superadmin/announcements` | none | Pinned/link/show-until to all or selected colleges. | MISSING |
| Learner placement announcements | `/learn/my-placements/announcements` | none | Read-only notices tab. | MISSING |
| TPO Team | `/tpo/team` | none | Conversations and People tabs, internal only. | MISSING |
| Drive change requests / discussion | TPO drive and recruiter drive | none | College vs company change requests, invite reviewer, internal notes. | MISSING |
| Engage Campaigns | `/tpo/recruiters` | none | Email chosen recruiters, sent history. | MISSING |
| Inbound mail | `/superadmin/inbound-mail` | none | Inbound mail list with drawer. | MISSING |
| Company curation | superadmin section | none | Verify, merge, aliases, domains. | MISSING |
| College sign-in methods and subdomain | superadmin sections | `/admin/domains` | Replaces TenantDomains. | MISSING |
| Audit findings | `/tracker/audit-findings` | none | Findings board. | VERIFY |
