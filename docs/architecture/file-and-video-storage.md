# File and video storage (assignment files, project resource files, lesson videos)

**Status:** backend delivered 2026-10-16 (owner decisions 10-12 of `docs/decisions/2026-10-14-orchestrator-defaults.md`). UI lanes build against `docs/architecture/file-and-video-apis.md`. Storage is the **dev R2 bucket with the dev-only prefix** until all LMS work is done; the dedicated private bucket and a real malware scanner are production work (not a blocker). No AI features are involved anywhere.

## 1. Legacy findings (legacy repo, branch `lms-dev-2026`)

Sources: `42LMS-BACKEND/.../controller/FileUploadController.java` (`POST /api/v1/upload/presign`), `utils/R2StorageUtils.java`, `LessonContentController` / `LessonContentsServiceImpl` (`/{id}/playback-url`), `ResourceFileController`; frontend `lms2-fe` / `42LMS-FRONTEND` `SubmitAssignmentModal.jsx`, `Offcanvas/Syallabus/videoform.js`, `Global/video/video.jsx`, `pages/Dashboard/course/syllabus/video.js`, `utils/uploadToR2.js`.

**The legacy LMS does not use Google Cloud Storage for lesson media.** Everything is Cloudflare R2: the browser asks the API for a presigned PUT (15 minute expiry), uploads directly, and the content row stores the object key or a public R2 URL.

| Topic | Legacy behaviour | vNext decision |
| --- | --- | --- |
| Assignment submission files | Folder `assignments`, type `assignment`/`generic`. Cap `upload.generic.max-size-bytes` = **50 MiB** (frontend `MAX_FILE_SIZE_MB = 50`). Blocklist, not allowlist: SVG/HTML/JS content types and `.exe .bat .cmd .sh .jar .msi .scr .com .ps1` rejected. Several upload entries per submission (PDF uploads and generic file uploads each allow "Add another"), no explicit count cap. | Allowlist of the 14 types already encoded in `assignment-file-validation.ts` (PDF, Word, PowerPoint, Excel, TXT, CSV, RTF, JPEG, PNG, WebP, ZIP), **50 MiB**, extension must match MIME. New vNext safety cap: **10 staged files per learner per assignment and delivery** (`MAX_ASSIGNMENT_FILES_PER_SUBMISSION`). |
| Project resource files | Folder `assignments` with an opt-in `projectId`; caller must be an active member of that project; same generic **50 MiB** cap and blocklist. | Same 50 MiB allowlist plus Markdown. Upload/edit/delete limited to project mentors and admins (matches the existing `resource-file-permission-model`); every project member reads. Cap **200 files per project**. Not allowed on `ARCHIVED` or `COMPLETED` projects. |
| Lesson videos | `type=video`, folder `lesson-content`, content type must start with `video/`, cap `upload.video.max-size-bytes` = **5368709120 (5 GiB)**; extensions `mp4 webm mov avi m4v`; content types `video/mp4 video/webm video/quicktime video/x-msvideo video/x-m4v`. Import-from-URL exists (faculty only, SSRF-hardened). | Same five formats. Cap **4900 MiB** so one presigned PUT stays below R2's single-request ceiling (multipart upload is not implemented). URL import is not carried over. |
| Thumbnails | Image type, `image/*` minus SVG/HTML, cap 10 MiB (`course-images` 5 MiB). Not tied to video rows. | Optional per-video thumbnail: JPEG/PNG/WebP, **5 MiB**. |
| Field names | Presign request: `fileName`, `contentType`, `contentLength`, `folder`, `type`, `courseId`, `classId`, `lessonContentId`, `projectId`. Stored file DTO: `size`, `mimetype`, `originalName`, `cloudStorageObject` (key or URL). Lesson content: `content_type: "VIDEO"`, `duration` (seconds, client supplied, `0` default). | vNext field names are camelCase and explicit: `originalName`, `contentType`, `sizeBytes`, `durationSeconds`. Duration is **client supplied** (1 to 86400 seconds, the `lesson_contents_duration_ck` range); no server-side probing. |
| Playback | Early versions stored a permanently public R2 URL on the content. Later: `GET /api/v1/lesson-contents/{id}/playback-url` returns `{url, expiresInSeconds}`; presigned GET, `r2.playback.expiry-minutes` default **120**, after the same access check as any content read. | Presigned GET only, never public. Default **60 min**, ceiling **120 min** (legacy default). Authorization: enrolled in the delivery AND lesson path published AND video published AND visible. |
| Seek and resume | Player (`video.jsx`) seeks natively with `player.seek(initialTime)`; progress is saved every `ui.progressSaveIntervalMs` via `lastPositionSeconds` / `durationSeconds` (also on tab close with `keepalive`). | Presigned GET URLs on R2 honour HTTP `Range`, so the browser can seek and resume without proxying. The playback grant returns `resumePositionSeconds` from `learner_content_progress.last_position_seconds` when the video is linked to a lesson content row. Saving progress keeps using the existing `courses/progress/[contentId]` API. |
| Instructor flow | Faculty opens the lesson "Video" offcanvas, picks a file (frontend validates `video/*` and the 5120 MB cap), progress bar while the PUT runs, then saves the lesson content (`content_type VIDEO`, title, points). | Same shape: create upload grant -> PUT -> `complete` (verification) -> edit title/duration/order -> publish. Replace and delete are explicit. |

## 2. Design

```
browser                         API (Next route)                    R2 (dev prefix)
  | POST grant  ----------------> validate scope, permission, type, size, count
  |                               insert row UPLOADING + audit
  | <-- uploadUrl, requiredHeaders (signed PUT, 15 min, content-type + scope + size + token + scan=PENDING)
  | PUT bytes ------------------------------------------------------>  object (PENDING)
  | POST complete -------------> HEAD object: size, content type, owner/college, token hash
  |                               non-production: dev attestation (magic bytes, SHA-256 <= 50 MiB)
  |                               row -> READY (CLEAN) | VERIFYING (production) | QUARANTINED | FAILED
  | POST download/playback-grant  authorize against the row, re-HEAD (generation/size/type),
  | <-- presigned GET (5 min files, 60 min video default) + audit event (no URL stored)
```

* Keys are opaque `private/<college>/<uploader membership>/<namespace>/<uuid>`; namespaces `assignment-submission`, `project-resource`, `lesson-video` (the first two already existed in the contract; `lesson-video` is new and also holds thumbnails). The dev prefix (`vnext-dev/`) is applied at the transport boundary only.
* Tables (migration `0080_storage_files_video_assets`): `assignment_submission_files`, `project_resource_files`, `lesson_video_assets`, `storage_file_events`. All are tenant scoped (`college_id`, composite FK to `college_memberships (id, college_id)`; projects use `(project_id, college_id)` and `(resource_id, project_id)` parent keys). CHECK constraints pin status vocabularies, size ceilings, key scope, SHA-256 shape, the READY invariant (CLEAN scan, attester, generation, verified size/type) and `PUBLISHED => READY` for videos.
* `assignment_submissions_payload_ck` is widened to allow `FILE` (text and URL null). A **deferred constraint trigger** requires at least one READY file for every FILE submission at commit. The earlier staged receipt design (`course-upload-receipts-staged.ts`, `assignment-file-service.ts`, flag `DB06_ASSIGNMENT_FILES_READY`) is superseded by this flow and left untouched and disabled; its routes still return 503.
* Reads never return public URLs. Every grant re-checks the object's last-modified "generation", size and content type against the row, so an overwritten object is never served (`STORAGE_FILE_NOT_READY`).
* Audit: every upload grant, completion, scan outcome, download grant, playback grant, publish/unpublish, replace and delete appends a `storage_file_events` row. Detail is limited to safe scalars; a sanitizer drops any key containing url/token/secret/key/signature and any URL-looking string. Grants are **POST** routes because they write an audit row; GET routes never write.
* Same-origin check (`isSameOriginRequest`) on every POST/PUT/PATCH/DELETE; permissions use the existing model (`can(..., "courses.manage")`, `requireLearningReadAccess`, `requireDeliveryContentMutation`, `requireProjectReadAccess`, `requireProjectLifecycleAccess`). Access denials on read and grant endpoints are mapped to `STORAGE_NOT_FOUND` so they do not leak existence.

## 3. Dev-only scan attestation

`devOnlyAttestPendingUpload` / `verifyUploadedObject` in `src/modules/storage/file-lifecycle.ts`.

* Runs only when `APP_ENV` is exactly `development` or `test`. Unset or any other value (including `production` and `staging`) fails closed: uploads stay `VERIFYING` (videos `PROCESSING`) with `scan_status = PENDING` and are **never served**. This is the production default until a real scanner exists.
* It verifies size, content type, owner/college metadata, upload token hash and magic bytes (PDF, PNG, JPEG, WebP, ZIP/OOXML, OLE, RTF, text without NUL, MP4/MOV/M4V `ftyp`, WebM EBML, AVI RIFF), and for non-video files up to 50 MiB records the SHA-256. Videos are range-read (first 4 KiB) only. **This is not malware scanning.** The attester is recorded as `lms-vnext-dev-attestation`.
* Production work later: a privileged scanner records its verdict on the rows (`scan_status`, `scan_attested_by = lms-vnext-privileged-scanner`, status `READY` or `QUARANTINED`), then the same grants start working. No route accepts client-supplied scan claims.

## 4. R2 range support

R2 presigned GET URLs (SigV4 query auth, `host` as the only signed header) accept `Range` requests, so `<video>` seeking and resume work directly against the presigned URL. The playback grant response carries `supportsRange: true`, `sizeBytes`, `durationSeconds` and `resumePositionSeconds`. A grant lives 60 min by default (max 120). When it expires the player calls the grant endpoint again and swaps the source at the current time.

## 5. Optional legacy-bucket read adapter

`src/modules/storage/video-source.ts` defines `VideoSource` with `R2VideoSource` (default) and `GcsVideoSource` (GOOG4-RSA-SHA256 V4 signed URL implemented with `node:crypto`). GCS is **disabled by default**: it needs `GCS_VIDEO_ENABLED=true`, `GCS_VIDEO_BUCKET`, `GCS_VIDEO_CLIENT_EMAIL`, `GCS_VIDEO_PRIVATE_KEY` (PEM, `\n` escaped); otherwise `resolveVideoSource("GCS")` throws `STORAGE_NOT_CONFIGURED`. Secrets are never committed. Because the legacy LMS actually used R2, the more likely future need is an R2 adapter pointed at the legacy bucket with legacy keys (`org-<id>/college-<id>/lesson-content/<uuid>.<ext>`). The adapters are **not wired into `lesson_video_assets`** yet: that table constrains `object_key` to the private key layout. Wiring a `storage_source` column for legacy videos is future work.

## Legacy paste-link import and Google Drive decision

Legacy LMS supported video import from an external URL. vNext deliberately
does not fetch user-supplied Google Drive, YouTube or arbitrary external URLs,
because remote redirects, private-network SSRF, spoofed MIME and unscanned
bytes would bypass the tenant-scoped direct upload path. The faculty video
drawer now explains the supported alternative: save an authorized local copy,
upload it through the signed PUT, wait for verification, then publish.

This is an intentional retirement, not an absence in legacy. Reintroduction
requires redirect-safe hostname/IP checks, bounded fetching, authorization,
per-object scanning and the same audit requirements as local uploads. No
unrestricted remote-fetching proxy is implemented.

## 6. Known limits and follow-ups

* Single-PUT upload only (max 4900 MiB per video); multipart/resumable upload is not implemented.
* No server-side duration probing or transcoding; `durationSeconds` is client supplied.
* Orphans: failed/expired uploads keep a row (status FAILED) and the object is deleted best-effort on mismatch/delete; there is no scheduled sweeper for expired PENDING objects yet.
* Existing learner/faculty submission views read FILE metadata through the staged `listAssignmentFileMetadataIfReady` (disabled). Lanes should use `GET /api/courses/assignment-submissions/{submissionId}/files` until the older read models are rewired.
