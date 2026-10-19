# Chat-12 North Star sweep — TPO students, companies and first-third views

Owner: chat-12 · Branch: `chatgpt/chat-12-b` · 2026-10-19

## Binding reference and constraints
- `docs/orchestrator/queues/master-queue.md` (NORTH STAR), `docs/design/old-lms-shell-spec.md`, `old-lms-shell.css`, `old-lms-pages.md`, `vnext-vs-old-lms-gap.md` and `docs/design/legacy-styles/`.
- Preserve all page-specific content, section order, labels, forms, tables, state and behaviour; styling only. One outer white page canvas is supplied by the authenticated layout; do not create another.
- Inter; h1 30px/600/`#172033` supplied by shared `PageHeader`; primary actions solid `#0a7c88`, white text, 36px high, radius 9px. Prefer `Button`, `Input`, `Select`, `Textarea`, `PageHeader`, semantic Tailwind aliases and `var(--lms-*)`.
- Do not edit `src/app/globals.css`, `src/components/ui/**` (chat-17), `src/components/shell/**` (chat-19/chat-13), auth, backend, data models or tests. No test, typecheck, runtime, CI, or deployment execution on this lane.

## Pages inventoried (sweep each TSX file in scope)

### Students / placement roster and participation
- `src/app/(authenticated)/tpo/students/page.tsx`
- `src/app/(authenticated)/tpo/students/[membershipId]/history/page.tsx`
- `src/app/(authenticated)/tpo/students/[membershipId]/participation/page.tsx`
- `src/app/(authenticated)/tpo/students/preparation-plan/page.tsx`
- `src/app/(authenticated)/tpo/students/preparation-prep/page.tsx`
- `src/app/(authenticated)/tpo/students/requests/page.tsx`

### Company directory, sharing and CRM
- `src/app/(authenticated)/tpo/companies/page.tsx`
- `src/app/(authenticated)/tpo/companies/[companyId]/page.tsx`
- `src/app/(authenticated)/tpo/companies/[companyId]/contact-log/page.tsx`
- `src/app/(authenticated)/tpo/companies/[companyId]/feedback/page.tsx`
- `src/app/(authenticated)/tpo/companies/[companyId]/manage/page.tsx`
- `src/app/(authenticated)/tpo/companies/[companyId]/people/page.tsx`
- `src/app/(authenticated)/tpo/companies/archived/page.tsx`

### Batch eligibility / roster / bulk entry points (first-third routes)
- `src/app/(authenticated)/tpo/batches/page.tsx`
- `src/app/(authenticated)/tpo/batches/[batchId]/page.tsx`
- `src/app/(authenticated)/tpo/batches/[batchId]/classes/page.tsx`
- `src/app/(authenticated)/tpo/batches/[batchId]/history/page.tsx`
- `src/app/(authenticated)/tpo/batches/[batchId]/invitation-prep/page.tsx`
- `src/app/(authenticated)/tpo/batches/[batchId]/nudge-prep/page.tsx`
- `src/app/(authenticated)/tpo/batches/[batchId]/registrations/page.tsx`
- `src/app/(authenticated)/tpo/batches/[batchId]/registrations/[membershipId]/history/page.tsx`
- `src/app/(authenticated)/tpo/batches/[batchId]/reminder-prep/page.tsx`
- `src/app/(authenticated)/tpo/batches/[batchId]/rules/page.tsx`
- `src/app/(authenticated)/tpo/batches/[batchId]/students/page.tsx`

### First-third TPO landing/team
- `src/app/(authenticated)/tpo/page.tsx`
- `src/app/(authenticated)/tpo/home/page.tsx`
- `src/app/(authenticated)/tpo/find/page.tsx`
- `src/app/(authenticated)/tpo/more/page.tsx`
- `src/app/(authenticated)/tpo/team/page.tsx`
- `src/app/(authenticated)/tpo/team/[threadId]/page.tsx`
- `src/app/(authenticated)/tpo/team/everyone/page.tsx`

## TPO-owned page components to sweep (not shared UI)
- `src/components/tpo/tpo-students-bulk-add.tsx`
- `src/components/tpo/tpo-debar-control.tsx`
- `src/components/tpo/tpo-batch-facet-filters.tsx`
- `src/components/tpo/tpo-batch-student-bulk-notes.tsx`
- `src/components/tpo/tpo-batch-student-saved-views.tsx`
- `src/components/tpo/tpo-batch-instant-search.tsx`
- `src/components/tpo/tpo-batch-workspace-tabs.tsx`
- `src/components/tpo/tpo-batch-decision-control.tsx`
- `src/components/tpo/tpo-batch-inline-decision.tsx`
- `src/components/tpo/tpo-batch-rule-editor.tsx`
- `src/components/tpo/tpo-batch-undo-control.tsx`
- `src/components/tpo/tpo-team-forms.tsx`, `tpo-team-search.tsx`, `tpo-team-away-form.tsx`, `tpo-team-rename.tsx` and related `tpo-team-*.tsx` presentation files under the same directory.
- `src/components/placements/tpo-company-trust-switch.tsx` and company-facing CRM controls used by these routes.

## Findings and edit protocol
1. A number of routes render `rounded-xl border border-border bg-surface p-4/p-6` around entire page content or loading/error states. Remove only redundant *outer* box treatment; preserve genuinely separate panels, alert regions, grouped tables and interactive states.
2. Existing inline form controls sometimes use `rounded`, `rounded-md`, `min-h-11`, `text-[var(--lms-teal-deep)]`; normalize controls to shared 9px/36px primitives or semantic tokens without losing form labels or accessible focus treatment.
3. Replace literal colour utilities such as `text-[#172033]` and bare one-off radius/shadow/typography classes with semantic aliases; retain semantic warning/error variants.
4. Make header and primary CTA styling consistent with the global shell. Do not duplicate the shell search/new/notification bar within a page.
5. Audit HTML/JSX syntactic balance by static inspection only; no execution. Keep optional loading/empty/denied UI and all authored test identifiers intact.

## Execution log
- 2026-10-19: Created inventory on the fast-forwarded lane branch, before editing page components.
- Batch results will be recorded only after verified GitHub commits.

## Verified source-edit summary (GitHub branch, not a browser visual diff)
- Fast-forwarded this branch from its pre-sweep ancestor to `main` before any edits (no force push).
- Source commits on branch above baseline at this checkpoint: **120**, behind main: **0**; distinct changed files: **117**.
- Changed TPO route files: **60**, including student rosters, company CRM, batch eligibility, team and first-third landing, plus corresponding error/loading states.
- Changed TPO-specific component files: **56**; placements-specific company controls: **0**.
- Newly covered routes outside the initial inventory: `src/app/(authenticated)/tpo/companies/[companyId]/team/page.tsx`, `src/app/(authenticated)/tpo/team/company/[companyId]/page.tsx` (audited; no changes required), and relevant error/loading variants.
- Newly covered first-third/roster components: `tpo-students-spreadsheet`, `tpo-students-bulk-debar`, `tpo-students-assign-prep`, `tpo-student-saved-views`, `tpo-student-nudge-panel`, `tpo-student-note-editor`, `tpo-student-quick-panel`, `tpo-timed-debar-control`, `tpo-student-clipboard-actions`, `tpo-bulk-action-panel`, `tpo-bulk-action-preview`, `tpo-roster-verification-bulk`, `tpo-spreadsheet-grid`, `tpo-grid-filter-panel`, `tpo-grid-column-chooser`, `tpo-academic-import-preview`, `tpo-academic-import-workspace`, `tpo-batch-class-decision`, `tpo-batch-lifecycle-control`, `tpo-batch-invitation-control`, `tpo-batch-eligibility-import`, and TPO company/team presentation controls.
- Replaced literal link colours with `text-link`, literal heading colour with `var(--lms-heading)`, small custom radii with the shared 9px radius, old-LMS panel radii with 12px, and 44px overrides on button/form controls with 36px defaults where appropriate. Kept `rounded-full` on pills and chart bars. Preserved table structures and all page content and interaction paths.
- Removed two redundant top-level card wrappers from the Home disabled-module and Companies invalid-filter states; did **not** flatten independently bordered alerts, grids, popovers or content panels.
- Fixed company CRM workspace h1 to 30px/600, local button height to 36px, and dropdown shadow to the corresponding shared legacy token.

## Verification limits / handoff
- Source edits have been accepted as GitHub commits on `chatgpt/chat-12-b`; no code, TypeScript compiler, tests, CI, dev server, screenshot capture or browser interaction was run, per lane instruction. Syntax was preserved by targeted class/attribute edits, but compile validity and pixel-exact appearance remain unverified.
- No shared shell/UI/globals files, tests, data structures or placement business logic were modified by this sweep. Pixel-level review against the running old LMS is reserved for the orchestrator's final visual pass.

## Continuation: 2026-10-19 second-pass, adjacent portals (source review only)

After the initial sweep and its merge into main, fast-forwarded `chatgpt/chat-12-b` to `ee98b58c86df02c0513136baab6d35ef633fef59` (the then-current main). Opened the remaining inventory entries and the adjacent `north-star-sweep-chat-11.md` (TPO settings, College Admin setup, Super Admin tenants) and TPO report routes for a second pass. No shared shell, global CSS, UI-kit or business logic edits.

### Second-pass changes
- Fixed the malformed `rounded-[var(--radius)]-lg` utility and redundant responsive control minimum on the TPO team page.
- Applied the canonical `--lms-control-radius` (9px), `--lms-canvas-radius` (12px), `--lms-heading` and semantic `text-link` styling across TPO settings pages and their TPO/placements-specific editors and navigation. Kept actual content cards and brand-preview UI distinct.
- Checked College Admin setup, branding and college role/academic pages. Removed stray standalone `-` Tailwind class tokens from existing section class strings in setup, academic directory, cohort, faculty, people, activity, lecture hall and related presentation components. These are exact class-string corrections, not JSX restructures.
- Applied remaining canonical card-radius classes to College Admin branding/preview, college dashboard and Super Admin tenants, readiness, module access, features, course progress and settings views. Kept intentional preview shadows, mobile outlines and status semantics intact.
- Took the adjacent TPO Reports portal through a source-only second pass, covering report summary, branches, companies, CTC, pipeline, placed/unplaced, accreditation, offers, joining, feedback categories, intelligence, `[slug]` and per-route error fallbacks. Replaced leftover literals and non-token radius variants only; report contents and data transformations were preserved.

### Branch and verification at log checkpoint
- Commits ahead of latest `main`: **26**; behind latest `main`: **289**; currently modified files in this continuation: **26**. Changes by area: TPO settings **0**, TPO reports **26**, admin routes **0**, college routes **0**, TPO components **0**, other components **0**.
- The lane branch fast-forwarded cleanly when this continuation started; meanwhile other parallel lanes advanced `main`, so this branch diverged again. No forced update, merge rewrite or changes to `main` were made. Integrate latest `main` by a normal three-way merge when coordinating lane branches; the only overlapping file noticed at an intermediate comparison was `src/components/placements/placement-season-manager.tsx` (small token change here, independent change on main).
- Source-only class edits preserve line structure, JSX components, conditions, events and imports. No application runtime, compiler, tests, CI, pixel diff or browser interaction executed. Pixel parity and strict TypeScript compilation remain to be verified by the orchestrator.

### Follow-through: TPO Reports → coordination → Placements/Drives source pass
- Reviewed the next TPO portal surfaces in `docs/orchestrator/ui-ux/pages-tpo.md` and adjacent completed NORTH STAR sweeps. Adjusted the report main/individual pages and error states, as well as TPO Calendar/export/interview rounds, Audit, Verification, Notifications, Follow-ups, Announcements, Requests, Messages, Recruiter Campaign drafts/preview and Profile.
- Carried a further source-level token consistency pass through TPO placement overview/lifecycle, new/recorded-outside, job workspaces, applicants, round results, schedules, offer/letters/joining, closeout, selection, sharing and drive-day. Route implementations already inheriting shared styles were left unchanged. Local TPO-specific supporting components were audited and adjusted only where matching mismatches existed.
- Respected intentional standalone object styles (pills, branded previews, grouped table boxes, overlays) rather than deleting their content structures. Most changes were narrow replacements of literal `rounded-[9px]` with `rounded-[var(--lms-control-radius)]`, literal `rounded-xl` with the 12px canvas/card token, legacy heading `#172033` with `var(--lms-heading)`, and link literals with semantic `text-link`.
- Current unmerged delta at this checkpoint: **26 commits ahead**, **613 behind**, **26 changed files**; changed-file groups Reports: 0, Placements/drives: 20, Other TPO routes: 1, TPO components: 5. Parallel lanes continued merging into `main` while this one authored commits. Do not force-update the branch; perform a normal merge/reconciliation of `main` before the orchestrator merges further.
- Source changes only; no tests, TypeScript checker, app execution, CI, browser screenshot or pixel comparison. Audit mark means **source-inspected/changed**, not runtime-certified.

## Continuation — chat-12 focused third-pass source styling (2026-10-19)

- Fast-forwarded `chatgpt/chat-12-b` cleanly to then-current `main` at `f7dd3e81786adf00538daebf63a075046d159b4c` before editing; no force update and no writes to `main`.
- **30 verified styling commits across 30 unique route/component files**, all prefixed `[chat-12]`; GitHub source writes only. Changes include:
- find/page.tsx, find/error.tsx, batches/page.tsx
- tpo-team-forms, tpo-team-rename, tpo-team-search, tpo-team-message-actions
- tpo-students-bulk-add, tpo-student-quick-panel, tpo-students-drive-visibility, tpo-student-saved-views, tpo-student-nudge-panel, tpo-student-note-editor, tpo-timed-debar-control
- tpo-batch-rule-editor, tpo-batch-facet-filters, tpo-batch-workspace-tabs, tpo-batch-student-saved-views, tpo-batch-student-bulk-notes, tpo-batch-instant-search, tpo-batch-decision-control, tpo-batch-inline-decision, tpo-batch-invitation-control
- tpo-company-create-form, tpo-company-visibility-editor
- tpo-grid-column-chooser, tpo-spreadsheet-grid, tpo-grid-filter-panel, tpo-bulk-action-preview, tpo-inbox-search
- Collapsed TPO finder search-result cards into one bordered list per result category with hairline row dividers; switched its error fallback to the shared secondary `Button`. Retained results, route links, form state, and ARIA semantics.
- Removed duplicate `Select`/`Button` styling on batch directory controls to inherit shared 9px/36px component behavior. Normalized first-third TPO roster/student/company/batch/team editor actions to 36px, using `--lms-control-radius` (9px) and separate content surfaces using `--lms-canvas-radius` (12px).
- Preserved semantic pill styles, independent dialog/panel content, grouped tables, checkbox/touch targets not explicitly targeted, conditional renders, and all interaction/state behavior.
- Applied source-level assertions on each changed token occurrence, examined closings for truncated `</Select` tags, and avoided bracket/cast edits. **No TypeScript compiler, tests, CI, dev server, browser/pixel diff or runtime execution**. Compile and visual parity remain unverified.
- Branch relation at tracker write: **ahead `30`**, **behind `0`** relative to current `main`; main may continue advancing concurrently, so use regular merge/reconciliation, never force-update.

### Fourth-pass completion — batch/roster and first-third fallback details

- **18 additional verified source commits** after the 30-commit checkpoint, for **48 unique source files changed** since the latest fast-forward (plus this tracker). All commit prefixes are `[chat-12]` and branch is `chatgpt/chat-12-b` only.
- Batch/class eligibility, lifecycle controls and CSV eligibility import; student spreadsheet export, bulk debarment, preparation assignment, bulk profile verification, clipboard actions, and whole-view bulk action panel now use the canonical control-radius and canvas-radius tokens. Kept independent panels and checkbox/touch rows rather than flattening meaningful content areas.
- First-third TPO error fallbacks for batch list, batch-student eligibility grid, batch-history, students, company listing/detail, individual student history and team now use shared retry styling where native buttons existed and the canvas-radius token on bordered error panels. No failure wording or behavior was changed.
- Team asks action controls and confirmation panel normalized, preserving stateful confirmation and role guards.
- Read `docs/design/legacy-styles/README.md`, `components___button.scss`, `components___form.scss`, `components___listing-page-header.scss` along with NORTH STAR and extracted exact old TPO shell rules. Preferred measured 36px/9px TPO control rules where broader legacy SCSS variants differ by module.
- Source-only replacements with exact occurrence checks; `<Button>` opening/closing counts verified for newly converted fallbacks; no truncated `</Select` introduced. No compiler, tests, CI, application execution, browser or visual comparison was run. Strict TypeScript compile and pixel parity require the orchestrator's final check.
- Branch comparison immediately before tracker write: ahead `49`, behind `436` relative to `main`. Other lanes may advance concurrently. Do not force-update.

## Next North Star continuation — merged main and 50 more source commits (2026-10-19)

- **Sync first:** existing chat-12 branch had diverged. Compared its 49-file delta against `main`, identified five overlapping Team components, reconciled each to the newer main implementation, then merged commit `a98732e8ad1845a88229c57ba38c4a90f02eca77` into `chatgpt/chat-12-b` with merge commit `996b048951e794b769d87a263bda12fae091bc2d` (PR #182 targeting chat-12). The base branch `main` was never modified. No force push.
- **50 new styling commits** after the merge, all prefixed `[chat-12]`, covering:
  - TPO batch/student: eligibility and registrations pages, class decisions, batch history, student selection keyboard actions, student placement and participation history, academic import preview/workspace, shortcut/search, safe CSV export, debarment and preparation planning, error and loading fallbacks.
  - TPO companies: archived list, linked people, contact log, feedback, company team conversation/composer and CRM memory surfaces; company-level errors and visibility actions.
  - TPO team: everyone/team/thread pages, asks and follow-up controls, thread error fallback, reconciled message/rename/create forms with the newer shared `Button`/`Input`/`Select`/`Textarea` components.
- Replaced remaining hardcoded `rounded-[12px]` and `rounded-[var(--radius)]` cases in these files with `--lms-canvas-radius` for distinct panels and `--lms-control-radius` for controls/links. Set specific action rows formerly forced to `min-h-10` or `min-h-11 sm:min-h-9` to the measured 36px control height, without changing checkboxes' independent mobile touch rows or content order.
- Swapped native Retry buttons to the shared secondary `Button` on TPO registration, batch-rules and company-person error states. Other error panels received the canonical radius. Preserved existing user-facing copy, filters, data flow, conditional states, accessibility attributes and behavior.
- **Source-only checks:** exact old/new occurrence assertions for each edit; trailing malformed `</Select` check; JSX closing-tag count checks on page work; `<Button>` opening/closing balance on fallback conversions. No application execution, no TypeScript typecheck, tests, CI, browser, deployment or screenshots.
- **Snapshot before this tracker write:** relative to moving `main`, `106` commits ahead, `198` behind, `93` changed files including this tracker (42 TPO route files, 50 TPO component files, one documentation file). Concurrent lanes have continued to update `main` since the sync; reconcile using a normal merge before orchestrator integration, not a forced branch update.

### Follow-up: five core TPO portal pages

- Added **five further** `[chat-12]` commits after the 50-commit post-merge batch: `/tpo/more`, `/tpo/home`, `/tpo/companies`, `/tpo/companies/[companyId]`, and `/tpo/students`.
- Applied 12px canonical canvas/card radius to distinct home, shortcut, company listing/detail and student directory panels, while changing native controls, list action links and filter fields to 9px canonical control radius. Distinct student-directory filter `details` and metrics blocks retain grouped-surface treatment. All existing company CRM layouts, roster filters, search bindings, CTA semantics, chart bars and tabs remain intact.
- This continuation totals **55 verified source commits following the main merge**, with exact text-occurrence checks and JSX closing-tag counts per edit. No compiler, CI, tests, dev server, runtime or browser used.
- Live branch comparison before this audit commit: **ahead `112`, behind `198`, changed files `98`** versus moving `main`. Any further main integration must preserve all chat-12 source commits and use a normal merge.

- **Linked company contact form follow-through:** `src/components/placements/tpo-company-person-editor.tsx` now uses the measured 36px control height on all select/input/save controls and semantic `text-on-primary` for its primary CTA. The TPO company trust switch was inspected and already retained a purposeful mobile touch-target height; no change was necessary.
- This makes **56 verified post-merge source commits** in this continuation. Branch relation at this final source checkpoint: **ahead `114`, behind `198`, 99 changed files** relative to moving `main`; no forced updates, no CI or runtime execution.

## Continuation — origin/main sync and remaining TPO roster/company visuals (2026-10-19)

- Read the latest branch and `main` comparison: branch was ahead 115 and behind 198 at start. Two conflicting files (`tpo-team-ask-panel.tsx`, `tpo-team-message-actions.tsx`) were reconciled with main's newer shared `Button` components, then **merged `main` into chat-12 with commit `a6678c732289a187462c78b931fa50f616440945`** via PR #183. The PR base was `chatgpt/chat-12-b`; there were no writes to `main`, no force-push, and no lost authored TPO content.
- **34 new post-merge `[chat-12]` source-edit commits** (plus pre-merge reconciliation, merge and this audit record) were pushed one file per commit. Changes covered:
  - Team: role-safe ask and message controls, away status, handover, follow/mute and unowned assignment UI. Kept newer main's shared `Button`, `Input` and `Textarea` component usage and applied 36px old-LMS action sizing.
  - Roster/bulk: batch undo, student selection CSV toolbar, compact spreadsheet controls and empty state, student quick-panel detail cards, bulk-action subpanels, saved views, company create-review panel, roster verification presets/results and debarment border tokens.
  - Old-LMS tabs: `tpo-batch-workspace-tabs.tsx` now uses the active teal bottom rule instead of pill-style tabs, retaining tab labels, counts, routes and `aria-current`.
  - Loading/error: batch-workspace error Retry uses shared secondary `Button`; TPO companies, company detail/contact log/people/feedback/archived/manage, students, requests, participation, placement history, team and More-page skeletons use canonical 12px content radius. Duplicate loading wrapper padding was removed so authenticated page canvas remains single-surface.
- **Static validation only:** exact token occurrence checks, JSX closing tag counts kept stable, `<Button>` open/close pairs checked when refactoring Retry controls; no malformed `</Select` close introduced. No code runtime, Next.js dev server, TypeScript compiler, unit tests, CI, lint, browser screenshots or deployment were run, as instructed.
- Final pre-log branch comparison to `main`: ahead **154**, behind **0**, distinct changed files **121** (64 TPO route files, 55 TPO components and 1 placements component; plus this audit document). Pixel-exact parity and strict-clean TypeScript validity remain unverified until the orchestrator's final checks.

## Continuation — merge 2026-10-19 main and finish next 40 TPO styles

- **Synced first with the latest `main` at `7a059f2734f76a3b7d75842fd94aa6e2e3d6d635`**. Previous branch diverged by 40 ahead / 722 behind. The automatic PR #184 merge was conflicted across many concurrently edited TPO files. Used an explicit two-parent Git merge `f613fa28fa6efcdffc0d5781a0b8d5a835a3dbfd` (parents old chat-12 and the selected main head), with the latest main tree and retained chat-12 audit history. Reapplied each last-batch chat-12 file only when that file's blob in main was byte-for-byte unchanged from pre-sync main (`10ac677d5ab403f3c037d559c3321ac55c6cffa6`); adopted newer main content for divergent files. No forced ref update or writes to `main`.
- **40 additional `[chat-12]` source commits** after the merge: TPO audit grid and saved views, keyboard/accessibility triggers, selected candidate review queue, due follow-up workspace (including white-on-teal CTA), shared batch workspace tabs with teal active underline, roster verification presets/results, student quick panel; blocked dates, prep percentage, notice audience, communication settings, trusted domains, drive request review, campaign send/compose, notice read progress, drive draft creation; job types, after-college individual/bulk outcomes, outcome labels, prep readiness, notice schedule/acknowledge, new follow-up modal; TPO More and batch-error panels, rules/registration/history/student/search error panels, search and batch loading copy, and private Team thread fallback.
- **JSX syntax discipline:** all file edits were class/string/attribute-only. For **every touched TSX file** compared the ordered sequence of opening and closing JSX tag names before/after, including exact `</Select>` protection, so no tag was renamed, truncated or unbalanced by this sweep. All substitutions were asserted to exist before writing. This static validation does **not** substitute for TypeScript compilation or visual review.
- Kept page content, filters, links, API behavior, permissions, messaging workflow and responsive checkbox touch targets intact wherever possible. Source-only. **No CI, lint, dev server, tests, compiler, runtime or browser**.
- `main` continued receiving other lanes' commits during this 40-commit pass. The next batch must merge the latest main again before edits, reconcile conflicting content conservatively, and never force-update chat-12.


## Continuation — sync current main and migrate remaining native controls (2026-10-19)

- **Main synchronization first:** compared `main` (`8049636671c97d9e4ef6476e2d41f219ab3d3fa4`) against `chatgpt/chat-12-b`; the only overlapping branch/file deltas were `tpo-draft-drive-step-one-form.tsx` and `tpo-drive-request-actions.tsx`. Reconciled those files to newer main source in two `[chat-12]` commits, then merged **main into only this lane branch** with PR #185 and merge SHA `25286e6446ee2e21f9a928795fbe2a9665e1222e`. No force update or write to main.
- **37 additional source-edit commits** after that merge, one TPO-owned component per commit, all prefixed `[chat-12]`:
  - Student roster and bulk actions: debar, assign prep, notes, debounced search, drive visibility, message nudges, saved views, spreadsheet controls, bulk add, selected-review grid and column controls, spreadsheet filters, quick copy/paste, entire-view bulk workflow, verification and preview.
  - Batch rules/eligibility: class decision, batch-level decision, batch search, rules, lifecycle, keyboard selection, individual eligibility override, bulk eligibility CSV import, facets, invitations/reminders, and batch saved views.
  - Companies and Team: company visibility, create form, memory workspace, company Team composer and conversations; Team search, decision toggle, ask panel, message actions, renaming, and conversation details.
- Native long-class buttons, selects, textareas and text/search fields were moved to `Button`, `Select`, `Textarea`, and `Input` supplied by shared UI; primary actions inherit white-on-teal 36px/9px skin, while secondary/ghost buttons retain their intended visual hierarchy. Kept purpose-built native checkbox/radio/file inputs, segmented content borders and mobile touch rows where those are functional. Preserved page text, table content, routes, event handlers, API calls, permissions, selection logic, clipboard and bulk action safety.
- Fixed duplicated shared Button/Input imports in `tpo-team-rename.tsx` and duplicated shared Button import in `tpo-team-thread-details.tsx` (source TypeScript hygiene). Source modifications verified with exact occurrence assertions, opening/closing JSX tag counts, a malformed `</Select>`/`</Button>` check, and follow-up reads of the newly edited components.
- **Verification is source-only.** No tests, TypeScript compiler/typecheck, lint, CI, application execution, browser or screenshot comparison was run. This pass does not claim compile or pixel-exact parity, which awaits the orchestrator's final checks.
- Latest source comparison before this log: `chatgpt/chat-12-b` ahead **122** and behind **0** relative to `main` at `8049636`; no changes were pushed to `main`.

### Additional first-third TPO form and canvas cleanup — same session

- **Eight more [chat-12] source commits** after the 37-commit batch above, bringing this session to **45 source component commits**. Finished `tpo-student-quick-panel.tsx` (shared prev/next navigation and old-LMS underline tab controls), `tpo-selected-review-queue.tsx`, `tpo-timed-debar-control.tsx`, `tpo-everyone-controls.tsx`, `tpo-spreadsheet-grid.tsx`, `tpo-participation-decision-form.tsx`, `tpo-academic-import-workspace.tsx`, and `tpo-academic-import-preview.tsx`.
- Continued removing native buttons/selects/textareas with long styles; kept native checkboxes and the file-upload input. Removed redundant outer white cards in academic CSV import/preview so the one page canvas remains primary. Kept workflow copy, eligibility safety checks, keyboard behavior, table content, routes and server mutations unchanged.
- Re-fetched all eight component files and verified shared import uniqueness and intact JSX closing tags. Source review only; no run, typecheck, tests, lint, CI or pixel comparison.


## Legacy old-LMS shell continuation — 2026-10-19, follow-up owner batch

- **Upstream first:** `main@3de148112368b7201378f721841a5d4348ec9f6d` was ahead of lane 12 by 1086 commits, with no lane-only commits. Merged `main` into **chatgpt/chat-12-b only** through PR #186, merge SHA `1090bb934bf96890736110d67659ab32fc7d1906`, before all subsequent edits. Never pushed to main.
- **51 [chat-12] source commits since that merge** across **50 TPO source files**: 30 route pages and 20 scoped TPO components. One component (`tpo-students-bulk-debar.tsx`) received a second commit to finish remaining native buttons/selects/textarea after the initial input replacement.
- **Roster and bulk workflows:** share old-LMS Checkbox / Radio / Input / Select / Textarea / Button styling in the student spreadsheet, bulk add, debar, nudges, saved views, verification, keyboard actions, facets, eligibility imports, batch controls and Team company messaging. Native hidden/file fields are retained where appropriate. User inputs and mutations are unchanged.
- **Page anatomy:** flattened ordinary TPO filters, registration and eligibility panels into border-bottom sections of the existing single white canvas; removed duplicate outer white cards on company filters, classes, batch rule/status areas, student history, and archived directories while preserving intentional distinct-object cards (Home Next up, company entities, report tiles). Converted availability/review notices to slim pale/teal left-rule banners; normalized Team active tabs and compact status chips. Reused existing `--lms-*` tokens and hover/focus behavior instead of local hard-coded color and radius overrides.
- **Route coverage:** `/tpo/students` plus requests, preparation and individual history; `/tpo/companies` plus archived and detail/contact/feedback/people/Team subviews; `/tpo/batches` plus classes, decisions, registrations, history, rules and roster; Team conversations and Everyone; Home, Requests, Verification, Notifications, Calendar, Reports, Follow-ups and Find. Page copy, table columns, route links, permissions, audience scope and workflows retained.
- **Static source checks:** re-fetched all 50 modified files and inspected for duplicate exact imports, truncated shared-component closing tags and excess Select/Button closing tags. All checked files passed these source-level checks. These checks are **not** a parser, TypeScript compile or pixel screenshot validation.
- **No runtime execution:** per owner direction, no tests, typecheck, lint, CI, server run or screenshot comparisons. Visual parity and full strict TypeScript compilation must still be verified by the owner/orchestrator at the final integration gate.
