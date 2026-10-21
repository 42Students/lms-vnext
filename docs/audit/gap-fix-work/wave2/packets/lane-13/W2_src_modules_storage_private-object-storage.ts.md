# Work packet (wave 2): edit src/modules/storage/private-object-storage.ts

27 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/file-upload-controller.md, docs/audit/gap2/lane-20/r2-storage-utils.md, docs/audit/gap2/lane-3/private-doc-storage.md, docs/audit/gap2/lane-4/cross-third-party-integrations.md

## G2-10-027-011  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:176-176 — Upload grant valid 15 minutes.
- vNext now: src/modules/storage/private-object-storage.ts:67-75 — Defaults 10m, max 15m.
- Fix: Set expected expiry or show explicit expiration notice

## G2-10-027-017  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:683-689 — Key <tenant>/<folder>/user-ID or project-ID/<uuid>.<extension>.
- vNext now: src/modules/storage/private-object-storage.ts:85-95; src/db/schema/storage-files.ts:138-140 — Private/<collegeUUID>/<membershipUUID>/<namespace>/<uuid> paths.
- Fix: Store mapping from legacy object keys; don't infer from UUID

## G2-10-027-048  [P2] GAP  facet F12  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:176-176 — Signed PUT expires15m.
- vNext now: src/modules/storage/private-object-storage.ts:67-75 — Default10m bounded15m.
- Fix: Match expiry warning/timing

## G2-10-027-053  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:685-692 — Private store unavailable and presign failure distinct.
- vNext now: src/modules/storage/file-lifecycle.ts:42-50; src/modules/storage/private-object-storage.ts:47-75 — Storage error mapping to not configured/size invalid.
- Fix: Distinguish credential outage from invalid input

## G2-20-009-001  [P2] GAP  facet F01  effort M
- Legacy: R2StorageUtils is Spring @Component guarded by R2Condition, injected in upload/resource controllers; `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/R2StorageUtils.java:29-41`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/config/R2Condition.java:14-18`
- vNext now: No DI component, server-only storage modules imported by scoped services; `src/modules/storage/private-object-storage.ts:1-20`, `src/modules/storage/r2-config.ts:17-25`
- Fix: Map storage-disabled state to `STORAGE_NOT_CONFIGURED`, preserving optional dependency behavior.

## G2-20-009-009  [P2] GAP  facet F04  effort S
- Legacy: Legacy UUID filename preserves source extension; caller folder prefix supplied unchanged; `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/R2StorageUtils.java:102-124`
- vNext now: New key is private/{college UUID}/{membership UUID}/{namespace}/{UUID} with no source extension; originalName separate; `src/modules/storage/private-object-storage.ts:116-127`, `docs/architecture/file-and-video-apis.md:47,64`
- Fix: Retain originalName separately, do not rely on key extension or expose path.

## G2-20-009-016  [P2] GAP  facet F06  effort S
- Legacy: Legacy inputStream upload buffers whole stream in memory before putObject; `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/R2StorageUtils.java:52-63`
- vNext now: Browser directly PUTs to R2 using signed URL; `src/modules/storage/private-object-storage.ts:131-152`, `docs/architecture/file-and-video-apis.md:7-13`
- Fix: No server buffering; preserve upload progress and retry semantics.

## G2-20-009-025  [P2] GAP  facet F10  effort S
- Legacy: uploadFile(InputStream) server PUT metadata set Content-Length, MIME and disposition; `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/R2StorageUtils.java:52-63`
- vNext now: New presigned PUT returns URL/required headers and HEAD-after-upload verifies metadata; `src/modules/storage/private-object-storage.ts:131-152,172-206`
- Fix: Translate server upload callers to grant/complete; validate stored metadata after direct PUT.

## G2-20-009-026  [P2] GAP  facet F10  effort S
- Legacy: downloadFile/getFile fetch object stream by key/bucket; `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/R2StorageUtils.java:127-155`
- vNext now: New getObjectStream supports private GET/RANGE and signed scoped read grant; `src/modules/storage/s3-client.ts:184-204`, `src/modules/storage/private-object-storage.ts:78-113`
- Fix: Use new scoped read APIs; no arbitrary bucket parameter exposed.

## G2-20-009-033  [P2] GAP  facet F12  effort S
- Legacy: Legacy generatePresignedUrl defaults 1 hour; `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/R2StorageUtils.java:200-215`
- vNext now: New private read default 5min, allowed 1–15min; `src/modules/storage/private-object-storage.ts:102-113`
- Fix: Refresh expiring download grants; shorten shareable URL lifetime documented in UI.

## G2-20-009-048  [P2] GAP  facet F19  effort S
- Legacy: Legacy uploadFile(InputStream) fully buffers via IOUtils.toByteArray; `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/R2StorageUtils.java:52-63`
- vNext now: New presigned PUT direct to R2 and HEAD verify, streaming GET; `src/modules/storage/private-object-storage.ts:131-152`, `src/modules/storage/s3-client.ts:184-204`
- Fix: Ensure concurrent large PUTs avoid server memory and retries use fresh grant.

## G2-20-009-056  [P2] GAP  facet F22  effort S
- Legacy: Legacy object key often org-N/college-N/.../user-N, no formal storage row by utility; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceUploadController.java:45-55,116-121`
- vNext now: New private key uses uuid college/owner and namespace/UUID, not old numeric IDs; `src/modules/storage/private-object-storage.ts:116-127`
- Fix: Create explicit mapping/import for retained files if migrating; per owner no production data migration may be necessary.

## G2-3-010-007  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/PrivateDocStorage.java:93-99`
- vNext now: `src/modules/storage/private-object-storage.ts:47-76`
- Fix: Old caller chooses arbitrary key/content-type/TTL; new grant requires UUID scope/namespace,size and MIME with 1–15-minute TTL. Update feature form limits.

## G2-3-010-008  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/PrivateDocStorage.java:95-99`
- vNext now: `src/modules/storage/private-object-storage.ts:136-152`
- Fix: Old PUT signature binds Content-Type; new binds content-type and five x-amz-meta headers. Browser upload client must send exactly granted headers.

## G2-3-010-012  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/PrivateDocStorage.java:101-108`
- vNext now: `src/modules/storage/private-object-storage.ts:265-286`
- Fix: Old read signed URL includes no-store response header override; vNext GET grant lacks response cache control. Add no-store.

## G2-3-010-014  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/PrivateDocStorage.java:110-115`
- vNext now: `src/modules/storage/private-object-storage.ts:131-152`
- Fix: Legacy direct InputStream upload supports backend proxy fallback, new main feature grant signs browser PUT; ensure CORS-failure proxy route.

## G2-3-010-015  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/PrivateDocStorage.java:117-131`
- vNext now: `src/modules/storage/private-object-storage.ts:172-215`
- Fix: Legacy existence/download/delete S3 object methods vs new HEAD stream/delete helpers; adapt error and streaming signatures.

## G2-3-010-018  [P2] GAP  facet F12  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/PrivateDocStorage.java:93-98`
- vNext now: `src/modules/storage/private-object-storage.ts:67-74`
- Fix: Old upload caller-specified TTL, new default 10m max15m; review long upload flow and expired signatures.

## G2-3-010-020  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/PrivateDocStorage.java:73-75`
- vNext now: `src/modules/storage/private-object-storage.ts:47-75`
- Fix: Legacy controller maps storage-not-set-up to HTTP 503 with explicit try again later; new typed errors need corresponding retry display.

## G2-3-010-021  [P2] GAP  facet F14  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/PrivateDocStorage.java:110-115`
- vNext now: `src/modules/storage/private-object-storage.ts:47-76`
- Fix: Legacy uploads raw MIME and contentLength; new default 25MiB and strict MIME syntax. Confirm marksheets/identity limits.

## G2-3-010-025  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/PrivateDocStorage.java:73-75`
- vNext now: `src/modules/storage/private-object-storage.ts:47-75`
- Fix: Old `Private document storage is not set up` vs typed new errors; map exact user-facing message.

## G2-3-010-026  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/PrivateDocStorage.java:53-90`
- vNext now: `src/modules/storage/private-object-storage.ts:131-152`
- Fix: Legacy synchronized cached AmazonS3 client, new HMAC presigner per grant; benchmark hot path and key rotation.

## G2-3-010-033  [P2] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/PrivateDocStorage.java:59-70`
- vNext now: `src/modules/storage/private-object-storage.ts:116-127`
- Fix: Legacy isRef/refOf/keyOf helpers do not exist in vNext; call sites need explicit legacy adapter or data rewrite.

## G2-4-033-003  [P2] GAP  facet F01  effort M
- Legacy: Legacy uploads reached `/api/v1/upload` controller `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:50-56`
- vNext now: Private R2 service is lower-level key/grant contract `src/modules/storage/private-object-storage.ts:47-75`
- Fix: Audit all public vNext route handlers for presign/complete/playback compatibility and route users to them.

## G2-4-033-036  [P2] GAP  facet F14  effort M
- Legacy: Legacy R2 accepts bulk file and direct input-stream upload `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/R2StorageUtils.java:49-62`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/R2StorageUtils.java:102-124`
- vNext now: New private storage uses constrained grant/complete flow `src/modules/storage/private-object-storage.ts:47-75`
- Fix: Ensure server-side importers can upload/verify without browser signed PUT.

## G2-4-033-054  [P2] GAP  facet F22  effort M
- Legacy: Legacy file controller and R2 keys include folders and public object URLs `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/R2StorageUtils.java:99-124`
- vNext now: New tenant-scoped namespace key pattern `src/modules/storage/private-object-storage.ts:85-119`
- Fix: Provide migration/read adapter for existing objects and enforce tenant ownership.

## G2-20-009-052  [P3] GAP  facet F20  effort S
- Legacy: Legacy playback TTL computes expiryMinutes*60L*1000; negative values possible at caller; `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/R2StorageUtils.java:226-233`
- vNext now: New private upload expiry validated min/max; playback TTL via endpoint contract; `src/modules/storage/private-object-storage.ts:67-75`, `docs/architecture/file-and-video-apis.md:80`
- Fix: Keep TTL bounds and clock skew slack; test expiry unit conversions.
