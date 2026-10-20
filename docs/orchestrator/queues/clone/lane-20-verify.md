# UI/UX polish VERIFICATION queue: lane chat-20 (surfaces polished by OTHER lanes)

37 surfaces. Each was already polished by another lane. Your job is to VERIFY and improve, strictly one surface at a time.

1. Regressions first (a polish pass edits many files without running code): matching tags, every import present and used, no duplicate attributes, no undeclared packages, props still match their component types, no removed export that another file imports. Fix anything broken.
2. Behaviour kept: ids, data-testid, aria labels, routes, permissions, form fields, wording (docs/audit/legacy-copy-A.md and B.md) and legacy tokens (docs/design) must be unchanged; if the polish dropped or reworded something, restore it.
3. Then judge the surface fresh as a senior product designer: is anything still cluttered, misaligned, duplicated or noisy? One obvious primary action? Aligned left edges and gaps on the legacy scale? Calm density? Real layouts at 375 and 768? Empty, loading, error states with a clear next step? Fix what you find.
4. Also check the route files in the same folder (loading, error, not-found, template) and the nearest parent layout.

Proof: ONE entry per surface in docs/audit/ux/verify-lane-20.md: surface | regressions found and fixed | extra clutter/alignment fixes | files changed (write 'verified, no change' only after a real read of every component). Tick [x] here and push to chatgpt/chat-20-b with [chat-20] after every 2 surfaces.

- [x] `src/app/(authenticated)/college/profile/page.tsx`
- [x] `src/app/(authenticated)/college/programs/page.tsx`
- [x] `src/app/(authenticated)/college/projects/[projectId]/[section]/page.tsx`
- [x] `src/app/(authenticated)/college/projects/[projectId]/page.tsx`
- [x] `src/app/(authenticated)/college/projects/[projectId]/readiness/page.tsx`
- [x] `src/app/(authenticated)/college/projects/at-risk/page.tsx`
- [x] `src/app/(authenticated)/college/projects/audit/page.tsx`
- [x] `src/app/(authenticated)/college/projects/create/page.tsx`
- [x] `src/app/(authenticated)/college/projects/page.tsx`
- [x] `src/app/(authenticated)/college/projects/readiness/page.tsx`
- [x] `src/app/(authenticated)/college/projects/reassign-mentor/page.tsx`
- [x] `src/app/(authenticated)/college/projects/submissions/page.tsx`
- [x] `src/app/(authenticated)/college/projects/templates/[templateId]/page.tsx`
- [x] `src/app/(authenticated)/college/projects/templates/page.tsx`
- [x] `src/app/(authenticated)/college/projects/workspaces/[workspaceId]/[section]/page.tsx`
- [x] `src/app/(authenticated)/college/projects/workspaces/[workspaceId]/page.tsx`
- [x] `src/app/(authenticated)/college/projects/workspaces/new/page.tsx`
- [x] `src/app/(authenticated)/college/projects/workspaces/page.tsx`
- [x] `src/app/(authenticated)/college/quizzes/page.tsx`
- [x] `src/app/(authenticated)/college/resources/page.tsx`
- [ ] `src/app/(authenticated)/college/semester-courses/page.tsx`
- [ ] `src/app/(authenticated)/college/semesters/page.tsx`
- [ ] `src/app/(authenticated)/college/students/[membershipId]/page.tsx`
- [ ] `src/app/(authenticated)/college/students/import/page.tsx`
- [ ] `src/app/(authenticated)/college/students/page.tsx`
- [ ] `src/app/(authenticated)/college/students/register/page.tsx`
- [ ] `src/app/(authenticated)/college/verification/page.tsx`
- [ ] `src/app/(authenticated)/college/videos/page.tsx`
- [ ] `src/components/college/college-role-directory-workspace.tsx`
- [ ] `src/components/colleges/college-contact-profile-form.tsx`
- [ ] `src/components/academics/learner-class-schedule.tsx`
- [ ] `src/components/courses/college-lesson-reorder-actions.tsx`
- [ ] `src/components/courses/learner-quiz-attempt.tsx`
- [ ] `src/components/tracker/independent-finding-actions.tsx`
- [ ] `src/components/courses/faculty-assignment-material-links.tsx`
- [ ] `src/components/ui/multi-select.tsx`
- [ ] `src/components/projects/mentor-task-status-transition.tsx`
