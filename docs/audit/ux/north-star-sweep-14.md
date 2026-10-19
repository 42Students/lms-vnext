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

## Follow-up source sweep (2026-10-19, chat-14)

This follow-up was committed directly to `chatgpt/chat-14-b` after fast-forwarding the lane to the then-current `main`. Three batches of ten `[chat-14]` commits each were pushed through GitHub's branch-specific file updates; no commits were sent to main.

### Batch 1 — mentor-facing project controls (10 commits)

- `src/components/projects/project-resource-files-panel.tsx`: resource file list uses hairline rows, file-picker appearance uses semantic control tokens.
- `src/components/projects/project-delivery-file-uploader.tsx`: remove duplicate inner-card wrapper and align file picker with tokens.
- `src/components/projects/project-resource-open-link.tsx`: shared link color and control radius.
- `src/components/projects/project-resource-list.tsx`, `project-resource-controls.tsx`, `project-team-controls.tsx`: remove the inappropriate `data-slot="input"` styling from native checkboxes and use a 16px checkbox with the primary accent token; preserve checked values and handlers.
- `src/components/projects/mentor-calendar-load-failure.tsx`: error boundary content on the single canvas.
- `src/components/projects/project-participant-list-controls.tsx`: control radius token and redundant empty class cleanup.
- `src/components/projects/project-meeting-controls.tsx`: remove an unnecessary nested fieldset box; preserve meeting-note fieldset and legend.
- `src/components/projects/project-workspace.tsx`: mentor overview sections use separators instead of a second white canvas; learner-specific layout preserved.

### Batch 2 — mentor Projects details (10 commits)

- `src/app/(authenticated)/mentor/projects/[projectId]/`: `team-history`, `team-meetings`, `timeline`, `activity-history`, `review-overview`, `review-completeness`, `risk-readiness`, `board-review` pages: list rows use hairlines instead of individual white cards; preserve summary/metric tiles and user workflows.
- `src/app/(authenticated)/mentor/review-history/page.tsx` and `task-review-history/page.tsx`: recorded history uses the old-LMS continuous-list treatment.

### Batch 3 — mentor portal lists and sections (10 commits)

- `src/app/(authenticated)/mentor/`: `activity`, `notifications`, `reviews`, `task-reviews`, `sprint-progress`, `team-coverage`, `reports`, `calendar`: remove stacked-list cards and duplicated select skins where appropriate. Retain report metric tiles and semantic alerts.
- `src/app/(authenticated)/mentor/projects/[projectId]/resources-directory/page.tsx`: resource tiles use the canonical card radius and border tokens, preserving the two-column directory.
- `src/app/(authenticated)/mentor/projects/[projectId]/deliveries/[submissionId]/review/page.tsx`: five information sections become one continuous white-canvas flow separated by hairlines; source data and review actions are unchanged.

### Final static source check

- Inspected a sample of ten edited files, including checkbox components and the large mentor workspace. Confirmed **no native checkbox retains `data-slot="input"`** among the sampled files; no duplicated `data-slot` input attributes; and brace counts matched in this sample.
- No application code, build, typecheck, lint, tests, CI, or browser session was executed, by request. Static checks are not a TypeScript syntax validation or an assertion of pixel-perfect visual parity.
- The shared global tokens, UI-kit, sidebar, topbar, and authenticated shell remain owned by their assigned lanes, not chat-14.

## Continuation: mentor final polish, then the next open portal (College Admin)

- Baseline: `main` was found to already contain the prior chat-14 commits. Fast-forwarded the chat-14 branch to `d5798cd5a0d4aba3ae022293b231211cf1dbb04d` before these edits, without force and without rewriting any history.
- The next explicitly unfinished portal was selected from `docs/audit/ux/north-star-sweep-4.md`, which listed **389 unchecked paths** at that snapshot. The separate chat-4 audit has broader recorded work, so this is a **second pass**, not a claim that the college portal is otherwise untouched or completely audited. The chat-4-owned audit was not overwritten.
- **50 new per-file styling commits** tagged `[chat-14]`, all directly committed to `chatgpt/chat-14-b`: ten mentor/Projects fixes and four ten-file College Admin batches. No changes to shared CSS, sidebar, top bar, authentication, API, data or tests.
- Mentor refinements: duplicate heading utility removed in mentor board/task allocation; native closeout checkbox no longer receives text-input skin; backlog/release editor and task details/closeout/meeting-outcome layouts use control tokens and existing-canvas separators. Semantically separate dialogs remain intact.
- College refinements: linked text uses `text-link` instead of deep-teal literals, 9px radius token via `var(--lms-control-radius)`, solid primary buttons use `text-on-primary` rather than foreground text, extra filter/alert outer white-card layers reduced, and accidentally split Tailwind class fragments (`sm: border-t`, `space-y-3 - border-t`) corrected. Data tables, workflow ordering, responsive touch targets, permissions and action handlers preserved.

### This continuation's mentor files (10)

- [x] `src/components/projects/mentor-lane-board.tsx`
- [x] `src/components/projects/mentor-task-allocation.tsx`
- [x] `src/components/projects/mentor-project-closeout-control.tsx`
- [x] `src/components/projects/mentor-product-backlog.tsx`
- [x] `src/components/projects/mentor-release-editor.tsx`
- [x] `src/components/projects/mentor-board-task-detail-dialog.tsx`
- [x] `src/app/(authenticated)/mentor/projects/page.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/closeout/page.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/meetings/[meetingId]/notes/page.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/tasks/[taskId]/feedback/page.tsx`

### College Admin spillover files (40; *partial* audit of the larger portal)

- [x] `src/app/(authenticated)/college/activity/[eventId]/page.tsx`
- [x] `src/app/(authenticated)/college/activity/page.tsx`
- [x] `src/app/(authenticated)/college/announcements/page.tsx`
- [x] `src/app/(authenticated)/college/attendance/corrections/page.tsx`
- [x] `src/app/(authenticated)/college/batch-promotion/page.tsx`
- [x] `src/app/(authenticated)/college/batches/[cohortId]/students/page.tsx`
- [x] `src/app/(authenticated)/college/branding/page.tsx`
- [x] `src/app/(authenticated)/college/academics/page.tsx`
- [x] `src/app/(authenticated)/college/attendance/page.tsx`
- [x] `src/app/(authenticated)/college/batches/page.tsx`
- [x] `src/app/(authenticated)/college/classes/page.tsx`
- [x] `src/app/(authenticated)/college/college-profile/page.tsx`
- [x] `src/app/(authenticated)/college/companies/page.tsx`
- [x] `src/app/(authenticated)/college/contacts/[membershipId]/page.tsx`
- [x] `src/app/(authenticated)/college/contacts/page.tsx`
- [x] `src/app/(authenticated)/college/course-progress/page.tsx`
- [x] `src/app/(authenticated)/college/departments/page.tsx`
- [x] `src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx`
- [x] `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx`
- [x] `src/app/(authenticated)/college/faculty-assignment/page.tsx`
- [x] `src/app/(authenticated)/college/electives/page.tsx`
- [x] `src/app/(authenticated)/college/faculty/[membershipId]/page.tsx`
- [x] `src/app/(authenticated)/college/faculty/import/page.tsx`
- [x] `src/app/(authenticated)/college/groups/[groupId]/page.tsx`
- [x] `src/app/(authenticated)/college/groups/page.tsx`
- [x] `src/app/(authenticated)/college/lecture-halls/page.tsx`
- [x] `src/app/(authenticated)/college/lecture-halls/[hallId]/page.tsx`
- [x] `src/app/(authenticated)/college/lessons/page.tsx`
- [x] `src/app/(authenticated)/college/live-classes/page.tsx`
- [x] `src/app/(authenticated)/college/people/manage/page.tsx`
- [x] `src/app/(authenticated)/college/profile/page.tsx`
- [x] `src/app/(authenticated)/college/quizzes/page.tsx`
- [x] `src/app/(authenticated)/college/resources/page.tsx`
- [x] `src/app/(authenticated)/college/semester-courses/page.tsx`
- [x] `src/app/(authenticated)/college/semesters/page.tsx`
- [x] `src/app/(authenticated)/college/students/[membershipId]/page.tsx`
- [x] `src/app/(authenticated)/college/students/import/page.tsx`
- [x] `src/app/(authenticated)/college/students/register/page.tsx`
- [x] `src/app/(authenticated)/college/groups/[groupId]/rule-preview/page.tsx`
- [x] `src/app/(authenticated)/college/hiring-dashboard/page.tsx`

### Verification caveat

Performed source-only checks of sampled modified files for balanced curly braces, invalid split class fragments, duplicate 30px heading font weights, native checkbox wrongly marked as a text input and obvious primary-button foreground mistakes. These are narrow heuristics and **do not replace a TypeScript parse, typecheck, CI or rendered browser comparison**. No tests, build, app, CI or browser were run, as requested. Many College Admin routes remain outside this continuation's touched-file list and may need a later pass.

## Additional College Admin North Star sweep — further 50 files (2026-10-19)

Baseline: fast-forwarded `chatgpt/chat-14-b` to latest available `main` (`6222f78a4a19084be6529aa802810ee98193c1d2`, 686 commits ahead of the previous chat-14 branch) using the expected old ref. The previous chat-14 commits had already been merged into `main`; the fast-forward did **not** discard lane work. All new writes stay on `chatgpt/chat-14-b`, tagged `[chat-14]`; GitHub's branch-specific file update directly commits/pushes each file, so commits were published in approximately ten-file groups.

The live `docs/audit/ux/north-star-sweep-4.md` college audit retains its own source-review state and ownership; this log is an incremental **second-pass** record, not a completed portal acceptance claim. Scope is visual skin only: updated legacy control radius and link/focus tokens, preserved status semantics and genuine separate cards, fixed primary CTA contrast, removed a small number of duplicate card wrappers, and fixed split Tailwind border-class fragments. Existing fields, labels, routes, form submission, permission checks and data rendering were not intentionally changed.

### College Admin placement, group and Projects routes (19)

- [x] `src/app/(authenticated)/college/groups/[groupId]/import-preview/page.tsx`
- [x] `src/app/(authenticated)/college/placements/drives/page.tsx`
- [x] `src/app/(authenticated)/college/placements/interviews/page.tsx`
- [x] `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx`
- [x] `src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx`
- [x] `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx`
- [x] `src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx`
- [x] `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx`
- [x] `src/app/(authenticated)/college/placements/page.tsx`
- [x] `src/app/(authenticated)/college/placements/readiness-by-department/page.tsx`
- [x] `src/app/(authenticated)/college/placements/retention/page.tsx`
- [x] `src/app/(authenticated)/college/placements/student-lookup/page.tsx`
- [x] `src/app/(authenticated)/college/projects/create/page.tsx`
- [x] `src/app/(authenticated)/college/projects/page.tsx`
- [x] `src/app/(authenticated)/college/projects/templates/[templateId]/page.tsx`
- [x] `src/app/(authenticated)/college/projects/templates/page.tsx`
- [x] `src/app/(authenticated)/college/projects/workspaces/new/page.tsx`
- [x] `src/app/(authenticated)/college/verification/page.tsx`
- [x] `src/app/(authenticated)/college/videos/page.tsx`

### College academic, directory, elective, group and student components (20)

- [x] `src/components/college/college-admin-profile-editor.tsx`
- [x] `src/components/college/college-department-insights.tsx`
- [x] `src/components/college/college-faculty-assignment-actions.tsx`
- [x] `src/components/college/college-faculty-csv-import.tsx`
- [x] `src/components/college/college-legacy-group-tabs.tsx`
- [x] `src/components/college/college-role-directory-workspace.tsx`
- [x] `src/components/college/college-student-register-form.tsx`
- [x] `src/components/academics/college-structure-directory.tsx`
- [x] `src/components/academics/college-cohort-management.tsx`
- [x] `src/components/academics/college-hall-booking-action.tsx`
- [x] `src/components/electives/college-elective-offering-manager.tsx`
- [x] `src/components/groups/college-group-detail-writes.tsx`
- [x] `src/components/groups/college-group-actions.tsx`
- [x] `src/components/groups/college-group-import-preview.tsx`
- [x] `src/components/academics/college-academic-directory.tsx`
- [x] `src/components/academics/college-semester-management.tsx`
- [x] `src/components/academics/college-term-mapping-manager.tsx`
- [x] `src/components/academics/college-recurring-preview.tsx`
- [x] `src/components/admin/college-setup-checklist.tsx`
- [x] `src/components/admin/college-at-glance-panel.tsx`

### College shared admin, branding, setup and department components (11)

- [x] `src/components/admin/college-branding-form.tsx`
- [x] `src/components/admin/college-signin-method-form.tsx`
- [x] `src/components/admin/college-branding-preview.tsx`
- [x] `src/components/admin/college-bulk-import.tsx`
- [x] `src/components/admin/college-create-form.tsx`
- [x] `src/components/admin/college-feature-rule-editor.tsx`
- [x] `src/components/admin/college-logo-uploader.tsx`
- [x] `src/components/admin/college-dashboard-cards.tsx`
- [x] `src/components/admin/college-dashboard-section-failure.tsx`
- [x] `src/components/admin/department-directory.tsx`
- [x] `src/components/admin/lecture-hall-manager.tsx`

### Source-only verification and remaining work

- Inspected a representative ten-file sample for brace-count parity, split `sm: border` / ` - border` utilities, primary buttons incorrectly using `text-foreground`, duplicated `data-slot` input attributes, and line breaks before `as` casts; no flagged patterns were found in that sample.
- **No code execution**, build, TypeScript parser/typecheck, lint, test, CI, dev server, or browser screenshot comparison was performed. Pixel parity and compile correctness remain unverified and require final integration review.
- College Admin is still **partial** relative to the larger route/component inventory; loading/error boundaries, cross-portal pages, and remaining bespoke component skins need a subsequent source/visual pass. Shared global CSS, UI kit, shell, topbar and sidebar remain with their assigned lanes.

## Chat-14 shared-list kit and Mentor parity continuation — 2026-10-19

Scope: shared tabs, table/data-table, chips, list toolbar, pagination and badges within `src/components/ui`; then a second-pass old-LMS styling sweep of mentor and Projects mentor UI. Source of truth: `docs/design/old-lms-pages.md` §§3–6, `old-lms-shell-spec.md` and legacy SCSS. Existing props, routes, form submission, permissions, data and copy retained.

### Shared UI completion

- `tabs.tsx`: legacy teal underline, counted accessible labels, focus-visible treatment and tokenized gaps.
- `table.tsx` and `data-table.tsx`: compact hairlines, row hover/focus, responsive horizontal scroll cue and empty-table context.
- `needs-doing-chips.tsx`: small semantic quick filters and static metrics; safe href handling, explicit count text and legacy chip proportions.
- `list-toolbar.tsx` and `filter-bar.tsx`: compact responsive search, filters, views, columns, export, active-count and bulk-action surfaces; action callbacks remain page-owned.
- `pagination.tsx`: safe previous/next and numbered internal links, page boundaries/ellipses, mobile current-page announcement.
- `badge.tsx`, `status-badge.tsx`: semantic small pills and preserved native status attributes.
- Updated components were integrated on the lane branch against the latest available `main` instead of changing global tokens or other UI-kit owners' files.

### Additional Projects mentor component pass (10)

- `mentor-project-about-editor.tsx`: remove redundant nested white-card editor, use shared control radius and CTA contrast.
- `mentor-meeting-history.tsx`, `project-task-comments.tsx`: replace individually bordered history/comment cards with compact hairline rows.
- `mentor-task-details-edit.tsx`, `mentor-task-create.tsx`, `mentor-sprint-details-edit.tsx`, `mentor-sprint-write.tsx`: normalize select/input skin, labels and desktop control scale.
- `mentor-meeting-notes-editor.tsx`, `mentor-meeting-reschedule.tsx`: canonical typography and border with mobile-friendly date controls.
- `mentor-release-editor.tsx`: legacy inputs, textarea and primary button.

### Mentor route second pass (20)

- Project detail: `board-review`, `risk-readiness`, `resources-directory`, `team-meetings`, `review-overview`, `activity-history`, `team-history`, `timeline`, project overview and project listing.
- Portal: `sprint-progress`, `team-coverage`, `reviews`, `activity`, `reports`, `task-reviews`, `task-review-history`, `review-history`, `notifications`, `calendar`.
- Changed only legacy control classes and lightweight list chrome, retaining existing 44px mobile touch targets with 36px desktop styling. Preserved metrics, cards representing separate objects, error states and all page-owned business logic.

### Verification boundary

Re-read changed JSX elements and performed source-only checks on all 35 touched UI/mentor files for tag names, closing-tag presence, truncated `</Select>`, and accidental malformed class fragments. This is **not** a TypeScript parser, typecheck, build or pixel-comparison verification. No app, tests, CI, lint, typecheck or browser were executed as requested. Existing checkmarks in this file continue to mean source sweep only, not runtime acceptance.

## Chat-14 follow-up: shared-list components and remaining mentor controls (2026-10-19)

Baseline: checked `origin/main` before changes; branch was 74 commits ahead and 0 behind. All edits were committed directly to `chatgpt/chat-14-b` in roughly five-commit batches, tagged `[chat-14]`.

- **Shared kit (5):** `list-toolbar` no longer overrides the appearance of page-owned primary actions; `badge` protects its own slot/tone; `status-badge` uses the common compact font/dimensions; `needs-doing-chips` uses supported semantic theme borders; `filter-bar` does not expose an empty mobile filter launcher.
- **Mentor fallback/actions (10):** fixed duplicate heading weight and retry focus in Projects error; flattened the delivery lock editor, task-allocation filters and closeout confirmations; normalized sprint/task destructive controls, the task status form, meeting calendar rows, unavailable and project-error states.
- **Mentor project forms (10):** task-create, sprint-create, task-details, task-allocation and product-backlog select menus now use the shared `Select`. About, delivery-lock, meeting-notes, release and backlog editors now use shared `Input`/`Textarea` where previously bare native controls carried duplicate styles.
- **Mentor list and detail pages (16):** activity, notifications, reports, reviews, sprint progress, review history, task reviews, task-review history, team coverage, board review, risk readiness, resources directory, team meetings, review overview, activity history and team history were normalized to shared `Select`/`Input` on forms. Route params, GET form fields and options remain unchanged.

**Verification boundary:** Source-only per-file count checks confirmed every newly replaced `<Select>` has a matching complete `</Select>`; checked malformed closing-tag patterns, preserved JSX self-closing `Input`/`Textarea` and all existing handlers. No app run, build, lint, typecheck, tests, CI or browser/pixel comparison. This is still a visual-source sweep rather than runtime certification.

## Shared list kit + mentor error/loading final pass — 2026-10-19

Started with an up-to-date `chatgpt/chat-14-b` tracking `origin/main`. All edits were branch-only `[chat-14]` commits, published in batches of approximately five through the GitHub connector.

### Shared UI kit
- `src/components/ui/pagination.tsx`: selected page rendered as a non-navigating `aria-current="page"` indicator; boundary disabled links have meaningful accessible labels; safe destination validation retained.
- `tabs.tsx`: skip redundant `onValueChange` callbacks for the selected tab while preserving keyboard focus behavior.
- `table.tsx`, `data-table.tsx`: compact hairline, accessible overflow/focus treatments consistent with one-page canvas; no cell formatter or row action changes.
- `needs-doing-chips.tsx`: disabled chips do not suggest hover interaction.
- `badge.tsx`, `status-badge.tsx`: align compact pill spacing and typography.
- `list-toolbar.tsx`: provide an accessible live view-count indicator without affecting page-owned search or bulk actions.
- `filter-bar.tsx`: clarify optional drawer presence and accessible drawer name.

### Remaining mentor route fallback sweep
- Updated error routes across mentor activity, calendar, notifications, reports, reviews, sprint progress, task-review history, task reviews, team coverage, and Projects subroutes (board review, closeout, resources, risk/readiness, team history, team meetings, timeline, activity history, delivery review, review completeness, review overview, meeting notes and task feedback).
- Replaced bespoke raw retry controls with shared `Button` in these error states. Removed duplicate heading font declarations and nested error-card chrome. Error copy, `reset` actions, and data-safety statements were unchanged.
- Updated loading routes to use shared neutral background and control-radius placeholders with smaller heading skeletons, consistent hairline separators, and explicit busy state where appropriate; retained existing loading labels and route behavior.
- Polished mentor meeting notes page navigation/separators and final delivery review sections; attachment list now uses compact hairline rows instead of separate boxes.

### Source verification limits
Checked the JSX opening/closing tag names, completed `</Button>` / `</Select>` and common DOM tag pairs across all changed files in this continuation, including intentionally self-closing controls. These are **source-only** checks, not TypeScript parsing or runtime validation. No application code, typecheck, tests, lint, build, CI, browser or visual snapshot comparison was run.

## Old-LMS list anatomy: cross-portal source sweep — 2026-10-19

Owner request: use `docs/design/old-lms-pages.md` §§3–6 as the source for tabs, list tables, chips, toolbar, pagination and semantic badge styling. Started by checking that `chatgpt/chat-14-b` tracked `origin/main`, then committed each target with the `[chat-14]` prefix; no pushes to `main`.

### Shared components
- `tabs.tsx`: horizontal orientation and opt-in `controlledOnly` tab strip for client-filter views rendered in a separate page-owned content section. Existing navigation-mode and inline-panel usage retain defaults.
- `table.tsx`: content-width scrolling and hairline legacy table treatment.
- `data-table.tsx`: identifies row surfaces consistently for shared responsive skinning.
- `badge.tsx` and `status-badge.tsx`: semantic legacy-pill variant, preserving tone/HTML attributes.
- `needs-doing-chips.tsx`, `list-toolbar.tsx`, `filter-bar.tsx`, `pagination.tsx`: selected/active data attributes for styling, shared filters/counts, and static accessible current-page presentation.

### Raw table and tab migrations
- `src/app/(authenticated)/tpo/students/page.tsx` and `students/requests/page.tsx`: replaced ordinary native HTML tables with `Table`, preserving rows, headings, responsive visibility and link/actions.
- `src/components/attendance/admin-attendance-workspace.tsx` and `faculty-attendance-workspace.tsx`: replaced ordinary attendance month table shell and its redundant scroll wrapper with shared `Table`; sticky day cells and attendance interactions retained.
- Replaced URL-backed pill navigation with shared `Tabs`: mentor delivery history and team history; learner offers, placement preparation and assessment results; TPO audit categories.
- Replaced client state tablists with shared `Tabs controlledOnly`: TPO eligibility import preview and recruiter Engage views. Existing state changes and URL transitions retained.

### Badges and quick-count pills
Replaced simple hand-rolled static `rounded-full` span pills with the shared `Badge` across admin Projects templates, HR Home/company, TPO outcome/companies/drive-day/team/notices/home, learner profile/placement rules/announcements, course listings/overviews/workspaces and assessment overviews, mentor lane board and learner board task counts. Dynamic notification dots, progress bars and genuinely interactive buttons were not converted to static badges.

### Shared pagination sweep
Replaced the independent Previous/Next markup with `Pagination` in mentor activity, review queue, reports, task reviews/history, delivery history, sprint progress, team coverage, and the nine Projects mentor detail views (board review, risk/readiness, resource directory, review overview/completeness, team history/meetings, activity history and release timeline). Also migrated faculty live classes, HR drives/company team roster, TPO audit actors/follow-ups. Existing server-side page URL builders and current filter values remain unchanged.

### Scope qualifications and static verification
Source searches covered the repository's `<table`, `role="tablist"`, `rounded-full` and pagination patterns, with actual DOM/tag matches inspected before edit. Intentional non-static exceptions: the interactive recruiter import preview uses local-state Previous/Next, the TPO spreadsheet-like grid is a specialized editable grid, and progress bars/avatar indicators/notification dots are not status pills. Other complex controls across the app may require separate DOM and runtime parity checks; this source pass does not certify that every portal has pixel-equivalent output.

The changed TSX files were checked for JSX closing-tag presence and pairing of shared `Badge`, `Table`, `Select`, `Tabs` and `Pagination` markup by source inspection. **No app runtime, tests, CI, build, lint, typecheck or browser screenshot comparison was performed**, per owner directive.
