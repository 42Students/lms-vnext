# Work packet (wave 2): edit src/modules/groups/college-group-management-service.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/admin-group-controller.md

## G2-3-024-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:93-146`
- vNext now: `src/app/(authenticated)/college/groups/page.tsx:42-82`, `src/modules/groups/college-group-management-service.ts:92-181`
- Fix: Legacy generic group list/create/edit/status/delete/reconcile in one API, VNext college Student Groups page only directly manages STUDY_GROUP and references electives/projects elsewhere. Map type-specific routes.

## G2-3-024-007  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:105-130`
- vNext now: `src/modules/groups/college-group-management-service.ts:92-181`
- Fix: Legacy LmsGroup accepts generic kind/status/creator and transition, VNext createCollegeStudyGroup forces STUDY_GROUP/DRAFT. Preserve permitted types through their owning screens.

## G2-3-024-011  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:105-111`
- vNext now: `src/modules/groups/college-group-management-service.ts:92-118`
- Fix: Legacy GroupUpsertRequest accepts generic kinds except managed ELECTIVE/PROJECT_TEAM; VNext study group form restricts kind and stronger version/capacity validation. Match entry/validation copy.

## G2-3-024-018  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:126-139`
- vNext now: `src/modules/groups/college-group-management-service.ts:118-181`
- Fix: Legacy status transition and soft delete are direct operations; VNext college group actions with confirmation and optimistic version. Compare modal labels and lifecycle choices.

## G2-3-024-020  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:105-139`
- vNext now: `src/modules/groups/college-group-management-service.ts:92-181`
- Fix: Legacy create/update/status/delete softdelete, VNext create/change versions, with no generic editable project/elective endpoint by design. Provide per-kind parity and history retention.

## G2-3-024-023  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:42-45`, `95-116`
- vNext now: `src/modules/groups/admin-read-service.ts:73-180`, `src/modules/groups/college-group-management-service.ts:27-53`
- Fix: Legacy college admin plus scoped superadmin can manage group via guard; VNext study mutation requires active COLLEGE_ADMIN membership. Add acting-college superadmin path through central policy.

## G2-3-024-025  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:119-139`
- vNext now: `src/modules/groups/college-group-management-service.ts:118-181`
- Fix: Legacy statuses and soft-delete transitions map to new DRAFT/ACTIVE/CLOSED/ARCHIVED with version CAS. Document permitted transition matrix.

## G2-3-024-040  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:141-146`
- vNext now: `src/modules/groups/service.ts:73-75`, `src/modules/groups/college-group-management-service.ts:118-181`
- Fix: Legacy reconcile counter via explicit operation; VNext membership writes guarded by row locks/version. Add repair path or show counter drift diagnostic.
