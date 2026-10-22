# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-2-013-020 [P1] GAP facet F11
- Files: (none, new feature)
- Legacy: LC:67-72 requireAccessCollege for authorized principal; access differs from admin mutations
- Expected fix: Allow permitted scoped Super Admin reader equivalent under selected acting-college context.

## G2-2-014-046 [P1] GAP facet F21
- Files: (none, new feature)
- Legacy: LC:49 CourseService updateCourse path
- Expected fix: Wire proper course write service with per-item scope and audit.

## G2-2-023-001 [P1] MISSING facet F01
- Files: src/app/(authenticated)/admin/organizations/page.tsx
- Legacy: AdminRecycleBinController.java:54-59 exposes /api/v1/admin/recycle-bin
- Expected fix: Add centralized admin recycle-bin discovery page/route.

## G2-2-030-038 [P1] GAP facet F12
- Files: src/modules/placements/tpo-after-college-model.ts
- Legacy: ChoicesController.java:28 registration intent is not same as placement outcome.
- Expected fix: Keep separate schemas for registration choice vs after-college outcome; never infer placed from registering.

## G2-2-001-005 [P1] MISSING facet F03
- Files: (none, new feature)
- Legacy: LF:117 Sync now with rotating SyncOutlined and loading
- Expected fix: Add guarded POST sync route/button with loading; surface run outcome.

## G2-2-003-004 [P1] MISSING facet F04
- Files: (none, new feature)
- Legacy: LE:10-36 19 event enum entries with 19 template keys
- Expected fix: Introduce audited typed event-to-template lookup and channel matrix for 19 legacy events.

## G2-20-005-027 [P1] GAP facet F04
- Files: src/app/home/page.tsx
- Legacy: SoftwareApplication structured data has @id #software, BusinessApplication and EducationalApplication categories, description, publisher, isAccessibleForFree=false; `docs/legacy-source/frontend/src/pages/home.js:13-26`
- Expected fix: Restore structured-data coverage with current truthful product metadata (URL, ID, publisher, description, accessibility flag).

## G2-20-030-007 [P1] MISSING facet F02
- Files: src/app/(authenticated)/teacher/profile/page.tsx
- Legacy: Top user info card precedes completeness and fields (`docs/legacy-source/frontend/src/components/profile/about.js:915-935`)
- Expected fix: Add identity/avatar card and completeness indicator before sections

## G2-3-015-024 [P1] MISSING facet F10
- Files: src/modules/placements/scope.ts, src/db/schema/placements.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:160-171`
- Expected fix: Legacy reassignOrganizationForCollege updates denormalized orgId on jobs and increments version; vNext jobs store collegeId only and derive org through college; no reassign job mutation needed but ensure tenants follow college reassignment atomically.

## G2-11-028-070 [P1] MISSING facet F23
- Files: src/app/(authenticated)/admin/projects/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:145-209`
- Expected fix: No dedicated Deleted workspaces page and no navigation entry on vNext; Archived status filter is only a related, non-equivalent lifecycle.

## G2-4-031-076 [P1] GAP facet F23
- Files: src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx
- Legacy: Sign-in tab protects parent Manage College drawer dirty state (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:78-89`)
- Expected fix: Provide leave guard and maintain tab identity.

## G2-12-010-005 [P1] GAP facet F04
- Files: src/modules/placements/learner-placement-event-copy.ts
- Legacy: Variables learnerName, jobTitle, companyName, status, applicationId, jobId `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:146-154`
- Expected fix: Persist event metadata for job/company/application IDs and reconstruct safe named messages.

## G2-12-010-008 [P1] GAP facet F04
- Files: src/modules/placements/learner-placement-event-copy.ts
- Legacy: Assessment URL per-application overrides job default `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:165-174`
- Expected fix: Preserve sanitized assessment link in invitation with ownership check.

## G2-12-010-019 [P1] GAP facet F10
- Files: src/modules/placements/learner-placement-event-copy.ts
- Legacy: INTERVIEW/REJECTED/SHORTLISTED/ASSESSMENT/OFFERED/HIRED/WAITLISTED accepted; unknown statuses silent `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:94-119`
- Expected fix: Map each state (including waitlisted, offered, hired) to distinct registry-equivalent notification copy.

## G2-12-010-025 [P1] GAP facet F12
- Files: src/modules/placements/learner-placement-event-copy.ts
- Legacy: Offer/hired both mapped to distinct JOB_OFFER_EXTENDED and JOB_HIRED `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:245-256`
- Expected fix: Map offer acceptance vs hired meaning, never treat as synonyms.

## G2-12-010-046 [P1] MISSING facet F23
- Files: src/modules/placements/learner-placement-event-copy.ts
- Legacy: Legacy enriches assessment URL, interview venue and rejection reason `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:165-179`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:195-238`
- Expected fix: Implement safe per-event deep-link and metadata model with consent and context.

## G2-4-013-031 [P1] GAP facet F06
- Files: src/modules/courses/faculty-report-completeness.ts, src/components/courses/faculty-report-download.tsx
- Legacy: Legacy incomplete PDF confirmation shown only on failed class roster. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:114-126`)
- Expected fix: Separate data-integrity incomplete from legitimate in-progress ungraded roster.

## G2-4-022-042 [P1] GAP facet F11
- Files: src/components/tpo/tpo-roster-verification-bulk.tsx
- Legacy: Legacy verify obtains verifier college from current principal. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:171-180`)
- Expected fix: Ensure role-based profile-verifier permissions and no mixed-college list.

## G2-4-028-020 [P1] MISSING facet F06
- Files: src/app/(authenticated)/tpo/settings/team/page.tsx
- Legacy: Admin searches faculty directory to add (`docs/legacy-source/frontend/src/components/tpo/team/TeamPeople.jsx:89-92`)
- Expected fix: Reintroduce add search field.

## G2-18-029-059 [P1] GAP facet F22
- Files: src/app/(authenticated)/admin/semesters/page.tsx
- Legacy: Legacy integer term ID, program_id, number, active and mapped credits from course array. `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:326-394`
- Expected fix: Map numeric IDs and active terms.

## G2-5-002-036 [P1] GAP facet F10 Actions/side effects
- Files: src/modules/placements/placement-calendar-service.ts, src/modules/placements/college-interview-directory-service.ts
- Legacy: GET /api/v1/interviews lists appointment rows across a token-scoped college or org. (docs/legacy-source/frontend/src/api/Services/interviewService.js:25-40; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/InterviewController.java:333-385)
- Expected fix: Build appointment-level source including historical states; reconcile data model.

## G2-5-005-042 [P1] GAP facet F12 Business rules
- Files: (none, new feature)
- Legacy: Only nonempty days show, slots folded into round (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:96-123)
- Expected fix: Use day agenda with folded slots for default week.

## G2-5-007-068 [P1] GAP facet F22 Data/migrations
- Files: (none, new feature)
- Legacy: Interview entity has candidate/jobApplication, interviewer, subtype, status, duration/version (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:31-93)
- Expected fix: Create mapping to appointment-level table or join slots/applications.

## G2-5-009-051 [P1] GAP facet F13 States
- Files: (none, new feature)
- Legacy: Loading monthly attendance 8x8 skeleton, refreshing status, last grid+Retry (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:523-538)
- Expected fix: Build loading and refreshing states retaining data.

## G2-5-026-004 [P1] GAP facet F02
- Files: src/app/(authenticated)/admin/inbound-mail/page.tsx
- Legacy: Legacy non-conversation emails appear on Super Admin Inbound mail. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:25-32`
- Expected fix: Wire same validated source to inbox list before presenting it as live.
