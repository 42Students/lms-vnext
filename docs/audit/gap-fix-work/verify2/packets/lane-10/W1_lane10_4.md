# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-14-002-038 [P1] GAP facet F06
- Files: src/components/college/college-person-edit-action.tsx
- Legacy: Legacy edit dirty close prompts Discard student edits? Keep editing/Discard edits; vNext close ignores unsaved when not saving — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:696-715,1593-1608`
- Expected fix: Add isDirty guard, discard confirmation and disabled while saving

## G2-14-002-090 [P1] GAP facet F20
- Files: src/components/college/college-person-edit-action.tsx
- Legacy: Legacy edit dirty discard guard; vNext only busy pending guard — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:696-715`
- Expected fix: Track dirty form, prompt Discard edits/Keep editing

## G2-18-031-025 [P1] GAP facet F06
- Files: src/components/college/college-student-register-form.tsx
- Legacy: Legacy Student register requires First Name Last Name Roll Number Mobile (10-digit) Program and Class, optional Email/Gender/DOB/Address; Students.js:1134-1248
- Expected fix: Decide required Roll/Class equivalence; for legacy route enforce required when academic policy demands, show inline field errors

## G2-18-031-041 [P1] GAP facet F10
- Files: src/components/college/college-student-register-form.tsx, src/components/college/college-student-csv-import.tsx, src/app/api/people/[membershipId]/lifecycle/route.ts
- Legacy: Legacy learner POST /register, /bulk-validate, /bulk-register, /bulk-imports and undo, PUT /update/{id}, DELETE /delete/{id}; LearnerController.java:338-465,1065-1141
- Expected fix: Write route/payload/status migration sheet and explicitly resolve old undo and hard-delete APIs, no unsafe replacement

## G2-18-031-054 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: Legacy suspension sets suspendedAt/reason and revokes sessions/token version, reactivation clears state; AdminUserLifecycleController.java:83-167,178-198
- Expected fix: Document cross-college device-session revocation vs membership-only access and exact reactivation semantics

## G2-15-012-020 [P1] GAP facet F06
- Files: src/modules/notifications/exotel-sms.ts
- Legacy: Legacy normalizes 10-digit and 91-prefixed numbers to +91; accepts E.164. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:211-217`)
- Expected fix: Add India phone normalization before sendOtp; avoid rejecting valid legacy input.

## G2-15-012-060 [P1] GAP facet F20
- Files: src/modules/notifications/exotel-sms.ts
- Legacy: Trims phone spaces, parentheses, hyphens; +91 conversion. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:211-217`)
- Expected fix: Normalize at auth request to ensure unchanged login experience.

## G2-15-004-049 [P1] GAP facet F13
- Files: (none, new feature)
- Legacy: Legacy initial fetch error offers Retry and unchanged-data guidance (ProjectsContent.jsx:245-255)
- Expected fix: Build route-specific ErrorState + recovery

## G2-15-006-045 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: Legacy inactive/unpublished/locked cards use disabled div aria-disabled and reason (courseListingUtils.js:7-15; CoursesContent.jsx:549-560)
- Expected fix: Preserve distinct disabled locked/prerequisite reasons and explicit disabled card semantics

## G2-15-008-054 [P1] GAP facet F17
- Files: (none, new feature)
- Legacy: Legacy progress unknown Alert role with Retry state, locked row role=status (syllabusDetail.js:338-347,399-404)
- Expected fix: Preserve live regions on error and action disabled rule

## G2-16-001-001 [P1] GAP facet F01
- Files: src/app/(authenticated)/tracker/audit-findings/page.tsx, src/components/tracker/tracker-admin-nav.tsx
- Legacy: `audit-findings.js:194-221`; `TrackerShell.jsx:55-69`: tracker-branded standalone page via Audit findings nav; password gate possible.
- Expected fix: Restore accessible tracker shell/entry for authorized intended testers or record explicit security migration decision and equivalent approved access.

## G2-16-002-019 [P1] GAP facet F05
- Files: src/components/tracker/tracker-report-form.tsx
- Legacy: `index.js:317`; `SimilarIssuesPanel.jsx:23-53`: related list auto-appears on description >=15 chars after 500ms, max five.
- Expected fix: Restore nonblocking description-driven matches for permitted reporters, with 500ms debounce and limit five.

## G2-16-002-037 [P1] MISSING facet F07
- Files: src/components/tracker/tracker-report-form.tsx
- Legacy: `ScreenshotPicker.jsx:103`; `bugTrackerAttachmentUtils.js:9-49`: exact MIME/empty/8MB/3-file errors shown inline.
- Expected fix: Implement client/server screenshot constraints and inline messages, upload never blocks report submission.

## G2-16-002-039 [P1] MISSING facet F08
- Files: src/components/tracker/tracker-report-form.tsx
- Legacy: `index.js:203-219`: upload in progress, attached count, partial failure and retry message.
- Expected fix: Reintroduce per-file successful/failed counts, uploading progress and Retry screenshots.

## G2-16-002-045 [P1] GAP facet F10
- Files: src/app/api/tracker/issues/route.ts
- Legacy: `BugTrackerService.js:54-56`; `PublicBugTrackerController.java:31-35`: PUBLIC POST `/api/v1/public/bug-tracker/issues`, response issue itself.
- Expected fix: Provide approved public/reporter-session intake contract or record authenticated redesign; adapt client response envelope.

## G2-16-002-051 [P1] GAP facet F11
- Files: src/components/tracker/tracker-report-form.tsx
- Legacy: `SimilarIssuesPanel.jsx:23-40`; `PublicBugTrackerController.java:37-47`: any reporter may search public existing reports.
- Expected fix: Provide privacy-safe related-results endpoint for reporter scope, preserving nonblocking similar nudges.

## G2-16-002-059 [P1] MISSING facet F13
- Files: src/components/tracker/tracker-report-form.tsx
- Legacy: `index.js:203-219`: screenshot partial failure does not hide successful issue; retry offered.
- Expected fix: Add progress, partial failure and retry without resetting created public ID.

## G2-16-002-061 [P1] MISSING facet F14
- Files: src/components/tracker/tracker-report-form.tsx
- Legacy: `index.js:319`; `ScreenshotPicker.jsx:59-125`: paste/drop/choose and preview PNG/JPG/WebP, remove image.
- Expected fix: Restore picker with preview and remove; sanitize filename and object URLs.

## G2-16-002-082 [P1] GAP facet F20
- Files: src/components/tracker/tracker-report-form.tsx
- Legacy: `index.js:112-114`: submitting state prevents double save after rerender but no synchronous lock.
- Expected fix: Add synchronous in-flight ref and idempotency token to avoid repeated issue records on very fast double submit/retries.

## G2-16-003-010 [P1] GAP facet F03
- Files: src/components/tracker/tracker-workflow-panel.tsx
- Legacy: `[issueId].js:172-187`: right-side editable status Select for managers, read-only pill for others.
- Expected fix: Restore immediate status-select mutation and read-only status pill depending on manager scope.

## G2-16-003-045 [P1] GAP facet F11
- Files: src/components/tracker/tracker-issue-copy-actions.tsx
- Legacy: `trackerMarkdown.js:15-53`: full markdown includes issue fields, source metadata, engineer notes, fix commits.
- Expected fix: Use validated issueToMarkdown-equivalent serialization and omit empty fields exactly.

## G2-16-004-042 [P1] GAP facet F10
- Files: src/app/api/tracker/issues/route.ts
- Legacy: `BugTrackerService.js:58-65`; `PublicBugTrackerController.java:37-47`: public GET `/api/v1/public/bug-tracker/issues?page&size&...`.
- Expected fix: Provide policy-approved searchable reporter view; map legacy page param/API semantics or intentional migration.

## G2-16-004-050 [P1] GAP facet F12
- Files: src/components/tracker/tracker-issue-bulk-actions.tsx
- Legacy: `issues/index.js:190-213`: after success bulk exits selection; on failure leaves failed IDs selected.
- Expected fix: Retain only failed IDs for retry, excluding already-updated rows and preventing redundant writes.

## G2-16-004-076 [P1] GAP facet F21
- Files: src/app/api/tracker/issues/route.ts
- Legacy: `issues/index.js:99-122`; `BugTrackerService.js:58-65`: bug tracker issues endpoint.
- Expected fix: Restore approved public list/related endpoint for nonmanager reporters if external tracker retained.

## G2-16-005-004 [P1] GAP facet F01
- Files: src/app/(authenticated)/tracker/logs/page.tsx
- Legacy: `logs.js:770-815`; `TrackerLogsAccessGate.jsx:12-56`: Super Admin or tracker logs password access gate.
- Expected fix: Get owner access decision; if password-based tester access remains, implement isolated hardened alternate auth.

## Lane-12 fast verification triage (2026-10-22)

Confirmed via cited vNext code (OK, limited to described behavior): G2-14-002-038, G2-14-002-090, G2-15-012-020, G2-15-012-060, G2-16-002-082.

DEFERRED — deeper implementation/API/migration review required; these are NOT verified or fixed: G2-18-031-025, G2-18-031-041, G2-18-031-054, G2-15-004-049, G2-15-006-045, G2-15-008-054, G2-16-001-001, G2-16-002-019, G2-16-002-037, G2-16-002-039, G2-16-002-045, G2-16-002-051, G2-16-002-059, G2-16-002-061, G2-16-003-010, G2-16-003-045, G2-16-004-042, G2-16-004-050, G2-16-004-076, G2-16-005-004.
This packet has been triaged, not certified parity-complete; no unverified row is claimed OK.
