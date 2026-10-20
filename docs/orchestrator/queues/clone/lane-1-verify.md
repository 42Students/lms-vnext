# UI/UX polish VERIFICATION queue: lane chat-1 (surfaces polished by OTHER lanes)

51 surfaces. Each was already polished by another lane. Your job is to VERIFY and improve, strictly one surface at a time.

1. Regressions first (a polish pass edits many files without running code): matching tags, every import present and used, no duplicate attributes, no undeclared packages, props still match their component types, no removed export that another file imports. Fix anything broken.
2. Behaviour kept: ids, data-testid, aria labels, routes, permissions, form fields, wording (docs/audit/legacy-copy-A.md and B.md) and legacy tokens (docs/design) must be unchanged; if the polish dropped or reworded something, restore it.
3. Then judge the surface fresh as a senior product designer: is anything still cluttered, misaligned, duplicated or noisy? One obvious primary action? Aligned left edges and gaps on the legacy scale? Calm density? Real layouts at 375 and 768? Empty, loading, error states with a clear next step? Fix what you find.
4. Also check the route files in the same folder (loading, error, not-found, template) and the nearest parent layout.

Proof: ONE entry per surface in docs/audit/ux/verify-lane-1.md: surface | regressions found and fixed | extra clutter/alignment fixes | files changed (write 'verified, no change' only after a real read of every component). Tick [x] here and push to chatgpt/chat-1-b with [chat-1] after every 2 surfaces.

- [x] `src/app/(authenticated)/learn/allAssignments/[assignmentId]/page.tsx`
- [x] `src/app/(authenticated)/learn/allAssignments/page.tsx`
- [x] `src/app/(authenticated)/learn/allQuizzes/[quizId]/page.tsx`
- [x] `src/app/(authenticated)/learn/allQuizzes/page.tsx`
- [x] `src/app/(authenticated)/learn/assignments/page.tsx`
- [x] `src/app/(authenticated)/learn/attendance/calendar/page.tsx`
- [ ] `src/app/(authenticated)/learn/attendance/page.tsx`
- [ ] `src/app/(authenticated)/learn/calendar/page.tsx`
- [ ] `src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx`
- [ ] `src/app/(authenticated)/learn/courses/[deliveryId]/attendance-summary/page.tsx`
- [ ] `src/app/(authenticated)/learn/courses/[deliveryId]/page.tsx`
- [ ] `src/app/(authenticated)/learn/courses/[deliveryId]/progress/page.tsx`
- [ ] `src/app/(authenticated)/learn/courses/page.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/announcements/page.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/company/page.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/page.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/page.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/applications/page.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/assessments/page.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/assessments/results/page.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/calendar/page.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/interviews/page.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/jobs/[jobId]/page.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/jobs/page.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/notification-preferences/page.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/offers/page.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/page.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/placement/page.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/preparation/page.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/rules/page.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/schedule/page.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/support/page.tsx`
- [ ] `src/app/(authenticated)/learn/notifications/history/page.tsx`
- [ ] `src/app/(authenticated)/learn/notifications/page.tsx`
- [ ] `src/app/(authenticated)/learn/page.tsx`
- [ ] `src/app/(authenticated)/learn/placements/page.tsx`
- [ ] `src/app/(authenticated)/learn/profile/academic-record/page.tsx`
- [ ] `src/app/(authenticated)/learn/profile/completeness/page.tsx`
- [ ] `src/app/(authenticated)/learn/profile/data-access/page.tsx`
- [ ] `src/app/(authenticated)/learn/profile/page.tsx`
- [ ] `src/app/(authenticated)/learn/profile/verification/page.tsx`
- [ ] `src/app/(authenticated)/learn/projects/[projectId]/page.tsx`
- [ ] `src/app/(authenticated)/learn/projects/page.tsx`
- [ ] `src/app/(authenticated)/learn/quizzes/page.tsx`
- [ ] `src/components/courses/admin-course-create-panel.tsx`
- [ ] `src/components/courses/college-archived-lesson-restore.tsx`
- [ ] `src/components/courses/college-lesson-drag-order.tsx`
- [ ] `src/components/courses/faculty-item-actions.tsx`
- [ ] `src/components/courses/faculty-lesson-video-manager.tsx`
- [ ] `src/components/courses/faculty-report-download.tsx`
- [ ] `src/components/courses/learner-course-workspace.tsx`
