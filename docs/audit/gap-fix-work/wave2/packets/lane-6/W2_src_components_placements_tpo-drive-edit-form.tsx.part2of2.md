# Work packet (wave 2): edit src/components/placements/tpo-drive-edit-form.tsx (part 2 of 2)

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drives-jobid-edit.md

## G2-11-011-105  [P2] GAP  facet F20  effort M
- Legacy: Debounce timer canceled/cleared on future typing. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:320`
- vNext now: New has guardedAction pending for explicit save. `src/components/placements/tpo-drive-edit-form.tsx:24`
- Fix: If autosave restored, cancel timers and prevent stale overwrites.

## G2-11-011-114  [P2] GAP  facet F22  effort M
- Legacy: Legacy rounds stored in separate round service, after draft not autosaved. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:266`
- vNext now: New edit has no rounds content; root workspace manages rounds separately. `src/components/placements/tpo-drive-edit-form.tsx:88`
- Fix: Link to round editor and display persisted configuration.

## G2-11-011-042  [P3] GAP  facet F05  effort S
- Legacy: Round presets Talk/Test/Interview; Test/Technical/HR; Test/GD/Interview on create. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:703`
- vNext now: No presets in edit form. `src/components/placements/tpo-drive-edit-form.tsx:88`
- Fix: Show saved round previews; presets only for new drafts.

## G2-11-011-046  [P3] GAP  facet F06  effort S
- Legacy: Min CGPA 0–10, step 0.1. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:679`
- vNext now: vNext CGPA 0–10 step .01. `src/components/placements/tpo-drive-edit-form.tsx:120`
- Fix: Choose same step and rounding (or owner approve more precision).
