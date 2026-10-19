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

## Further TPO settings, team and announcements sweep (2026-10-19)

Fast-forwarded lane branch from `323ed01f` to then-current `main` `f7dd3e81786adf00538daebf63a075046d159b4c` before modifying source. Branch: `chatgpt/chat-2-b`; all ensuing commits prefixed `[chat-2]`.

Completed source-file work:
- [x] `src/components/tpo/tpo-team-assign-unowned.tsx` — shared `Select` and `Button`, control tokens
- [x] `src/components/tpo/tpo-team-follow-controls.tsx` — shared secondary buttons
- [x] `src/components/tpo/tpo-team-rename.tsx` — shared form fields and buttons
- [x] `src/components/tpo/tpo-team-decision-toggle.tsx` — shared secondary action
- [x] `src/components/tpo/tpo-team-search.tsx` — shared `Input`
- [x] `src/components/tpo/tpo-my-notification-preferences-editor.tsx` — shared `Checkbox`
- [x] `src/components/tpo/tpo-optional-emails-editor.tsx` — shared `Checkbox`
- [x] `src/components/tpo/tpo-team-ask-panel.tsx` — shared inputs, textarea and buttons; replace redundant outer/row cards with hairline sections
- [x] `src/components/tpo/tpo-team-message-actions.tsx` — shared textarea and action buttons
- [x] `src/components/tpo/tpo-team-thread-details.tsx` — shared detail-toggle button and canvas radius
- [x] `src/components/tpo/tpo-notice-composer-dialog.tsx` — shared primary button
- [x] `src/components/tpo/tpo-notice-schedule-controls.tsx` — shared accessible native-backed `Radio` controls
- [x] `src/components/tpo/tpo-notice-read-progress.tsx` — shared secondary buttons and tokenized radius
- [x] `src/components/tpo/tpo-notice-acknowledge.tsx` — shared secondary button
- [x] `src/components/tpo/tpo-notice-delete-confirm.tsx` — modal/control radii and overlay styling aligned
- [x] `src/components/tpo/tpo-notice-undo-toast.tsx` — shared undo submit button and canonical radii
- [x] `src/components/tpo/tpo-bell-panel.tsx` — remove literal hex colors, style the compact bell and notification row using shared tokens
- [x] `src/components/tpo/tpo-notification-refresh.tsx` — shared retry button and radius token

**Source verification:** all 18 changed TSX files re-read from the lane branch after their commits. Static inspection confirmed that every newly authored `</Select>`, `</Button>`, and `</Textarea>` closing tag is complete, `<Button>`/`<Select>` counts balance, and the referenced shared-control imports exist. Self-closing `Input`, `Checkbox`, `Radio`, and `Textarea` keep JSX self-closing syntax. **No app runtime, compiler, tests, screenshot verification or CI executed**, per lane instructions; final semantic/visual parity remains an owner integration task.

## Further round, recruiter and reports component sweep (2026-10-19)
- [x] `src/components/placements/tpo-round-check-in.tsx` — shared secondary attendance actions
- [x] `src/components/placements/tpo-outside-participants-editor.tsx` — three fully closed shared `Select` controls, shared primary button, flat divider rows
- [x] `src/components/tpo/tpo-new-recruiter-conversation.tsx` — shared selector/textarea/buttons with canonical radii; preserve chooser focus and dialog behavior
- [x] `src/components/placements/tpo-report-saved-filters.tsx` — shared input/selector/buttons; canonical report-section radius
- [x] `src/components/placements/tpo-report-presentation.tsx` — shared secondary presentation-toggle button
- [x] `src/components/placements/tpo-bulk-drive-reminder.tsx` — shared secondary bulk reminder and selection buttons preserving native form event semantics

This continuation changes **24 production TSX files** (24 lane commits) plus the source-only tracker. Every changed source file was re-read from the branch and inspected for complete JSX shared-component closers, balanced `<Button>` / `</Button>` and `<Select>` / `</Select>`, and necessary imports; no truncated `</Select` was detected. This check does **not** replace TSX parser/typecheck or screenshot verification. **No CI, runtime, tests, TypeScript compilation or visual screenshots were run.**

## Continued North Star source sweep — additional TPO files (2026-10-19)

**Latest main merge:** `63eb159fa20a99b37eeaefd17729434e0fdedcfe` has parents `352dc658` (chat-2) and `a98732e8` (then-current main). Main won 8 overlapping TPO files to preserve concurrent fixes, while 10 non-overlapping lane files were retained. The overlapping TPO style-only gaps addressed below were re-reviewed from that merged source before editing.

- [x] `src/components/tpo/tpo-new-followup-modal.tsx`: shared select, date input, textarea and old-LMS buttons; primary action corrected to white text
- [x] `src/components/tpo/tpo-inbox-search.tsx`: shared search input retains slash-shortcut ref and debounced navigation
- [x] `src/components/placements/tpo-report-invalid-filters.tsx`: one canvas and old-LMS 30px heading token
- [x] `src/components/placements/tpo-round-check-in.tsx`: shared secondary attendance actions
- [x] `src/components/tpo/tpo-team-ask-panel.tsx`: shared buttons; flat divider-separated ask list
- [x] `src/components/tpo/tpo-team-message-actions.tsx`: shared primary, secondary/ghost and danger actions
- [x] `src/components/tpo/tpo-team-thread-details.tsx`: canonical canvas radius
- [x] `src/components/tpo/tpo-notice-undo-toast.tsx`: canonical canvas radius
- [x] `src/components/tpo/tpo-notice-delete-confirm.tsx`: tokenized dialog radius and shadow
- [x] `src/components/placements/tpo-outside-participants-editor.tsx`: shared three `Select` fields and primary action; flat participant rows
- [x] `src/components/tpo/tpo-outcome-labels-editor.tsx`: shared buttons with legacy primary Save styling
- [x] `src/components/tpo/tpo-custom-job-type-rename.tsx`: shared input and button
- [x] `src/components/tpo/tpo-builtin-job-types-editor.tsx`: shared checkbox
- [x] `src/components/tpo/tpo-prep-readiness-editor.tsx`: shared checkbox and canonical course border radius
- [x] `src/components/tpo/tpo-after-college-editor.tsx`: shared selector and buttons, remove duplicate responsive height utilities
- [x] `src/components/tpo/tpo-custom-job-type-placed.tsx`: shared secondary choice buttons
- [x] `src/components/tpo/tpo-job-types-editor.tsx`: shared radio controls and hairline-separated list
- [x] `src/components/tpo/tpo-after-college-bulk-editor.tsx`: shared checkbox, select and buttons; canonical radius

**JSX source verification:** all 18 TSX files re-read after push. Complete `</Select>`, `</Button>`, `</Textarea>` syntax checked; all `<Select>` and `<Button>` counts match closing counts and every referenced shared-control import is present. Old native closing tags not left after replacement. No application, tests, typecheck, CI, or screenshots run per lane instruction; owner must still perform complete compile and screenshot parity verification.

## TPO settings and people page canvas continuation (2026-10-19)

- Merged latest main `10ac677d5ab403f3c037d559c3321ac55c6cffa6` into lane branch, merge commit `4a9d92488efe7385a2c32d3c77f8a2a9eab833e2`. Retained 24 nonoverlapping lane files, kept main versions of 4 overlapping files pending independent review.
- [x] `/tpo/settings/notifications`: link radius token and flat KPI metric rows
- [x] `/tpo/settings/notices`: communication warning radius token
- [x] `/tpo/settings/branding`: remove nested branding field card, radius token for logo and placeholders
- [x] `/tpo/settings/season`: seasons shown as hairline sections rather than secondary cards
- [x] `/tpo/settings/see`: metrics and permission fields flattened into the single canvas
- [x] `/tpo/settings/rules`: border-separated policy details, canonical action radii
- [x] `/tpo/settings/trusted`: canonical controls and unobtrusive status section
- [x] `/tpo/settings/team`: canonical navigation control radius
- [x] `/tpo/settings/public-page`: metric keys displayed as flat divided sections
- [x] `/tpo/team`: canonical navigation, filters and conversation link radii
- [x] `/tpo/team/[threadId]`: canonical chat bubble/canvas radii and whitespace
- [x] `/tpo/team/everyone`: flat conversation list and inherited page canvas
- [x] `/tpo/profile`: remove redundant outer profile card
- [x] `/tpo/follow-ups`: flatten filter/empty-result containers
- [x] `/tpo/messages`: flat KPI metrics and conversation filter section
- [x] `/tpo/announcements`: shared `Checkbox` for pinned/notification targeting choices, white-on-teal selected tab, outlined secondary actions, hairline announcement rows
- [x] `/tpo/notifications`: flat status/empty-state treatment

**Validation:** 17 production TSX pages committed and individually re-read from `chatgpt/chat-2-b`. JSX closing-tag source checks found no truncated `</Select>`, `</Button>` or `</Textarea>`; original actions, routes, field names and messages retained. No runtime, compiler, tests, CI or screenshots were performed. Full React/TSX compile and visual acceptance remain the owner's integration step.

## TPO reporting page continuation — North Star source review (2026-10-19)

The reporting routes below now inherit the white page canvas instead of wrapping metrics, controls and grids in nested white cards. Existing page copy, filter names, URLs, query semantics and export behavior are preserved. Shared `Input`, `Select` and `Button` components replace native visible controls where applicable; hidden native inputs remain untouched.

- [x] `/tpo/reports`: report gallery navigation, search and group controls, border-divided report cards
- [x] `/tpo/reports/accreditation`: batch selector and scoped export, hairline-separated panels
- [x] `/tpo/reports/after-college`: shared selectors/Filter action, flat filter toolbar
- [x] `/tpo/reports/by-company`: shared search/select/Apply controls; dividers for KPI and drill-down
- [x] `/tpo/reports/branch-season`: shared season selector and outlined button, flat summary statistics
- [x] `/tpo/reports/ctc`: flat metric rows
- [x] `/tpo/reports/failure-reasons`: flat failure metrics and source-scope notes
- [x] `/tpo/reports/intelligence`: remove redundant nested summary cards
- [x] `/tpo/reports/joining-status`: flat summary metrics
- [x] `/tpo/reports/offers-acceptance`: flat status breakdown
- [x] `/tpo/reports/leads`: shared company filter and action; divided recruiter engagement summaries
- [x] `/tpo/reports/placement-summary`: shared company/work-mode/pay-category filters and Apply action; flat placement statistics

**Source inspection only:** every TSX closing tag in the changed sections was re-read after push, especially full `</Select>` and `</Button>`; the next final source scan checks imports and pair counts across this full continuation. No application execution, CI, lint, TypeScript compiler, unit tests or screenshot checks. Owner verification is still needed.

## North Star — TPO controls and remaining report filters (2026-10-19)

Source of truth reconfirmed from latest `main`: `docs/orchestrator/queues/master-queue.md` OWNER GOAL, the measured `docs/design/old-lms-shell-spec.md` and `docs/design/legacy-styles/components___button.scss`. Fast-forwarded lane from `336e8847` to then-current `main` `3de148112368b7201378f721841a5d4348ec9f6d` before edits. The shared UI implementations from the live branch, rather than copied hard-coded styles, now own field, button and focus styling.

- [x] `src/components/placements/tpo-interview-slot-planner.tsx`: replace six operational native buttons with shared outlined `Button`, retain confirmation flows, preserve displayed meeting data and booking controls, tokenized primary text, flatten only per-slot list rows, let shared `Input` and `Select` skins control their surfaces
- [x] `src/components/placements/tpo-round-results-import.tsx`: shared outlined preview action
- [x] `src/components/tpo/tpo-campaign-compose.tsx`: shared ghost retry action; remove redundant hard-coded field/CTA styling to inherit LMS skin
- [x] `src/components/placements/tpo-week-hour-calendar.tsx`: shared outlined close/cancel and primary add-follow-up actions; keep native custom positioned hourly grid/event hit targets that need absolute dimensions, drag/drop and specialized event rendering; add checked `Button` import
- [x] `src/components/tpo/tpo-due-followup-workspace.tsx`: native selects, input, textarea and review actions converted to shared controls; preserved confirmation, validation and data operations; corrected duplicate variant attributes found during source review
- [x] `src/components/tpo/tpo-recruiter-message-reply.tsx`: shared quick-reply/secondary/primary buttons and textarea, white-on-teal send action
- [x] `src/components/placements/tpo-bulk-round-result-recorder.tsx`: shared secondary selection, bulk-matching and CSV action buttons
- [x] `src/components/placements/tpo-round-calendar-control.tsx`: shared outlined round cancellation
- [x] `src/components/placements/tpo-joining-update-form.tsx`: shared `Select`, `Input`, `Textarea` and primary action; remove field-level colors and radii overriding shared skins
- [x] `src/components/tpo/tpo-notice-delete-confirm.tsx`: shared secondary opener/cancel and primary confirmation buttons
- [x] `/tpo/reports/joining-followups`, `/tpo/reports/offers-expiry`, `/tpo/reports/placed-branch`, `/tpo/reports/season-pipeline`, `/tpo/reports/unplaced`: visible native filters/actions converted to shared `Select` and `Button`, preserving hidden native form inputs, query names and selectors
- [x] `/tpo/drive-day`, `/tpo/drive-day/[roundId]/no-shows`, `/tpo/placements/schedule-conflicts`: primary-action label colors normalized to legacy `text-on-primary` (white)

**Source validation, not execution:** All 18 edited TSX files were fetched again from the pushed chat-2 branch. Source-level JSX opening and closing checks found matching `Button` and `Select` pairs, complete `</Button>` and `</Select>` closers, and no duplicate `variant` attributes. Shared component import inspection caught an omitted `Button` import in the weekly calendar, which was added in a follow-up commit and re-read. No application run, TypeScript compiler, tests, CI or screenshot comparison. Precise visual pixel parity awaits integrated owner verification.
