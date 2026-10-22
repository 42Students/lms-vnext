# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-2-001-028 [P1] GAP facet F07
- Files: (none, new feature)
- Legacy: LS:176-179 Write a comment on blank
- Expected fix: Allow 1-4000 comment characters and return Write a comment for whitespace-only.

## G2-2-003-027 [P1] MISSING facet F15
- Files: (none, new feature)
- Legacy: LE:10-36 19 events; LR:52-59 six email-enabled events
- Expected fix: Implement reviewed registry of each legacy event, channel and template binding; add channel tests.

## G2-20-012-024 [P1] GAP facet F12
- Files: src/modules/placements/eligibility-service.ts
- Legacy: Visibility ignores skills/GPA/degree/specialization `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/JobService.java:49-56`
- Expected fix: Separate visibility from eligibility screening, do not silently hide low-score jobs

## G2-20-010-008 [P1] GAP facet F03
- Files: src/modules/placements/recruiter-message-email-dispatch-service.ts
- Legacy: Recruiter first_name used as email greeting `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:63-65,106-109`
- Expected fix: Select safely escaped recruiter first name; neutral fallback if absent

## G2-20-010-015 [P1] GAP facet F05
- Files: src/modules/placements/recruiter-message-email-dispatch-service.ts
- Legacy: Only new unread TPO MESSAGE rows after previous recruiter_emailed_at qualify `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:65-71`
- Expected fix: Exclude already-emailed messages from due query using lastNotifiedMessageId or creation time

## G2-20-010-019 [P1] GAP facet F07
- Files: src/modules/placements/recruiter-message-email-dispatch-service.ts
- Legacy: Absent Zepto template skips emailUnread without exception `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:77-79`
- Expected fix: Make disabled state visible to operations and provision complete dependencies

## G2-20-010-034 [P1] GAP facet F12
- Files: src/modules/placements/recruiter-message-email-dispatch-service.ts
- Legacy: Only never-notified messages since last email are eligible `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:66-70`
- Expected fix: Scope unread window to newly unnotified messages

## G2-20-010-052 [P1] GAP facet F21
- Files: src/modules/placements/recruiter-message-email-dispatch-service.ts
- Legacy: Legacy mails if template configured and grants active `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:72-79`
- Expected fix: Add deployment readiness check/alert and test delivery before release

## G2-20-010-055 [P1] GAP facet F23
- Files: src/modules/placements/recruiter-message-email-dispatch-service.ts
- Legacy: Original email after configured mail template is active; no separate bridge toggle `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:77-79`
- Expected fix: Close operational dependency and document new opt-in

## G2-3-001-038 [P1] GAP facet F07
- Files: src/app/(authenticated)/college/quizzes/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:582-593`
- Expected fix: Add recoverable server list-load failure with `Quizzes could not be loaded` + Retry; current Next server throw surfaces route error rather than last-data refresh.

## G2-3-019-012 [P1] GAP facet F05
- Files: src/components/placements/learner-jobs-browse.tsx
- Legacy: `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:542-543`, `675-678`
- Expected fix: Legacy Saved count includes retained archived/expired bookmarked jobs, vNext savedSummary computes only current visible intersection and displays `Saved (N)` truncated. Include historical authorized count and Expired section.

## G2-3-019-044 [P1] MISSING facet F23
- Files: src/components/placements/learner-jobs-browse.tsx
- Legacy: `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:519-543`
- Expected fix: Legacy Saved tab's central contract — bookmarked closed/expired drives remain visible until unsaved — is not implemented in vNext despite a persisted saved record. Restore or record owner-approved removal.

## G2-4-004-068 [P1] GAP facet F13
- Files: src/app/(authenticated)/college/assignments/page.tsx
- Legacy: List load error `Assignments could not be loaded` + Retry; stale fetch response guarded by token. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:263-287; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:421-425`)
- Expected fix: Add dedicated list fetch error boundary with retry and empty old rows instead of generic error.

## G2-13-030-001 [P1] MISSING facet F01
- Files: src/components/placements/college-interview-appointments.tsx, src/modules/placements/result-service.ts
- Legacy: Legacy Super Admin placements JobApplications opens InterviewFeedbackForm for selected interview `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:8-16`
- Expected fix: Add dedicated Feedback entry on completed round for authorized staff.

## G2-4-026-016 [P1] GAP facet F04
- Files: src/modules/placements/public-page/read-service.ts
- Legacy: Offers statuses RELEASED/ACCEPTED and created_at last 12 months (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:91-99`)
- Expected fix: Reconcile migrated status/date semantics and legacy job inclusion.

## G2-4-026-017 [P1] GAP facet F04
- Files: src/modules/placements/public-page/read-service.ts
- Legacy: Placed counts ACCEPTED distinct learners (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:93-97`)
- Expected fix: Decide if public metric always means accepted or follows policy; label disclosure clearly.

## G2-4-026-018 [P1] GAP facet F04
- Files: src/modules/placements/public-page/read-service.ts
- Legacy: Companies count accepted hiring companies only (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:93-99`)
- Expected fix: Match accepted-company count and canonical company identity.

## G2-4-026-021 [P1] GAP facet F04
- Files: src/modules/placements/public-page/read-service.ts
- Legacy: Students computed live via PlacementEligibilityService ELIGIBLE rows (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:88-89`)
- Expected fix: Refresh qualifying population from current eligibility or publish clear snapshot semantics.

## G2-4-026-025 [P1] GAP facet F06
- Files: src/components/placements/public-recruit-from-us.tsx
- Legacy: Company optional (no required rule) (`docs/legacy-source/frontend/src/pages/placements/index.js:94-95`)
- Expected fix: Make company optional unless product decision explicitly changed.

## G2-4-026-054 [P1] GAP facet F12
- Files: src/modules/placements/public-page/read-service.ts
- Legacy: Offers REL/ACC counted, companies accepted only (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:93-99`)
- Expected fix: Specify cross-version offer status and company identities to match business rules.

## G2-4-026-089 [P1] GAP facet F23
- Files: src/components/placements/public-recruit-from-us.tsx
- Legacy: Company optional, code autofill, note1000 (`docs/legacy-source/frontend/src/pages/placements/index.js:89-108`)
- Expected fix: Restore 3 distinct legacy form contracts; retain resend only with documented approval.

## G2-4-013-001 [P1] GAP facet F01
- Files: src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx
- Legacy: Route /teacher/report/assignment/[contentId] loads AssignmentReportContent from client page. (`docs/legacy-source/frontend/src/pages/teacher/report/assignment/[contentId].js:1-7`; `docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:29-36`)
- Expected fix: Keep deep links working for authorized report IDs; resolve shared offering section explicitly.

## G2-4-028-060 [P1] GAP facet F23
- Files: src/app/(authenticated)/tpo/team/page.tsx
- Legacy: Legacy URL aliases and rest params have precise contract (`docs/legacy-source/frontend/src/pages/tpo/team.js:7-9`)
- Expected fix: Add old-bookmark compatibility cases.

## G2-5-002-002 [P1] GAP facet F01 Purpose/entry/navigation
- Files: src/components/placements/placement-calendar-workspace.tsx
- Legacy: View applications uses job ID plus college context and specific interview application ID callback. (docs/legacy-source/frontend/src/pages/college-admin/calendar.js:22-28; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:624-632)
- Expected fix: Propagate applicationId to applicants route, scroll/focus matching student.

## G2-5-002-004 [P1] GAP facet F02 Layout/section order
- Files: src/components/placements/placement-calendar-workspace.tsx, src/app/(authenticated)/college/placements/interviews/page.tsx
- Legacy: One Interviews page with header, Refresh, four metrics, toolbar, desktop table/mobile cards. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:750-777; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:779-1049)
- Expected fix: Unify legacy list elements on obvious Interviews route, preserve optional new calendar tab.

## Lane 9 verification disposition (2026-10-22)

- DEFERRED — G2-2-001-028: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-2-003-027: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-20-012-024: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-20-010-008: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-20-010-015: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-20-010-019: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-20-010-034: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-20-010-052: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-20-010-055: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-3-001-038: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-3-019-012: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-3-019-044: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-4-004-068: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-13-030-001: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-4-026-016: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-4-026-017: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-4-026-018: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-4-026-021: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-4-026-025: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-4-026-054: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-4-026-089: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-4-013-001: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-4-028-060: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-5-002-002: Not independently verified against all cited behavior; implementation and regression check remain open.
- DEFERRED — G2-5-002-004: Not independently verified against all cited behavior; implementation and regression check remain open.
