# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-1-001-050 [P1] GAP facet F23
- Files: src/components/admin/person-membership-actions.tsx
- Legacy: `AdminUserLifecycleController.java:97-99,129-131` suspends account record, which blocks global login per legacy UI comment (`Faculty.js:489-490`).
- Expected fix: Resolve cross-college semantics in auth and UX: explain other memberships remain usable after re-login, but suspended college remains blocked.

## G2-12-022-029 [P1] GAP facet F10
- Files: src/modules/placements/result-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoResultsController.java:52-57 — pending GET returns only unsuperseded unapplied records
- Expected fix: Expose true pending endpoint/filter for old callers; avoid applying historical rows

## G2-12-022-038 [P1] GAP facet F12
- Files: src/modules/placements/result-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoResultsService.java:79-86,107-118 — PASS → next non-TALK bucket; TALK holds; HOLD waitlisted; default FAIL/ABSENT rejected
- Expected fix: Match student-facing WAITLISTED and REJECTED messaging/status semantics

## G2-12-022-046 [P1] GAP facet F15
- Files: src/modules/placements/result-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:64-79 — only changed status enqueues APPLICATION_STATUS_CHANGED to learner outbox
- Expected fix: Prevent misleading notifications for unchanged stage; compare delivery dedupe and channel

## G2-18-025-001 [P1] GAP facet F01
- Files: src/app/(authenticated)/tracker/logs/page.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicTrackerLogsAccessController.java:36-38,64-66 — public POST /api/v1/public/bug-tracker/logs-access/verify
- Expected fix: Intentional security removal; offer named admin login and scoped deep link, NEVER restore shared-secret superadmin bypass

## G2-1-010-038 [P1] GAP facet F10
- Files: src/modules/profile-verification/transaction-writer.ts, src/modules/profile-verification/service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:380-405`: verify promotes submitted_snapshot to verified_snapshot, academic scores, recalculates eligibility, records event, enqueues PROFILE_VERIFIED.
- Expected fix: Verify eligibility recalculation parity after education approval and notification outbox event.

## G2-1-010-039 [P1] GAP facet F10
- Files: src/modules/profile-verification/transaction-writer.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:409-425`: sendBack stores trimmed reason, chooses SENT_BACK vs VERIFIED, event+PROFILE_SENT_BACK.
- Expected fix: Check notification dispatch + retained prior verified snapshot on update send-back.

## G2-1-010-041 [P1] GAP facet F10
- Files: src/modules/profile-verification/transaction-writer.ts, src/db/schema/profile-verification.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:481-521`: Education verification writes converted percentages, CGPA, passing year and earned marks.
- Expected fix: Crosswalk earned marks, conversion rule, PG year and candidate eligibility event.

## G2-1-010-049 [P1] GAP facet F12
- Files: src/modules/profile-verification/transaction-writer.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:417-418`: sent-back UPDATE_PENDING becomes VERIFIED, first SUBMITTED becomes SENT_BACK.
- Expected fix: Assert sent-back updated proof remains verified on prior snapshot and note is visible.

## G2-10-027-038 [P1] GAP facet F10
- Files: src/app/api/colleges/[collegeId]/branding/logo/route.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:1603-1614 — POST /api/v1/upload/file/upload multipart.
- Expected fix: Plan domain-specific fallback per type

## G2-10-027-057 [P1] GAP facet F14
- Files: src/app/api/colleges/[collegeId]/branding/logo/route.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:1603-1780 — Multipart server fallback for CORS.
- Expected fix: Retain transport fallback for approved features

## G2-19-030-029 [P1] MISSING facet F09
- Files: src/app/(authenticated)/tpo/profile/page.tsx
- Legacy: docs/legacy-source/frontend/src/components/profile/userInfo.js:106 — PencilUploadButton invokes upload/URL chooser.
- Expected fix: Restore photo picker with keyboard and signed URL flow.

## G2-10-004-035 [P1] GAP facet F07
- Files: src/components/admin/super-admin-company-edit.tsx, src/components/admin/super-admin-college-company-actions.tsx
- Legacy: Old industry max100 description max2000, contact name 150 email 150 phone30 and notes2000 `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:491-518`
- Expected fix: Apply legacy per-field length caps in college workflow and decide global caps explicitly

## G2-10-005-017 [P1] GAP facet F03
- Files: src/components/admin/super-admin-today-board.tsx
- Legacy: Today card rows show named affected students/courses with and N more when total exceeds items `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:51-63` `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:149-240`
- Expected fix: Include authorized item previews, compact rows and overflow counts in each attention card

## G2-10-005-025 [P1] GAP facet F05
- Files: src/components/admin/super-admin-today-board.tsx
- Legacy: Old Today cards order Attendance not taken, Under threshold, Waiting to be graded, Courses with no teacher, Setup gaps, Quizzes closing this week `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:149-240`
- Expected fix: Populate all six legacy attention categories and preserve order

## G2-10-005-031 [P1] MISSING facet F08
- Files: src/app/(authenticated)/dashboard/page.tsx, src/components/admin/super-admin-today-board.tsx
- Legacy: Old Today fetch failure uses Couldn't load today's overview with Retry `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:102-109`
- Expected fix: Render old explicit error and Retry rather than hiding backend failure as unknown values

## G2-10-005-036 [P1] GAP facet F10
- Files: src/modules/colleges/admin-today-attention-service.ts
- Legacy: Legacy Today calls getAdminCollegeDashboard with pending at-risk grading unstaffed setup gaps dueWeek and today payload `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:81-85` `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:113-123`
- Expected fix: Build endpoint projection returning each old section's totals and top items

## G2-10-005-067 [P1] GAP facet F21
- Files: src/modules/colleges/admin-today-attention-service.ts
- Legacy: Old Today query returns six named issue sets and status per section `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:113-123`
- Expected fix: Implement missing attendance risk, grading backlog, setup gaps and drilldown sources

## G2-10-008-031 [P1] MISSING facet F04
- Files: src/app/api/admin/placements/hiring-report/export/route.ts
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:264-319` CSV includes separate metrics summary, funnel, company and totals
- Expected fix: Append Hiring Report Summary and Hiring Funnel sections to CSV, with matching status values

## G2-10-008-068 [P1] GAP facet F11
- Files: src/app/(authenticated)/admin/placements/analytics/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/hiring-dashboard.js:11-37` requires selected college; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:874-877` checks selected scope, college perform-admin, placements feature enabled
- Expected fix: Ensure feature-disabled legacy behavior and Super Admin exemption policy are explicitly reconciled

## G2-10-008-085 [P1] MISSING facet F14
- Files: src/app/api/admin/placements/hiring-report/export/route.ts
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:264-319` exports CSV sections Summary/Funnel/Company rows/Company Totals
- Expected fix: Restore summary/funnel CSV blocks and old section labels

## G2-10-009-015 [P1] MISSING facet F03
- Files: src/components/admin/inbound-mail-list.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:19-28` eight distinct routing-status Tag labels/colors
- Expected fix: Preserve routing outcome status as separate property and colored tag

## G2-10-009-016 [P1] GAP facet F03
- Files: src/components/admin/inbound-mail-list.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:102` status cell appends Done Tag only when handledAt exists
- Expected fix: Display routing outcome and handled state simultaneously

## G2-10-009-019 [P1] GAP facet F03
- Files: src/components/admin/inbound-mail-list.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:130-133` Mark done / Move back to To read hidden for POSTED
- Expected fix: Hide manual triage controls for automatically posted replies

## G2-10-009-055 [P1] GAP facet F09
- Files: src/components/admin/inbound-mail-list.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:68-71` row click opens loading Drawer then GET full
- Expected fix: Restore one-time detail GET, loading progress, and post-fetch reconciliation
