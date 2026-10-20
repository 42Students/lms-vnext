# UI/UX polish VERIFICATION queue: lane chat-3 (surfaces polished by OTHER lanes)

42 surfaces. Each was already polished by another lane. Your job is to VERIFY and improve, strictly one surface at a time.

1. Regressions first (a polish pass edits many files without running code): matching tags, every import present and used, no duplicate attributes, no undeclared packages, props still match their component types, no removed export that another file imports. Fix anything broken.
2. Behaviour kept: ids, data-testid, aria labels, routes, permissions, form fields, wording (docs/audit/legacy-copy-A.md and B.md) and legacy tokens (docs/design) must be unchanged; if the polish dropped or reworded something, restore it.
3. Then judge the surface fresh as a senior product designer: is anything still cluttered, misaligned, duplicated or noisy? One obvious primary action? Aligned left edges and gaps on the legacy scale? Calm density? Real layouts at 375 and 768? Empty, loading, error states with a clear next step? Fix what you find.
4. Also check the route files in the same folder (loading, error, not-found, template) and the nearest parent layout.

Proof: ONE entry per surface in docs/audit/ux/verify-lane-3.md: surface | regressions found and fixed | extra clutter/alignment fixes | files changed (write 'verified, no change' only after a real read of every component). Tick [x] here and push to chatgpt/chat-3-b with [chat-3] after every 2 surfaces.

- [ ] `src/app/(authenticated)/mentor/activity/page.tsx`
- [ ] `src/app/(authenticated)/mentor/allQuizzes/page.tsx`
- [ ] `src/app/(authenticated)/mentor/calendar/page.tsx`
- [ ] `src/app/(authenticated)/mentor/contacts/[[...contactsTab]]/page.tsx`
- [ ] `src/app/(authenticated)/mentor/courses/[courseId]/[[...courseTab]]/page.tsx`
- [ ] `src/app/(authenticated)/mentor/courses/page.tsx`
- [ ] `src/app/(authenticated)/mentor/fileExplorer/page.tsx`
- [ ] `src/app/(authenticated)/mentor/notifications/page.tsx`
- [ ] `src/app/(authenticated)/mentor/page.tsx`
- [ ] `src/app/(authenticated)/mentor/profile/page.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/board-review/page.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/closeout/page.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/deliveries/[submissionId]/review/page.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/meetings/[meetingId]/notes/page.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/page.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/resources-directory/page.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/review-completeness/page.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/review-overview/page.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/risk-readiness/page.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/tasks/[taskId]/feedback/page.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/team-history/page.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/team-meetings/page.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/timeline/page.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/page.tsx`
- [ ] `src/app/(authenticated)/mentor/reports/page.tsx`
- [ ] `src/app/(authenticated)/mentor/review-history/page.tsx`
- [ ] `src/app/(authenticated)/mentor/reviews/page.tsx`
- [ ] `src/app/(authenticated)/mentor/sprint-progress/page.tsx`
- [ ] `src/app/(authenticated)/mentor/task-review-history/page.tsx`
- [ ] `src/app/(authenticated)/mentor/task-reviews/page.tsx`
- [ ] `src/app/(authenticated)/mentor/team-coverage/page.tsx`
- [ ] `src/components/projects/learner-task-progress-control.tsx`
- [ ] `src/components/projects/mentor-lane-board.tsx`
- [ ] `src/components/projects/mentor-product-backlog.tsx`
- [ ] `src/components/projects/mentor-project-closeout-control.tsx`
- [ ] `src/components/projects/mentor-release-editor.tsx`
- [ ] `src/components/projects/mentor-task-delete-control.tsx`
- [ ] `src/components/projects/project-readiness-override-form.tsx`
- [ ] `src/components/projects/project-resource-files-panel.tsx`
- [ ] `src/components/projects/project-workspace.tsx`
- [ ] `src/components/projects/super-admin-template-college-bulk.tsx`
