# UI/UX polish evidence — lane chat-5

## Surface 1 — Super Admin / Academic Setup
**Surface:** `src/app/(authenticated)/admin/academics/page.tsx`  
**Scope:** Academic Setup only; scoped and missing-college states, four create forms, four record tables, row edit/archive/activate dialogs, loading and error route fallbacks.  
**Problems found and fixed: 14.**

| Dimension | Problems found | Changes made |
| --- | --- | --- |
| Clutter | Three same-weight links in the scoped page header; two unrelated links crowd the no-scope header | Kept **Open Programs directory** visible when scoped; moved **Elective slots** and **Batch Promotion Preview →** into a single keyboard-accessible **More** dropdown. Both destinations remain accessible without a college scope. |
| Hierarchy | Four expanded creation forms dominated the first screen and pushed every academic record below the fold | Kept the dependency order period → program → cohort → section, but used four collapsed shared Disclosures. Existing headings, helper copy, inputs, selectors, submit buttons, route destinations, and mutation handlers remain intact. |
| Density | All creation fields and four submit actions were visible simultaneously | Show the relevant form only when its title is expanded; preserve form state while collapsed, validation, pending status, success/error toasts, and refresh. |
| Mobile 375 | Header actions wrapped as three full-width buttons | One full-width directory action plus a full-width **More** trigger on phones; the menu opens as the shared mobile sheet. |
| Tablet 768 / alignment | Header menu and links could have different heights; long action groups aligned to the right on mobile | Match the desktop 36px control-height token, use shared legacy gaps, and left-align row actions on phones while retaining right alignment on desktop. |
| Mobile forms | Individual create buttons used intrinsic widths | All four submissions fill available phone width and return to intrinsic width from tablet up. |
| Table actions | Planned cohorts presented three equal-priority actions per row | Retained **Activate** as the immediate action and grouped **Edit / Archive** in a shared dropdown; confirmations and optimistic mutations remain unchanged. |
| Table actions | Sections presented **Open**, **Edit**, **Archive** together, crowding 375px rows | Retained **Open** visible and grouped **Edit / Archive** in a dropdown; route, validation and confirmation unchanged. |
| Alignment | The overview had 20px outer rhythm while the page used 24px legacy gutters | Standardized its top-level separation to the legacy 24px scale; aligned collapsed form summaries and content to the same leading edge as section heads. |
| Empty states | All four tables said **No records to show.** without any next action | Preserved the title; reused the relevant existing help sentence and added an in-page link to the matching creation disclosure (period/program/cohort/section). |
| Loading / error | Risk of different recovery patterns if locally reimplemented | Audited existing `loading.tsx` / `error.tsx` and the shared GracefulPageLoading / GracefulErrorBoundary. Kept their bounded retry and error actions; no duplicate new fallback. |

**Files changed:** `src/app/(authenticated)/admin/academics/page.tsx`; `src/components/academics/academics-create-panel.tsx`; `src/components/academics/academics-overview.tsx`; `src/components/academics/academics-actions.tsx`; `docs/orchestrator/queues/clone/lane-5-polish.md`; this proof file.

**Preserved:** existing page titles and business copy, all existing IDs / data-testid / aria labels, destination paths, permission and tenant scoping, API mutations, validation, toast messages, legacy colour/radius/typography/control tokens and shared Dialog / ConfirmDialog flows. No new packages, CI or runtime screenshots; checked structure and breakpoint class coverage in source for 375/768/1280. Changes are limited to this surface's components.

## Surface 2 — Section operations (/admin/academics/sections/[sectionId])

- Problems (7): all learner admission/placement, Faculty assignment and schedule-entry forms stayed expanded above records; two adjacent form panes dominated 375px; desktop selects/buttons had inconsistent width; row actions wrapped toward the right on narrow cards; summary and workspace spacing differed; 6-column event form cramped on tablet; busy roster/faculty lists lacked visual separation from entry workflows.
- Fixed: convert the four mutation panels to on-demand shared Disclosure controls, retaining all field labels, inputs, values, permission checks, mutation paths, toast wording and pending states; align widths and buttons, use two-column event-entry grid at 768 and three columns on wide screens, align mobile actions to the leading edge, set 24px section rhythm. Existing summary and DataTable remain visible as primary content; loading and error fallbacks retain shared retry, not-found remains fail closed.
- States/source reviewed: page, its folder error.tsx/loading.tsx, AcademicsSectionPage, SectionOperations and shared DataTable/Select/Button/Disclosure/Graceful states; code-level 375/768/1280 breakpoint check (no browser screenshots).
- Files: src/components/academics/section-operations.tsx; docs/orchestrator/queues/clone/lane-5-polish.md; docs/audit/ux/polish-lane-5.md.

## Surface 3 — Super Admin Announcements

- Problems fixed (9): 4 advanced filters previously dominated the list toolbar; search was fifth and narrow; export occupied a full-width row before results; multi-college broadcast and per-target composer expanded simultaneously above history; list items had three competing actions; create forms crowded 375px; empty/error/loading paths were detached from primary history; inconsistent mobile action alignment.
- Changes: make search first and full-width at 375, place visibility/pin/sender/audience controls under keyboard-accessible Filters disclosure without modifying names/values/GET behaviour; keep Search/Clear matched and accessible; move CSV export after history; show existing announcement history first; collapse both announcement creation experiences under shared Disclosure titles, retaining all controls, live state, confirmation dialogs, mutations and return to history; keep Edit visible but group Pin/Unpin and Delete under More; preserve in-page status/read-receipt and next-page links.
- Examined: page, loading.tsx/error.tsx and shared Graceful fallbacks, AnnouncementAdminWorkspace (filled/empty/edit/review), SuperAdminCollegeBroadcastForm (send/review/error), PageHeader, Dropdown, Disclosure, MetricBar, Select/Input/Button, Dialog/ConfirmDialog. Breakpoints reviewed in source for 375/768/1280; no browser verification or CI.
- Files: src/app/(authenticated)/admin/announcements/page.tsx; src/components/announcements/announcement-admin-workspace.tsx; src/components/announcements/super-admin-college-broadcast-form.tsx; queue + proof. All copy, IDs, routes, permissions, token sizes and API semantics preserved.

## Surface 4 — Super Admin Assignments

- Problems fixed (7): export action outranked creating and viewing assignments; two page titles sat next to each other; narrow creator header could wrap awkwardly at 375; form footer actions had uneven widths; always-rendered submission review and grade controls overwhelmed every assessment list row; list and create form gutters differed; the main directory sat beneath secondary chrome.
- Changes: keep Create New Assignment as clear primary action, stack header actions and equalize mobile buttons, move secondary CSV export below the records without changing its URL, place per-assignment submission review and bulk-grade controls in a shared keyboard-operable Disclosure, preserve publish/edit/grade flows and confirmation dialogs; align content to legacy gaps and keep all permission/tenant-scope checks.
- Examined: assignments page, loading.tsx/error.tsx, CollegeAssignmentCreate, AdminAssessmentDirectory (filter/empty/filled/pagination), CollegeAssignmentActions, CollegeAssignmentReview and FacultyItemActions, shared FilterBar/Drawer, Dialog, Alert and Button; inspected 375/768/1280 class behavior; no browser screenshots or CI.
- Files: src/app/(authenticated)/admin/assignments/page.tsx; src/components/courses/college-assignment-create.tsx; src/components/courses/admin-assessment-read-directory.tsx; queue and proof. No copy, ARIA, route, token, ID or API changes.

## Surface 5 — Super Admin Attendance

- Problems fixed (8): attendance policy editing and guardian SMS controls came before selecting an attendance class; oversized summary appeared before filters; mobile class/course controls and Apply action did not align; month controls wrapped without grouping; optional operational tools displaced the primary attendance grid; editor action had intrinsic width; cross-page gutters inconsistent; loaded/empty/error states needed to remain visible without changed assumptions.
- Changes: put class/course/month filter first, follow with read-only policy summary and the existing collapsed guardian-SMS controller, leave the attendance grid and correction drawer intact; move the editable college policy form into one accessible Disclosure after the grid; align responsive selects and View attendance action at 375/768; preserve all IDs, route params, status copy, safety scope, CSV export, policy confirmation/validation, and correction notifications.
- Examined: attendance page, loading/error, AdminAttendanceWorkspace, SuperAdminAttendanceSettingsEditor, AdminAttendanceParentContactEditor, Table/Drawer/Alert/Button/EmptyState and month filter/empty/filled/correction flows; breakpoint class review at 375/768/1280, no live browser or CI.
- Files: src/app/(authenticated)/admin/attendance/page.tsx; src/components/attendance/admin-attendance-workspace.tsx; src/components/admin/super-admin-attendance-settings-editor.tsx; queue and proof.

## Surface 6 — Super Admin Activity Log / Audit

- Problems fixed (7): 11 always-visible filter fields turned audit into a form before any findings; summary actions competed; full cards and repeated borders crowded grouped activity; date and category presets wrapped unevenly at 375; filter action buttons were narrow; technical metadata competed with the event story; low/no-result states required clear return paths.
- Changes: preserve high-signal date/college/module/importance controls and place six rarely used event/actor/entity fields into a keyboard-operable More filters disclosure that auto-expands when a value is active; normalize responsive grid and mobile Apply action; show grouped entries as calm single-canvas hairline rows rather than cards; preserve event detail disclosure, status badges, timelines, presets, all existing links, exact route/URL encoding and query semantics. Existing empty-state Reset and loading/error Retry remain.
- Inspected: admin audit page, folder error/loading, ActivityPage, ActivityCenter and shared PageHeader, Select, DateInput, StatusBadge, Disclosure, EmptyState and Card. Source breakpoint check 375/768/1280; no CI/browser screenshots.
- Files: src/app/(authenticated)/activity/page.tsx; src/components/activity/activity-center.tsx; queue and proof.

## Surface 7 — Super Admin Batch Promotion

- Problems fixed (8): the full batch queue and optional fields always consumed the upper canvas; active promotion preview started below many records; batch and preview headings competed; 100-learner grid overwhelmed readiness/confirmation; filters could wrap poorly at 375; dense score strip used irregular padding; advanced year/status options were prominent; bulk actions required clearer prominence over secondary inspection.
- Changes: collapse optional year/status controls behind More filters (auto-open when active) while keeping Program, Batch and Preview primary and mobile full-width; collapse the batch queue when a batch is selected and leave it open while choosing; expose learner-level evidence through a labelled disclosure; keep readiness summary, blockers and promotion/graduation confirmations visible; normalize summary cell gutters and responsive grid. No changes to active-scope checks, version locking, preview calculations, API calls, route parameters, data row URLs, copy or legacy tokens.
- Read: batch promotion page and folder loading/error, CollegePromotionConfirmation, SuperAdminBatchGraduateAction, shared DataTable, Disclosure, EmptyState, StatusBadge and confirmation dialogs; source breakpoint checks at 375/768/1280, no CI/browser screenshots.
- Files: src/app/(authenticated)/admin/batch-promotion/page.tsx; queue and proof.

## Surface 8 — Super Admin Batch Students

- Problems fixed (7): informational class table pushed primary student search/roster below the fold; nested class list consumed extra vertical space; class controls had uneven alignment; row-level move selector/button cramped on 375; empty class directory had a weak message; roster instruction text stretched across the canvas; mobile action layout relied on wrapping.
- Changes: make the searchable batch learner roster the first actionable section; put secondary class directory into keyboard-operable Disclosure without changing its class/detail routes; retain per-learner select/move and confirmation plus capacity, term and permission validation, but make row action a full-width one-column layout at 375 and a same-height selection/action row from 768; align the class search controls and legacy 24px rhythm; give the no-classes state shared EmptyState. Preserve all original wording and routes.
- Examined: page, route error/loading and Graceful fallbacks, SuperAdminBatchRosterManager, DataTable, ConfirmDialog, Breadcrumbs, PageHeader, StatusBadge and EmptyState; source layout review at 375/768/1280 (no CI or runtime screenshot).
- Files: src/app/(authenticated)/admin/batches/[batchId]/students/page.tsx; src/components/admin/super-admin-batch-roster-manager.tsx; queue and proof.

## Surface 9 — Super Admin Batches directory

- Problems fixed (9): large create-batch form displaced the directory; duplicate Filter/Refresh and always-visible advanced selectors overloaded the toolbar; batch lifecycle tabs plus a second status filter competed; mobile search and program filters wrapped unevenly; row Edit/Graduate/Remove controls overcrowded 375px cards; create form attempted five columns in a narrow layout; empty list state had no clear affordance; individual table sections had inconsistent gaps; secondary batch lifecycle links competed with the main directory.
- Changes: leave lifecycle tabs and batch search prominent, group Status and Rows per page in More filters with active filter state shown automatically; arrange the filter row using responsive aligned columns and consistent full-width phone actions; collapse Create batch into a shared semantic Disclosure, retaining every input, mutation, validation, and feedback status; adjust the creation grid to two columns from 768 and three on wide screens; keep Edit visible and demote Graduate/Remove into a shared mobile-sheet-aware More menu without changing their permissions or confirmations; use shared EmptyState for no matches and normalize gutters.
- Inspected: batches page, its loading/error boundaries, CollegeCohortCreateForm, CollegeCohortRowActions (dialog/confirm/empty/filled/pending), AcademicSetupSteps, DataTable, Tabs, Dropdown, Disclosure, Input/Select/Button, StatusBadge and legacy design tokens. Checked responsive source for 375/768/1280; no CI or browser screenshots.
- Files: src/app/(authenticated)/admin/batches/page.tsx; src/components/academics/college-cohort-management.tsx; docs/orchestrator/queues/clone/lane-5-polish.md; docs/audit/ux/polish-lane-5.md.

## Surface 10 — Classes directory

Problems fixed (7): aligned class filters and actions; collapsed advanced status and page size; made table empty state actionable via shared component; demoted secondary schedule navigation; moved rarely-used class creation into Disclosure; retuned authoring grid for 375/768/1280; aligned creation action on mobile. Scanned page, CollegeClassCreate, CollegeClassRowActions (create/edit/discard), AcademicSetupSteps, DataTable, Disclosure, form controls, error/loading fallbacks and empty/filled/disabled states. Mobile 375: stacked filters/forms and full-width actions; tablet 768: two columns; desktop 1280: aligned fields and dense list. Existing copy, routes, IDs, mutations, warnings, statuses, tenant scope and legacy tokens preserved. No CI/browser validation.

Files: `src/app/(authenticated)/admin/classes/page.tsx`, `src/components/academics/college-section-management.tsx`, queue and this proof.

## Surface 11 — Administrator activity history

Problems fixed (5): CSV export competed with navigation in title row; history pagination crowded the header affordances; event count lacked subdued hierarchy; list rows needed consistent vertical gutters; mobile actions needed a single leading-edge rhythm. Moved CSV export below the history table, kept the existing College admins back action visible, aligned pagination and reused the legacy 24px section rhythm. Reviewed page, route loading/error fallbacks, PageHeader, PageBackLink, DataTable, EmptyState, ErrorState and empty/invalid/filled/paginated states at 375/768/1280 in source. Preserved all wording, CSV URL, page parsing, permissions, accessibility labels, event values and table identity. No CI/runtime pixel verification.

Files: `src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/history/page.tsx`, queue, proof.

## Surface 12 — Administrator active sessions

Problems fixed (6): history navigation competed with the back control; session metadata extended mobile width; session count lacked secondary hierarchy; the destructive global sign-out looked like a normal row action; sign-out control was narrower than the phone layout; content gutters drifted. Moved Administrator activity history to a secondary link after the table, separated global sign-out with a legacy hairline and full-width touch action on phones, broke long user agents safely, used subdued count and consistent 24px vertical rhythm. Inspected page, AdminRevokeSessions (pending/error/confirmation), PageHeader, PageBackLink, DataTable, EmptyState, ConfirmDialog and route loading/error fallbacks, 375/768/1280 source states. Preserved all wording, permissions, cross-college revoke semantics, IDs, labels, URLs, and tokens. No CI or browser verification.

Files: `src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/page.tsx`, `src/components/admin/admin-revoke-sessions.tsx`, queue, proof.

## Surface 13 — College administrator directory

Problems fixed (7): ambiguous equal-width header onboarding controls crowded 375px; three table action columns overwhelmed mobile; per-row suspension reason appeared before it was needed; modal trigger widths mismatched; table actions lacked grouped hierarchy; header/section gutters drifted; role status was visually secondary to technical details. Changes: stacked the two existing onboarding actions using responsive grid (same exact labels and handlers), preserved back navigation, moved row lifecycle controls into an accessible Access disclosure, aligned mobile buttons and minimized the nested controls without changing suspension/reactivation confirmation, roles, warning state, or mutations. Audited page, PersonOnboardDialog (empty/filled/validation/error/loading), CollegeAdminLifecycleAction (mentor guarded, suspended, pending), DataTable/StatusBadge/Disclosure, route loading/error, at 375/768/1280 via source. No CI/runtime screenshots.

Files: `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx`, `src/components/admin/college-admin-lifecycle-action.tsx`, `src/components/admin/person-onboard-dialog.tsx`, queue, proof.

## Surface 14 — College branding / Look and feel

Problems fixed (8): very tall read-only branding preview displaced live editor; duplicated mock sign-in view competed with the editing preview; technical preview caveat separated from its content; 8 URL fields stacked as a narrow column on wide screens; saved action lacked full-width mobile alignment; crop/remove actions were uneven at 375; inconsistent section gutters; the immediate task was visually behind secondary information. Changes: keep editable branding section, uploader, forms and live preview first; move stored read-only preview and its caveat into a native keyboard-operable Disclosure below; align URL/support form inputs in a responsive two-column grid and actions across 375/768/1280. Inspected page and route loading/error, CollegeBrandingPreview, CollegeBrandingForm, CollegeLogoUploader including empty/pre-upload/crop/pending/error/remove/read-only, shared Card/Disclosure/ConfirmDialog, all existing preview states. Colours, radii, copy, labels, permissions, validation, upload, URLs and API behaviour unchanged. No CI/browser verification.

Files: `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx`, `src/components/admin/college-branding-form.tsx`, `src/components/admin/college-logo-uploader.tsx`, queue, proof.

## Surface 15 — College tenant overview

Problems fixed (7): equal-priority setup links were buried beneath eight read-only metadata cells; Activity CSV competed with the College tab; seven settings links wrapped unevenly at 375; no clear grid scan path on tablet; archived restore warning competed with navigation; density drift between top sections; utility export overshadowed primary setup. Moved authorized college setup destinations ahead of identity metadata, aligned the same links into a full-width mobile/2-col tablet/3-col desktop grid, retained all lifecycle checks and archived warnings, and moved CSV export after the identity overview. Reviewed page, TenantRestoreAction (pending/success/failure/confirm), Tabs, PageHeader/PageBackLink and route notFound/error/loading. Source layout checked 375/768/1280; permissions, labels, routes, wording, tokens and REST lifecycle unchanged. No CI or browser verification.

Files: `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx`, queue, proof.

## Surface 16 — College Readiness Gate

Problems fixed (8): export CTA displaced readiness counts; recheck and export competed; ten-check list overwhelmed optional explanatory evidence; suggested setup and secondary data looked as important as failed requirements; filters wrapped inconsistently at 375; reference-only interpretation consumed the primary reading path; list gutters drifted; mobile filter action mismatched widths. Kept status verdict, counts and Must fix before launch visible, moved CSV download/caveat to the end, grouped Recommended setup, Additional setup evidence and Readiness interpretation under separate accessible shared disclosures with their original headings and copy, and aligned filtered checks for 375/768/1280. Inspected page, route error/loading/not-found, StatTile, StatusBadge, Disclosure, ErrorState, EmptyState, Select/Button and pass/fail/unknown/filter states. All permission gates, counts, evidence, URLs, remediation, and wording preserved. No CI/browser validation.

Files: `src/app/(authenticated)/admin/colleges/[collegeId]/readiness/page.tsx`, queue, proof.

## Surface 17 — College Sign-in Methods

Problems fixed (5): a short four-option form stretched across the entire desktop canvas; notice and Save action separated at wide widths; radio hint text could crowd 375px; saved status had weak visual grouping; phone action lacked full-width alignment. Constrained sign-in controls and their messages to a readable max-w-3xl column, aligned the four options and their hints with flexible min-width, kept the Save button full-width at 375 and intrinsic on tablet/desktop. Inspected page, CollegeSigninMethodForm including invalid/migration-disabled/success/stale/pending, ConfirmDialog/Radio/Alert, route not-found/loading/error; checked source classes at 375/768/1280. No changes to allowed methods, business copy, IDs, labels, permission, expectedVersion, or API. No CI/browser validation.

Files: `src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx`, `src/components/admin/college-signin-method-form.tsx`, queue, proof.

## Surface 18 — College web address & managed subdomain

Problems fixed (9): two entire address-management flows competed in the first viewport; long subdomain suffix could overflow a 375px form row; Remove/Delete were same visual weight as Verify/Allot; per-domain TXT evidence occupied multiple screenfuls; host fields/actions had mixed widths; DNS lists wrapped unevenly on tablet; empty custom-domains path lacked breathing room; status metadata competed with primary address; secondary custom manager obscured managed subdomain. Kept managed web address immediate and custom addresses in a keyboard-operable disclosure; moved DNS TXT instructions per unverified hostname into a separate accessible disclosure; grouped Delete under More while keeping Verify DNS/Make primary visible, retained dangerous-action confirmations, made managed suffix break safely and actions full-width on phones. Read page, TenantDomainManager, ManagedCollegeSubdomain, shared Dropdown/Disclosure/Input/StatusBadge/ConfirmDialog, route loading/error and all empty/pending/verified/unverified/primary states. Source breakpoint review 375/768/1280; no CI/screenshots. Preserved domain ownership checks, exact copy, IDs/aria labels, URLs, tokens and mutations.

Files: `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx`, `src/components/admin/tenant-domain-manager.tsx`, `src/components/admin/managed-college-subdomain.tsx`, queue, proof.

## Surface 19 — College profile verification

Problems fixed (9): giant bulk reviewer and 50-checkbox list displaced the learner queue; TPO policy switch displaced all review content; export and refresh competed with reviewing; review-one-by-one was lost in secondary controls; filter and content hierarchy unclear; action row wrapped unevenly at phone width; the switch error action used hand-styled sizing; bulk section and the detail drawer competed as simultaneous primary tasks; unstructured secondary controls broke alignment. Kept review-one-by-one and current filters above visible VerificationWorkspace, moved bulk operations to a separate accessible Disclosure below the queue, moved Export/Refresh to the secondary toolbar beneath the queue, moved the TPO policy switch to a separate Disclosure after verification content, preserved all selection, bulk decisions, drawer review, confirmation, API calls and roles. Inspected page, SuperAdminVerificationPanel, TpoVerificationSwitch, VerificationFilterPanel/Workspace/ReviewDrawer/ExportControl, route loading/error and pending/empty/failed/waiting/verified/bulk states at 375/768/1280 via source. No UI tokens, labels, permissions or wording changed. No CI/browser verification.

Files: `src/app/(authenticated)/admin/colleges/[collegeId]/verification/page.tsx`, `src/components/verification/SuperAdminVerificationPanel.tsx`, `src/components/verification/TpoVerificationSwitch.tsx`, queue, proof.

## Surface 20 — Colleges directory

Problems fixed (9): five competing row actions on phones and tablets; long creation form above directory; bulk import ahead of records; search/filter fields and responsive action heights misaligned; muted records needed prominence; count competed with list; irregular vertical gutters; cramped 375px cards; secondary controls obscured row destinations. Kept Tenant setup primary, grouped Readiness, Branding, Edit and Archive in mobile-sheet-aware More menu; collapsed CollegeCreateForm using Disclosure preserving its internal draft/address handling; moved already-toggleable Bulk Import beneath directory and pagination; aligned search and count. Inspected page, layout/error/loading, CollegeCreateForm, CollegeBulkImport, CollegeEditDialog, CollegeArchiveButton, DataTable, Pagination, EmptyState, Dialog/ConfirmDialog and empty/filled/invalid/pending states, source breakpoints 375/768/1280. Original copy, labels, IDs, permissions, routes, mutations and legacy tokens retained; no CI/screenshots.

Files: `src/app/(authenticated)/admin/colleges/page.tsx`, queue and proof.

## Surface 21 — Company placement drive history

Problems fixed (6): heavy breadcrumb link competed with the PageHeader; the three history metrics stacked unnecessarily at 375px; KPI label and number hierarchy drifted; gutters were narrow/inconsistent with legacy scale; data listing lacked consistent separation; long tables risked crowded mobile cards. Switched to shared back affordance, rendered compact two-column phone KPIs and three-column tablet row, normalized exact KPI font/weight/spacing and legacy section rhythm, retained DataTable responsive priorities, all statuses, navigation, 500-item warning and empty-state copy. Inspected page, status/DataTable/EmptyState/PageBackLink and error/loading routes, filled/empty/truncated 375/768/1280 source. No changes to route, permission/scope, IDs, wording or data. No CI/browser verification.

Files: `src/app/(authenticated)/admin/companies/[companyId]/drives/page.tsx`, queue and proof.
