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
