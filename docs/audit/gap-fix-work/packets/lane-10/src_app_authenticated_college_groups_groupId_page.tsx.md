# Work packet: edit src/app/(authenticated)/college/groups/[groupId]/page.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/college-hidden-student-group.md, docs/audit/gap2/lane-3/admin-group-controller.md

## G2-14-007-013  [P1] GAP  facet F05  effort S
- Legacy: Legacy path :id ignored and not validated, redirects all old ids; vNext canonical group detail validates groupId and notFound() on invalid — `docs/legacy-source/frontend/src/pages/college-admin/student-groups/[id].js:6-12`
- vNext now: `src/app/(authenticated)/college/groups/[groupId]/page.tsx:49-68`
- Fix: Ensure old-id links always redirect, not pass legacy numeric IDs into UUID group lookup

## G2-14-007-016  [P1] GAP  facet F07  effort S
- Legacy: Legacy no validation text or not-found message; vNext canonical detail displays 404 for unknown GroupReadError — `docs/legacy-source/frontend/src/pages/college-admin/student-groups/[id].js:8-12`
- vNext now: `src/app/(authenticated)/college/groups/[groupId]/page.tsx:57-68`
- Fix: Old group URLs must redirect even if invalid ID, not display 404

## G2-14-007-027  [P1] GAP  facet F13  effort S
- Legacy: Legacy repeated redirect on browser back prevented by replace(); vNext canonical detail has notFound on invalid ID — `docs/legacy-source/frontend/src/pages/college-admin/student-groups/[id].js:9-12`
- vNext now: `src/app/(authenticated)/college/groups/[groupId]/page.tsx:59-68`
- Fix: Preserve no-history stale route behavior and generic ID matching

## G2-14-007-037  [P1] GAP  facet F20  effort S
- Legacy: Legacy groupId any string (including invalid/removed) still reaches People; vNext group details missing ID triggers notFound — `docs/legacy-source/frontend/src/pages/college-admin/student-groups/[id].js:6-12`
- vNext now: `src/app/(authenticated)/college/groups/[groupId]/page.tsx:55-68`
- Fix: Catch all legacy group ID forms, ignore group data, redirect consistently

## G2-3-024-017  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:141-146`
- vNext now: `src/app/(authenticated)/college/groups/[groupId]/page.tsx:103-110`
- Fix: Legacy reconciliation returns groupId+activeCount; VNext shows activeCount from persisted read but no explicit reconciliation control in page. Add support-only reconcile or decision.
