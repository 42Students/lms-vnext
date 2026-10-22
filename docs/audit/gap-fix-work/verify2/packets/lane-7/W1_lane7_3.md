# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-14-016-035 [P1] GAP facet F11
- Files: src/modules/placements/recruiter-profile-service.ts, src/modules/placements/recruiter-grant-expiry-policy.ts
- Legacy: Legacy check requires usable recruiter, live college, active grant and capability `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterAccessService.java:39-85`
- Expected fix: Reconcile all role, tenant, company and verification rules in auth matrix

## G2-14-019-031 [P1] GAP facet F08
- Files: src/modules/placements/tpo-interview-slot-service.ts
- Legacy: Legacy interview notifications are sent after commit `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:146-167`
- Expected fix: Preserve after-commit email/SMS expectations with outbox

## G2-14-019-040 [P1] GAP facet F11
- Files: src/modules/placements/tpo-interview-slot-service.ts
- Legacy: Legacy college admins may manage interview scoped by job college, shared org fallback `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/InterviewRepository.java:38-55`
- Expected fix: Support approved shared-org history via acting-college gate

## G2-14-019-051 [P1] GAP facet F15
- Files: src/modules/placements/tpo-interview-slot-service.ts
- Legacy: Legacy JobNotificationHelper and event publisher after commit `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:117-166`
- Expected fix: Map legacy email/SMS recipients/timing to outbox delivery

## G2-14-019-061 [P1] GAP facet F20
- Files: src/modules/placements/tpo-interview-slot-service.ts, src/modules/placements/hr-interview-slot-service.ts
- Legacy: Legacy application and learner locks serialize concurrent scheduling `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:185-256` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/InterviewRepository.java:111-129`
- Expected fix: Define lock order round/app/learner to eliminate cross-drive conflict

## G2-14-019-064 [P1] GAP facet F21
- Files: src/modules/placements/tpo-interview-slot-service.ts, src/modules/placements/hr-interview-slot-service.ts
- Legacy: Legacy interview notification dispatcher, event publisher, scheduler reminders `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:117-166`
- Expected fix: Map scheduled reminders/third-party email templates

## G2-18-031-077 [P1] GAP facet F21
- Files: src/modules/people/identity-provisioning.ts, src/db/schema/identity-device-sessions.ts
- Legacy: Legacy signup/login uses SmsService/test OTP and session token version; LearnerController.java:338-391,674-800;FacultyController.java:421-480;AdminUserLifecycleController.java:178-198
- Expected fix: Verify provider SMS delivery, identity collision, session revocation timing and no wrong-college session leak

## G2-20-031-011 [P1] MISSING facet F03
- [ ] Partial: secure six-digit Open form, conditional Email me a code instead, CSV download implemented; bulk resume ZIP intentionally retired, so ZIP parity requires product approval.
- Files: src/app/company-share/[token]/page.tsx
- Legacy: Legacy share password card has six-digit input, Open, optional 'Email me a code instead', ZIP and CSV buttons `company-share/[token].js:145-162`.
- Expected fix: Implement parity for resend code and ZIP resume archive only if backed by supported vNext service; otherwise explicitly mark migration decision and disable unavailable control.

## G2-20-031-024 [P1] MISSING facet F08
- [x] Verified: optional authorized recruiter code email POST has distinct SENT, TOO_SOON (429 Retry-After 60), LIMITED (429 Retry-After 3600), and UNAVAILABLE (503) feedback; emailed challenge expires after 15 minutes.
- Files: src/app/company-share/[token]/page.tsx
- Legacy: Legacy share `sendShareCode` distinguishes SENT, TOO_SOON, LIMIT with 15-min/1-min copy `company-share/[token].js:85-100`.
- Expected fix: Restore bounded resend-code path and differentiated transient/toast outcomes if vNext backend supports it.

## G2-20-031-027 [P1] GAP facet F10
- Files: src/app/company-share/[token]/page.tsx
- Legacy: Legacy share GET /api/v1/public/share/{token}, POST /open, /send-code, /resumes, /downloaded `PublicShareController.java:17-57`.
- Expected fix: Map every legacy share action to new server action; verify access logging, resend and ZIP beyond CSV; preserve token confidentiality.

## G2-20-031-036 [P1] MISSING facet F14
- [ ] Partial: CSV export uses scoped server endpoint, and legacy ZIP is explicitly retired for per-file audit and malware-scan reasons; historical ZIP parity is not restored.
- Files: src/app/company-share/[token]/page.tsx
- Legacy: Legacy public share downloads CSV client-side and resumes ZIP with action logging `company-share/[token].js:106-125,156-160`.
- Expected fix: Expose ZIP if still supported or document product omission; audit export headers, filename, safeHref and download logs.

## G2-15-004-025 [P1] GAP facet F05
- Files: (none, new feature)
- Legacy: Archived last; unrelated projects retain backend order; Team N natural order only within same series (ProjectsContent.jsx:130-152; projectListOrdering.js:1-18)
- Expected fix: Reuse legacy numberedTeamTitle series guard and stable base ordering

## G2-15-006-014 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: Legacy course title fallback `Course name unavailable` yet still can open valid id (courseListingUtils.js:97-106; courseHref:7-15)
- Expected fix: Preserve fallback-title but valid-ID navigability where authorized, mark corrupt record separately

## G2-15-008-040 [P1] GAP facet F11
- Files: (none, new feature)
- Legacy: Legacy item availability `learnerChildAvailability` hides non-visible and locks non-actionable (syllabusDetail.js:390-404,463-466)
- Expected fix: Compare active/enabled/locked/prerequisites and same hidden vs disabled semantics

## G2-16-004-045 [P1] GAP facet F11
- Files: src/app/(authenticated)/tracker/issues/page.tsx
- Legacy: `issues/index.js:227-235`; `PublicBugTrackerController.java:15-47`: public list by default, any visitor may inspect reported issues.
- Expected fix: Define privacy-safe reporter list (at least public redacted subset), retain private engineering separation.

## G2-16-023-011 [P1] GAP facet F04
- Files: src/app/(authenticated)/learn/my-placements/placement/page.tsx
- Legacy: LearnerPlacementService.java:47-48 debarment id,reason,untilDate,untilDrives.
- Expected fix: Load active debarments as distinct authoritative data source.

## G2-17-012-020 [P1] GAP facet F06
- [x] Verified: screening decision saves candidate/internal rejection reason in the screening record and history; event metadata includes rejectionReason, assessmentUrl, and candidateNotificationPolicy.
- Files: src/modules/placements/screening-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/PlacementJobService.java:114-117 — Rejection requires optional rejectionReason and assessmentUrl.
- Expected fix: Map rejection reason/assessment URL and notification policy.

## G2-17-012-022 [P1] GAP facet F07
- Files: src/modules/placements/screening-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:485-494 — Changing screeningVersion after first application is rejected.
- Expected fix: Preserve screening schema version freeze after applications.

## G2-17-022-029 [P1] GAP facet F12
- Files: src/app/(authenticated)/tpo/settings/public-page/page.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:29-32 — K-anonymity MIN_GROUP=5 for students/offers.
- Expected fix: Distinguish cohort threshold from per-stat suppression.

## G2-18-011-039 [P1] GAP facet F10
- [x] Verified: legacy posting schema accepts importantDates date or at, preserves both type and dateType, converts date-only strings with IST offset, and ICS export retains classification.
- Files: src/modules/placements/placement-legacy-posting-model.ts
- Legacy: Legacy important dates from Job.importantDates JSON keys label/date/type/dateType (`JobServiceImpl.java:1545-1572`).
- Expected fix: Read/convert old JSON schema, do not drop date classification or UTC.

## G2-18-010-036 [P1] GAP facet F10
- [x] Verified intentional hardening: production sends valid recipients; nonproduction deny-by-default unless the exact email/phone appears in configured AUTH_TEST_EMAILS/PHONES, rejecting legacy domain-wide DEV_MAIL_ALLOW permissiveness.
- Files: src/modules/messaging/runtime-safety.ts
- Legacy: Legacy configurable STAGE/DEV_MAIL_ALLOW controls dispatch (`TpoMailService.java:55-61,203-220`).
- Expected fix: Reconcile environment variables and test nonprod deny-by-default across all sender paths.

## G2-18-004-014 [P1] GAP facet F03
- Files: src/modules/activity/learner-notification-inbox-model.ts, src/components/activity/learner-notifications-inbox.tsx
- Legacy: Legacy detail modal CTA `Take Assessment`, `Interview Schedule`, `View Application`, `View Course` based on type. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:65-110`, `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:712-735`
- Expected fix: Map legacy job/interview/course/assessment targets to safe new route and explicit external consent.

## G2-18-004-025 [P1] GAP facet F05
- [x] Verified: notifications page accepts legacy ?tab=all/course/project/general/job, normalizes and redirects to canonical category after persisted learner authorization.
- Files: src/app/(authenticated)/learn/notifications/page.tsx, src/modules/activity/learner-notification-inbox-model.ts
- Legacy: Legacy filter persists as `?tab` across refresh. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:532-559`
- Expected fix: Support tab alias and normalized redirect.

## G2-19-003-004 [P1] GAP facet F02
- Files: src/app/(authenticated)/admin/course-progress/page.tsx, src/app/(authenticated)/admin/course-progress/students/page.tsx
- Legacy: Title then measured-work warning, class/course controls, four stats, per-student table `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:231-388`
- Expected fix: Restore original screen section order and combined report.

## G2-19-017-044 [P1] GAP facet F19
- Files: (none, new feature)
- Legacy: Legacy byProjectAndMeetingKey query unbounded `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectMeetingHistoryRepository.java:23-24`
- Expected fix: Index by (project_id,meeting_key,created_at DESC,id DESC) and enforce pagination.
