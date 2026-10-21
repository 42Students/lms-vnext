# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-2/admin-attendance-controller.md

31 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-2/admin-attendance-controller.md

## G2-2-009-001  [P2] GAP  facet F01  effort S
- Legacy: LC:41-45 API prefix /api/v1/admin/attendance, LF:469-475 Attendance inside Admin shell
- vNext now: NP:117-130 college route; Super Admin route admin/attendance; NR:13-41 private PATCH path
- Fix: Document API path migration; preserve matching shell routes.

## G2-2-009-002  [P2] GAP  facet F01  effort S
- Legacy: LC:94-153 two read endpoints flat and monthly, LF:414-440 grid loads month
- vNext now: NP:71-79 SSR getAdminAttendanceGrid; no old flat arbitrary date-range query in new route
- Fix: Preserve flat arbitrary date-range report via separate scoped report route if still required.

## G2-2-009-003  [P2] GAP  facet F02  effort S
- Legacy: LF:470-486 page header then editable Attendance policy card before filters
- vNext now: NC:324-425 filters/header, NC:595-618 collapsed read-only retroactive window card after grid
- Fix: Restore policy card position/labels and linked editable policy controls (U010 owns write).

## G2-2-009-004  [P2] GAP  facet F02  effort S
- Legacy: LF:497-539 filters inline followed grid, skeleton, errors
- vNext now: NC:324-425 responsive grid filters then summary/grid; no matching top card
- Fix: Align legacy section order, keeping accessible stack.

## G2-2-009-006  [P2] GAP  facet F03  effort S
- Legacy: LF:239-278 modal with selected reason Radio and single Mark absent button
- vNext now: NC:621-741 Drawer footer has separate Present/Absent/Excused/Medical/Late action buttons
- Fix: Match radio choice and confirm action if strict modal parity.

## G2-2-009-007  [P2] GAP  facet F03  effort S
- Legacy: LF:221-237 session chooser AntD Modal with session status labels
- vNext now: NC:742-770 Drawer with buttons and StatusBadge
- Fix: Restore modal shell/title and focus behavior.

## G2-2-009-008  [P2] GAP  facet F04  effort S
- Legacy: LC:119-121 GET flat List AttendanceDetailsResponseDTO
- vNext now: NS:282-427 month grid with delivery,roster,sessions,records only
- Fix: Expose flat per-learner date-range view or explicitly retire unused GET.

## G2-2-009-009  [P2] GAP  facet F04  effort S
- Legacy: LC:151-152 GET monthly returns `{classes,absentees}`
- vNext now: NP:90-116 converted grid objects `{delivery,roster,sessions,records}`
- Fix: Map old grid response contracts for unported consumers.

## G2-2-009-013  [P2] GAP  facet F05  effort S
- Legacy: LF:158-217 one day column per calendar date; ratio on multiple sessions, percentage column
- vNext now: NC:478-585 calendar Table with per-day cell; multiple sessions count and chooser
- Fix: Restore per-cell attended/held ratio in multi-session days instead of sessions-count label.

## G2-2-009-015  [P2] GAP  facet F06  effort S
- Legacy: LC:97-101 requires integer collegeId,classId,courseId and two date strings
- vNext now: NP:44-53 valid UUID Section/Course/delivery and YYYY-MM month
- Fix: Document date-range to month filter and integer-ID to UUID migration.

## G2-2-009-016  [P2] GAP  facet F06  effort S
- Legacy: LC:112-117 startDate/endDate parsing + start<=end
- vNext now: NP:44-51 only calendar month regex; NS:296 month window
- Fix: Reject inverted arbitrary ranges in compatible report endpoint, not month selector.

## G2-2-009-017  [P2] GAP  facet F06  effort S
- Legacy: LC:290-293 status accepts blank or EXCUSED,MEDICAL,LATE case-insensitive
- vNext now: NS:48-61 status strict enum includes PRESENT/ABSENT/EXCUSED/MEDICAL/LATE
- Fix: If compatibility API offered, normalize legacy status query; UI selects typed enum.

## G2-2-009-018  [P2] GAP  facet F06  effort S
- Legacy: LF:268-275 radio choices Plain absent, Excused, Medical, Late
- vNext now: NC:648-678 five direct footer buttons; no radio
- Fix: Restore optional reason picker wording/default.

## G2-2-009-026  [P2] GAP  facet F09  effort S
- Legacy: LF:239-278 detail modal with title `Attendance — student — session` and record fetch retry
- vNext now: NC:621-741 Drawer with student title and session description from cached grid
- Fix: Restore modal title and on-demand record loading/error/retry.

## G2-2-009-028  [P2] GAP  facet F10  effort S
- Legacy: LC:94-130 GET flat and 136-153 GET monthly query endpoints
- vNext now: NS:282-427 SSR service only; no equivalent public GET routes in reviewed scope
- Fix: Create authorized old-client adapter or document API breaking change.

## G2-2-009-029  [P2] GAP  facet F10  effort S
- Legacy: LC:277-321 POST mark-absent and 323-353 mark-present
- vNext now: NR:13-41 one PATCH with status and UUIDs
- Fix: Migrate API client actions/methods and responses, enforce origin.

## G2-2-009-040  [P2] GAP  facet F13  effort S
- Legacy: LF:523-539 cached prior grid on refresh failure warning
- vNext now: NP:54-116 SSR load, response failure presents generic page error rather than prior cached grid
- Fix: Preserve last-good scoped data when refresh fails, avoiding stale scope leaks.

## G2-2-009-041  [P2] GAP  facet F13  effort S
- Legacy: LF:487-495 options retry class/course and classCourse verification
- vNext now: NC:324-389 SSR options, no independent retry controls
- Fix: Add exact failure states and safe Retry class courses.

## G2-2-009-043  [P2] GAP  facet F14  effort S
- Legacy: LF:447-466 CSV Student + day1..dayN; filename attendance-class-{class}-course-{course}-{month}.csv
- vNext now: NC:292-324 CSV Learner,Roll,days,Attendance%; filename attendance-{sectionCode}-{courseCode}-{month}.csv
- Fix: Restore legacy filename/headers/day cells, or provide explicit schema migration.

## G2-2-009-048  [P2] GAP  facet F16  effort S
- Legacy: LF:158-217 wide monthly scrollable table with sticky student cells
- vNext now: NC:478-585 Table with flex, compressed responsive selectors
- Fix: Compare 375/768/1280 sticky headings, overflow and tappable daily cells.

## G2-2-009-049  [P2] GAP  facet F17  effort S
- Legacy: LF:158-217 table caption, th scope, cell button aria-label
- vNext now: NC:478-585 table caption, button title; record drawer focus
- Fix: Ensure detailed learner/date/status accessible label for each session button.

## G2-2-009-050  [P2] GAP  facet F17  effort S
- Legacy: LF:239-278 Modal trap/return focus with radios
- vNext now: NC:621-770 Drawer; focus return and escape behavior different
- Fix: Validate focus trap/return/Escape equivalent to legacy.

## G2-2-009-060  [P2] GAP  facet F22  effort S
- Legacy: LC:187-199 legacy `attend` row with attendanceStatus, markedBy, audit record
- vNext now: NB:110-170 attendance_records status, markedByUserId, markedAt; 63-109 sessions status
- Fix: Migrate row IDs/mark timestamps; preserve attendance-not-marked distinction.

## G2-2-009-061  [P2] GAP  facet F22  effort S
- Legacy: LC:229-249 GET record absent row can hold past marking timestamp
- vNext now: NB:110-170 absence exception row removed for present; status enum also allows PRESENT
- Fix: Document record deletion vs historical correction audit retention.

## G2-2-009-064  [P2] MISSING  facet F23  effort S
- Legacy: LC:94-130 flat date-range reader has no vNext page equivalent
- vNext now: NS:282-427 month-only service
- Fix: Decide and implement report parity for downstream API clients.

## G2-2-009-005  [P3] GAP  facet F03  effort S
- Legacy: LF:518-521 previous/next month and Export CSV in filter row
- vNext now: NC:395-407 previous/next/type=month, NC:470 export near grid
- Fix: Restore button position, retain optional month picker.

## G2-2-009-027  [P3] GAP  facet F09  effort S
- Legacy: LF:221-237 chooser dialog 'Choose a session — student' and explanatory sentence
- vNext now: NC:742-770 chooser Drawer 'Choose attendance session' with student description
- Fix: Restore exact title, status caption and explanatory text.

## G2-2-009-042  [P3] GAP  facet F13  effort S
- Legacy: LF:122-125 Empty 'No attendance data for this class, course and month'
- vNext now: NC:426-434 different split of no roster/no sessions
- Fix: Retain exact empty copy or approve richer distinctions.

## G2-2-009-051  [P3] GAP  facet F18  effort S
- Legacy: LF:473 exact subtitle Review monthly attendance by class and course, correct recent records...
- vNext now: NP:121 College-wide attendance oversight...
- Fix: Restore exact legacy subtitle and warnings.

## G2-2-009-052  [P3] GAP  facet F18  effort S
- Legacy: LF:477-485 policy 'Late marking allowed for','Minimum attendance'
- vNext now: NC:595-618 retroactive window, minimum attendance
- Fix: Restore legacy card labels and help text.

## G2-2-009-053  [P3] GAP  facet F18  effort S
- Legacy: LF:150-156 legend N and 2/3 ratio; LF:171 '% month'
- vNext now: NC:589-591 legend N replaced em-dash, S future and code E/M/L
- Fix: Match legend and multi-session ratio wording.
