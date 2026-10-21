# Work packet (wave 2): edit src/modules/placements/tpo-drive-edit-service.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drives-jobid-edit.md, docs/audit/gap2/lane-2/admin-job-controller.md, docs/audit/gap2/lane-8/admin-job-service.md

## G2-11-011-067  [P2] GAP  facet F10  effort M
- Legacy: Legacy getEligibilityPreview refreshes after writes. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:18`
- vNext now: New returns updated ID,status,updatedAt,notified only. `src/modules/placements/tpo-drive-edit-service.ts:124`
- Fix: Refresh eligibility projection and show current reach after save.

## G2-11-011-077  [P2] GAP  facet F12  effort M
- Legacy: Old edit deliberately omits obsolete backlog/gap rules on save. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:264`
- vNext now: New minCgpa patch leaves existing other policy columns as is. `src/modules/placements/tpo-drive-edit-service.ts:86`
- Fix: Document and map legacy cleanup policy for migrated records.

## G2-11-011-085  [P2] MISSING  facet F14  effort M
- Legacy: Wanted skills input stored with drive. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:695`
- vNext now: New patch excludes wanted skills. `src/modules/placements/tpo-drive-edit-service.ts:64`
- Fix: Include skills editing and persistence.

## G2-11-011-108  [P2] GAP  facet F21  effort M
- Legacy: Company history and eligibility preview API fetched as support data. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:18`
- vNext now: New service fetches season and policy but no company history. `src/modules/placements/tpo-drive-edit-service.ts:24`
- Fix: Integrate company history and choice data after selection.

## G2-11-011-115  [P2] GAP  facet F22  effort M
- Legacy: Legacy save metadata lastSavedAt/by visible. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:89`
- vNext now: New exposes updatedAt but not lastSavedBy. `src/modules/placements/tpo-drive-edit-service.ts:34`
- Fix: Store/surface actor+timestamp in editing UX.

## G2-2-016-001  [P2] GAP  facet F01  effort L
- Legacy: Legacy college admin Job service owns list/create/edit/delete and application status mutations (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:161-290,433-583,998-1079,1217-1452`)
- vNext now: VNext splits job lifecycle, TPO edit, application service, bulk actions into separate routes (`src/modules/placements/job-service.ts:86-766; src/modules/placements/tpo-drive-edit-service.ts:10-127; src/modules/placements/tpo-bulk-application-stage-service.ts:27-110`)
- Fix: Map navigation routes and matching action availability by College Admin/TPO roles

## G2-8-012-001  [P2] GAP  facet F01  effort L
- Legacy: Legacy college admin Job service owns list/create/edit/delete and application status mutations (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:161-290,433-583,998-1079,1217-1452`)
- vNext now: VNext splits job lifecycle, TPO edit, application service, bulk actions into separate routes (`src/modules/placements/job-service.ts:86-766; src/modules/placements/tpo-drive-edit-service.ts:10-127; src/modules/placements/tpo-bulk-application-stage-service.ts:27-110`)
- Fix: Map navigation routes and matching action availability by College Admin/TPO roles
