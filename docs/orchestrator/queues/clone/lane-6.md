# Clone queue: lane chat-6

Generated from the code by the orchestrator's deviation audit. Work each section top to bottom, in batches of about 30 items. When an item is finished and proven, change its `[ ]` to `[x]` in this file in the same push. Never delete or reorder lines; only tick.

## Section 1: files that still deviate from the shared look (23)
Fix every listed deviation using the shared components in src/components/ui and the values in docs/design/ (shell spec, legacy-styles, ui-clone-checklist).

- [x] `src/components/admin/admin-scoped-read-page.tsx` (score 11: arbitrary px size x11)
- [x] `src/components/admin/super-admin-hr-account-dialog.tsx` (score 11: arbitrary px size x11)
- [x] `src/components/placements/placement-candidate-evidence-editor.tsx` (score 9: raw text <input> x3)
- [x] `src/components/admin/person-onboard-dialog.tsx` (score 6: arbitrary px size x6)
- [x] `src/app/(authenticated)/admin/lecture-halls/page.tsx` (score 5: arbitrary px size x5)
- [x] `src/components/admin/super-admin-company-edit.tsx` (score 5: arbitrary px size x5)
- [x] `src/components/admin/super-admin-faculty-assignment-create.tsx` (score 5: arbitrary px size x5)
- [x] `src/app/(authenticated)/admin/batches/page.tsx` (score 4: arbitrary px size x4)
- [x] `src/app/(authenticated)/admin/inbound-mail/page.tsx` (score 3: arbitrary px size x3)
- [x] `src/app/(authenticated)/admin/people/unassigned/page.tsx` (score 3: arbitrary px size x3)
- [x] `src/components/admin/super-admin-hr-accounts.tsx` (score 3: arbitrary px size x3)
- [x] `src/components/admin/admin-program-directory.tsx` (score 2: arbitrary px size x2)
- [x] `src/components/admin/department-directory.tsx` (score 2: arbitrary px size x2)
- [x] `src/components/admin/super-admin-batch-roster-manager.tsx` (score 2: arbitrary px size x2)
- [x] `src/components/admin/super-admin-hr-detail-drawer.tsx` (score 2: arbitrary px size x2)
- [ ] `src/components/admin/super-admin-learning-filter-fields.tsx` (score 2: arbitrary px size x2)
- [ ] `src/components/admin/super-admin-student-bulk-access.tsx` (score 2: arbitrary px size x2)
- [ ] `src/components/admin/lecture-hall-manager.tsx` (score 1: arbitrary px size x1)
- [ ] `src/components/admin/scoped-membership-lifecycle-actions.tsx` (score 1: arbitrary px size x1)
- [ ] `src/components/admin/student-rule-editor.tsx` (score 1: arbitrary px size x1)
- [ ] `src/components/admin/super-admin-faculty-schedule-reassign-action.tsx` (score 1: arbitrary px size x1)
- [ ] `src/components/admin/super-admin-platform-block-action.tsx` (score 1: arbitrary px size x1)
- [ ] `src/components/placements/report-interactive-table.tsx` (score 1: arbitrary px size x1)

## Section 2: page routes, full fidelity pass (25)
For each page: page head via PageHeader (title, subtitle, actions exactly as the old LMS), canvas card (white, radius 12, border #e5e9f0, padding 24), tabs, filter row, tables/grids/cards, chips and badges, banners and inline notices, every modal and drawer the page opens, buttons and forms, empty/loading/error states, toasts, spacing and typography values, and responsive at 1280, 768 and 375 widths. Read the page and the components it renders, fix every deviation you find, not only the listed ones.

- [ ] `src/app/(authenticated)/account/security/page.tsx`
- [ ] `src/app/(authenticated)/admin/batches/page.tsx`
- [ ] `src/app/(authenticated)/admin/faculty-assignment/page.tsx`
- [ ] `src/app/(authenticated)/admin/faculty/page.tsx`
- [ ] `src/app/(authenticated)/admin/hr/page.tsx`
- [ ] `src/app/(authenticated)/admin/inbound-mail/page.tsx`
- [ ] `src/app/(authenticated)/admin/lecture-halls/[hallId]/page.tsx`
- [ ] `src/app/(authenticated)/admin/lecture-halls/page.tsx`
- [ ] `src/app/(authenticated)/admin/people/directory/[membershipId]/audit/page.tsx`
- [ ] `src/app/(authenticated)/admin/people/unassigned/page.tsx`
- [ ] `src/app/(authenticated)/admin/placements/analytics/page.tsx`
- [ ] `src/app/(authenticated)/admin/placements/applications/[applicationId]/page.tsx`
- [ ] `src/app/(authenticated)/admin/placements/applications/page.tsx`
- [ ] `src/app/(authenticated)/admin/placements/drives/page.tsx`
- [ ] `src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx`
- [ ] `src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx`
- [ ] `src/app/(authenticated)/admin/placements/page.tsx`
- [ ] `src/app/(authenticated)/admin/placements/retention/page.tsx`
- [ ] `src/app/(authenticated)/admin/placements/shortlisted/page.tsx`
- [ ] `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx`
- [ ] `src/app/auth/handoff/page.tsx`
- [ ] `src/app/enterprises/page.tsx`
- [ ] `src/app/login/page.tsx`
- [ ] `src/app/privacy-policy/page.tsx`
- [ ] `src/app/universities/page.tsx`
