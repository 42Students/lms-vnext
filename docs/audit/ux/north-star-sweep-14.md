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

- [x] `src/app/(authenticated)/mentor/activity/error.tsx`
- [x] `src/app/(authenticated)/mentor/activity/loading.tsx`
- [x] `src/app/(authenticated)/mentor/activity/page.tsx`
- [x] `src/app/(authenticated)/mentor/allQuizzes/page.tsx`
- [x] `src/app/(authenticated)/mentor/calendar/error.tsx`
- [x] `src/app/(authenticated)/mentor/calendar/loading.tsx`
- [x] `src/app/(authenticated)/mentor/calendar/page.tsx`
- [x] `src/app/(authenticated)/mentor/contacts/[[...contactsTab]]/page.tsx`
- [x] `src/app/(authenticated)/mentor/courses/[courseId]/[[...courseTab]]/page.tsx`
- [x] `src/app/(authenticated)/mentor/courses/page.tsx`
- [x] `src/app/(authenticated)/mentor/error.tsx`
- [x] `src/app/(authenticated)/mentor/fileExplorer/page.tsx`
- [x] `src/app/(authenticated)/mentor/layout.tsx`
- [x] `src/app/(authenticated)/mentor/loading.tsx`
- [x] `src/app/(authenticated)/mentor/not-found.tsx`
- [x] `src/app/(authenticated)/mentor/notifications/error.tsx`
- [x] `src/app/(authenticated)/mentor/notifications/loading.tsx`
- [x] `src/app/(authenticated)/mentor/notifications/page.tsx`
- [x] `src/app/(authenticated)/mentor/page.tsx`
- [x] `src/app/(authenticated)/mentor/profile/page.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/activity-history/error.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/activity-history/loading.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/board-review/error.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/board-review/loading.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/board-review/page.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/closeout/error.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/closeout/loading.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/closeout/page.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/deliveries/[submissionId]/review/error.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/deliveries/[submissionId]/review/loading.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/deliveries/[submissionId]/review/page.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/error.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/loading.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/meetings/[meetingId]/notes/error.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/meetings/[meetingId]/notes/loading.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/meetings/[meetingId]/notes/page.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/page.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/resources-directory/error.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/resources-directory/loading.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/resources-directory/page.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/review-completeness/error.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/review-completeness/loading.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/review-completeness/page.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/review-overview/error.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/review-overview/loading.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/review-overview/page.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/risk-readiness/error.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/risk-readiness/loading.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/risk-readiness/page.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/tasks/[taskId]/feedback/error.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/tasks/[taskId]/feedback/loading.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/tasks/[taskId]/feedback/page.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/team-history/error.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/team-history/loading.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/team-history/page.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/team-meetings/error.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/team-meetings/loading.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/team-meetings/page.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/timeline/error.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/timeline/loading.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/timeline/page.tsx`
- [x] `src/app/(authenticated)/mentor/projects/error.tsx`
- [x] `src/app/(authenticated)/mentor/projects/loading.tsx`
- [x] `src/app/(authenticated)/mentor/projects/page.tsx`
- [x] `src/app/(authenticated)/mentor/reports/error.tsx`
- [x] `src/app/(authenticated)/mentor/reports/loading.tsx`
- [x] `src/app/(authenticated)/mentor/reports/page.tsx`
- [x] `src/app/(authenticated)/mentor/review-history/error.tsx`
- [x] `src/app/(authenticated)/mentor/review-history/loading.tsx`
- [x] `src/app/(authenticated)/mentor/review-history/page.tsx`
- [x] `src/app/(authenticated)/mentor/reviews/error.tsx`
- [x] `src/app/(authenticated)/mentor/reviews/loading.tsx`
- [x] `src/app/(authenticated)/mentor/reviews/page.tsx`
- [x] `src/app/(authenticated)/mentor/sprint-progress/error.tsx`
- [x] `src/app/(authenticated)/mentor/sprint-progress/loading.tsx`
- [x] `src/app/(authenticated)/mentor/sprint-progress/page.tsx`
- [x] `src/app/(authenticated)/mentor/task-review-history/error.tsx`
- [x] `src/app/(authenticated)/mentor/task-review-history/loading.tsx`
- [x] `src/app/(authenticated)/mentor/task-review-history/page.tsx`
- [x] `src/app/(authenticated)/mentor/task-reviews/error.tsx`
- [x] `src/app/(authenticated)/mentor/task-reviews/loading.tsx`
- [x] `src/app/(authenticated)/mentor/task-reviews/page.tsx`
- [x] `src/app/(authenticated)/mentor/team-coverage/error.tsx`
- [x] `src/app/(authenticated)/mentor/team-coverage/loading.tsx`
- [x] `src/app/(authenticated)/mentor/team-coverage/page.tsx`

## Projects component inventory — audit and sweep

- [x] `src/components/projects/mentor-board-task-detail-dialog.tsx`
- [x] `src/components/projects/mentor-calendar-load-failure.tsx`
- [x] `src/components/projects/mentor-delivery-lock-control.tsx`
- [x] `src/components/projects/mentor-lane-board.tsx`
- [x] `src/components/projects/mentor-meeting-history.tsx`
- [x] `src/components/projects/mentor-meeting-notes-editor.tsx`
- [x] `src/components/projects/mentor-meeting-reschedule.tsx`
- [x] `src/components/projects/mentor-meetings-calendar.tsx`
- [x] `src/components/projects/mentor-product-backlog.tsx`
- [x] `src/components/projects/mentor-project-about-editor.tsx`
- [x] `src/components/projects/mentor-project-closeout-control.tsx`
- [x] `src/components/projects/mentor-project-tabs.tsx`
- [x] `src/components/projects/mentor-projects-unavailable.tsx`
- [x] `src/components/projects/mentor-release-editor.tsx`
- [x] `src/components/projects/mentor-sprint-delete-control.tsx`
- [x] `src/components/projects/mentor-sprint-details-edit.tsx`
- [x] `src/components/projects/mentor-sprint-write.tsx`
- [x] `src/components/projects/mentor-task-allocation.tsx`
- [x] `src/components/projects/mentor-task-create.tsx`
- [x] `src/components/projects/mentor-task-delete-control.tsx`
- [x] `src/components/projects/mentor-task-details-edit.tsx`
- [x] `src/components/projects/mentor-task-status-transition.tsx`
- [x] `src/components/projects/project-activity-filtered-list.tsx`
- [x] `src/components/projects/project-final-delivery-controls.tsx`
- [x] `src/components/projects/project-list.tsx`
- [x] `src/components/projects/project-meeting-controls.tsx`
- [x] `src/components/projects/project-resource-controls.tsx`
- [x] `src/components/projects/project-resource-files-section.tsx`
- [x] `src/components/projects/project-resource-list.tsx`
- [x] `src/components/projects/project-task-assignee-control.tsx`
- [x] `src/components/projects/project-task-comments.tsx`
- [x] `src/components/projects/project-team-controls.tsx`
- [x] `src/components/projects/project-workspace.tsx`

## Execution notes

- Route actions and JSX logic stay identical; styling-only replacements are intended. Page-level h1 and primary-link normalization first; form controls and section boundaries second; interactive mentor boards/editors and shared mentor-visible project panels last.
- Error and loading files are included in inventory and should be marked checked even when they contain no visual overrides.
- No runtime, build, typecheck, or CI executed by request. Syntax preserved through bounded literal/class replacements.

## Completion record — 2026-10-19

- All **86** mentor route TSX files and **33** listed Projects components were source-checked; checklist entries above mean source-level sweep/verification, not a screenshot-level visual certification. Redirect-only pages and semantic shared components required no changes.
- Mentor page h1 elements use the inherited or explicit **Inter / 30px / 600 / `var(--lms-heading)`** treatment. PageHeader comes from the shared UI kit owned by chat-17.
- Native mentor fields are wired to the existing shared skin with `data-slot="input|select|textarea"`. Native fields retain their names, values, validation and handlers; links use `text-link`, focus tokens and the **9px control radius** instead of bespoke styles.
- Removed extra white-card/chrome wrappers from page-level filters, mentor fallback and route error/loading states, and the project-detail “Additional project tools” container. Meeting rows now use thin separators. Preserved separate objects such as board lanes, task cards, detail drawers, metrics and submission views.
- Mentor-facing Projects workspace primitives were also normalized without changing ownership, authorization, data flow, route structure or user-facing wording.
- **Deliberately untouched:** global CSS, app shell, sidebar/top bar and shared UI kit (other lane ownership). Existing shared primary Button uses `bg-primary text-on-primary` -> `#0a7c88` with white text, 36px minimum and radius 9px.
- **Verification limit:** No code execution, typecheck, test, CI or browser visual comparison was performed by instruction. Pixel-for-pixel parity and all mobile states require the orchestrator's final screenshot pass; no runtime completeness claim is made.
