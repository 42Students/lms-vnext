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
