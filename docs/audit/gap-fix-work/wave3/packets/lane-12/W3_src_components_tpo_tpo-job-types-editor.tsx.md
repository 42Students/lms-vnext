# Work packet (wave 3): edit src/components/tpo/tpo-job-types-editor.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/tpo-job-type-service.md

## G2-6-011-002  [P1] MISSING  facet F01  effort L
- Legacy: Old settings from `/api/v1/choices` is single source for drive form/filters/reports `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:12-16`
- vNext now: New UI explicitly states drive forms and reports still use own employment types `src/components/tpo/tpo-job-types-editor.tsx:57-58`
- Fix: Integrate job-type registry with drive create/edit, filters, placement-count reports
