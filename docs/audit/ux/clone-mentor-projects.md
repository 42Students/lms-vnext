# Mentor, Projects and Tracker — UI clone audit (chat-8)

Reference baseline: `origin/main` at `12ee0a58fd9af5e0e1f1ad975155f864966cb6c0` (2026-10-19). Owned areas: `src/app/(authenticated)/mentor/**`, `src/app/(authenticated)/tracker/**`, `src/components/projects/**`. Shared UI, global skin and auth/layout shell are **not** owned by this lane.

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
