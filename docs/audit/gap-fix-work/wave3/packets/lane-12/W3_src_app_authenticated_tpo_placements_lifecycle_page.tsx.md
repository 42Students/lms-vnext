# Work packet (wave 3): edit src/app/(authenticated)/tpo/placements/lifecycle/page.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drives-index.md

## G2-11-012-013  [P1] MISSING  facet F02  effort L
- Legacy: Bulk ActionsWindow is modal over list. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:462`
- vNext now: Selected checkboxes only for CSV export, no bulk action window. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:314`
- Fix: Restore Act on selected/all window with actions and consequences.

## G2-11-012-040  [P1] MISSING  facet F06  effort L
- Legacy: Bulk extend deadline DatePicker showTime, required message Pick the date and time. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:258`
- vNext now: Per-drive link to extension form; no bulk date form. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:363`
- Fix: Add bulk deadline modal with required time validation.

## G2-11-012-042  [P1] MISSING  facet F06  effort L
- Legacy: Bulk close requires published + passed deadline. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:265`
- vNext now: Per-drive close-preview link; no bulk selector validation. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:368`
- Fix: Recreate eligibility gate for bulk closure.

## G2-11-012-052  [P1] MISSING  facet F09  effort L
- Legacy: ActionsWindow supports selected/all audience with previews and confirmations. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:462`
- vNext now: Only export-selected form, no bulk modal. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:314`
- Fix: Port ActionsWindow and selection UX.

## G2-11-012-057  [P1] MISSING  facet F10  effort L
- Legacy: Bulk remindNotApplied API invoked once per selected drive. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:241`
- vNext now: Only per-drive TpoRemindNonApplicants link/control. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:373`
- Fix: Support bulk reminders with one-per-day/per-deadline guard.

## G2-11-012-058  [P1] MISSING  facet F10  effort L
- Legacy: Bulk extendDeadline API called for each eligible drive. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:262`
- vNext now: Only per-drive form. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:363`
- Fix: Add bulk extension server batch or guarded sequential calls.

## G2-11-012-059  [P1] MISSING  facet F10  effort L
- Legacy: Bulk closeDrive API called for selected audience. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:277`
- vNext now: Only per-drive close-preview. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:368`
- Fix: Add safe bulk close workflow with all side effects.

## G2-11-012-097  [P1] MISSING  facet F21  effort L
- Legacy: Bulk actions send one API request per selected drive. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:244`
- vNext now: New single-drive mutations, no bulk orchestration. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:373`
- Fix: Add batched/rate-limited background-safe action orchestration.
