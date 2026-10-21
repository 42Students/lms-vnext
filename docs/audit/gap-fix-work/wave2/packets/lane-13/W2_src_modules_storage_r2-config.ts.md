# Work packet (wave 2): edit src/modules/storage/r2-config.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/r2-storage-utils.md, docs/audit/gap2/lane-4/cross-third-party-integrations.md

## G2-20-009-001  [P2] GAP  facet F01  effort M
- Legacy: R2StorageUtils is Spring @Component guarded by R2Condition, injected in upload/resource controllers; `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/R2StorageUtils.java:29-41`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/config/R2Condition.java:14-18`
- vNext now: No DI component, server-only storage modules imported by scoped services; `src/modules/storage/private-object-storage.ts:1-20`, `src/modules/storage/r2-config.ts:17-25`
- Fix: Map storage-disabled state to `STORAGE_NOT_CONFIGURED`, preserving optional dependency behavior.

## G2-20-009-010  [P2] GAP  facet F04  effort S
- Legacy: Legacy getBucketName/getPublicUrlBase make bucket/public base available to callers; `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/R2StorageUtils.java:284-300`
- vNext now: New getPrivateR2Config returns endpoint/bucket only server-side; `src/modules/storage/r2-config.ts:17-45`
- Fix: Migrate callers needing public URL comparison to key-bound resolver with scoped authorization.

## G2-20-009-037  [P2] GAP  facet F13  effort S
- Legacy: Legacy storage unconfigured R2Condition means bean absent, consumers often null-check; `docs/legacy-source/backend/src/main/java/com/_42students/lms/config/R2Condition.java:14-18`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceUploadController.java:68-70`
- vNext now: New getPrivateR2Config throws typed not-configured error; `src/modules/storage/r2-config.ts:17-26`
- Fix: Display 503 storage-unavailable state when private config missing.

## G2-4-033-034  [P2] GAP  facet F13  effort M
- Legacy: Legacy private R2 not configured is 503 `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:65-72`
- vNext now: New config fails closed `src/modules/storage/r2-config.ts:20-35`
- Fix: Show retryable temporary-unavailable state without leaking bucket details.

## G2-4-033-042  [P2] GAP  facet F18  effort M
- Legacy: Legacy missing configuration string for private docs is explicit `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:69-72`
- vNext now: New error uses code `PRIVATE_STORAGE_NOT_CONFIGURED` `src/modules/storage/r2-config.ts:20-25`
- Fix: Match human-facing failure text through UI translator.
