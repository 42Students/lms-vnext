# U009 — AdminAttendanceController gap audit v2

## File map / closure
- `LC` = `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAttendanceController.java`
- `LF` = `docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js`
- `LA` = `docs/legacy-source/frontend/src/api/Services/attendanceServices.js`
- `NP` = `src/app/(authenticated)/college/attendance/page.tsx`
- `NS` = `src/modules/attendance/admin-service.ts`
- `NC` = `src/components/attendance/admin-attendance-workspace.tsx`
- `NM` = `src/modules/attendance/admin-grid-model.ts`
- `NR` = `src/app/api/attendance/admin/sessions/[scheduleEventId]/route.ts`
- `NB` = `src/db/schema/attendance.ts`

Inspected whole controller, legacy admin monthly grid/single-record modal and network adapter, vNext attendance workspace, grid/status model, college SSR route, admin service, correction API and Drizzle sessions/records. Every abbreviated `LC:94-130` means full mapped path and one-based lines. Policy writes belong to next U010; this unit checks attendance read/correction only. Some visual dimensions need browser validation and are marked UNKNOWN.

## 23 facets
| ID | Facet | Legacy behaviour (file:line) | vNext behaviour (file:line or NONE) | Verdict | Severity | Concrete fix | Effort |
|---|---|---|---|---|---|---|---|
| G2-2-009-001 | F01 | LC:41-45 API prefix /api/v1/admin/attendance, LF:469-475 Attendance inside Admin shell | NP:117-130 college route; Super Admin route admin/attendance; NR:13-41 private PATCH path | GAP | P2 | Document API path migration; preserve matching shell routes. | S |
| G2-2-009-002 | F01 | LC:94-153 two read endpoints flat and monthly, LF:414-440 grid loads month | NP:71-79 SSR getAdminAttendanceGrid; no old flat arbitrary date-range query in new route | GAP | P2 | Preserve flat arbitrary date-range report via separate scoped report route if still required. | S |
| G2-2-009-003 | F02 | LF:470-486 page header then editable Attendance policy card before filters | NC:324-425 filters/header, NC:595-618 collapsed read-only retroactive window card after grid | GAP | P2 | Restore policy card position/labels and linked editable policy controls (U010 owns write). | S |
| G2-2-009-004 | F02 | LF:497-539 filters inline followed grid, skeleton, errors | NC:324-425 responsive grid filters then summary/grid; no matching top card | GAP | P2 | Align legacy section order, keeping accessible stack. | S |
| G2-2-009-005 | F03 | LF:518-521 previous/next month and Export CSV in filter row | NC:395-407 previous/next/type=month, NC:470 export near grid | GAP | P3 | Restore button position, retain optional month picker. | S |
| G2-2-009-006 | F03 | LF:239-278 modal with selected reason Radio and single Mark absent button | NC:621-741 Drawer footer has separate Present/Absent/Excused/Medical/Late action buttons | GAP | P2 | Match radio choice and confirm action if strict modal parity. | S |
| G2-2-009-007 | F03 | LF:221-237 session chooser AntD Modal with session status labels | NC:742-770 Drawer with buttons and StatusBadge | GAP | P2 | Restore modal shell/title and focus behavior. | S |
| G2-2-009-008 | F04 | LC:119-121 GET flat List AttendanceDetailsResponseDTO | NS:282-427 month grid with delivery,roster,sessions,records only | GAP | P2 | Expose flat per-learner date-range view or explicitly retire unused GET. | S |
| G2-2-009-009 | F04 | LC:151-152 GET monthly returns `{classes,absentees}` | NP:90-116 converted grid objects `{delivery,roster,sessions,records}` | GAP | P2 | Map old grid response contracts for unported consumers. | S |
| G2-2-009-010 | F04 | LC:242-249 record includes present,attendanceStatus,markedBy/Name,markedAt | NC:683-728 in-row read from SSR record and session; no on-demand GET /record | GAP | P1 | On correction open refetch exact record state with server denial/error instead of relying on potentially stale grid. | S |
| G2-2-009-011 | F04 | LC:229-240 no absence row maps to unmarked if schedule.attendanceMarkedAt null | NM:83-111 no record + unmarked session => Not marked; present only if MARKED | MATCH | P3 | Keep 3-state separation. | S |
| G2-2-009-012 | F05 | LF:497-521 searchable class and class-owned course select, togglable all-college courses | NC:324-387 Section/course/delivery selectors and showAllCourses | MATCH | P3 | Retain constrained class/course selection. | S |
| G2-2-009-013 | F05 | LF:158-217 one day column per calendar date; ratio on multiple sessions, percentage column | NC:478-585 calendar Table with per-day cell; multiple sessions count and chooser | GAP | P2 | Restore per-cell attended/held ratio in multi-session days instead of sessions-count label. | S |
| G2-2-009-014 | F05 | LF:103-112 attendance % from held marked sessions, present/absent counts | NC:222-246 marked sessions and percent; NM:114-132 | MATCH | P3 | Retain marked-session denominator. | S |
| G2-2-009-015 | F06 | LC:97-101 requires integer collegeId,classId,courseId and two date strings | NP:44-53 valid UUID Section/Course/delivery and YYYY-MM month | GAP | P2 | Document date-range to month filter and integer-ID to UUID migration. | S |
| G2-2-009-016 | F06 | LC:112-117 startDate/endDate parsing + start<=end | NP:44-51 only calendar month regex; NS:296 month window | GAP | P2 | Reject inverted arbitrary ranges in compatible report endpoint, not month selector. | S |
| G2-2-009-017 | F06 | LC:290-293 status accepts blank or EXCUSED,MEDICAL,LATE case-insensitive | NS:48-61 status strict enum includes PRESENT/ABSENT/EXCUSED/MEDICAL/LATE | GAP | P2 | If compatibility API offered, normalize legacy status query; UI selects typed enum. | S |
| G2-2-009-018 | F06 | LF:268-275 radio choices Plain absent, Excused, Medical, Late | NC:648-678 five direct footer buttons; no radio | GAP | P2 | Restore optional reason picker wording/default. | S |
| G2-2-009-019 | F07 | LC:103,144,214,288,330 'collegeId must be a positive integer' | NP:42 missing scope state; NR:25-39 API errors | GAP | P3 | Map invalid tenant scope to safe same error semantic. | S |
| G2-2-009-020 | F07 | LC:113-125 exact invalid startDate/endDate and invalid interval errors | NP:51 'Unable to load attendance' generic invalid filters | GAP | P2 | Show date-specific validation messages on any date-range client. | S |
| G2-2-009-021 | F07 | LC:291-294 exact invalid status reason error | NS:48-61 Zod enum unknown status; NR:38 error formatter | GAP | P3 | Provide exact invalid reason error to admin. | S |
| G2-2-009-022 | F07 | LC:221-227 absent repository returns 503 'Attendance data is temporarily unavailable' | NC:207-246 no live record request per click; page SSR only | GAP | P1 | Add error state refusing correction when fresh marker record cannot be loaded. | S |
| G2-2-009-023 | F07 | LC:318-320 Failed to mark absent, LC:350-352 Failed to mark present | NC:282-285 generic 'Attendance correction failed. Check your connection and retry.' | GAP | P3 | Restore operation-specific failure copy. | S |
| G2-2-009-024 | F08 | LC:311 'Marked absent', LC:343 'Marked present' | NC:278 'Attendance corrected for [student] — [session]' | GAP | P3 | Keep action-specific success wording or document combined toast. | S |
| G2-2-009-025 | F08 | LF:89 success `Attendance corrected for NAME — LABEL` | NC:278 nearly same with target.session.title (no time) | GAP | P3 | Include chosen session timestamp in success acknowledgement. | S |
| G2-2-009-026 | F09 | LF:239-278 detail modal with title `Attendance — student — session` and record fetch retry | NC:621-741 Drawer with student title and session description from cached grid | GAP | P2 | Restore modal title and on-demand record loading/error/retry. | S |
| G2-2-009-027 | F09 | LF:221-237 chooser dialog 'Choose a session — student' and explanatory sentence | NC:742-770 chooser Drawer 'Choose attendance session' with student description | GAP | P3 | Restore exact title, status caption and explanatory text. | S |
| G2-2-009-028 | F10 | LC:94-130 GET flat and 136-153 GET monthly query endpoints | NS:282-427 SSR service only; no equivalent public GET routes in reviewed scope | GAP | P2 | Create authorized old-client adapter or document API breaking change. | S |
| G2-2-009-029 | F10 | LC:277-321 POST mark-absent and 323-353 mark-present | NR:13-41 one PATCH with status and UUIDs | GAP | P2 | Migrate API client actions/methods and responses, enforce origin. | S |
| G2-2-009-030 | F10 | LC:187-199 stamp marker after marking, best-effort failure cannot undo success | NS:574-631 stamps marker+event in one DB transaction | EXTRA | P3 | Keep atomic marker/audit guarantees instead of legacy best-effort. | S |
| G2-2-009-031 | F10 | LC:338-343 removeAbsence and audit log; LC:300-311 attend(true), stamp, log | NS:538-631 delete or upsert attendanceRecords and emit activityEvents | MATCH | P3 | Keep semantics and audit event types. | S |
| G2-2-009-032 | F11 | LC:105-110 admin action + requireAccessClass, scope superadmin L75-91 | NS:62-121 requires active college permission; NS:252-281 exact delivery scope | MATCH | P3 | Retain runtime scope guard. | S |
| G2-2-009-033 | F11 | LC:159-165 resolves class schedule and checks parent college before write | NS:466-505 joins event to delivery/Section under transaction lock | MATCH | P3 | Keep cross-tenant event check. | S |
| G2-2-009-034 | F11 | LC:44 CORS broad same-domain wildcard cookies | NR:17-22 same-origin request guard | EXTRA | P3 | Keep stricter same-origin mutation semantics. | S |
| G2-2-009-035 | F12 | LC:168-173 bypass faculty correction window for college admin | NS:507-510 explicitly bypasses marking window | MATCH | P3 | Keep post-window corrections. | S |
| G2-2-009-036 | F12 | LC:187-199 action stamps status and principal | NS:574-630 actor user + status + event transactionally | EXTRA | P3 | Keep stronger provenance. | S |
| G2-2-009-037 | F12 | LC:229-240 unmarked vs present record reads session attendanceMarkedAt | NM:88-111 unmarked vs marked logic | MATCH | P3 | No change. | S |
| G2-2-009-038 | F12 | LF:22 isHeld excludes sessions not started, LF:192 click only held | NC:538-546 disables future sessions; NS:507-510 permits pre-session admin edits by API | GAP | P1 | Align server to UI future-session policy, or explicitly approve pre-session corrections; prevent deep-link bypass. | S |
| G2-2-009-039 | F13 | LF:241-245 skeleton, error Retry record disables corrections | NC:621-741 Drawer uses cached target, no record loading state | MISSING | P1 | Add detail fetch skeleton/error and hard-disable correction until verified. | S |
| G2-2-009-040 | F13 | LF:523-539 cached prior grid on refresh failure warning | NP:54-116 SSR load, response failure presents generic page error rather than prior cached grid | GAP | P2 | Preserve last-good scoped data when refresh fails, avoiding stale scope leaks. | S |
| G2-2-009-041 | F13 | LF:487-495 options retry class/course and classCourse verification | NC:324-389 SSR options, no independent retry controls | GAP | P2 | Add exact failure states and safe Retry class courses. | S |
| G2-2-009-042 | F13 | LF:122-125 Empty 'No attendance data for this class, course and month' | NC:426-434 different split of no roster/no sessions | GAP | P3 | Retain exact empty copy or approve richer distinctions. | S |
| G2-2-009-043 | F14 | LF:447-466 CSV Student + day1..dayN; filename attendance-class-{class}-course-{course}-{month}.csv | NC:292-324 CSV Learner,Roll,days,Attendance%; filename attendance-{sectionCode}-{courseCode}-{month}.csv | GAP | P2 | Restore legacy filename/headers/day cells, or provide explicit schema migration. | S |
| G2-2-009-044 | F14 | LF:456-463 multi-session cell CSV n/m | NC:301-306 flattens multiple sessions slash of P/A/N instead of n/m | GAP | P1 | Export aggregate attended/marked ratio identical to displayed legacy grid. | S |
| G2-2-009-045 | F14 | LF:521 export disabled when no absentees | NC:292-294 export only if grid exists; button accessibility elsewhere | UNKNOWN | P3 | Verify disabled empty-roster export in browser. | S |
| G2-2-009-046 | F15 | LC:306-309 correction AdminAuditLogService, no SMS send in controller | NS:613-651 event plus optional guardian SMS outbox and dispatch | EXTRA | P2 | Confirm DLT-approved guardian SMS event and suppression; never send unconsented notifications. | S |
| G2-2-009-047 | F15 | LC:338-343 mark-present audit; no notification | NS:632-638 sends CORRECTED parent SMS when prior plain ABSENT | EXTRA | P2 | Ensure guardians' opt-ins and safe privacy copy, document intentional feature. | S |
| G2-2-009-048 | F16 | LF:158-217 wide monthly scrollable table with sticky student cells | NC:478-585 Table with flex, compressed responsive selectors | GAP | P2 | Compare 375/768/1280 sticky headings, overflow and tappable daily cells. | S |
| G2-2-009-049 | F17 | LF:158-217 table caption, th scope, cell button aria-label | NC:478-585 table caption, button title; record drawer focus | GAP | P2 | Ensure detailed learner/date/status accessible label for each session button. | S |
| G2-2-009-050 | F17 | LF:239-278 Modal trap/return focus with radios | NC:621-770 Drawer; focus return and escape behavior different | GAP | P2 | Validate focus trap/return/Escape equivalent to legacy. | S |
| G2-2-009-051 | F18 | LF:473 exact subtitle Review monthly attendance by class and course, correct recent records... | NP:121 College-wide attendance oversight... | GAP | P3 | Restore exact legacy subtitle and warnings. | S |
| G2-2-009-052 | F18 | LF:477-485 policy 'Late marking allowed for','Minimum attendance' | NC:595-618 retroactive window, minimum attendance | GAP | P3 | Restore legacy card labels and help text. | S |
| G2-2-009-053 | F18 | LF:150-156 legend N and 2/3 ratio; LF:171 '% month' | NC:589-591 legend N replaced em-dash, S future and code E/M/L | GAP | P3 | Match legend and multi-session ratio wording. | S |
| G2-2-009-054 | F19 | LC:119-120 per-range service aggregation, LF:414-439 one monthly fetch | NS:298-427 single SSR roster+sessions+record reads | MATCH | P3 | Keep bounded month window. | S |
| G2-2-009-055 | F19 | LF:414-440 request IDs guard stale responses and cached scoped states | NP:37-116 SSR query, NC:159-177 sync key | EXTRA | P3 | Keep URL-bound request scoping; avoid showing stale college data. | S |
| G2-2-009-056 | F20 | LC:112-115 parseEndDateSafe includes full end calendar date | NS:296 India month window, NM:20-27 IST grouping | MATCH | P3 | Confirm month end inclusivity on sample 23:59 IST boundary. | S |
| G2-2-009-057 | F20 | LC:229-249 marks latest updatedAt on re-marked absent row | NS:574-601 updates markedAt/updatedAt in same transaction | MATCH | P3 | No change. | S |
| G2-2-009-058 | F20 | LC:187-199 marker failure warning not rollback | NS:613-651 audit failure rolls correction back, SMS failure does not | EXTRA | P2 | Document intentional stronger correction atomicity and communicate failed mutation clearly. | S |
| G2-2-009-059 | F21 | LC:47-66 ClassScheduleService, LearnerService, AttendanceRepository, audit optional | NS:282-427 DB plus NS:613-651 activity and guardian SMS | EXTRA | P2 | Track audit/guardian SMS integration as a new privacy impact. | S |
| G2-2-009-060 | F22 | LC:187-199 legacy `attend` row with attendanceStatus, markedBy, audit record | NB:110-170 attendance_records status, markedByUserId, markedAt; 63-109 sessions status | GAP | P2 | Migrate row IDs/mark timestamps; preserve attendance-not-marked distinction. | S |
| G2-2-009-061 | F22 | LC:229-249 GET record absent row can hold past marking timestamp | NB:110-170 absence exception row removed for present; status enum also allows PRESENT | GAP | P2 | Document record deletion vs historical correction audit retention. | S |
| G2-2-009-062 | F22 | LC:306-309 audit optional separate sink | NS:613-631 activity_events insertion transactionally required | EXTRA | P3 | Keep fail-closed audit row for corrections. | S |
| G2-2-009-063 | F23 | LF:238-278 one modal with radio reason and loading/error states | NC:621-741 drawer, five direct buttons and no live record read | GAP | P1 | Restore live record read/verification before allowing writes and exact modal UI. | S |
| G2-2-009-064 | F23 | LC:94-130 flat date-range reader has no vNext page equivalent | NS:282-427 month-only service | MISSING | P2 | Decide and implement report parity for downstream API clients. | S |

## Summary
- Rows 64; verdicts GAP 41; MATCH 11; EXTRA 9; MISSING 2; UNKNOWN 1; severity P2 30; P3 28; P1 6.
- **Top P1:** Legacy GET /record always reloads and can fail 503, blocks correction on failure and distinguishes unmarked from present. New drawer uses the SSR grid snapshot and does not independently verify latest record before correction; add secure on-demand retrieval/retry (F04/F07/F13/F23).
- **Top P1:** Legacy UI restricts correction of sessions not started; new backend permits pre-session corrections, while UI disables them. Align both layers to approved policy, avoiding a direct-PATCH bypass (F12).
- **Top P1:** Legacy CSV emits exact daily n/m counts for multi-session days. New exporter emits a slash-joined sequence of statuses, different semantics and columns (F14).

### UNKNOWN / live checks
- Verify calendar timezone and duplicate-session-day counts, especially future/not-marked interaction. Verify browser view at 375/768/1280 and empty-export disabled state.
- Confirm new DB migrations for attendance_records and outbox are actually deployed; static schema is not proof of production data.
- Legacy `getAttendanceDetailsByDateRangeForAdmin` and `getFilteredClassSchedulesForAdmin` service closure is not fully expanded in this document; if query-specific edge behavior is disputed, inspect these implementations before changing API.
