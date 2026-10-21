# Work packet: edit src/modules/placements/scope.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/job-repository.md

## G2-3-015-024  [P1] MISSING  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:160-171`
- vNext now: `src/modules/placements/scope.ts:8-36`, `src/db/schema/placements.ts:465-473`
- Fix: Legacy reassignOrganizationForCollege updates denormalized orgId on jobs and increments version; vNext jobs store collegeId only and derive org through college; no reassign job mutation needed but ensure tenants follow college reassignment atomically.
