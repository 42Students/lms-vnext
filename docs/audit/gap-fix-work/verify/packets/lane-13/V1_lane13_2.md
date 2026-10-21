# Verification packet (P1 sample): 17 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-2-001-023 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: LD:237-240 Comment textarea 2 rows, maxLength 4000, placeholder Add to the history
- Expected fix: Use 4000-comment limit and preserve distinct comment input/placeholder.

## G2-20-030-063 [P1] GAP facet F13
- Files: src/app/(authenticated)/teacher/profile/details/page.tsx, src/modules/people/faculty-profile-self.staged.ts
- Legacy: Legacy independent section reads allSettled, show missing section names and Retry sections (`docs/legacy-source/frontend/src/components/profile/about.js:177-262`, `docs/legacy-source/frontend/src/components/profile/about.js:905-914`)
- Expected fix: Surface granular partial failures and section retry where backend supports it

## G2-12-023-073 [P1] GAP facet F23
- Files: src/modules/announcements/tpo-notice-delivery-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:25-30`
- Expected fix: TPO notice audience type COLLEGE must not be assumed equivalent to learners-only; ensure faculty/admin visibility matches owner intention.

## G2-3-010-013 [P1] GAP facet F10
- Files: src/modules/storage/private-object-storage.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/PrivateDocStorage.java:93-99`
- Expected fix: Old caller access controller gates GET/PUT; new scoped UUID input must not substitute for authorization. Feature API must verify owner or verifier.

## G2-4-015-033 [P1] GAP facet F10
- Files: src/modules/people/profile-validation.ts, src/modules/placements/candidate-preferences-service.ts
- Legacy: Legacy GET reads JobPreferencesRepository and serializes six DTO properties. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerProfileController.java:1177-1186`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerProfileServiceImpl.java:924-940`)
- Expected fix: Provide complete six-field read model or migrate all readers.

## G2-4-016-003 [P1] GAP facet F01
- Files: src/modules/attendance/parent-sms-service.ts, src/modules/messaging/receipt-history-service.ts
- Legacy: Legacy thin log exists to answer support questions about absence messages. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SmsDeliveryLog.java:8-17`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:22-31`)
- Expected fix: Provide privacy-safe support lookup across OTP, absence, correction and job SMS.

## G2-5-001-023 [P1] GAP facet F07 Validation and errors
- Files: src/components/attendance/admin-attendance-workspace.tsx
- Legacy: Assignment verification failure 'Couldn't verify which courses are taught to this class' and Retry class courses; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:491-495
- Expected fix: Surface class-offering lookup failure separately from verified empty list; provide retry.

## G2-5-001-043 [P1] GAP facet F13 Empty/loading/error/offline/session
- Files: src/app/(authenticated)/college/attendance/page.tsx, src/components/attendance/admin-attendance-workspace.tsx
- Legacy: Grid skeleton labeled 'Loading monthly attendance'; refresh status 'Refreshing attendance…'; error retains last grid and Retry; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:523-538
- Expected fix: Add visible loading/refresh/error states with same-scope stale data retained and Retry.

## G2-5-006-013 [P1] GAP facet F04 Data formatting
- Files: src/modules/attendance/admin-grid-model.ts
- Legacy: Daily cell P/A/N/X or attended/marked ratio multiple (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:185-207)
- Expected fix: Show aggregate ratio for multi-session days.

## G2-5-027-083 [P1] GAP facet F22
- Files: src/modules/people/college-student-csv-service.ts
- Legacy: Legacy bulk import batch ID with undo association. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:436-468`
- Expected fix: Add batch provenance table for reversible import and accounting.

## G2-6-001-073 [P1] GAP facet F22
- Files: src/modules/people/college-role-directory-service.ts
- Legacy: Legacy suspendedAt and suspensionReason persisted in faculty entity `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:28-34`
- Expected fix: Ensure reversible suspension reason/history and session revocation are represented in new schema

## G2-11-026-043 [P1] GAP facet F23
- Files: (none, new feature)
- Legacy: Legacy evidence metadata includes sourceUrl/path/browser/viewport (BugReportCreateRequest.java:27-40).
- Expected fix: Extend input and persistence mapping; never silently drop report diagnostics.

## G2-7-001-063 [P1] GAP facet F20
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:75-83: query-preserving shallow replace on quick-filter toggle.
- Expected fix: Preserve q, status, riskSort, pageSize when toggling, resetting page.

## G2-7-018-043 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:87-95 mentorless deleted restore allowed but BLOCKED
- Expected fix: Support mentorless blocked restore or mark policy change and give recovery path

## G2-8-003-023 [P1] GAP facet F07
- Files: src/modules/people/college-contacts-service.ts
- Legacy: `.../controller/UserController.java:441-447`: blocks learners/recruiters, enforces selected college
- Expected fix: Document intentional restriction and verify faculty/TPO access expectations before extending

## G2-8-024-033 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: Legacy suspend increments tokenVersion to revoke existing sessions immediately (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterAdminService.java:286-295).
- Expected fix: Make suspension+session invalidation failure atomic/retriable and test active token invalidation.

## G2-9-016-043 [P1] GAP facet F07
- Files: src/app/(authenticated)/college/placements/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:126-132` — Failed active list loads error Couldn't load drives. Check your connection and retry.
- Expected fix: Return section-scoped Retry with exact list error message.
