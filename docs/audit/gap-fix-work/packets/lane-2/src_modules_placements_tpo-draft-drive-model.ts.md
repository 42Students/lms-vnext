# Work packet: edit src/modules/placements/tpo-draft-drive-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/job-types.md

## G2-3-011-033  [P1] MISSING  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:93-105`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ChoicesController.java:32-45`
- vNext now: `src/modules/placements/tpo-draft-drive-model.ts:8-11`, `src/components/tpo/tpo-draft-drive-step-one-form.tsx:113-120`
- Fix: Legacy new drive accepts visible custom labels and all five built-ins, retains hidden historical type; vNext draft enum limits FULL_TIME, INTERNSHIP, CONTRACT. Add complete college-scoped list and historical retention.
