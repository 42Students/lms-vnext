# NORTH STAR visual sweep — chat-14 (Mentor and Projects Mentor)

Owner: chat-14 · branch: `chatgpt/chat-14-b` · reference: `docs/orchestrator/queues/master-queue.md` (NORTH STAR, 2026-10-19).

## Scope and strict boundaries

- Sweep the entire `/mentor/**` route tree, including loading/error/empty states and the mentor-specific Projects interactive surfaces listed below.
- Keep all route names, forms, tables, controls, action logic, data, wording, and role checks unchanged. Do not redesign inner section order or suppress genuinely separate board cards / dialogs / rows.
- Global `src/components/ui/**`, `src/app/globals.css`, `src/components/shell/**`, and the authenticated canvas layout are independently owned by chat-17/19/13. Consume their tokens and primitives; do not edit them.
- The page's **outer** region must not add another background, border, radius, shadow, or full-page padding over `PageCanvas`. Use spacing and hairline dividers for ordinary nested sections.
- Visual reference: `old-lms-shell-spec.md`, `old-lms-shell.css`, `old-lms-pages.md`, `vnext-vs-old-lms-gap.md` and `legacy-styles/*.scss`.

## Normalization rules

| Concern | Target | Action |
|---|---|---|
| Page heading | Inter, 30px/600, `#172033` | `PageHeader` or `text-[30px] font-semibold text-[var(--lms-heading)]` for route-owned h1 |
| Main actions | `#0a7c88` bg, white text, 9px radius, 36px height | Shared `Button` wherever it fits; semantic `bg-primary text-on-primary rounded-[9px]` for links |
| Neutral actions | white surface, subtle border and 9px radius | Shared `Button variant=secondary` or semantic token classes |
| Fields | shared Input/Select/Textarea, semantic tokens, focus ring | Remove per-element backgrounds/radius/borders that fight the shared field skin |
| Nested structure | continuous white page canvas | Remove redundant outer cards/panels only; keep genuine independent objects such as task board cards |
| Status / inline actions | semantic foreground, muted, warning and error tokens | Keep meaning, replace literal colour utilities and custom arbitrary colours |
| Focus / responsive | keyboard ring, min-width/overflow and mobile wrapping | Preserve affordances, form semantics and touch targets |

## Route inventory — audit and sweep

- [ ] `src/app/(authenticated)/mentor/activity/error.tsx`
- [ ] `src/app/(authenticated)/mentor/activity/loading.tsx`
- [ ] `src/app/(authenticated)/mentor/activity/page.tsx`
- [ ] `src/app/(authenticated)/mentor/allQuizzes/page.tsx`
- [ ] `src/app/(authenticated)/mentor/calendar/error.tsx`
- [ ] `src/app/(authenticated)/mentor/calendar/loading.tsx`
- [ ] `src/app/(authenticated)/mentor/calendar/page.tsx`
- [ ] `src/app/(authenticated)/mentor/contacts/[[...contactsTab]]/page.tsx`
- [ ] `src/app/(authenticated)/mentor/courses/[courseId]/[[...courseTab]]/page.tsx`
- [ ] `src/app/(authenticated)/mentor/courses/page.tsx`
- [ ] `src/app/(authenticated)/mentor/error.tsx`
- [ ] `src/app/(authenticated)/mentor/fileExplorer/page.tsx`
- [ ] `src/app/(authenticated)/mentor/layout.tsx`
- [ ] `src/app/(authenticated)/mentor/loading.tsx`
- [ ] `src/app/(authenticated)/mentor/not-found.tsx`
- [ ] `src/app/(authenticated)/mentor/notifications/error.tsx`
- [ ] `src/app/(authenticated)/mentor/notifications/loading.tsx`
- [ ] `src/app/(authenticated)/mentor/notifications/page.tsx`
- [ ] `src/app/(authenticated)/mentor/page.tsx`
- [ ] `src/app/(authenticated)/mentor/profile/page.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/activity-history/error.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/activity-history/loading.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/board-review/error.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/board-review/loading.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/board-review/page.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/closeout/error.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/closeout/loading.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/closeout/page.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/deliveries/[submissionId]/review/error.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/deliveries/[submissionId]/review/loading.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/deliveries/[submissionId]/review/page.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/error.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/loading.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/meetings/[meetingId]/notes/error.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/meetings/[meetingId]/notes/loading.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/meetings/[meetingId]/notes/page.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/page.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/resources-directory/error.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/resources-directory/loading.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/resources-directory/page.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/review-completeness/error.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/review-completeness/loading.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/review-completeness/page.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/review-overview/error.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/review-overview/loading.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/review-overview/page.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/risk-readiness/error.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/risk-readiness/loading.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/risk-readiness/page.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/tasks/[taskId]/feedback/error.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/tasks/[taskId]/feedback/loading.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/tasks/[taskId]/feedback/page.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/team-history/error.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/team-history/loading.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/team-history/page.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/team-meetings/error.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/team-meetings/loading.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/team-meetings/page.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/timeline/error.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/timeline/loading.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/timeline/page.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/error.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/loading.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/page.tsx`
- [ ] `src/app/(authenticated)/mentor/reports/error.tsx`
- [ ] `src/app/(authenticated)/mentor/reports/loading.tsx`
- [ ] `src/app/(authenticated)/mentor/reports/page.tsx`
- [ ] `src/app/(authenticated)/mentor/review-history/error.tsx`
- [ ] `src/app/(authenticated)/mentor/review-history/loading.tsx`
- [ ] `src/app/(authenticated)/mentor/review-history/page.tsx`
- [ ] `src/app/(authenticated)/mentor/reviews/error.tsx`
- [ ] `src/app/(authenticated)/mentor/reviews/loading.tsx`
- [ ] `src/app/(authenticated)/mentor/reviews/page.tsx`
- [ ] `src/app/(authenticated)/mentor/sprint-progress/error.tsx`
- [ ] `src/app/(authenticated)/mentor/sprint-progress/loading.tsx`
- [ ] `src/app/(authenticated)/mentor/sprint-progress/page.tsx`
- [ ] `src/app/(authenticated)/mentor/task-review-history/error.tsx`
- [ ] `src/app/(authenticated)/mentor/task-review-history/loading.tsx`
- [ ] `src/app/(authenticated)/mentor/task-review-history/page.tsx`
- [ ] `src/app/(authenticated)/mentor/task-reviews/error.tsx`
- [ ] `src/app/(authenticated)/mentor/task-reviews/loading.tsx`
- [ ] `src/app/(authenticated)/mentor/task-reviews/page.tsx`
- [ ] `src/app/(authenticated)/mentor/team-coverage/error.tsx`
- [ ] `src/app/(authenticated)/mentor/team-coverage/loading.tsx`
- [ ] `src/app/(authenticated)/mentor/team-coverage/page.tsx`

## Projects component inventory — audit and sweep

- [ ] `src/components/projects/mentor-board-task-detail-dialog.tsx`
- [ ] `src/components/projects/mentor-calendar-load-failure.tsx`
- [ ] `src/components/projects/mentor-delivery-lock-control.tsx`
- [ ] `src/components/projects/mentor-lane-board.tsx`
- [ ] `src/components/projects/mentor-meeting-history.tsx`
- [ ] `src/components/projects/mentor-meeting-notes-editor.tsx`
- [ ] `src/components/projects/mentor-meeting-reschedule.tsx`
- [ ] `src/components/projects/mentor-meetings-calendar.tsx`
- [ ] `src/components/projects/mentor-product-backlog.tsx`
- [ ] `src/components/projects/mentor-project-about-editor.tsx`
- [ ] `src/components/projects/mentor-project-closeout-control.tsx`
- [ ] `src/components/projects/mentor-project-tabs.tsx`
- [ ] `src/components/projects/mentor-projects-unavailable.tsx`
- [ ] `src/components/projects/mentor-release-editor.tsx`
- [ ] `src/components/projects/mentor-sprint-delete-control.tsx`
- [ ] `src/components/projects/mentor-sprint-details-edit.tsx`
- [ ] `src/components/projects/mentor-sprint-write.tsx`
- [ ] `src/components/projects/mentor-task-allocation.tsx`
- [ ] `src/components/projects/mentor-task-create.tsx`
- [ ] `src/components/projects/mentor-task-delete-control.tsx`
- [ ] `src/components/projects/mentor-task-details-edit.tsx`
- [ ] `src/components/projects/mentor-task-status-transition.tsx`
- [ ] `src/components/projects/project-activity-filtered-list.tsx`
- [ ] `src/components/projects/project-final-delivery-controls.tsx`
- [ ] `src/components/projects/project-list.tsx`
- [ ] `src/components/projects/project-meeting-controls.tsx`
- [ ] `src/components/projects/project-resource-controls.tsx`
- [ ] `src/components/projects/project-resource-files-section.tsx`
- [ ] `src/components/projects/project-resource-list.tsx`
- [ ] `src/components/projects/project-task-assignee-control.tsx`
- [ ] `src/components/projects/project-task-comments.tsx`
- [ ] `src/components/projects/project-team-controls.tsx`
- [ ] `src/components/projects/project-workspace.tsx`

## Execution notes

- Route actions and JSX logic stay identical; styling-only replacements are intended. Page-level h1 and primary-link normalization first; form controls and section boundaries second; interactive mentor boards/editors and shared mentor-visible project panels last.
- Error and loading files are included in inventory and should be marked checked even when they contain no visual overrides.
- No runtime, build, typecheck, or CI executed by request. Syntax preserved through bounded literal/class replacements.
