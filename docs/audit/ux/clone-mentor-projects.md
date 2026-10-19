# Mentor, Projects and Tracker — UI clone audit (chat-8)

Reference baseline: `origin/main` at `12ee0a58fd9af5e0e1f1ad975155f864966cb6c0` (2026-10-19). Owned areas: `src/app/(authenticated)/mentor/**`, `src/app/(authenticated)/tracker/**`, `src/components/projects/**`. Shared UI, global skin and auth/layout shell are **not** owned by this lane.

## Work queue (repository-tree inventory, not a runtime grep)

Inventory source: GitHub recursive tree for `main`, listing TSX paths. This is **not** a claim that a local grep, runtime or screenshot was run. Work outward from pages and then the project components, keeping page content/behavior unchanged.

### Mentor pages (32 page.tsx; 86 total TSX)

- [ ] `src/app/(authenticated)/mentor/activity/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [x] `src/app/(authenticated)/mentor/allQuizzes/page.tsx` (redirect-only; source scan: 0 JSX/HTML, 0 controls, 0 visual properties; 0 applicable pixel values; viewport-independent redirect; evidence below)
- [ ] `src/app/(authenticated)/mentor/calendar/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [x] `src/app/(authenticated)/mentor/contacts/[[...contactsTab]]/page.tsx` (redirect-only; source scan: 0 JSX/HTML, 0 controls, 0 visual properties; 0 applicable pixel values; viewport-independent redirect; evidence below)
- [x] `src/app/(authenticated)/mentor/courses/[courseId]/[[...courseTab]]/page.tsx` (redirect-only; source scan: 0 JSX/HTML, 0 controls, 0 visual properties; 0 applicable pixel values; viewport-independent redirect; evidence below)
- [x] `src/app/(authenticated)/mentor/courses/page.tsx` (redirect-only; source scan: 0 JSX/HTML, 0 controls, 0 visual properties; 0 applicable pixel values; viewport-independent redirect; evidence below)
- [x] `src/app/(authenticated)/mentor/fileExplorer/page.tsx` (redirect-only; source scan: 0 JSX/HTML, 0 controls, 0 visual properties; 0 applicable pixel values; viewport-independent redirect; evidence below)
- [ ] `src/app/(authenticated)/mentor/notifications/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [x] `src/app/(authenticated)/mentor/page.tsx` (greps: complete-page raw/hex/hand-tab/overlay source scan => 0; values: 12 legacy/shared rows match; responsive: 44px phone, 36px tablet+, details below)
- [x] `src/app/(authenticated)/mentor/profile/page.tsx` (redirect-only; source scan: 0 JSX/HTML, 0 controls, 0 visual properties; 0 applicable pixel values; viewport-independent redirect; evidence below)
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/board-review/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/closeout/page.tsx` (greps: full-file JSX/hex/manual-dialog/manual-tabs=0; native checkbox exemption on closeout control; values: 18 matched properties + state table; responsive: 320/767px fluid, >=768px md, see audit below)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/deliveries/[submissionId]/review/page.tsx` (greps: full-source raw controls, hex, manual modal and tabs=0; values: 19-row table and conditional states below; responsive: 320/767/768px metadata, links and history)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/meetings/[meetingId]/notes/page.tsx` (greps: complete source, raw controls/hex/native overlay/tabs=0; values: 20 exact shared/legacy rows including open/confirm/error states; responsive: scoped 767px modal actions + fluid text; table below)
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/resources-directory/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/review-completeness/page.tsx` (greps: full-file JSX/hex/manual-dialog/manual-tabs=0; native checkbox exemption on closeout control; values: 18 matched properties + state table; responsive: 320/767px fluid, >=768px md, see audit below)
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/review-overview/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/risk-readiness/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/tasks/[taskId]/feedback/page.tsx` (greps: complete-file source regex raw/hex/hand-dialog/hand-tabs=0; values: 15 rows matched in shared/legacy table below; responsive: <=767px touch and wrap, >=768px standard; no runtime claims)
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/team-history/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/team-meetings/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/timeline/page.tsx` (greps: complete-file raw/hex/dialog/hand-tabs=0; values: 18 legacy/source states matched, hairline rows and scoped chip breakpoint; responsive 320/767/768px proof below)
- [ ] `src/app/(authenticated)/mentor/projects/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/app/(authenticated)/mentor/reports/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
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
- [ ] `src/components/projects/mentor-meeting-reschedule.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
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

## Next batch — task feedback + Tracker personal reports (three fully audited pages)

**Exact source scan**: All three complete TSX files were read at the GitHub branch head after modifications; for each file source-pattern counts were raw JSX <button>/<input>/<select>/<textarea>:0, literal hex (#rgb, #rrggbb):0, window.confirm:0, 'role="dialog"' or 'fixed inset-0':0, 'role="tab"' or aria-pressed:0. None imports a raw table or creates an overlay. The source-level equivalent of the following repeatable grep returned **0 matching lines in each**:

~~~sh
rg -n '<(button|input|select|textarea)\b|#[[:xdigit:]]{3,8}\b|window\.confirm|role="dialog"|fixed inset-0|role="tab"|aria-pressed' \
 'src/app/(authenticated)/mentor/projects/[projectId]/tasks/[taskId]/feedback/page.tsx' \
 'src/app/(authenticated)/tracker/mine/page.tsx' \
 'src/app/(authenticated)/tracker/mine/[publicId]/page.tsx'
# 0 / 0 / 0 matched source lines (read from GitHub, command not executed locally).
~~~

### Shared precise visual/state value table — 15 checked properties *per page*

| Property / state | Legacy documented value and file:line | vNext measured-by-source value and file:line | Match |
|---|---|---|---|
| One continuous canvas | old-lms-shell-spec.md:18-20 — #ffffff, 1px #e5e9f0, radius 12px, padding 24px, no nested row cards | globals.css:364-370 shared page canvas; all 3 page roots are bare section/article/div with spacing, no card paint | yes |
| Canvas heading colour | old-lms-shell-spec.md:26-27 — #172033 | globals.css:327, page-header.tsx:31-35 — same token | yes |
| Heading size desktop | old-lms-shell-spec.md:26-27 — 30px/600 | page-header.tsx:28,31-35 — 30px and fontWeight 600 from md | yes |
| Heading phone | listing-page-header.scss:130-143 — 20px stacked through <=767px | page-header.tsx:28-35 — 20px and column layout below md (768px) | yes |
| Heading subtitle | old-lms-pages.md:7 — compact muted beside title desktop | page-header.tsx:23,30,39-45 — 13px muted below md, baseline beside title from md | yes |
| Head bottom border | listing-page-header.scss:26-35 — 1px light neutral-200 (#e5e9f0), 16px lower space | page-header.tsx:28; globals.css:339 — border-b and pb-4 (16px) | yes |
| Body text | legacy variables.scss:25-27 — #54505d and 14px | globals.css:73,359-362, page content text-sm text-body — 14px/neutral-700 | yes |
| Muted metadata | legacy variables.scss:27 — #6b7280 | globals.css:36,74; page content text-muted-foreground | yes |
| Status/error callouts | old-lms-pages.md:7,12 — slim inline notice or clear error, not nested card | task-feedback.tsx:15-22 simple role=status section; tracker pages: Banner (warning) and ErrorState (error) with shared data slots | yes |
| Empty state | old-lms-pages.md:6,11 — continuous canvas, no phantom rows | task-feedback.tsx:23-25 and tracker/mine.tsx:29 use EmptyState (ui/empty-state.tsx:5-10), role=status and transparent background | yes |
| Hairline rows | legacy components___common.scss:700-713; variables.scss:30 — 1px #e5e9f0 between records | task-feedback.tsx:25-26, tracker/mine.tsx:30-31 — divide-y border-y canvas-border | yes |
| Row vertical density | legacy components___common.scss:720-726 — 12px top and bottom for compact entries | task-feedback.tsx:26 and tracker/mine.tsx:31 — py-[var(--lms-space-3)] = 12px, globals.css:352 | yes |
| Link foreground/hover | legacy variables.scss:10 and listing-page-header.scss:123-127 — #26bac7 interactive teal, underline for text navigation | globals.css:27,119-120 link/primary-text colour #26bac7; existing underline, legacy-skin.css:356-378 handles hover | yes |
| Visible keyboard focus | legacy accessibility.scss:18-23 — 2px teal outline with 3px offset | all user actions explicit focus-visible:outline-2 outline-offset-2 focus-visible:outline-primary (global shared focus overrides for keyboard navigation) | yes |
| Responsive interactive target | legacy variables.scss:139,148 and listing-page-header.scss:130-159 — 44px up to 767px; 36px tablet/desktop | min-h-11 md:min-h-9 (three Tracker retry/create/back links; task feedback return link), 44px until md; no width constraints and break-all/break-words on untrusted strings | yes |

#### Page-specific state and mobile proof

**Mentor task review feedback** (\`src/app/(authenticated)/mentor/projects/[projectId]/tasks/[taskId]/feedback/page.tsx\`, 46 lines): one PageHeader, one informational status section, one EmptyState if feedback.length===0 or a hairline <ol> of saved review versions when nonempty. Optional date uses en-IN/Asia/Kolkata, negative date renders “Review date unavailable.” Content has wrap classes, metadata and version headings flex-wrap at all widths. The return Link is 44px through 767px and 36px at >=768px; PageHeader stacks on phone. No interactive form, no local loading control, no modal. The page retains all authorized read-only feedback service calls. No filtered/review state changed.

**Tracker personal report list** (\`src/app/(authenticated)/tracker/mine/page.tsx\`, 39 lines): 3 exclusive visual state branches, all using shared PageHeader. Runtime-disabled uses shared Banner warning; query error uses shared ErrorState with 44px retry (36px >=768); empty result uses shared EmptyState; populated list uses 1px neutral hairlines and 12px row pads. Report links are min-height 44px until md, can break long IDs, include keyboard focus and inherit teal. Description has break-words. Source branch guards, listMyTrackerReports scope and record details untouched. Phone header flows vertically; the rows and links never require horizontal scrolling at 320px or tablet 768px by layout construction, though device-render testing remains the orchestrator's section J.

**Tracker personal report detail** (\`src/app/(authenticated)/tracker/mine/[publicId]/page.tsx\`, 40 lines): report-not-found/invalid IDs never render private content (notFound), inactive membership redirects, runtime-disabled renders shared warning Banner. Authorized detail is a single plain article with shared heading, 44px mobile/36px desktop underlined back Link, one hairline detail section (24px bottom space token), wrapped freeform description, and en-IN IST timestamp. No dialogs, filters, table or object card. No fixed width, hence breakpoint-independent article content.

This is **source-level** parity: no local app runtime, screenshot comparison, browser CSS computation, CI or behavioral execution was performed in this batch. Shared PageHeader/Banner/ErrorState/EmptyState behavior is delegated to their owners; section J visual acceptance remains separate.

## Completed: project closeout interaction and review completeness page

### Repeatable source-grep and exemptions

These three complete source files were fetched from the current chat-8 branch after the changes, with regex results for literal hex, native button/select/textarea, native confirm, role="dialog", fixed inset-0, role="tab" and aria-pressed all **zero per file**. The closeout control has exactly **one native input JSX source node, type="checkbox", mapped to 3 checkboxes**. Native checkbox is explicitly exempt from bulk text-field codemods; it is wrapped in a semantic label with a 44px minimum click area. All action buttons/overlays use the shared Button and ConfirmDialog.

Orchestrator source repro: rg -n '<(button|input|select|textarea)\b|#[[:xdigit:]]{3,8}|window.confirm|fixed inset-0|role="dialog"|role="tab"|aria-pressed' on the three files listed in this section. Expected full source count: **1 exempt checkbox JSX line total**. The control has one shared Button and one shared ConfirmDialog; the review-completeness page has 2 mutually exclusive PageHeader branches, 1 EmptyState and 1 Pagination, and no raw form. The closeout page has exactly 1 PageHeader and its owned control delegation.

### Legacy-to-vNext values (all three; asterisk marks a per-state applicable row)

| Property | Legacy source and exact value | New source and effective value | Status |
|---|---|---|---|
| App backing | old-lms-shell-spec.md:18-20 #f1f4f9 | globals.css canvas/shell tokens inherited by authenticated layout | matches |
| One canvas | old-lms-shell-spec.md:18-20 #fff, 1px solid #e5e9f0, radius 12px, padding24, no shadow | globals.css:339,344-346,364-370, bare page divs without additional card surfaces | matches |
| Page title desktop | old-lms-shell-spec.md:26-27 30px / 600 / #172033 | ui/page-header.tsx:28-35 and globals.css:327 | matches |
| Page title phone | legacy listing-page-header.scss:130-143 20px / stacked through 767px | ui/page-header.tsx:27-35 sets 20px and column below md | matches |
| Subtitle alignment | old-lms-pages.md:7 inline title subtitle | ui/page-header.tsx:39-45 mobile stacked, md baseline inline | matches |
| Hairline header | listing-page-header.scss:26-35 1px neutral-200, 16px bottom padding | ui/page-header.tsx:28 border-b/pb-4, globals.css:339 | matches |
| Header action font | old-lms-shell-spec.md:22-24 14px / weight 650 | closeout/page.tsx:23 and review-completeness/page.tsx:31 text-sm font-[650] with data-unskin exemption | matches |
| Secondary default foreground | variables.scss:25 #54505d | painted header Links use --lms-body-text (globals.css:73) | matches |
| Secondary default background | old-lms-shell-spec.md:24 #ffffff | painted Links use bg-white, data-unskin prevents the general link skin | matches |
| Secondary hairline and radius | old-lms-shell-spec.md:24 1px outline, radius 9px | border-border and --lms-control-radius (globals.css:339,343) | matches |
| Secondary hover | listing-page-header.scss:123-127 brand teal border/ink, rgba teal 5% fill | explicit hover:border-primary, hover:text-primary, hover:bg rgba(38,186,199,0.05) | matches |
| Secondary transition | listing-page-header.scss:120 200ms interaction | scoped Links use 150ms from old-lms-shell-spec/button system, reduced motion off; legacy shell 150ms global tokens | shell exception |
| Phone action height | variables.scss:139,148 44px to 767px | action min-h-11; md overrides only at 768px | matches |
| Desktop button height | old-lms-shell-spec.md:22-24 36px | md:min-h-9, md:py-0 if bordered py-2 (prevents 38px intrinsic box) | matches |
| Focus outline | accessibility.scss:18-23 teal 2px outline with visible offset | action focus-visible:outline-2 outline-offset-2 focus-visible:outline-primary, shared Button and ConfirmDialog focus handling | matches |
| Body and support text | variables.scss:25-28 #54505d body 14px, #6b7280 supporting | text-body/text-muted-foreground and shared global font base14 | matches |
| Row separators | common.scss:700-713 1px #e5e9f0 | review-completeness ol border-y/divide-y canvas token, closeout labels/section border-b | matches |
| Row vertical rhythm | common.scss:720-726 12px compact vertical | closeout labels and review version rows py-[var(--lms-space-3)], globals.css:352=12px | matches |
| Disabled/empty/error | old-lms-pages.md:6,11-12 in-place message/blank list not invented | closeout canComplete false role=status, control disabled pending/unacknowledged; review-completeness EmptyState/role=status and invalid-filter role=alert | matches |
| Responsive columns | listing-page-header.scss:130-159 one column through 767px | review-completeness dl grid one column below md, two from md; closeout li flex-wrap/min-w-0 | matches |
| Mobile dialog* | legacy antddesign.scss:1037-1068 max-width viewport-32px, max-height 100dvh-48px, 12px radius, wrapping actions | ConfirmDialog -> ui/dialog.tsx:39-55, same viewport and responsive footer | matches |
| Checkbox accent* | variables.scss:10 #26bac7 primary interactive | mentor-project-closeout-control.tsx:40 accent-[var(--lms-primary)], globals.css:21 | matches |
| Checkbox tap* | variables.scss:139 >=44px target | checkbox itself 16px as legacy native control; parent label min-h-11 and full click semantics | matches |
| Pagination* | old-lms-pages.md:10, data remains on one canvas | ui/pagination.tsx:44-84 shared compact mobile previous/next with md page links | matches |

The global shared canvas, PageHeader, Button, EmptyState, Pagination and Dialog are reused without code modifications. No mutation or field-validation behavior was changed. Although runtime screenshots have not been run in this lane, the listed value matches are established through exact source tokens/classes and legacy SCSS measurements.

### Per-file behavior, states and 320px / 767px / tablet proof

**mentor-project-closeout-control.tsx (51 lines):** Three persisted acknowledgement controls each use a native checkbox inside a full-width 44px-minimum label with border-b hairline (except last) and 12px top/bottom padding. The user cannot activate Confirm until all three are checked; confirmed modal is the shared ConfirmDialog. Cancel has no mutation, pending blocks repeat, success refreshes, and failure creates a role=alert inline message. At 320px long labels wrap within min-w-0; 767px still retains 44px target; >=768px Button has default 36px shell geometry. No manual overlay.

**closeout/page.tsx (50 lines):** Four-row checklist with existing persistent Recorded/Not satisfied status, rendered as wrapping flex items so statuses do not overflow at 320px or 767px. canComplete false shows a plain role=status reason. canComplete true mounts the separately audited control above. Exactly one header action is responsive 44px through 767px and 36px from tablet. No invented closed/reviewed state and no nested canvas cards.

**review-completeness/page.tsx (83 lines):** Invalid query shows a shared header and a 44px return link, disabled-access shows status, enabled-empty shows shared EmptyState, nonempty shows one border-y + divide-y review list (12px rows) with review decision + feedback metadata. At 320/767px metadata grid stays one column, 768px+ two columns (md:grid-cols-2). Shared Pagination handles page window and disabled destinations; optional IST timestamps are only shown when recorded. All links preserve existing safe project-specific destinations and no write actions are added.

Full device and screenshot parity remains section J orchestrator work, not asserted as executed here.

## Completed: Mentor meeting notes screen + interactive editor

The two complete TSX files and the owned project-only touch CSS module were inspected after the source edits. Scan counts:
- mentor-meeting-notes-editor.tsx, 79 lines: 0 raw button/input/select/textarea JSX, 0 literal hex, 0 native confirmations, 0 fixed-inset overlays or role="dialog", 0 homemade tabs; 3 shared Button, 1 shared Textarea, 1 shared Dialog and 2 shared ConfirmDialog. The discard guard remains in place.
- mentor/projects/[projectId]/meetings/[meetingId]/notes/page.tsx, 42 lines: 0 raw controls, hex, manual overlay or hand tab; 1 PageHeader and one secondary button-shaped Link, with data-unskin exemption so default 500-weight teal text-link rules do not override its measured secondary button paint.
- legacy-project-touch-actions.module.css, 17 lines: 0 literal hex; one <=767px media rule scoped to the owned editor/closeout components. At <=767px it sets descendant shared Button min-height:44px, including shared dialog/confirmation footer controls. From 768px the global shared Button 36px returns. The editor uses a display:contents wrapper, so existing page layout and dialog render order are unchanged.

Replay in the orchestrator checkout: rg -n '<(button|input|select|textarea)\b|#[[:xdigit:]]{3,8}|window.confirm|role="dialog"|fixed inset-0|role="tab"|aria-pressed' on the two TSX paths; expected 0 matches for both. This is **source inspection**, not a claim the command, browser or CI ran locally in this chat.

| Property/state (all 20) | Old LMS reference exact value | vNext implementation exact value | Verdict |
|---|---|---|---|
| One page canvas | old-lms-shell-spec.md:18-20 white #fff, neutral-200 hairline, 12px radius and 24px padding | inherited PageCanvas, globals.css:339,345-346,364-370; page root plain div | match |
| Main page h1 | old-lms-shell-spec.md:26-27 30px/600/#172033 | page-header.tsx:27-35 and globals.css:327 | match |
| Phone page h1 | listing-page-header.scss:130-143 20px below 768px, stacked | page-header.tsx:27-35 20px / stacked until md | match |
| Subtitle desktop | old-lms-pages.md:7 inline baseline, gray | PageHeader:23,30,39-45 joins existing eyebrow + title description only as subtitle | match |
| Page head hairline | listing-page-header.scss:26-35 1px #e5e9f0 and 16px bottom pad | page-header.tsx:28 border-b, pb-4 | match |
| Header button text | old-lms-shell-spec.md:23-24 14px/650 and neutral | notes/page.tsx:18 14px, font-[650], body-text #54505d with data-unskin | match |
| Header button face | old-lms-shell-spec.md:24 secondary white, border, radius9 | notes/page.tsx:18 bg-white, border canvas, --lms-control-radius=9px | match |
| Header button hover | listing-page-header.scss:123-127 teal border/ink, 5% teal fill | notes/page.tsx:18 hover:bg-[rgba(38,186,199,0.05)] with teal border/text | match |
| Header button mobile/desktop height | variables.scss:139,148 44px through767px; shell-spec.md:24 36px desktop | notes/page.tsx:18 min-h-11 md:min-h-9 | match |
| Section hairline | old-lms-pages.md:6,11 neutral-200 | notes/page.tsx:20 border-b canvas token | match |
| Section bottom padding | variables.scss spacing 24px | notes/page.tsx:20 --lms-space-5=24px | match |
| Body font and ink | variables.scss:25 #54505d 14px | notes/page.tsx:22-24, globals.css:73,844 | match |
| Empty outcome state | old-lms-pages.md:6,12 contextual text, no blank card | notes/page.tsx:26-28 inline muted fallback | match |
| Edit button | old-lms-shell-spec.md:23-24 secondary 14px/650, 36px desktop | editor.tsx:47-49 shared Button secondary | match |
| Edit dialog | antddesign.scss:1037-1061 viewport-32px mobile, radius12, scroll at max-height viewport-48px | editor.tsx:51-68 delegates Dialog; ui/dialog.tsx:39-55 | match |
| Form field type and font | components___form.scss:117-128 14px/400, 10px radius, #fbfcfd, 0.2px tracking | editor.tsx:54-57 shared Textarea, legacy-skin.css:105-132 and globals.css:420-445 | match |
| Field focus | form.scss:130-143 2px teal 15% focus glow | legacy-skin.css:140-164 inherited by Textarea | match |
| Footer desktop and touch | shell-spec.md:23-24 36px; variables.scss:139,148 mobile 44px | editor.tsx:60-64 shared Button; legacy-project-touch-actions.module.css:10-15 <=767px min44 | match |
| Save/discard confirm | antddesign.scss:1037-1068 responsive shared dialog, wrap footer | editor.tsx:66-78 uses two ConfirmDialog, both descendants of project scoped touch wrapper | match |
| Keyboard/disabled/errors | accessibility.scss:18-23 focus outline 2px; old-lms-pages.md:12 inline errors | editor.tsx:23-45 valid/pending/discard guard; errors role=alert; shared Button has focus and pending | match |

Per-state proof: Non-editable meeting status shows a plain note that only completed meetings in active projects are editable; no editor mounts (notes/page.tsx:29-34). Editable + empty initial outcome shows “Record outcome notes”; populated initial value shows “Edit outcome notes.” Dialog form is required, max 4000 characters, 7 rows and locally min-height 128px (existing editor-specific size preserved); save disabled until changed/valid, Review notes triggers the second confirmation, cancel/unsaved close is mediated by useProjectEditorDiscardGuard, success refreshes, API failure shows an inline alert and toast. No sensitive notes appear in project activity history.

Phone (320px and 767px): PageHeader stacks; project action is 44px, dialog width viewport-minus-32px, body scrolls within viewport-minus-48px; all editor, confirm and discard footer actions remain >=44px via scoped CSS. Textarea has max-w-full and notes preview uses break-words/whitespace-pre-wrap. Tablet (768px+) restores 36px buttons and inline PageHeader actions. These are static responsive proofs; section J screenshot verification remains the orchestrator's separate stage.

## Completed: Mentor release/sprint timeline

Whole source scan after the edit: src/app/(authenticated)/mentor/projects/[projectId]/timeline/page.tsx (93 lines) has 0 raw JSX button/input/select/textarea, 0 literal hex, 0 native/modal confirmation, 0 manual tab control. Shared components: 1 PageHeader in valid data branch, 1 in invalid query branch, 2 NeedsDoingChips filter groups, one Timeline containing TimelineEntry and 2 StatusBadge element instances, optional shared EmptyState, and one Pagination. The CSS module legacy-timeline-filters.module.css carries the only added local responsive override: 44px quick-filter click targets through <=767px, compact shared pill dimensions above 767px. Both filter groups use this scope; no shared chip source was modified.

| Property/state (18 inspected) | Legacy documented value/source | vNext file/source and value | Source match |
|---|---|---|---|
| Background and outer canvas | old-lms-shell-spec.md:18-20 #f1f4f9 backing, #fff canvas, 1px #e5e9f0 and 12px radius/24px pad | authenticated canvas via globals.css:339,345-346,364-370; page root has no card surface | yes |
| Title desktop | shell-spec.md:26-27 Inter 30px/600 #172033 | PageHeader:27-35, globals.css:327 | yes |
| Title phone | listing-page-header.scss:130-143 20px vertical stack | PageHeader:27-35 below md768 | yes |
| Description/subtitle | old-lms-pages.md:7 muted inline subtitle | PageHeader:23,30,39-45 | yes |
| Page header bottom hairline | listing-page-header.scss:26-35 neutral-200/16px pad | PageHeader:28 border-b, pb-4 and globals.css:339 | yes |
| Secondary action text | shell-spec.md:23-24 14px, weight650, neutral #54505d | timeline/page.tsx:34-36 Link with data-unskin; text-sm, font-[650], --lms-body-text | yes |
| Secondary action border/background | shell-spec.md:24 radius9 white 1px hairline | timeline/page.tsx:35 --lms-control-radius, border-border, bg-white | yes |
| Secondary action hover | listing-page-header.scss:123-127 teal border and ink, 5% teal fill | timeline/page.tsx:35 explicit hover classes, 150ms motion | yes |
| Action touch and tablet | variables.scss:139,148 <=767px 44px, shell-spec.md:24 36px desktop | timeline/page.tsx:35 min-h-11 md:min-h-9 and md:py-0 | yes |
| Filter pill size/gap | old-lms-pages.md:8-9 quick pills, common.scss:443-474 20px nav spaces (filter groups separate) | NeedsDoingChips.tsx:33-56 uses compact chip and flex-wrap, space-2 gap | yes |
| Filter colour selected | variables.scss:10 #26bac7 primary | NeedsDoingChips.tsx:42 teal selected border/subtle fill | yes |
| Filter phone target | variables.scss:139 and listing-page-header.scss:130-159 >=44px to 767 | legacy-timeline-filters.module.css:1-11 min-height44 for both scoped chip groups | yes |
| Filter default/disabled/focus | accessibility.scss:18-23 focus 2px teal; old-lms-pages.md:8 real filters not inert chips | NeedsDoingChips.tsx:35-54 href/disabled/aria-current branch and focus classes | yes |
| Timeline spine | old-lms-pages.md:6-11 continuous surface, thin neutral hairlines | Timeline.tsx:5-15 2px neutral-200 left marker and 1px item separator | same shared progression |
| Sprint inner rows | common.scss:700-713,720-726 1px neutral-200 and 12px compact rows | timeline/page.tsx:67-82 now divide-y canvas border, py-[var(--lms-space-3)] | yes |
| Status labels | old-lms-pages.md:11 colored semantic pills | timeline/page.tsx:63,73 shared StatusBadge; success/info/neutral based on persisted state | yes |
| Empty/disabled/error | old-lms-pages.md:6,11-12 inline feedback, no fake records | invalid query role=alert with clear Link; disabled module status; enabled-empty EmptyState | yes |
| Pagination | old-lms-pages.md:10 shared list pagination, touch pages | timeline/page.tsx:83, Pagination.tsx:44-84 with 44px previous/next on phone | yes |

Responsive source proof: At 320px/767px, PageHeader stacks, the action is min44px, chips wrap and each interactive chip remains min44px via the local CSS max-width767 rule. Release heading/status uses flex-wrap, nested sprints are hairline-separated list rows with no padded card-in-card and no fixed width. At 768px and larger, PageHeader actions align right, chips use compact desktop height, and the action is 36px. Tab/overlay/field grep output is zero. Enabled/disabled, zero/nonzero items, zero/nonzero sprints, status badge tones, valid/invalid filters, optional progress and Next.js pagination hrefs are unchanged. No runtime screenshots or CI executed.

## Completed: authorized Mentor final-delivery version detail

File: src/app/(authenticated)/mentor/projects/[projectId]/deliveries/[submissionId]/review/page.tsx (115 lines; whole source inspected after changes).

Grep equivalent (GitHub full-file source scan; no local command execution): rg -n '<(button|input|select|textarea)\b|#[[:xdigit:]]{3,8}|window.confirm|role="dialog"|fixed inset-0|role="tab"|aria-pressed' against this file => **0 matches**. Shared PageHeader appears once, external links are real anchor elements with target=_blank and rel="noopener noreferrer", no raw form or manually styled dialog exists. The authorization service is unchanged; any source/demo/attachment link is passed through safeProjectExternalHref before rendering. There are no loading, disabled-submit, mutation, editable form or local modal states applicable to this server-only read screen.

| Property/state | Old LMS exact reference | Current page/shared exact value | Match |
|---|---|---|---|
| Outer canvas | old-lms-shell-spec.md:18-20, #fff, 1px #e5e9f0, radius12, padding24 | inherited single canvas, page root min-w-0 max-w-full without own card | yes |
| Main title desktop | old-lms-shell-spec.md:26-27, 30px/600/#172033 | ui/page-header.tsx:27-35 and globals.css:327 | yes |
| Main title phone | listing-page-header.scss:130-143, stacked 20px through 767 | PageHeader stacks until md and has font-size20px | yes |
| Subtitle | old-lms-pages.md:7, inline muted desktop | PageHeader joins mentor context and project name/status into muted subtitle | yes |
| Head border | listing-page-header.scss:26-35, 1px #e5e9f0 / padding-bottom16 | PageHeader border-b and pb-4 | yes |
| Header secondary face | old-lms-shell-spec.md:24 #fff, neutral text, 1px border, radius9 | Link data-unskin, bg-white, border-border, --lms-control-radius, font-[650] | yes |
| Header secondary hover | listing-page-header.scss:123-127 teal text/border + rgba(38,186,199,.05) fill | Link explicit hover teal and same 5% tint | yes |
| Header link height | old-lms-shell-spec.md:24 36px desktop; variables.scss:139 >=44px touch | min-h-11 md:min-h-9, no extraneous vertical padding | yes |
| Header focus | accessibility.scss:18-23 teal outline2/offset | focus-visible:outline-2 and focus-visible:outline-offset-2 | yes |
| Section surfaces | old-lms-pages.md:6,11 continuous canvas separated by hairlines | 5 sections with border-b canvas and padding --lms-space-5, no nested object cards | yes |
| Body font/ink | variables.scss:25 #54505d, 14px | text-sm text-body / globals.css:73,844 | yes |
| Metadata label | variables.scss:27 #6b7280, small | dt text-xs text-muted-foreground | yes |
| Metadata grid phone | listing-page-header.scss:130-159 single column <=767 | dl grid min-w-0, md:grid-cols-2 so 1 column at 320/767 | yes |
| Metadata grid tablet/desktop | listing-page-header.scss:149-165 restores horizontal placement >=768 | dl 2 columns beginning at md (768px) | yes |
| Free-text overflow | legacy _learn-projects.scss:1063-1079 overflow-wrap:anywhere for user descriptions | summary, feedback, notes use whitespace-pre-wrap break-words; all within max-w-full | yes |
| Inline external controls | accessibility.scss:18-23 keyboard focus, variables.scss:10 #26bac7 | safe links underline, focus-visible and min-h-11 md:min-h-9 | yes |
| Attachment row hairlines | legacy components___common.scss:700-713, #e5e9f0, 1px | attachments list border-y/divide-y canvas token and py-space-3 12px | yes |
| Timeline history row density | common.scss:720-726 12px each edge | history list now border-y/divide-y canvas token; 4 conditional row paths py-space-3 | yes |
| Empty/not-recorded states | old-lms-pages.md:6,11-12 inline factual states, no implied records | all 10 metadata fields provide explicit missing-value fallbacks; empty attachment section, absent URLs and missing activity history have plain text | yes |

**Responsive / data-state proof:** 320px and 767px render one metadata column and a stacked PageHeader, with a 44px header action, text links capable of wrapping, and all dynamic note and attachment names using break-words/break-all. At 768px+ metadata becomes 2 columns and header action shrinks to the measured 36px. The attachment and event lists remain hairline rows at every viewport width and never create an extra canvas. Submitted/created/locked/reopened/reviewed timestamps render only when present, formatted with en-IN Asia/Kolkata; the empty history case remains an explicit message. No URLs bypass the existing safe-link function; existing project access and read-only review behavior preserved.

The old LMS specific project overflow rule is in 42Students/lms2-fe, branch prod-2026, src/styles/components/_learn-projects.scss:1063-1079; the shared shell and tokens are grounded in the vNext docs/design legacy sources. No screenshot, local UI or CI execution was performed.

## Completed — admin readiness selector, sprint deletion and template archive/rollback controls

### Source coverage (GitHub complete-file scans)

All four source files were re-read after changes. Native JSX buttons/input/select/textarea=0 in every file, hardcoded hex=0, browser window.confirm=0, homebuilt fixed-inset/role=dialog=0, hand-rolled tab/aria-pressed=0. The readiness picker uses precisely one shared Input, one shared Radio source node (rendered per filtered workspace) and three shared Buttons. Sprint delete and template archive/rollback each use one shared Button, one useConfirmFlow hook and one shared ConfirmDialog output, with no nested inline <span> hosting a dialog; each dialog renders as sibling of its action span or section. The picker status/empty state stays inside its existing fieldset; the three confirmation controls preserve pending, error and (rollback) success notice state.

Repeat in orchestrator checkout: rg -n '<(button|input|select|textarea)\b|#[[:xdigit:]]{3,8}|window.confirm|fixed inset-0|role="dialog"|role="tab"|aria-pressed' src/components/projects/{admin-readiness-workspace-picker,mentor-sprint-delete-control,super-admin-template-archive-control,super-admin-template-rollback-control}.tsx => expected **0 source matches**. This turn inspected source via GitHub, not local rg, and did not execute app, CI or screenshots.

### Shared legacy-vNext values — 16 checks for each file

| Property/state | Legacy reference and exact value | Matching vNext source and value | Result |
|---|---|---|---|
| One page canvas; no overlay cards | old-lms-shell-spec.md:18-20 #fff, 1px #e5e9f0, radius12, padding24 | each component root is an unpainted form/section or display:contents fragment wrapper; inherits global canvas | match |
| Action height desktop | old-lms-shell-spec.md:23-24 36px | globals.css:341,384-393 and shared Button.tsx:18-29 | match |
| Action height on phone 320-767 | variables.scss:139,148 44px | styles in legacy-project-touch-actions.module.css:11-15 on all project-shared Buttons, plus MentorSprintDeleteControl min-h-11 | match |
| Action radius | old-lms-shell-spec.md:23-24 9px | Button.tsx:28 --lms-control-radius, globals.css:343 | match |
| Action font | old-lms-shell-spec.md:23-24 14px/650 | Button.tsx:19,25-28 default size and weight | match |
| Primary control default | old-lms-shell-spec.md:23 #0a7c88 with white #fff | shared Button primary, globals.css:24-26,629-634 | match |
| Primary hover | globals.css:25 and legacy measured shell hover #086873 | shared Button enabled hover/active style via globals.css:635-642 | match |
| Secondary control face | variables.scss:25,91 #54505d on #fff with #bfc9da hairline | Button.tsx:12 and globals.css:649-653 | match |
| Secondary hover | listing-page-header.scss:123-127 teal white | Button.tsx:12 / globals.css:654-658 | match |
| Danger control | variables.scss:71-72 error #ef4444 | Button.tsx:15, globals.css:663-671 | match |
| Field text/default (picker only) | components___form.scss:117-128, 14px/400, 10px radius, #fbfcfd | picker Input shared/ui input.tsx, globals.css:420-445 and legacy-skin.css:105-132 | match |
| Focus ring | accessibility.scss:18-23 visible 2px teal + 3px offset | shared Button/Input/Radio focus styles and explicit focus-within labels, globals.css:399-409 | match |
| Disabled/pending button | variables.scss:28-32 muted disabled; forms and controls inert | disabled props sourced from empty choice/page boundary, busy/eligibility guards on three confirmations | match |
| Error/empty state | old-lms-pages.md:6-7,12 inline notice, no phantom content | picker empty text, archive/deletion role=alert, rollback role=alert/status; all plain inline text | match |
| Border/hairline where relevant | common.scss:700-713 neutral-200 1px | picker fieldset border and template rollback border-b via border-border #e5e9f0 | match |
| Responsive wrapping/scroll | listing-page-header.scss:130-165 phone full width, no horizontal overflow | picker rows min-w-0, max-h-64 overflow-y-auto, wrap paging buttons; sprint/archive display:contents wrapper leaves inline layout; rollback section min-w-0 | match |

### Distinct state pathways and responsive source proof

**AdminReadinessWorkspacePicker (45 lines):** uncontrolled source list is filtered by live title/ID search; 25 visible rows per page, Previous disabled at page1, Next disabled at final page, empty filtered list shows “No matching workspaces”, and View readiness disabled when no choice exists. Search resets pagination; changing a radio preserves existing action query submission. The single shared Input is min-h-11 md:min-h-9; native Radio is intentionally rendered through shared Radio for keyboard accessibility. Labels get min-height44 through767 and36 from768, long titles break, metadata sits in flexible content. Three shared Buttons inherit the owned wrapper's min44 up to767.

**MentorSprintDeleteControl (35 lines):** danger Button initial/hover/disabled style from shared Button; min-h-11 md:min-h-9. Warning text, title and unlinked-task count preserved exactly in askConfirm. Cancel dismisses the shared ConfirmDialog without mutation, accept performs the existing DELETE with optimistic updatedAt and confirmUnlink, pending prevents duplicate actions, error shows role=alert, successful deletion refreshes. JSX span and ConfirmDialog are siblings inside an owned display:contents wrapper, so markup is valid and 44px confirmation footer buttons hold through767.

**SuperAdminTemplateArchiveControl (29 lines):** Archived status returns plain muted caption without actions, current template renders secondary Button at 14px/650 (removed prior text-xs override). Shared confirm includes dynamic title warning and unchanged DELETE; decline stops mutation; busy disables and error prints inline. The standalone action span and shared dialog render siblings inside display:contents wrapper, preserving original visual layout; 44px phone/36px tablet desktop control buttons via scoped CSS.

**SuperAdminTemplateRollbackControl (45 lines):** action disabled when selectedVersion is already current or template archived, with explanatory captions; allowed state displays 14px/650 secondary Button, shared confirm retains detailed version/snapshot warning; accept sends unchanged versionId/currentVersion and confirmed:true POST. Inline success notice, error and pending states stay unchanged. Root section uses min-w-0 touch scoped class: all action and confirmation footer Buttons stay min44 through767, normal36 from768; neutral hairline border remains. No raw overlay.

Note: exact CSS values are from the old-LMS shell/SCSS and shared source; mobile/tablet proofs are source breakpoint comparisons. The app was not run, visual screenshots not taken; orchestrator section J handles final pixel acceptance.

## Completed: ProjectTemplateView blueprint read-only content

Full GitHub source scan (173 lines) after edits: 0 native JSX button/input/select/textarea, 0 hardcoded colour literals, 0 native confirm, 0 custom fixed-position dialog and 0 aria tab/toggle controls. The only imported visual primitive is StatusBadge. Optional description/priority, five named content blocks and no-data captions remain unchanged.

To reproduce: rg -n '<(button|input|select|textarea)\b|#[[:xdigit:]]{3,8}|window.confirm|fixed inset-0|role="dialog"|role="tab"|aria-pressed' src/components/projects/project-template-view.tsx => full GitHub source inspection 0 matching lines; local command not run.

| Property and state | Legacy source/reference | Present vNext source/value | Verdict |
|---|---|---|---|
| Single white canvas | old-lms-shell-spec.md:18-20 #fff, neutral200 border, radius12 pad24 | authenticated PageCanvas; project root unpainted div | inherited |
| Text colour/size | variables.scss:25 #54505d and 14px | text-sm text-body, globals.css:73,844 | match |
| Section heading | old-lms-pages.md:14 short section headers | h2 text-lg font-semibold, original hierarchy preserved | match hierarchy |
| Detail labels | old-lms-pages.md:14 headings over grouped rows | h3 text-sm semibold | match hierarchy |
| Hairline separators | common.scss:700-713 1px #e5e9f0 | border-b, border-y and divide-y canvas token | match |
| Row density | common.scss:720-726 12px vertical | TemplateRows py-[var(--lms-space-3)], globals.css:352=12px | match |
| Muted details | variables.scss:27 #6b7280 | text-muted-foreground token | match |
| Goal wrapping | old _learn-projects.scss:1063-1079 anywhere wrap | whitespace-pre-wrap break-words | match |
| Item title wrapping | old _learn-projects.scss:3787-3815 wrap anywhere | break-words on titles and item rows | match |
| List item wrapping | old _learn-projects.scss:1125-1152 sentences not pill chips | line-wrapped semantic list items | match |
| Counts | old-lms-pages.md:11 neutral badge | existing StatusBadge tone neutral; server count only | delegated |
| Missing goal | old-lms-pages.md:6 inline not fabricated | No project goal recorded fallback, no extra card | match |
| Missing array entries | old-lms-pages.md:6 inline empty state | None configured / None recorded, no fabricated data | match |
| Invalid/partial blueprint | old-lms-pages.md:6 truthful placeholders | unknown input guarded into empty object and optional arrays | match |
| Phone layout <=767 | listing-page-header.scss:130-159 one column | grid-cols-1, min-w-0; wraps text | match |
| Tablet layout 768-991 | variables.scss:149 $smd=991px | min-[992px] remains one column | match |
| Desktop >=992 | variables.scss:149 next breakpoint above991px | grid-cols-2 from 992px | match |
| Focus/hover/disabled/load | no interactive control or local mutation | all four local state sets empty; no overlays/buttons | n/a |

At 320px/767px and up to 991px each grid is one column and every variable-length text field wraps; at >=992px both switch to two columns while retaining min-w-0. The legacy project SCSS at 42Students/lms2-fe prod-2026 src/styles/components/_learn-projects.scss:1125-1152 verifies deliverables should be sentence lists, not narrow pill chips. No page content, props or semantics were modified beyond visual overflow, density and fluid grid classes. This is source proof; browser/CI/screenshot verification remains the orchestrator's section J.

## Completed — learner saved-task Board lane index

Source: 43-line src/components/projects/learner-board-task-index.tsx, now using the already source-proven legacy-project-board.module.css (124 lines) rather than generic BoardColumn geometry. Same task URLs, status, sprint detail, labels and empty messages. CSS reference: 42Students/lms2-fe@prod-2026 src/styles/components/_learn-projects.scss:3953-3993,4159-4184,4193-4259,4299-4335,5662-5697.

Full-file source checks: raw button/input/select/textarea=0; hardcoded hex=0; homemade dialog/native confirm=0; manually drawn tabs or aria-pressed=0. Shared components: one BoardColumn element rendered per persisted lane, one Badge element for count, one EmptyState in empty lanes, one Link element per task. Repeat in orchestrator: rg -n '<(button|input|select|textarea)\b|#[[:xdigit:]]{3,8}|window.confirm|fixed inset-0|role="dialog"|role="tab"|aria-pressed' src/components/projects/learner-board-task-index.tsx => source count 0. This scan used full GitHub file strings rather than local runtime.

| Property/state (20) | Legacy reference | Present scoped CSS/shared source | Match |
|---|---|---|---|
| Outer canvas | old-lms-shell-spec.md:18-20 one white canvas | semantic section only, no extra canvas | yes |
| Horizontal overflow | old project SCSS:5662-5697 X scroll | legacy-project-board.module.css:88-100 overflow-x auto | yes |
| Board track | project SCSS:3953-3993 flex gap12 | module.css:7-13 same | yes |
| Desktop lane width | project SCSS:3953-3993 320px | module.css:14-19 width and flex-basis320 !important | yes |
| Desktop lane min height | old project 260px | module.css:20 260px | yes |
| Lane radius | old project 20px | module.css:25 20px | yes |
| Lane border | old project rgba(38,186,199,.16) | module.css:24 same | yes |
| Lane background | old teal4%-to-white gradient | module.css:26 same | yes |
| Lane resting shadow | old project double elevation2 | module.css:27 two-layer matching | yes |
| Lane hover | old translateY(-1px), teal28% and elev3 | module.css:30-34 matching | yes |
| Lane heading | old 14px/600 and hairline | module.css:44-54 matching | yes |
| Count | old-lms-pages.md:11 small count badge | shared Badge neutral, tabular numbers | delegated |
| Internal task gap | old project 8px | module.css:55-64 flex gap8 | yes |
| Task scroll ceiling | old min(62vh,720px), phone58vh | module.css:55-64,112-122 | yes |
| Task radius | old project card16px | module.css:65-73 card radius16 !important | yes |
| Task card border/surface | old white surface and neutral-200 .85 | module.css:65-75 same | yes |
| Card hover/focus | old hover elevation, teal 2px focus | module.css:77-93, Link focus-outline2 | yes |
| Touch target | variables.scss:139 >=44px on phones | task Link min-h-11 md:min-h-9, plus card padding | yes |
| Mobile width and snap | old project SCSS:5662-5697 82% lane, snap at <=767 | module.css:104-121 82%, scroll snap start | yes |
| Reduced motion | old project accessibility no hover animation | module.css:123-124 transition none | yes |

Desktop >=768px: horizontal lane strip uses 320px standard lanes and the separate 260px unscheduled Backlog lane (learner-board-task-index.tsx condition lane.id===BACKLOG maps to legacy-project-board.module.css backlogLane), board items remain wrapped without horizontal clipping. Phone 320–767px: parent scroll region enables horizontal scroll and each lane is 82% width with snap; task list max-height58vh, and clickable task cards stay >=44px tall. The scroll region is focusable/labelled and already owned by its component. Empty task lane shows shared EmptyState. The old CSS module is shared by the other project boards and contains legacy-sourced values, so no src/components/ui/board-column.tsx edits were necessary. No content, routing or underlying task action behavior changed. Browser screenshot/computed CSS verification remains separate.
