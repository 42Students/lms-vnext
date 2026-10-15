# File and video API contract

For the UI lanes. Background and limits: `docs/architecture/file-and-video-storage.md`. Pure UI helpers (labels, size/duration formatting, accept lists, error messages): `src/modules/storage/ui-models.ts`.

All routes are JSON, `runtime = nodejs`, cookie authenticated. Every POST/PUT/PATCH/DELETE needs a same-origin `Origin` header (otherwise `403 {"error":"INVALID_ORIGIN"}`). Responses that carry signed URLs or private state send `Cache-Control: no-store`. Errors are `{"error": "<CODE>"}`; validation failures are `400 {"error":"INVALID_REQUEST","issues":[...]}`. Timestamps are ISO-8601 strings. **No response contains an object key, a bucket name or a public URL.** Signed URLs appear only in grant responses, are short lived and must never be persisted or logged by the client.

## 1. Upload protocol (all three features)

1. `POST` the feature's grant route with the file declaration. Take `contentType` from `file.type`; when it is empty use `guessContentTypeFromName(kind, name)`.
2. `PUT` the bytes to `grant.uploadUrl` with **exactly** `grant.requiredHeaders` (content type plus `x-amz-meta-*`), and no extra headers. The URL expires at `grant.expiresAt` (at most 15 minutes after issue; the request must start before then). Abort or error -> offer retry, which starts again at step 1.
3. `POST` the matching `complete` route. It verifies the object server side and returns the updated record. A `STORAGE_UPLOAD_NOT_FOUND` (409) means the PUT has not landed yet: wait and retry `complete`.
4. Outside production the record comes back `READY`. In production (no scanner yet) it comes back `VERIFYING` / `PROCESSING` and stays unusable; show the "Checking file" status and do not offer open/play.

`grant` shape (identical for assignment, project and video; the id field differs):

```json
{ "receiptId|fileId|videoId": "uuid", "method": "PUT", "uploadUrl": "https://...", "expiresAt": "2026-10-16T10:15:00.000Z",
  "requiredHeaders": { "content-type": "application/pdf", "x-amz-meta-upload-token": "...", "x-amz-meta-owner-membership-id": "...",
                       "x-amz-meta-college-id": "...", "x-amz-meta-expected-size": "123", "x-amz-meta-malware-scan-status": "PENDING" },
  "originalName": "report.pdf" }
```

(`receiptId` for assignment files equals the file id and keeps the shape the earlier learner UI model `learnerAssignmentUploadGrantSchema` validates; its `.strict()` top level must be loosened to also accept the sibling `file` object.)

## 2. State machines

Files (`assignment_submission_files`, `project_resource_files`): `status` in `UPLOADING -> VERIFYING -> READY`, with `UPLOADING|VERIFYING -> QUARANTINED` (content rejected, object deleted), `UPLOADING -> FAILED` (mismatch, expired), and `* -> DELETED` (soft delete). Only `READY` is downloadable (`fileStatusDescriptor(status).usable`). Complete is idempotent for `READY`.

Videos (`lesson_video_assets`): `processingStatus` in `UPLOADING -> PROCESSING -> READY`, `PROCESSING|UPLOADING -> BLOCKED` (content rejected) or `FAILED` (mismatch, expired). `publishStatus` in `DRAFT | PUBLISHED | ARCHIVED` with allowed moves DRAFT<->PUBLISHED, DRAFT/PUBLISHED->ARCHIVED, ARCHIVED->DRAFT. Publishing needs `READY` + clean scan (`409 STORAGE_FILE_NOT_READY` otherwise). Thumbnail: `thumbnailStatus` in `NONE | UPLOADING | READY`.

Learner playback rule: enrolled in the delivery (`requireLearningReadAccess`) AND learning path `PUBLISHED` AND video `READY` AND `PUBLISHED` AND `visibleToStudents` AND (if linked to a lesson content) that content `PUBLISHED` and visible. Faculty teaching the delivery and college admins may play any `READY` video, drafts included (preview).

## 3. Assignment submission files (learner)

Files are staged by the learner, then bound to a FILE submission in one call. Limits: 50 MiB per file, 10 staged files per assignment and delivery, types from `allowedMimeTypesFor("assignment-submission")` (PDF, DOC/DOCX, PPT/PPTX, XLS/XLSX, TXT, CSV, RTF, JPEG, PNG, WebP, ZIP), extension must match.

| Method and path | Who | Body / query | Success |
| --- | --- | --- | --- |
| `POST /api/courses/assignments/{assignmentId}/submission-files` | enrolled learner of the delivery | `{deliveryId, originalName, contentType, sizeBytes}` | `201 {file, grant}` |
| `POST .../submission-files/{fileId}/complete` | owner | none | `{file}` |
| `GET /api/courses/assignments/{assignmentId}/submission-files?deliveryId=` | owner | | `{files}` (not deleted; staged and submitted) |
| `DELETE .../submission-files/{fileId}` | owner, before submit | | `{file}` (status DELETED) |
| `POST /api/courses/assignments/{assignmentId}/submit-files` | owner | `{deliveryId, fileIds: [uuid, 1..10]}` (order = sequence) | `201 {submission:{id,assignmentId,deliveryId,submissionType:"FILE",submittedAt}, files}` |
| `GET /api/courses/assignment-submissions/{submissionId}/files` | owner, teaching faculty, college admin | | `{files}` ordered by `sequence` |
| `POST /api/courses/assignment-submission-files/{fileId}/download-grant` | owner (staged or submitted); faculty/admin (submitted only) | optional `{disposition:"inline"\|"attachment"}` (inline honoured only for PDF/PNG/JPEG/WebP) | `{grant:{url,expiresAt,expiresInSeconds,file}}`, 5 minutes |

`file` = `{id, assignmentId, deliveryId, submissionId|null, sequence|null, originalName, contentType, sizeBytes, status, failureCode|null, createdAt, completedAt|null}`.

Errors: `STORAGE_NOT_FOUND` 404 (also used for every access denial), `STORAGE_PARENT_NOT_AVAILABLE` 409 (assignment or path not published), `STORAGE_ALREADY_SUBMITTED` 409, `STORAGE_FILE_LIMIT_REACHED` 409, `STORAGE_FILE_NOT_READY` 409 (submit with a file that is not READY; also grant for an overwritten object), plus the common set in section 6.

## 4. Project resource files

Upload, edit, delete: project mentors and admins (college admins need an active membership in the project's college; a platform admin without one gets `STORAGE_UPLOADER_MEMBERSHIP_REQUIRED` 403). Read and download: any project member and admins. Blocked on `ARCHIVED` and `COMPLETED` projects (`STORAGE_PARENT_NOT_AVAILABLE`). 50 MiB, document types plus Markdown, 200 files per project.

| Method and path | Who | Body | Success |
| --- | --- | --- | --- |
| `GET /api/projects/{projectId}/resource-files` | project members, admins | | `{files}`; members see READY only, mentors/admins see every non-deleted file |
| `POST /api/projects/{projectId}/resource-files` | mentor, admin | `{originalName, contentType, sizeBytes, title?, description?, resourceId?}` (`resourceId` links to an ACTIVE `project_resources` row of the same project) | `201 {file, grant}` (`grant.fileId`) |
| `POST .../resource-files/{fileId}/complete` | mentor, admin | none | `{file}` |
| `PATCH .../resource-files/{fileId}` | mentor, admin | `{title?, description?}` (at least one) | `{file}` |
| `DELETE .../resource-files/{fileId}` | mentor, admin | | `{file}` (DELETED; object removed best effort) |
| `POST .../resource-files/{fileId}/download-grant` | project members, admins | optional `{disposition}` | `{grant:{url,expiresAt,expiresInSeconds,file}}` |

`file` = `{id, projectId, resourceId|null, title, description|null, originalName, contentType, sizeBytes, status, failureCode|null, createdAt, completedAt|null}`. The existing `/api/projects/{projectId}/resources` (links/notes) is unchanged.

## 5. Lesson videos

Management: college admins (`courses.manage`, may use an offering-wide video with `deliveryId` omitted) and faculty with an active teaching assignment on the delivery (`deliveryId` required: faculty who do not teach that delivery get `FACULTY_TEACHING_SCOPE_REQUIRED` 403, and omitting `deliveryId` as a non-admin gives `STORAGE_FORBIDDEN` 403). Learners and everyone else cannot manage. Limits: types MP4, M4V, WebM, MOV, AVI (`video/mp4 video/webm video/quicktime video/x-msvideo video/x-m4v`), 4900 MiB, `durationSeconds` 1..86400 (client supplied), 50 non-archived videos per lesson and delivery scope; thumbnail JPEG/PNG/WebP 5 MiB.

| Method and path | Who | Body / query | Success |
| --- | --- | --- | --- |
| `GET /api/courses/lessons/{lessonId}/videos?deliveryId=` | managers | | `{videos}` (every non-deleted video of the delivery scope, with processing/publish state) |
| `POST /api/courses/lessons/{lessonId}/videos` | managers | `{title, originalName, contentType, sizeBytes, durationSeconds?, deliveryId?, lessonContentId?, replaceVideoId?}` | `201 {video, grant}` (`grant.videoId`) |
| `POST /api/courses/videos/{videoId}/complete` | managers | none | `{video}`; for a replacement, the verified video inherits publish state, visibility, order and content link and the old one is retired in the same transaction |
| `PATCH /api/courses/videos/{videoId}` | managers | any of `{title, durationSeconds, sequence, publishStatus, visibleToStudents, lessonContentId}` | `{video}` |
| `DELETE /api/courses/videos/{videoId}` | managers | | `{id, deleted:true}` (soft delete, objects removed best effort) |
| `POST /api/courses/videos/{videoId}/thumbnail` | managers | `{originalName, contentType, sizeBytes}` | `201 {video, grant}` (replaces an existing thumbnail) |
| `POST /api/courses/videos/{videoId}/thumbnail/complete` | managers | none | `{video}` |
| `GET /api/courses/lessons/{lessonId}/learner-videos?deliveryId=` | enrolled learners, teaching faculty, admins | | `{videos}` learner projection only (visible rule above) |
| `POST /api/courses/videos/{videoId}/playback-grant` | same as learner list | `{deliveryId, ttlSeconds?: 60..7200}` | `{grant:{url, expiresAt, expiresInSeconds, contentType, sizeBytes, durationSeconds|null, supportsRange:true, resumePositionSeconds, thumbnailUrl|null, video}}` |

Manager `video` = `{id, lessonId, deliveryId|null, lessonContentId|null, title, sequence, publishStatus, visibleToStudents, processingStatus, durationSeconds|null, originalName, contentType, sizeBytes, thumbnailStatus, replacesVideoId|null, failureCode|null, createdAt, updatedAt, completedAt|null}`. Learner `video` = `{id, lessonId, lessonContentId|null, title, sequence, durationSeconds|null, contentType, hasThumbnail}`.

Linking to a lesson content: create the `VIDEO` lesson content through the existing lesson-contents API with `storageKey = "video-asset/{videoId}"` and the same `durationSeconds`, then `PATCH` the video with `lessonContentId`. From then on the learner rule also requires the content to be `PUBLISHED` and visible, and the playback grant returns the learner's saved `resumePositionSeconds` (keep saving progress with `courses/progress/{contentId}`).

Playback in the browser: set `<video src={grant.url} poster={grant.thumbnailUrl}>`; seeking works because the URL supports HTTP Range. On `loadedmetadata` seek to `resumePositionSeconds`. Before `expiresAt`, or on a 403 from storage, request a new grant and swap `src`, restoring `currentTime`. Never store `url`.

## 6. Error codes

| Code | HTTP | Meaning |
| --- | --- | --- |
| `INVALID_ORIGIN` | 403 | missing or cross-origin `Origin` on a mutating call |
| `STORAGE_NOT_FOUND` | 404 | missing, deleted, or not visible to the caller (access denials are deliberately indistinguishable) |
| `STORAGE_FORBIDDEN` | 403 | known manager-only action without a delivery scope |
| `STORAGE_UPLOADER_MEMBERSHIP_REQUIRED` | 403 | uploader needs an active membership in the owning college |
| `STORAGE_NAME_INVALID` | 400 | empty, over 255 characters, path separators or control characters |
| `STORAGE_TYPE_NOT_ALLOWED` | 400 | type not in the allow list (exe, html, svg and friends) |
| `STORAGE_EXTENSION_MISMATCH` | 400 | extension does not match the declared type |
| `STORAGE_SIZE_INVALID` | 400 | not a positive integer |
| `STORAGE_FILE_TOO_LARGE` | 413 | above the kind's cap |
| `STORAGE_DURATION_INVALID` | 400 | reserved; an out-of-range `durationSeconds` is currently rejected as `INVALID_REQUEST` |
| `STORAGE_FILE_LIMIT_REACHED` | 409 | per-assignment, per-project or per-lesson count cap |
| `STORAGE_INVALID_STATE` | 409 | action not allowed in the current state (for example publish transition, complete after FAILED) |
| `STORAGE_FILE_NOT_READY` | 409 | not READY, or the object changed after verification |
| `STORAGE_UPLOAD_NOT_FOUND` | 409 | `complete` called before the PUT landed |
| `STORAGE_UPLOAD_EXPIRED` | 410 | upload window passed; row marked FAILED, start again |
| `STORAGE_UPLOAD_MISMATCH` | 422 | uploaded size, type, owner scope or token differs from the grant; row FAILED |
| `STORAGE_CONTENT_REJECTED` | 422 | magic bytes do not match the declared type; row QUARANTINED/BLOCKED |
| `STORAGE_PARENT_NOT_AVAILABLE` | 409 | assignment/path unpublished, project archived or completed |
| `STORAGE_ALREADY_SUBMITTED` | 409 | the learner already has a submission for this assignment |
| `STORAGE_FILES_REQUIRED` | 400 | reserved: a FILE submission without files |
| `STORAGE_NOT_CONFIGURED` | 503 | R2 configuration missing or unsafe |

Existing course/project errors (`FACULTY_TEACHING_SCOPE_REQUIRED`, `LESSON_NOT_FOUND`, `CONTENT_DELIVERY_MISMATCH`, `PROJECT_*`) may still be returned by the shared scope helpers on management routes and keep their existing status mapping.

## 7. What the lanes must build

* **Learner assignment page:** file picker honouring `acceptAttributeFor("assignment-submission")` and `limitsSummary`, client pre-check with the same limits, per-file progress (XHR `PUT`), `complete`, status chips from `fileStatusDescriptor`, remove staged file, submit button calling `submit-files`, submitted view listing files with a download action (download-grant then open `url`).
* **Faculty submission review:** list a submission's files and open them via the download grant.
* **Project resources tab:** mentor/admin upload with progress, title/description edit, delete, learner/member read-only list with download; show `QUARANTINED`/`FAILED`/`VERIFYING` states to mentors.
* **Faculty video management (lesson):** upload with progress, optional duration input, thumbnail upload, replace, publish/unpublish and learner visibility toggle, ordering, delete, status badges via `videoProcessingDescriptor`, preview via the playback grant; link to a VIDEO lesson content as described above.
* **Learner player:** list via `learner-videos`, play via `playback-grant`, resume, refresh before expiry.
* Do not render or store signed URLs; never call R2 with anything other than the grant's headers.
