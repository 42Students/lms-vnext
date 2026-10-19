# chat-2 — old LMS North Star visual sweep (2026-10-19)

## Source of truth
`docs/orchestrator/queues/master-queue.md` NORTH STAR; `docs/design/old-lms-shell.css`, `old-lms-shell-spec.md`, `old-lms-pages.md`, `vnext-vs-old-lms-gap.md`, and `legacy-styles/`.

Scope is **page shell and shared visual skin only**: retain the existing TPO page content, wording, data access, interactions, and section order. Global canvas, top bar and sidebar are maintained by other lanes. Never add a nested full-page card.

## Pages in this lane
- [x] `/tpo/calendar/interviews`
- [x] `/tpo/calendar/rounds`
- [x] `/tpo/drive-day` and `/tpo/drive-day/[roundId]` (TPO branch only)
- [x] `/tpo/placements/schedule-conflicts`
- [x] `/tpo/placements/jobs/[jobId]/interview-slots`
- [x] `/tpo/placements/jobs/[jobId]/candidate-schedule`
- [x] `/tpo/placements/jobs/[jobId]/rounds`
- [x] `/tpo/placements/jobs/[jobId]/rounds/[roundId]/results`
- [x] `/tpo/placements/jobs/[jobId]/rounds/[roundId]/slots`
- [x] `/tpo/recruiters/campaigns`
- [x] `/tpo/recruiters/campaigns/[batchId]`
- [x] `/tpo/recruiters/campaigns/drafts/[campaignId]`
- [x] `/tpo/recruiters/campaigns/new`
- [x] `/tpo/recruiters/campaigns/preview`
- [x] `/tpo/settings/public-link`
- [x] `/tpo/settings/public-page`
- [x] `/tpo/settings/recruiters`
- [x] `/tpo/settings/team`
- [x] `/tpo/settings/trusted`

## Supporting components
Calendar, rounds and slots: `src/components/placements/tpo-round-calendar-control.tsx`, `tpo-interview-reschedule-form.tsx`, `tpo-round-result-entry-form.tsx`, `tpo-round-results-import.tsx`, `tpo-round-apply-control.tsx`, `tpo-round-drive-day-read-only.tsx`.
Campaigns: the components imported by the five `/tpo/recruiters/campaigns` routes.
Public and people: `src/components/placements/tpo-recruiter-grant-controls.tsx`, `tpo-trust-toggle.tsx`, `tpo-public-placement-toggle.tsx`, `tpo-public-placement-content-editor.tsx`, `src/components/tpo/tpo-public-join-link-card.tsx`.

## Visual audit rules
- Single inherited white page canvas on `#f1f4f9` shell. Ordinary sections use whitespace or `border-border` hairlines, not a second large white card.
- Heading `h1` uses 30px / 600 / `#172033`; Inter body typography.
- Primary controls use shared `Button`/design tokens: `#0a7c88` background, white text, 9px radius, 36px desktop height.
- Inputs, selects, textareas, active tabs, badges and tables inherit shared components and variables; avoid raw palette, arbitrary radii, and unscoped shadows.
- Keep touch hit areas at least 44px on small viewports; use reduced-motion-compatible transitions.
- No runtime or CI (owner will validate after all lanes finish). Mark a row only after source review and edit; screenshot parity remains unverified until owner visual diff.

## Additional source-reviewed routes
- [x] `/tpo/calendar/export`
- [x] `/tpo/drive-day/[roundId]/no-shows`
- [x] `/tpo/placements/jobs/[jobId]/drive-day`

## Source changes and verification notes
- Source-only sweep: 32 production TSX files modified, alongside this tracker; 60 commits at the first comparison checkpoint, with one final tracker commit following it. All commits are prefixed `[chat-2]` and were written only to `chatgpt/chat-2-b`.
- Migrated textual, search, date and select fields to shared `Input`, `Select` and `Textarea`; checkboxes and radios use the shared accessible primitives. Converted primary operational actions to `Button` while preserving handler, confirmation, and disabled props.
- Tokenized arbitrary 9px/bare radii and noncanonical 20px card paddings; converted redundant row/stat-card backgrounds into thin dividers inside the inherited white page canvas. Left real list/table boundaries and distinct operational panels intact.
- Post-edit source scans of the selected routes and supporting components found no raw hex colours or unskinned primary button text, and no unapproved `rounded-md/lg/xl` or palette utility classes in the checked source. Remaining native outlined/tertiary buttons use existing shared token classes; raw file inputs were upgraded to the shared input primitive.
- Static post-edit JSX sanity inspection across all 32 changed TSX files: no malformed shared-control closing tags, unmatched capitalized Button/Select pairs, or missing imports detected. This is **not** a TypeScript parse or typecheck.
- While this lane ran, main progressed by 216 commits beyond the merge base. The sole overlapping file, `src/components/placements/tpo-round-results-import.tsx`, was reconciled to the latest main preview radius. The newer main history is **not merged** into the lane branch: the available connector lacks a safe non-PR branch merge operation; orchestrator integration remains required.
- **No** Next.js app, syntax compiler, typecheck, tests, screenshots, CI or deployment executed. Runtime exact pixel parity and TypeScript verification are still for the orchestrator/owner.

## Progress
- [x] Brought `chatgpt/chat-2-b` up to then-current `main` via fast-forward (branch had no unique commits).
- [x] Read NORTH STAR reference and inspected the listed initial TPO page/component sources.
- [x] Page-by-page source sweep and supporting component sweep (source-only; no runtime assertions).
- [ ] Owner-run visual screenshot verification (intentionally not run by this lane).

## Continued sweep — chat-2 (2026-10-19)
- [x] `src/components/placements/tpo-round-reorder.tsx` — primary/secondary shared buttons and divider-style reordered rows
- [x] `src/components/placements/tpo-calendar-followup-actions.tsx` — shared `Input`, `Select`, `Button` with complete JSX closing tags
- [x] `src/components/placements/tpo-week-hour-calendar.tsx` — shared date/search/select/message controls, canonical popup and calendar radii; custom grid cell buttons deliberately retained
- [x] `src/components/placements/college-interview-appointments.tsx` — shared primary/secondary buttons and textarea with canonical 9px radius
- [x] `src/components/placements/tpo-round-drive-day-read-only.tsx` — flat hairline-separated progress summary instead of redundant cards
- [x] `src/components/tpo/tpo-team-away-form.tsx` — shared date field, primary/secondary buttons and canonical radius
- [x] `src/components/tpo/tpo-team-handover.tsx` — shared selector, white-on-teal handover button and error token
- [x] `src/components/tpo/tpo-team-forms.tsx` — shared selector/input/textarea/checkbox/buttons; removed inner form card
- [x] `src/components/tpo/recruiter-invite-landing.tsx` — literal radii replaced with the control token
- [x] `src/components/tpo/tpo-communication-settings-editors.tsx` — remove legacy fallback radius literals

**Main integration:** latest `main` at `a5d88d7cdfce161100ec7233f1d009e8e5b199d4` was merged into `chatgpt/chat-2-b` in commit `adf89b77`, keeping the lane ledger, required shared `Button` imports and round-preview radius. Only the lane branch was updated.

**JSX integrity check:** every changed file was re-read from the pushed branch. Shared `<Select>` and `<Button>` opening/closing counts match; no truncated `</Select`, `</Button` or `</Textarea` closing tags, no obsolete `</select>` after component conversion, and no missing shared-component imports were found in the inspected files. Self-closing `Input`, `Textarea` and `Checkbox` fields stay self-closing. No application code, TypeScript compiler, tests, screenshots or CI were executed; integration/visual validation remains for the owner.
