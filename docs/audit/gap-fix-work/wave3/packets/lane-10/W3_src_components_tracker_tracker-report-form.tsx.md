# Work packet (wave 3): edit src/components/tracker/tracker-report-form.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u002-tracker-report.md

## G2-16-002-010  [P1] MISSING  facet F03  effort L
- Legacy: `ScreenshotPicker.jsx:59-125`: labelled dropzone with paste/drop/choose, file previews and remove × action.
- vNext now: `tracker-report-form.tsx:204-245`: no screenshot field or preview actions.
- Fix: Add screenshot picker, paste listener, dropzone, preview/revoke and per-file remove.

## G2-16-002-046  [P1] MISSING  facet F10  effort L
- Legacy: `index.js:137-157`; `BugTrackerService.js:87-136`: save issue, presign POST, direct R2 PUT, confirm POST; retry failed confirms stored key.
- vNext now: `tracker-report-form.tsx:79-93`: only POST issue, no upload chain or retries.
- Fix: Implement post-create upload/confirm flow with independently retryable attachments and no report loss.

## G2-16-002-080  [P1] MISSING  facet F20  effort L
- Legacy: `bugTrackerAttachments.js:10-26`: each image upload settles independently with storageKey stored for confirm retries.
- vNext now: `tracker-report-form.tsx:79-93`: no post-create attachments.
- Fix: Preserve per-file idempotent upload and confirmation; never lose created issue on failed attachment.

## G2-16-002-084  [P1] MISSING  facet F21  effort L
- Legacy: `BugTrackerAttachmentService.java:63-72,183-189`: R2 signed-upload dependency; missing storage gives explicit 503.
- vNext now: `tracker-report-form.tsx:204-245`: no R2 invocation or storage-unavailable state.
- Fix: Integrate signed image uploads with graceful R2 unavailable fallback and retry.

## G2-16-002-090  [P1] MISSING  facet F23  effort L
- Legacy: `index.js:195-338`: public standalone form, auto-similar, screenshot picker.
- vNext now: `tracker-report-form.tsx:116-254`: public login-free intake, auto-similar and screenshots deliberately excluded by authenticated implementation; owner decision not established.
- Fix: Obtain explicit owner decisions for public intake, uploader, similarity; implement missing approved functionality.
