# Work packet (wave 2): edit src/modules/storage/s3-client.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/r2-storage-utils.md

## G2-20-009-026  [P2] GAP  facet F10  effort S
- Legacy: downloadFile/getFile fetch object stream by key/bucket; `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/R2StorageUtils.java:127-155`
- vNext now: New getObjectStream supports private GET/RANGE and signed scoped read grant; `src/modules/storage/s3-client.ts:184-204`, `src/modules/storage/private-object-storage.ts:78-113`
- Fix: Use new scoped read APIs; no arbitrary bucket parameter exposed.

## G2-20-009-027  [P2] GAP  facet F10  effort S
- Legacy: deleteFile issues immediate S3 DELETE; `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/R2StorageUtils.java:158-164`
- vNext now: New deleteObject supports DELETE 404-idempotency; DB records use DELETED soft state and object removed best effort; `src/modules/storage/s3-client.ts:206-211`, `docs/architecture/file-and-video-apis.md:25-27`
- Fix: Preserve soft delete/audit row and consistent cleanup even if R2 fails.

## G2-20-009-048  [P2] GAP  facet F19  effort S
- Legacy: Legacy uploadFile(InputStream) fully buffers via IOUtils.toByteArray; `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/R2StorageUtils.java:52-63`
- vNext now: New presigned PUT direct to R2 and HEAD verify, streaming GET; `src/modules/storage/private-object-storage.ts:131-152`, `src/modules/storage/s3-client.ts:184-204`
- Fix: Ensure concurrent large PUTs avoid server memory and retries use fresh grant.

## G2-20-009-053  [P2] GAP  facet F21  effort S
- Legacy: Uses AWS SDK S3 AmazonS3 backed Cloudflare R2 bucket; `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/R2StorageUtils.java:3-10,33-40`
- vNext now: New custom node:crypto SigV4 S3 client targeting Cloudflare R2; `src/modules/storage/s3-client.ts:1-20,84-141`
- Fix: Test SigV4 compatibility for query escaping, range, metadata replace, non-ASCII names.

## G2-20-009-013  [P3] GAP  facet F05  effort S
- Legacy: Server HEAD/existence check boolean via doesObjectExist; `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/R2StorageUtils.java:167-174`
- vNext now: headObject returns nullable metadata, not a bare boolean; `src/modules/storage/s3-client.ts:162-181`
- Fix: Adapt callers checking boolean to null/non-null and map failures.
