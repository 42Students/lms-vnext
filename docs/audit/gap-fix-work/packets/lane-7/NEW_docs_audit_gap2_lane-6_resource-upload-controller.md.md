# Work packet: NEW / MISSING items from docs/audit/gap2/lane-6/resource-upload-controller.md

11 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/resource-upload-controller.md

## G2-6-025-002  [P1] GAP  facet F01  effort L
- Legacy: Legacy presign belongs to faculty/admin course Resource authoring, not learner submissions (ResourceUploadController.java:26-29,59-63).
- vNext now: vNext storage kinds identify assignment submission, project resource, lesson video only (file-policy.ts:13-18).
- Fix: Provide a lesson Resource file kind with course/delivery scope, not project-resource reuse.

## G2-6-025-005  [P1] GAP  facet F03  effort L
- Legacy: Legacy file uploader ultimately shows publicUrl for uploaded Resource materials (PresignUploadResponseDTO.java:11-18).
- vNext now: vNext lesson Resource FILE list suppresses public direct URL, awaits signed download grant (lesson-resource-materials-service.ts:40-54).
- Fix: Provide authenticated per-file Open/download action instead of public URL.

## G2-6-025-008  [P1] GAP  facet F04  effort L
- Legacy: Resource request requires folder=lesson-content and type=resource (ResourceUploadController.java:71-73).
- vNext now: vNext namespaces exclude lesson-resource, using assignment/project/video only (file-policy.ts:13-18).
- Fix: Introduce distinct typed Resource namespace before issuing grants.

## G2-6-025-026  [P1] GAP  facet F10  effort L
- Legacy: Legacy resource grant binds tenant/course/class/uploader in generated key (ResourceUploadController.java:45-55,116-118).
- vNext now: VNext common grant binds college+owner membership+namespace but not course or class in issue signature (file-lifecycle.ts:77-94).
- Fix: Store immutable Resource parent content/offering/delivery IDs and verify on upload completion.

## G2-6-025-027  [P1] GAP  facet F10  effort L
- Legacy: Legacy ResourceUploadReceiptAdvice binds receipts to first saved Resource, checks R2 HEAD and consumes receipt (ResourceUploadReceiptAdvice.java:46-63,125-164).
- vNext now: VNext lesson Resource service currently handles LINK mutations, no FILE receipt lifecycle shown (lesson-resource-materials-service.ts:59-110).
- Fix: Add atomic FILE grant/complete/attach, consumed token, object head, scan and tenant binding.

## G2-6-025-049  [P1] GAP  facet F22  effort L
- Legacy: Legacy signed response: URL,key,publicUrl,uploadReceiptId (PresignUploadResponseDTO.java:11-31).
- vNext now: VNext material table has FILE+LINK, scan fields, uploadTokenHash, verified metadata (lesson-content-materials.ts:7-48).
- Fix: Wire material FILE rows with grant/complete/attestation transition and scoped signed downloads.

## G2-6-025-018  [P2] GAP  facet F07  effort S
- Legacy: Missing principal returns 401 Authentication required (ResourceUploadController.java:59-60).
- vNext now: VNext learning-access authorizer can throw LEARNING_ACCESS_DENIED (lesson-resource-materials-service.ts:19-31).
- Fix: Preserve unauthenticated 401 vs authenticated 403 with exact UI wording.

## G2-6-025-019  [P2] GAP  facet F07  effort S
- Legacy: Non-staff returns 403 Only faculty or admins may upload Resources (ResourceUploadController.java:61-63).
- vNext now: VNext authorizeMaterial uses role/scoped course permission (lesson-resource-materials-service.ts:24-28).
- Fix: Map typed 403 to legacy complete staff-only message in upload UI.

## G2-6-025-020  [P2] GAP  facet F07  effort S
- Legacy: Invalid folder/type returns Resource presign requires folder=lesson-content and type=resource (ResourceUploadController.java:71-73).
- vNext now: VNext feature-kind validator prevents wrong typed namespace rather than folder field (file-policy.ts:13-18).
- Fix: Use new equivalent Resource-specific bad-request copy, without trusting caller-provided scope.

## G2-6-025-021  [P2] GAP  facet F07  effort S
- Legacy: Name/MIME and size errors use precise 400 strings (ResourceUploadController.java:77-84).
- vNext now: VNext StorageDeclarationResult typed errors include STORAGE_NAME_INVALID, TYPE_NOT_ALLOWED, SIZE_INVALID (file-policy.ts:130-145).
- Fix: Translate storage error codes to exact legacy Resource messages and field helper text.

## G2-6-025-023  [P2] GAP  facet F08  effort S
- Legacy: Provider failure emits 503 Cannot prepare Resource upload (ResourceUploadController.java:119-124).
- vNext now: vNext private storage wraps config failures as STORAGE_NOT_CONFIGURED (file-lifecycle.ts:42-48).
- Fix: Offer explicit storage-unavailable recovery, avoid exposing provider stack.
