# Work packet: edit src/modules/organizations/service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-recycle-bin-controller.md, docs/audit/gap2/lane-6/base-model.md, docs/audit/gap2/lane-3/superadmin-organizations.md

## G2-2-023-004  [P1] MISSING  facet F01  effort M
- Legacy: AdminRecycleBinController.java:232-285 POST /restore with entityType/id/collegeId
- vNext now: src/modules/organizations/service.ts and src/modules/colleges/service.ts have individual restore actions but no generic endpoint
- Fix: Add generic restore dispatcher guarded by entity type.

## G2-6-021-018  [P1] GAP  facet F10  effort L
- Legacy: Hibernate sets createdAt on insert (@CreationTimestamp) and updatedAt on updates (@UpdateTimestamp) (BaseModel.java:28-34).
- vNext now: vNext createdAt/updatedAt defaultNow at insert, explicit updatedAt in organization rename and archive (organizations.ts:11-12; organizations/service.ts:211-220,258-265).
- Fix: Audit every vNext mutable table/service for updatedAt writes; add triggers where bulk mutations bypass service.

## G2-3-030-032  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/OrganizationController.java:50-54`
- vNext now: `src/modules/organizations/service.ts:153-160`
- Fix: Legacy exact Clear scope (GLOBAL mode) to create organizations; vNext permission checks may return generic forbidden, require actionable copy.
