# Chat-13 — North Star top bar and Super Admin skin sweep

Reference: `docs/orchestrator/queues/master-queue.md` NORTH STAR and `docs/design/old-lms-shell.css`, `old-lms-shell-spec.md`, `old-lms-pages.md`, `vnext-vs-old-lms-gap.md`, `legacy-styles/components___notification-drawer.scss`.

Scope is the **shell and global visual skin only**. Keep all pages' own sections, table columns, business rules, forms and wording.

## Top bar — swept
- [x] `src/components/shell/topbar/topbar.module.css`: 68px shell, command search, white/teal action, 36px icons, account menu, focused controls, adaptive notification dropdowns with legacy overlay shadows/radii. Shared global skin tokens govern button/border/radius/shadows, and measured header-only colors are centralized as local CSS custom properties.
- [x] `src/components/shell/topbar/command-search.tsx`: make ArrowDown reach all actual search options, not just TPO results; use semantic text colors.
- [x] `src/components/shell/topbar/tpo-find-suggestions.tsx`: semantic suggestion palette.
- [x] `src/components/shell/topbar/tpo-notification-cluster.tsx`: accessible action grouping.
- [x] `src/components/shell/topbar/account-menu.tsx`: apply shared menu typography, preserve account actions and authorized membership/scope switchers.
- [x] `src/components/shell/topbar/tpo-quick-create.tsx`: close on outside pointer/Escape, preserve authorized create links.
- [x] `src/components/shell/topbar/legacy-topbar.tsx`: reviewed; existing header-slot in `app-shell.tsx` already uses this component, so no second header or duplicate menu was added.
- [x] `src/components/shell/topbar/notification-actions.tsx` and `tpo-notification-cluster.tsx`: reviewed; existing role-specific notification drawers and unread counts retained rather than replaced with unscoped data.

## Super Admin first-third routes — changed
- [x] `academics`, `announcements`, `assignments`, `audit`
- [x] `batch-promotion`, `batches`, `batches/[batchId]/students`, `classes`
- [x] `colleges`, `colleges/[collegeId]`, `colleges/[collegeId]/admins`, `colleges/[collegeId]/admins/[userId]/history`
- [x] `colleges/[collegeId]/branding`, `colleges/[collegeId]/readiness`, `colleges/[collegeId]/verification`
- [x] `companies`, `companies/[companyId]/drives`, `course-progress`, `departments`, `electives`, `faculty`, `faculty-assignment`
- [x] `features`, `features/[collegeId]`, `features/[collegeId]/history`, `features/[collegeId]/trace`, `features/[collegeId]/students/[membershipId]`, `features/[collegeId]/students/[membershipId]/history`
- [x] Reviewed the full first 36 routes in `docs/orchestrator/ui-ux/pages-admin.md`. Courses and course offerings have their own shared/portal skin owner (chat-7); kept that ownership boundary and did not restructure course content. Checked route means a source-level visual pass, not functional QA.

## Super Admin placements / projects — changed
- [x] `placements`, `placements/analytics`, `placements/drives`, `placements/retention`, `placements/student-lookup`
- [x] `placements/jobs/[jobId]/applications`, `placements/jobs/[jobId]/schedule`, `placements/jobs/[jobId]/settings`
- [x] `placements/applications/[applicationId]`, `placements/shortlisted/[applicationId]`
- [x] `projects`, `projects/submissions`, `projects/templates`, `projects/templates/[templateId]/colleges`
- [ ] Remaining detail routes and shared placement/project widgets need more source scrutiny where they own page-level hardcoded styling.

Changes are limited to semantic tokens, 9px control radius and 12px canvas radius, controls, subtle panels, and flatter page flow. Fixed malformed doubled `rounded-[...]-[...]` classes in college directory and course progress.

## Inspected but no route-level visual change needed
- [x] Academic section detail, course-offering detail and domains delegate their visual skin to the shared shell or shared components; attendance, college administrator detail, sign-in and subdomain received a second control polish pass.
- [x] The smaller placements pages for applications, calendar, hiring, interviews, job-settings, joining, new drive, offers, screenings, seasons, shortlisted, and their thin detail wrappers already delegate their layout/styling to shared placement components.
- [x] The project detail, at-risk, audit, readiness, reassign-mentor, template drilldown and new-workspace wrappers already inherit shared controls and canvas. No page section/table was moved.
- [x] Source-only scan of all changed TSX files: no incomplete `</Select`, no duplicated arbitrary radius `rounded-[...]-[...]`, and no newline immediately before an `as` cast.


## Continued North Star pass (2026-10-19, chat-13 branch)

- [x] Rebased the working tree through a merge of origin/main `8049636671c9`; upstream versions remained authoritative for conflicting college-detail code and prior admin pages. Reapplied only unmerged shell and control styling.
- [x] Header order matches `old-lms-shell.css`: `+ New` to the left of Ctrl/Cmd+K command search, followed by role-scoped notification icons and account identity. Grid gracefully collapses when `+ New` is unavailable.
- [x] Retained current responsive app-shell page geometry while showing the selected college or organization name in the topbar before a stale membership label.
- [x] Super Admin first-third completion: `courses` now groups content-directory shortcuts in a compact responsive toolbar; `academics`, `batch-promotion`, `departments`, `electives`, and `faculty` use the canonical teal-link and focus tokens.
- [x] `announcements`, `companies`, and the module access `features/[collegeId]/trace` route drop duplicate outer cards; record/metric cards and page contents are preserved.
- [x] `course-progress`, `features`, `features/[collegeId]`, `features/[collegeId]/history`, and `colleges/[collegeId]/readiness` use shared 9px control radius, white secondary controls and light teal hover.
- [x] `courses/offerings/[offeringId]`, `academics/sections/[sectionId]` and `domains` are thin delegates to authorized workspace components with no independent styling surfaces to sweep; leave their business content with the component owner.
- [x] Follow-up nested-page pass: `colleges/[collegeId]/admins/[userId]/history`, `colleges/[collegeId]/branding`, `colleges/[collegeId]/verification`, `companies/[companyId]/drives`, `features/[collegeId]/students/[membershipId]` and `features/[collegeId]/students/[membershipId]/history` now follow the same legacy control and semantic state tokens.
- [x] Confirmed source-only JSX closing-tag integrity, including `</Select>` and the two new Courses `<nav>` pairs. No build, runtime, tests or CI executed.

- [ ] Actual visual screenshot parity, role-specific unread-message APIs beyond existing supported counts, and functional verification still require integration validation. No builds, tests, or CI were run.

**Verification policy:** dev-only; no TypeScript builds, tests, app execution or CI were run. Review and integration still required after mainline merges.
