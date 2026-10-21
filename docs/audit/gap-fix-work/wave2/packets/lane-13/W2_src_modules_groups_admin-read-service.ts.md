# Work packet (wave 2): edit src/modules/groups/admin-read-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/admin-group-controller.md

## G2-3-024-009  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:95-103`
- vNext now: `src/modules/groups/admin-read-service.ts:73-155`, `src/app/(authenticated)/college/groups/page.tsx:61-74`
- Fix: Legacy list no offset/page, VNext directory paginates with typed kind/status filters and normalizes bad offset. Match default total/active grouping.

## G2-3-024-010  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:150-153`
- vNext now: `src/modules/groups/admin-read-service.ts:156-237`
- Fix: Legacy members state filter and unbounded list; VNext detail reader caps members at500 and events at25. Add continuation and explicit truncation when needed.

## G2-3-024-023  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:42-45`, `95-116`
- vNext now: `src/modules/groups/admin-read-service.ts:73-180`, `src/modules/groups/college-group-management-service.ts:27-53`
- Fix: Legacy college admin plus scoped superadmin can manage group via guard; VNext study mutation requires active COLLEGE_ADMIN membership. Add acting-college superadmin path through central policy.

## G2-3-024-039  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:225-228`
- vNext now: `src/modules/groups/admin-read-service.ts:207-227`
- Fix: Legacy events unbounded per group, VNext detail limits to25 with no visible continuation in cited page. Add Load older events and stable order.
