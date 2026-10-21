# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-6/base-model.md

4 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/base-model.md

## G2-6-021-006  [P2] GAP  facet F04  effort S
- Legacy: Legacy created_at LocalDateTime @CreationTimestamp immutable updatable=false (BaseModel.java:28-30).
- vNext now: vNext createdAt timestamptz defaultNow NOT NULL in departments (departments.ts:21-22).
- Fix: Ensure updated writes never change createdAt, and specify timezone conversion.

## G2-6-021-010  [P2] GAP  facet F05  effort S
- Legacy: Legacy fetch active logic often isDeleted=false OR NULL (DepartmentRepository.java:13-15).
- vNext now: vNext listDepartments filters archivedAt IS NULL (departments/service.ts:235-250).
- Fix: Map legacy null-isDeleted as active during import and ensure equivalent list counts.

## G2-6-021-023  [P2] GAP  facet F12  effort M
- Legacy: Legacy createdAt immutable updatable=false (BaseModel.java:28-30).
- vNext now: VNext createdAt not explicitly immutable at DB constraint level (organizations.ts:11-12).
- Fix: For compliance-sensitive tables prohibit createdAt overwrite and audit admin bulk corrections.

## G2-6-021-035  [P2] GAP  facet F20  effort M
- Legacy: Legacy LocalDateTime has no offset/timezone (BaseModel.java:28-34).
- vNext now: VNext timestamptz withTimezone true in core tables (organizations.ts:11-12).
- Fix: Document timezone conversion from local legacy timestamps to UTC and display in IST.
