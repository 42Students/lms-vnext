# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-20/r2-storage-utils.md

8 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-20/r2-storage-utils.md

## G2-20-009-002  [P2] GAP  facet F01  effort S
- Legacy: Routes are consumers, e.g. POST /api/v1/upload/* and POST /api/v1/resource-uploads/presign; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:52-60`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceUploadController.java:30-32,57-59`
- vNext now: Feature-specific paths for course assignment/project/video upload grants and complete; `docs/architecture/file-and-video-apis.md:33-80`
- Fix: Document endpoint migration table for callers and deprecate obsolete raw presign routes after UI migration.

## G2-20-009-005  [P2] GAP  facet F02  effort S
- Legacy: Legacy resource presign response includes signed URL, key, publicUrl; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceUploadController.java:116-123`
- vNext now: New upload grant carries id, method PUT, URL, expiresAt, requiredHeaders but no raw key/public URL in client; `docs/architecture/file-and-video-apis.md:5-20`
- Fix: Update frontend progress UX for grant/complete without ever exposing storage keys.

## G2-20-009-007  [P2] GAP  facet F03  effort S
- Legacy: Callers can surface direct public file link from getPublicUrl; `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/R2StorageUtils.java:276-282`
- vNext now: New caller can offer only signed download grant for READY status; `docs/architecture/file-and-video-apis.md:25-27,45-49`
- Fix: Replace direct static/public href with on-demand download button and expiry-retry state.

## G2-20-009-014  [P2] GAP  facet F06  effort M
- Legacy: MultipartFile upload directly accepts original name and folder; `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/R2StorageUtils.java:94-124`
- vNext now: New client declares originalName/contentType/sizeBytes and performs presign PUT, then complete; `docs/architecture/file-and-video-apis.md:7-14`
- Fix: Migrate multipart submit flow to grant→direct PUT→complete with retry and progress state.

## G2-20-009-031  [P2] GAP  facet F11  effort S
- Legacy: Legacy Resource presign faculty/admin only and cross-college rejects; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceUploadController.java:59-63,91-114`
- vNext now: New feature contracts require college admin/courses.manage or teaching assignment; `docs/architecture/file-and-video-apis.md:66-80`
- Fix: Map old faculty privilege to delivery teaching scope and explicit module permission.

## G2-20-009-040  [P2] GAP  facet F14  effort S
- Legacy: Legacy MultipartFile input accepted, UUID name + extension, returned public URL; `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/R2StorageUtils.java:94-125`
- vNext now: New separated upload-grant/PUT/complete with metadata/record; `docs/architecture/file-and-video-apis.md:7-20`
- Fix: Migrate file selectors to two-phase private upload with row state.

## G2-20-009-042  [P2] GAP  facet F14  effort S
- Legacy: Legacy Resource file direct signed GET15min from canonical content/mat index; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:51-53,116-123`
- vNext now: New download grant5min for files and playback grant for videos, object no public URL; `docs/architecture/file-and-video-apis.md:45-49,78-80`
- Fix: Map contentId/materialIndex access to record ID and issue signed grant at click.

## G2-20-009-012  [P3] GAP  facet F05  effort S
- Legacy: Object listing/pagination/search/sort not provided by utility; `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/R2StorageUtils.java:29-315`
- vNext now: No object listing in private client; SQL-backed per-feature lists; `docs/architecture/file-and-video-apis.md:39-47,55-64`
- Fix: Treat file lists as DB metadata, not raw bucket listing; validate sort order per feature.
