# Work packet (wave 2): edit src/db/schema/db04-profile-education-images.staged.ts

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u019-image-entry.md, docs/audit/gap2/lane-20/student-image-controller.md, docs/audit/gap2/lane-20/student-image.md, docs/audit/gap2/lane-3/qualification.md

## G2-16-019-003  [P2] GAP  facet F02  effort S
- Legacy: ImageEntry.java:5-7 three visible image fields: imageId, imageUrl, active.
- vNext now: db04-profile-education-images.staged.ts:184-198 UUID/receipt/isActive order.
- Fix: Map fields and preserve image previews/order.

## G2-16-019-004  [P2] GAP  facet F03  effort S
- Legacy: StudentImageServiceImpl.java:82-87 active=1 by default, 12-char imageId.
- vNext now: db04-profile-education-images.staged.ts:184,192-198 UUID and boolean.
- Fix: Return old public imageId alias or migrate references.

## G2-16-019-005  [P2] GAP  facet F04  effort S
- Legacy: ImageEntry.java:5-7 imageId String, imageUrl String, active int.
- vNext now: db04-profile-education-images.staged.ts:184-198 receipt ID/boolean no URL.
- Fix: Build DTO adapter to authorized signed image URLs.

## G2-16-019-006  [P2] GAP  facet F05  effort S
- Legacy: StudentImageServiceImpl.java:66-89 JSON list follows input order.
- vNext now: db04-profile-education-images.staged.ts:192-198 displayOrder int proposed.
- Fix: Persist index/order, deterministic tie-break.

## G2-16-019-008  [P2] GAP  facet F06  effort S
- Legacy: StudentImageServiceImpl.java:66-87 nonblank trimmed HTTPS URL check.
- vNext now: db04-profile-education-images.staged.ts:188-191 receipt references only.
- Fix: Accept secure receipt token and reject external refs with clear errors.

## G2-16-019-009  [P2] GAP  facet F06  effort S
- Legacy: StudentImageRequestDTO.java:8-13 imageUrls up to10.
- vNext now: db04-profile-education-images.staged.ts:181-235 no max10 count.
- Fix: Enforce max10 active per learner.

## G2-16-019-014  [P2] GAP  facet F10  effort S
- Legacy: StudentImageServiceImpl.java:33-40 creates new StudentImage aggregate.
- vNext now: db04-profile-education-images.staged.ts:181-235 normalized one row/image.
- Fix: Decide append-vs-replace semantics transactionally.

## G2-16-019-019  [P2] MISSING  facet F13  effort S
- Legacy: StudentImageServiceImpl.java:44-49 missing gallery returns null, controller 128-132 returns404.
- vNext now: db04-profile-education-images.staged.ts:1-8 no route/empty state.
- Fix: Return controlled 404/empty gallery with retry.

## G2-16-019-027  [P2] GAP  facet F20  effort S
- Legacy: StudentImageServiceImpl.java:130-142 missing imageId leaves unchanged yet returns true.
- vNext now: db04-profile-education-images.staged.ts:192-198 no runtime handler.
- Fix: Decide idempotent missing-image semantics with explicit result.

## G2-20-024-003  [P2] MISSING  facet F03  effort M
- Legacy: Deactivate Image action `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentImageController.java:135-155`
- vNext now: Staged row has isActive and deactivatedAt only `src/db/schema/db04-profile-education-images.staged.ts:192-198`
- Fix: Wire deactivate control/API

## G2-20-024-004  [P2] GAP  facet F04  effort M
- Legacy: Numeric learnerId and string imageId `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentImageController.java:101-104,150-154`
- vNext now: UUID membership and receipt key `src/db/schema/db04-profile-education-images.staged.ts:181-198`
- Fix: Translate identifiers

## G2-20-024-005  [P2] GAP  facet F05  effort M
- Legacy: Array imageUrls 1..10 in submitted order `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/StudentImageRequestDTO.java:8-13`
- vNext now: One row per image with displayOrder `src/db/schema/db04-profile-education-images.staged.ts:181-198`
- Fix: Preserve user order and max10

## G2-20-024-006  [P2] GAP  facet F06  effort S
- Legacy: learnerId required positive integer `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentImageController.java:41-53`
- vNext now: New membership UUID key, no public integer route `src/db/schema/db04-profile-education-images.staged.ts:181-191`
- Fix: Validate UUID and map old error

## G2-20-024-007  [P2] GAP  facet F06  effort M
- Legacy: Allowed imageUrls HTTPS or safe storage key `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentImageController.java:62-90`
- vNext now: New private receipt FK and purpose `src/db/schema/db04-profile-education-images.staged.ts:188-212`
- Fix: Use signed uploaded receipt rather than public URL

## G2-20-024-013  [P2] GAP  facet F10  effort M
- Legacy: Deactivate is PATCH by learnerId+imageId `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentImageController.java:135-155`
- vNext now: New has isActive and deactivatedAt fields `src/db/schema/db04-profile-education-images.staged.ts:192-198`
- Fix: Add idempotent scoped update route

## G2-20-024-015  [P2] GAP  facet F12  effort M
- Legacy: Folder segment profile-images/user-{learnerId} `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentImageController.java:86-89`
- vNext now: Receipt ownership FK plus IMAGE purpose `src/db/schema/db04-profile-education-images.staged.ts:188-212`
- Fix: Map folder into safe receipt identity

## G2-20-024-016  [P2] MISSING  facet F13  effort S
- Legacy: Missing gallery GET returns 404 `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentImageController.java:128-132`
- vNext now: No runtime gallery empty/error state `src/db/schema/db04-profile-education-images.staged.ts:1-8`
- Fix: Show empty vs not found

## G2-20-024-021  [P2] MISSING  facet F18  effort S
- Legacy: Legacy exact positive int errors and 401 Authentication required `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentImageController.java:41-53,95-99`
- vNext now: No equivalent route wording `src/db/schema/db04-profile-education-images.staged.ts:1-8`
- Fix: Map validation and unauthorized copy

## G2-20-015-002  [P2] GAP  facet F01  effort S
- Legacy: Legacy image list stored per learnerId string `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/StudentImage.java:17-20`
- vNext now: Proposed future relation keys learnerMembershipId UUID `src/db/schema/db04-profile-education-images.staged.ts:181-188`
- Fix: Reconcile learner ID and membership scopes

## G2-20-015-005  [P2] GAP  facet F03  effort S
- Legacy: Each image has 12-character lowercase compact UUID imageId `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/StudentImageServiceImpl.java:83-99`
- vNext now: UUID primary ID with hyphens `src/db/schema/db04-profile-education-images.staged.ts:184-185`
- Fix: Map 12-char IDs to UUID or maintain compatibility in URL/action endpoint

## G2-20-015-006  [P2] GAP  facet F03  effort S
- Legacy: Deactivate action marks image active=0 without deleting URL `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/StudentImageServiceImpl.java:53-63,130-142`
- vNext now: Proposed isActive=false and deactivatedAt timestamp `src/db/schema/db04-profile-education-images.staged.ts:192-198,228-232`
- Fix: Provide deactivate action mapped to normalized row and timestamp

## G2-20-015-007  [P2] GAP  facet F04  effort S
- Legacy: StudentImage id Long identity, learnerId varchar and MEDIUMTEXT JSON imageData `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/StudentImage.java:13-20`
- vNext now: UUID id, learnerMembership UUID, receiptId FK, order, activity state `src/db/schema/db04-profile-education-images.staged.ts:181-198`
- Fix: Migrate JSON array to normalized private receipt rows with verified ownership

## G2-20-015-008  [P2] GAP  facet F04  effort S
- Legacy: Legacy imageData JSON keys imageId/imageUrl/active `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/StudentImageServiceImpl.java:82-90`
- vNext now: Proposed id/receiptId/isActive fields, no raw public URL `src/db/schema/db04-profile-education-images.staged.ts:181-198`
- Fix: Adapt client model for signed image URLs and imageId compatibility

## G2-20-015-009  [P2] GAP  facet F05  effort S
- Legacy: Gallery order equals JSON array order from create request `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/StudentImageServiceImpl.java:66-90,102-114`
- vNext now: Proposed displayOrder integer default0; active order index `src/db/schema/db04-profile-education-images.staged.ts:192-193,217-219`
- Fix: Populate explicit order for each submitted image and resolve ties

## G2-20-015-010  [P2] MISSING  facet F05  effort S
- Legacy: Repository findByLearnerId returns one JSON aggregate `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/StudentImageServiceImpl.java:43-50`
- vNext now: Proposed one row per receipt, no runtime read query `src/db/schema/db04-profile-education-images.staged.ts:181-235`
- Fix: Add batch ordered lookup with tenant/member guard

## G2-20-015-011  [P2] GAP  facet F06  effort S
- Legacy: Request imageUrls 1..10, each nonblank <=2048; learnerId <=255 `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/StudentImageRequestDTO.java:8-13`
- vNext now: Proposed row constraints no array count/max 10 at DB level `src/db/schema/db04-profile-education-images.staged.ts:181-235`
- Fix: Enforce max10 per learner in service transaction, length/name policy in upload grant

## G2-20-015-018  [P2] GAP  facet F10  effort M
- Legacy: Create always INSERTs new StudentImage row for same learner `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/StudentImageServiceImpl.java:33-40`
- vNext now: Normalized proposed unique (owner,receipt), no whole-list overwrite semantics `src/db/schema/db04-profile-education-images.staged.ts:213-216`
- Fix: Define append vs replace gallery and duplicate receipt handling in service

## G2-20-015-019  [P2] MISSING  facet F10  effort S
- Legacy: Deactivate returns success true if learner record exists even when imageId absent `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/StudentImageServiceImpl.java:53-63,135-142`
- vNext now: Proposed normalized row operation not implemented `src/db/schema/db04-profile-education-images.staged.ts:181-235`
- Fix: Return idempotent removed/status response and detect absent image ID

## G2-20-015-022  [P2] GAP  facet F12  effort S
- Legacy: Controller insists path contains /profile-images/user-{learnerId}/ `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentImageController.java:86-89`
- vNext now: New private receipt purpose PROFILE_IMAGE and owner FK `src/db/schema/db04-profile-education-images.staged.ts:189-191,200-212`
- Fix: Replace brittle substring path check with authoritative object receipt

## G2-20-015-023  [P2] MISSING  facet F13  effort S
- Legacy: Missing image returns GET 404 no response body `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentImageController.java:128-132`
- vNext now: No runtime endpoint, schema staged `src/db/schema/db04-profile-education-images.staged.ts:1-8`
- Fix: Return safe not-found image-gallery state and placeholder

## G2-20-015-029  [P2] MISSING  facet F18  effort S
- Legacy: Legacy exact errors empty URL/allowed folder/invalid image reference `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentImageController.java:62-90`
- vNext now: No authored equivalent copy in staged table `src/db/schema/db04-profile-education-images.staged.ts:181-235`
- Fix: Define exact copy for legacy validation cases via API error codes

## G2-20-015-032  [P2] GAP  facet F20  effort S
- Legacy: Malformed image refs rejected if ..,?,#,:/ `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentImageController.java:80-88`
- vNext now: Receipt FK controls allowed object scope `src/db/schema/db04-profile-education-images.staged.ts:200-212`
- Fix: Reject invalid raw refs without accepting arbitrary paths

## G2-20-015-035  [P2] GAP  facet F23  effort S
- Legacy: Legacy loose URL list can hold stale public storage links `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/StudentImageServiceImpl.java:66-94`
- vNext now: Intentional privacy upgrade to owned receipt FK, no public links `src/db/schema/db04-profile-education-images.staged.ts:188-212`
- Fix: Retain security change, document legacy link conversion if historical assets kept

## G2-3-017-007  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Qualification.java:18-33`
- vNext now: `src/db/schema/db04-profile-education-images.staged.ts:28-38`, `src/modules/people/profile-validation.ts:272-279`
- Fix: Legacy learnerId required numeric FK and educationType/institutionName required nullable other text; staged vNext UUID membership FK, educationType max120 and institutionName max300; live JSON document `institution` field. Define migration projection.

## G2-3-017-008  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Qualification.java:35-54`
- vNext now: `src/db/schema/db04-profile-education-images.staged.ts:39-49`, `src/modules/people/profile-validation.ts:279-300`
- Fix: Legacy years are optional strings, pursuing/recent nullable Booleans default false, grade/maxGrade optional; staged vNext int year and required grade/max and pursuing nonnull. Handle legacy partial qualifications without loss.

## G2-3-017-010  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Qualification.java:72-82`
- vNext now: `src/db/schema/db04-profile-education-images.staged.ts:50-52`, `src/modules/people/profile-validation.ts:300-313`
- Fix: Legacy qualifyingExam, examRank and arbitrary JSON examDetails; staged vNext has them but live schema only qualifyingExam+examDetails and not examRank. Preserve ranked legacy values and dynamic fields.

## G2-3-017-050  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Qualification.java:35-39`
- vNext now: `src/db/schema/db04-profile-education-images.staged.ts:109-125`, `src/modules/people/learner-education-picker-model.ts:44-53`
- Fix: Legacy years stored strings and current/future pursuing endYear accepted, staged vNext integers range1900–2200 but live validator 1900–2100, endYear null pursuing. Align DB/API year bounds.

## G2-16-019-024  [P3] GAP  facet F18  effort S
- Legacy: ImageEntry.java:15-37 exact serialization getter `getImageId/getImageUrl/getActive`.
- vNext now: db04-profile-education-images.staged.ts:184-198 lower camel different fields.
- Fix: Keep response camel-case imageId/imageUrl/active.

## G2-16-019-030  [P3] GAP  facet F22  effort S
- Legacy: StudentImageServiceImpl.java:82-90 stores active numeric1.
- vNext now: db04-profile-education-images.staged.ts:192-198 uses boolean.
- Fix: Normalize 1/0 to true/false.

## G2-20-024-022  [P3] GAP  facet F19  effort M
- Legacy: Fetch by learnerId returns JSON list, max10 input [L:113-132,D:8-13]
- vNext now: New normalized indexed image rows proposed `src/db/schema/db04-profile-education-images.staged.ts:181-235`
- Fix: Batch list by membership and sortOrder
