# Work packet (wave 2): edit src/modules/placements/tpo-drive-next-step-model.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drives-jobid.md

## G2-11-010-020  [P2] GAP  facet F03  effort S
- Legacy: Staged round takes main button Apply {roundName} results. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:279`
- vNext now: Review and apply N result(s) based on greatest pending count. `src/modules/placements/tpo-drive-next-step-model.ts:54`
- Fix: Use exact label/priority and round selection.

## G2-11-010-021  [P2] GAP  facet F03  effort S
- Legacy: Unreleased selection main button Verify N selections. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:280`
- vNext now: Equivalent action exists lower in priority and says Verify and release N selection(s). `src/modules/placements/tpo-drive-next-step-model.ts:63`
- Fix: Align priority and copy.

## G2-11-010-064  [P2] GAP  facet F12  effort M
- Legacy: Close main only after deadline, zero applicants, no staged results and unreleased selections. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:272`
- vNext now: vNext exposes Close drive if lifecycle readiness allowed; primary priority differs. `src/modules/placements/tpo-drive-next-step-model.ts:83`
- Fix: Align close main-button conditions and priority.

## G2-11-010-090  [P2] GAP  facet F18  effort S
- Legacy: Default no attention: Nothing needs you right now. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:397`
- vNext now: New projectTpoDriveNextStep always returns Applicants fallback. `src/modules/placements/tpo-drive-next-step-model.ts:24`
- Fix: Show no-attention copy when no primary action actually required.
