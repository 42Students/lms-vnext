# Work packet (wave 2): edit src/modules/electives/admin-directory-service.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-electives.md

## G2-10-006-013  [P2] GAP  facet F04  effort M
- Legacy: Old list provides offeringCount and currentStudentCount from slot backend view `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:213-214`
- vNext now: New reads group-backed active offerings and distinct active learner memberships `src/modules/electives/admin-directory-service.ts:50-75`
- Fix: Verify old roster count semantics against group-status/countDistinct and document differences

## G2-10-006-017  [P2] GAP  facet F05  effort S
- Legacy: Old search locally matches slot name, program name and description `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:125-129`
- vNext now: New SQL q matches slot name or program name but omits description `src/modules/electives/admin-directory-service.ts:39-46`
- Fix: Include description in server query with escaped ILIKE

## G2-10-006-022  [P2] GAP  facet F05  effort M
- Legacy: Old Table defaults 20 per page with fixed size `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:257-258`
- vNext now: New caps results at 200, no pagination or next action `src/modules/electives/admin-directory-service.ts:47-50` `src/app/(authenticated)/admin/electives/page.tsx:107-108`
- Fix: Implement 20-row pagination across every matching slot and accurate total counts

## G2-10-006-044  [P2] GAP  facet F10  effort M
- Legacy: Old GET /api/v1/electives/admin/slots accepts programId semester includeArchived `docs/legacy-source/frontend/src/api/Services/ElectiveService.js:8-16` `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:59-62`
- vNext now: New direct listSuperAdminElectives query q status programId semesterNumber, no raw matching legacy contract `src/modules/electives/admin-directory-service.ts:11-22` `src/modules/electives/admin-directory-model.ts:2-7`
- Fix: Document field mapping and inclusive archived behavior for API compatibility

## G2-10-006-046  [P2] GAP  facet F10  effort M
- Legacy: Old slot view includes offerings, roster and faculty under GET slot `docs/legacy-source/frontend/src/api/Services/ElectiveService.js:12-12` `docs/legacy-source/frontend/src/components/admin/electives/ElectiveSlotPanel.jsx:28-53`
- vNext now: New admin list shows summary counts and separate offerings GET fetch `src/modules/electives/admin-directory-service.ts:22-75` `src/components/electives/college-elective-offering-manager.tsx:112-134`
- Fix: Provide equivalent consolidated slot detail endpoint/read model for selected panel
