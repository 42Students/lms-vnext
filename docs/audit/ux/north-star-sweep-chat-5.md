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
| `src/components/placements/tpo-request-decision-control.tsx` | Drive lifecycle and cross-cutting | Raw control styles, borders, form fields, tiles; reuse shared tokens | Adjusted — pushed |
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

## Third source verification pass — 2026-10-19, chat-5

- Started with a fast-forward of `chatgpt/chat-5-b` to the then-current `main` at `6222f78a4a19084be6529aa802810ee98193c1d2` (no history rewrite); changes remained exclusively on the lane branch.
- Reinspected the ledger's 103 listed route/component surfaces against the measured shell and legacy SCSS. Normalized leftover bare `rounded`, `rounded-md`, `rounded-lg` and `rounded-[9px]` classes to `var(--lms-control-radius)` or `var(--lms-canvas-radius)` according to purpose; retained true pill and distinct summary-panel shapes.
- Removed nested tiles from the drive About view's excluded-learner and eligibility-rule rows, request-detail subcards in the drives lifecycle list, and clone-past-drive list rows; used hairline dividers instead. Kept section order, data, copy, actions and state machines unchanged.
- Replaced the lone raw amber request-count palette with the semantic warning skin, preserved white primary text, aligned sequential request-review and report-presentation control heights to 44px mobile / 36px desktop, and matched the legacy light dropdown shadow on drive workspace navigation.
- Extended matching radius tokens across placements create/edit, bulk, offers, day overview, employer and recruiter access workspaces plus TPO-specific form, round, selection and interview widgets. Source verification yielded no remaining legacy raw-radius or fixed-palette hits in directly owned TPO drives/jobs/rounds/waitlist/offers/joining routes. Shared reporting, notification and first-third TPO utilities assigned to other portal lanes retain their existing scope boundaries.
- No dev server, runtime code, typecheck, tests, CI, browser screenshots or visual pixel-diff were run. Pixel-perfect parity remains unconfirmed until an orchestrator-run screenshot comparison.

## Fourth source styling pass — 2026-10-19 (continued lane work)

- Merged upstream `main` (SHA `8175bfbde69c2ffbec45f33ac08453dfe68a31e4`) **into `chatgpt/chat-5-b` only** via integration PR #180, merge SHA `83baa631542efada407608009db9afa43facf90e`. No merge or commit was made to `main`.
- Then pushed **27 additional `[chat-5]` source commits across 20 files**, covering drive workspace, creation, operation cards, list tabs, applicants, offer register and evidence, joining, close-out, round result counts, previews, waitlist, schedule and bulk selection tools.
- Restored old-LMS **teal underline active tabs** for Drives, Offers and drive-workspace navigation. Removed the extra workspace navigation card while retaining mobile section selection and the More dropdown.
- Replaced per-count and per-row nested cards with continuous **hairline-divided metric strips and rows** for applicant pipeline, drive journey, joining outcome facts, offer evidence, round result counts, close-out summary, create-drive review steps, interview requests, round operations and bulk action panels. Kept genuinely separate alerts, confirmation previews, Next step panels and forms.
- Normalized primary CTA text to shared white-on-teal tokens, turned CSV/export actions into white secondary controls, made previously 36px-only mobile action links 44px tall (36px desktop), aligned dropdown corners/shadows, and removed unnecessary inner horizontal padding from list rows.
- Source-only checks of edited TSX class expressions: no intentional business logic, copy, endpoint, filtering, status transition, authorization or test changes. Balanced JSX tags and inline expressions were preserved by localized exact-string substitutions.
- **No application run, typecheck, unit tests, CI or screenshot comparison**, as requested. Visual acceptance remains blocked on an orchestrator-run side-by-side browser comparison. Concurrent changes to `main` after PR #180 require integration reconciliation before final release.

## Fifth source styling continuation — 2026-10-19

- Attempted to pull the then-latest upstream `main` into `chatgpt/chat-5-b` using integration PR [#181](https://github.com/42Students/lms-vnext/pull/181). GitHub rejected the merge with conflicts (HTTP 405). **No upstream merge was claimed, no history was rewritten, and no commits went to `main`.** The previous successful main sync remains PR #180.
- Continued file-by-file on the existing lane branch instead of overriding newer upstream changes. **20 additional `[chat-5]` source commits, 19 distinct files** since `95788ffde5dec5074597ecf23352952e7e3f5e48`.
- Tightened the continuous white-canvas look: replaced per-row bordered cards with hairline-divided rows in bulk applicant selections, round reorder, drive-day pipeline, company change requests, outside participants and bulk request decisions. Consolidated drive-day and reporting metric cards into shared bordered metric strips without reordering facts.
- Corrected primary button text to the canonical white-on-teal foreground in offer withdrawal, recorded-outside forms, company life-cycle and contact editing, round result actions and publication controls. Matched 44px mobile / 36px desktop targets for check-in, saved views, result recording, presentation ordering and recorded-outside controls.
- Preserved section headings, rendered copy, state logic, routes, handlers, input validation, role constraints and confirmation behavior. All changes were confined to JSX class strings.
- Re-read updated source and JSX control closings, including `</Select>`, `</Button>`, `</Input>`, `</Radio>` and `</Checkbox>` where present; no incomplete closing tags were detected in the inspected changed files. **No application execution, typecheck, unit tests, lint, CI or screenshot/browser parity run.** Final integration must resolve PR #181 conflicts rather than discarding either lane's edits or the upstream component syntax fixes.

## Sixth pass — upstream resolution and continued style-only parity (2026-10-19)

- Pulled upstream `main` at `f7dd3e81786adf00538daebf63a075046d159b4c` into `chatgpt/chat-5-b` with two-parent merge `b1f950c9464afd30e34c1ea6992bd847d68431c7`. Both branch histories are retained, and **origin/main was preferred on every conflicted JSX file**. No direct commits to `main`.
- Reapplied only the lane's styling deltas over the latest upstream JSX across **39 files**. In particular, `rounds/[roundId]/results/page.tsx` keeps upstream `Input`, `Select` and `Button` elements with complete closing tags; `tpo-interview-slot-planner.tsx` keeps upstream `Input`, `Select`, `Button` elements and hooks, with only the round-request row's hairline class restored. Did not resurrect older native `input`, `select`, `button` tags.
- Reapplied styling in drive/status and offer tabs, applicant/joining/offer/closeout metric strips, form control radii, primary white-on-teal contrast, white secondary CSV controls, mobile target heights, plain canvas spacing, and per-row dividers. Where upstream classes had already changed, made targeted class-only adjustments rather than replacing upstream lines/components.
- Visually sensitive JSX control closing tags were re-read during each source update, with no incomplete `</Select`, `</Button`, `</Input`, `</Radio`, or `</Checkbox` occurrences detected. This was a **source-only** pass; the application, typecheck, tests, lint, CI and browser screenshots were not run.
- The earlier #181 PR merge attempt failed automatically, but the subsequent explicit two-parent lane merge resolved it manually. The lane is fully up-to-date with the `main` revision listed above. Future main commits still require reconciliation.

### Additional source-only pass after upstream reconciliation

- Finished four newly inspected TPO elements: interview reschedule primary-button foreground, weekly-calendar follow-up primary-button foreground, sequential-review row divider and bulk round-results outcome list hairline. Retained upstream JSX tags and all event/state logic.
- An older 40-file sweep from pre-merge history was compared against the latest tree. Where upstream already had more recent styling or shared-control JSX, it remained authoritative; no older HTML/native control tags were restored. Only clear styling deltas were reapplied.
- No CI, typecheck, app execution or automated code validation was run. Complete component-tag closings were re-read in the touched files.
