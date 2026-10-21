# Work packet (wave 2): edit src/app/(authenticated)/college/groups/page.tsx

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/college-hidden-student-group.md, docs/audit/gap2/lane-15/u007-college-admin-student-groups.md, docs/audit/gap2/lane-3/admin-group-controller.md

## G2-14-007-022  [P2] GAP  facet F11  effort M
- Legacy: Legacy redirect itself not permissioned; enclosing AdminLayout restores FACULTY ADMIN session, then People destination handles authorization — `docs/legacy-source/frontend/src/pages/college-admin/student-groups/[id].js:15-15`; `docs/legacy-source/frontend/src/layouts/AdminLayout.js:48-69`
- vNext now: `src/app/(authenticated)/college/groups/[groupId]/page.tsx:54-65`; `src/app/(authenticated)/college/groups/page.tsx:47-53`
- Fix: Route legacy alias through authenticated college role, leave authorization to People destination

## G2-15-007-010  [P2] GAP  facet F04  effort S
- Legacy: Legacy redirect target `/college-admin/people` shows People directory by route (`student-groups.js:16-19`)
- vNext now: New groups page title `Student Groups` and college description (`college/groups/page.tsx:79-82)
- Fix: Legacy URLs must resolve to People, not Group listing

## G2-15-007-026  [P2] GAP  facet F13  effort S
- Legacy: Skeleton active paragraph rows4 while router not ready (`student-groups.js:15-19`)
- vNext now: Server PageHeader + live directory/empty states; no redirect skeleton (`college/groups/page.tsx:55-60,128-137)
- Fix: Add legacy path server redirect (no prolonged skeleton) preserving destination semantics

## G2-15-007-034  [P2] GAP  facet F19  effort S
- Legacy: Old page constant skeleton and replace, no group network requests (`student-groups.js:14-19)
- vNext now: VNext selects counts and limit50 per page (`college/groups/page.tsx:63-70; admin-read-service.ts:97-150)
- Fix: Avoid work at legacy route; if new feature shipped retain indexed paginated query

## G2-15-007-035  [P2] GAP  facet F20  effort S
- Legacy: Legacy `router.isReady` effect prevents early replace and never mounts group component (`student-groups.js:15-19)
- vNext now: VNext server authorization + no alias route surfaced (`college/groups/page.tsx:47-60)
- Fix: Handle old direct URL/server redirects including query/hash safely

## G2-3-024-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:93-146`
- vNext now: `src/app/(authenticated)/college/groups/page.tsx:42-82`, `src/modules/groups/college-group-management-service.ts:92-181`
- Fix: Legacy generic group list/create/edit/status/delete/reconcile in one API, VNext college Student Groups page only directly manages STUDY_GROUP and references electives/projects elsewhere. Map type-specific routes.

## G2-3-024-003  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:95-102`
- vNext now: `src/app/(authenticated)/college/groups/page.tsx:80-202`
- Fix: Legacy list hides elective and project groups when kind absent; VNext description and filtered directory include Study, Project teams and Electives. Align default list composition.

## G2-3-024-005  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:95-102`
- vNext now: `src/app/(authenticated)/college/groups/page.tsx:144-190`
- Fix: Legacy kind/status filter only without pagination; VNext table columns Group, Type, Status, Members, Waitlisted and pagination. Match compact legacy labels and row states.

## G2-3-024-009  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:95-103`
- vNext now: `src/modules/groups/admin-read-service.ts:73-155`, `src/app/(authenticated)/college/groups/page.tsx:61-74`
- Fix: Legacy list no offset/page, VNext directory paginates with typed kind/status filters and normalizes bad offset. Match default total/active grouping.

## G2-3-024-036  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:75-91`
- vNext now: `src/app/(authenticated)/college/groups/page.tsx:80-86`
- Fix: Legacy labels Student Groups, Electives-managed and Project Team-managed warnings; VNext page includes project/elective kinds in directory and new labels. Match exact warnings in actions.
