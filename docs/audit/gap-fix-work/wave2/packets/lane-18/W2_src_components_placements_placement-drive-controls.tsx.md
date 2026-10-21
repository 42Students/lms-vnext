# Work packet (wave 2): edit src/components/placements/placement-drive-controls.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/job-eligibility-override-repository.md

## G2-17-014-006  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/EligibilityService.java:100-106 — Override check label `Added by college` even for EXCLUDE.
- vNext now: src/components/placements/placement-drive-controls.tsx:924-934 — Renders decision/reason inline, different labeling.
- Fix: Preserve audit explanation and clarify exclude copy.

## G2-17-014-007  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoWorkspaceController.java:209-217 — Override button used from drive admin context.
- vNext now: src/components/placements/placement-drive-controls.tsx:985-1050 — Buttons for INCLUDE/EXCLUDE, Remove override.
- Fix: Compare exact button text, icon, emphasis and position against legacy UI.

## G2-17-014-038  [P3] GAP  facet F18  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/EligibilityService.java:104-105 — Exact check wording `Added by college`.
- vNext now: src/components/placements/placement-drive-controls.tsx:924-934 — Displays decision and reason, no same check title in UI.
- Fix: Align eligibility explanation wording.
