# Work packet: edit src/modules/storage/r2-config.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/r2-storage-utils.md, docs/audit/gap2/lane-4/cross-third-party-integrations.md

## G2-20-009-032  [P1] GAP  facet F11  effort L
- Legacy: Public URL means possession can suffice for read regardless of future revocation; `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/R2StorageUtils.java:276-282`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:31-35`
- vNext now: Private no-public-url R2, signed access checks and READY only; `src/modules/storage/r2-config.ts:6-15`, `docs/architecture/file-and-video-apis.md:5,25-31`
- Fix: Ensure old public bucket objects no longer bypass revocation; configure new private bucket and migration strategy.

## G2-20-009-054  [P1] GAP  facet F21  effort M
- Legacy: Legacy can use shared public R2 bucket in prod; `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/R2StorageUtils.java:36-40,276-282`
- vNext now: New prod must use separate PRIVATE bucket; dev may share with required prefix; `src/modules/storage/r2-config.ts:6-16,27-37`
- Fix: Provision production private bucket, deny public access and verify sign URLs; migration is security-critical.

## G2-20-009-057  [P1] GAP  facet F23  effort S
- Legacy: Original utility exposes getPublicUrlBase/getBucketName and public access fallback; `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/R2StorageUtils.java:269-300`
- vNext now: New deliberately private no raw key, no public access; `src/modules/storage/r2-config.ts:6-15`, `docs/architecture/file-and-video-apis.md:5`
- Fix: Retire public bucket API by design but address old URLs and permission checks; not a cosmetic clone candidate.

## G2-4-033-019  [P2] GAP  facet F07  effort M
- Legacy: Legacy private documents return 503 text 'Private document storage is not set up yet. Please try again later.' `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:65-72`
- vNext now: Private R2 throws `PRIVATE_STORAGE_NOT_CONFIGURED` `src/modules/storage/r2-config.ts:20-25`
- Fix: Map configuration error to user-friendly 503 and distinct retry guidance.
