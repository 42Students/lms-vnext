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
