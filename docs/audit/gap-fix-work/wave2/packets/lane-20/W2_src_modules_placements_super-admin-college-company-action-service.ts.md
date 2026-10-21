# Work packet (wave 2): edit src/modules/placements/super-admin-college-company-action-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-companies-college.md

## G2-9-033-086  [P2] GAP  facet F12  effort M
- Legacy: Cannot remove college relation with nondeleted jobs `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:344-363`
- vNext now: Archive checks non-archived jobs `src/modules/placements/super-admin-college-company-action-service.ts:34-39`
- Fix: Reconcile deleted vs archived placement-job semantics and exact message.

## G2-9-033-098  [P2] GAP  facet F20  effort M
- Legacy: PESSIMISTIC_WRITE lock prevents rename/delete vs job link race `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:249-252,345-350`
- vNext now: Relationship FOR UPDATE and status CAS only `src/modules/placements/super-admin-college-company-action-service.ts:21-46`
- Fix: Extend concurrent write protection to complete scoped edit path.
