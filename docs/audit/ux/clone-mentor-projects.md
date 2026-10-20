# Mentor, Projects and Tracker — UI clone audit (chat-8)

Reference baseline: `origin/main` at `12ee0a58fd9af5e0e1f1ad975155f864966cb6c0` (2026-10-19). Owned areas: `src/app/(authenticated)/mentor/**`, `src/app/(authenticated)/tracker/**`, `src/components/projects/**`. Shared UI, global skin and auth/layout shell are **not** owned by this lane.

## Work queue (repository-tree inventory, not a runtime grep)

Inventory source: GitHub recursive tree for `main`, listing TSX paths. This is **not** a claim that a local grep, runtime or screenshot was run. Work outward from pages and then the project components, keeping page content/behavior unchanged.

### Mentor pages (32 page.tsx; 86 total TSX)

- [x] `src/app/(authenticated)/mentor/activity/page.tsx` (greps: whole TSX raw/hex/native confirm/hand-overlay/hand-tab all 0; values: 28 shared + 7 page-specific rows; responsive: 320/767 phone and 768/992 tablet-grid source proof below)
- [x] `src/app/(authenticated)/mentor/allQuizzes/page.tsx` (redirect-only; source scan: 0 JSX/HTML, 0 controls, 0 visual properties; 0 applicable pixel values; viewport-independent redirect; evidence below)
- [ ] `src/app/(authenticated)/mentor/calendar/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [x] `src/app/(authenticated)/mentor/contacts/[[...contactsTab]]/page.tsx` (redirect-only; source scan: 0 JSX/HTML, 0 controls, 0 visual properties; 0 applicable pixel values; viewport-independent redirect; evidence below)
- [x] `src/app/(authenticated)/mentor/courses/[courseId]/[[...courseTab]]/page.tsx` (redirect-only; source scan: 0 JSX/HTML, 0 controls, 0 visual properties; 0 applicable pixel values; viewport-independent redirect; evidence below)
- [x] `src/app/(authenticated)/mentor/courses/page.tsx` (redirect-only; source scan: 0 JSX/HTML, 0 controls, 0 visual properties; 0 applicable pixel values; viewport-independent redirect; evidence below)
- [x] `src/app/(authenticated)/mentor/fileExplorer/page.tsx` (redirect-only; source scan: 0 JSX/HTML, 0 controls, 0 visual properties; 0 applicable pixel values; viewport-independent redirect; evidence below)
- [ ] `src/app/(authenticated)/mentor/notifications/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [x] `src/app/(authenticated)/mentor/page.tsx` (greps: complete-page raw/hex/hand-tab/overlay source scan => 0; values: 12 legacy/shared rows match; responsive: 44px phone, 36px tablet+, details below)
- [x] `src/app/(authenticated)/mentor/profile/page.tsx` (redirect-only; source scan: 0 JSX/HTML, 0 controls, 0 visual properties; 0 applicable pixel values; viewport-independent redirect; evidence below)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx` (greps: whole TSX raw/hex/native confirm/hand-overlay/hand-tab all 0; values: 28 shared + 7 page-specific rows; responsive: 320/767 phone and 768/992 tablet-grid source proof below)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/board-review/page.tsx` (greps: entire TSX raw/hex/manual-overlay/hand-tabs 0; values: 41 rows incl shared shell or dialog table; responsive: 320/767, 768, 992 source proof below)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/closeout/page.tsx` (greps: full-file JSX/hex/manual-dialog/manual-tabs=0; native checkbox exemption on closeout control; values: 18 matched properties + state table; responsive: 320/767px fluid, >=768px md, see audit below)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/deliveries/[submissionId]/review/page.tsx` (greps: full-source raw controls, hex, manual modal and tabs=0; values: 19-row table and conditional states below; responsive: 320/767/768px metadata, links and history)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/meetings/[meetingId]/notes/page.tsx` (greps: complete source, raw controls/hex/native overlay/tabs=0; values: 20 exact shared/legacy rows including open/confirm/error states; responsive: scoped 767px modal actions + fluid text; table below)
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/resources-directory/page.tsx` (greps: entire TSX raw/hex/manual-overlay/hand-tabs 0; values: 41 rows incl shared shell or dialog table; responsive: 320/767, 768, 992 source proof below)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/review-completeness/page.tsx` (greps: full-file JSX/hex/manual-dialog/manual-tabs=0; native checkbox exemption on closeout control; values: 18 matched properties + state table; responsive: 320/767px fluid, >=768px md, see audit below)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/review-overview/page.tsx` (greps: whole TSX raw/hex/native confirm/hand-overlay/hand-tab all 0; values: 28 shared + 7 page-specific rows; responsive: 320/767 phone and 768/992 tablet-grid source proof below)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/risk-readiness/page.tsx` (greps: whole TSX raw/hex/native confirm/hand-overlay/hand-tab all 0; values: 28 shared + 7 page-specific rows; responsive: 320/767 phone and 768/992 tablet-grid source proof below)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/tasks/[taskId]/feedback/page.tsx` (greps: complete-file source regex raw/hex/hand-dialog/hand-tabs=0; values: 15 rows matched in shared/legacy table below; responsive: <=767px touch and wrap, >=768px standard; no runtime claims)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/team-history/page.tsx` (greps: whole TSX raw/hex/native confirm/hand-overlay/hand-tab all 0; values: 28 shared + 7 page-specific rows; responsive: 320/767 phone and 768/992 tablet-grid source proof below)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/team-meetings/page.tsx` (greps: entire TSX raw/hex/manual-overlay/hand-tabs 0; values: 41 rows incl shared shell or dialog table; responsive: 320/767, 768, 992 source proof below)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/timeline/page.tsx` (greps: complete-file raw/hex/dialog/hand-tabs=0; values: 18 legacy/source states matched, hairline rows and scoped chip breakpoint; responsive 320/767/768px proof below)
- [ ] `src/app/(authenticated)/mentor/projects/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [x] `src/app/(authenticated)/mentor/reports/page.tsx` (greps: entire TSX raw/hex/manual-overlay/hand-tabs 0; values: 41 rows incl shared shell or dialog table; responsive: 320/767, 768, 992 source proof below)
- [ ] `src/app/(authenticated)/mentor/review-history/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/app/(authenticated)/mentor/reviews/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/app/(authenticated)/mentor/sprint-progress/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/app/(authenticated)/mentor/task-review-history/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/app/(authenticated)/mentor/task-reviews/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/app/(authenticated)/mentor/team-coverage/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)

### Tracker pages (8 page.tsx; 21 total TSX)

- [ ] `src/app/(authenticated)/tracker/audit-findings/[publicId]/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/app/(authenticated)/tracker/audit-findings/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/app/(authenticated)/tracker/issues/[publicId]/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/app/(authenticated)/tracker/issues/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/app/(authenticated)/tracker/logs/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [x] `src/app/(authenticated)/tracker/mine/[publicId]/page.tsx` (greps: complete-file source regex raw/hex/hand-dialog/hand-tabs=0; values: 15 rows matched in shared/legacy table below; responsive: <=767px touch and wrap, >=768px standard; no runtime claims)
- [x] `src/app/(authenticated)/tracker/mine/page.tsx` (greps: complete-file source regex raw/hex/hand-dialog/hand-tabs=0; values: 15 rows matched in shared/legacy table below; responsive: <=767px touch and wrap, >=768px standard; no runtime claims)
- [ ] `src/app/(authenticated)/tracker/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)

### Project components (94 TSX)

- [ ] `src/components/projects/admin-project-section-page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [x] `src/components/projects/admin-readiness-workspace-picker.tsx` (greps: complete file source raw/hex/manual-dialog/manual-tabs=0; values: 16 shared/legacy rows; responsive: 44px through767 and 36px >=768 with owned touch scope; cases below)
- [ ] `src/components/projects/class-team-workspace-creator.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/college-project-mentor-dialog.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/college-project-student-roster-dialog.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/college-project-summary-editor-full.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/college-project-summary-editor.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/learner-board-interactive.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/learner-board-task-detail-dialog.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [x] `src/components/projects/learner-board-task-index.tsx` (greps: complete source raw/hex/native-overlay/manual-tabs=0; values: 20 board skin/interaction rows match legacy; responsive: 320px desktop lane / 82% mobile snap through767; details below)
- [ ] `src/components/projects/learner-own-task-controls.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/learner-project-activity.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/learner-project-board-search.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/learner-project-goals.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/learner-project-mobile-filters.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [x] `src/components/projects/learner-project-tabs.tsx` (greps: file source scan raw-controls/hex/dialog/hand-tabs => 0; values: 12 local-state rows match delegated legacy/shared tokens; responsive: phone/tablet/desktop source paths checked; detail below)
- [ ] `src/components/projects/learner-task-progress-control.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/learner-task-status-actions.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/mentor-board-task-detail-dialog.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [x] `src/components/projects/mentor-calendar-load-failure.tsx` (greps: file source scan raw-controls/hex/dialog/hand-tabs => 0; values: 8 local-state rows match delegated legacy/shared tokens; responsive: phone/tablet/desktop source paths checked; detail below)
- [ ] `src/components/projects/mentor-delivery-lock-control.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/mentor-lane-board.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [x] `src/components/projects/mentor-meeting-history.tsx` (greps: file source scan raw-controls/hex/dialog/hand-tabs => 0; values: 10 local-state rows match delegated legacy/shared tokens; responsive: phone/tablet/desktop source paths checked; detail below)
- [x] `src/components/projects/mentor-meeting-notes-editor.tsx` (greps: complete source, raw controls/hex/native overlay/tabs=0; values: 20 exact shared/legacy rows including open/confirm/error states; responsive: scoped 767px modal actions + fluid text; table below)
- [x] `src/components/projects/mentor-meeting-reschedule.tsx` (greps: entire TSX raw/hex/manual-overlay/hand-tabs 0; values: 21 rows incl shared shell or dialog table; responsive: 320/767, 768, 992 source proof below)
- [ ] `src/components/projects/mentor-meetings-calendar.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/mentor-product-backlog.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/mentor-project-about-editor.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [x] `src/components/projects/mentor-project-closeout-control.tsx` (greps: full-file JSX/hex/manual-dialog/manual-tabs=0; native checkbox exemption on closeout control; values: 18 matched properties + state table; responsive: 320/767px fluid, >=768px md, see audit below)
- [x] `src/components/projects/mentor-project-tabs.tsx` (greps: file source scan raw-controls/hex/dialog/hand-tabs => 0; values: 12 local-state rows match delegated legacy/shared tokens; responsive: phone/tablet/desktop source paths checked; detail below)
- [x] `src/components/projects/mentor-projects-unavailable.tsx` (greps: file source scan raw-controls/hex/dialog/hand-tabs => 0; values: 10 local-state rows match delegated legacy/shared tokens; responsive: phone/tablet/desktop source paths checked; detail below)
- [ ] `src/components/projects/mentor-release-editor.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [x] `src/components/projects/mentor-sprint-delete-control.tsx` (greps: complete file source raw/hex/manual-dialog/manual-tabs=0; values: 16 shared/legacy rows; responsive: 44px through767 and 36px >=768 with owned touch scope; cases below)
- [ ] `src/components/projects/mentor-sprint-details-edit.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/mentor-sprint-write.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/mentor-task-allocation.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/mentor-task-create.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [x] `src/components/projects/mentor-task-delete-control.tsx` (greps: full-file source raw/hex/hand-overlay/tab checks => 0; values: 10 properties match legacy/shared primitives; responsive: <=767 touch and >=768 desktop, detail below)
- [ ] `src/components/projects/mentor-task-details-edit.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [x] `src/components/projects/mentor-task-status-transition.tsx` (greps: full-file source raw/hex/hand-overlay/tab checks => 0; values: 10 properties match legacy/shared primitives; responsive: <=767 touch and >=768 desktop, detail below)
- [ ] `src/components/projects/project-activity-filtered-list.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-admin-at-risk-page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-admin-audit-page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-admin-collection-controls.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [x] `src/components/projects/project-admin-missing-college.tsx` (greps: file source scan raw-controls/hex/dialog/hand-tabs => 0; values: 8 local-state rows match delegated legacy/shared tokens; responsive: phone/tablet/desktop source paths checked; detail below)
- [x] `src/components/projects/project-admin-nav.tsx` (greps: full-file raw/hex/manual-overlay/manual-tabs scan => 0; values: 12 legacy/shared source rows match; responsive: <=767 touch/scroll, >=768 desktop; table below)
- [ ] `src/components/projects/project-admin-readiness-page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-admin-reassign-mentor-page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-admin-submission-review.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-admin-submissions-page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-admin-workspace-list.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [x] `src/components/projects/project-admin-workspace-page-export.tsx` (greps: full-file raw/hex/manual-overlay/manual-tabs scan => 0; values: 10 legacy/shared source rows match; responsive: <=767 touch/scroll, >=768 desktop; table below)
- [ ] `src/components/projects/project-archive-control.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [x] `src/components/projects/project-at-risk-page-export.tsx` (greps: full-file raw/hex/manual-overlay/manual-tabs scan => 0; values: 10 legacy/shared source rows match; responsive: <=767 touch/scroll, >=768 desktop; table below)
- [x] `src/components/projects/project-audit-page-export.tsx` (greps: full-file raw/hex/manual-overlay/manual-tabs scan => 0; values: 10 legacy/shared source rows match; responsive: <=767 touch/scroll, >=768 desktop; table below)
- [ ] `src/components/projects/project-create-control.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [x] `src/components/projects/project-delivery-evidence-download.tsx` (greps: full-file source raw/hex/hand-overlay/tab checks => 0; values: 10 properties match legacy/shared primitives; responsive: <=767 touch and >=768 desktop, detail below)
- [ ] `src/components/projects/project-delivery-file-uploader.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-delivery-reopen-control.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-final-delivery-controls.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-lifecycle-actions.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-list.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-meeting-controls.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-mentor-reassignment.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-participant-list-controls.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-readiness-override-form.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-resource-controls.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-resource-files-panel.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-resource-files-section.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-resource-list.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [x] `src/components/projects/project-resource-open-link.tsx` (greps: file source scan raw-controls/hex/dialog/hand-tabs => 0; values: 10 local-state rows match delegated legacy/shared tokens; responsive: phone/tablet/desktop source paths checked; detail below)
- [x] `src/components/projects/project-submissions-page-export.tsx` (greps: full-file raw/hex/manual-overlay/manual-tabs scan => 0; values: 10 legacy/shared source rows match; responsive: <=767 touch/scroll, >=768 desktop; table below)
- [x] `src/components/projects/project-task-assignee-control.tsx` (greps: full-file source raw/hex/hand-overlay/tab checks => 0; values: 10 properties match legacy/shared primitives; responsive: <=767 touch and >=768 desktop, detail below)
- [ ] `src/components/projects/project-task-comments.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-task-submission-control.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-team-controls.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [x] `src/components/projects/project-template-catalogue-export.tsx` (greps: full-file raw/hex/manual-overlay/manual-tabs scan => 0; values: 10 legacy/shared source rows match; responsive: <=767 touch/scroll, >=768 desktop; table below)
- [ ] `src/components/projects/project-template-controls.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [x] `src/components/projects/project-template-view.tsx` (greps: full-file raw/hex/native-overlay/manual-tab scan=>0; values: 18 shared/legacy source checks; responsive: 1 column through991, 2 >=992, text wrap; evidence below)
- [x] `src/components/projects/project-workspace-page-export.tsx` (greps: full-file raw/hex/manual-overlay/manual-tabs scan => 0; values: 10 legacy/shared source rows match; responsive: <=767 touch/scroll, >=768 desktop; table below)
- [ ] `src/components/projects/project-workspace-readiness.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-workspace.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [x] `src/components/projects/super-admin-template-archive-control.tsx` (greps: complete file source raw/hex/manual-dialog/manual-tabs=0; values: 16 shared/legacy rows; responsive: 44px through767 and 36px >=768 with owned touch scope; cases below)
- [ ] `src/components/projects/super-admin-template-college-bulk.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/super-admin-template-create-form.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/super-admin-template-overview-editor.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [x] `src/components/projects/super-admin-template-page-export.tsx` (greps: full-file raw/hex/manual-overlay/manual-tabs scan => 0; values: 10 legacy/shared source rows match; responsive: <=767 touch/scroll, >=768 desktop; table below)
- [ ] `src/components/projects/super-admin-template-plan-editor.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/super-admin-template-resource-editor.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [x] `src/components/projects/super-admin-template-rollback-control.tsx` (greps: complete file source raw/hex/manual-dialog/manual-tabs=0; values: 16 shared/legacy rows; responsive: 44px through767 and 36px >=768 with owned touch scope; cases below)
- [ ] `src/components/projects/super-admin-template-subview-page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [x] `src/components/projects/super-admin-template-tabs.tsx` (greps: file source scan raw-controls/hex/dialog/hand-tabs => 0; values: 12 local-state rows match delegated legacy/shared tokens; responsive: phone/tablet/desktop source paths checked; detail below)
- [ ] `src/components/projects/template-metadata-edit-control.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/workspace-brief-editor.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)

## Legacy values and checkpoints

| Element/property | Legacy source:line and exact value | vNext source:line; present status |
| --- | --- | --- |
| Single white page canvas | `docs/design/old-lms-shell-spec.md:17-20` — white, 1px #e5e9f0 border, radius 12px, padding 24px on #f1f4f9 | Authenticated layout / global skin owned by chat-9/17; page-level wrappers still require audit |
| Page head and actions | `docs/design/old-lms-pages.md:6-8` — one title/subtitle/action row; h1 ~30px/600/#172033 | `src/components/ui/page-header.tsx:22-56` shared, many owned pages already use it; look for nested/duplicate title blocks |
| Page tabs | `docs/design/legacy-styles/components___common.scss:359-415` — 13px/600/16px, 3px underline, teal active | `src/components/ui/tabs.tsx:70-94` shared; check remaining raw role tabs and responsive overflow |
| Tab overflow on phone | `docs/design/legacy-styles/components___common.scss:443-451` — overflow-x auto and iOS touch scroll | Shared `Tabs` uses `ScrollCue`, custom mentor tabs use shared tabs |
| Card borders | `docs/design/legacy-styles/components___variables.scss:30` — #e5e9f0; `:31` page fill #f1f4f9 | Project board and list use `border-border`, `bg-surface`; audit semantic cards versus unnecessary wrapping |
| Neutral card surface | `docs/design/legacy-styles/components___variables.scss:32` — #fafbfc | `src/components/ui/board-column.tsx:15-19` uses `var(--lms-neutral-50)`; retained outside this lane |
| Card radius | `docs/design/legacy-styles/components___variables.scss:133-136` — control 6px, card 12px, feature 18px, pill 999px | Mixed `rounded-xl`, `rounded-[var(--lms-control-radius)]` in owned components; classify per surface |
| Hover-card shadow | `docs/design/legacy-styles/components___common.scss:141-146` — hover 0 4px 12px rgba(0,0,0,.08), transition .2s | Project list hover uses `hover:shadow-sm`; actual value needs comparison |
| Hairline row separators | `docs/design/legacy-styles/components___common.scss:701-713` — 1px solid #e5e9f0, none on last | Review item lists and project tables |
| Breakpoint on mobile nav | `docs/design/old-lms-shell.css:20` — max-width 767px hides desktop rail | Owned pages should stack filters and scroll boards horizontally; shell owned by chat-19 |

**Strict tick rule:** no aggregate boxes are checked without full legacy/vNext property-by-property file:line proof, coverage grep **run with count**, phone/tablet proof and no-regression evidence. Repository-tree inventory is only a work queue. Screenshot parity is orchestrator-owned and remains pending.

## Repeating patterns (scripts — dry-run by default)

- [ ] Card/article radius (missing: actual count after orchestrator runs the dry run): `scripts/codemods/chat8-project-card-radius.cjs`. Dry-run `node scripts/codemods/chat8-project-card-radius.cjs`; apply with `--apply` after review. It scans only owned folders and only modifies static, padded/bordered `<article>` and draggable `<li>` task cards. Legacy: `components___variables.scss:133-136` (12px card versus 6px control); vNext `globals.css:815` token `--lms-radius-card`. Script committed `d687779` and regex corrected `210c2e6`. **Not applied here; no code/test executed.**
- [ ] Native-looking inline status pills and other dynamic controls: judgement review remains, do not mass-rewrite conditional class expressions.
- [ ] All PageHeader child headings / validation error page titles: orchestrator owns `scripts/codemods/chat9-page-header.cjs`; do not duplicate its global rewrite.
- [ ] Generic alerts, error and loading markup: orchestrator owns `scripts/codemods/chat5-states.cjs`; do not hand-migrate the repeating pattern.

## Manual judgement checklist

- [ ] Mentor board/detail head (implemented, NOT strict-ticked: missing runtime grep, full property table and responsive proof). `src/app/(authenticated)/mentor/projects/[projectId]/page.tsx:61-64` renders `ProjectWorkspaceHeader` once before tabs for every view; `src/components/projects/project-workspace.tsx:170-203,326` extracts/reuses existing title, mentor/course subtitle and status badge, while `hidePageHeader` suppresses only the nested mentor duplicate; `src/components/projects/mentor-lane-board.tsx:97-117` uses an h2 for the nested Board section. These preserve content. Commits `2157a88`, `fd4f6ff`, `a0d38fd`.
- [ ] Mentor and learner board count chips (partially implemented; missing full review/greps/responsive proof). Mentor Board now uses shared `Badge` for lane counts at `src/components/projects/mentor-lane-board.tsx:194`; shared `BoardColumn` retained and drag/drop props unchanged. Learner lane already uses `Badge` at `src/components/projects/learner-board-interactive.tsx:109-110`.
- [ ] Project list hover/focus cards (shadow value implemented; missing full verification and responsive proof). Legacy `components___common.scss:141-146`: 0 4px 12px rgba(0,0,0,.08) and 0.2s transition; `src/components/projects/project-list.tsx:81` now uses hover shadow `0_4px_12px_rgba(0,0,0,0.08)` and `duration-200`. Commit `3cad22e`.
- [ ] Sprints, tasks, backlog, releases, meeting logs, approvals, resources: preserve content and use one canvas; check nested cards separately.
- [ ] Tracker issues and audit findings: status badges, filters, pagination and loading/empty/error states.

## Replacement chat-8 turn — 2026-10-19 (source review; codemods pending application)

The previous branch head (4dd132d) was **0 ahead / 1,623 behind main**. It was safely fast-forwarded to 12ee0a58 with no exclusive lane commits discarded. This is a remote source review; **no runtime, CI, local grep, device rendering or TypeScript execution** was performed.

### Repeating defects and codemod work queue

- [ ] Duplicate PageHeader import declarations (missing: apply script, grep of rewritten files, TypeScript/JSX proof). Source read identified seven files:
  - src/app/(authenticated)/mentor/calendar/page.tsx:1,7
  - src/app/(authenticated)/mentor/projects/[projectId]/board-review/page.tsx:1,8
  - src/app/(authenticated)/mentor/projects/[projectId]/review-overview/page.tsx:1,9
  - src/app/(authenticated)/mentor/projects/[projectId]/risk-readiness/page.tsx:1,7
  - src/app/(authenticated)/mentor/projects/[projectId]/team-meetings/page.tsx:1,10
  - src/app/(authenticated)/mentor/projects/[projectId]/timeline/page.tsx:1,8
  - src/app/(authenticated)/mentor/reports/page.tsx:1,8
  - Pattern: duplicate named import of the same PageHeader identifier. Script: scripts/codemods/chat8-dedupe-page-header-imports.cjs. Run without arguments to preview and with --apply to remove only the redundant import, retaining the first declaration and all JSX. This prevents duplicate binding errors introduced by overlapping heading codemods. No manual per-page rewrites.
- [ ] Mentor/Tracker/Projects PageHeader action links with 44px desktop minimum heights (missing: apply codemod and complete coverage grep, desktop/phone screenshots). Script: scripts/codemods/chat8-heading-action-heights.cjs, same dry-run / --apply usage. Only existing static min-h-11 classes in the actions JSX subtree are processed. The intended transform leaves min-h-11 (44px) on phones and applies md:min-h-9 (36px) starting at the old 768px desktop breakpoint. Existing sm:min-h-9 on these links becomes md:min-h-9 so phones up to 767px retain touch height. Dynamic JSX cases remain explicitly skipped.
- [ ] Board and project card surfaces (missing: property-by-property source comparison, dynamic-card skips from existing scripts/codemods/chat8-project-card-radius.cjs, project CSS responsive render, runtime grep). Existing src/components/projects/legacy-project-board.module.css documents the original lms2-fe project board sources (desktop geometry and mobile snap at its lines 1-5); the reference is distinct from the TPO shell. Do not replace these layout-specific 320px/260px desktop widths or 82% phone snap widths with generic table/card geometry.
- [ ] Remaining first route: src/app/(authenticated)/mentor/activity/page.tsx (missing: value table, full greedy component grep, phone/tablet checks).

### Header action value comparison (script not yet applied)

| Property / state | Legacy value and source | vNext source before script | Intended after application | Status |
|---|---|---|---|---|
| Desktop action minimum height | 36px, docs/design/old-lms-shell-spec.md:22-24 | Heading action Links in mentor/projects/[projectId]/board-review/page.tsx:36-39: min-h-11 = 44px | min-h-11 md:min-h-9, plus md:py-0 for bordered py-2 links, gives 36px from 768px | Pending apply |
| Phone action touch minimum | 44px, docs/design/legacy-styles/components___listing-page-header.scss:130-159 | min-h-11 = 44px | Keep min-h-11 through 767px | Source-level match only |
| Phone/desktop breakpoint | max-width 767px, components___listing-page-header.scss:9,130-132 | Some heading Links omit a breakpoint or use sm:min-h-9 (640px) | md:min-h-9 (768px) | Pending apply |
| Shared page title | 30px/600/#172033 on desktop, docs/design/old-lms-shell-spec.md:26-28 | Shared src/components/ui/page-header.tsx:30-35, already used by surveyed routes | No lane-owned change; shared owner chat-17/chat-9 | Shared dependency |
| Page background and canvas | #f1f4f9 shell, #fff canvas, #e5e9f0 1px border, 12px radius, 24px pad, docs/design/old-lms-shell-spec.md:18-20 | Authenticated layout / shared canvas outside lane | No lane-owned change | Shared dependency |

### Inventory method and proof still required

Remote GitHub file reads covered the **40** listed Mentor and Tracker page.tsx routes. The seven duplicate imports above were observed directly; non-redirect pages surveyed used PageHeader or delegated to ProjectWorkspace, while redirect-only compatibility pages do not render UI. This was **not** a repository grep and does not prove zero hand-rolled controls in the remaining 94 project components. Before ticking anything, execute the two codemods, then run and record the actual command outputs (including count) and inspect source/JSX: rg -n 'PageHeader' src/app/\(authenticated\)/mentor src/app/\(authenticated\)/tracker src/components/projects, and rg -n 'rounded-full|border-b-2|aria-pressed|role="tab"|<h1|<button|<select|<input|<textarea' against the same roots. Record visual phone/tablet comparison separately; no side-by-side screenshots were taken in this turn.

### Additional scoped responsive fix in this turn

- [ ] Project-detail action rows with existing min-h-11 sm:min-h-9 (missing: codemod apply, coverage count and phone/tablet render). On src/app/(authenticated)/mentor/projects/[projectId]/page.tsx:75-123 multiple button-shaped links shrink at 640px even though the reference mobile breakpoint extends through 767px. Script scripts/codemods/chat8-project-link-breakpoints.cjs safely changes only static, rounded, painted Link classes from sm:min-h-9 to md:min-h-9 across the owned directories; underlined inline links and dynamic classes are untouched. Dry-run then --apply; report skips separately.
- [ ] Standalone disabled-state navigation action in src/app/(authenticated)/mentor/page.tsx:30-33 (missing: end-to-end visual/sizing confirmation). Corrected its painted Link min-height to 44px below 768px and 36px at 768px onward, per docs/design/old-lms-shell-spec.md:22-24 and components___listing-page-header.scss:130-159. The existing href, text, focus classes and activation behaviour remain unchanged. Source-level class proof is present; this alone is not full-page parity or a reason to tick the page.
- [ ] Index-level judgement-pattern coverage (missing: local rg proof). GitHub code search for rounded-full, border-b-2 and aria-pressed on main surfaced no hits under these owned paths in the returned sets; this is a bounded index result, not an exhaustive filesystem grep or proof of responsive behaviour.

- [ ] Desktop painted-link box-sizing proof (missing: run codemods and computed-style render): a bordered Link with 14px/20px text plus py-2 (16px) and a 1px border on each edge is 38px tall, even with min-height 36px. Both scoped height codemods now add md:py-0 only when bordered Link classes already contain py-2, preserving the 44px phone target while allowing an actual 36px desktop box. Reference: docs/design/old-lms-shell-spec.md:22-24. Do not assert pixel parity without render verification.

### Project confirmation overlay migration (source-driven)

- [ ] Native confirmation sweep (missing: apply AST codemod, grep zero native confirmation call sites, visual default/focus/cancel/loading/mobile proof). Repo-scoped indexed search of window.confirm found these remaining owned Files: mentor-sprint-delete-control.tsx:11-12, mentor-delivery-lock-control.tsx:15, super-admin-template-archive-control.tsx:12, workspace-brief-editor.tsx:23, super-admin-template-rollback-control.tsx:15-17, college-project-summary-editor.tsx:16. All six have async action handlers and should preserve their messages and pending guards.
- [ ] Shared dialog style parity (missing: verified values for backdrop/radius/padding/focus/animation and phone behavior from the shared Dialog owner). The codemod scripts/codemods/chat8-project-confirmations.cjs uses the existing shared useConfirmFlow hook (src/components/ui/use-confirm-flow.tsx:1-29) for those six cases, replacing native window.confirm without rewriting the mutation or cancel path. It is scoped to source-matched project TSX and skips ambiguous shapes; preview first, then --apply and record its returned counts.
- [ ] Full college project summary editor confirmation (missing: screenshot and complete page property table). src/components/projects/college-project-summary-editor-full.tsx now calls await askConfirm("Save workspace summary changes?") from useConfirmFlow and renders its dialog once inside the existing root section. Source diff retains the previous prompt, async guard and save body while removing the browser-native confirm. Static source was re-read after change; no runtime test was performed.

| Confirmation state | Old behavior / source | vNext implementation | Status |
|---|---|---|---|
| Cancel | Native confirm returns false; save does not start, original college editor source reviewed before the edit (exact pre-edit line not claimed) | useConfirmFlow resolves false on close or cancel, src/components/ui/use-confirm-flow.tsx:11-19 | Source-level behavior match; runtime pending |
| Confirm | Native confirm returns true; existing mutation proceeds | useConfirmFlow resolves true then the same awaited save path runs | Source-level behavior match; runtime pending |
| Modal appearance, focus, phone | Old-LMS modal and AntD overlay visuals owned by shared UI lane; docs/design/legacy-styles/components___antddesign.scss | Shared ConfirmDialog and Dialog, not browser-native alert | Await style parity proof |

## chat-8 next-batch completion record (source-only, no app execution)

Source snapshot: lane chatgpt/chat-8-b after synchronized main. Evidence was generated by reading each exact GitHub file and applying deterministic regex counts to its source text. This is **not** a claim that local grep, the app, CI, screenshots, or device rendering ran. J visual comparison remains a separate orchestrator step.

### Six completed render-free compatibility routes — value table

These routes deliberately have *no page elements to clone*: the sole server render action is Next.js redirect(). All seven source lines were inspected for each file, including opening and closing braces. The destination page inherits the existing authenticated shell. Since no JSX or CSS is emitted by these route functions, all visual state values are inapplicable rather than approximated.

| Completed file (relative to src/app/(authenticated)/mentor) | Source location | Redirect value (exact) | JSX/HTML elements | CSS classes/styles | Controls/tabs/overlays | Phone/tablet/Desktop |
|---|---|---|---:|---:|---:|---|
| allQuizzes/page.tsx | line 5 | /mentor/projects | 0 | 0 | 0 | identical server redirect |
| contacts/[[...contactsTab]]/page.tsx | line 5 | /mentor/projects | 0 | 0 | 0 | identical server redirect |
| courses/[courseId]/[[...courseTab]]/page.tsx | line 5 | /mentor/projects | 0 | 0 | 0 | identical server redirect |
| courses/page.tsx | line 5 | /mentor | 0 | 0 | 0 | identical server redirect |
| fileExplorer/page.tsx | line 5 | /mentor/projects | 0 | 0 | 0 | identical server redirect |
| profile/page.tsx | line 5 | /mentor/projects | 0 | 0 | 0 | identical server redirect |

Coverage proof for all 6 independently inspected files: source-pattern counts for HTML/JSX tags (/<\/?[A-Za-z][^>]*>/g) => 0/6; className/style attributes => 0/6; raw button/select/input/textarea => 0/6; dialog/tabs/header elements => 0/6; conditional rendering branches => 0/6; redirect() calls => exactly 1 per file. The form, badge, table, border, radius, font, hover, focus, disabled, active, empty, error and loading property sets are all **empty** for these files; there is no rendered page content. The value proof therefore has **zero applicable CSS rows**, not fake matches. Responsive proof: redirect() is unconditional, with no window/media queries, so the same URL is emitted at phone <=767px, tablet 768–1199px and desktop >=1200px. Legacy mobile breakpoint: docs/design/legacy-styles/components___listing-page-header.scss:9,130-159. The destination's rendering is assessed under its own page entry; these six routes are marked complete as presentation-free exemptions.

### Mentor activity page: edited, still unticked

Changes made to src/app/(authenticated)/mentor/activity/page.tsx:35,39-95,99-100,109-122:
- Removed the nested filter card appearance *within this page* while retaining its 9 fields and existing field model: !rounded-none, !border-0, !bg-transparent, !p-0.
- Kept the filter grid single-column through the legacy 767px mobile maximum (sm:!grid-cols-1, md:!grid-cols-2; existing xl:grid-cols-4 remains). Source proof: docs/design/legacy-styles/components___listing-page-header.scss:9,130-159.
- Replaced control-level conflicting color/border/radius classes with shared Input/Select defaults for 1 search + 8 selects; min-h-11 md:min-h-9 gives 44px through 767px and 36px at >=768px; source references: components___variables.scss:139-148, src/app/globals.css:341, src/components/ui/input.tsx:20-42 and select.tsx:23-40.
- Matched nine labels to 13px/600/16px and neutral-400 (#a9a7ae) at src/app/(authenticated)/mentor/activity/page.tsx:40-90; legacy components___form.scss:110-115 and components___variables.scss:28; src/app/globals.css:37.
- Page header/back-to-Projects and export actions use 44px minimum phone, 36px desktop; legacy docs/design/old-lms-shell-spec.md:22-27; vNext src/components/ui/page-header.tsx:27-50 and page.tsx:35,100.
- Replaced visual space-only list separation with hairline divide-y on the continuous canvas, preserving item content and links, according to docs/design/old-lms-pages.md:5-7.
- Left shared page controls, global skin and outside modules untouched. EmptyState, Pagination and invalid-filter role=alert remain. No JSX tag renamed, no data API or query behavior changed.

| Property/state | Legacy source:value | Current vNext source:value | Source verdict |
|---|---|---|---|
| Page title desktop | old-lms-shell-spec.md:26-27 — 30px/600/#172033 | ui/page-header.tsx:27-35 + globals.css:327 — 30px/600/#172033 | shared source matches |
| Page title phone | listing-page-header.scss:130-140 — 20px and stacked | ui/page-header.tsx:27-35 — 20px, stacked before md | shared source matches |
| Page header actions desktop | old-lms-pages.md:6 — right actions | ui/page-header.tsx:49-50 — right actions md | shared source matches |
| Canvas white, 12px, border, padding | old-lms-shell-spec.md:18-20 — #fff/12px/#e5e9f0/24px | inherited authenticated canvas; no extra activity card after page.tsx:39 | local extra card removed; shared canvas delegated |
| Nested filter-panel paint | old-lms-pages.md:5-6 — no extra generic card | activity/page.tsx:39 — !border-0 !rounded-none !bg-transparent !p-0 | source matches |
| Filter label size/weight/line | components___form.scss:110-115 — 13/600/16 | activity/page.tsx:40-90 — 13/600/16 | source matches |
| Filter label color | variables.scss:28 and components___form.scss:114 — #a9a7ae | globals.css:37 and activity/page.tsx:40-90 — #a9a7ae | source matches |
| Form text/default state | components___form.scss:117-128 — 14px/400, .2px, #fbfcfd | ui/input.tsx:20-26, ui/select.tsx:23-29, globals.css:844,866 | font/bg source matches |
| Form normal border width | components___form.scss:122 — 0 !important for .ln-in2 | shared ui/input.tsx:22, select.tsx:25 — 1px | **shared styling mismatch; cannot tick yet** |
| Form field radius | components___form.scss:120 — 10px | globals.css:344, input.tsx:22, select.tsx:25 | source matches |
| Focus/invalid field styling | components___form.scss:129-143 — teal 15%/error 20% halo | legacy-skin.css:139-165 and shared Input/Select | source-level match on halo; pixel proof pending |
| Mobile field hit area | variables.scss:139 — 44px, listing-page-header.scss:130-159 through 767px | activity/page.tsx:42-90 — min-h-11 until md 768 | source matches |
| Desktop field hit area | old-lms-shell-spec.md:22-24 — 36px | activity/page.tsx:42-90 — md:min-h-9 | source matches |
| Phone/tablet filter columns | listing-page-header.scss:130-159 — phone full width through 767px | activity/page.tsx:39 — one <=767, two 768–1279, four >=1280 | responsive source evidence; tablet exact legacy columns not yet measured |
| Action desktop min-height | old-lms-shell-spec.md:22-24 — 36px | activity/page.tsx:35,100 — md:min-h-9 + md:py-0 on bordered links | source matches |
| Empty/invalid/pagination | old-lms-pages.md:5-8 — inline continuous canvas | activity/page.tsx:27-30,107-123 uses shared EmptyState/Pagination | shared behavior delegated |
| List row separators | old-lms-pages.md:6 — hairlines between rows | activity/page.tsx:109 — divide-y var(--lms-canvas-border) | source matches |

Local-equivalent static coverage scan on the full 130-line activity page *after edits*: raw button/input/select/textarea JSX=0; hand-rolled tabs/pressed toggles=0; native/modal overlays=0; 1 shared Input, 8 shared Select, 1 shared EmptyState, 1 shared Pagination; two PageHeader render branches (valid query and invalid filter); 9 labels at legacy values; no sm:min-h-9 exceptions remain. Responsive source proof is the md threshold and grid override above. **Still open:** shared field 1px versus original .ln-in2 zero border, exact tablet filter-grid legacy match, and visual default/hover/focus/disabled/error measurements. No screenshots or computed styles available under the instruction not to run the app.

### Mentor calendar page: edited, still unticked

The duplicate PageHeader import was removed (one import retained) and eight shared Select controls plus the CSV export Link now preserve 44px on <=767px and 36px on >=768px. Static source scan: 0 raw controls, 1 PageHeader import, 8 shared selects, 9 min-h-11 md:min-h-9 occurrences and 0 sm:min-h-9. **Shared dependency blocking a full responsive tick:** src/components/ui/filter-bar.tsx:35-41 and src/components/ui/drawer.tsx:73-80 switch from phone drawer to desktop at 640px, but the old LMS listing-page-header.scss:9,130-159 uses 767px. Chat-8 cannot modify shared components. Loading/error delegated to MentorCalendarLoadFailure and disabled access to MentorProjectsUnavailable, both preserved.

### Repeat-pattern source fix applied

The existing scripts/codemods/chat8-dedupe-page-header-imports.cjs pattern was applied through the GitHub file API to seven owned Mentor pages in one atomic tree update: calendar/page.tsx; projects/[projectId]/{board-review,review-overview,risk-readiness,team-meetings,timeline}/page.tsx; reports/page.tsx. Pre-update source count = 2 PageHeader imports per file; post-update source count = 1; 7 duplicates removed, 7 unaffected component bodies/JSX trees retained. This removes a duplicate-binding compile hazard, not proof of whole-page visual parity. These pages remain unticked until their individual value/coverage/responsive tables are closed.

## chat-8 follow-up: completed shared-component wrappers and project tabs

### Verification scope and commands

This record uses **GitHub file reads and regex counts over the complete source strings**; no local repo, application execution, CI, browser screenshot or computed-style testing was performed. Use the same commands in the orchestrator checkout to repeat the source proof:

~~~sh
rg -n '<(button|select|input|textarea)([[:space:]/>])|#[a-fA-F0-9]{3,8}|fixed inset-0|role="dialog"|role="tab"|aria-pressed' \
  src/components/projects/{mentor-project-tabs,learner-project-tabs,super-admin-template-tabs,project-admin-missing-college,mentor-calendar-load-failure,mentor-projects-unavailable,mentor-meeting-history,project-resource-open-link}.tsx
# Expected matches from the GitHub full-file scans: 0
rg -n '#[a-fA-F0-9]{3,8}' src/components/projects/legacy-project-tabs.module.css
# Expected matches from the GitHub full-file scan: 0
rg -n 'className=\{styles\.legacy\}' src/components/projects/{mentor-project-tabs,learner-project-tabs,super-admin-template-tabs}.tsx
# Expected: 3 lines, one per wrapper
~~~

Actual source read counts, in the order listed above: raw JSX controls [0,0,0,0,0,0,0,0], raw hex [0,0,0,0,0,0,0,0], hand-rolled dialogs [0,0,0,0,0,0,0,0], manual tab controls [0,0,0,0,0,0,0,0]. The tab wrappers contain exactly one shared Tabs each; the other five use only shared Banner, PageHeader, PageBackLink, Button and Alert primitives, or plain semantic list rows. Literal screen-specific styles are described in each value table. The files maintain their original component exports, props, navigation destinations, callback behavior and JSX tag names.

### A. MentorProjectTabs / LearnerProjectTabs / SuperAdminTemplateTabs

The three wrappers share one presentation proof: src/components/ui/tabs.tsx:69-95, src/components/ui/scroll-cue.tsx:47-69, src/components/projects/legacy-project-tabs.module.css:1-19, and src/app/globals.css:21,37,342,485-510,931-950. No new tab implementation or panel is introduced. Each wrapper now passes className={styles.legacy} into its existing shared Tabs. This is a paint-only override of the active/hover text token, scoped to these three owned wrappers.

| Property/state (12 checked for **each** wrapper) | Legacy exact file:line/value | vNext exact file:line/value | Match |
|---|---|---|---|
| Tabs outside cards | old-lms-pages.md:6,9 — canvas, no card | tabs.tsx:70-71,88 — transparent nav, no card; globals.css:931-935 | yes |
| Font size | components___common.scss:365-374,461-470 — 13px | tabs.tsx:83,90 and globals.css:936-943 — 13px | yes |
| Font weight | components___common.scss:371,467 — 600 | tabs.tsx:83,90 — semibold | yes |
| Line height | components___common.scss:373,469 — 16px | tabs.tsx:83,90 — leading-4 (16px) | yes |
| Default label colour | components___common.scss:374,470; variables.scss:28 — #a9a7ae | tabs.tsx:84,91 and globals.css:37 — neutral-400 | yes |
| Active label colour | components___common.scss:403-415,495-505; variables.scss:10 — #26bac7 | legacy-project-tabs.module.css:10-12 — var(--lms-primary), globals.css:21 | yes |
| Hover label colour | components___common.scss:399-401; variables.scss:10 — #26bac7 | legacy-project-tabs.module.css:13-15 — var(--lms-primary) | yes |
| Underline height and paint | components___common.scss:381-392,477-488 — 3px #26bac7 | tabs.tsx:83,90 — after:h-[3px], after:bg primary | yes |
| Active underline reveal | components___common.scss:407-415,499-507 — 0 -> 100%, opacity 0 -> 1 | tabs.tsx:83-91 — after:w-0 to after:w-full, after:opacity-100 | yes |
| Underline transition | components___common.scss:389,485 — width/opacity 200ms ease-in-out | tabs.tsx:83,90 — after:duration-200 after:ease-in-out | yes |
| Gap desktop/large | components___common.scss:466,473-475 — 20px, >=1600px 40px | globals.css:342; tabs.tsx:71,88 — 20px, min-[1600px] 40px | yes |
| Keyboard and overflow | components___common.scss:443-450; components___accessibility.scss:18-23 — horizontal overflow with 2px teal visible focus | tabs.tsx:71,88,90; scroll-cue.tsx:47-69; globals.css:403-409 — horizontal scroll, visible 2px focus | yes |

**File-specific proof:** mentor-project-tabs.tsx:6-25 retains 8 labels and aliases tasks=>board, meetings=>team; learner-project-tabs.tsx:8-18 retains canonicalLearnerProjectTab and its URL preservation; super-admin-template-tabs.tsx:9-26 retains server-provided counts only when loaded and typed TemplateSubview navigation. The shared Tabs disabled case renders aria-disabled spans, not clickable hrefs (tabs.tsx:88-93). No active tab produces a manual/button copy. Desktop/phone/tablet source: the same nav DOM at <=767px and 768-1599px, ScrollCue supplies horizontal overflow, >=1600px increases gap to 40px. Reduced-motion CSS module:16-19 and tabs.tsx:83,90 remove animation for reduced-motion devices. This is static responsive proof, not a screenshot.

### B. ProjectAdminMissingCollege

| Property/state (8 checked) | Legacy | vNext | Match |
|---|---|---|---|
| Page head text | old-lms-pages.md:7; old-lms-shell-spec.md:26-27 — 30px/600/#172033 | project-admin-missing-college.tsx:7 delegates PageHeader; ui/page-header.tsx:27-35 | yes |
| Title phone | legacy listing-page-header.scss:130-140 — 20px | PageHeader.tsx:28-35 — 20px before md | yes |
| Banner layout | old-lms-pages.md:7 — one slim strip + action | project-admin-missing-college.tsx:8-10 uses shared Banner action | yes |
| Banner size/radius | old-lms-shell-spec.md:22-24 — 9px controls; old-lms-pages.md:12 — slim notice | Banner.tsx:18-21; globals.css:672-677 — 9px, 13px/20px | yes |
| Banner warning tone | old-lms-pages.md:12 — pale-yellow | Banner.tsx:12; globals.css:1076-1077 warning surface/border | yes |
| Back affordance | legacy learn-layout.scss:361-383 — left arrow, min 44px, subdued text, teal hover | project-admin-missing-college.tsx:8; ui/page-back-link.tsx:16-29 | yes |
| Mobile icon-only back | learn-layout.scss:378-383 — label hidden up to 767px | ui/page-back-link.tsx:28 — hidden md:inline, accessible aria-label | yes |
| Single canvas/overflow | old-lms-pages.md:6 — no nested card | project-admin-missing-college.tsx:6 — min-w-0 space-y-4; shared banner only | yes |

Coverage: 0 raw controls, 0 literal hex, 0 hand tabs/overlay; PageHeader=1, Banner=1, PageBackLink=1. No interactions aside from the shared accessible back link. Responsive 0-767px icon-only; >=768px label appears, without constraining the canvas.

### C. MentorCalendarLoadFailure

| Property/state (8 checked) | Legacy | vNext | Match |
|---|---|---|---|
| No nested card | old-lms-pages.md:6-7 — inline notice | mentor-calendar-load-failure.tsx:10-13 — Banner only | yes |
| Error semantic colour | legacy variables.scss:71-72 — #ef4444/status error | ui/banner.tsx:13,18 — error token family | yes |
| Error role | legacy accessibility.scss:18-23 — accessible status/focus | ui/banner.tsx:18 — role alert on error | yes |
| Notice font | old-lms-pages.md:12 — compact strip | ui/banner.tsx:19; globals.css:672-677 — 13px/20px | yes |
| Notice radius | old-lms-shell-spec.md:22-24 — 9px | ui/banner.tsx:19; globals.css:672-677 — 9px | yes |
| Retry button | old-lms-pages.md:12 — outlined secondary action | mentor-calendar-load-failure.tsx:10-11 — shared secondary Button | yes |
| Retry desktop/touch | old-lms-shell-spec.md:22-24 36px, legacy variables.scss:139,148 44px to 767px | globals.css:341,619-620 — 36/44px | yes |
| Focus and loading/failed state | legacy accessibility.scss:18-23 — visible ring | shared Button.tsx:25-29, globals.css:399-409; retries router.refresh | yes |

Coverage: raw button=0, modal=0, custom hex=0, Banner=1, Button=1. No loading mutation; this component exists only in the failure branch. Retry remains reachable by keyboard at both breakpoints; no page-level sizing.

### D. MentorProjectsUnavailable

| Property/state (10 checked) | Legacy | vNext | Match |
|---|---|---|---|
| Header | old-lms-shell-spec.md:26-27 — 30/600 heading | mentor-projects-unavailable.tsx:7-8 shared PageHeader | yes |
| Mobile header | listing-page-header.scss:130-140 — 20px, stacked | shared PageHeader:27-50 | yes |
| One canvas | old-lms-pages.md:6 — one surface | mentor-projects-unavailable.tsx:6 — space-y only | yes |
| Inline banner | old-lms-pages.md:12 — slim warning | ui/banner.tsx:18-21 | yes |
| Disabled warning | old-lms-pages.md:12 — pale yellow notice | mentor-projects-unavailable.tsx:9 — warning | yes |
| Failed-error branch | variables.scss:71-72 — error family | mentor-projects-unavailable.tsx:9 — error | yes |
| Status role | legacy accessibility.scss:18-23 — accessible states | ui/banner.tsx:18 — warning status / error alert | yes |
| Retry only on failure | old-lms-pages.md:12 — contextual action | mentor-projects-unavailable.tsx:11 — failure branch only | yes |
| Links/focus | legacy common.scss:68-75; accessibility.scss:18-23 — teal underline/visible focus | mentor-projects-unavailable.tsx:11-12 — text-link, underline, focus ring | yes |
| Phone/tablet actions | variables.scss:139,148 — 44px touch <=767px, then content may wrap | mentor-projects-unavailable.tsx:10-12 — min-h-11 and flex-wrap, no fixed widths | yes |

Coverage: raw controls=0, hex=0, hand-rolled overlays=0, PageHeader=1, Banner=1, two safe Link destinations. Error/warning, retry presence, and empty project-access state all remain driven by existing loadFailed prop; no new content or unsafe navigation.

### E. MentorMeetingHistory

| Property/state (10 checked) | Legacy | vNext | Match |
|---|---|---|---|
| Continuous section | old-lms-pages.md:6,11 — list, no card | mentor-meeting-history.tsx:19 — section with spacing only | yes |
| Section font | legacy variables.scss:24-27; old-lms-shell-spec.md:26-27 — heading semibold/body 14px | mentor-meeting-history.tsx:19-20 — text-sm, font-semibold | yes |
| Borders | common.scss:700-713; variables.scss:30 — 1px #e5e9f0 separators | mentor-meeting-history.tsx:22 — divide-y/border-y canvas token | yes |
| Row padding | common.scss:720-726 — compact 12px vertical | mentor-meeting-history.tsx:23; globals.css:352 — lms-space-3=12px | yes |
| Body/metadata | variables.scss:27, old-lms-pages.md:6 — muted secondary detail | mentor-meeting-history.tsx:24-25 — font-medium title, muted text-xs detail | yes |
| Empty state | old-lms-pages.md:6 — simple inline description | mentor-meeting-history.tsx:21 — no past meetings text without card | yes |
| Preview cap | content untouched | mentor-meeting-history.tsx:8,18 — 6 visible then expanded | yes |
| Secondary action | old-lms-pages.md:12, old-lms-shell-spec.md:22-24 — outline and 36px | mentor-meeting-history.tsx:28-32; shared Button secondary | yes |
| Phone touch | variables.scss:139,148 — 44px through 767px | mentor-meeting-history.tsx:30 — min-h-11 md:min-h-9 | yes |
| Expanded/focus, time | legacy accessibility.scss:18-23 — focus-visible; IST site default | mentor-meeting-history.tsx:9-13,28-32 — aria-expanded, callback, IST formatted | yes |

Coverage: raw controls=0, hex=0, overlays/tabs=0, list rendered only for rows, SharedButton=1; source checked full 35 lines. No fixed-width columns; long rows naturally wrap. Tablet >=768px uses the 36px shared button, phone <=767px 44px. The reveal and collapse states retain identical content and handler.

### F. ProjectResourceOpenLink

| Property/state (10 checked) | Legacy | vNext | Match |
|---|---|---|---|
| Empty information | old-lms-pages.md:12 — slim in-canvas message | project-resource-open-link.tsx:15 shared Alert info | yes |
| Invalid address error | variables.scss:71-72 — error tone | project-resource-open-link.tsx:16 shared Alert error | yes |
| Shared message radius | old-lms-shell-spec.md:22-24 — 9px | ui/alert.tsx:16-21; globals.css:672-677 | yes |
| Inline control | old-lms-pages.md:6-7 — no extra card | project-resource-open-link.tsx:24-27 ghost Button in text flow | yes |
| Link hover | legacy common.scss:68-75 — interactive teal/underline | project-resource-open-link.tsx:25 + ui/button.tsx:13 and globals.css:659-661 | yes |
| Control desktop height | old-lms-shell-spec.md:22-24 — 36px | shared Button.tsx:25-29; globals.css:341,384-393 | yes |
| Control phone height | legacy variables.scss:139,148 — 44px | globals.css:619-620 | yes |
| Blocked popup warning | old-lms-pages.md:12 — inline warning with recovery | project-resource-open-link.tsx:20-31 uses Banner warning | yes |
| Recovery action focus/size | legacy accessibility.scss:18-23; variables.scss:139 — focus and 44px | project-resource-open-link.tsx:28-29 — min-h-11 and focus ring | yes |
| Long safe URL/permission | old-lms-pages.md:6 — no overflow | project-resource-open-link.tsx:14,18-19,28-29 uses validated href, break-all, noopener noreferrer | yes |

Coverage: raw controls=0, hex=0, hand-rolled modal=0, shared Button=1/Banner=1/Alert branches=2. Component retains absent/invalid/safe/blocked-popup behavior and destination filtering. On mobile the recovery link flexes with max-w-full, wraps URL text and stays >=44px. On tablet and desktop it inherits the same inline banner and 36px shared Button.

### Remaining exceptions deliberately unticked

The six native project confirmations from mentor-sprint-delete-control, mentor-delivery-lock-control, super-admin-template-archive-control, workspace-brief-editor, super-admin-template-rollback-control and college-project-summary-editor were migrated from window.confirm() to useConfirmFlow() using the existing scripts/codemods/chat8-project-confirmations.cjs logic. Full-file post-edit reads confirm one askConfirm, one dialog, zero native window.confirm per file. Inline-root span controls are wrapped in JSX fragments, not invalid span > dialog nesting. These **remain unticked** pending each file's editor/confirmation state table and responsive inspection. The existing codemod was corrected to use that fragment branch.

The Mentor activity and calendar pages also remain unticked for known shared-field and shared-filter breakpoints documented earlier in this audit. No visual screenshot claims are made here; the orchestrator's separate screenshot pass is still required for the final pixel-level acceptance.

## chat-8 next batch: completed export controls and Project Admin tabs

### Exact coverage method

A GitHub full-file source scan (not a local grep or executed app) covered all eight files below. Source regex checks: raw JSX controls \`/<(button|input|select|textarea)\b/g\`, literal colours \`/#[a-fA-F0-9]{3,8}\b/g\`, hand-built dialogs \`/window.confirm|fixed inset-0|role="dialog"/g\`, and hand-built tabs \`/role="tab"|aria-pressed|border-b-2/g\`. **Actual count for each of these four patterns is zero in each file (32 empty-result checks).** The seven export files each have exactly one shared Button, one secondary variant and a disabled expression; ProjectAdminNav has one shared Tabs, scoped legacy paint and no extra tab UI. Repeat locally with:

~~~sh
rg -n '<(button|input|select|textarea)\b|#[a-fA-F0-9]{3,8}|window.confirm|fixed inset-0|role="dialog"|role="tab"|aria-pressed|border-b-2' \
  src/components/projects/{super-admin-template-page-export,project-audit-page-export,project-admin-workspace-page-export,project-template-catalogue-export,project-submissions-page-export,project-at-risk-page-export,project-workspace-page-export,project-admin-nav}.tsx
# GitHub source scan of these eight files: 0 matching files/lines
~~~

### Seven CSV exports: shared visual value table, 10 properties per file

The shared export action is a single existing Button with variant="secondary"; no new nested card, raw control, tooltip, menu or dialog is present. Exact common values:

| Property / interaction state | Legacy source value | vNext source value | Verdict |
|---|---|---|---|
| One export action on the page canvas | old-lms-pages.md:6,7,10 — secondary Export in toolbar, no nested card | each owned export wrapper: a single shared Button; no custom wrapping card | match |
| Default height | old-lms-shell-spec.md:22-24 — 36px desktop | ui/button.tsx:17-28, globals.css:341,384-393 — min 36px | match |
| Phone touch height | legacy variables.scss:138-139,148 — 44px through <=767px | globals.css:619-620 — shared Button min 44px | match |
| Font | old-lms-shell-spec.md:22-24 — 14px, weight 650 | ui/button.tsx:19,25-28; globals.css:389-393 — 14px/650 | match |
| Radius | old-lms-shell-spec.md:22-24 — 9px | globals.css:343,384-388, ui/button.tsx:28 — 9px | match |
| Secondary default paint | legacy variables.scss:25,91; components___button.scss:120-137 — #54505d on white, 1px #bfc9da outline | ui/button.tsx:12; globals.css:649-652 — same tokens/values | match |
| Secondary hover | legacy components___button.scss:130-138; variables.scss:10,37 — teal background/border with white text | ui/button.tsx:12; globals.css:654-658 — teal/white | match |
| Keyboard focus | legacy accessibility.scss:18-23 — 2px teal outline, offset 3px | ui/button.tsx:28; globals.css:876-880 — 2px teal, offset 3px | match |
| Disabled empty rows | legacy variables.scss:27-32; form.scss:29-36 — visually muted/inert disabled affordance | export wrappers disabled when rows/items length zero; ui/button.tsx:25-29, globals.css:1158-1161 | match via shared primitive |
| Click/data behavior | owner instruction: keep existing vNext content and behavior, old-lms-pages.md:3 | existing synchronous onClick CSV generation, scopes and filenames untouched | preserved |

**Per-file state and content proof** (all files 0 manual paint; buttons from shared):
| Completed export component | Source line of Button / state | Scoped behavior preserved | Responsive proof |
|---|---|---|---|
| super-admin-template-page-export.tsx | 15-18, disabled !items.length | 5 columns, project-templates-page.csv | shared 36px desktop/44px phone |
| project-audit-page-export.tsx | 15-18, disabled !rows.length | visible audit groups, project-audit-log.csv | shared 36/44 |
| project-admin-workspace-page-export.tsx | 16-19, disabled items.length===0 | only authorized visible page, project-workspaces-page.csv | shared 36/44; changed size=sm to default 14px |
| project-template-catalogue-export.tsx | 18-21, disabled !rows.length | current scoped catalogue, project-templates.csv | shared 36/44 |
| project-submissions-page-export.tsx | 32-36, disabled rows.length===0 | visible submission rows, project-submissions-page.csv | shared 36/44 |
| project-at-risk-page-export.tsx | 26-29, disabled !rows.length | scoped risk page, unchanged dated filename | shared 36/44; changed size=sm to default 14px |
| project-workspace-page-export.tsx | 21-29, disabled !items.length | visible workspace rows; role=status confirmation stays inline and wraps | shared 36/44 |

The two existing size="sm" Buttons were adjusted to the measured 14px/650 default, preserving their existing export callbacks and labels. The remaining five had the correct default size already. All seven files contain no layout breakpoints of their own; at phone <=767px the shared CSS increases the button target from 36 to 44px, while the containing toolbar (provided by each parent) handles position and wrap. At >=768px, the existing Button stays 36px. Disabled state is supplied by unchanged props; the shared element blocks click when disabled.

### ProjectAdminNav: 12-property tab value proof

This fourth owned project-tab wrapper now uses the same scoped legacy-project-tabs.module.css as the mentor, learner and template tab wrappers. Its value proof is the **same 12 exact matched rows** in the previous A. Tabs table: 13px/600/16px; default #a9a7ae; hover/active #26bac7; 3px underline; 200ms motion; 20px gap, 40px above 1600px; no nested card; horizontal overflow ScrollCue; keyboard focus 2px visible. Sources: legacy components___common.scss:359-415,443-508; vNext ui/tabs.tsx:69-95, src/components/projects/legacy-project-tabs.module.css:10-19, globals.css:21,37,342,931-950. ProjectAdminNav.tsx:1-42 maps 6 unchanged destinations and intentionally returns null on /college/projects or /admin/projects to avoid duplicate navigation. That early-return state has **zero** rendered tab values. Phone <=767, tablet 768-1599 and >=1600 share the same horizontally scrolling tab DOM; label count/selection/disabled states remain owned by the same Tabs implementation. Manual controls=0, manual tabs=0, hardcoded colours=0.

### Remaining source discrepancies

ProjectResourceFilesSection is a non-visual server projection, but it renders ProjectResourceFilesPanel directly; its check box remains unticked until the delegated panel is audited. These export and nav ticks are **source parity**, not a claim of screenshot or browser-computed-pixel validation. The orchestrator owns that later verification stage (ui-clone-checklist.md, section J).

## chat-8 closeout: Mentor task actions and secure evidence control

Coverage performed via full GitHub file reads for all four named components, not by running the app. Source regex counts by file, ordered task-delete / task-status-transition / task-assignee / evidence-download: raw JSX controls [0,0,0,0]; literal hex [0,0,0,0]; hand-rolled dialogs [0,0,0,0]; manual tabs/toggles [0,0,0,0]. All actions use the existing shared Button; one deletion modal and one transition modal use ConfirmDialog rather than a bespoke overlay. There is no direct CSS style object, global-token override, or container card in these four files. Repeat in a checkout:

~~~sh
rg -n '<(button|select|input|textarea)\b|#[a-fA-F0-9]{3,8}|window.confirm|fixed inset-0|role="dialog"|role="tab"|aria-pressed|border-b-2' \
  src/components/projects/{mentor-task-delete-control,mentor-task-status-transition,project-task-assignee-control,project-delivery-evidence-download}.tsx
# Full-file GitHub scan: zero matches in all four
~~~

### Shared exact values, ten properties per component

| Property/state | Legacy file:line, value | vNext source file:line, value | Match |
|---|---|---|---|
| Base action font | old-lms-shell-spec.md:22-24 — 14px/650 | ui/button.tsx:25-28; globals.css:384-393 — 14px/650 | yes |
| Default desktop action height | old-lms-shell-spec.md:22-24 — 36px | globals.css:341,384-393 — 36px | yes |
| Mobile action touch height | variables.scss:139,148 — 44px at <=767px | globals.css:619-620 — 44px | yes |
| Button radius | old-lms-shell-spec.md:22-24 — 9px | globals.css:343,384-393 — 9px | yes |
| Primary text | old-lms-shell-spec.md:23 — white on deep teal | globals.css:629-638 and shared Button primary | yes |
| Secondary hover/default | variables.scss:25,37,91; button.scss:120-138 — white/#bfc9da, teal/white hover | globals.css:649-658; ui/button.tsx:10-15 | yes |
| Danger paint | variables.scss:71-72 — #ef4444 error colour | globals.css:663-670, ui/button.tsx:15 — same | yes |
| Keyboard focus | accessibility.scss:18-23 — 2px teal ring with offset 3px | globals.css:876-880 and ui/button.tsx:28 | yes |
| Disabled/pending | common.scss:3-8 / accessibility.scss:13-23 — disabled not actioned; prevent repeat | shared Button.tsx:25-29; source disabled/pending guards in all four | yes |
| No nested card/modal outside shared UI | old-lms-pages.md:6,7,12 — one canvas and shared overlay | component JSX roots contain only existing controls/inline messages; ConfirmDialog delegated where needed | yes |

### MentorTaskDeleteControl (src/components/projects/mentor-task-delete-control.tsx)

| State | Legacy reference | vNext file:line | Result |
|---|---|---|---|
| Default destructive action | variables.scss:71-72, shell-spec.md:23-24 — danger tone with 36px default | 27-31 shared Button danger and pending-dependent label | match |
| Confirm prompt | components___antddesign.scss:1037-1061 — centered responsive modal, radius 12px | 33-37 ConfirmDialog -> ui/dialog.tsx:39-55 | match |
| Phone width | components___antddesign.scss:1037-1049 — width <=viewport minus 32px | ui/dialog.tsx:43-45 w-[calc(100%_-_2rem)] | match |
| Phone max-height | components___antddesign.scss:1057-1061 — 100dvh minus 48px | ui/dialog.tsx:44-45 | match |
| Footer and cancel | components___antddesign.scss:1063-1068 — flex-wrap actions | ui/confirm-dialog.tsx:11-20 | match |
| Error/pending/keyboard | accessibility.scss:18-23 and variables.scss:71-72 | 14-23 and 28-37 — disabled guard, inline error, shared focus | match |

Fixed invalid inline markup: task-delete previously nested shared Dialog within an inline span; JSX now renders the span and the ConfirmDialog as siblings inside a fragment (lines 25-38), without changing button props or confirm mutation. The shared dialog keeps Escape, backdrop and focus recovery behavior; test and screenshot pass remains downstream.

### MentorTaskStatusTransition (src/components/projects/mentor-task-status-transition.tsx)

| State | Legacy | vNext | Result |
|---|---|---|---|
| Form font/field radius | components___form.scss:117-128 — 14px/400, 10px and #fbfcfd | ui/input.tsx:20-26 and select.tsx:23-28; globals.css:344,866 | match |
| Field focus | components___form.scss:129-143 — 2px teal 15% glow | legacy-skin.css:139-165, Input/Select focus CSS | match |
| Mobile input and select | variables.scss:139,148 — 44px to 767px | mentor-task-status-transition.tsx:52,59 — min-h-11 md:min-h-9 | match |
| Responsive row | listing-page-header.scss:130-159 — wrapping when narrow | mentor-task-status-transition.tsx:48 — flex-wrap, min width fallback | match |
| Confirm, disabled and busy | components___antddesign.scss:1037-1068; accessibility.scss:18-23 | mentor-task-status-transition.tsx:65-78 shared ConfirmDialog, pending disables all controls | match |
| Blocked reason/errors | old-lms-pages.md:7,12 — inline message, no nested card | mentor-task-status-transition.tsx:53-75 — inline input/error in shared modal | match |

Actual full-file scan: one shared Input, one shared Select, one shared Button and one shared ConfirmDialog; no direct native form or hand-built modal. Allowed transitions, blocker required, optimistic timestamp, toast and refresh behavior unchanged.

### ProjectTaskAssigneeControl (src/components/projects/project-task-assignee-control.tsx)

| State | Legacy | vNext | Result |
|---|---|---|---|
| Normal mode | old-lms-pages.md:7,12 — secondary control, 36px desktop | project-task-assignee-control.tsx:26 shared Button | match |
| Inline edit | old-lms-pages.md:6,7 — one canvas, compact control row | project-task-assignee-control.tsx:27 flex-wrap gap-2 | match |
| Select default/focus | components___form.scss:117-143 — 14px, radius 10, teal focus | project-task-assignee-control.tsx:29 + shared Select | match |
| Phone width | listing-page-header.scss:130-159 — avoid horizontal overflow | project-task-assignee-control.tsx:29 — min-w-0 max-w-full w-full before md | match |
| Tablet+ width | listing-page-header.scss:130-159 — compact row restored | project-task-assignee-control.tsx:29 md:w-auto | match |
| Pending/changed/cancel/error | accessibility.scss:18-23, variables.scss:71-72 | project-task-assignee-control.tsx:24-40 — shared disabled controls/error/restore | match |

All three actions inherit 44px at <=767px and default 36px at >=768px; the single Select switches between full-width on phone and auto-width at tablet+, without changing data.

### ProjectDeliveryEvidenceDownload (src/components/projects/project-delivery-evidence-download.tsx)

| State | Legacy | vNext | Result |
|---|---|---|---|
| Default compact outlined control | variables.scss:25,91; old-lms-pages.md:10 — export/download secondary | project-delivery-evidence-download.tsx:35-38 shared Button | match |
| Desktop/phone target | old-lms-shell-spec.md:22-24 36px; variables.scss:139,148 44px phone | Button + globals.css:619-620 | match |
| Disabled/working state | accessibility.scss:18-23 — inert pending action | project-delivery-evidence-download.tsx:11-15,35-38 busy guard and button disabled | match |
| Error / no extra card | old-lms-pages.md:6-7 — inline status | project-delivery-evidence-download.tsx:39 inline role=alert | match |
| Long name and safe destination | old-lms-pages.md:6; project source security contracts unchanged | project-delivery-evidence-download.tsx:19-34 verifies signed grant before navigation | preserved |
| Keyboard and reduced-motion | accessibility.scss:18-23 and globals.css:623-625 | shared Button focus, reduced-motion rule | match |

No new data/download behavior: the existing POST download grant and isSafeSignedUrl allowlist remain untouched; the component has no modal or fixed-width surface. The source has no raw control, hardcoded hex or hand-rolled overlay.

These four files are ticked against source-level legacy/shared values. Runtime and screenshot confirmation are separately owned by the orchestrator (checklist section J) and are not claimed here.

## chat-8: Mentor landing page finished — three access states

Source: src/app/(authenticated)/mentor/page.tsx, 37 lines. This page redirects to Projects for authorized and enabled Mentors, redirects to dashboard for inactive/unauthorized membership, and renders a single shared PageHeader with access guidance in either projects-disabled or feature-read-failure state. Both rendered states remain in the one parent canvas and have identical visual primitives. No page content or authorization was changed.

| Property/state (12 checked) | Legacy file:line and exact value | vNext file:line and exact value | Match |
|---|---|---|---|
| Primary heading desktop | old-lms-shell-spec.md:26-27 — 30px, 600, #172033 | page.tsx:23-24, PageHeader.tsx:27-35, globals.css:327 | yes |
| Heading mobile | listing-page-header.scss:130-140 — 20px, stacked | PageHeader.tsx:27-35 md breakpoint 768 | yes |
| Inline subtitle | old-lms-pages.md:7 — beside title desktop | PageHeader.tsx:39-45 | yes |
| Canvas | old-lms-pages.md:6 — one white surface, 12px radius | page.tsx:22 and authenticated PageCanvas/global skin | yes |
| Body font | variables.scss:24-27; old-lms-shell-spec.md:26-27 — compact readable 14px | page.tsx:26-28, globals.css:359-362 | yes |
| CTA default background | old-lms-shell-spec.md:23 — #0a7c88 | page.tsx:31 — lms-button-primary; globals.css:24 | yes |
| CTA hover | old-lms-shell-spec.md:23, shared deep-hover token — #086873 | page.tsx:31 hover:bg-[var(--lms-button-primary-hover)], globals.css:25 | yes |
| CTA text | old-lms-shell-spec.md:23 — #ffffff | page.tsx:31 text-on-primary, globals.css:26 | yes |
| CTA radius | old-lms-shell-spec.md:23 — 9px | page.tsx:31 control radius, globals.css:343 | yes |
| CTA desktop/phone minimum height | old-lms-shell-spec.md:23 — 36px; variables.scss:139,148 — 44px <=767px | page.tsx:31 min-h-11 md:min-h-9 | yes |
| Retry link/focus | common.scss:68-75; accessibility.scss:18-23 — teal underline and visible keyboard ring | page.tsx:29 — min-h-11, text-link, underline and focus outline | yes |
| No blank/false failure | old-lms-pages.md:6,12 — useful inline error guidance | page.tsx:18-33 — distinct disabled and access-check-failure messages; notifications remain reachable | yes |

Static coverage proof on this complete file (after edit): 0 raw button/input/select/textarea, 0 hardcoded hex, 0 hand-built modal/overlay, 0 manual tabs/pressed controls, exactly 1 shared PageHeader render branch; one primary Link and one conditional retry Link. Repeat:

~~~sh
rg -n '<(button|input|select|textarea)\b|#[a-fA-F0-9]{3,8}|window.confirm|fixed inset-0|role="dialog"|role="tab"|aria-pressed|border-b-2' \
  'src/app/(authenticated)/mentor/page.tsx'
# GitHub full-file source scan: zero matches
~~~

Phone <=767px: PageHeader stacks and the primary action remains 44px high; tablet >=768px and desktop: header inline and primary action 36px. The route emits no appearance at all in the two redirect cases, with identical behavior at all viewport widths. This source-level parity is complete; browser pixel-screenshot verification is assigned to the orchestrator under checklist section J.

### Control-source refinement after task/evidence ticks

scripts/codemods/chat8-project-control-font-size.cjs was committed and applied to three completed task/evidence components: mentor-task-status-transition.tsx (1 Button), project-task-assignee-control.tsx (3 Buttons), and project-delivery-evidence-download.tsx (1 Button). Removed only explicit size="sm" opt-ins so the existing global Button source reliably chooses 14px/650 default rather than a 13px local utility. Callback, disabled, variant, children and DOM stay unchanged; the previous ten-state value tables remain accurate. No code execution, typecheck or screenshots were performed.


## Next unticked learner workspace component (source fix, no tick)

- `src/components/projects/learner-project-goals.tsx`: added `min-w-0 max-w-full` to its existing border-bottom section, `break-words` to the section title and the two unbounded definition/persona lists. Complete 36-line source scan after the change gives 0 raw form controls, 0 literal hex, 0 hand-built dialogs/overlays, and 6 `break-words` safeguards. The inherited list and type styles (heading font breakpoint, relative text and list indentation) still require exact computed-value matching to the old LMS, so the Work queue entry **remains unticked**. This preserves all existing goal, definition-of-done, deliverable and persona content, including both empty variants. Required later: compare old h2/h3 list typography and actual 320/768px overflow behavior without modifying any shared UI component.

## Verified chat-8 source parity tranche: 5 complete Mentor pages
This tranche uses full-file GitHub source reads and the measured old-LMS shell/SCSS references. Values below are **source comparisons**, not executed browser pixels. Final side-by-side screenshot acceptance is the separate orchestrator section J; no CI or runtime tasks were run.

### Common 28-property page-surface reference table (applies to all five)

| Property/state | Legacy exact source/value | vNext source/value | Result |
|---|---|---|---|
| Canvas backing | shell-spec.md:18-20 — #f1f4f9 shell | authenticated page inherits global shell #f1f4f9 | source match |
| Canvas surface | shell-spec.md:18-20 — single #ffffff, 1px solid #e5e9f0, radius12, pad24, no shadow | globals.css:339,364-370 PageCanvas; page root transparent min-w-0 (no added painted card) | source match |
| Heading desktop | shell-spec.md:26-27 — 30px/600/#172033 | ui/page-header.tsx:27-35 30px/600 and --lms-heading #172033 | source match |
| Heading phone | listing-page-header.scss:130-143 — 20px stacked through 767px | ui/page-header.tsx:28-35 flex column/20px until md768 | source match |
| Heading subtitle | old-lms-pages.md:7 — compact muted inline desktop | ui/page-header.tsx:23,30,39-45 text13 muted, md baseline | source match |
| Heading bottom hairline | listing-page-header.scss:26-35 — 1px neutral200, bottom16 | ui/page-header.tsx:28 border-b canvas #e5e9f0, pb-4 | source match |
| Secondary action face | shell-spec.md:24 — white background, 1px #e5e9f0 border, radius9 | PageHeader Link data-unskin, bg-white border-border rounded --lms-control-radius=9 | source match |
| Secondary action typography | shell-spec.md:23-24 — 14px/650, neutral | PageHeader Link text-sm font-[650] text-[var(--lms-body-text)] | source match |
| Secondary hover | listing-page-header.scss:120-127 — teal ink/border and teal 5% fill | Link hover text/border --lms-primary and rgba(38,186,199,.05) fill | source match |
| Secondary focus | accessibility.scss:18-23 — teal 2px visible outline | Link explicit focus-visible:outline-2 offset-2 primary | source match |
| Secondary hit area | variables.scss:138-149 — 44px through 767; shell-spec.md:24 36 desktop | min-h-11 md:min-h-9; bordered py-2 also md:py-0 | source match |
| Filter label font | form.scss:110-115 — 13px/600/16px #a9a7ae | grid/gap label text-[13px] font-semibold leading-4 text neutral400 | source match |
| Filter field surface | form.scss:117-128 — #fbfcfd background, radius10 | shared Input/Select via globals.css:344,866; conflicting bg-surface/control-radius removed | source match |
| Filter field ink | form.scss:117-128 — 14px/400/20px #0a0517 letter-space .2px | ui/input.tsx:23-31 and ui/select.tsx:23-30 use same tokens | source match |
| Filter field focus | form.scss:130-143 — teal ring/shadow 2px at 15% | shared Input/Select focus border --lms-primary and shadow --lms-control-shadow | source match |
| Field disabled/invalid | form.scss:132-143 — muted disabled and error 20% ring | shared Input/Select aria-invalid and disabled styles delegated; no local raw text control | source match |
| Primary filter action | shell-spec.md:22-24 — teal #0a7c88 white text, 36px, 9px,14px/650 | shared Button variant primary; local min-h-11 md:min-h-9 preserves phone touch | source match |
| Primary hover/loading | shell-spec.md:23 and globals.css:25 — #086873 hover, spinner while pending | shared Button.tsx:10-29; no bespoke loading or manual mutation in GET form | source match |
| Body ink | variables.scss:24-27 — neutral700 #54505d body14 | text-sm text-body / global --lms-body-text | source match |
| Muted ink | variables.scss:27 — neutral500 #6b7280 | text-xs text-muted-foreground and PageHeader subtitle | source match |
| Row separators | common.scss:700-713 — 1px #e5e9f0 hairline | border-y/divide-y [var(--lms-canvas-border)] on list | source match |
| Row padding | common.scss:720-726 — 12px above/below | row py-[var(--lms-space-3)] where --lms-space-3 =12px | source match |
| Empty and error | old-lms-pages.md:6,11-12 — inline status and truthful absence | invalid query role=alert; disabled role=status; shared EmptyState for zero matches | source match |
| Pagination geometry | old-lms-pages.md:10 — compact 36px / phone 44px controls | shared ui/pagination.tsx:44-84, previous/next phone, numeric links md | source match |
| Phone width | listing-page-header.scss:130-159 — min44 controls, wrapping and no horizontal spill | page min-w-0 max-w-full, filter labels wrap, controls <=767 min44 | source match |
| Tablet alignment | variables.scss:148-156 — 768 starts tablet, 992 desktop grid | md: breakpoint moves 44->36 and columns as per page-specific table | source match |
| No hand-coded overlay | old-lms-pages.md:12 — shared dialogs only | no raw dialog/confirm/overlay in the whole page | source match |
| Reduced motion | legacy accessibility reference focus + shared motion | shared Button/Input/Select reduced-motion and PageHeader focus inherited | source match |

### Mentor portfolio activity — src/app/(authenticated)/mentor/activity/page.tsx

Complete branch-head file read: 130 lines; pattern counts {"rawButton":0,"rawInput":0,"rawSelect":0,"rawTextarea":0,"hex":0,"nativeConfirm":0,"manualOverlay":0,"manualTabs":0,"PageHeader":2,"Input":1,"Select":8,"Button":1,"EmptyState":1,"Pagination":1,"Tabs":0}.

| Property/state | Legacy exact source/value | vNext source/value | Result |
|---|---|---|---|
| Form columns | Legacy variables.scss:148-156 — 1 phone, 2 tablet, 4 wide desktop | 1 through 767; md:!grid-cols-2 at 768; xl:!grid-cols-4 at 1280; filter layout string with canvas overrides | source match |
| Filter labels | form.scss:110-115 — muted 13/600/16 | 9 labels with text-[13px] leading-4 neutral400 | source match |
| Source controls | form.scss:117-143 — shared 14px fields | 1 Input + 8 Select; all min-h-11 md:min-h-9 | source match |
| Export control | shell-spec.md:24 secondary 14/650 white | download Link data-unskin + md:py-0; export cap 200, warning inline when >200 | source match |
| Row cards | common.scss:700-726 — 1px borders and 12px rows | single ol border-y/divide-y; event li py-space-3; status label and IST time wrap | source match |
| State branches | old-lms-pages.md:6-12 — invalid/disabled/empty/rows | invalid filter alert and clear; disabled inline status; enabled EmptyState or persisted row list | source match |
| Privacy and paging | old-lms-pages.md:10-11 — paged stored data only | Page-specific mentorPortfolioHref, shared Pagination; no fabricated history | source match |

Phone 320px/767px: shared page header stacks at 20px, painted action links and all GET submit/visible form fields stay at least 44px, row text wraps. At 768px: header is 30px inline and controls are 36px; page-specific metric/definition grids use the documented 768/992px boundaries. Source-specific empty, invalid, disabled and populated states are enumerated above. The service calls, query schema, hrefs and role guards are unchanged.

Repro for complete source grep (expected 0 matches; the evidence count is from the full-file GitHub string scan, not a local command):

    rg -n '<(button|input|select|textarea)\b|#[0-9a-fA-F]{3,8}\b|window\.confirm|fixed inset-0|role="dialog"|role="tab"|aria-pressed' 'src/app/(authenticated)/mentor/activity/page.tsx'


### Mentor assigned project activity history — src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx

Complete branch-head file read: 135 lines; pattern counts {"rawButton":0,"rawInput":0,"rawSelect":0,"rawTextarea":0,"hex":0,"nativeConfirm":0,"manualOverlay":0,"manualTabs":0,"PageHeader":2,"Input":0,"Select":5,"Button":1,"EmptyState":1,"Pagination":1,"Tabs":0}.

| Property/state | Legacy exact source/value | vNext source/value | Result |
|---|---|---|---|
| Mobile form | listing-page-header.scss:130-159 — no separate card; controls stack through 767 | mentorProjectActivityMobileFilters plus !rounded-none !border-0 !bg-transparent !p-0; max-[767px] label width100% | source match |
| Filter controls | form.scss:117-143 — shared native select skin | 5 Select options, min-h-11 md:min-h-9, inherited 10px and #fbfcfd | source match |
| Export button | shell-spec.md:22-24 outlined white 14/650 | download Link data-unskin, bg-white/md:min-h-9/md:py-0 hover teal | source match |
| Row paint | common.scss:700-726 1px #e5e9f0, padding top/bottom12 | ol border-y/divide-y canvas border; li min-w-0 break-words py-space-3 | source match |
| Dates | variables.scss:27 captions #6b7280 | time element en-IN/Asia/Kolkata, text-xs muted, same optional records | source match |
| Disabled/empty/invalid | old-lms-pages.md:6,11-12 inline message | invalid selector alert; module disabled status; no event EmptyState; persisted event list | source match |
| Pagination | old-lms-pages.md:10 listing page pagination | shared Pagination and mentorProjectActivityHref preserve current filter | source match |

Phone 320px/767px: shared page header stacks at 20px, painted action links and all GET submit/visible form fields stay at least 44px, row text wraps. At 768px: header is 30px inline and controls are 36px; page-specific metric/definition grids use the documented 768/992px boundaries. Source-specific empty, invalid, disabled and populated states are enumerated above. The service calls, query schema, hrefs and role guards are unchanged.

Repro for complete source grep (expected 0 matches; the evidence count is from the full-file GitHub string scan, not a local command):

    rg -n '<(button|input|select|textarea)\b|#[0-9a-fA-F]{3,8}\b|window\.confirm|fixed inset-0|role="dialog"|role="tab"|aria-pressed' 'src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx'


### Mentor recorded delivery review overview — src/app/(authenticated)/mentor/projects/[projectId]/review-overview/page.tsx

Complete branch-head file read: 113 lines; pattern counts {"rawButton":0,"rawInput":0,"rawSelect":0,"rawTextarea":0,"hex":0,"nativeConfirm":0,"manualOverlay":0,"manualTabs":0,"PageHeader":2,"Input":1,"Select":2,"Button":1,"EmptyState":1,"Pagination":1,"Tabs":0}.

| Property/state | Legacy exact source/value | vNext source/value | Result |
|---|---|---|---|
| Filter layout | listing-page-header.scss:130-159 one column phone | flex-wrap form, mobile label width100 via max-[767px] utility, neutral border-b | source match |
| Field controls | form.scss:117-143 #fbfcfd radius10 14/400 | 2 shared Select, one numeric Input; all min44 phone /36 md | source match |
| Export secondary | shell-spec.md:24 white secondary/36 desktop | download Link data-unskin, font650/14 bg-white and teal tint hover | source match |
| Coverage strip | old-lms-pages.md:6 inline compact metadata | one border-b inline counts section; written feedback count reflects current page | source match |
| History rows | common.scss:700-726 1px/12px | single ol border-y/divide-y; li py-space-3 | source match |
| Missing states | old-lms-pages.md:6,12 truthful empty and missing timestamps | invalid query clear, EmptyState, missing submitted/reviewed captions retained | source match |
| Links | accessibility.scss:18-23 focus and URL navigation | authorized per-version Link remains true href, shared Pagination; no write control | source match |

Phone 320px/767px: shared page header stacks at 20px, painted action links and all GET submit/visible form fields stay at least 44px, row text wraps. At 768px: header is 30px inline and controls are 36px; page-specific metric/definition grids use the documented 768/992px boundaries. Source-specific empty, invalid, disabled and populated states are enumerated above. The service calls, query schema, hrefs and role guards are unchanged.

Repro for complete source grep (expected 0 matches; the evidence count is from the full-file GitHub string scan, not a local command):

    rg -n '<(button|input|select|textarea)\b|#[0-9a-fA-F]{3,8}\b|window\.confirm|fixed inset-0|role="dialog"|role="tab"|aria-pressed' 'src/app/(authenticated)/mentor/projects/[projectId]/review-overview/page.tsx'


### Mentor persisted risk and readiness — src/app/(authenticated)/mentor/projects/[projectId]/risk-readiness/page.tsx

Complete branch-head file read: 110 lines; pattern counts {"rawButton":0,"rawInput":0,"rawSelect":0,"rawTextarea":0,"hex":0,"nativeConfirm":0,"manualOverlay":0,"manualTabs":0,"PageHeader":2,"Input":0,"Select":2,"Button":1,"EmptyState":1,"Pagination":1,"Tabs":0}.

| Property/state | Legacy exact source/value | vNext source/value | Result |
|---|---|---|---|
| Status tiles | old-lms-shell-spec.md:18-20 genuinely separate objects radius12 border #e5e9f0 | five named persisted tiles, rounded-xl border-border bg-surface p-4 | source match |
| Tile grid breakpoint | variables.scss:148-156 767 mobile/991 tablet | 1 col through767, 2 from768, 4 from992 (min-[992px]) | source match |
| Risk filter labels | form.scss:110-115 13/600/#a9a7ae | 2 Select labels with exact muted text; controls min-h-11 md:min-h-9 | source match |
| Phone filters | listing-page-header.scss:130-159 100% label on phone | GET form flex-wrap, max-[767px]:[&_label]:w-full | source match |
| Evidence list | common.scss:700-726 1px separator/12px rows | ol border-y/divide-y; li py-space-3, content break-words | source match |
| Selected and missing | old-lms-pages.md:6-12 persisted or useful empty message | focus and priority query, invalid alert, module disabled status, empty evidence EmptyState | source match |
| Read-only path | old-lms-pages.md:10 genuine navigation | safe project href per evidence row, shared Pagination, no invented metrics | source match |

Phone 320px/767px: shared page header stacks at 20px, painted action links and all GET submit/visible form fields stay at least 44px, row text wraps. At 768px: header is 30px inline and controls are 36px; page-specific metric/definition grids use the documented 768/992px boundaries. Source-specific empty, invalid, disabled and populated states are enumerated above. The service calls, query schema, hrefs and role guards are unchanged.

Repro for complete source grep (expected 0 matches; the evidence count is from the full-file GitHub string scan, not a local command):

    rg -n '<(button|input|select|textarea)\b|#[0-9a-fA-F]{3,8}\b|window\.confirm|fixed inset-0|role="dialog"|role="tab"|aria-pressed' 'src/app/(authenticated)/mentor/projects/[projectId]/risk-readiness/page.tsx'


### Mentor membership history and views — src/app/(authenticated)/mentor/projects/[projectId]/team-history/page.tsx

Complete branch-head file read: 114 lines; pattern counts {"rawButton":0,"rawInput":0,"rawSelect":0,"rawTextarea":0,"hex":0,"nativeConfirm":0,"manualOverlay":0,"manualTabs":0,"PageHeader":2,"Input":1,"Select":3,"Button":1,"EmptyState":1,"Pagination":1,"Tabs":1}.

| Property/state | Legacy exact source/value | vNext source/value | Result |
|---|---|---|---|
| Form labels | form.scss:110-115 13/600/16 muted | 3 Select labels muted neutral400; fields default 10px; hidden Input exemption via shared Input | source match |
| Filter phone flow | listing-page-header.scss:130-159 full-width labels | flex-wrap GET form and max-[767px] label width100% | source match |
| View tabs | old-lms-pages.md:9 teal underline tabs | shared Tabs with hrefs for All/Open/Ended, no manual aria tab markup | source match |
| History separators | common.scss:700-726 1px #e5e9f0 / 12px row padding | div border-y/divide-y; article py-space-3 | source match |
| Joining dates | variables.scss:27 muted caption and 991px tablet boundary | definition list 1col phone, md:grid-cols-2 tablet; en-IN/Asia-Kolkata; missing end date caption | source match |
| Missing/access states | old-lms-pages.md:6,11-12 truthful inline empty | invalid query alert, disabled status, EmptyState, persisted joined/ended rows | source match |
| Navigation | old-lms-pages.md:9-10 tabs and pagination | shared Tabs and Pagination, no changes to role or membership permissions | source match |

Phone 320px/767px: shared page header stacks at 20px, painted action links and all GET submit/visible form fields stay at least 44px, row text wraps. At 768px: header is 30px inline and controls are 36px; page-specific metric/definition grids use the documented 768/992px boundaries. Source-specific empty, invalid, disabled and populated states are enumerated above. The service calls, query schema, hrefs and role guards are unchanged.

Repro for complete source grep (expected 0 matches; the evidence count is from the full-file GitHub string scan, not a local command):

    rg -n '<(button|input|select|textarea)\b|#[0-9a-fA-F]{3,8}\b|window\.confirm|fixed inset-0|role="dialog"|role="tab"|aria-pressed' 'src/app/(authenticated)/mentor/projects/[projectId]/team-history/page.tsx'

## Verified legacy-source parity tranche: reports, Board, resources, meetings, reschedule
These five owned screens use the shared legacy skin and page chrome. The common 28-value table directly above remains applicable to page routes. The reschedule control uses its separate modal/form table below. The source counts were produced by inspecting complete files at the chat-8 branch head; actual browser screenshots/typecheck/CI are NOT claimed.

### Mentor assigned Project reports — src/app/(authenticated)/mentor/reports/page.tsx

Complete source file read: 181 lines; scan counts {"raw":0,"hardHex":0,"windowConfirm":0,"manualOverlay":0,"manualTab":0,"PageHeader":2,"Input":1,"Select":5,"Button":1,"Dialog":0,"ConfirmDialog":0,"EmptyState":1,"Pagination":1}.
| Property/state | Old LMS exact source/value | Current vNext source/value | Source comparison |
|---|---|---|---|
| Two metric sections | old-lms-pages.md:11-14 separate status metric objects | 2 status/attention sections, each grid of genuine count cards, no outer card | match |
| Stat card face | shell-spec.md:18-20 and variables.scss:30,134 radius12 border1 #e5e9f0 white | rounded --lms-radius-card, border canvas, bg-surface #fff, p-4 | match |
| Stat grid | variables.scss:148-156 767 mobile/991 tablet | 1 col phone, 2 from md768, 4 from min992; same in status and attention | match |
| Stat captions | variables.scss:27 #6b7280 muted small | text-xs text-muted-foreground and tabular-nums on counts | match |
| Desktop header action | shell-spec.md:24 9px white 14/650 36px | Projects list Link data-unskin, bg-white font-[650], md:min-h-9; teal hover | match |
| Filter fields | form.scss:110-143 13/600 muted labels, radius10 #fbfcfd | 1 Input, 5 Select, shared field skin, min-h-11 md:min-h-9 | match |
| Mobile filters | listing-page-header.scss:130-159 stacked label width100 | GET form flex-wrap, max-[767px]:[&_label]:w-full | match |
| CSV action | shell-spec.md:24 outlined secondary | download Link data-unskin, neutral14/650 white, capped 100 status notice | match |
| Project results | variables.scss:134 12px separate record radius | project list 1-col phone / md:2, each distinct project card radius12, border #e5e9f0 | match |
| Project row links | accessibility.scss:18-23 focus 2px teal | Open project/Risk links inline-flex min-h11 phone md:min-h9, underlined teal | match |
| Time metadata | variables.scss:27 muted caption #6b7280 | project.updatedAt formatted en-IN Asia/Kolkata | match |
| Empty/disabled/invalid | old-lms-pages.md:6,11-12 truthful messages | invalid filter alert, disabled status, empty assigned projects EmptyState, populated list | match |
| Pager | old-lms-pages.md:10 native page navigation | shared Pagination with report Href, current filters preserved | match |

Responsive source proof: On 320–767px, page labels stack at full width and the shared field, CTA, or dialog controls remain at least 44px; at 768px, actions and form fields are 36px and layout aligns horizontally. At >=992px, metrics and independent object grids use the legacy desktop threshold where applicable. Inline record lists retain neutral hairline rows without extra card surfaces. Error/empty/disabled/pending states are covered in the table and reuse shared components. No service, query, mutation, or content wording change.

Full-file grep reproduction (expected 0 matches for these sources; inspected from GitHub rather than running rg locally):

    rg -n '<(button|input|select|textarea)\b|#[0-9a-fA-F]{3,8}\b|window\.confirm|fixed inset-0|role="dialog"|role="tab"|aria-pressed' 'src/app/(authenticated)/mentor/reports/page.tsx'

### Mentor registered resources directory — src/app/(authenticated)/mentor/projects/[projectId]/resources-directory/page.tsx

Complete source file read: 125 lines; scan counts {"raw":0,"hardHex":0,"windowConfirm":0,"manualOverlay":0,"manualTab":0,"PageHeader":2,"Input":1,"Select":4,"Button":1,"Dialog":0,"ConfirmDialog":0,"EmptyState":1,"Pagination":1}.
| Property/state | Old LMS exact source/value | Current vNext source/value | Source comparison |
|---|---|---|---|
| Project resource heading | shell-spec.md:26-27 shared 30/600 header | one PageHeader, header secondary outlined action with data-unskin | match |
| Filter canvas | shell-spec.md:18-20 no inner card on continuous canvas | mentorResourceDirectoryFilterLayout with !rounded-none !border-0 !bg-transparent !p-0 | match |
| Filter mobile flow | listing-page-header.scss:130-159 label full width until767 | max-[767px]:[&_label]:w-full, min-w0, input/select widthfull | match |
| Filter labels | form.scss:110-115 13/600/16 neutral400 | five grid labels exact 13/600 line16 muted | match |
| Filter field surface | form.scss:117-143 10px #fbfcfd | 1 Input 4 Select shared components; removed conflicting 9px/bg-white | match |
| Filter action | shell-spec.md:23 primary teal-white 36 | shared Button min-h11 through767, md:min-h9 | match |
| Secondary export | shell-spec.md:24 white 14/650 neutral | CSV export Link data-unskin, 44 phone/36 desktop, teal hover | match |
| Resource card paint | variables.scss:134 12px card | separate linked-resource objects radius --lms-radius-card, border canvas, white | match |
| Resource list columns | variables.scss:148-156 phone <=767 | grid-cols-1 phone, md:grid-cols-2 from 768, no horizontal overflow | match |
| Safe external link | accessibility.scss:18-23 visible focus, links underline | resource.safeUrl Link target blank rel noopener noreferrer, no unsafe URL created | match |
| Long resource text | old project SCSS _learn-projects.scss:1063-1079 anywhere wrap | title and optional description break-words whitespace-pre-wrap | match |
| Empty/invalid/disabled | old-lms-pages.md:6,11-12 feedback in one canvas | invalid filter alert, access disabled inline, no matches shared EmptyState | match |
| Pagination/privacy | old-lms-pages.md:10 real navigation | shared Pagination, directory Href keeps filters; only safe HTTPS metadata | match |

Responsive source proof: On 320–767px, page labels stack at full width and the shared field, CTA, or dialog controls remain at least 44px; at 768px, actions and form fields are 36px and layout aligns horizontally. At >=992px, metrics and independent object grids use the legacy desktop threshold where applicable. Inline record lists retain neutral hairline rows without extra card surfaces. Error/empty/disabled/pending states are covered in the table and reuse shared components. No service, query, mutation, or content wording change.

Full-file grep reproduction (expected 0 matches for these sources; inspected from GitHub rather than running rg locally):

    rg -n '<(button|input|select|textarea)\b|#[0-9a-fA-F]{3,8}\b|window\.confirm|fixed inset-0|role="dialog"|role="tab"|aria-pressed' 'src/app/(authenticated)/mentor/projects/[projectId]/resources-directory/page.tsx'

### Mentor Board status readout — src/app/(authenticated)/mentor/projects/[projectId]/board-review/page.tsx

Complete source file read: 157 lines; scan counts {"raw":0,"hardHex":0,"windowConfirm":0,"manualOverlay":0,"manualTab":0,"PageHeader":2,"Input":1,"Select":3,"Button":1,"Dialog":0,"ConfirmDialog":0,"EmptyState":1,"Pagination":1}.
| Property/state | Old LMS exact source/value | Current vNext source/value | Source comparison |
|---|---|---|---|
| Board metrics | old-lms-pages.md:11 compact separate stat tiles | five registered task-count cards, radius12 border1 white, no extra outer canvas | match |
| Count grid | variables.scss:148-156 phone<=767/tablet768/desktop992 | grid single mobile, md2 and min992 five columns | match |
| Sprint summaries | old-lms-pages.md:11 genuine separate subobjects | up to six Sprint summary cards radius12 border canvas, 1/2 columns at md | match |
| Sprint empty | old-lms-pages.md:6 inline no-recorded-data | removed nested no-data painted card; now inline border-b and 12px vertical text | match |
| Search and filters | form.scss:117-143 native 10px radius/#fbfcfd | 1 Input and 3 Select, shared field chrome, 44 phone/36 md | match |
| Filter label font | form.scss:110-115 13px/600/16 neutral400 | four labels now text13 leading4 neutral400; no unstyled font-size14 | match |
| Filter mobile | listing-page-header.scss:130-159 full-width labels through767 | form max-[767px] label width100%, flex-wrap | match |
| Primary button | shell-spec.md:23 teal #0a7c88 white 36 | shared Button variant primary min-h11 md:min-h9 | match |
| CSV actions | shell-spec.md:24 secondary 14px/650, hover teal | two download Links data-unskin, white, teal hover, md36; py2 cleared md | match |
| No nested history cards | common.scss:700-726 1px neutral200/12px cells | saved task ol border-y/divide-y; each li py-space-3 | match |
| Adaptive empty | old-lms-pages.md:6 no invented rows | shared EmptyState title depends whether project has zero stored tasks or filters exclude | match |
| No fabricated values | old-lms-pages.md:12 exact status not prediction | completion null is Unknown; assigned workload not inferred | match |
| Pagination | old-lms-pages.md:10 listing page control | shared Pagination and mentorBoardReviewHref | match |

Responsive source proof: On 320–767px, page labels stack at full width and the shared field, CTA, or dialog controls remain at least 44px; at 768px, actions and form fields are 36px and layout aligns horizontally. At >=992px, metrics and independent object grids use the legacy desktop threshold where applicable. Inline record lists retain neutral hairline rows without extra card surfaces. Error/empty/disabled/pending states are covered in the table and reuse shared components. No service, query, mutation, or content wording change.

Full-file grep reproduction (expected 0 matches for these sources; inspected from GitHub rather than running rg locally):

    rg -n '<(button|input|select|textarea)\b|#[0-9a-fA-F]{3,8}\b|window\.confirm|fixed inset-0|role="dialog"|role="tab"|aria-pressed' 'src/app/(authenticated)/mentor/projects/[projectId]/board-review/page.tsx'

### Mentor meeting and team log — src/app/(authenticated)/mentor/projects/[projectId]/team-meetings/page.tsx

Complete source file read: 150 lines; scan counts {"raw":0,"hardHex":0,"windowConfirm":0,"manualOverlay":0,"manualTab":0,"PageHeader":2,"Input":1,"Select":4,"Button":1,"Dialog":0,"ConfirmDialog":0,"EmptyState":1,"Pagination":1}.
| Property/state | Old LMS exact source/value | Current vNext source/value | Source comparison |
|---|---|---|---|
| Team summary | old-lms-pages.md:6 inline metadata divider | one border-b team summary section, no extra card | match |
| Summary columns | variables.scss:148-156 single until767, 3 from768 | md:grid-cols-3 (previous 640 cutoff corrected); on phone stacks | match |
| Summary typography | variables.scss:27 #6b7280 metadata | dt text-xs muted, dd text-xl/semibold tabular role counts | match |
| Five filter fields | form.scss:117-143 shared radius10 bg#fbfcfd | 1 Input and 4 Select, all min-h11 md:min-h9, no local white/9px override | match |
| Filter labels | form.scss:110-115 #a9a7ae 13/600/16 | five muted 13px labels and 16px line height | match |
| Phone filters | listing-page-header.scss:130-159 full width labels | max-[767px] label width100 in flex-wrap GET form | match |
| Header action | shell-spec.md:24 secondary white 36 desktop | PageHeader Link data-unskin, neutral14/650 and md:py-0 | match |
| History rows | common.scss:700-726 1px #e5e9f0/12px | ol border-y/divide-y; per-meeting li py-space-3 | match |
| Meeting time | variables.scss:27 muted timestamp text | en-IN/Asia-Kolkata IST date, source time zone unchanged | match |
| Reschedule UI | old-lms-pages.md:12 shared dialog actions | delegates to separately audited MentorMeetingReschedule, only for scheduled active projects | match |
| Role and privacy | old-lms-pages.md:6 no fake activity | only registered team counts; missing outcome caption and no invented attendance | match |
| Empty/error/disabled | old-lms-pages.md:6,11-12 inline states | invalid query alert, access disabled status, zero meetings EmptyState | match |
| Pager | old-lms-pages.md:10 navigation | shared Pagination preserves meeting filter href | match |

Responsive source proof: On 320–767px, page labels stack at full width and the shared field, CTA, or dialog controls remain at least 44px; at 768px, actions and form fields are 36px and layout aligns horizontally. At >=992px, metrics and independent object grids use the legacy desktop threshold where applicable. Inline record lists retain neutral hairline rows without extra card surfaces. Error/empty/disabled/pending states are covered in the table and reuse shared components. No service, query, mutation, or content wording change.

Full-file grep reproduction (expected 0 matches for these sources; inspected from GitHub rather than running rg locally):

    rg -n '<(button|input|select|textarea)\b|#[0-9a-fA-F]{3,8}\b|window\.confirm|fixed inset-0|role="dialog"|role="tab"|aria-pressed' 'src/app/(authenticated)/mentor/projects/[projectId]/team-meetings/page.tsx'

### Mentor meeting reschedule editor and confirmation — src/components/projects/mentor-meeting-reschedule.tsx

Complete source file read: 97 lines; scan counts {"raw":0,"hardHex":0,"windowConfirm":0,"manualOverlay":0,"manualTab":0,"PageHeader":0,"Input":2,"Select":0,"Button":3,"Dialog":1,"ConfirmDialog":2,"EmptyState":0,"Pagination":0}.
| Property/state | Old LMS exact source/value | Current vNext source/value | Source comparison |
|---|---|---|---|
| Reschedule primary surface | shell-spec.md:18-24 shared 36px 14/650 secondary button | shared Button variant secondary default size14/650, no size=sm override | match |
| Phone click heights | variables.scss:138-149 44px until767, shell-spec.md:24 36px desktop | owned legacy-project-touch-actions.module.css wraps all dialog action Buttons; min44 until767, shared36 md | match |
| Secondary button radius | shell-spec.md:24 9px white/outlined | shared Button --lms-control-radius:9px and neutral background | match |
| Dialog width | legacy-styles/components___antddesign.scss:1037-1068 viewport inset16 | shared Dialog.tsx:39-56 width calc(100%-2rem) max36rem | match |
| Dialog max height | legacy antddesign.scss:1037-1068 viewport minus48px | shared Dialog.tsx:44-55 max-h calc(visualHeight-3rem), scroll body | match |
| Dialog border/shadow | old-lms-pages.md:12 shared modal outline and elevation | Dialog data-slot/dialog, neutral200 outline, --lms-elevation-4; no home-built modal | match |
| Dialog header | old-lms-pages.md:12 1px separator and 24px padding | Dialog.tsx:46-53 header border-b, phone px16/tablet canvas pad24 | match |
| Dialog focus/close | accessibility.scss:18-23 2px visible teal focus | Dialog Escape/backdrop/close and shared Button keyboard focus | match |
| Label font | form.scss:110-115 #a9a7ae 13px/600 line16 | two date-time labels text13/600 leading4 neutral400 | match |
| Field radius/background | form.scss:117-143 10px/#fbfcfd native input | two shared Input type datetime-local using shared skin, no 9px/white override | match |
| Input phone touch | variables.scss:139/148 min44 through767 | both inputs min-h-11 md:min-h-9 | match |
| Form layout | old-lms-pages.md:12 compact modal content | grid gap-4, two labels, error notice, flex-wrap footer | match |
| Confirm dialog | legacy antddesign.scss:1037-1068 responsive shared modal | shared ConfirmDialog with pending, text summary, footer Button | match |
| Discard confirmation | old-lms-pages.md:12 actual dismissible shared modal | useProjectEditorDiscardGuard and second ConfirmDialog, same focus and footer | match |
| Invalid dates | form.scss:132-143 invalid 20% error ring | aria-invalid on shared Input with inline role=alert validation | match |
| Pending/duplicate | old-lms-pages.md:12 disabled while save ongoing | pending guards on submit, shared Button disabled/ConfirmDialog pending | match |
| Save error | old-lms-pages.md:12 error inline, toast | FriendlyFetchError/friendlyApiError role=alert and shared toast | match |
| Save success | old-lms-pages.md:12 feedback and refresh | existing success toast + router.refresh preserved | match |
| Mutation security | old-lms-pages.md:12 no speculative action | same PATCH URL, optimistic expectedUpdatedAt, schema validation | match |
| No raw overlay | old-lms-pages.md:12 shared overlay only | one Dialog, two ConfirmDialog components; source fixed-inset/window.confirm=0 | match |
| Reduced motion | accessibility.scss:18-23 focus and reduced motion | shared Dialog/Button reduced-motion behavior, local CSS no animation | match |

Responsive source proof: On 320–767px, page labels stack at full width and the shared field, CTA, or dialog controls remain at least 44px; at 768px, actions and form fields are 36px and layout aligns horizontally. At >=992px, metrics and independent object grids use the legacy desktop threshold where applicable. Inline record lists retain neutral hairline rows without extra card surfaces. Error/empty/disabled/pending states are covered in the table and reuse shared components. No service, query, mutation, or content wording change.

Full-file grep reproduction (expected 0 matches for these sources; inspected from GitHub rather than running rg locally):

    rg -n '<(button|input|select|textarea)\b|#[0-9a-fA-F]{3,8}\b|window\.confirm|fixed inset-0|role="dialog"|role="tab"|aria-pressed' 'src/components/projects/mentor-meeting-reschedule.tsx'
