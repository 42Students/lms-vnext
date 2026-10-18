# chat-4 North Star UI sweep — College Admin and colleges/tenants (2026-10-19)

## Priority and source of truth

Owner NORTH STAR at the top of `docs/orchestrator/queues/master-queue.md`: change only the **page shell and global visual styling**, **not** page contents, actions or wording. Reference `docs/design/old-lms-shell-spec.md`, `docs/design/old-lms-shell.css`, `docs/design/old-lms-pages.md`, `docs/design/vnext-vs-old-lms-gap.md`, and `docs/design/legacy-styles/` (`components___variables.scss`, `components___button.scss`, `components___form.scss`, `components___dropdown.scss`, `components___header.scss`, `components___common.scss`, `components___antddesign.scss`).

Measured target: one white **#fff** page canvas with 1px **#e5e9f0** border, **12px** radius, **24px** padding on **#f1f4f9** shell. H1 **30px/600/#172033**. Primary controls **#0a7c88**, white labels, **9px** radius and **36px** height; secondary controls hairline-bordered white. Native table rows and grouped content should use thin dividers instead of independent section cards. Use semantic Tailwind aliases (`bg-surface`, `border-border`, `text-foreground`, `bg-primary`, `text-on-primary`) that chat-17 owns rather than inventing a new design system.

## Ownership boundaries

**Do not edit** `src/app/globals.css`, `src/app/layout.tsx`, `src/components/ui/**` (chat-17), `src/components/shell/sidebar-nav.tsx` and shell model (chat-19), or top-bar and `app-shell.tsx` (chat-13). Preserve portal-specific headings, actions and routing. Do not alter tests/CI. This ledger captures page/component files, **not** route loading/error UI, which inherit the shared skin and should not get additional wrappers.

## Corrective checks applied to each file

1. Replace explicit CSS hex/rgb or arbitrary text/background/border styles with semantic shared tokens where an exact equivalence exists; preserve status-semantic and data-visualization colors where meaningful.
2. For direct page `h1` and page title treatment align to legacy weight and scale; rely on chat-17's `PageHeader` when present.
3. Avoid another outer rounded/bordered/shadowed surface inside the globally provided canvas. Keep *genuine distinct objects* (metric/report option cards, dialogs, alerts) if needed, but flatten ordinary section containers to spacing plus hairlines.
4. Normalize locally styled buttons/links/inputs/selects and table containers to old LMS controls through the shared kit or CSS tokens, without modifying labels, handlers, validation or field structure.
5. Keep mobile wrapping, accessible focus/contrast, stable responsive grids, and legacy tab wording.

## File inventory

### College Admin portal pages and layouts (90)

| File | Audit / expected change |
| --- | --- |
| `src/app/(authenticated)/college/academics/page.tsx` | Replace inline control styles with token-based palette/radius; flatten ordinary section cards and check table/form hierarchy. |
| `src/app/(authenticated)/college/academics/sections/[sectionId]/page.tsx` | Replace inline control styles with token-based palette/radius; flatten ordinary section cards and check table/form hierarchy. |
| `src/app/(authenticated)/college/activity/[eventId]/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/college/activity/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/college/announcements/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/college/assignments/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/college/attendance/corrections/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/college/attendance/departments/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/college/attendance/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/college/attendance/settings/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/college/batch-promotion/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/college/batches/[cohortId]/students/page.tsx` | Replace inline control styles with token-based palette/radius; flatten ordinary section cards and check table/form hierarchy. |
| `src/app/(authenticated)/college/batches/page.tsx` | Replace inline control styles with token-based palette/radius; flatten ordinary section cards and check table/form hierarchy. |
| `src/app/(authenticated)/college/branding/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/college/classes/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/college/classes/recurring-preview/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/college/college-profile/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/college/companies/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/college/contacts/[membershipId]/page.tsx` | Replace inline control styles with token-based palette/radius; flatten ordinary section cards and check table/form hierarchy. |
| `src/app/(authenticated)/college/contacts/page.tsx` | Replace inline control styles with token-based palette/radius; flatten ordinary section cards and check table/form hierarchy. |
| `src/app/(authenticated)/college/course-progress/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/college/courses/offerings/[offeringId]/not-found.tsx` | Check typography, inherited canvas and legacy tabs without duplicating shell padding. |
| `src/app/(authenticated)/college/courses/offerings/[offeringId]/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/college/courses/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/college/departments/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/college/domains/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/college/electives/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/college/faculty-assignment/page.tsx` | Replace inline control styles with token-based palette/radius; flatten ordinary section cards and check table/form hierarchy. |
| `src/app/(authenticated)/college/faculty/[membershipId]/page.tsx` | Replace inline control styles with token-based palette/radius; flatten ordinary section cards and check table/form hierarchy. |
| `src/app/(authenticated)/college/faculty/import/page.tsx` | Replace inline control styles with token-based palette/radius; flatten ordinary section cards and check table/form hierarchy. |
| `src/app/(authenticated)/college/faculty/page.tsx` | Replace inline control styles with token-based palette/radius; flatten ordinary section cards and check table/form hierarchy. |
| `src/app/(authenticated)/college/groups/[groupId]/import-preview/page.tsx` | Replace inline control styles with token-based palette/radius; flatten ordinary section cards and check table/form hierarchy. |
| `src/app/(authenticated)/college/groups/[groupId]/page.tsx` | Replace inline control styles with token-based palette/radius; flatten ordinary section cards and check table/form hierarchy. |
| `src/app/(authenticated)/college/groups/[groupId]/rule-preview/page.tsx` | Replace inline control styles with token-based palette/radius; flatten ordinary section cards and check table/form hierarchy. |
| `src/app/(authenticated)/college/groups/page.tsx` | Replace inline control styles with token-based palette/radius; flatten ordinary section cards and check table/form hierarchy. |
| `src/app/(authenticated)/college/hiring-dashboard/page.tsx` | Inspect page-level surfaces, headings, metric strips and route action styling; preserve workflow contents and distinct objects. |
| `src/app/(authenticated)/college/layout.tsx` | Check typography, inherited canvas and legacy tabs without duplicating shell padding. |
| `src/app/(authenticated)/college/lecture-halls/[hallId]/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/college/lecture-halls/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/college/lessons/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/college/live-classes/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/college/not-found.tsx` | Check typography, inherited canvas and legacy tabs without duplicating shell padding. |
| `src/app/(authenticated)/college/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/college/people/manage/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/college/people/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/college/placements/calendar/page.tsx` | Inspect page-level surfaces, headings, metric strips and route action styling; preserve workflow contents and distinct objects. |
| `src/app/(authenticated)/college/placements/drives/page.tsx` | Inspect page-level surfaces, headings, metric strips and route action styling; preserve workflow contents and distinct objects. |
| `src/app/(authenticated)/college/placements/interviews/page.tsx` | Inspect page-level surfaces, headings, metric strips and route action styling; preserve workflow contents and distinct objects. |
| `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx` | Inspect page-level surfaces, headings, metric strips and route action styling; preserve workflow contents and distinct objects. |
| `src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx` | Inspect page-level surfaces, headings, metric strips and route action styling; preserve workflow contents and distinct objects. |
| `src/app/(authenticated)/college/placements/jobs/[jobId]/layout.tsx` | Check typography, inherited canvas and legacy tabs without duplicating shell padding. |
| `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx` | Inspect page-level surfaces, headings, metric strips and route action styling; preserve workflow contents and distinct objects. |
| `src/app/(authenticated)/college/placements/jobs/[jobId]/page.tsx` | Inspect page-level surfaces, headings, metric strips and route action styling; preserve workflow contents and distinct objects. |
| `src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx` | Inspect page-level surfaces, headings, metric strips and route action styling; preserve workflow contents and distinct objects. |
| `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx` | Inspect page-level surfaces, headings, metric strips and route action styling; preserve workflow contents and distinct objects. |
| `src/app/(authenticated)/college/placements/new/page.tsx` | Inspect page-level surfaces, headings, metric strips and route action styling; preserve workflow contents and distinct objects. |
| `src/app/(authenticated)/college/placements/page.tsx` | Inspect page-level surfaces, headings, metric strips and route action styling; preserve workflow contents and distinct objects. |
| `src/app/(authenticated)/college/placements/readiness-by-department/page.tsx` | Inspect page-level surfaces, headings, metric strips and route action styling; preserve workflow contents and distinct objects. |
| `src/app/(authenticated)/college/placements/retention/page.tsx` | Inspect page-level surfaces, headings, metric strips and route action styling; preserve workflow contents and distinct objects. |
| `src/app/(authenticated)/college/placements/student-lookup/page.tsx` | Inspect page-level surfaces, headings, metric strips and route action styling; preserve workflow contents and distinct objects. |
| `src/app/(authenticated)/college/profile/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/college/programs/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/college/projects/[projectId]/[section]/page.tsx` | Inspect page-level surfaces, headings, metric strips and route action styling; preserve workflow contents and distinct objects. |
| `src/app/(authenticated)/college/projects/[projectId]/page.tsx` | Inspect page-level surfaces, headings, metric strips and route action styling; preserve workflow contents and distinct objects. |
| `src/app/(authenticated)/college/projects/[projectId]/readiness/page.tsx` | Inspect page-level surfaces, headings, metric strips and route action styling; preserve workflow contents and distinct objects. |
| `src/app/(authenticated)/college/projects/at-risk/page.tsx` | Inspect page-level surfaces, headings, metric strips and route action styling; preserve workflow contents and distinct objects. |
| `src/app/(authenticated)/college/projects/audit/page.tsx` | Inspect page-level surfaces, headings, metric strips and route action styling; preserve workflow contents and distinct objects. |
| `src/app/(authenticated)/college/projects/create/page.tsx` | Inspect page-level surfaces, headings, metric strips and route action styling; preserve workflow contents and distinct objects. |
| `src/app/(authenticated)/college/projects/page.tsx` | Inspect page-level surfaces, headings, metric strips and route action styling; preserve workflow contents and distinct objects. |
| `src/app/(authenticated)/college/projects/readiness/page.tsx` | Inspect page-level surfaces, headings, metric strips and route action styling; preserve workflow contents and distinct objects. |
| `src/app/(authenticated)/college/projects/reassign-mentor/page.tsx` | Inspect page-level surfaces, headings, metric strips and route action styling; preserve workflow contents and distinct objects. |
| `src/app/(authenticated)/college/projects/submissions/page.tsx` | Inspect page-level surfaces, headings, metric strips and route action styling; preserve workflow contents and distinct objects. |
| `src/app/(authenticated)/college/projects/templates/[templateId]/page.tsx` | Inspect page-level surfaces, headings, metric strips and route action styling; preserve workflow contents and distinct objects. |
| `src/app/(authenticated)/college/projects/templates/page.tsx` | Inspect page-level surfaces, headings, metric strips and route action styling; preserve workflow contents and distinct objects. |
| `src/app/(authenticated)/college/projects/workspaces/[workspaceId]/[section]/page.tsx` | Inspect page-level surfaces, headings, metric strips and route action styling; preserve workflow contents and distinct objects. |
| `src/app/(authenticated)/college/projects/workspaces/[workspaceId]/page.tsx` | Inspect page-level surfaces, headings, metric strips and route action styling; preserve workflow contents and distinct objects. |
| `src/app/(authenticated)/college/projects/workspaces/new/page.tsx` | Inspect page-level surfaces, headings, metric strips and route action styling; preserve workflow contents and distinct objects. |
| `src/app/(authenticated)/college/projects/workspaces/page.tsx` | Inspect page-level surfaces, headings, metric strips and route action styling; preserve workflow contents and distinct objects. |
| `src/app/(authenticated)/college/quizzes/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/college/resources/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/college/semester-courses/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/college/semesters/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/college/students/[membershipId]/page.tsx` | Replace inline control styles with token-based palette/radius; flatten ordinary section cards and check table/form hierarchy. |
| `src/app/(authenticated)/college/students/import/page.tsx` | Replace inline control styles with token-based palette/radius; flatten ordinary section cards and check table/form hierarchy. |
| `src/app/(authenticated)/college/students/page.tsx` | Replace inline control styles with token-based palette/radius; flatten ordinary section cards and check table/form hierarchy. |
| `src/app/(authenticated)/college/students/register/page.tsx` | Replace inline control styles with token-based palette/radius; flatten ordinary section cards and check table/form hierarchy. |
| `src/app/(authenticated)/college/verification/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/college/videos/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |

### Legacy College Admin routes (2)

| File | Audit / expected change |
| --- | --- |
| `src/app/(authenticated)/college-admin/departments/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/college-admin/programs/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |

### Super Admin colleges and tenants pages (11)

| File | Audit / expected change |
| --- | --- |
| `src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/history/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/admin/colleges/[collegeId]/readiness/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/admin/colleges/[collegeId]/verification/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/admin/colleges/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |
| `src/app/(authenticated)/admin/organizations/page.tsx` | Align heading, action controls, filters, white-canvas sections and mobile spacing; keep page layout and copy. |

### College/academic and tenant-specific UI components (60)

| File | Audit / expected change |
| --- | --- |
| `src/components/academics/academics-actions.tsx` | Audit custom controls, button state, radius and form colors against shared kit; keep handlers and accessibility. |
| `src/components/academics/academics-create-panel.tsx` | Audit custom controls, button state, radius and form colors against shared kit; keep handlers and accessibility. |
| `src/components/academics/academics-overview.tsx` | Match semantic colors, typography, spacing and card-only-for-distinct-objects rules. |
| `src/components/academics/academics-section-page.tsx` | Match semantic colors, typography, spacing and card-only-for-distinct-objects rules. |
| `src/components/academics/college-academic-directory.tsx` | Normalize table/list separators, filters and toolbar; avoid card-per-row and redundant canvas. |
| `src/components/academics/college-archived-programs.tsx` | Match semantic colors, typography, spacing and card-only-for-distinct-objects rules. |
| `src/components/academics/college-cohort-management.tsx` | Match semantic colors, typography, spacing and card-only-for-distinct-objects rules. |
| `src/components/academics/college-hall-booking-action.tsx` | Audit custom controls, button state, radius and form colors against shared kit; keep handlers and accessibility. |
| `src/components/academics/college-hall-cancellation-action.tsx` | Audit custom controls, button state, radius and form colors against shared kit; keep handlers and accessibility. |
| `src/components/academics/college-promotion-confirmation.tsx` | Match semantic colors, typography, spacing and card-only-for-distinct-objects rules. |
| `src/components/academics/college-recurring-preview.tsx` | Match semantic colors, typography, spacing and card-only-for-distinct-objects rules. |
| `src/components/academics/college-section-lifecycle-action.tsx` | Audit custom controls, button state, radius and form colors against shared kit; keep handlers and accessibility. |
| `src/components/academics/college-section-management.tsx` | Match semantic colors, typography, spacing and card-only-for-distinct-objects rules. |
| `src/components/academics/college-semester-management.tsx` | Match semantic colors, typography, spacing and card-only-for-distinct-objects rules. |
| `src/components/academics/college-structure-directory.tsx` | Normalize table/list separators, filters and toolbar; avoid card-per-row and redundant canvas. |
| `src/components/academics/college-term-mapping-manager.tsx` | Audit custom controls, button state, radius and form colors against shared kit; keep handlers and accessibility. |
| `src/components/academics/learner-class-schedule.tsx` | Match semantic colors, typography, spacing and card-only-for-distinct-objects rules. |
| `src/components/academics/section-operations.tsx` | Match semantic colors, typography, spacing and card-only-for-distinct-objects rules. |
| `src/components/admin/college-admin-lifecycle-action.tsx` | Audit custom controls, button state, radius and form colors against shared kit; keep handlers and accessibility. |
| `src/components/admin/college-archive-button.tsx` | Match semantic colors, typography, spacing and card-only-for-distinct-objects rules. |
| `src/components/admin/college-at-glance-panel.tsx` | Match semantic colors, typography, spacing and card-only-for-distinct-objects rules. |
| `src/components/admin/college-branding-form.tsx` | Audit custom controls, button state, radius and form colors against shared kit; keep handlers and accessibility. |
| `src/components/admin/college-branding-preview.tsx` | Match semantic colors, typography, spacing and card-only-for-distinct-objects rules. |
| `src/components/admin/college-bulk-import.tsx` | Match semantic colors, typography, spacing and card-only-for-distinct-objects rules. |
| `src/components/admin/college-closing-quizzes-card.tsx` | Match semantic colors, typography, spacing and card-only-for-distinct-objects rules. |
| `src/components/admin/college-create-form.tsx` | Audit custom controls, button state, radius and form colors against shared kit; keep handlers and accessibility. |
| `src/components/admin/college-dashboard-cards.tsx` | Match semantic colors, typography, spacing and card-only-for-distinct-objects rules. |
| `src/components/admin/college-dashboard-section-failure.tsx` | Match semantic colors, typography, spacing and card-only-for-distinct-objects rules. |
| `src/components/admin/college-edit-dialog.tsx` | Audit custom controls, button state, radius and form colors against shared kit; keep handlers and accessibility. |
| `src/components/admin/college-feature-rule-editor.tsx` | Audit custom controls, button state, radius and form colors against shared kit; keep handlers and accessibility. |
| `src/components/admin/college-logo-uploader.tsx` | Audit custom controls, button state, radius and form colors against shared kit; keep handlers and accessibility. |
| `src/components/admin/college-setup-checklist.tsx` | Normalize table/list separators, filters and toolbar; avoid card-per-row and redundant canvas. |
| `src/components/admin/college-signin-method-form.tsx` | Audit custom controls, button state, radius and form colors against shared kit; keep handlers and accessibility. |
| `src/components/admin/organization-actions.tsx` | Audit custom controls, button state, radius and form colors against shared kit; keep handlers and accessibility. |
| `src/components/admin/organization-create-form.tsx` | Audit custom controls, button state, radius and form colors against shared kit; keep handlers and accessibility. |
| `src/components/admin/tenant-directory-csv-control.tsx` | Normalize table/list separators, filters and toolbar; avoid card-per-row and redundant canvas. |
| `src/components/admin/tenant-domain-manager.tsx` | Audit custom controls, button state, radius and form colors against shared kit; keep handlers and accessibility. |
| `src/components/admin/tenant-restore-action.tsx` | Audit custom controls, button state, radius and form colors against shared kit; keep handlers and accessibility. |
| `src/components/admin/tenant-settings-editor.tsx` | Audit custom controls, button state, radius and form colors against shared kit; keep handlers and accessibility. |
| `src/components/admin/tenant-settings-other-keys.tsx` | Match semantic colors, typography, spacing and card-only-for-distinct-objects rules. |
| `src/components/college/college-admin-profile-editor.tsx` | Audit custom controls, button state, radius and form colors against shared kit; keep handlers and accessibility. |
| `src/components/college/college-department-insights.tsx` | Match semantic colors, typography, spacing and card-only-for-distinct-objects rules. |
| `src/components/college/college-faculty-assignment-actions.tsx` | Audit custom controls, button state, radius and form colors against shared kit; keep handlers and accessibility. |
| `src/components/college/college-faculty-csv-import.tsx` | Match semantic colors, typography, spacing and card-only-for-distinct-objects rules. |
| `src/components/college/college-faculty-lifecycle-action.tsx` | Audit custom controls, button state, radius and form colors against shared kit; keep handlers and accessibility. |
| `src/components/college/college-faculty-reassign-action.tsx` | Audit custom controls, button state, radius and form colors against shared kit; keep handlers and accessibility. |
| `src/components/college/college-faculty-schedule-reassign.tsx` | Match semantic colors, typography, spacing and card-only-for-distinct-objects rules. |
| `src/components/college/college-legacy-group-tabs.tsx` | Match semantic colors, typography, spacing and card-only-for-distinct-objects rules. |
| `src/components/college/college-offering-lifecycle-action.tsx` | Audit custom controls, button state, radius and form colors against shared kit; keep handlers and accessibility. |
| `src/components/college/college-offering-metadata-action.tsx` | Audit custom controls, button state, radius and form colors against shared kit; keep handlers and accessibility. |
| `src/components/college/college-person-audit-modal.tsx` | Audit custom controls, button state, radius and form colors against shared kit; keep handlers and accessibility. |
| `src/components/college/college-person-edit-action.tsx` | Audit custom controls, button state, radius and form colors against shared kit; keep handlers and accessibility. |
| `src/components/college/college-person-profile-overview-modal.tsx` | Audit custom controls, button state, radius and form colors against shared kit; keep handlers and accessibility. |
| `src/components/college/college-role-directory-workspace.tsx` | Normalize table/list separators, filters and toolbar; avoid card-per-row and redundant canvas. |
| `src/components/college/college-student-csv-import.tsx` | Match semantic colors, typography, spacing and card-only-for-distinct-objects rules. |
| `src/components/college/college-student-import-history.tsx` | Match semantic colors, typography, spacing and card-only-for-distinct-objects rules. |
| `src/components/college/college-student-lifecycle-action.tsx` | Audit custom controls, button state, radius and form colors against shared kit; keep handlers and accessibility. |
| `src/components/college/college-student-register-form.tsx` | Audit custom controls, button state, radius and form colors against shared kit; keep handlers and accessibility. |
| `src/components/college/student-class-move-action.tsx` | Audit custom controls, button state, radius and form colors against shared kit; keep handlers and accessibility. |
| `src/components/college/use-college-confirmation.tsx` | Match semantic colors, typography, spacing and card-only-for-distinct-objects rules. |


## Sequence and verification

Inventory first; then page styles and portal-specific components in small commits on `chatgpt/chat-4-b`. Use source review and syntax-conscious text edits only; **no repository code execution or CI**. Unvisited/loading-only files and any partial blockers must not be falsely marked complete. Browser visual parity will require the owner’s separate live review.
