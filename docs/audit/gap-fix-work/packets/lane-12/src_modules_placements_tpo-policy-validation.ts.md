# Work packet: edit src/modules/placements/tpo-policy-validation.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/tpo-settings-controller.md

## G2-6-022-044  [P1] GAP  facet F12  effort M
- Legacy: Legacy countsAsPlacedAt accepted only released/accepted on write, model comment includes SELECTED (CollegePlacementRules.java:30-32; TpoSettingsService.java:33-35).
- vNext now: vNext DB permits SELECTED, vNext validation enum permits SELECTED (tpo-policy.ts:48-51; tpo-policy-validation.ts:14-18).
- Fix: Align effective source-of-truth enum and legacy accepted choices.
