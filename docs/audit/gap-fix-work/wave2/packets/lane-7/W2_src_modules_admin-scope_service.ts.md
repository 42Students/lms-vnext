# Work packet (wave 2): edit src/modules/admin-scope/service.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/auth-controller.md, docs/audit/gap2/lane-3/college-org-domain-workspace-scope.md

## G2-1-002-023  [P2] GAP  facet F06  effort M
- Legacy: `AuthController.java:569-596` superadmin scope accepts optional numeric/string orgId, collegeId and maps nonpositive to global null.
- vNext now: `src/modules/admin-scope/service.ts:16-25,96-101` requires strict discriminated `{kind:'organization',organizationId:uuid}` or `{kind:'college',collegeId:uuid}`; separate DELETE clears.
- Fix: Migrate old selector payload; provide explicit 'Global' reset using DELETE and input normalization/error.

## G2-3-032-014  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CollegeController.java:103-133`
- vNext now: `src/modules/admin-scope/service.ts:27-39`
- Fix: Legacy selector displays college numeric id, name, uniqueId, logo, orgId; vNext UUID/code/organizationName, active-only.

## G2-3-032-015  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:299-321`
- vNext now: `src/modules/admin-scope/service.ts:27-39`
- Fix: Legacy activeOrg/activeCollege are full DTOs in context; vNext choices contain compact display fields and selected scope separately.

## G2-3-032-018  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:74-94`
- vNext now: `src/modules/admin-scope/service.ts:55-94`
- Fix: Legacy fetches all college choices via all=true, maintains repository order; vNext sorts organization and college ascending.

## G2-3-032-021  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CollegeController.java:120-135`
- vNext now: `src/modules/admin-scope/service.ts:50-94`
- Fix: Legacy ordinary principal's org list includes same-org sibling colleges; vNext membership switcher lists memberships with ACTIVE status only.

## G2-3-032-022  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:214-270`
- vNext now: `src/modules/admin-scope/service.ts:16-25`
- Fix: Legacy college/org selections numeric or null; vNext strict discriminated union with UUID and kind, rejecting malformed selections.

## G2-3-032-061  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:58-94`
- vNext now: `src/modules/admin-scope/service.ts:50-94`
- Fix: Legacy loads organizations+colleges separately and caches client context; vNext fetches both concurrent SQL each SSR and can query many colleges.
