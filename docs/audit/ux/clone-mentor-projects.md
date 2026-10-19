# Mentor, Projects and Tracker — UI clone audit (chat-8)

Reference baseline: `origin/main` at `1fae38d2c433f5b5b0a90a22be12754ab28796e0` (2026-10-19). Owned areas: `src/app/(authenticated)/mentor/**`, `src/app/(authenticated)/tracker/**`, `src/components/projects/**`. Shared UI, global skin and auth/layout shell are **not** owned by this lane.

## Work queue (repository-tree inventory, not a runtime grep)

Inventory source: GitHub recursive tree for `main`, listing TSX paths. This is **not** a claim that a local grep, runtime or screenshot was run. Work outward from pages and then the project components, keeping page content/behavior unchanged.

### Mentor pages (32 page.tsx; 86 total TSX)

- [ ] `src/app/(authenticated)/mentor/activity/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/app/(authenticated)/mentor/allQuizzes/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/app/(authenticated)/mentor/calendar/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/app/(authenticated)/mentor/contacts/[[...contactsTab]]/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/app/(authenticated)/mentor/courses/[courseId]/[[...courseTab]]/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/app/(authenticated)/mentor/courses/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/app/(authenticated)/mentor/fileExplorer/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/app/(authenticated)/mentor/notifications/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/app/(authenticated)/mentor/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/app/(authenticated)/mentor/profile/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/board-review/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/closeout/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/deliveries/[submissionId]/review/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/meetings/[meetingId]/notes/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/resources-directory/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/review-completeness/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/review-overview/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/risk-readiness/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/tasks/[taskId]/feedback/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/team-history/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/team-meetings/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/timeline/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
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
- [ ] `src/app/(authenticated)/tracker/mine/[publicId]/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/app/(authenticated)/tracker/mine/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/app/(authenticated)/tracker/page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)

### Project components (94 TSX)

- [ ] `src/components/projects/admin-project-section-page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/admin-readiness-workspace-picker.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/class-team-workspace-creator.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/college-project-mentor-dialog.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/college-project-student-roster-dialog.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/college-project-summary-editor-full.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/college-project-summary-editor.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/learner-board-interactive.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/learner-board-task-detail-dialog.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/learner-board-task-index.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/learner-own-task-controls.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/learner-project-activity.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/learner-project-board-search.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/learner-project-goals.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/learner-project-mobile-filters.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/learner-project-tabs.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/learner-task-progress-control.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/learner-task-status-actions.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/mentor-board-task-detail-dialog.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/mentor-calendar-load-failure.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/mentor-delivery-lock-control.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/mentor-lane-board.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/mentor-meeting-history.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/mentor-meeting-notes-editor.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/mentor-meeting-reschedule.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/mentor-meetings-calendar.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/mentor-product-backlog.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/mentor-project-about-editor.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/mentor-project-closeout-control.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/mentor-project-tabs.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/mentor-projects-unavailable.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/mentor-release-editor.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/mentor-sprint-delete-control.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/mentor-sprint-details-edit.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/mentor-sprint-write.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/mentor-task-allocation.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/mentor-task-create.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/mentor-task-delete-control.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/mentor-task-details-edit.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/mentor-task-status-transition.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-activity-filtered-list.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-admin-at-risk-page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-admin-audit-page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-admin-collection-controls.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-admin-missing-college.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-admin-nav.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-admin-readiness-page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-admin-reassign-mentor-page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-admin-submission-review.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-admin-submissions-page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-admin-workspace-list.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-admin-workspace-page-export.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-archive-control.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-at-risk-page-export.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-audit-page-export.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-create-control.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-delivery-evidence-download.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
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
- [ ] `src/components/projects/project-resource-open-link.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-submissions-page-export.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-task-assignee-control.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-task-comments.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-task-submission-control.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-team-controls.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-template-catalogue-export.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-template-controls.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-template-view.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-workspace-page-export.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-workspace-readiness.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/project-workspace.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/super-admin-template-archive-control.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/super-admin-template-college-bulk.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/super-admin-template-create-form.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/super-admin-template-overview-editor.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/super-admin-template-page-export.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/super-admin-template-plan-editor.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/super-admin-template-resource-editor.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/super-admin-template-rollback-control.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/super-admin-template-subview-page.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
- [ ] `src/components/projects/super-admin-template-tabs.tsx` (missing: value table, remaining judgement-case grep, phone/tablet proof)
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

- [ ] Native-looking project/mentor inline status pills, duplicate nested headings and ad-hoc view wrappers: use scoped AST codemod for genuinely identical patterns only; keep risky dynamic class conditions for manual review.
- [ ] All PageHeader child headings / validation error page titles: orchestrator owns `scripts/codemods/chat9-page-header.cjs`; do not duplicate its global rewrite.
- [ ] Generic alerts, error and loading markup: orchestrator owns `scripts/codemods/chat5-states.cjs`; do not hand-migrate the repeating pattern.

## Manual judgement checklist

- [ ] Mentor board inside project detail: ensure just one top-level `PageHeader`; section heading remains accessible.
- [ ] Mentor and learner board lane count chips: shared badge visual, phone-width sideways scrolling and keyboard focus.
- [ ] Project list hover/focus cards: legacy border/radius/shadow values.
- [ ] Sprints, tasks, backlog, releases, meeting logs, approvals, resources: preserve content and use one canvas; check nested cards separately.
- [ ] Tracker issues and audit findings: status badges, filters, pagination and loading/empty/error states.
