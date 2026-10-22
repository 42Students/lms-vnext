# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-14-014-004 [P1] GAP facet F01
- Files: src/modules/announcements/service.ts, src/app/(authenticated)/admin/announcements/page.tsx
- Legacy: Only global SA with no college or org scope can use /search `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchController.java:45-53`
- Expected fix: Do not silently broaden global-only search; keep explicit selected scope and endpoint compatibility policy

## G2-14-014-014 [P1] GAP facet F05
- Files: src/modules/announcements/service.ts
- Legacy: Legacy exact/prefix/word-start/contains/fuzzy scores with Levenshtein <=2 `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:129-187` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:311-351`
- Expected fix: Implement tenant-safe ranked autosuggest with limited fuzzy fallback

## G2-14-014-022 [P1] GAP facet F07
- Files: src/modules/announcements/service.ts
- Legacy: Legacy non-global search returns 403 GLOBAL-only text pointing to /api/v1 scoped APIs `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchController.java:45-53`
- Expected fix: Set route-specific denial text without leaking global content

## G2-14-014-031 [P1] GAP facet F10
- Files: src/modules/announcements/service.ts
- Legacy: Legacy GET stats returns cache.size of all undeleted across tenants `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchController.java:58-65` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchCache.java:36-44`
- Expected fix: Separate aggregate authorized global count from college-scoped metadata

## G2-14-014-034 [P1] GAP facet F11
- Files: src/modules/announcements/service.ts
- Legacy: Legacy /stats requires superadmin but does not require GLOBAL mode `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchController.java:58-65`
- Expected fix: Close global-count disclosure in scoped stats, preserve least privilege

## G2-14-018-028 [P1] GAP facet F12
- Files: src/modules/log-alerts/scheduler.ts
- Legacy: Legacy max 5 individual alerts and four pages per poll `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LogAlertingService.java:43-56` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LogAlertingService.java:132-171`
- Expected fix: Compare backlog draining and spike summary capacity under bursts

## G2-14-018-041 [P1] GAP facet F19
- Files: src/modules/log-alerts/scheduler.ts
- Legacy: Legacy 2-minute fixedDelay poll initial delay1min and distributed lock5min `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LogAlertingService.java:85-93`
- Expected fix: Specify timer cadence and failover bound with deployed cron

## G2-14-018-042 [P1] GAP facet F19
- Files: src/modules/log-alerts/scheduler.ts
- Legacy: Legacy max four pages fifty entries each per poll `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LogAlertingService.java:49-56` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LogAlertingService.java:195-239`
- Expected fix: Define expected backlog throughput and truncation policy

## G2-14-018-046 [P1] GAP facet F20
- Files: src/modules/log-alerts/scheduler.ts
- Legacy: Legacy cursor advancement oldest processed when pagination cap reached `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LogAlertingService.java:169-173`
- Expected fix: Verify no skipped equal-timestamp entries with >12 and token expiry

## G2-18-031-076 [P1] GAP facet F20
- Files: src/modules/people/college-student-csv-service.ts
- Legacy: Legacy bulk-import undo groups rows by batch ID; Learner.java:30-34;LearnerController.java:449-463
- Expected fix: Implement idempotent retry for PARTIAL that never duplicates active identity/membership or mixes college rosters

## G2-15-013-028 [P1] GAP facet F07
- Files: src/modules/people/college-role-directory-service.ts
- Legacy: Unauthorized faculty error Learner directory requires an admin or assigned class faculty. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:71-79`)
- Expected fix: Allow assigned faculty read-only class roster search via dedicated teacher endpoint, not broad people.manage.

## G2-15-013-039 [P1] GAP facet F10
- Files: src/modules/people/college-role-directory-service.ts
- Legacy: GET /api/v2/learners/search with query/limit/collegeId/programId/classId; returns list. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:114-138`)
- Expected fix: Expose scoped read adapter if command/autocomplete search requires old payload.

## G2-15-013-047 [P1] GAP facet F11
- Files: src/modules/people/college-role-directory-service.ts
- Legacy: Legacy search admin or assigned faculty for exact class only. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:65-79`)
- Expected fix: Add separate teacher-class search authorization tied to teaching assignment.

## G2-15-013-076 [P1] GAP facet F20
- Files: src/modules/people/college-role-directory-service.ts
- Legacy: Empty principal college/org with requested class resolves class college. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:81-99`)
- Expected fix: Allow faculty class-only read when persisted assignment exists; do not broaden across college.

## G2-15-013-080 [P1] GAP facet F22
- Files: src/modules/people/college-role-directory-service.ts
- Legacy: Legacy learner integer key, college/program/class integer IDs and contact. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchDTO.java:19-34`)
- Expected fix: Write legacy learner/class/program ID -> membership UUID crosswalk if importing historical links.

## G2-15-013-084 [P1] GAP facet F23
- Files: src/modules/people/college-role-directory-service.ts
- Legacy: Search role permits class-assigned faculty, masks contact. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:114-138`)
- Expected fix: Do not silently drop faculty class-scoped picker.

## G2-15-011-050 [P1] GAP facet F13
- Files: src/modules/announcements/tpo-notice-delivery-service.ts
- Legacy: Scheduler failures record FAILED/deliveryError, replay option. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:107-154`)
- Expected fix: Expose per-announcement release failures and retry control.

## G2-15-009-014 [P1] GAP facet F04
- Files: src/modules/attendance/faculty-service.ts
- Legacy: Roster student learner_id plus absence by studentId and classScheduleId (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:114-150`)
- Expected fix: Prove old learner/class ID crosswalk to new membership/delivery and historical rosters

## G2-15-009-021 [P1] GAP facet F05
- Files: src/components/attendance/faculty-attendance-workspace.tsx
- Legacy: Mark-all controls disabled only if roster empty (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:326-339`)
- Expected fix: Reconcile marking window product policy and identical disabled state

## G2-15-009-035 [P1] GAP facet F07
- Files: src/modules/attendance/faculty-service.ts
- Legacy: classScheduleId required, nonempty mark arrays and 500 total max (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AttendanceBulkController.java:89-101`)
- Expected fix: Set explicit class cohort limit and user-visible server error contract

## G2-15-009-036 [P1] GAP facet F07
- Files: src/components/attendance/faculty-attendance-workspace.tsx
- Legacy: Partial/full failures include counts, max five failed names and retry-only failed IDs (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:523-543`)
- Expected fix: Explain atomic-vs-partial difference; design deterministic retry and error text

## G2-15-009-039 [P1] GAP facet F08
- Files: src/components/attendance/faculty-attendance-workspace.tsx
- Legacy: Saving-close info toast and dirty-drawer discard confirm (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Attendance/SheduleClassDrawer.js:33-49`)
- Expected fix: Add Wait for the class schedule to finish saving. and dirty discard confirm

## G2-15-009-042 [P1] MISSING facet F09
- Files: src/components/attendance/faculty-attendance-workspace.tsx
- Legacy: Discard class schedule changes? dialog; Discard changes/Keep editing (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Attendance/SheduleClassDrawer.js:42-49`)
- Expected fix: Implement dirty scheduling confirmation matching copy/actions

## G2-15-009-045 [P1] GAP facet F10
- Files: src/components/attendance/faculty-attendance-workspace.tsx
- Legacy: POST /api/v1/attendance/bulk classScheduleId, absentStudentIds,presentStudentIds,reason (`docs/legacy-source/frontend/src/api/Services/attendanceServices.js:16-24`)
- Expected fix: Write explicit ID and payload mapping plus retry/concurrency contract

## G2-15-009-046 [P1] GAP facet F10
- Files: src/modules/attendance/faculty-service.ts
- Legacy: Per learner committed writes, partial success possible, only all-success completes session (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AttendanceBulkController.java:127-153`)
- Expected fix: Retain atomic model, document change to error/retry and old partial history
