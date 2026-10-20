# Clone queue: lane chat-11

Generated from the code by the orchestrator's deviation audit. Work each section top to bottom, in batches of about 30 items. When an item is finished and proven, change its `[ ]` to `[x]` in this file in the same push. Never delete or reorder lines; only tick.

## Section 1: files that still deviate from the shared look (19)
Fix every listed deviation using the shared components in src/components/ui and the values in docs/design/ (shell spec, legacy-styles, ui-clone-checklist).

- [x] `src/app/page.tsx` (score 18: own <h1> (use PageHeader) x2, inline style x3)
- [x] `src/components/projects/project-create-control.tsx` (score 7: arbitrary px size x7)
- [x] `src/components/projects/mentor-task-create.tsx` (score 6: arbitrary px size x6)
- [x] `src/components/projects/project-admin-collection-controls.tsx` (score 5: arbitrary px size x5)
- [x] `src/app/(authenticated)/learn/notifications/history/page.tsx` (score 4: arbitrary px size x4)
- [x] `src/app/(authenticated)/admin/tenants/page.tsx` (score 3: arbitrary px size x3)
- [x] `src/components/admin/college-branding-form.tsx` (score 3: arbitrary px size x3)
- [x] `src/components/admin/descendant-feature-rule-editor.tsx` (score 3: arbitrary px size x3)
- [x] `src/components/auth/membership-chooser.tsx` (score 3: arbitrary px size x3)
- [x] `src/components/activity/notification-list.tsx` (score 2: rounded-full pill x1)
- [x] `src/components/activity/notification-toolbar.tsx` (score 2: arbitrary px size x2)
- [x] `src/components/admin/tenant-settings-other-keys.tsx` (score 2: arbitrary px size x2)
- [x] `src/components/placements/learner-placement-notification-settings.tsx` (score 2: arbitrary px size x2)
- [x] `src/components/projects/mentor-meeting-reschedule.tsx` (score 2: arbitrary px size x2)
- [x] `src/components/activity/learner-notifications-inbox.tsx` (score 1: arbitrary px size x1)
- [x] `src/components/projects/mentor-sprint-write.tsx` (score 1: arbitrary px size x1)
- [x] `src/components/projects/mentor-task-details-edit.tsx` (score 1: arbitrary px size x1)
- [x] `src/components/projects/project-list.tsx` (score 1: arbitrary px size x1)
- [x] `src/components/tpo/tpo-my-notification-preferences-editor.tsx` (score 1: arbitrary px size x1)

## Section 2: page routes, full fidelity pass (28)
For each page: page head via PageHeader (title, subtitle, actions exactly as the old LMS), canvas card (white, radius 12, border #e5e9f0, padding 24), tabs, filter row, tables/grids/cards, chips and badges, banners and inline notices, every modal and drawer the page opens, buttons and forms, empty/loading/error states, toasts, spacing and typography values, and responsive at 1280, 768 and 375 widths. Read the page and the components it renders, fix every deviation you find, not only the listed ones.

- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx`
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/readiness/page.tsx`
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx`
- [x] `src/app/(authenticated)/admin/tenants/create/page.tsx`
- [x] `src/app/(authenticated)/admin/tenants/page.tsx`
- [x] `src/app/(authenticated)/learn/notifications/history/page.tsx`
- [x] `src/app/(authenticated)/learn/profile/data-access/page.tsx`
- [x] `src/app/(authenticated)/learn/projects/[projectId]/page.tsx`
- [x] `src/app/(authenticated)/learn/projects/page.tsx`
- [x] `src/app/(authenticated)/mentor/notifications/page.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/deliveries/[submissionId]/review/page.tsx`
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/page.tsx`
- [x] `src/app/(authenticated)/notifications/page.tsx`
- [x] `src/app/(authenticated)/tpo/profile/page.tsx`
- [x] `src/app/(authenticated)/tpo/settings/after-college/page.tsx`
- [x] `src/app/(authenticated)/tpo/settings/branding/page.tsx`
- [x] `src/app/(authenticated)/tpo/settings/notices/page.tsx`
- [x] `src/app/(authenticated)/tpo/settings/notifications/page.tsx`
- [x] `src/app/(authenticated)/tpo/settings/prep-readiness/page.tsx`
- [x] `src/app/(authenticated)/tpo/settings/public-link/page.tsx`
- [ ] `src/app/(authenticated)/tpo/settings/recruiters/page.tsx`
- [ ] `src/app/(authenticated)/tpo/settings/rules/page.tsx`
- [ ] `src/app/(authenticated)/tpo/settings/season/page.tsx`
- [ ] `src/app/(authenticated)/tpo/settings/see/page.tsx`
- [ ] `src/app/(authenticated)/tpo/settings/team/page.tsx`
- [ ] `src/app/(authenticated)/tpo/settings/templates/page.tsx`
- [ ] `src/app/(authenticated)/tpo/settings/trusted/page.tsx`
- [ ] `src/app/page.tsx`
