# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-3-028-084 [P1] MISSING facet F23
- Files: src/modules/colleges/validation.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/CollegeDTO.java:38-55`
- Expected fix: College chair/vice chair and immediate domain edit missing from base college mutation. Map ownership to alternate settings, not silent drop.

## G2-3-014-001 [P1] GAP facet F01
- Files: src/components/shell/topbar/command-search.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchController.java:31-36`, `99-107`, `165-168`
- Expected fix: Legacy search accessible via `/api/v2/courses/search`, popular and course header autocomplete; vNext header command search loads authorized learner courses and search destinations, no v2 general search endpoint. Provide parity course search for permitted roles.

## G2-3-014-018 [P1] MISSING facet F06
- Files: src/components/shell/topbar/command-search.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchController.java:269-303`
- Expected fix: Legacy POST course selection by numeric ID or validated slug increments usage for popularity; vNext Enter/click navigates but does not invoke selection recording. Add authorized server mutation and call once per successful selection.

## G2-3-014-025 [P1] MISSING facet F10
- Files: src/components/shell/topbar/command-search.tsx, src/modules/courses/college-course-catalogue-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchController.java:269-303`, `353-362`
- Expected fix: Legacy two POST selection routes update in-memory usageCounts; POST refresh rebuilds index from DB. No corresponding vNext post-search side effects. Create authorization-checked usage store and refresh semantics.

## G2-3-014-029 [P1] GAP facet F11
- Files: src/components/shell/topbar/command-search.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchController.java:175-190`, `199-222`
- Expected fix: Legacy popular/departments check authentication and filtered college/allowed departments, vNext learner preload alone does not implement faculty/admin popular lists. Enforce tenant and actor permission.

## G2-3-014-055 [P1] MISSING facet F23
- Files: src/components/shell/topbar/command-search.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchController.java:269-303`, `353-362`
- Expected fix: Legacy course-selection usage tracking, cache refresh and popular suggestions omitted from vNext; no deliberate removal reason established. Implement or document owner-approved exclusion.

## G2-11-022-019 [P1] GAP facet F04
- Files: src/app/(authenticated)/tpo/reports/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:63-72`
- Expected fix: Legacy `acceptedUnique` is unique students accepted; vNext journey uses `acceptedOffers` offer count. Do not label unlike denominators as equivalent.

## G2-19-023-026 [P1] GAP facet F10
- Files: src/modules/placements/learner-placement-alerts-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerAnnouncementController.java:33-39`
- Expected fix: Legacy /unread counts unread placement announcements; vNext personal alert unread count from in_app_notifications separate event types.

## G2-19-023-058 [P1] MISSING facet F23
- Files: src/modules/placements/learner-placement-alerts-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerAnnouncementController.java:33-39`
- Expected fix: No exact `/unread` count for unread college placement announcements; personal alert unread is not equivalent.

## G2-4-014-022 [P1] GAP facet F05
- Files: src/app/(authenticated)/admin/colleges/page.tsx
- Legacy: Search org view getByOrganization(orgId, limit) then query filter. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:140-151`)
- Expected fix: Preserve intended matches; do not pre-limit before filtering when implementing adapter.

## G2-4-031-067 [P1] GAP facet F20
- Files: src/components/admin/college-signin-method-form.tsx
- Legacy: requestSeq cancels stale responses, busy callbacks lock parent (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:85,90-113`)
- Expected fix: Add unsaved navigation/parent drawer guard.

## G2-4-031-071 [P1] GAP facet F21
- Files: src/modules/colleges/public-signin-policy-service.ts
- Legacy: Mobile auth consults branding login_methods at tenant host (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:425-447`)
- Expected fix: Verify new auth handler uses effectiveCollegeSignInMethod for every OTP path.

## G2-13-030-002 [P1] GAP facet F01
- Files: src/modules/placements/result-service.ts
- Legacy: Component requires interview prop and onSuccess/onCancel callbacks `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:8-19`
- Expected fix: Define legacy interview-to-round+application+slot mapping.

## G2-13-030-025 [P1] GAP facet F10
- Files: src/modules/placements/result-service.ts
- Legacy: POST /api/v1/interviews/{id}/feedback, rating/comments/recommendAction `docs/legacy-source/frontend/src/api/Services/interviewService.js:161-166`
- Expected fix: Add mapped feedback action and restrict per-round candidate ownership.

## G2-13-030-026 [P1] GAP facet F10
- Files: src/modules/placements/result-service.ts
- Legacy: HIRE automatically moves application to OFFERED; REJECT to REJECTED when in INTERVIEW `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:1270-1335`
- Expected fix: Explicitly handle HIRE as offer workflow and REJECT as candidate decision with safe confirmation.

## G2-13-030-036 [P1] GAP facet F15
- Files: src/modules/placements/result-service.ts
- Legacy: UI warns Hire/Reject will notify candidate `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:138-143`
- Expected fix: Update confirmation text to precise stage/apply timing and notification channel.

## G2-13-030-044 [P1] GAP facet F21
- Files: src/modules/placements/result-service.ts
- Legacy: Legacy email/SMS status notification deferred until after commit `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:1377-1393`
- Expected fix: Define post-commit notification/worker delivery and no duplicate events.

## G2-4-028-007 [P1] MISSING facet F02
- Files: src/app/(authenticated)/tpo/messages/page.tsx
- Legacy: Canonical Messages contains Recruiters and Team tablist (`docs/legacy-source/frontend/src/pages/tpo/messages.js:40-68`)
- Expected fix: Add team tab and component to Messages.

## G2-13-031-090 [P1] GAP facet F04
- Files: src/app/(authenticated)/tpo/reports/failure-reasons/page.tsx
- Legacy: Legacy failure share denominator per applied round/branch result set. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoInsightsService.java:645-655`
- Expected fix: Restore applied-result denominator and absent reason.

## G2-5-005-005 [P1] GAP facet F02 Layout/section order
- Files: src/app/(authenticated)/hr/calendar/page.tsx
- Legacy: Only days with events rendered as compact AntD Cards in agenda (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:92-124)
- Expected fix: Default to seven-day nonempty-day agenda at all widths; move grid to optional mode.

## G2-5-006-044 [P1] GAP facet F12 Business rules
- Files: src/components/admin/super-admin-attendance-settings-editor.tsx
- Legacy: App_setting override badges and reset distinction (docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:128-169)
- Expected fix: Project effective source (global/org/college) and show default vs custom.

## G2-5-007-028 [P1] GAP facet F07 Validation/errors
- Files: src/app/(authenticated)/admin/placements/interviews/page.tsx
- Legacy: GET failure shows closable warning, stale rows remain with Retry (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:148-180; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:779-789)
- Expected fix: Catch partial failures, retain same-scope rows and show Retry.

## G2-5-009-037 [P1] GAP facet F09 Modals/drawers
- Files: (none, new feature)
- Legacy: If absent only Mark present; else Mark absent with reason Radio.Group (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:265-275)
- Expected fix: Match single available action and default reason per current state.

## G2-5-011-030 [P1] GAP facet F08
- Files: src/app/(authenticated)/teacher/calendar/error.tsx
- Legacy: Course-load warning headline `Failed to load course data` and description `Calendar events may be incomplete...` (`docs/legacy-source/frontend/src/components/CalendarComp/ClassScheduleContent.jsx:387-397`)
- Expected fix: Support partial calendar rendering and exact dismissible warning.

## G2-5-024-002 [P1] MISSING facet F01
- Files: src/modules/colleges/admin-tenant-setup-journey.ts, src/modules/tenant-domains/service.ts
- Legacy: Global-only `GET /onboarding/resolve-preview?host` returns tenant, canonical host and redirect preview. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:273-313`
- Expected fix: Implement read-only global-admin resolve preview without DNS fetch.

## Fast verification triage (2026-10-22)

- G2-3-028-084: DEFERRED — requires scoped implementation and integration evidence; no parity claim made.
- G2-3-014-001: DEFERRED — requires scoped implementation and integration evidence; no parity claim made.
- G2-3-014-018: DEFERRED — requires scoped implementation and integration evidence; no parity claim made.
- G2-3-014-025: DEFERRED — requires scoped implementation and integration evidence; no parity claim made.
- G2-3-014-029: DEFERRED — requires scoped implementation and integration evidence; no parity claim made.
- G2-3-014-055: DEFERRED — requires scoped implementation and integration evidence; no parity claim made.
- G2-11-022-019: DEFERRED — requires scoped implementation and integration evidence; no parity claim made.
- G2-19-023-026: DEFERRED — requires scoped implementation and integration evidence; no parity claim made.
- G2-19-023-058: DEFERRED — requires scoped implementation and integration evidence; no parity claim made.
- G2-4-014-022: DEFERRED — requires scoped implementation and integration evidence; no parity claim made.
- G2-4-031-067: DEFERRED — requires scoped implementation and integration evidence; no parity claim made.
- G2-4-031-071: DEFERRED — requires scoped implementation and integration evidence; no parity claim made.
- G2-13-030-002: DEFERRED — requires scoped implementation and integration evidence; no parity claim made.
- G2-13-030-025: DEFERRED — requires scoped implementation and integration evidence; no parity claim made.
- G2-13-030-026: DEFERRED — requires scoped implementation and integration evidence; no parity claim made.
- G2-13-030-036: DEFERRED — requires scoped implementation and integration evidence; no parity claim made.
- G2-13-030-044: DEFERRED — requires scoped implementation and integration evidence; no parity claim made.
- G2-4-028-007: DEFERRED — requires scoped implementation and integration evidence; no parity claim made.
- G2-13-031-090: DEFERRED — requires scoped implementation and integration evidence; no parity claim made.
- G2-5-005-005: DEFERRED — requires scoped implementation and integration evidence; no parity claim made.
- G2-5-006-044: DEFERRED — requires scoped implementation and integration evidence; no parity claim made.
- G2-5-007-028: DEFERRED — requires scoped implementation and integration evidence; no parity claim made.
- G2-5-009-037: DEFERRED — requires scoped implementation and integration evidence; no parity claim made.
- G2-5-011-030: DEFERRED — requires scoped implementation and integration evidence; no parity claim made.
- G2-5-024-002: DEFERRED — requires scoped implementation and integration evidence; no parity claim made.
