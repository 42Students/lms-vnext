# Verification packet (P1 sample): 5 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-8-023-053 [P1] GAP facet F15
- Files: (none, new feature)
- Legacy: Legacy bulk move/reject holds status-changed notices until Undo window ends (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:140-147,154-175).
- Expected fix: Implement held-notice grace and Undo or warn that notices may immediately deliver.

## G2-9-008-033 [P1] GAP facet F07
- Files: src/components/placements/college-hiring-funnel.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:553-555` — Company report failure shows dedicated inline error Alert
- Expected fix: Handle company report failure separately

## G2-9-013-093 [P1] MISSING facet F20
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:643-658` — Free-typed company resets companyId if no exact case-insensitive match.
- Expected fix: Add exact-name safe link reset and scoped ID lookup.

## G2-13-025-013 [P1] GAP facet F06
- Files: src/modules/placements/recruiter-invite-otp-accept-service.ts
- Legacy: Authenticated accept requires collegeId only, no body/code `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPendingInviteController.java:20-26`
- Expected fix: Use consent-only authenticated endpoint; no second email OTP.

## G2-18-023-073 [P1] MISSING facet F23
- Files: src/modules/placements/learner-career-calendar-model.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/StudentCalendarService.java:79-94 college exam blackout dates shown even if no drives visible
- Expected fix: Fetch blackout dates independently of visible-drive list and show on empty calendar.
