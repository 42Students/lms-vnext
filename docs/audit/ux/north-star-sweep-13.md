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



## 2026-10-19 continuation
- [x] Merged `origin/main` into `chatgpt/chat-13-b` with `main` as the authoritative version of the three conflicting college-detail pages. Reapplied only token/radius/skin changes after the merge.
- [x] Topbar: Super Admin `+ New` navigates to the existing tenant creation page when no more specific creation route applies. Command search includes recruiter and teach aliases, supports ArrowUp/ArrowDown across results, and maintains Ctrl/Cmd+K. Header menu touch targets are 44px, keyboard focus indicators are visible, and mobile overlays scroll within the viewport.
- [x] `app-shell.tsx`: the selected organization/college scope wins over an unrelated membership label in the topbar; no second header was created.
- [x] Flattened duplicate outer panels on the announcements receipt area, feature access trace and company empty state, while preserving each page's own distinct inner content cards.
- [x] College sign-in, web address, admin sessions, company directory, course progress, attendance and module access hierarchy: finish secondary buttons/links using shared old LMS 9px radius, 36px desktop controls, surface background, hover, teal type and focus skin.
- [x] Re-read every changed JSX closing tag by source-only inspection; incomplete `</Select`, cut-off closing tags, doubled radius utility classes, newline-before-`as` and unmatched curly counts were not found in changed files.
- [ ] Runtime responsive visual comparison against legacy screenshots and full TypeScript/test validation remain intentionally deferred per owner (no CI).

## 2026-10-19 shared-control continuation (chat-13)

- [x] Checked `origin/main` before edits; `chatgpt/chat-13-b` was already current with the main commit `8049636671c9`, so no merge conflict or overwrite was required.
- [x] Topbar search: removed an unused desktop grid track, gave the command trigger its own focus ring, unified arrow/Home/End result traversal and Escape focus restoration, and removed TPO-local keyboard handling that previously competed with the shared listbox.
- [x] Topbar command icon and TPO search suggestions are now shared ghost `Button` instances; local CSS preserves the measured 36px command box and 44px suggestion targets. The search text field remains a specialized accessible combobox with header-owned sizing.
- [x] First-third Super Admin page controls: `batch-promotion` uses shared `Checkbox`; `announcements`, `companies`, `electives` and the shared `admin-scoped-read-page` now use `Input` for preserved hidden filter state. Hidden controls remain hidden and preserve existing GET/query contracts.
- [x] College sign-in and branding: shared `Radio` for sign-in choices and shared `Input` for the specialized colour picker; shared design radii applied without changing branding preview behavior.
- [x] Faculty assignments: native checkbox and five native buttons changed to shared `Checkbox` and `Button` while retaining loading/disabled, confirmation, and submission semantics.
- [x] Super Admin verification UI: bulk actions, export, filters, tabs, queue search, selection and review drawer now use shared `Button`, `Input`, `Select`, `Checkbox` and `Textarea`. Preserved persisted review/authorization workflow, route links and notifications.
- [x] Source-only re-read: checked every changed `Button` and `Select` opening/closing tag pair, incomplete `</Select>` tags, duplicated radius utilities, CSS braces, and native-control leftovers in newly swept admin components.
- [ ] UI screenshot comparison, TypeScript builds, tests, application execution and CI intentionally not run per owner.
- [x] Final upstream sync: merged `main` at `0a542bfcf587` as an additional parent; preferred its newer `app-shell.tsx` and Course Progress files on overlap and retained all nonconflicting chat-13 styling and shared UI conversions.

**Verification policy:** dev-only; no TypeScript builds, tests, app execution or CI were run. Review and integration still required after mainline merges.
