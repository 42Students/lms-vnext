# U009 — Student course attendance detail

Source-only gap audit; no application code changes/CI. Main snapshot 2026-10-21.

## Closure and source paths

Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/StudentAttendanceView.jsx:1-221; imports api/Services/attendanceServices.js, components/Attendance/StudentAttendance/StatusCol.jsx, utils/attendanceConstants.js, dayjs, Redux course/learner state. Service GET by month/learner/course with classes, absentids and attendanceThresholdPercent. Server controller/entity/migration physical DDL unverified; requires targeted backend inspection before fixes.

vNext: src/components/courses/learner-course-attendance.tsx:1-377, src/modules/attendance/learner-service.ts, learner-course-attendance-summary-model.ts, learner-course-attendance-tone-model.ts, src/modules/courses/learner-course-drilldown-service.ts:1-98, src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx, and schema attendance records + college policy. Short basename citations in table refer to these exact paths, 1-based physical lines.

## 23 facet table

| ID | Facet | Legacy (file:line) | vNext (file:line) | Verdict | Severity | Concrete fix | Effort |
| --- | --- | --- | --- | --- | --- | --- | --- |
| G2-16-009-001 | F01 | StudentAttendanceView.jsx:11-19 Redux selected attendeeCurMonth. | learner-course-attendance.tsx:139-149 month query props. | GAP | P2 | Preserve selected-month course tab contract. | M |
| G2-16-009-002 | F01 | StudentAttendanceView.jsx:98-118 summary starts directly, no intro. | learner-course-attendance.tsx:239-247 adds intro. | GAP | P3 | Remove/move extra visible intro. | S |
| G2-16-009-003 | F01 | StudentAttendanceView.jsx:118-127 history right-aligned month. | learner-course-attendance.tsx:249-323 adds course code/title/month navigator before summary. | GAP | P2 | Align month selector and history metadata with original. | M |
| G2-16-009-004 | F02 | StudentAttendanceView.jsx:98-117 tinted safe/risk/neutral card, primary percent and three stats in right column. | learner-course-attendance.tsx:325-336 neutral stacked border section. | GAP | P2 | Restore tinted two-column summary card. | M |
| G2-16-009-005 | F02 | StudentAttendanceView.jsx:118-180 history bordered card with header and inner table. | learner-course-attendance.tsx:337-373 plain header and table. | GAP | P2 | Restore bordered Attendance History card. | M |
| G2-16-009-006 | F02 | StudentAttendanceView.jsx:128-179 distinct desktop table and mobile cards. | learner-course-attendance.tsx:347-372 one DataTable with mobile priorities. | GAP | P2 | Restore mobile date/day/time/status cards. | M |
| G2-16-009-007 | F03 | StudentAttendanceView.jsx:53-57 centered large loading Spin. | learner-course-attendance.tsx:139-198 server provided records, no local spinner. | GAP | P2 | Create attendance-specific loading fallback. | S |
| G2-16-009-008 | F03 | StudentAttendanceView.jsx:60-68 error alert includes Retry button. | learner-course-attendance.tsx:198-205 missing course uses EmptyState, no retry. | MISSING | P1 | Add localized retriable load-error Alert. | S |
| G2-16-009-009 | F03 | StudentAttendanceView.jsx:128-143 table horizontal max-content scroll, no pagination. | learner-course-attendance.tsx:347-372 DataTable shows all month records. | MATCH | P3 | Keep one page of month records. | S |
| G2-16-009-010 | F04 | StudentAttendanceView.jsx:184-216 columns Date/Day/Class Start Time/Present-Absent. | learner-course-attendance.tsx:352-371 Date/Class/Status/Faculty-location/Day. | GAP | P2 | Restore four columns, labels and ordering. | S |
| G2-16-009-011 | F04 | StudentAttendanceView.jsx:190,197,205 exact D MMM YYYY, dddd, h:mm A separately. | learner-course-attendance.tsx:45-64,353-356 date includes weekday/time combined. | GAP | P2 | Separate date/day/time and preserve IST formatting. | S |
| G2-16-009-012 | F04 | StudentAttendanceView.jsx:209-214 uses StatusCol statusClass and label. | learner-course-attendance.tsx:363-366 generic StatusBadge with enum text. | GAP | P2 | Map present/absent/pending/future wording and tone. | S |
| G2-16-009-013 | F04 | StudentAttendanceView.jsx:124-126 history card displays MMMM YYYY. | learner-course-attendance.tsx:273-300 native YYYY-MM picker elsewhere. | GAP | P3 | Include long-readable month in history header. | S |
| G2-16-009-014 | F05 | StudentAttendanceView.jsx:23-29 GET month inclusive bounds, selected course and learner. | learner-course-attendance.tsx:169-185 same IST month filter on deliveryId. | MATCH | P3 | Keep monthly and course scope. | S |
| G2-16-009-015 | F05 | StudentAttendanceView.jsx:71-84 only held and marked sessions count toward percent. | learner-course-attendance.tsx:193-196 summarize with markedSessions. | MATCH | P3 | Keep marked-session denominator. | S |
| G2-16-009-016 | F05 | StudentAttendanceView.jsx:73-80 absentIds and learnerSessionStatus derive future/pending. | learner-course-attendance.tsx:363-366 uses normalized stored status. | GAP | P1 | Reconcile future/unmarked/cancelled statuses vs legacy helper. | M |
| G2-16-009-017 | F05 | StudentAttendanceView.jsx:80-84 Math.round ratio, em dash when none. | learner-course-attendance.tsx:325-329 null ratio renders em dash. | MATCH | P3 | Keep zero-denominator behavior. | S |
| G2-16-009-018 | F05 | StudentAttendanceView.jsx:89-94 policy threshold from response with fallback default. | learner-course-attendance.tsx:207-213 reads workspace policy without fallback. | GAP | P2 | Fallback on missing/invalid threshold. | S |
| G2-16-009-019 | F06 | StudentAttendanceView.jsx:19-51 new month refetch aborts/ignores stale response. | learner-course-attendance.tsx:150-162 URL navigation triggers server refresh. | GAP | P2 | Preserve month-loading and stale-state protection. | M |
| G2-16-009-020 | F06 | StudentAttendanceView.jsx:12 selected month in Redux parent. | learner-course-attendance.tsx:261-320 adds internal arrows/native Month input. | EXTRA | P3 | Keep as approved utility but match placement. | S |
| G2-16-009-021 | F06 | StudentAttendanceView.jsx:51 re-fetches only on month/course/retry. | learner-course-attendance.tsx:169-191 memoized month/delivery records. | MATCH | P3 | Maintain selected-month change. | S |
| G2-16-009-022 | F07 | StudentAttendanceView.jsx:42-49 failure text Failed to load attendance. | learner-course-attendance.tsx:198-205 treats no course as no attendance data. | GAP | P1 | Catch real service failure independently and display exact text. | S |
| G2-16-009-023 | F07 | StudentAttendanceView.jsx:60-68 Retry increments count for same month. | learner-course-attendance.tsx:341-373 no retry on failed data read. | MISSING | P2 | Add same-month re-fetch. | S |
| G2-16-009-024 | F07 | StudentAttendanceView.jsx:89-91 threshold fallback ATTENDANCE_THRESHOLD. | learner-course-attendance.tsx:207-235 invalid policy may poison headroom. | GAP | P2 | Validate and provide old threshold fallback. | S |
| G2-16-009-025 | F08 | StudentAttendanceView.jsx:60-68 error is inline Ant Alert, not toast. | learner-course-attendance.tsx:198-205 missing record uses EmptyState. | GAP | P3 | Preserve retryable inline alert. | S |
| G2-16-009-026 | F08 | StudentAttendanceView.jsx:98-110 contextual safe/risk guidance in primary card. | learner-course-attendance.tsx:216-236 equivalent guidance, changed sentence copy. | GAP | P3 | Use exact legacy threshold sentences. | S |
| G2-16-009-027 | F09 | StudentAttendanceView.jsx:11-220 no modal/drawer; read-only. | learner-course-attendance.tsx:139-377 likewise no modal/drawer. | MATCH | P3 | No overlay needed. | S |
| G2-16-009-028 | F10 | StudentAttendanceView.jsx:23-51 getStudentAttendanceListByDaterange GET with user/course/month. | learner-course-attendance.tsx:139-196 parent-loaded attendance workspace. | GAP | P2 | Audit normalized status/absence data contract and monthly query. | L |
| G2-16-009-029 | F10 | StudentAttendanceView.jsx:37-49 independent attendance fetch/failure. | learner-course-attendance.tsx:139-198 depends on larger server workspace. | GAP | P1 | Split local attendance recovery from entire course. | M |
| G2-16-009-030 | F11 | StudentAttendanceView.jsx:26-29 learnerId supplied from Redux. | learner-course-drilldown-service.ts:25-55 persisted learner membership validation. | EXTRA | P3 | Keep stronger server auth, do not accept caller's learnerId. | S |
| G2-16-009-031 | F11 | StudentAttendanceView.jsx:30-34 absent course shows no-query state. | learner-course-attendance.tsx:198-205 shows No attendance data. | GAP | P3 | Show class/course scope unavailable guidance. | S |
| G2-16-009-032 | F12 | StudentAttendanceView.jsx:74-80 future unmarked sessions excluded. | learner-course-attendance.tsx:193-196 marked count only. | MATCH | P3 | Retain marked-only percentage. | S |
| G2-16-009-033 | F12 | StudentAttendanceView.jsx:107-109 below-threshold recoverable/nonrecoverable branches. | learner-course-attendance.tsx:228-235 equivalent math but different copy. | GAP | P3 | Match requirement phrasing. | S |
| G2-16-009-034 | F12 | StudentAttendanceView.jsx:101-104 zero held renders em dash/no held classes. | learner-course-attendance.tsx:327-329 same. | MATCH | P3 | No change. | S |
| G2-16-009-035 | F13 | StudentAttendanceView.jsx:53-59 centered Spin while fetch. | learner-course-attendance.tsx:139-196 no component loading state. | GAP | P2 | Add local spinner/skeleton. | M |
| G2-16-009-036 | F13 | StudentAttendanceView.jsx:135-151 empty text No classes in this period. | learner-course-attendance.tsx:341-345 same title plus extra description. | GAP | P3 | Match Ant Empty simple icon and no extra description. | S |
| G2-16-009-037 | F13 | StudentAttendanceView.jsx:118-127 history header exists even when no records. | learner-course-attendance.tsx:337-346 header exists even when empty. | MATCH | P3 | Keep header. | S |
| G2-16-009-038 | F14 | StudentAttendanceView.jsx:11-220 no export/files. | learner-course-attendance.tsx:139-377 no export/files. | MATCH | P3 | No export feature in scope. | S |
| G2-16-009-039 | F15 | StudentAttendanceView.jsx:11-220 no outbound notifications. | learner-course-attendance.tsx:139-377 no outbound notifications. | MATCH | P3 | No email action required. | S |
| G2-16-009-040 | F16 | StudentAttendanceView.jsx:128-179 mobile card grid distinct from desktop. | learner-course-attendance.tsx:347-372 DataTable mobile-priority columns. | GAP | P2 | Restore exact mobile card date/day/time/status. | M |
| G2-16-009-041 | F16 | StudentAttendanceView.jsx:98-117 colored summary horizontal. | learner-course-attendance.tsx:325-335 neutral vertical summary. | GAP | P2 | Match risk/safe/neutral and responsive card alignment. | M |
| G2-16-009-042 | F17 | StudentAttendanceView.jsx:98 aria-label Student attendance summary. | learner-course-attendance.tsx:325 aria-label Attendance this month. | GAP | P3 | Match accessible region label. | S |
| G2-16-009-043 | F17 | StudentAttendanceView.jsx:128-143 Ant table four accessible column titles. | learner-course-attendance.tsx:347-371 caption and five columns. | GAP | P3 | Restore column labels, retain caption. | S |
| G2-16-009-044 | F17 | StudentAttendanceView.jsx:66-67 Retry keyboard button. | learner-course-attendance.tsx:198-205 no localized Retry. | GAP | P2 | Restore focusable Retry. | S |
| G2-16-009-045 | F18 | StudentAttendanceView.jsx:100-106 says You need N%. You can miss N more classes this month. | learner-course-attendance.tsx:223-227 says remain at or above current threshold. | GAP | P3 | Match this month phrase and exact helper. | S |
| G2-16-009-046 | F18 | StudentAttendanceView.jsx:107-109 says Below the N% requirement and Talk to your faculty. | learner-course-attendance.tsx:232-235 says threshold and Faculty or College team. | GAP | P3 | Restore legacy wording and case. | S |
| G2-16-009-047 | F18 | StudentAttendanceView.jsx:121-123 Attendance History explanation. | learner-course-attendance.tsx:337-339 same sentence. | MATCH | P3 | No change. | S |
| G2-16-009-048 | F18 | StudentAttendanceView.jsx:209 Present/Absent column. | learner-course-attendance.tsx:363 Status column. | GAP | P3 | Rename column. | S |
| G2-16-009-049 | F19 | StudentAttendanceView.jsx:19-51 GET one bounded month at a time. | learner-course-attendance.tsx:169-196 filters possibly all records client-side. | GAP | P2 | Bound attendance fetch for large histories. | M |
| G2-16-009-050 | F19 | StudentAttendanceView.jsx:80-94 one tally per month. | learner-course-attendance.tsx:193-196 memo summary. | MATCH | P3 | Keep O(n) compute. | S |
| G2-16-009-051 | F20 | StudentAttendanceView.jsx:20,39,43,47,50 cancelled prevents late response overwrite. | learner-course-attendance.tsx:150-162 URL refresh with navigation races possible. | GAP | P2 | Verify stale transition cancellation. | M |
| G2-16-009-052 | F20 | StudentAttendanceView.jsx:78-84 uses current time to derive future class state. | learner-course-attendance.tsx:193-196 relies on server stored status. | GAP | P2 | Ensure status updates on day transition. | M |
| G2-16-009-053 | F21 | StudentAttendanceView.jsx:1,37 Spring attendance endpoint. | learner-course-attendance.tsx:15-19 vNext learner-service Postgres. | GAP | P2 | Compare old payload classes/absentids fields to new normalized rows. | L |
| G2-16-009-054 | F22 | StudentAttendanceView.jsx:24-29 numeric course ID, date ranges, classes/absentids. | learner-course-attendance.tsx:169-196 UUID delivery, stored session statuses. | GAP | P2 | Reconcile schedule/cancelled/unmarked and timezone mapping. | L |
| G2-16-009-055 | F22 | StudentAttendanceView.jsx:84 computed percent no persisted field. | learner-course-attendance.tsx:327 computed percent, null placeholder. | MATCH | P3 | No schema change for derived field. | S |
| G2-16-009-056 | F23 | StudentAttendanceView.jsx:98-180 tinted summary + bordered history + mobile card variant. | learner-course-attendance.tsx:239-374 generic sections, DataTable and no localized retry. | GAP | P2 | Restore all UI/UX and error state parity. | L |

## Summary

56 distinct rows and facets F01–F23 complete. Severities: P2 24; P3 28; P1 4. Highest P1 gaps: lost inline attendance Retry (legacy 60-68 vs vNext 198-205), potential future/unmarked status mismatch (legacy 73-80 vs vNext 363-366), and independent month fetch replaced by whole workspace dependency (legacy 37-49 vs vNext 139-198). UNKNOWN: specific legacy threshold constant and old controller scheduling statuses, date timezone boundary, responsive CSS screenshot parity, backend migration constraints.
