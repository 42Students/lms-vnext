# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-6/resource-upload-controller.md

10 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/resource-upload-controller.md

## G2-6-025-007  [P2] GAP  facet F04  effort S
- Legacy: Request requires fileName, contentType, contentLength (PresignUploadRequestDTO.java:16-26).
- vNext now: vNext storage declaration fields originalName,contentType,sizeBytes (file-policy.ts:137-146).
- Fix: Map request names and byte units exactly in client adapter.

## G2-6-025-009  [P2] GAP  facet F04  effort M
- Legacy: Legacy courseId mandatory and classId optional positive IDs (ResourceUploadController.java:86-90).
- vNext now: VNext lesson Resource permission resolver derives contentId and deliveryId (lesson-resource-materials-service.ts:19-33).
- Fix: Bind grant to exact course offering and optional class delivery, checking authoritative relationships.

## G2-6-025-010  [P2] GAP  facet F04  effort M
- Legacy: Response includes uploadUrl,key,publicUrl plus optional uploadReceiptId (PresignUploadResponseDTO.java:11-31).
- vNext now: VNext file-lifecycle grant exposes objectKey internally,uploadUrl,method,expiresAt,requiredHeaders,uploadTokenHash (file-lifecycle.ts:68-103).
- Fix: Return opaque fileId/receipt to UI, never raw internal key; adapt completion step.

## G2-6-025-016  [P2] GAP  facet F06  effort S
- Legacy: Legacy size 1 byte to configured 50 MiB max (ResourceUploadController.java:42-43,82-84).
- vNext now: vNext MAX_DOCUMENT_BYTES=50 MiB for assignment/project, no lesson-resource kind (file-policy.ts:20-26,83-104).
- Fix: Apply 50 MiB cap to new lesson Resource upload declaration and object verification.

## G2-6-025-033  [P2] GAP  facet F13  effort S
- Legacy: Missing R2 client returns 503 Resource storage is unavailable (ResourceUploadController.java:68-70).
- vNext now: VNext storage failure typed STORAGE_NOT_CONFIGURED and verification fail-closed (file-lifecycle.ts:42-49,31-40).
- Fix: Show legacy unavailable message and Retry or contact admin without false 'uploaded' success.

## G2-6-025-037  [P2] GAP  facet F14  effort M
- Legacy: Legacy supports PDF, Word, PPT, Excel, CSV, text, PNG/JPEG/WebP (ResourceMaterialMimePolicy.java:9-24).
- vNext now: VNext document types include those plus RTF and ZIP, but no exact Resource type grouping (file-policy.ts:31-55).
- Fix: Limit new lesson Resource uploads to legacy allowlist unless product approves RTF/ZIP.

## G2-6-025-042  [P2] GAP  facet F18  effort S
- Legacy: Legacy error wording Resource file must be between 1 byte and the configured size limit (ResourceUploadController.java:82-84).
- vNext now: VNext generic STORAGE_SIZE_INVALID / FILE_TOO_LARGE typed errors (file-policy.ts:130-145).
- Fix: Map Resource-specific literal copy to user-facing validation.

## G2-6-025-043  [P2] GAP  facet F18  effort S
- Legacy: Legacy folder/type literal lesson-content/resource (ResourceUploadController.java:71-73).
- vNext now: VNext storage class names project-resource, lesson-video, assignment-submission (file-policy.ts:13-18).
- Fix: Use visible 'Resource' terminology; never expose internal storage namespace as title.

## G2-6-025-048  [P2] GAP  facet F21  effort M
- Legacy: Legacy R2StorageUtils generates 15-minute PUT without a background job (ResourceUploadController.java:116-121).
- vNext now: VNext uses private object grants and scanning readiness (file-lifecycle.ts:77-103,31-40).
- Fix: Document dev/production scanner gate for course Resource FILE lifecycle and retry.

## G2-6-025-050  [P2] GAP  facet F22  effort M
- Legacy: Legacy key tied to numeric org/college/course/class/user IDs (ResourceUploadController.java:45-55).
- vNext now: VNext UUID college, membership, lessonContent IDs in material metadata (lesson-content-materials.ts:7-22).
- Fix: Define old-to-new ID mapping and immutable scope relation during any import.
