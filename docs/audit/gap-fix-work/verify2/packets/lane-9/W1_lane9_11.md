# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-4-010-072 [P1] GAP facet F14
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: src/components/courses/college-assessment-aggregate.tsx, src/modules/courses/college-assessment-export-model.ts
- Legacy: `Export CSV (page)` only currently displayed 20 rows, filename `assignments-college-ID-page-P.csv`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:329-341`)
- Expected fix: Offer exact current-page export with legacy columns and filename; keep full-filter export as separately labeled option.

## G2-4-010-109 [P1] GAP facet F05
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: src/components/courses/admin-assessment-read-directory.tsx
- Legacy: Course select holds `courseId`; selecting course resets class select options and page. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:403-414`)
- Expected fix: Bind searchable courseId list with dependent sectionId and automatic reset.

## G2-4-010-110 [P1] GAP facet F05
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: src/components/courses/admin-assessment-read-directory.tsx
- Legacy: Class select hidden/disabled before course and values specific classId. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:408-414`)
- Expected fix: Offer dependent actual Section picker and filter by delivery class.

## G2-4-010-119 [P1] GAP facet F09
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: src/components/courses/admin-assessment-read-directory.tsx, src/components/courses/college-assignment-review.tsx
- Legacy: Submissions action opens width760 Modal; publish all uses styled Popconfirm. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:87-156;docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:365-370`)
- Expected fix: Restore 760px review modal and accessible Popconfirm, avoid native confirm.

## G2-4-012-006 [P1] GAP facet F02
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: src/components/courses/faculty-assessment-overview.tsx
- Legacy: Clicking noninteractive part of card opens read-only assignment drawer. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:126-134`; `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:397-400`)
- Expected fix: Add keyboard-accessible row View target with safe nested button handling.

## G2-4-012-017 [P1] GAP facet F04
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: src/modules/courses/faculty-assessment-service.ts
- Legacy: Teacher fetch requests active and enabled only. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:288-295`)
- Expected fix: Separate drafts from old active listing or approve changed list visibility.

## G2-4-012-019 [P1] GAP facet F05
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: src/components/courses/faculty-assessment-overview.tsx
- Legacy: Filter by courseSlug, deduped per slug across teaching assignments. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:239-269`)
- Expected fix: Offer course-level aggregation filter rather than individual delivery.

## G2-4-012-047 [P1] GAP facet F10
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: src/modules/courses/faculty-assessment-service.ts, src/components/courses/faculty-assessment-overview.tsx
- Legacy: Legacy GET faculty list with facultyId, active/enabled, courseSlug and server page size20. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:282-322`; `docs/legacy-source/frontend/src/api/Services/courseServices.js:431-443`)
- Expected fix: Match legacy filtering and pagination or separate changed statuses.

## G2-4-012-049 [P1] GAP facet F10
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: src/components/courses/faculty-assessment-editor.tsx
- Legacy: Legacy edit posts createLessonContent with lesson_content_id and complete assignment data. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:456-491`)
- Expected fix: Support safe resource/method editing where allowed.

## G2-4-012-050 [P1] GAP facet F10
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: src/components/courses/faculty-assessment-editor.tsx, src/components/courses/faculty-assessment-lifecycle.tsx
- Legacy: Legacy delete verifies submission count then soft-deletes via enabled=false. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:441-509`)
- Expected fix: Match submission-history safeguards and user copy.

## G2-4-013-061 [P1] GAP facet F14
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: src/modules/courses/faculty-report-pdf.ts
- Legacy: Legacy PDF exports A4 styled jsPDF with teal heading, summary cards and autoTable. (`docs/legacy-source/frontend/src/utils/downloadAssignmentReportPdf.js:19-98`)
- Expected fix: Rebuild polished A4 PDF visual parity: summary strip, tables, colors and layout.

## G2-4-028-002 [P1] GAP facet F01
- Verification: OK — default Team redirect targets /tpo/messages?tab=team.
- Files: src/app/(authenticated)/tpo/team/page.tsx
- Legacy: Default and conversation tabs redirect to /tpo/messages?tab=team (`docs/legacy-source/frontend/src/pages/tpo/team.js:7-9`)
- Expected fix: Redirect default to Messages Team.

## G2-13-031-088 [P1] GAP facet F04
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: src/app/(authenticated)/tpo/reports/offers-acceptance/page.tsx
- Legacy: Legacy acceptance percent = accepted/(accepted+declined+expired), 1 decimal. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoInsightsService.java:626-635`
- Expected fix: Include expired and keep one decimal; test unanswered.

## G2-5-004-065 [P1] GAP facet F22 Models/migrations
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: (none, new feature)
- Legacy: Legacy meetingKey/date/start/end/timezone/sprintLabel embedded in project DTO (docs/legacy-source/frontend/src/api/Services/projectService.js:493-523; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ProjectWorkspaceService.java:82-84)
- Expected fix: Map legacy meeting identifiers and orphaned sprint labels in migration.

## G2-5-007-024 [P1] GAP facet F06 Forms
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: (none, new feature)
- Legacy: Status filter ALL/ACTIVE/COMPLETED/CANCELLED, Active union3 states (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:71-76)
- Expected fix: Implement Active composite from appointment statuses.

## G2-5-009-029 [P1] GAP facet F07 Validation/errors
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: (none, new feature)
- Legacy: Failed class-course verification disables unsafe course choice with Retry class courses (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:491-495)
- Expected fix: Distinguish zero courses from failed verification.

## G2-5-011-002 [P1] GAP facet F01
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: src/app/(authenticated)/teacher/calendar/page.tsx
- Legacy: Calendar event click uses courseSlug or numeric course ID, `/teacher/courses/{identifier}/home`, and `?ref=course` for numeric IDs (`docs/legacy-source/frontend/src/components/CalendarComp/ClassScheduleContent.jsx:64-80`)
- Expected fix: Add resolver/deep-link compatibility for legacy numeric/slug links and verify landing course.

## G2-5-011-018 [P1] GAP facet F04
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: src/modules/courses/faculty-schedule-service.ts
- Legacy: ClassScheduleResponse has facultyId/courseSlug/learnerCount/lectureHallId/className, unlike vNext projection (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/ClassScheduleResponse.java:9-22`)
- Expected fix: Map legacy fields correctly and explicitly scope whether roster/count/hall data should be displayed.

## G2-5-011-037 [P1] GAP facet F10
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: src/modules/courses/faculty-schedule-service.ts
- Legacy: Upcoming uses second GET same endpoint for today through next 180 days (`docs/legacy-source/frontend/src/components/CalendarComp/ClassScheduleContent.jsx:122-145`)
- Expected fix: Preserve independent upcoming view and minimum future-window semantics.

## G2-5-011-061 [P1] GAP facet F19
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: src/modules/courses/faculty-schedule-service.ts
- Legacy: Legacy loads dates only for current view (week/day/overflow month) (`docs/legacy-source/frontend/src/components/CalendarComp/CalendarEvents/CalendarEvents.js:69-85`)
- Expected fix: Add bounded date predicate and indexed range query to avoid table-growth slowdown.

## G2-5-020-001 [P1] GAP facet F01
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: src/app/api/courses/deliveries/[deliveryId]/discussions/route.ts
- Legacy: Legacy `/api/v1/discussion/post` and `/fetchDiscussion` per lesson_content_id `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:22-30,75-94`
- Expected fix: Implement lesson-content-scoped runtime API or migrate clients explicitly.

## G2-5-026-001 [P1] GAP facet F01
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: src/app/api/internal/placements/recruiter-message-inbound/route.ts
- Legacy: Legacy hidden public URL POST `/api/v1/public/inbound-email`, called by Cloudflare Email Worker. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicInboundEmailController.java:14-20,28-33`
- Expected fix: Document and deploy authenticated Cloudflare gateway adapter and worker target rewrite.

## G2-5-026-006 [P1] GAP facet F03
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: src/app/api/internal/placements/recruiter-message-inbound/route.ts, src/modules/placements/recruiter-message-email-inbound-service.ts
- Legacy: Legacy exposes status outcomes POSTED/NO_THREAD/WRONG_SENDER/NOT_VERIFIED/EMPTY/ACCESS_ENDED/FAILED/STORED/NOT_OURS/DUPLICATE. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:69-73`
- Expected fix: Retain privacy-safe internal reason codes and operator dashboard without leaking to callers.

## G2-5-026-019 [P1] MISSING facet F08
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: src/app/api/internal/placements/recruiter-message-inbound/route.ts
- Legacy: Legacy OTHER mail always status STORED when inserted. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:69-88`
- Expected fix: Return successful general-mail persistence receipt.

## G2-5-026-031 [P1] GAP facet F13
- Verification: DEFERRED — requires a code-path and behavior check; no parity claim made.
- Files: src/app/api/internal/placements/recruiter-message-inbound/route.ts, src/modules/placements/recruiter-message-email-inbound-service.ts
- Legacy: Legacy every email status recorded, enabling retry/triage for error cases. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:74-88,95-123`
- Expected fix: Add privacy-safe rejected-event diagnostics and manual recovery path.
