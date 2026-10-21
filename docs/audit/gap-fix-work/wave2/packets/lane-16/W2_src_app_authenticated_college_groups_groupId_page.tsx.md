# Work packet (wave 2): edit src/app/(authenticated)/college/groups/[groupId]/page.tsx

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/college-hidden-student-group.md, docs/audit/gap2/lane-3/admin-group-controller.md

## G2-14-007-005  [P2] GAP  facet F02  effort S
- Legacy: Legacy renders one ln-module containing animated 4-row Skeleton during redirect; vNext old path has no mapped page; actual group detail renders full 5-metric summary — `docs/legacy-source/frontend/src/pages/college-admin/student-groups/[id].js:12-12`
- vNext now: `src/app/(authenticated)/college/groups/[groupId]/page.tsx:82-90`
- Fix: Add transitional skeleton only if client redirect required; prefer instant server redirect

## G2-14-007-006  [P2] GAP  facet F02  effort S
- Legacy: Legacy AdminLayout wraps hidden skeleton; vNext shared authenticated college shell wraps real detail — `docs/legacy-source/frontend/src/pages/college-admin/student-groups/[id].js:15-15`; `docs/legacy-source/frontend/src/layouts/AdminLayout.js:26-46`
- vNext now: `src/app/(authenticated)/college/groups/[groupId]/page.tsx:82-90`
- Fix: Do not show full group detail on retired alias; keep own new route separate

## G2-14-007-020  [P2] GAP  facet F10  effort S
- Legacy: Legacy useEffect router.replace has no API request/write; vNext new group page calls getCollegeGroupDetail and listCollegePeopleWithRuntime — `docs/legacy-source/frontend/src/pages/college-admin/student-groups/[id].js:8-12`
- vNext now: `src/app/(authenticated)/college/groups/[groupId]/page.tsx:49-79`
- Fix: Old alias should redirect before any group DB fetch, no mutation

## G2-14-007-022  [P2] GAP  facet F11  effort M
- Legacy: Legacy redirect itself not permissioned; enclosing AdminLayout restores FACULTY ADMIN session, then People destination handles authorization — `docs/legacy-source/frontend/src/pages/college-admin/student-groups/[id].js:15-15`; `docs/legacy-source/frontend/src/layouts/AdminLayout.js:48-69`
- vNext now: `src/app/(authenticated)/college/groups/[groupId]/page.tsx:54-65`; `src/app/(authenticated)/college/groups/page.tsx:47-53`
- Fix: Route legacy alias through authenticated college role, leave authorization to People destination

## G2-14-007-033  [P2] GAP  facet F18  effort S
- Legacy: Legacy target path exactly /college-admin/people, never title Student Group Detail; vNext new path title group.name — `docs/legacy-source/frontend/src/pages/college-admin/student-groups/[id].js:10-12`
- vNext now: `src/app/(authenticated)/college/people/page.tsx:5-7`; `src/app/(authenticated)/college/groups/[groupId]/page.tsx:84-89`
- Fix: Preserve old target semantics, show new Group title only on canonical new route

## G2-3-024-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:150-265`
- vNext now: `src/app/(authenticated)/college/groups/[groupId]/page.tsx:150-244`, `src/modules/groups/college-group-detail-write-service.ts:20-133`
- Fix: Legacy members, bulk add, locks, events, rule GET/PUT/DELETE/preview/apply endpoints; VNext splits detail actions/rule preview, bulk CSV is preview-only. Build route matrix for actual mutations.

## G2-3-024-004  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:114-116`
- vNext now: `src/app/(authenticated)/college/groups/[groupId]/page.tsx:85-153`
- Fix: Legacy group GET returns flat GroupView status/activeCount/capacity; VNext group detail has header statistics, rule, members, events and action panels. Match legacy section order.

## G2-3-024-006  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:225-228`
- vNext now: `src/app/(authenticated)/college/groups/[groupId]/page.tsx:215-244`
- Fix: Legacy event timeline returns raw member events, VNext renders activity table and EmptyState. Match actor/time text and action badges.

## G2-3-024-019  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:203-223`
- vNext now: `src/app/(authenticated)/college/groups/[groupId]/page.tsx:185-214`
- Fix: Legacy remove/lock per learner (with reason and lock), VNext details provide CollegeStudyMemberActions but confirmation body and error states differ. Check exact actions.

## G2-3-024-027  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:114-116`
- vNext now: `src/app/(authenticated)/college/groups/[groupId]/page.tsx:49-68`
- Fix: Legacy invalid group id handled by group access guard, VNext detail notFound on scoped invalid id. Keep nonenumerating 404 while rendering recovery link.
