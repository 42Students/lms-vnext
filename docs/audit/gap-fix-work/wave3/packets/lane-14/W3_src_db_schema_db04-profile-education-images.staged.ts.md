# Work packet (wave 3): edit src/db/schema/db04-profile-education-images.staged.ts

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u019-image-entry.md, docs/audit/gap2/lane-20/student-image-controller.md, docs/audit/gap2/lane-20/student-image.md

## G2-16-019-001  [P1] MISSING  facet F01  effort L
- Legacy: ImageEntry.java:3-13 serializable value object, no table.
- vNext now: db04-profile-education-images.staged.ts:181-198 planned normalized gallery rows.
- Fix: Make real gallery API/read or record retirement.

## G2-16-019-002  [P1] MISSING  facet F01  effort L
- Legacy: StudentImageController.java:21-23,93-150 GET/POST/PATCH /api/v1/learner-images.
- vNext now: db04-profile-education-images.staged.ts:1-8 explicitly not exported.
- Fix: Implement ownership scoped gallery endpoints.

## G2-16-019-007  [P1] MISSING  facet F05  effort L
- Legacy: StudentImageServiceImpl.java:102-114 flattens rows into images array.
- vNext now: db04-profile-education-images.staged.ts:181-235 no runtime list method.
- Fix: Implement ordered learner gallery read.

## G2-16-019-015  [P1] MISSING  facet F10  effort L
- Legacy: StudentImageServiceImpl.java:53-63,130-142 deactivate toggles active=0 in JSON.
- vNext now: db04-profile-education-images.staged.ts:192-198 proposed isActive/deactivatedAt.
- Fix: Implement idempotent deactivate, don't delete receipt.

## G2-16-019-016  [P1] MISSING  facet F11  effort L
- Legacy: StudentImageController.java:56-60,93-104 learner self and authorized staff.
- vNext now: db04-profile-education-images.staged.ts:185-212 owner FK but no route auth.
- Fix: Implement self/staff read/write permissions before signed URLs.

## G2-16-019-029  [P1] MISSING  facet F22  effort L
- Legacy: ImageEntry.java:3-38 is not a JPA table; stored inside StudentImage JSON.
- vNext now: db04-profile-education-images.staged.ts:181-235 normalized table STAGED ONLY.
- Fix: Promote reconciled DB04 migration and JSON-to-row model or waive migration.

## G2-16-019-032  [P1] MISSING  facet F23  effort L
- Legacy: StudentImageController.java:93-150 create/get/deactivate available.
- vNext now: db04-profile-education-images.staged.ts:1-8 only draft model.
- Fix: Complete profile-gallery lifecycle before parity sign-off.

## G2-20-024-001  [P1] MISSING  facet F01  effort L
- Legacy: POST/create GET/getImageDataByLearnerId PATCH/deactivate `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentImageController.java:93-156`
- vNext now: Normalized image model staged only `src/db/schema/db04-profile-education-images.staged.ts:1-8,181-235`
- Fix: Implement server CRUD or formally retire feature

## G2-20-024-002  [P1] MISSING  facet F02  effort L
- Legacy: Gallery result StudentImageResponseDTO `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentImageController.java:109-110,128-132`
- vNext now: No mapped active gallery API `src/db/schema/db04-profile-education-images.staged.ts:1-8`
- Fix: Restore gallery browse and action surfaces

## G2-20-024-012  [P1] MISSING  facet F10  effort L
- Legacy: Create uses StudentImageService per learner `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentImageController.java:93-110`
- vNext now: No exported persistence schema, so impossible to store through staged model `src/db/schema/db04-profile-education-images.staged.ts:1-8`
- Fix: Promote schema and numbered migration

## G2-20-024-025  [P1] MISSING  facet F22  effort L
- Legacy: Legacy MySQL StudentImage JSON MEDIUMTEXT and numeric id `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/StudentImageServiceImpl.java:33-50`
- vNext now: Postgres profile_images planned but staged, no migration `src/db/schema/db04-profile-education-images.staged.ts:1-8,181-235`
- Fix: Create numbered migration and adapt schema

## G2-20-015-001  [P1] MISSING  facet F01  effort L
- Legacy: POST /api/v1/learner-images/create, GET getImageDataByLearnerId, PATCH deactivate `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentImageController.java:21-23,93-110,113-150`
- vNext now: No mapped production StudentImage CRUD; candidate schema staged and explicitly not exported/migrated `src/db/schema/db04-profile-education-images.staged.ts:1-8,181-235`
- Fix: Implement and migrate normalized image workflow or explicitly retire legacy profile gallery

## G2-20-015-003  [P1] MISSING  facet F02  effort L
- Legacy: Images provided as list to profile gallery, each with imageId/imageUrl/active `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/StudentImageServiceImpl.java:102-114`
- vNext now: Staged normalized image row displayOrder/isActive/receiptId but no shipped gallery API `src/db/schema/db04-profile-education-images.staged.ts:181-198`
- Fix: Restore gallery list ordering, active toggle and accessible empty/loading state

## G2-20-015-034  [P1] MISSING  facet F22  effort L
- Legacy: Legacy JPA single table MEDIUMTEXT with id Long and no foreign key `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/StudentImage.java:10-20`
- vNext now: New schema STAGED ONLY explicitly no migration/export; typed profile_images FK and indexes `src/db/schema/db04-profile-education-images.staged.ts:1-8,181-235`
- Fix: Promote reconciled model to real numbered migration with receipt parent owner match

## G2-20-015-036  [P1] MISSING  facet F23  effort L
- Legacy: Legacy full gallery/create/deactivate read routes exist `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentImageController.java:93-150`
- vNext now: New only staged schema and no runtime image routes found in mapped closure `src/db/schema/db04-profile-education-images.staged.ts:1-8`
- Fix: Treat profile image persistence/gallery as feature-parity blocker unless explicitly out of scope
