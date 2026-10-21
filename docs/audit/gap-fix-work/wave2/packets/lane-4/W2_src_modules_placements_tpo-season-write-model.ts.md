# Work packet (wave 2): edit src/modules/placements/tpo-season-write-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/tpo-season-controller.md

## G2-8-022-018  [P2] GAP  facet F06  effort M
- Legacy: Legacy startRequest fields name,startDate,endDate without code or explicit confirmation (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoSeasonController.java:44-53).
- vNext now: New schema requires collegeId,name,code,startDate,endDate and TPO model confirmed:true (src/modules/placements/validation.ts:215-246; src/modules/placements/tpo-season-write-model.ts:9-15).
- Fix: Make additional fields/confirmation visible; avoid surprising disabled create form.
