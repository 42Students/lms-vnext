# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-2-024-026 [P1] GAP facet F12
- Files: src/modules/operations/outbound-delivery-queue.ts
- Legacy: SmsDeliveryLog.java:36-43 statuses SENT/FAILED are provider acceptance
- Expected fix: Separate send-intent state from actual provider acceptance and failure.

## G2-2-024-034 [P1] GAP facet F15
- Files: src/modules/notifications/exotel-sms.ts
- Legacy: SmsDeliveryLog.java:45-49 providerMessageId/errorSummary supported
- Expected fix: Persist sanitized provider Sid, status and failure reason.

## G2-2-024-037 [P1] MISSING facet F18
- Files: src/modules/notifications/exotel-sms.ts
- Legacy: AdminSmsLogController.java:80-82 exact accepted-not-delivered note
- Expected fix: Use exact note in status help text.

## G2-2-024-044 [P1] GAP facet F21
- Files: src/modules/operations/outbound-delivery-contract.ts
- Legacy: AdminSmsLogController.java:51-52 mentions notification/otp/job.update origins
- Expected fix: Instrument all authorized SMS producers including attendance parent notifications.

## G2-2-024-045 [P1] GAP facet F22
- Files: src/modules/operations/outbound-delivery-queue.ts
- Legacy: V134__sms_delivery_log.sql:20-40 stores purpose,suffix,status,providerMessageId,errorSummary,collegeId,createdAt + indexes
- Expected fix: Register separate sanitized SMS send-attempt table/indexes; don't expose encrypted payload.

## G2-2-002-010 [P1] GAP facet F07
- Files: (none, new feature)
- Legacy: LC:15-18 false returns silent exclusion; no error message
- Expected fix: Handle missing config at per-feature boundary with typed 503/configure message; ensure other unrelated routes remain functional.

## G2-2-001-061 [P1] MISSING facet F19
- Files: (none, new feature)
- Legacy: LG:39,92-103 10s connect and 20s GET timeout; LG:73-74 refuses truncated GitHub tree
- Expected fix: Port bounded GitHub timeouts/pagination failure diagnostics.

## G2-20-024-017 [P1] GAP facet F14
- Files: (none, new feature)
- Legacy: Legacy stores URL/key, not upload binary `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentImageController.java:62-90`
- Expected fix: Implement authorized upload/grant/read lifecycle

## G2-20-008-025 [P1] GAP facet F04
- Files: src/app/universities/page.tsx
- Legacy: Legacy page title 'For Universities — 42 LMS', DESC and full JSON-LD; `docs/legacy-source/frontend/src/pages/universities.js:5-30,34`
- Expected fix: Restore full SEO schema coverage with truthful current content.

## G2-20-008-026 [P1] MISSING facet F04
- Files: src/app/universities/page.tsx
- Legacy: Canonical 'https://42lms.com/universities'; `docs/legacy-source/frontend/src/components/marketing/MarketingLayout.jsx:59-73`, `docs/legacy-source/frontend/src/pages/universities.js:34`
- Expected fix: Add canonical in Next Metadata and verify real tenant host strategy.

## G2-20-008-029 [P1] MISSING facet F04
- Files: src/app/universities/page.tsx, src/components/marketing/marketing-layout.tsx
- Legacy: Per-route WebPage/BreadcrumbList JSON-LD plus Organization/WebSite shared graph; `docs/legacy-source/frontend/src/pages/universities.js:8-30`, `docs/legacy-source/frontend/src/components/marketing/MarketingLayout.jsx:12-49,96-105`
- Expected fix: Add page and organization graphs with proper @ids, breadcrumb names and published URL.

## G2-3-021-001 [P1] GAP facet F01
- Files: src/app/api/tracker/issues/[publicId]/route.ts, src/modules/bug-tracker/admin-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicBugTrackerController.java:58-62`, `docs/legacy-source/frontend/src/pages/tracker/issues/[issueId].js:45-52`
- Expected fix: Legacy public activity GET by issue publicId is readable on issue detail, while vNext issue activity fetch requires super-admin. Add a privacy-filtered, authenticated reporter-owned history read without making engineering notes public.

## G2-3-021-021 [P1] GAP facet F11
- Files: src/app/api/tracker/issues/[publicId]/route.ts, src/modules/bug-tracker/reporter-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicBugTrackerController.java:54-62`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminBugTrackerController.java:75-80`
- Expected fix: Legacy public issue activity route had anonymous read access, vNext restricts engineering history to super-admin. Define safe public/reporter exposure; never leak private root cause, evidence or actor IDs.

## G2-3-012-008 [P1] GAP facet F04
- Files: src/modules/operations/outbound-delivery-contract.ts, src/modules/messaging/providers.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:34-36`, `112-121`
- Expected fix: Seven legacy job event keys map to one approved job SMS; vNext outbound contract keys only recruiter invitation/reminder and campaign guard. Register job-event intents.

## G2-3-012-019 [P1] MISSING facet F08
- Files: src/modules/notifications/exotel-sms.ts, src/modules/messaging/providers.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:183-204`
- Expected fix: Legacy persists every attempted send as SENT/FAILED with provider id/error, vNext logs OTP acceptance/failure only to structured logger and generic provider returns boolean. Persist privacy-safe support audit.

## G2-3-012-031 [P1] MISSING facet F12
- Files: src/modules/operations/outbound-delivery-contract.ts, src/modules/messaging/providers.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:34-39`, `95-120`
- Expected fix: Legacy single job-update TRAI body covers seven events; vNext no active matching approved job template key/content in notification provider. Register after DLT verification.

## G2-3-020-046 [P1] MISSING facet F23
- Files: src/components/college/college-faculty-assignment-actions.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyCourseAssociationServiceImpl.java:77-96`
- Expected fix: Bulk associating multiple faculty each with multiple courses in one operation is not evidenced in current vNext college creator; restore multi-faculty bulk parity or document approved scope reduction.

## G2-11-022-010 [P1] GAP facet F02
- Files: src/app/(authenticated)/tpo/reports/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:62-74`
- Expected fix: Primary interactive placement journey moved below gallery into closed disclosure and replaced with ordinary metric link boxes. Restore above cards and interactive gaps.

## G2-3-026-016 [P1] MISSING facet F04
- Files: src/modules/placements/public-recruiter-invite-accept-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:241-245`
- Expected fix: Legacy PENDING_HR includes collegeName and signInEmail for existing account; vNext can only report JOINED and active college grant.

## G2-3-026-039 [P1] GAP facet F10
- Files: src/modules/placements/public-recruiter-invite-accept-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:219-245`
- Expected fix: Existing recruiter account without current college access must become pending until signed-in recruiter accepts, not receive immediate ACTIVE grant.

## G2-3-026-040 [P1] GAP facet F10
- Files: src/modules/placements/public-recruiter-invite-accept-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:270-280`
- Expected fix: Legacy attaches review drive and emails recruiter-welcome only for brand-new recruiter; vNext acceptance writes activity and notifications but lacks these side effects.

## G2-3-026-046 [P1] GAP facet F11
- Files: src/modules/placements/public-recruiter-invite-accept-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:185-187`
- Expected fix: Legacy rejects suspended/deleted existing recruiter and requires consent for new college; vNext checks ACTIVE user/profile/company with different grant policy; close exact consent/role matrix.

## G2-3-026-058 [P1] MISSING facet F15
- Files: src/modules/placements/public-recruiter-invite-accept-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:277-280`
- Expected fix: Restore recruiter-welcome one-time email after successful new account activation or write explicit omission decision.

## G2-4-005-018 [P1] GAP facet F06
- Files: src/components/college/college-faculty-assignment-actions.tsx
- Legacy: Semester Select required with Select a semester error. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:432-440`)
- Expected fix: Require exact semester selection.

## G2-4-005-019 [P1] GAP facet F06
- Files: src/components/college/college-faculty-assignment-actions.tsx
- Legacy: Academic year AutoComplete accepts YYYY, YYYY-YY or YYYY-YYYY, with 27 suggestions. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:27-39;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:443-446`)
- Expected fix: Allow custom historic/future year.
