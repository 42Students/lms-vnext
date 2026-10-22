# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-14-024-027 [P1] GAP facet F12
- Files: src/app/(authenticated)/admin/features/[collegeId]/page.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleFeatureCatalog.java:63-86 — Placements college-level-only, lower learner/class/department ignored
- Expected fix: Resolve old college-only Placements versus vNext learner academic override product change.

## G2-17-025-018 [P1] GAP facet F08
- Files: src/modules/courses/quiz-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:240-250 — unpublish PUBLISHED back to DRAFT when safe
- Expected fix: Provide reversible-before-attempt draft reset

## G2-17-025-025 [P1] GAP facet F12
- Files: src/modules/courses/quiz-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:243-249 — no unpublish after attempts or deadline
- Expected fix: Restore lifecycle rollback contract

## G2-17-025-026 [P1] GAP facet F12
- Files: src/modules/courses/quiz-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:276-295 — faculty/admin grades release toggle after deadline
- Expected fix: Resolve teacher privilege loss explicitly

## G2-17-025-045 [P1] GAP facet F23
- Files: src/modules/courses/quiz-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:276-295 — grade release can be reverted by manager
- Expected fix: Preserve reversible teacher result visibility

## G2-10-027-037 [P1] GAP facet F10
- Files: src/app/api/courses/assignments/[assignmentId]/file-upload/route.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:421-422 — POST /api/v1/upload/presign.
- Expected fix: Document endpoint transform and response contract

## G2-18-014-017 [P1] GAP facet F10
- Files: src/modules/messaging/tpo-campaign-unsubscribe-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:123-136 — campaign opt-out updates lead, logs activity and rings TPO bell.
- Expected fix: Make global and lead-local opt-out policies explicit and checked for all delivery routes.

## G2-19-030-007 [P1] MISSING facet F03
- Files: src/app/(authenticated)/tpo/profile/page.tsx
- Legacy: docs/legacy-source/frontend/src/components/profile/userInfo.js:96-111 — 120px square resilient avatar, name heading and pencil upload button.
- Expected fix: Add photo display/avatar and authorized edit affordance.

## G2-10-026-012 [P1] GAP facet F04
- Files: src/modules/messaging/tpo-campaign-unsubscribe-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:127-133 — SHA256 token hash resolves first lead.
- Expected fix: Migrate legacy hash records or support links until retired.

## G2-10-026-029 [P1] GAP facet F10
- Files: src/modules/messaging/tpo-campaign-unsubscribe-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:127-135 — SHA256 lookup, lead save, bell activity.
- Expected fix: Translate legacy campaign recipient storage.

## G2-10-026-035 [P1] GAP facet F12
- Files: src/modules/messaging/tpo-campaign-recipient-token.ts, src/modules/messaging/tpo-campaign-unsubscribe-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:123-137 — Used/unknown token does nothing and caller reports success.
- Expected fix: Align intentional idempotent privacy contract.

## G2-10-026-045 [P1] GAP facet F15
- Files: src/modules/messaging/tpo-campaign-recipient-token.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:70-110 — Sender embeds unique token in email.
- Expected fix: Confirm new dispatcher issues signed tokens to old-compatible page.

## G2-10-026-068 [P1] GAP facet F22
- Files: src/modules/messaging/tpo-campaign-unsubscribe-service.ts, src/db/schema/tpo-crm.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:108-110,127-129 — Recipient rows have SHA256 unsubscribe token hash, lead ID.
- Expected fix: Support legacy hash-token migration.

## G2-10-008-040 [P1] GAP facet F05
- Files: src/app/(authenticated)/admin/placements/analytics/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:557-564` company report paginates job rows only when >10, pageSize10
- Expected fix: Restore table pagination default 10 per page and pinned rollups

## G2-10-013-014 [P1] GAP facet F04
- Files: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:406-649 — Table rows are individual interviews: job/company, candidate, department, type, status, scheduled date, mode, actions.
- Expected fix: Make candidate interviews primary dataset; rounds should be secondary.

## G2-10-018-058 [P1] GAP facet F13
- Files: src/app/(authenticated)/admin/lecture-halls/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:305-311 — Departments failed Alert 'Departments could not be loaded', Retry; create form still visible.
- Expected fix: Load optional departments non-fatally, with Retry.

## G2-10-022-019 [P1] GAP facet F04
- Files: src/modules/platform-settings/legacy-setting-specs.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:148-188 — Four SMS settings carry DLT placeholders and variable order.
- Expected fix: Restore DLT example texts and variable ordering

## G2-10-022-071 [P1] MISSING facet F15
- Files: src/modules/platform-settings/legacy-setting-specs.ts, src/components/admin/tenant-settings-editor.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:148-188 — SMS template DLT wording, variables and exact match risks explained.
- Expected fix: Show variable instructions and recipient/channel notes

## G2-10-022-098 [P1] GAP facet F21
- Files: src/modules/platform-settings/model.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:148-188 — SMS uses TRAI/DLT exact template variables.
- Expected fix: Map old template dispatch to present Exotel/outbound contracts without claiming active sender

## G2-10-023-029 [P1] GAP facet F06
- Files: src/app/(authenticated)/admin/tenants/create/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:77-90 — After organization create, keep orgId as College default without changing selected scope.
- Expected fix: Wire onCreated org to College form prefill on same page

## G2-10-024-011 [P1] GAP facet F03
- Files: src/components/verification/VerificationWorkspace.tsx
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:357-377 — DataTable 9 columns Student, Roll, Batch, Branch(hidden), Section, Status, Marksheets, date, By/reason, Review.
- Expected fix: Recreate tabular columns, selectable rows, bulk toolbar

## G2-10-024-018 [P1] GAP facet F04
- Files: src/components/verification/VerificationReviewDrawer.tsx
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:93-95 — Identity shows masked Aadhaar/PAN and 'Not given' placeholder.
- Expected fix: Show masked last four and 'Not given' placeholders without exposing full ID

## G2-10-024-021 [P1] GAP facet F05
- Files: src/components/verification/SuperAdminVerificationPanel.tsx, src/components/verification/VerificationWorkspace.tsx
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:356-377 — Queue uses TpoDataTable with local search/filter/sort/export.
- Expected fix: Recreate dense sortable table and filter header

## G2-10-024-024 [P1] GAP facet F05
- Files: src/modules/verification/staff-queue-service.ts
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:35-36,417-422 — Legacy queue max1000 per view with warning 'Showing first 1,000'.
- Expected fix: Fail loudly with capacity warning; don't silently alter visible result contract

## G2-10-024-025 [P1] GAP facet F05
- Files: src/components/verification/SuperAdminVerificationPanel.tsx
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:423-429 — Table picks all/selected from filtered current view, no 20 selection cap.
- Expected fix: Match scope of bulk audience and communicate explicit new cap
