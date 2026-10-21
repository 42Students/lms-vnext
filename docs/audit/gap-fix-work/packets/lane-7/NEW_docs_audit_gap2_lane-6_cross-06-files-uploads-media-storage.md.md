# Work packet: NEW / MISSING items from docs/audit/gap2/lane-6/cross-06-files-uploads-media-storage.md

5 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/cross-06-files-uploads-media-storage.md

## G2-6-032-021  [P1] GAP  facet F06  effort M
- Legacy: Legacy video extensions mp4/webm/mov/avi/m4v and 5120MiB cap (file-and-video-storage.md:15).
- vNext now: vNext same extensions with MIME allowlist but 4900MiB single PUT ceiling (file-policy.ts:20-22,61-67).
- Fix: Pre-check actual 4900MiB limit and explain need for multipart for larger videos.

## G2-6-032-038  [P1] GAP  facet F11  effort M
- Legacy: Legacy project resource uploads shared assignments folder allowed project active members, including learners depending caller (file-and-video-storage.md:14; FileUploadController.java:216-227).
- vNext now: vNext project resource file mutations restricted mentor/admin, all members read (file-and-video-apis.md:51-62).
- Fix: Resolve role-authoring parity for project resource files, separate from learner final-delivery submissions.

## G2-6-032-024  [P2] GAP  facet F07  effort S
- Legacy: Legacy Resource errors 'Unsupported Resource file name or MIME type' and 'Resource file must be between 1 byte and the configured size limit' (ResourceUploadController.java:77-84).
- vNext now: vNext structured STORAGE_NAME_INVALID, STORAGE_TYPE_NOT_ALLOWED, STORAGE_EXTENSION_MISMATCH, SIZE_INVALID and FILE_TOO_LARGE (file-errors.ts:5-14).
- Fix: Map precise contextual legacy strings and show field-level recovery.

## G2-6-032-029  [P2] GAP  facet F08  effort S
- Legacy: Legacy backend Resouce 503 'Cannot prepare Resource upload' on presign generation exception (ResourceUploadController.java:119-124).
- vNext now: vNext generic STORAGE_NOT_CONFIGURED error code (file-errors.ts:25-26).
- Fix: Use context-specific toast for grant failure with retry.

## G2-6-032-030  [P2] GAP  facet F08  effort S
- Legacy: Legacy playback 2-hour default signed URL and expiration (file-and-video-storage.md:18).
- vNext now: vNext 1-hour default, 2-hour max (file-lifecycle.ts:285-287).
- Fix: Make URL refresh seamless near expiry and document 60-vs-120-minute default.
