# Work packet: edit src/app/(authenticated)/tpo/settings/job-types/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/job-types.md

## G2-3-011-031  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ChoicesController.java:32-45`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:55-73`
- vNext now: `src/modules/placements/tpo-configuration-read-service.ts:12-26`, `src/app/(authenticated)/tpo/settings/job-types/page.tsx:10-22`
- Fix: Legacy shared choices produces built-ins for no-college caller, college-visible list for college; vNext read function requires TPO manager so drive actors cannot query same authoritative choice list. Provide scoped consumer read.
