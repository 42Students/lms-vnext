# North Star sweep — chat-5 (TPO drives / jobs / selection / offers / placements)

Date: 2026-10-19. Source-only implementation complete for assigned paths; screenshot acceptance pending. Branch: `chatgpt/chat-5-b`. Exclusive ownership: the TPO placements and drive-day route files below and the TPO-specific placements/components used by those routes. Do not change `src/app/globals.css`, `src/app/layout.tsx`, `src/components/ui/**`, `src/components/shell/**`, or unrelated TPO sections (other lanes own them).

## Reference and visual acceptance

Read: `docs/orchestrator/queues/master-queue.md` NORTH STAR; `docs/design/old-lms-shell-spec.md`, `old-lms-pages.md`, `vnext-vs-old-lms-gap.md`, `old-lms-shell.css`; legacy SCSS `components___variables.scss`, `components___button.scss`, `components___form.scss`, `components___typo.scss`, `components___dropdown.scss`, `components___header.scss`, `components___common.scss`, `components___antddesign.scss`, `components___colors.scss`, `components___listing-page-header.scss`. The app shell and shared UI kit are owned by chat-17/19/13.

- One shared white page canvas: `#fff`, 1px `#e5e9f0`, 12px corners, 24px inner padding, on `#f1f4f9`. Do **not** add a second page canvas inside route bodies.
- Titles: Inter, 30px / 600 / `#172033` (shared `PageHeader` preferred). Secondary descriptions remain subordinate. Keep page contents, sections, tables, actions, labels and workflows **unchanged**.
- Primary controls: 36px, 9px radius, `#0a7c88` with **white** foreground; outline controls white with `#e5e9f0` border. Replace non-semantic foreground-on-primary and raw fixed palette classes.
- Inputs, selects and textareas: consume shared components where compatible or shared form tokens; no inconsistent hard-coded backgrounds, borders, radii or focus styles. Tables remain compact with hairline separators, not tile-by-row.
- Remove duplicated outer wrappers/cards on routine sections and filter toolbars; **keep** borders when a component is a genuine standalone object (e.g. modal, distinct insight tile or interactive panel). Preserve mobile overflow and focus visibility.

## Source inventory and remediation ledger

Status: `Adjusted — pushed` means a route/component's styling was changed on the assigned branch; `Reviewed — inherited shared skin` means the inspected source did not require local change. `Cross-portal scope` is documented for awareness but is not a claim of full sweep outside drives/jobs/selection/offers. Error/loading boundaries inherit shared styling; only implementation pages are counted. Routes below are all implementation pages in the assigned drive/job/selection/offers TPO tree; shared UI is intentionally excluded.

| File | Group | Source-level sweep target | Status |
|---|---|---|---|
| `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx` | Drive lifecycle and cross-cutting | PageHeader title, section/card shells, button foreground, table/toolbar/form controls | Adjusted — pushed |
| `src/app/(authenticated)/tpo/placements/new/draft/page.tsx` | Drive lifecycle and cross-cutting | PageHeader title, section/card shells, button foreground, table/toolbar/form controls | Reviewed — inherited shared skin |
| `src/app/(authenticated)/tpo/placements/new/page.tsx` | Drive lifecycle and cross-cutting | PageHeader title, section/card shells, button foreground, table/toolbar/form controls | Adjusted — pushed |
| `src/app/(authenticated)/tpo/placements/overview/page.tsx` | Drive lifecycle and cross-cutting | PageHeader title, section/card shells, button foreground, table/toolbar/form controls | Adjusted — pushed |
| `src/app/(authenticated)/tpo/placements/page.tsx` | Drive lifecycle and cross-cutting | PageHeader title, section/card shells, button foreground, table/toolbar/form controls | Reviewed — inherited shared skin |
| `src/app/(authenticated)/tpo/placements/recorded-outside/[recordId]/page.tsx` | Drive lifecycle and cross-cutting | PageHeader title, section/card shells, button foreground, table/toolbar/form controls | Adjusted — pushed |
| `src/app/(authenticated)/tpo/placements/recorded-outside/page.tsx` | Drive lifecycle and cross-cutting | PageHeader title, section/card shells, button foreground, table/toolbar/form controls | Adjusted — pushed |
| `src/app/(authenticated)/tpo/placements/schedule-conflicts/page.tsx` | Drive lifecycle and cross-cutting | PageHeader title, section/card shells, button foreground, table/toolbar/form controls | Adjusted — pushed |
| `src/components/placements/drive-day-roster.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-applicant-review-drawer.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-applicant-review-form.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-bulk-drive-reminder.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-bulk-round-result-recorder.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-calendar-followup-actions.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Cross-portal scope — no further edits |
| `src/components/placements/tpo-college-rules-control.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-company-feedback-form.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-company-interaction-form.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-company-lifecycle-editor.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-company-person-editor.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-company-trust-switch.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-delete-draft-action.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-drive-act-on-panel.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-drive-cancel-form.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-drive-change-requests.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-drive-clone-action.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-drive-close-preview-form.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-drive-deadline-form.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-drive-edit-form.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-drive-lifecycle-controls.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-drive-refresh-control.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-drive-saved-views.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-drive-selection-manager.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-drive-workspace-nav.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-general-requests-panel.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Cross-portal scope — no further edits |
| `src/components/placements/tpo-interview-reschedule-form.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-interview-slot-planner.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-mark-own-notification-read.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Cross-portal scope — no further edits |
| `src/components/placements/tpo-outside-participants-editor.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-public-placement-content-editor.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-public-placement-toggle.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-recruiter-grant-controls.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-remind-non-applicants.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-report-invalid-filters.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-report-presentation.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Cross-portal scope — no further edits |
| `src/components/placements/tpo-report-record-links.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Cross-portal scope — no further edits |
| `src/components/placements/tpo-report-saved-filters.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Cross-portal scope — no further edits |
| `src/components/placements/tpo-request-bulk-decision.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-request-decision-control.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Reviewed — inherited shared skin |
| `src/components/placements/tpo-request-page-clipboard.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Cross-portal scope — no further edits |
| `src/components/placements/tpo-round-apply-control.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-round-calendar-control.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-round-check-in.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-round-drive-day-read-only.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-round-reorder.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-round-result-entry-form.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-round-result-recorder.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-round-results-import.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-season-controls.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-selection-import.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-sequential-request-review.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-settings-nav.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Cross-portal scope — no further edits |
| `src/components/placements/tpo-trust-toggle.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Cross-portal scope — no further edits |
| `src/components/placements/tpo-week-hour-calendar.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/tpo/tpo-draft-drive-step-one-form.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/tpo/tpo-drive-request-actions.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/tpo/tpo-selected-review-queue.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/tpo/tpo-applications-spreadsheet.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/tpo/tpo-students-selection.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Reviewed — inherited shared skin |
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/about/page.tsx` | Jobs and drive detail | PageHeader title, section/card shells, button foreground, table/toolbar/form controls | Adjusted — pushed |
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/page.tsx` | Jobs and drive detail | PageHeader title, section/card shells, button foreground, table/toolbar/form controls | Adjusted — pushed |
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants/[applicationId]/page.tsx` | Jobs and drive detail | PageHeader title, section/card shells, button foreground, table/toolbar/form controls | Adjusted — pushed |
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants/page.tsx` | Jobs and drive detail | PageHeader title, section/card shells, button foreground, table/toolbar/form controls | Reviewed — inherited shared skin |
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applications-export/page.tsx` | Jobs and drive detail | PageHeader title, section/card shells, button foreground, table/toolbar/form controls | Adjusted — pushed |
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/cancel-preview/page.tsx` | Jobs and drive detail | PageHeader title, section/card shells, button foreground, table/toolbar/form controls | Adjusted — pushed |
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/candidate-schedule/page.tsx` | Jobs and drive detail | PageHeader title, section/card shells, button foreground, table/toolbar/form controls | Adjusted — pushed |
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/change-requests/page.tsx` | Jobs and drive detail | PageHeader title, section/card shells, button foreground, table/toolbar/form controls | Adjusted — pushed |
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/close-preview/page.tsx` | Jobs and drive detail | PageHeader title, section/card shells, button foreground, table/toolbar/form controls | Adjusted — pushed |
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/closeout/page.tsx` | Jobs and drive detail | PageHeader title, section/card shells, button foreground, table/toolbar/form controls | Adjusted — pushed |
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/discussion/page.tsx` | Jobs and drive detail | PageHeader title, section/card shells, button foreground, table/toolbar/form controls | Adjusted — pushed |
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/edit/page.tsx` | Jobs and drive detail | PageHeader title, section/card shells, button foreground, table/toolbar/form controls | Adjusted — pushed |
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/extend-deadline/page.tsx` | Jobs and drive detail | PageHeader title, section/card shells, button foreground, table/toolbar/form controls | Reviewed — inherited shared skin |
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/interview-slots/page.tsx` | Jobs and drive detail | PageHeader title, section/card shells, button foreground, table/toolbar/form controls | Adjusted — pushed |
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/page.tsx` | Jobs and drive detail | PageHeader title, section/card shells, button foreground, table/toolbar/form controls | Adjusted — pushed |
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-audit/page.tsx` | Jobs and drive detail | PageHeader title, section/card shells, button foreground, table/toolbar/form controls | Adjusted — pushed |
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-preview/page.tsx` | Jobs and drive detail | PageHeader title, section/card shells, button foreground, table/toolbar/form controls | Adjusted — pushed |
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/[roundId]/results/page.tsx` | Selection and rounds | PageHeader title, section/card shells, button foreground, table/toolbar/form controls | Adjusted — pushed |
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/[roundId]/slots/page.tsx` | Selection and rounds | PageHeader title, section/card shells, button foreground, table/toolbar/form controls | Adjusted — pushed |
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/page.tsx` | Selection and rounds | PageHeader title, section/card shells, button foreground, table/toolbar/form controls | Adjusted — pushed |
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/selections/page.tsx` | Selection and rounds | PageHeader title, section/card shells, button foreground, table/toolbar/form controls | Adjusted — pushed |
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/shortlist/page.tsx` | Selection and rounds | PageHeader title, section/card shells, button foreground, table/toolbar/form controls | Adjusted — pushed |
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/waitlist/page.tsx` | Selection and rounds | PageHeader title, section/card shells, button foreground, table/toolbar/form controls | Adjusted — pushed |
| `src/components/placements/tpo-waitlist-promotion-control.tsx` | Selection and rounds | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/joining/page.tsx` | Offers and joining | PageHeader title, section/card shells, button foreground, table/toolbar/form controls | Adjusted — pushed |
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/letters/page.tsx` | Offers and joining | PageHeader title, section/card shells, button foreground, table/toolbar/form controls | Adjusted — pushed |
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/[offerId]/page.tsx` | Offers and joining | PageHeader title, section/card shells, button foreground, table/toolbar/form controls | Adjusted — pushed |
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/page.tsx` | Offers and joining | PageHeader title, section/card shells, button foreground, table/toolbar/form controls | Adjusted — pushed |
| `src/components/placements/tpo-joining-update-form.tsx` | Offers and joining | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/components/placements/tpo-offer-lifecycle-panel.tsx` | Offers and joining | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
| `src/app/(authenticated)/tpo/drive-day/[roundId]/no-shows/page.tsx` | Drive-day coordination | PageHeader title, section/card shells, button foreground, table/toolbar/form controls | Adjusted — pushed |
| `src/app/(authenticated)/tpo/drive-day/[roundId]/page.tsx` | Drive-day coordination | PageHeader title, section/card shells, button foreground, table/toolbar/form controls | Reviewed — inherited shared skin |
| `src/app/(authenticated)/tpo/drive-day/page.tsx` | Drive-day coordination | PageHeader title, section/card shells, button foreground, table/toolbar/form controls | Adjusted — pushed |
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/drive-day/page.tsx` | Drive-day coordination | PageHeader title, section/card shells, button foreground, table/toolbar/form controls | Adjusted — pushed |

## Guardrails and verification

1. Commit the inventory before edits; update statuses and exceptions as files are reviewed.
2. Source-only audit by ownership; no app execution or CI until the owner's final pass. Avoid risky regex edits across TSX expressions; retain balanced JSX tags and valid class string literals.
3. Keep shared `PageHeader` and `DataTable` implementations untouched: chat-17 owns global kit. Keep TPO semantic labels and screen structure unchanged.
4. Only push commits prefixed `[chat-5]` to `chatgpt/chat-5-b`. Recheck latest `main` before the final handoff.

## Implementation closeout (source-only)

- Branch: `chatgpt/chat-5-b` — **15 commits**, **87 modified code files** plus this ledger, all pushed with `[chat-5]` commit prefix. Ledger rows: 102 inspected, 86 adjusted, 7 left on inherited shared styling, 9 cross-portal files documented for awareness. Extra nested drive component: `src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-preview/company-share-controls.tsx` (adjusted).
- Changes: flattened routine section/filter cards into whitespace and hairline dividers; normalized the continuous Drives and Offers records; corrected teal primary actions to white-on-primary; applied 9px control corners and 36px desktop/44px phone control minimums; standardized standalone direct headings to legacy 30px/600. Preserved section ordering, rendered copy, data flow, route endpoints, and action handlers.
- Exact canvas background, outer border, global body font, shared PageHeader, inputs, status badges, data tables, and sidebar/top-bar are owned elsewhere (chat-17, chat-19 and chat-13); the route layer does **not** add a second canvas.
- No app execution, CI, typecheck, screenshot regression, or visual diff was run, per the owner's explicit no-execution directive. **Do not infer pixel-perfect parity from this source-only pass.** A final integrated visual comparison is still required after the shared shell/kit branches merge.

| Additional TPO-only component | Group | Source-level sweep target | Status |
|---|---|---|---|
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-preview/company-share-controls.tsx` | Jobs and drive detail | Shared control tokens and standalone section hairlines | Adjusted — pushed |
