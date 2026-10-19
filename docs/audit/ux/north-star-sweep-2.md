# chat-2 — old LMS North Star visual sweep (2026-10-19)

## Source of truth
`docs/orchestrator/queues/master-queue.md` NORTH STAR; `docs/design/old-lms-shell.css`, `old-lms-shell-spec.md`, `old-lms-pages.md`, `vnext-vs-old-lms-gap.md`, and `legacy-styles/`.

Scope is **page shell and shared visual skin only**: retain the existing TPO page content, wording, data access, interactions, and section order. Global canvas, top bar and sidebar are maintained by other lanes. Never add a nested full-page card.

## Pages in this lane
- [ ] `/tpo/calendar/interviews`
- [ ] `/tpo/calendar/rounds`
- [ ] `/tpo/drive-day` and `/tpo/drive-day/[roundId]` (TPO branch only)
- [ ] `/tpo/placements/schedule-conflicts`
- [ ] `/tpo/placements/jobs/[jobId]/interview-slots`
- [ ] `/tpo/placements/jobs/[jobId]/candidate-schedule`
- [ ] `/tpo/placements/jobs/[jobId]/rounds`
- [ ] `/tpo/placements/jobs/[jobId]/rounds/[roundId]/results`
- [ ] `/tpo/placements/jobs/[jobId]/rounds/[roundId]/slots`
- [ ] `/tpo/recruiters/campaigns`
- [ ] `/tpo/recruiters/campaigns/[batchId]`
- [ ] `/tpo/recruiters/campaigns/drafts/[campaignId]`
- [ ] `/tpo/recruiters/campaigns/new`
- [ ] `/tpo/recruiters/campaigns/preview`
- [ ] `/tpo/settings/public-link`
- [ ] `/tpo/settings/public-page`
- [ ] `/tpo/settings/recruiters`
- [ ] `/tpo/settings/team`
- [ ] `/tpo/settings/trusted`

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

## Progress
- [x] Brought `chatgpt/chat-2-b` up to then-current `main` via fast-forward (branch had no unique commits).
- [x] Read NORTH STAR reference and inspected the listed initial TPO page/component sources.
- [ ] Page-by-page source sweep and supporting component sweep.
- [ ] Owner-run visual screenshot verification (not run by this lane).
