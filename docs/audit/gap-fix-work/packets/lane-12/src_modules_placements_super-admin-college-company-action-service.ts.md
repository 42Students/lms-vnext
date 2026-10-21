# Work packet: edit src/modules/placements/super-admin-college-company-action-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-companies-college.md

## G2-9-033-090  [P1] GAP  facet F15  effort M
- Legacy: Create/Update/Delete/Restore audit actions emitted by service `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:55-60,192-193,294-295,362-363,377`
- vNext now: Relationship action records archive/restore only `src/modules/placements/super-admin-college-company-action-service.ts:47-54`
- Fix: Mirror create and update activity audit events for college CRUD.
