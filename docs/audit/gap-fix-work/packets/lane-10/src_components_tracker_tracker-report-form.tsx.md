# Work packet: edit src/components/tracker/tracker-report-form.tsx

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u002-tracker-report.md

## G2-16-002-019  [P1] GAP  facet F05  effort M
- Legacy: `index.js:317`; `SimilarIssuesPanel.jsx:23-53`: related list auto-appears on description >=15 chars after 500ms, max five.
- vNext now: `tracker-report-form.tsx:95-107,219-245`: manually entered keyword >=3 characters, explicit button and admin-only.
- Fix: Restore nonblocking description-driven matches for permitted reporters, with 500ms debounce and limit five.

## G2-16-002-037  [P1] MISSING  facet F07  effort M
- Legacy: `ScreenshotPicker.jsx:103`; `bugTrackerAttachmentUtils.js:9-49`: exact MIME/empty/8MB/3-file errors shown inline.
- vNext now: `tracker-report-form.tsx:204-245`: no screenshot field and thus no validation messages.
- Fix: Implement client/server screenshot constraints and inline messages, upload never blocks report submission.

## G2-16-002-039  [P1] MISSING  facet F08  effort M
- Legacy: `index.js:203-219`: upload in progress, attached count, partial failure and retry message.
- vNext now: `tracker-report-form.tsx:116-132`: no upload statuses.
- Fix: Reintroduce per-file successful/failed counts, uploading progress and Retry screenshots.

## G2-16-002-051  [P1] GAP  facet F11  effort M
- Legacy: `SimilarIssuesPanel.jsx:23-40`; `PublicBugTrackerController.java:37-47`: any reporter may search public existing reports.
- vNext now: `tracker-report-form.tsx:95-107,219-245`: similar search only if super admin and API GET requires privileged auth.
- Fix: Provide privacy-safe related-results endpoint for reporter scope, preserving nonblocking similar nudges.

## G2-16-002-059  [P1] MISSING  facet F13  effort M
- Legacy: `index.js:203-219`: screenshot partial failure does not hide successful issue; retry offered.
- vNext now: `tracker-report-form.tsx:116-132`: no screenshot pending/failed states.
- Fix: Add progress, partial failure and retry without resetting created public ID.

## G2-16-002-061  [P1] MISSING  facet F14  effort M
- Legacy: `index.js:319`; `ScreenshotPicker.jsx:59-125`: paste/drop/choose and preview PNG/JPG/WebP, remove image.
- vNext now: `tracker-report-form.tsx:135-254`: no upload component.
- Fix: Restore picker with preview and remove; sanitize filename and object URLs.

## G2-16-002-082  [P1] GAP  facet F20  effort M
- Legacy: `index.js:112-114`: submitting state prevents double save after rerender but no synchronous lock.
- vNext now: `tracker-report-form.tsx:57-60`: pending guard likewise state-only; POST emits random ID.
- Fix: Add synchronous in-flight ref and idempotency token to avoid repeated issue records on very fast double submit/retries.

## G2-16-002-032  [P2] GAP  facet F07  effort M
- Legacy: `index.js:263-276,279-285,290-291,305-307`: exact required errors reporter/account/environment/location/type/description.
- vNext now: `report-input-model.ts:7-18,20-36`: many same strings, but `tracker-report-form.tsx:75-77,246` shows only first error in page notice.
- Fix: Show each invalid field error at its control, retaining exact legacy text and global summary only when needed.

## G2-16-002-036  [P2] GAP  facet F07  effort S
- Legacy: `index.js:158-160`: server error message used or fallback `The issue could not be reported. Your text is still here — please try again.`.
- vNext now: `tracker-report-form.tsx:88-90,246`: FriendlyFetchError/friendlyApiError, not exact safe fallback.
- Fix: Match fallback text and retain untouched form on rejection.

## G2-16-002-041  [P3] GAP  facet F08  effort S
- Legacy: `index.js:330-333`: footer says draft saves automatically, paste screenshots anywhere, keyboard shortcut.
- vNext now: `tracker-report-form.tsx:247-251`: only Ctrl/⌘ + Enter.
- Fix: Restore complete footer once screenshot behavior returns.
