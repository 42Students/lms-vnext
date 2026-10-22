# Private R2 lesson-video cutover and CORS gate

The old LMS video picker and media player used broad upload and public read URLs. vNext already provides a private, membership-scoped picker in `FacultyLessonVideoManager`, signed single-PUT transfer in `faculty-video-transfer.ts`, and signed HTTP Range playback in `LearnerVideoPlayer`. **Keep the public video feature disabled until the gates below are proven against real R2.**

## Feature parity to inspect

| Operation | vNext ownership | Expected behavior |
| --- | --- | --- |
| Faculty select a lesson video | `src/components/courses/faculty-lesson-video-manager.tsx` | Restrict allowed MIME/extensions, show 4,900 MiB limit, title and optional duration, progression/cancel/retry and scan state; no new icon dependency |
| Presign then upload | `src/components/courses/faculty-video-transfer.ts` | Parent lesson/delivery authorized on server; grant has exact required headers; direct XHR PUT with byte progress, then bounded complete retries; no credentials on R2 URL |
| Thumbnail | same manager/transfer | JPEG/PNG/WebP only, at most **5 MiB**; separate thumbnail grant and complete; the old 10 MiB image cap must not leak into this picker |
| Faculty preview/replace/publish | `src/components/courses/faculty-video-preview.tsx` and manager | READY-only preview, signed short-lived grant, preserve playback position, replace only authorized lesson video, publish gate rejects unscanned assets |
| Learner player | `src/components/courses/learner-video-player.tsx` | PUBLISHED path/video and enrolled delivery only; handle `loadedmetadata` seek, Range reads, progress, signed URL rotation ahead of expiry, poster/thumbnail and media error refresh |
| Non-video link resource | lesson content APIs | Keep a separate permitted HTTPS LINK pathway for a YouTube URL; uploading video is never forced by the legacy YouTube control |

## Operator verification, not repository proof

The following are **pending release checks**. Running a TypeScript typecheck does not verify them; a production bucket CORS rule or HTTP gateway must be tested independently. Record actual browser network traces and provider receipts in the release ticket, not the repository.

1. Confirm the R2 **private** bucket is not anonymously readable and access requires a signed authorized grant. Anonymous old paths should return 403 or 404 after cutover.
2. From each allowed front-end origin, verify the browser OPTIONS preflight for `PUT` allows only the required grant headers: `content-type` and the exact `x-amz-meta-*` fields. Grant response itself is produced by the authenticated app, not R2; do not add `Authorization` or `Cookie` to R2 PUT.
3. Exercise legitimate signed `PUT` with 100 MiB, 1 GiB and 4,900 MiB MP4 fixtures; verify response codes, latency, single-request size limit, browser progress and failure recovery. CORS permission without an actual successful PUT is **not** a pass.
4. Exercise a 5 MiB JPEG/PNG/WebP thumbnail, an oversized or mismatched MIME/extension thumbnail, and a malformed full video. Server and UI must reject the latter without ever exposing a READY playback grant.
5. Confirm `complete` returns PROCESSING/VERIFYING until scanning attests the object. In production the scanner must actually exist before publish is enabled. Verify PUBLISHED+visible+enrolled grants and DRAFT/archived/cross-college denials separately.
6. Verify MP4 HTTP `Range` requests return 206 with sensible `Content-Range` on the signed GET. Seek midway; wait until before grant expiry and validate seamless regrant restores position and playback rate. Retry a 403 storage error by asking the authorized API for a new grant.
7. Run user-journey regression for legacy VIDEO and YOUTUBE content and confirm no raw public object URLs, bucket names, upload tokens, or permanent signed links appear in HTML source, browser persistence or application logs.

The vNext static product limit is 4,900 MiB, intentionally smaller than the old 5,120 MiB legacy video cap because resumable multipart transfers are not implemented. Never advertise a successful 5 GiB upload.

Release status: **unverified** until the above live R2 tests and production scanning are separately attested. The repository's dev-only attestation is not malware scanning.
