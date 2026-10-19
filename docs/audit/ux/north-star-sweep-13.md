# Chat-13 — North Star top bar and Super Admin skin sweep

Reference: `docs/orchestrator/queues/master-queue.md` NORTH STAR and `docs/design/old-lms-shell.css`, `old-lms-shell-spec.md`, `old-lms-pages.md`, `vnext-vs-old-lms-gap.md`, `legacy-styles/components___notification-drawer.scss`.

Scope is the **shell and global visual skin only**. Keep all pages' own sections, table columns, business rules, forms and wording.

## Top bar — swept
- [x] `src/components/shell/topbar/topbar.module.css`: 68px shell, command search, white/teal action, 36px icons, account menu, focused controls, adaptive notification dropdowns with legacy overlay shadows/radii.
- [x] `src/components/shell/topbar/command-search.tsx`: make ArrowDown reach all actual search options, not just TPO results.
- [x] `src/components/shell/topbar/account-menu.tsx`: apply shared menu typography, preserve account actions and authorized membership/scope switchers.
- [x] `src/components/shell/topbar/tpo-quick-create.tsx`: close on outside pointer/Escape, preserve authorized create links.
- [x] `src/components/shell/topbar/legacy-topbar.tsx`: reviewed; existing header-slot in `app-shell.tsx` already uses this component, so no second header or duplicate menu was added.
- [x] `src/components/shell/topbar/notification-actions.tsx` and `tpo-notification-cluster.tsx`: reviewed; existing role-specific notification drawers and unread counts retained rather than replaced with unscoped data.

## Super Admin first-third routes — changed
- [x] `academics`, `announcements`, `assignments`, `audit`
- [x] `batch-promotion`, `batches`, `batches/[batchId]/students`, `classes`
- [x] `colleges`, `colleges/[collegeId]`, `colleges/[collegeId]/admins`, `colleges/[collegeId]/admins/[userId]/history`
- [x] `colleges/[collegeId]/branding`, `colleges/[collegeId]/readiness`, `colleges/[collegeId]/verification`
- [x] `companies`, `course-progress`, `departments`, `electives`, `faculty`, `faculty-assignment`
- [ ] Remaining nested first-third routes and source components require additional surface review; a checked route means *this visual source pass*, not functional QA.

## Super Admin placements / projects — changed
- [x] `placements`, `placements/analytics`, `placements/drives`, `placements/retention`, `placements/student-lookup`
- [x] `placements/jobs/[jobId]/applications`, `placements/jobs/[jobId]/schedule`, `placements/jobs/[jobId]/settings`
- [x] `projects`, `projects/submissions`
- [ ] Remaining detail routes and shared placement/project widgets need more source scrutiny where they own page-level hardcoded styling.

Changes are limited to semantic tokens, 9px control radius and 12px canvas radius, controls, subtle panels, and flatter page flow. Fixed malformed doubled `rounded-[...]-[...]` classes in college directory and course progress.

**Verification policy:** dev-only; no TypeScript builds, tests, app execution or CI were run. Review and integration still required after mainline merges.
