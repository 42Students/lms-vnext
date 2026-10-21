# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-6/cross-06-files-uploads-media-storage.md

17 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/cross-06-files-uploads-media-storage.md

## G2-6-032-001  [P2] GAP  facet F01  effort L
- Legacy: Legacy uploads reachable via FileUploadController /api/v1/upload for presign, multipart proxy, URL imports, downloads (FileUploadController.java:53-56,421-422,739-740,830-831,1603-1604,2180-2181).
- vNext now: vNext separates assignment/project/video entrypoints into feature routes (file-and-video-apis.md:33-80).
- Fix: Map all legacy upload actions to new role-scoped feature URLs and preserve each screen's visible entry point.

## G2-6-032-009  [P2] GAP  facet F03  effort M
- Legacy: Legacy lesson video progress shows PUT percentage followed by saving content (file-and-video-storage.md:20).
- vNext now: vNext two-step upload PUT then complete/attestation, READY status only after second step (file-and-video-storage.md:24-35).
- Fix: Provide separate Uploading, Checking file, Ready indicators; prevent early success banner.

## G2-6-032-011  [P2] GAP  facet F04  effort M
- Legacy: Legacy uploads store size,mimetype,originalName,cloudStorageObject key or public URL (file-and-video-storage.md:17).
- vNext now: vNext originalName,contentType,sizeBytes,status/failureCode and objectKey internal (file-and-video-apis.md:47,64,82).
- Fix: Map field names and size/empty formatting for file lists without displaying private object keys.

## G2-6-032-015  [P2] GAP  facet F05  effort S
- Legacy: Legacy assignment supports repeated Add another without explicit item count cap (file-and-video-storage.md:13).
- vNext now: vNext max 10 staged files per assignment/delivery (file-policy.ts:23-25; file-and-video-apis.md:35-45).
- Fix: Show N/10, disabled Add another and exact over-limit recovery.

## G2-6-032-018  [P2] GAP  facet F06  effort M
- Legacy: Legacy generic presign fields fileName,contentType,contentLength,folder,type,courseId,classId,lessonContentId,projectId (file-and-video-storage.md:17).
- vNext now: vNext grant fields originalName,contentType,sizeBytes plus parent-specific UUIDs (file-and-video-apis.md:37-45,55-62,70-80).
- Fix: Produce explicit per-parent payload crosswalk and reject user-controlled folder/key.

## G2-6-032-019  [P2] GAP  facet F06  effort M
- Legacy: Legacy generic assignment/file 50MiB and broad blocklist excluding executable/active script types (file-and-video-storage.md:13-14).
- vNext now: vNext strict 14 MIME/extension pairs, project additionally Markdown (file-policy.ts:20,31-59,157-185).
- Fix: Display accepted formats and explain previously usable safe types now rejected.

## G2-6-032-020  [P2] GAP  facet F06  effort S
- Legacy: Legacy Resource filename max255 no slash/backslash/control, MIME match; size 1..50MiB (ResourceUploadController.java:74-84).
- vNext now: vNext filename<=255, separator/newline/NUL rule, MIME and extension matching, max50MiB (file-policy.ts:157-185).
- Fix: Compare exact control-char acceptance and error mapping, including DEL and Unicode whitespace.

## G2-6-032-022  [P2] GAP  facet F06  effort S
- Legacy: Legacy video Thumbnail/image cap 10MiB except course-image5MiB (FileUploadController.java:151-174; file-and-video-storage.md:16).
- vNext now: vNext video thumbnail JPEG/PNG/WebP only, max5MiB (file-policy.ts:20-22,69-73).
- Fix: Show 5MiB threshold and accepted image types on thumbnail picker.

## G2-6-032-041  [P2] GAP  facet F12  effort M
- Legacy: Legacy generic file 50MiB and video 5GiB; no assignment/project/video count caps stated (file-and-video-storage.md:13-16).
- vNext now: vNext file 50MiB, video4900MiB, thumbnail5MiB; assignment10/project200/video50 caps (file-policy.ts:20-27).
- Fix: Expose limits in pickers and enforce count with concurrent atomic DB checks.

## G2-6-032-045  [P2] GAP  facet F13  effort M
- Legacy: Legacy missing R2 returns 503; errors propagate to upload form (ResourceUploadController.java:68-70).
- vNext now: vNext STORAGE_NOT_CONFIGURED 503 and STORAGE_FILE_NOT_READY409; grant fails closed (file-errors.ts:17-26).
- Fix: Render distinct offline/unconfigured/expired/checking states instead of generic failure.

## G2-6-032-050  [P2] MISSING  facet F14  effort M
- Legacy: Legacy server fetch-from-URL for approved Drive and video sources (FileUploadController.java:189-190,739-909).
- vNext now: vNext URL import discontinued for lesson videos (file-and-video-storage.md:15).
- Fix: Record owner-intended removal and hide dead button, don't invent support.

## G2-6-032-052  [P2] GAP  facet F14  effort M
- Legacy: Legacy video >4900MiB up to5GiB accepted, import video URL present (file-and-video-storage.md:15).
- vNext now: vNext no multipart/resumable, max4900MiB (file-and-video-storage.md:60-63).
- Fix: Expose unsupported oversized video and no resume flow early in file picker.

## G2-6-032-059  [P2] GAP  facet F18  effort S
- Legacy: Legacy API calls fields fileName,contentLength, originalName/mimetype stored (file-and-video-storage.md:17).
- vNext now: vNext labels and payload originalName,contentType,sizeBytes; statuses UPLOADING/VERIFYING/READY (file-and-video-apis.md:14-29).
- Fix: Keep user-facing filesize/filename language human-friendly and consistent while mapping API contract.

## G2-6-032-060  [P2] GAP  facet F19  effort L
- Legacy: Legacy presign browser uploads direct R2; backend multipart proxy also offered; requests 60/h and import20/h (FileUploadController.java:429-431,756-759,1603-1604).
- vNext now: vNext single PUT and no multipart/resumable; 4900MiB per video, downloaded grants directly to R2 (file-and-video-storage.md:24-35,60-64).
- Fix: Check 10k concurrent upload behavior, R2 CORS, rate budget and retry queues; no assumed proxy.

## G2-6-032-062  [P2] GAP  facet F19  effort M
- Legacy: Legacy 5GiB video upload via browser PUT; no multipart in legacy cited source (file-and-video-storage.md:9,15).
- vNext now: vNext 4900MiB one PUT and ranged playback GET, no transcoding/duration probing (file-and-video-storage.md:52-63).
- Fix: Show realistic progress/retry UX and document mobile data limitations.

## G2-6-032-065  [P2] GAP  facet F20  effort L
- Legacy: Legacy failed cross-scope upload may leave stray key if upload finished before record save (FileUploadController.java:421-422,695-707).
- vNext now: vNext maintains FAILED/QUARANTINED rows and best-effort object deletion; no automated expired sweeper (file-and-video-storage.md:60-65).
- Fix: Add stale object sweeper and reconcile retry/idempotency across PUT and complete.

## G2-6-032-043  [P3] GAP  facet F12  effort M
- Legacy: Legacy playback URL default120min; image private view5min (file-and-video-storage.md:18; PrivateDocStorage.java:93-107).
- vNext now: vNext playback60min default max120, file read5min (file-lifecycle.ts:285-310).
- Fix: Ensure expiry countdown/automatic renewal and no stale viewer link.
