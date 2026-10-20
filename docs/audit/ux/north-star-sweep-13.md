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
- [x] Removed a duplicate `Button` import from `hr-recruiter-bell.tsx`, the existing recruiter notification trigger used by the topbar. No recruiter business or notification behavior was changed.
- [ ] Further imported component visual comparison and interactive QA are still required.



## Replacement chat-13 continuation — post-main fast-forward (2026-10-19)

The lane branch was 651 commits behind `main` and had no unique commits (GitHub compare: ahead 0, behind 651). Advanced `chatgpt/chat-13-b` by a fast-forward to `12ee0a58fd9af5e0e1f1ad975155f864966cb6c0` before modifying source files. Previous chat-13 work was already integrated upstream; no forced ref update or main-branch write.

### Completed files in this replacement batch
- [x] `src/components/placements/super-admin-bulk-drive-actions.tsx`: both native drive selection checkboxes use shared `Checkbox`; retry control uses shared `Button` link variant; preview panel radius/skin uses legacy tokens. Kept bulk preview, confirmation, selected IDs, limits, API and error states unchanged.
- [x] `src/components/admin/super-admin-placement-oversight-nav.tsx`: supplemental tabs use explicit current-route underline, `aria-current="page"`, tokenized focus ring and hover colors; active supplemental report is expanded in the existing `Disclosure` rather than hidden.
- [x] `src/app/(authenticated)/admin/placements/page.tsx`: overview actions use consistent legacy 36px desktop / 44px touch geometry, semantic teal and visible focus styles.
- [x] `src/app/(authenticated)/admin/placements/applications/[applicationId]/page.tsx`: action links and status-heading typography use shared header/control styles without changing stage history.
- [x] `src/app/(authenticated)/admin/placements/drives/page.tsx`: drive creation and scope actions use legacy action height, typography, hover and focus styles.
- [x] `src/app/(authenticated)/admin/placements/analytics/page.tsx`: report export link and section headings use the shared legacy visual tokens. Report data, filters, CSV and funnel are unchanged.
- [x] `src/app/(authenticated)/admin/projects/templates/page.tsx`: template creation and inspection links use legacy control/touch/focus styles, and card headings use the semantic legacy heading color; object cards are deliberately retained.
- [x] `src/components/projects/super-admin-template-college-bulk.tsx`: college selection checkbox uses shared `Checkbox`; rows have matching legacy radius/height/hover/focus and accessible label containment.
- [x] `src/app/(authenticated)/admin/projects/templates/[templateId]/colleges/page.tsx`: back action focus/touch styling and object heading color use the shared tokens; template assignments and college cards remain intact.

### Source-only check
- [x] Re-read changed JSX source from `chatgpt/chat-13-b`: the edited `Button` and `Select` opening/closing tag counts match, the new `Checkbox` instances are self-closing, no truncated `</Select` remains, and no native checkbox remains in the two edited bulk widgets.
- [ ] **Not verified**: visual pixel comparison, browser rendering, compile-time types, UI interactions, tests and CI. Deliberately no build/test/runtime execution per owner instruction.
- [x] `src/components/admin/super-admin-placement-detail-view.tsx`: aligned shared detail navigation actions with tokenized hover, focus and responsive dimensions; fact grid, page data and routes are intact.
- [x] `src/components/projects/super-admin-template-subview-page.tsx`: normalized template catalogue and create-workspace actions across template subviews to canonical legacy border, radius, 650 weight, focus and touch size.
- [x] `src/components/placements/super-admin-drive-pipeline.tsx`: source-reviewed; already uses tokenized headings, data strips, compact borders and responsive grid with no extra outer card. Deliberately no content or layout edit.
- [x] `src/components/projects/super-admin-template-overview-editor.tsx`: editor labels and continuous section use semantic legacy body text; Input, Select, Textarea and Button remain shared controls, without changing the persisted blueprint.
- [x] `src/components/projects/super-admin-template-resource-editor.tsx`: resource labels, header, and object fieldset surface use semantic legacy colors; individual fieldsets remain because each is a distinct editable resource.
- [x] `src/components/projects/super-admin-template-plan-editor.tsx`: source-reviewed; already uses shared Input/Select/Textarea/Button, tokenized labels and separable sprint/task fieldsets. No speculative layout rewrite.
- [x] Re-read editor JSX: shared Button/Select opening and closing tag counts match; Textarea is self-closing; no native button/select/input/textarea in these three template editors. No truncated `</Select` or `</Button` found.
- [ ] **Next source scrutiny**: `src/components/projects/super-admin-template-college-bulk.tsx` integration appearance with college cards; `src/app/(authenticated)/admin/projects/templates/[templateId]/versions/page.tsx` and other thin template subviews; then source-review remaining Super Admin placements/projects detail wrappers. Visual screenshots and behavior still unverified.


### Post-check: topbar notification and Super Admin detail wrappers
- [x] `src/components/hr/hr-recruiter-bell.tsx` (topbar dependency): restored missing import for shared `Badge` rendered in the real unread-count trigger; no change to recruiter bell data, polling, links, mutation or drawer.
- [x] `src/components/shell/topbar/topbar.module.css` notification sections source-checked against `docs/design/legacy-styles/components___notification-drawer.scss`: 360–420px panel, 520px cap, 12px corners, thin neutral border, 16×20px header padding, two-layer soft shadow, 8px rows, 44px mobile actions and responsive drawer are already specified. No duplicate style overrides introduced.
- [x] `src/app/(authenticated)/admin/projects/templates/[templateId]/versions/page.tsx` and `versions/[versionId]/page.tsx` reviewed; the former delegates visual skin entirely to `SuperAdminTemplateSubviewPage` (swept above), while the latter has semantic side-by-side diff panels and uses shared PageHeader/PageBackLink controls.
- [x] `src/app/(authenticated)/admin/projects/[projectId]/[section]/page.tsx` delegates its visual skin to the authorized AdminProjectSectionPage.
- [x] `src/app/(authenticated)/admin/placements/seasons/[seasonId]/page.tsx`, `interviews/[roundId]/page.tsx`, `joining/[offerId]/page.tsx`, `offers/[offerId]/page.tsx`, `screenings/[applicationId]/page.tsx` and `shortlisted/[applicationId]/page.tsx` use the now-swept `SuperAdminPlacementDetailView`; no route-specific card wrappers.
- [ ] Browser screenshot/computed-style and functional checks remain open; intentionally no app execution, build, test suite, or CI.


### Placement lookup and version rollback visual completion
- [x] `src/app/(authenticated)/admin/placements/student-lookup/page.tsx`: Analytics action now has legacy focus/border hover, search label uses semantic body text and student heading uses the  legacy heading token; the selected-college query/response, table columns, and safe truncated states remain untouched.
- [x] `src/components/projects/super-admin-template-rollback-control.tsx`: rollback section and heading use semantic text tokens. Confirm/rollback behavior, version tokens, API and status/error messages unchanged.
- [x] `src/components/projects/template-metadata-edit-control.tsx` and `project-template-controls.tsx`: source-reviewed; already consume shared Button, Input, Textarea, Checkbox and Dialog; no hard-coded palette rewrite needed in their form skin.
- [ ] Screenshots/computed-style comparison and functional verification still pending; changes are source-only, and no app, TypeScript build, tests, or CI were run.


## Replacement lane checkpoint: Super Admin projects, company identities, interviews (2026-10-19)

Scope: **source-level visual parity** only; no changes to business data/fields, routes, mutations, confirmations, filter/pagination semantics or permissions. Source: the old LMS computed shell `docs/design/old-lms-shell.css:55-79`, `docs/design/old-lms-pages.md:5-14`, `docs/design/legacy-styles/components___form.scss:109-142`, `components___variables.scss:21-39,139`, `pages___admin-list-pages.scss:8,193-218`; implementation tokens `src/app/globals.css:21-30,327-345`, shared `Button`, `Radio`, `Input`, `Select`.

### Scoped value comparison (static source)

| Property/state | Old LMS source and exact value | vNext shared value and line | Result |
| --- | --- | --- | --- |
| Primary action / hover | `old-lms-pages.md:7` teal solid CTA; `globals.css:24-25` codifies sampled `#0a7c88` / `#086873` | `src/components/ui/button.tsx` `primary` variant resolves `--lms-button-primary` / `--lms-button-primary-hover` | Match; removed extra background override in `super-admin-college-company-actions.tsx:29` |
| Button control size | `globals.css:341`: sampled 36px; `components___variables.scss:139`: 44px touch target | `Button` uses `--lms-control-height:36px`; Super Admin action overrides `min-h-11` at ≤767px then `min-[768px]:min-h-9` | Match for modified explicit-action classes |
| Breakpoint | `pages___admin-list-pages.scss:193`, `old-lms-shell.css:73`: mobile ≤767px, tablet starts 768px | `min-[768px]:min-h-9`; no `sm:min-h-9` on the modified selectors | Match for modified selectors |
| Control radius | `old-lms-shell.css:62`: 9px selector; `globals.css:343`: 9px sampled control | `--lms-control-radius` on link, picker and focus-row classes | Match |
| Field radius/background | `components___form.scss:118-128`: 10px, muted field background, font 14px/400 | shared `Input` / `Select` and `--lms-field-radius` (`globals.css:344`) | Match by shared-component delegation |
| Form label | `components___form.scss:110-112`: 13px, weight 600 | `text-[13px] font-semibold text-body` in company edit/create forms | Match |
| Surface/divider | `components___variables.scss:30,37`: border `#e5e9f0` on white `#fff` | `bg-surface`, `border-border` and `border-l-2 border-border` on standalone controls and flat summary strips | Match for color/surface; decorative stripe width is a local layout choice |
| Hover background | `components___variables.scss:13` teal-subtle `#eff8fa` | `hover:bg-primary-subtle` resolves `globals.css:30` | Match |
| Keyboard focus | `components___form.scss:23-35`: visible focus for keyboard, suppress on pointer focus | `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary` plus shared control focus | Semantically preserved; outline geometry uses shared kit |
| Radio | `components___form.scss:23-35`: keyboard focus, native radio keyboard/group behavior | `src/components/ui/radio.tsx` `Radio` replaces the lone raw readiness selector at `admin-readiness-workspace-picker.tsx:24`, retaining name/value/checked/change | Match for shared semantics; browser visual comparison open |
| Nested metrics | `old-lms-pages.md:5,12`: one white page, thin strips, no ordinary card-in-card | `project-admin-readiness-page.tsx:265`: `border-l-2 border-border bg-surface` replaces `rounded-lg bg-muted` inside the project list | Match for canvas/surface treatment |

### Whole-file completion queue with proof pointers

Every row refers to a full source file, not to an arbitrary commit. The checked items mean the scoped visual source pass is finished; they do not claim screenshot or runtime validation.

| File | Value / layout proof (source line) | Coverage / responsive proof |
| --- | --- | --- |
| [x] `src/components/projects/admin-readiness-workspace-picker.tsx` | Shared radio `:24`, label 13px/600, flat white bordered selectable region; row hover and focus within | Native controls 0; 44px mobile/36px ≥768px in picker rows; source line 23 |
| [x] `src/components/projects/project-admin-readiness-page.tsx` | Flat metric strip `:265`, semantic headings, tokenized CSV action | Native controls 0; export 44px mobile/36px ≥768px at line 96, mobile-first metric grid retained |
| [x] `src/components/projects/project-admin-at-risk-page.tsx` | Filter counter hover and keyboard focus both use semantic teal `:88` | Native controls 0; counter links already min-height 44px, three-column grid reduces on phone |
| [x] `src/components/projects/project-admin-audit-page.tsx` | Reset/Refresh/View activity links use outline, hover, radius and canvas tokens `:182` | Native controls 0; 44px mobile/36px ≥768px; audit filter form remains 1/2/5 columns |
| [x] `src/components/admin/super-admin-interview-operations.tsx` | Export control `:60` white outlined, teal hover/focus; headings and labels use shared text tokens | Native controls 0; dropdown and export touch targets 44px ≤767px; 36px ≥768px |
| [x] `src/components/admin/super-admin-company-edit.tsx` | Form labels 13px/600 `:39`, heading uses shared text; controls remain shared | Native controls 0; no fixed widths; native responsive inputs/Button layout preserved |
| [x] `src/components/admin/super-admin-company-merge.tsx` | Shared `Select`, `Button`; min heights `:35` | Native controls 0; selectors and destructive action 44px mobile, 36px ≥768px |
| [x] `src/components/admin/super-admin-company-verification.tsx` | Shared action controls and neutral confirmation stripe `:28` | Native controls 0; 44px mobile, 36px ≥768px; existing confirm/disabled state retained |
| [x] `src/components/admin/super-admin-company-identities.tsx` | Semantic heading and shared input/action styles `:46` | Native controls 0; Add/Remove actions 44px mobile, 36px ≥768px; wraps flex row |
| [x] `src/components/admin/super-admin-company-restore.tsx` | Shared `Button` only `:22` | Native controls 0; button 44px mobile, 36px ≥768px |
| [x] `src/components/admin/super-admin-college-company-actions.tsx` | No parallel raw primary background; shared button variant `:29`, 13px/600 labels | Native controls 0; nine 44px phone and 36px ≥768px overrides; two-column form on tablet |
| [x] `src/components/projects/project-admin-collection-controls.tsx` | Clear action semantic link, shared control radius + focus `:158` | Native visual controls 0; **4 raw hidden inputs** retained as inert GET-query fields (exempt); Clear 44px phone, 36px ≥768px, pagination already responsive |
| [x] `src/components/projects/admin-project-section-page.tsx` | Pure authorized `ProjectWorkspace` delegate; no JSX shell chrome, style, radius, heading or standalone controls | Native controls 0, literals 0; inherits shared `ProjectWorkspaceHeader` / `Tabs` / canvas, so no unsafe visual rewrite |

**Grep proof (GitHub-ref source scan, not a local execution):** equivalent pattern `rg -o '<(button|select|input|textarea)\b' <file> | wc -l`. In order above: `0,0,0,0,0,0,0,0,0,0,0,4,0`. The four last-group raw inputs are all `<input type="hidden"` preserving navigation parameters, not visible hand-rolled controls. Equivalent literal palette pattern `rg -o '#[0-9A-Fa-f]{3,8}\b' <file> | wc -l`: `0` in **all 13** files. Equivalent `rg -o 'style=\{' <file> | wc -l`: `0` in all 13 files. Checked each touched file for invalid partial closing tags `</Select` / `</Button` and compared opening vs closing tags for shared `Button` / `Select`. Self-closing `Input` and `Radio` remain self-closing.

**Responsive proof (CSS source only):** original admin list source sets 44px touch minimum (`pages___admin-list-pages.scss:8`) and mobile rules at ≤767px (`:193`); modified explicit link/button wrappers use 44px minimum on that band and 36px starting at 768px, while shared inputs/selects retain inherited mobile sizing. Page grids already collapse or wrap; project readiness metric cells are flat instead of standalone grey cards. Keyboard `focus-visible`, selected radio state, loading/disabled states, exports and all API calls remain in place.

- [ ] **Not complete:** pixel-by-pixel browser comparison against old LMS; computed-style capture; TypeScript validation, test suite, end-to-end focus/interaction check, and CI (all intentionally not run under owner instruction).
- [ ] **Next source files:** `src/app/(authenticated)/admin/companies/page.tsx`, then `src/app/(authenticated)/admin/companies/[companyId]/drives/page.tsx` and `src/components/admin/super-admin-company-merge.tsx` UX review for the full company directory/detail flow.


### Company directory and Project creation follow-up — full source pass

| Completed file | Exact visual value vs legacy reference | Static coverage proof | Responsive proof |
| --- | --- | --- | --- |
| [x] `src/app/(authenticated)/admin/companies/page.tsx` | Company navigation links now use legacy tabs: active `2px` teal underline and token text/hover/focus; company summary is one flat border-y metric strip rather than six nested cards (`135-142`); separate company record cards are retained. Buttons defer to `--lms-button-primary #0a7c88`, `--lms-control-radius 9px` (`globals.css:24,343`), 13px/600 labels (`components___form.scss:111-112`). | `<Select>` 10 opening / 10 closing; `<Button>` 1/1. Raw visual controls 0; hex 0; inline style 0. | Company actions and selects use 44px at ≤767px and 36px ≥768px (19 explicit breakpoint classes); form/group grids become single column on phone. |
| [x] `src/app/(authenticated)/admin/companies/[companyId]/drives/page.tsx` | `24-30`: history counters changed from separate rounded cards to one bordered 3-column desktop/2-column phone strip; back link uses 9px token radius and semantic focus/hover. | Raw controls 0; hex 0; inline style 0. Shared `DataTable` and `StatusBadge` unchanged. | Link min 44px ≤767px, 36px ≥768px; summary strip starts 2 columns and becomes 3 at 768px. |
| [x] `src/components/projects/super-admin-template-create-form.tsx` | `40-107`: every label inherits the 13px/600 legacy form label contract (`components___form.scss:110-112`) and existing `Input`, `Select`, `Textarea`. Cancel link at `:113` is 9px radius, white, teal hover and visible focus. | Raw controls 0, hex 0, inline styles 0; `<Select>` 2/2, `<Button>` 1/1; existing model validation/payload preserved. | Cancel 44px phone/36px ≥768px; form remains one column on phone and 2 columns starting at the existing md breakpoint. |
| [x] `src/components/projects/project-admin-reassign-mentor-page.tsx` | `:79-110`: mentor selectable cards retain separate object layout with `--lms-canvas-radius:12px` (`globals.css:345`), white surface, token border, teal subtle hover and outline. Filter labels use 13px/600; clear link uses 9px token control radius. | Raw controls 0; hex 0; inline styles 0; `<Select>` 1/1 and `<Button>` 2/2. Mentor selection logic unchanged. | Cards 1 column phone, 2 at 768px, 3 at xl; clear action 44px phone/36px ≥768px. |
| [x] `src/components/projects/project-admin-workspace-list.tsx` | `:170`: separate workspace-object card CTA uses 9px radius, outlined white surface, teal subtle hover, visible keyboard focus; unchanged `StatusBadge`, `DataTable`, metrics and card boundaries. | Raw controls 0, hex 0, inline styles 0; no raw table or control. | Open action min 44px ≤767px/36px ≥768px; existing 1/2/3 workspace-card layout thresholds retained. |

**Grep proof — source-read counts, not local shell execution:** `rg -o '<(button|select|input|textarea)\\b' <file> | wc -l` => all five `0`; `rg -o '#[0-9A-Fa-f]{3,8}\\b' <file> | wc -l` => all five `0`; `rg -o 'style=\\{' <file> | wc -l` => all five `0`. JSX `Select` and `Button` opening/closing counts match where present; no truncated JSX `</Select` / `</Button` tags. Values use token source locations in the previous table; semantic hover `#eff8fa` (`components___variables.scss:13`), touch minimum 44px (`:139`; `pages___admin-list-pages.scss:8,193`), control height 36px (`globals.css:341`).

- [ ] Actual browser rendering, computed CSS, functionality, typecheck, unit tests and CI remain unverified by instruction. Do not claim final pixel parity from source-only evidence.
- [ ] **Next file**: `src/components/projects/class-team-workspace-creator.tsx` (review any remaining hand-styled controls in Super Admin workspace creation), then untouched Super Admin first-third nested admin components.


### Class-team workspace creation source parity (Super Admin Projects)

| Item | Legacy value and source | vNext source proof |
| --- | --- | --- |
| [x] Field labels | `components___form.scss:110-112`: 13px/600 | `src/components/projects/class-team-workspace-creator.tsx:165-201,240-249` ten visible class/team labels use `text-[13px] font-semibold text-body` |
| [x] Separate team objects | `old-lms-pages.md:14` separate record cards allowed; `globals.css:345` 12px canvas radius | `class-team-workspace-creator.tsx:234` team records retain their own `border-border bg-surface rounded-[var(--lms-canvas-radius)]` (not page-level wrappers) |
| [x] Focus and summary headings | `components___form.scss:23-35` keyboard focus, `globals.css:21` primary highlight | `class-team-workspace-creator.tsx:215,274` keyboard scroll regions use `focus-visible:outline-primary`, headings use `text-foreground` |
| [x] Responsive | `pages___admin-list-pages.scss:8,193` phone touch 44px, ≤767px; content adapts | Class/team creation uses existing `grid-cols-1 md:grid-cols-2`; shared `Button`/`Input`/`Select` preserve their accessibility, with phone target sizes governed by shared skin |

**Grep proof (source scan, no local execution):** `rg -o '<(button|input|select|textarea)\\b' src/components/projects/class-team-workspace-creator.tsx | wc -l` => `0`; hard-coded hex pattern => `0`; inline `style={` => `0`; `rounded-lg` => `0`; JSX `<Button>` 4/4, `<Select>` 6/6, no truncated closing tags. All team-moving/swap logic, class scope, optimistic preview, download and create actions retained.

- [ ] Computed styles and click-through functional checks remain pending under owner no-runtime directive.
- [ ] **Next**: `src/components/admin/super-admin-batch-roster-manager.tsx` and `src/components/admin/super-admin-batch-graduate-action.tsx` (first-third academic admin components).


### First-third Super Admin academic-component continuation

| Completed file | Exact legacy value proof | Source grep, responsive and JSX proof |
| --- | --- | --- |
| [x] `src/components/admin/super-admin-batch-roster-manager.tsx` | Search/class labels now 13px/600 (`components___form.scss:110-112`), shared `Input`, `Select` and `DataTable`; section remains flat `border-b border-border` (source `:44-95`). | Raw controls `0`, literals `0`, inline styles `0`; `Button` 1/1, `Select` 2/2. Fields min 44px ≤767px/36px ≥768px, roster filters stack on phone and pair from 768px. |
| [x] `src/components/admin/super-admin-batch-graduate-action.tsx` | Shared secondary `Button`, `ConfirmDialog`; existing disabled, pending, success and error states retained. | Raw controls `0`, literals `0`, inline styles `0`; `Button` 1/1. The action uses 44px minimum on phone and 36px from 768px (line 32). |
| [x] `src/components/admin/super-admin-faculty-bulk-import.tsx` | Header is semantic `text-foreground` (`globals.css:327`), success/error states use semantic `text-body`/`text-error`; sample and submit remain shared `Button` and file UI. | Raw controls `0`, literals `0`, inline styles `0`; `Button` 2/2. Pre-existing `md:min-h-9` is exactly ≥768px, 44px phone buttons and file input remain. |
| [x] `src/components/admin/super-admin-faculty-schedule-reassign-action.tsx` | Replacement label 13px/600 (`components___form.scss:110-112`, source `:67`); shared `Select` and `Dialog`. | Raw controls `0`, literals `0`, inline styles `0`; `Button` 3/3 and `Select` 1/1; Select 44px ≤767px/36px ≥768px, preserves prompt and dialog behavior. |
| [x] `src/components/admin/admin-program-directory.tsx` | Four form labels and search 13px/600, headings use `--lms-heading` (`globals.css:327`); Refresh and Clear link now use semantic outlined action, hover/focus, 9px radius. | Raw controls `0`, literals `0`, inline styles `0`; `Button` 5/5, `Select` 1/1; 5 explicit 768px action breakpoints, program form one column on phone and two at ≥768px. |

**Reproducible grep proof from GitHub text scan (no local repository execution):** `rg -o '<(button|select|input|textarea)\\b' <file> | wc -l` => `0` in each; `rg -o '#[0-9A-Fa-f]{3,8}\\b' <file> | wc -l` => `0`; `rg -o 'style=\\{' <file> | wc -l` => `0`; shared `Button`/`Select` opening and closing tag totals above match. The typography, touch, radius, focus and semantic palette values match the prior checkpoint's legacy/value table, with native file upload and shared controls exempt from bespoke chrome.

**Responsive source:** `pages___admin-list-pages.scss:8,193` + `components___variables.scss:139` specify 44px ≤767px; `globals.css:341` defines 36px default desktop. Corrected leftover `sm:min-h-9` on the batch components to `min-[768px]:min-h-9`. No change to enrollment moves, graduation confirmation, faculty import, schedule reassignment or program CRUD behavior.

- [ ] Visual screenshots, browser focus interactions, TS compile, tests and CI intentionally unverified.
- [ ] **Next file:** `src/components/admin/lecture-hall-manager.tsx` (first-third Super Admin academics) then `src/components/admin/department-directory.tsx`.


### Department, lecture-hall and attendance visual sweep (first-third Super Admin)

| Completed file | Legacy / current value proof | Grep and responsive proof |
| --- | --- | --- |
| [x] `src/components/admin/lecture-hall-manager.tsx` | `const field` label at :178 uses 13px/600, replacing 12px; exact source `components___form.scss:110-112`. Availability row link now resolves 9px radius `globals.css:343`, semantic teal hover `globals.css:30`, keyboard outline. | Raw visual controls 0, hex 0, inline styles 0; shared Button 6/6 and Select 2/2. Link min-height 44px ≤767px/36px ≥768px and modal form becomes 2 columns at 768px. |
| [x] `src/components/admin/department-directory.tsx` | Search/page-size labels 13px/600 (`:72,86`), shared Select inherits 10px field radius (`components___form.scss:120`, `globals.css:344`); Export CSV uses 9px CTA radius with hover/focus tokens. | Raw controls 0, hex 0, inline styles 0; Button 6/6, Select 1/1. Page-size Select and CSV export min-height 44px ≤767px/36px ≥768px; toolbar flex wraps. |
| [x] `src/components/admin/department-create-form.tsx` | `:61` Create Department label 13px/600 matching legacy form; shared Input/Button, flat form divider retained. | Raw controls 0, hex 0, inline styles 0; Button 1/1. Input/Button stay in flex-wrap form and inherit shared mobile styling. |
| [x] `src/components/admin/department-actions.tsx` | `:183` Edit Department label 13px/600; existing shared Dialog, Input, Button and confirmation states unchanged. | Raw controls 0, hex 0, inline styles 0; Button 7/7; dialog has responsive shared chrome and unchanged keyboard behavior. |
| [x] `src/components/admin/super-admin-attendance-settings-editor.tsx` | `:42-53` heading uses `text-foreground` (`globals.css:327`), policy fields 13px/600, 14px normal input text and 10px radius from shared Input. | Raw controls 0, hex 0, inline styles 0; Button 1/1. One-column phone form, two at 768px; shared ConfirmDialog still controls the mutation. |

**Grep proof (GitHub source scan, no local code execution):** `rg -o '<(button|input|select|textarea)\\b' <file> | wc -l` => each of five files `0`; `rg -o '#[0-9A-Fa-f]{3,8}\\b' <file> | wc -l` => each `0`; `rg -o 'style=\\{' <file> | wc -l` => each `0`. Opening/closing `Button` and `Select` counts above match. 13px/600 form source: `components___form.scss:110-112`; 44px touch source: `components___variables.scss:139` and `pages___admin-list-pages.scss:8,193`; 36px control: `globals.css:341`, mobile breakpoint 767px: `old-lms-shell.css:73`. No modified prop, form action, query, upload, optimistic token or permission boundary.

- [ ] Browser pixel comparison, role interaction checks, TS typecheck, tests and CI remain explicitly outstanding.
- [ ] **Next file:** `src/components/admin/super-admin-learning-filter-fields.tsx`, then Super Admin Academics / Lectures remaining nested widgets.


### Academic setup navigation and faculty assignment completion

| File | Exact legacy values + source location | Static grep and phone/tablet proof |
| --- | --- | --- |
| [x] `src/components/admin/super-admin-learning-filter-fields.tsx` | `:9,14` form labels 13px/600 match `components___form.scss:110-112`, controls inherit shared `Select` field palette and 10px radius (`components___form.scss:120`). | Native control `0`; hex `0`; inline styles `0`; `<Select>` 2/2. Both Selects 44px ≤767px/36px ≥768px. |
| [x] `src/components/admin/super-admin-faculty-assignment-create.tsx` | `:70-134` all course/class/faculty/role labels and legend now 13px/600 body/heading token; selector chrome from shared `Select` and multi-course `Checkbox`. | Native control `0`; hex `0`; inline styles `0`; `<Button>` 5/5, `<Select>` 4/4. Six explicit 768px overrides, form/grid stacked on phone, multi-course selection scrollable, submit and edit pending states unchanged. |
| [x] `src/components/admin/academic-setup-steps.tsx` | Existing six-step sequence retained; next/previous/overview controls now white outlined 9px radius `globals.css:343`, teal hover `globals.css:30`, 2px keyboard outline. | Native control `0`; hex `0`; inline styles `0`. Five step affordances now 44px min ≤767px and 36px ≥768px. Flex-wrap navigation retained. |
| [x] `src/components/admin/academic-module-scope-inventory.tsx` | Academic hierarchy header uses `--lms-heading` `globals.css:327`; show/hide buttons shared `Button`, pagination links 9px radius, semantic teal hover/focus. | Native control `0`; hex `0`; inline styles `0`; `<Button>` 2/2. Four touch overrides 44px ≤767px/36px ≥768px; DataTable and bounded scroll untouched. |

**Grep proof (source scan of branch, not local execution):** `rg -o '<(button|select|input|textarea)\\b' <file> | wc -l` = `0` for each of four; `rg -o '#[0-9A-Fa-f]{3,8}\\b' <file> | wc -l` = `0`; inline `style={` = `0`; shared `Button` / `Select` opening and closing counts match above. **Source breakpoints:** `old-lms-shell.css:73` ≤767px mobile and `pages___admin-list-pages.scss:193`, `components___variables.scss:139` =44px; `globals.css:341`=36px. Explicit controls now use `min-[768px]`, not Tailwind's earlier 640px `sm` threshold. No scope, auth, data, mutation, or command behavior was changed.

- [ ] Screenshot pixel matching, true computed CSS and interaction QA, TypeScript builds, tests and CI all remain unverified by owner policy.
- [ ] **Next file:** `src/components/admin/super-admin-student-bulk-access.tsx` (Super Admin first-third people/academic components), then `src/components/admin/super-admin-student-import-history.tsx`.


### Student bulk-access final source pass

| File | Old LMS / current value proof | Grep and responsive proof |
| --- | --- | --- |
| [x] `src/components/admin/super-admin-student-bulk-access.tsx` | `components___form.scss:110-112` 13px/600 selector labels; vNext Module and Access labels now `text-[13px] font-semibold text-body`, shared Select fields retain 10px radius, palette and focus (`components___form.scss:120-142`). Scrollable checkbox list uses `focus-visible:outline-primary`, semantically matching keyboard focus, rather than custom deep-teal override. | Raw controls `0`, hex `0`, inline styles `0`, Button 1/1, Select 2/2. Both selects min 44px on ≤767px phone and 36px ≥768px; selection grid one column mobile, two columns starting at 768px. API, max-25 selection, mutations and confirmation untouched. |
| [x] `src/components/admin/super-admin-student-import-history.tsx` — reviewed | Existing `Button`, shared `Drawer` and bounded scroll already use semantic tokens and 44px mobile action; no bespoke color/radius to replace. | Native controls `0`, hex `0`, inline styles `0`, Button 1/1; `md:min-h-9` matches old 768px tablet breakpoint. No source change warranted. |

**Grep:** `rg -o '<(button|input|select|textarea)\\b' <file> | wc -l` and `rg -o '#[0-9a-fA-F]{3,8}\\b' <file> | wc -l` => `0` for both files; shared tag counts match. **Responsive source:** `pages___admin-list-pages.scss:8,193` 44px phone/767px mobile ceiling, `globals.css:341` 36px normal control. Browser and functional validation remain pending.

- [ ] **Next file:** `src/components/admin/super-admin-people-csv-control.tsx`, then `src/components/admin/person-membership-actions.tsx`.


### Super Admin people role, onboarding and profile source check

| Completed file | Legacy source and exact property values | Source grep and responsive/behavior proof |
| --- | --- | --- |
| [x] `src/components/admin/person-membership-actions.tsx` | Suspension-reason form label at :342 uses 13px/600 body `components___form.scss:110-112`; shared `Dialog` / `Textarea` / `Button` and role `Checkbox` remain untouched. | Native controls `0`, hex `0`, inline styles `0`, `Button` 6/6. Role rows 44px phone and 36px from `md` 768px; existing dialog actions, confirm and disabled states preserved. |
| [x] `src/components/admin/person-onboard-dialog.tsx` | First/last/name/phone/email labels and role legends now 13px/600, matching form SCSS `:110-112`; shared Input / Checkbox / Dialog. | Native controls `0`, hex `0`, inline styles `0`, Button 3/3. Faculty Mentor checkbox row min-height 44px phone/36px ≥768px; form fields 1-column phone, 2-column tablet; onboarding/API unchanged. |
| [x] `src/components/admin/person-profile-dialog.tsx` | Learner/faculty detail field labels at `:255` onward changed from 12px to exact 13px/600; headings, shared Select/Input/Dialog unaffected. | Native controls `0`, hex `0`, inline styles `0`, Button 3/3, Select 1/1. Two-column form starts `md` ≥768px, one phone; responsive modal and edit permissions unchanged. |
| [x] `src/components/admin/super-admin-people-csv-control.tsx` — source-reviewed | Shared `Button` variant secondary, color/border/focus and 9px radius; file contains no standalone hand-rolled chrome to modify. | Native controls `0`, hex `0`, inline styles `0`, Button 1/1, already min-height 44px phone/`md:min-h-9` desktop and print:hidden. |

**Grep proof (GitHub branch read, no shell run):** `rg -o '<(button|select|input|textarea)\\b' <file> | wc -l` returns `0` in all four scanned files, `rg -o '#[0-9A-Fa-f]{3,8}\\b' <file> | wc -l` `0`, `rg -o 'style=\\{' <file> | wc -l` `0`. Opening/closing shared component counts match. 13px/600 labels are sourced from legacy `components___form.scss:110-112`, phone ≥44px `components___variables.scss:139`, 36px desktop `globals.css:341`, 768px layout threshold `pages___admin-list-pages.scss:193`.

- [ ] Browser computed-style visual diff, compile, tests, CI and real interaction/keyboard verification not performed (owner no-runtime instruction).
- [ ] **Next exact file:** `src/components/admin/scoped-membership-lifecycle-actions.tsx`, then `src/components/admin/admin-revoke-sessions.tsx`.


### Tenant membership and organization form source pass

| File | Legacy value/location | Scoped grep and responsive proof |
| --- | --- | --- |
| [x] `src/components/admin/scoped-membership-lifecycle-actions.tsx` | Suspension reason label :40 now 13px/600 `components___form.scss:110-112`, shared `Button`/`Input` and semantic alerts. | Raw visual controls `0`, hex `0`, inline styles `0`, Button 3/3. Existing full-width Input and default shared 36px control/touch tokens; confirmation, 500-char reason and lifecycle unchanged. |
| [x] `src/components/admin/organization-actions.tsx` | Organization edit dialog label :141 uses 13px/600 legacy SCSS typography, shared Input, Dialog and secondary/danger action chrome. | Raw controls `0`, hex `0`, inline styles `0`, Button 4/4. Dialog and controls retain inherited phone widths, focus and pending semantics. |
| [x] `src/components/admin/organization-create-form.tsx` | Create Organization label :64 uses 13px/600, shared field chrome (10px radius, 14px text), semantic `Alert` states. | Raw controls `0`, hex `0`, inline styles `0`, Button 1/1. Mobile column layout, desktop row at 768px; create action 44px mobile and 36px ≥768px. |
| [x] `src/components/admin/admin-revoke-sessions.tsx` — source-reviewed | Already uses shared action Button and muted helper/status text; no old-LMS palette/radius bypass found. | Raw controls `0`, hex `0`, inline styles `0`, Button 1/1; no custom mobile control geometry; confirmation and session revocation service unaffected. |

**Source grep:** `rg -o '<(button|input|select|textarea)\\b' <file> | wc -l` gives `0`, `rg -o '#[0-9A-Fa-f]{3,8}\\b' <file> | wc -l` gives `0`, `rg -o 'style=\\{' <file> | wc -l` gives `0` across these four files; opening/closing tags match. Legacy labels: `components___form.scss:110-112`, phone target minimum `components___variables.scss:139`, default 36px `globals.css:341` and 768px layout `old-lms-shell.css:73`.

- [ ] Browser screenshots, computed properties, typed build, tests and CI remain explicitly unverified.
- [ ] **Next file**: `src/components/admin/college-create-form.tsx` (Super Admin first-third tenant setup), followed by `src/components/admin/college-edit-dialog.tsx`.


### Super Admin college tenant forms / domain ownership source parity

| Completed file | Exact legacy label and surface value | Grep, control tags, responsive proof |
| --- | --- | --- |
| [x] `src/components/admin/college-create-form.tsx` | `:100,121,138` college name/code and other labels use 13px/600 from `components___form.scss:110-112`; optional address group keeps a separate white disclosure (not page wrapper); shared Input/Select/Button. | Raw visible controls 0, hex 0, inline styles 0, Button 1/1, Select 1/1. Create button 44px ≤767px/36px ≥768px (`md`); single column phone / existing responsive grid on desktop. |
| [x] `src/components/admin/college-edit-dialog.tsx` | `:139,146,164,182,200` all college edit form labels use 13px/600 while shared Dialog/Input and field chrome inherit 10px radius/teal focus from `components___form.scss:120-142`. | Native controls 0, hex 0, inline styles 0, Button 3/3. Action controls 44px phone /36px ≥768px; 1/2 column dialog responsive. |
| [x] `src/components/admin/college-admin-lifecycle-action.tsx` | Suspension reason label `:37` now 13px/600 (formerly 12px/500), preserving other lifecycle confirmation and audit states. | Raw controls 0, hex 0, inline styles 0, Button 1/1. Two explicit mobile 44px / desktop 36px controls. |
| [x] `src/components/admin/tenant-domain-manager.tsx` | Domain entry label `:188` 13px/600 as legacy form; separate DNS ownership record card deliberately retained as an object/policy evidence panel, not page wrapping. | Raw controls 0, hex 0, inline styles 0, Button 4/4. Four explicit 44px phone /36px ≥768px actions; domain creation form grid collapses to one column below md. |

**Equivalent greps on connected repository source (no app execution):** `rg -o '<(button|input|select|textarea)\\b' <file> | wc -l`, `rg -o '#[0-9A-Fa-f]{3,8}\\b' <file> | wc -l`, and `rg -o 'style=\\{' <file> | wc -l` each return `0` across all four files. Shared JSX `Button` and `Select` opening/closing counts match. Values: `components___form.scss:110-142` labels/radius/hover, `components___variables.scss:139` 44px phone, `globals.css:341` 36px desktop, `old-lms-shell.css:73` 767px maximum phone breakpoint. All API effects and tenant-scoped permissions unchanged.

- [ ] Browser screenshots, computed-style parity, TypeScript build, tests and CI remain open.
- [ ] **Next file:** `src/components/admin/college-branding-form.tsx`, then `src/components/admin/college-logo-uploader.tsx`.


### College branding, logo and sign-in (Super Admin) source closeout

| File | Exact value proof against old LMS | Grep / responsive and exceptions |
| --- | --- | --- |
| [x] `src/components/admin/college-branding-form.tsx` | Branding color/text form labels at `:150,184` now 13px/600 semantic `text-body` instead of 14px/500 (legacy `components___form.scss:110-112`); shared Input/Button and preserved right-column preview. | Native controls `0`, literal hex `0`, Button 1/1; **one dynamic inline style at :217** `style={previewStyle}` is intentionally retained for user-selected brand palette preview, not hard-coded global shell CSS. One-column mobile, preview splits at lg. |
| [x] `src/components/admin/college-logo-uploader.tsx` | Logo label and horizontal/vertical/zoom labels are 13px/600; heading uses `text-foreground` semantic heading token. Shared file input/Button and object preview radius remain. | Native controls `0`, literal hex `0`, Button 2/2; **one dynamic inline style at :88**, image `objectPosition` and `transform` are actual interactive crop coordinates, intentionally retained. Actions min 44px ≤767px, 36px ≥768px. |
| [x] `src/components/admin/college-signin-method-form.tsx` | Sign-in heading uses semantic foreground instead of inherited unspecified ink; selectable radio cards already have shared radio, white surface, 9px radius and focus. | Native controls `0`, literal hex `0`, inline styles `0`, Button 1/1. Radio row min-height 56px ≥44px, one-column layout and existing 44px phone/36px desktop action. |

**Grep proof from current branch source:** `rg -o '<(button|input|select|textarea)\\b' <file> | wc -l` = `0` for all three; `rg -o '#[0-9A-Fa-f]{3,8}\\b' <file> | wc -l` = `0`; `rg -o 'style=\\{' <file> | wc -l` = `1,1,0` respectively, both explained dynamic preview exceptions. Legacy 13px/600 labels: `components___form.scss:110-112`; control radius 9px `globals.css:343`; mobile action 44px `components___variables.scss:139`, at ≤767px `old-lms-shell.css:73`. No crop, signed storage, tenant branding save or sign-in mutation behavior altered.

- [ ] Pixel screenshots, computed CSS, local typecheck, functional tests and CI still unverified.
- [ ] **Next file:** `src/components/admin/college-branding-preview.tsx` (source-review dynamic branding canvas only), then `src/components/admin/tenant-settings-editor.tsx`.


### Tenant settings and branding preview source review

| File | Exact legacy alignment | Grep/responsive evidence |
| --- | --- | --- |
| [x] `src/components/admin/tenant-settings-editor.tsx` | Heading and settings group legends now `text-foreground`, group field labels 13px/600 token body (legacy `components___form.scss:110-112`); flat border-b sections, shared inputs and primary save. | Raw visual controls 0; hex 0; inline style 0; Button 1/1. All editable fields and save min 44px phone/36px from 768px, 1-column phone / 2-column tablet; danger confirmation retained. |
| [x] `src/components/admin/tenant-settings-other-keys.tsx` | Headings semantic `text-foreground`; Key/Value labels 13px/600 body; individual stored-key row uses `--lms-control-radius` 9px (`globals.css:343`) replacing `rounded-[8px]` literal. | Raw controls 0; hex 0; inline style 0; Button 2/2. All save/removal/field controls min 44px ≤767px/36px ≥768px, flex-wrap on phone. |
| [x] `src/components/admin/college-branding-preview.tsx` — reviewed unchanged | Separate stored-branding and color-preview object panels are intentionally differentiated from page canvas. Five inline style bindings are **dynamic chosen-college palette** presentations, not hard-coded legacy chrome; retaining them is required for accurate branding preview. | Raw controls 0; literal hex 0; **five** inline dynamic styles intentionally retained, no shared Button/Select tags. Panels flex-wrap/stack on phone. |

**Grep reproducibility (GitHub source scan only):** `rg -o '<(button|input|select|textarea)\\b' <file> | wc -l` => `0` for each; literal hex => `0`; `style={` => `0,0,5` with the last five purposefully exempt. Shared Button opens/closes `1/1`, `2/2`, `0/0` respectively. Control labels sourced `components___form.scss:110-112`, radius `globals.css:343`, 44px touch `components___variables.scss:139`, mobile breakpoint `old-lms-shell.css:73`.

- [ ] Browser-level pixel measurements, true runtime CSS and state interactions, compile, test and CI remain not run.
- [ ] **Next exact file:** `src/components/admin/college-feature-rule-editor.tsx` and `src/components/admin/descendant-feature-rule-editor.tsx`.


### 2026-10-20: source-only file pass — policy controls, Super Admin scoped directory and dashboard

This pass starts from the fetched current `origin/main` branch (fast-forwarded `chatgpt/chat-13-b` before writing). All changes are local **visual chrome**; the existing server contracts, page content, permissions, filters, confirmations and mutations remain. Source comparisons use `docs/design/legacy-styles/components___form.scss:110-142` (label 13px/600; field text 14px/400; field radius 10px; teal focus halo), `components___variables.scss:13,30-38,139` (teal subtle #eff8fa; border #e5e9f0; white #fff; touch 44px), `src/app/globals.css:21,30,327,341-345,866` (primary teal, tokens, 36px control, 9px control radius, 12px canvas radius, #fbfcfd form background), and `docs/design/old-lms-shell.css:23-25,73` (phone ≤767px, tablet ≥768px).

| Whole-file item | Legacy property/state → vNext property/state, source proof | Coverage/phone-tablet proof |
| --- | --- | --- |
| - [x] `src/components/admin/college-feature-rule-editor.tsx` | Stored policy label 13px/600 from form.scss:110-112 → line 74 `text-[13px] font-semibold text-body`. Shared `Select` and `Switch` carry default, selected, disabled/focus styling; shared `Button`, `Alert`, `ConfirmDialog` supply hover/error/pending; flat border section remains. | Native controls 0; literal hex 0; inline styles 0; Button 2/2 and Select 1/1. All explicit Select/actions `min-h-11 md:min-h-9` for 44px phone and 36px ≥768px; danger confirmation preserved. |
| - [x] `src/components/admin/descendant-feature-rule-editor.tsx` | All three scope/module/rule labels form.scss 13px/600 → lines 44,53,60 `text-[13px] font-semibold text-body`; lock checkbox text `text-body`, shared semantic focus/disabled controls. | Native 0; hex 0; inline 0; Button 2/2, Select 3/3. Six `min-h-11 min-[768px]:min-h-9` uses across controls, flex wrap on phone; locks and confirm unchanged. |
| - [x] `src/components/admin/student-rule-editor.tsx` | Student stored override label form.scss 13px/600 → line 70; shared `Select` enforces 10px field radius and focus on teal (form.scss:120-142); shared `Checkbox`, button and `ConfirmDialog` retain all states. | Native 0; hex 0; inline 0; Button 2/2, Select 1/1. Override field `min-h-11` ≤767px and `min-[768px]:min-h-9` ≥768px. |
| - [x] `src/components/admin/college-at-glance-panel.tsx` | Header uses `text-foreground` (globals.css:327); independent `StatTile` KPIs and existing `Skeleton`/error `Alert` handle empty/loading/error. No custom colors or radius. | Native 0; hex 0; inline 0; Button 1/1. KPI grid 1 column phone, 2 columns from 768px, 4 at xl; shared button target 44px phone. |
| - [x] `src/components/admin/college-closing-quizzes-card.tsx` | Heading semantic foreground; linked row action uses primary color and `focus-visible:outline-primary` on legacy teal `globals.css:21` with shared 2px/offset; flat border-top list, no extra nested card. | Native 0; hex 0; inline 0; Button 0/0; link 44px phone and 36px ≥768px. Existing empty state and IST date display untouched. |
| - [x] `src/components/admin/admin-dashboard-actions.tsx` | Separate actionable workspaces remain as the legacy-allowed object cards (`old-lms-pages.md:9`) with white `bg-surface`, `border-border` (variables.scss:30,37), `hover:bg-primary-subtle` (variables.scss:13), and now 2px `focus-visible:outline-primary`. | Native 0; hex 0; inline 0; link grid one column phone, 2 from 768px, then lg/xl as before. Disabled links remain non-interactive with muted surface. |
| - [x] `src/components/admin/admin-scoped-read-page.tsx` | All eleven field labels 13px/600 instead of 14px/600; shared input/select/button styles use default/hover/focus/disabled token sources. Summary is already border-y and divide-y; filters preserve status/refresh/empty/error. | Native 0; hex 0; inline 0; Button 2/2, Select 9/9. Form 1 column phone, 2 columns at 768px, 4 at lg; summary dividers also shift at 768px. |
| - [x] `src/components/admin/college-bulk-import.tsx` | Organization and CSV labels 13px/600, Import results heading foreground; `Textarea`, Select, Button, ConfirmDialog, Alert, DataTable preserve state and focus/disabled/validation. | Native 0; hex 0; inline 0; Button 3/3, Select 1/1. 44px action targets phone/36px ≥768px; field block wraps, textarea full width. |
| - [x] `src/components/admin/learner-module-access-drawer.tsx` | Search label 13px/600; heading and learner name foreground; scoped detail object cards use `--lms-control-radius` 9px in place of hard-coded `rounded-md`, white surface/border, with separate modules remaining separate objects. | Native 0; hex 0; inline 0; Button 3/3. Search 44px phone/36px ≥768px; list scroll bounded, Drawer shared layout; error/loading and confirmation preserved. |
| - [x] `src/components/admin/managed-college-subdomain.tsx` | Web address heading foreground; domain caption `text-body` and Subdomain label 13px/600; shared Input/Button/Dialog/Alert carry hover, focus, disabled, error. | Native 0; hex 0; inline 0; Button 2/2. Input/actions 44px phone, 36px from 768px, wrap on narrow screen. No alteration to wildcard DNS requirements or confirmation. |

**Grep evidence:** Branch source inspected for each full file; `/<(button|input|select|textarea)\b/g` = `0` all ten; `/#[0-9a-fA-F]{3,8}\b/g` = `0` all ten; `/style=\{/g` = `0` all ten. Reproduction: `rg -n '<(button|input|select|textarea)\b|#[0-9A-Fa-f]{3,8}\b|style=\{' FILE`. Shared `Button`/ `Select` opening and closing counts match in every file; self-closing Checkbox is an allowed shared UI component. Direct browser comparison and computed-style assertions were **not** run and must not be mistaken for source-level checks.

- [ ] **Not verified:** old-vs-new screenshot pixel comparisons, rendered phone/tablet proof, strict TypeScript build, browser focus/tap validation, tests and CI (owner requested no CI/no runtime).
- [ ] **Next file**: `src/components/admin/college-setup-checklist.tsx`, then other Super Admin first-third navigation and read-only small controls.
