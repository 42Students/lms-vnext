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

## 2026-10-19 shared-control continuation (chat-13)

- [x] Checked `origin/main` before edits; `chatgpt/chat-13-b` was already current with the main commit `8049636671c9`, so no merge conflict or overwrite was required.
- [x] Topbar search: removed an unused desktop grid track, gave the command trigger its own focus ring, unified arrow/Home/End result traversal and Escape focus restoration, and removed TPO-local keyboard handling that previously competed with the shared listbox.
- [x] First-third Super Admin page controls: `batch-promotion` uses shared `Checkbox`; `announcements`, `companies`, `electives` and the shared `admin-scoped-read-page` now use `Input` for preserved hidden filter state. Hidden controls remain hidden and preserve existing GET/query contracts.
- [x] College sign-in and branding: shared `Radio` for sign-in choices and shared `Input` for the specialized colour picker; shared design radii applied without changing branding preview behavior.
- [x] Faculty assignments: native checkbox and five native buttons changed to shared `Checkbox` and `Button` while retaining loading/disabled, confirmation, and submission semantics.
- [x] Super Admin verification UI: bulk actions, export, filters, tabs, queue search, selection and review drawer now use shared `Button`, `Input`, `Select`, `Checkbox` and `Textarea`. Preserved persisted review/authorization workflow, route links and notifications.
- [x] Source-only re-read: checked every changed `Button` and `Select` opening/closing tag pair, incomplete `</Select>` tags, duplicated radius utilities, CSS braces, and native-control leftovers in newly swept admin components.
- [ ] UI screenshot comparison, TypeScript builds, tests, application execution and CI intentionally not run per owner.

**Verification policy:** dev-only; no TypeScript builds, tests, app execution or CI were run. Review and integration still required after mainline merges.


## Checkpoint 1: TOP BAR — computed-CSS / legacy-SCSS source parity (October 19, 2026)

Owner reference: `docs/design/old-lms-shell.css` TOP HEADER rules, `old-lms-shell-spec.md`, `legacy-styles/components___header.scss`, `components___dropdown.scss`, `components___notification-drawer.scss`. The computed reference takes precedence over generic variables when they disagree.

| Item | Legacy reference | chat-13 implementation |
| --- | --- | --- |
| Header | 68px high, 18px gap, 20px horizontal padding, white | `topbar.module.css .bar`: `height/min-height:68px`, `gap:18px`, `padding:0 20px`, `--lms-white` |
| Border + shadow | `#e7ecf2` 1px bottom; `0 1px 3px rgba(26,45,72,.035)` | `--lms-header-border` and `--lms-header-shadow` match their values in `globals.css` |
| Command structure | `auto minmax(220px,380px) 1fr`, gap 12px; New, search and actions | Moved `TopbarNotifications` to the third grid child; `.command` uses exact 3-track grid |
| Search box | 291×36px, `#f8fafc`, radius 9px | `.search` width 291px; `.searchBox` height 36px, `--topbar-search-bg` / `--lms-control-radius` |
| Keyboard hint | visible `Ctrl K` with muted `#5b6b82` text | `<kbd>` within search box; Ctrl/Cmd+K opens, listbox arrow/Home/End/Escape navigation maintained |
| New | 82×36px, 9px radius, `#0a7c88` primary/white text, 14px/650 | `.new` dimensions/weight and `--lms-button-primary`/white values match; TPO retains its authorized creation menu |
| Icons | outlined white 36×36px, 9px radius | `.iconButton` and compact notification trigger; Messages shown only when an authorized route exists |
| Red count badges | 10px text, 16×16px badge; `#ff7576` from `components___dropdown.scss` | `.badge` and scoped existing TPO/recruiter/learner bell overrides, with real unread counts where provided |
| Organization | 12px/600, text `#334155`, max 260px desktop /180px tablet | `.orgName` and scope-first `app-shell.tsx` `organizationName` |
| Avatar | 42px wrapper/38px inner circle; mobile 40px/36px | `.avatar` and `.avatarInner` + role/email-derived initials and existing account actions |
| Account dropdown | desktop width max 280px, shadow `9px 11px 28px rgba(0,0,0,.1)`, radius 6px and padding 16×24px | `.menu` matches; mobile radius 14px, padding 16px |
| Notification popover | min 360px/max 420px, max-height `min(520px,100vh - 120px)`, radius 12px, thin `#e5e9f0` border, layered soft shadow | scoped bell adapters retain authenticated data sources and use exact dimensions/shadow; mobile full-width overlays |
| Tablet/mobile | 768–1199px gap 10px/padding 14px; ≤767px gap 8px, safe-area padding, 38px New, 36px search trigger, 40px avatar wrapper | matching media rules in `topbar.module.css` |

**Integration boundary:** The topbar has one rendering slot in `app-shell.tsx`, with no duplicated header. The TPO route has independently authorized Messages + Notifications and unread counts. Other portals only show the Messages control when `messagesHref` is known; do not fabricate destinations or badge counts. Learner/recruiter notifications retain their existing role-specific panels. The avatar falls back to role/email-derived initials because `RequestContext.user` has no display-name field.

**Verification limit:** This matrix is checked against repository CSS/SCSS sources and JSX structure. No screenshot comparison, browser rendering, TypeScript compiler, tests, app execution or CI was run. Mark visual pixel equality as unverified until screenshot inspection.

## Checkpoint 3: Super Admin first-third follow-up

- [x] Audited the first 36 `/admin` route sources from `docs/orchestrator/ui-ux/pages-admin.md`; every route now uses shared Button/Input/Select/Textarea abstractions or delegates to an existing component. No remaining native controls on these route pages.
- [x] Replaced four remaining one-off legacy-link/focus colors in `batches/[batchId]/students`, `departments`, and `faculty-assignment` with shared `text-primary-text`/`outline-primary` and secondary hover tokens.
- [x] Shared admin and verification components swept in earlier batches (including college branding, sign-in, verification filters/drawer, and faculty-assignment creation); updated account-menu scope search to `Input` in this checkpoint.
- [x] Imported first-third components: `super-admin-college-broadcast-form` now uses shared `Select`/`Checkbox` and a flat section; `announcement-admin-workspace` uses shared `Checkbox` for pinned/consent actions; `college-logo-uploader` uses shared `Input` for crop range controls.
- [x] Super Admin Batches and Classes delegate to `college-cohort-management` and `college-section-management`. Converted all 10+6 native text/date/number inputs, 4+3 selects, 6+4 action buttons, and 2 class description textareas to shared UI components while preserving forms, server validation, action states and original content.
- [x] Source-only tag checks confirmed exact `Button`/`Select` closing tags, no truncated `</Select>` in converted components, and balanced CSS curly braces.
- [ ] Further imported component visual comparison and interactive QA are still required.

