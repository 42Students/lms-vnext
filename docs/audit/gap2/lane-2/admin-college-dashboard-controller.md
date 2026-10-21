# U012 — AdminCollegeDashboardController gap audit v2

## File map and closure
- `LC` = `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCollegeDashboardController.java`
- `LF` = `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js`
- `NP` = `src/app/(authenticated)/college/page.tsx`
- `NA` = `src/modules/admin-ui/college-dashboard-attendance-service.ts`
- `NR` = `src/modules/admin-ui/college-dashboard-risk-service.ts`
- `NG` = `src/modules/admin-ui/college-dashboard-grading-service.ts`
- `NU` = `src/modules/admin-ui/college-dashboard-staffing-service.ts`
- `NS` = `src/modules/admin-ui/college-dashboard-setup-gaps-service.ts`
- `NQ` = `src/modules/admin-ui/college-dashboard-quizzes-service.ts`
- `NE` = `src/components/admin/college-dashboard-section-failure.tsx`

Legacy SQL-backed 7-section controller and actual AttentionBoard, vNext college SSR dashboard and independent attendance/risk/grading/staffing/setup/quiz services. References `LC:129-137` are alias path plus 1-based lines. The vNext risk query is a source-confirmed semantic defect (FROM attendance_records only, whereas present rows are implicit) and is classified P0 because it can misstate eligibility alerts. This document is an audit; no code changed.

## Mandatory facets
| ID | Facet | Legacy behaviour (file:line) | vNext behaviour (file:line or NONE) | Verdict | Severity | Concrete fix | Effort |
|---|---|---|---|---|---|---|---|
| G2-2-012-001 | F01 | LC:38-43 GET /api/v1/admin/college-dashboard | NP:23-66 SSR data orchestration in /college, no old GET endpoint | GAP | P2 | Document old data contract break or provide secured compatibility read API. | S |
| G2-2-012-002 | F01 | LF:125-130 'Needs attention' Today cards inside old dashboard | NP:67-134 PageHeader/edit college/actions/card and quizzes before Today | GAP | P2 | Restore needs-attention-first layout. | S |
| G2-2-012-003 | F02 | LF:137-149 compact today bar then 2/3-column attention cards | NP:98-132 metadata and generic KPI cards then Today separate tiles | GAP | P2 | Match 3-counter band/cards ordering and density. | S |
| G2-2-012-004 | F02 | LF:149-237 six 3-column AttentionCards, with headings/count badges/footer link | NP:135-295 separate border sections and table/lists, no matching card grid | GAP | P2 | Restore 6-card visual grid, heading icons, count chips, footers. | S |
| G2-2-012-005 | F03 | LF:128-130 small Refresh button with ReloadOutlined on attention board | NP:67-295 no manual Refresh button shown | MISSING | P2 | Provide Refresh control that reloads seven independent feeds. | S |
| G2-2-012-006 | F03 | LF:23-47 card icons, total in extra header and all-clear green icon | NP:133-295 headings+lists, no per-card icon/count header style | GAP | P3 | Match legacy icons/chips and all-clear semantics. | S |
| G2-2-012-007 | F03 | LF:53-62 'and N more' after 8 preview items | NP:169-178 list 20 unattended; service NA:62 limit20, other lists 100/300 | GAP | P2 | Show first 8 preview items + `and N more` link where total larger. | S |
| G2-2-012-008 | F04 | LC:101-111 seven section keys+generatedAt+attendanceThreshold | NP:49-66 seven separate Promise.allSettled result objects; no generatedAt in view | GAP | P3 | Expose shared IST generated timestamp and threshold value if needed. | S |
| G2-2-012-009 | F04 | LC:134-136 classCount,heldCount,markedCount | NA:57-61 scheduled,held,marked equivalent | MATCH | P3 | No change. | S |
| G2-2-012-010 | F04 | LC:149-152 attendancePending count + 8 rows (scheduleId,startTime,title,class/course/faculty) | NA:62-67 attendance.unattended count + up to20 rows; no courseName | GAP | P2 | Include course label and use 8-row preview/accurate total. | S |
| G2-2-012-011 | F04 | LC:161-177 attendanceAtRisk count, 8 rows learnerId,name,rollNumber,className,held,absent,percent | NR:28-61 returns membershipId/displayName/marked/attended/percent, no roll/class or total | GAP | P1 | Return safe roll, class, total and correct percentage semantics, including implicit present marks. | S |
| G2-2-012-012 | F04 | LC:181-190 gradingBacklog count and oldest, 8 course groups descending pending count | NG:20-40 grouped pending/oldest max100 ascending oldest date, no whole count | GAP | P2 | Return total pending and sort biggest backlog first. | S |
| G2-2-012-013 | F04 | LC:198-211 unstaffed count + 8 section/course/semester pairs | NU:20-55 groups up to300 deliveries by course, no semester | GAP | P2 | Show individual section-course staffing gaps with term label; count distinct gaps. | S |
| G2-2-012-014 | F04 | LC:216-232 4 setup gap counts | NS:20-60 same 4 categories with revised modern schema | MATCH | P3 | Preserve four category semantics. | S |
| G2-2-012-015 | F04 | LC:235-246 due quiz count + 8 title/due/course/class | NQ:13-28 10 quizzes title,due,course, no className | GAP | P2 | Restore class audience label, cap8. | S |
| G2-2-012-016 | F05 | LC:47 LIST_LIMIT=8 for all attention rows | NA:62 20, NR:51 200, NG:40 100, NU:42 300, NQ:26 10 | GAP | P2 | Use consistent eight-item preview and total counts, with explicit More link. | S |
| G2-2-012-017 | F05 | LC:174 at-risk ORDER lowest attendance ratio then held DESC | NR:50 ORDER present divided by total exceptions; denominators wrong | GAP | P1 | Compute marked sessions per learner INCLUDING implicit PRESENT, then sort lowest percent. | S |
| G2-2-012-018 | F05 | LC:190 backlog ORDER COUNT(*) DESC | NG:39 ORDER oldest ascending | GAP | P2 | Restore highest-volume backlog first with oldest date tie-break. | S |
| G2-2-012-019 | F05 | LC:152 attendance pending newest first | NA:51 ASC then .reverse() after cap2000 | GAP | P2 | Order DESC in DB with bounded and accurate total; 2000 cap hides overflow. | S |
| G2-2-012-020 | F05 | LC:211 unstaffed sorted class name, course name | NU:42 sorts courses name, sections name | GAP | P3 | Restore class-first order. | S |
| G2-2-012-021 | F06 | LC:75 collegeId positive required; no user-entered filters | NP:24-45 derived membership, no dashboard form | MATCH | P3 | No user form; protect scoped derived ID. | S |
| G2-2-012-022 | F06 | LC:89-99 runtime policy threshold from tenant setting default75 | NR:23-24 gets college policy row default75 | MATCH | P3 | No change to default. | S |
| G2-2-012-023 | F07 | LC:76-82 precise 400 collegeId error, 401 Authentication required | NP:27-45 missing-scope EmptyState and protected server context | GAP | P3 | Provide equivalent denial/not-assigned messaging without ID leak. | S |
| G2-2-012-024 | F07 | LC:114-122 failed individual DB section returns null | NP:49-66 Promise.allSettled independent feeders | MATCH | P3 | Keep independent section failure resilience. | S |
| G2-2-012-025 | F08 | LC:84-85 HTTP OK returns reasonPhrase OK + map | NP:49-66 SSR no fetch toast | MATCH | P3 | N/A list GET success toast. | S |
| G2-2-012-026 | F09 | LF:23-47 AntD Card displays failed, loading, clear states | NP:132-134 and NE:5-10 ErrorState with Retry link; not same card shell | GAP | P2 | Preserve per-card loading/failed/all-clear state styling. | S |
| G2-2-012-027 | F10 | LC:71-85 one GET builds seven sections concurrently? sequential build via section() calls | NP:49-58 Promise.allSettled seven concurrent services | EXTRA | P3 | Keep parallelism but return coherent generated snapshot timestamp. | S |
| G2-2-012-028 | F10 | LC:114-120 per-section SQL failure returns null, leaves other sections | NP:49-65 allSettled isolates | MATCH | P3 | No change. | S |
| G2-2-012-029 | F11 | LC:79-83 superadmin or collegeadmin scoped via AccessControl | NP:24-37 requires membership; superadmin selected college without membership cannot render this page | GAP | P1 | Provide selected-college Super Admin admin dashboard access via approved acting scope. | S |
| G2-2-012-030 | F11 | LC:49-57 tenant join and suspended/deleted learner filters | NR:38-47 joins departments/active membership; excludes missing roster? | GAP | P2 | Confirm student inclusion/learner class fallback without cross-tenant leakage. | S |
| G2-2-012-031 | F12 | LC:35-36 dates IST wall-clock, thresholds tenant-configured | NA:12-19 IST shift, NR:46 now-30 calendar days, NQ:12 now+7d | GAP | P2 | Align week window to India midnight, quiz horizon to today+8 start. | S |
| G2-2-012-032 | F12 | LC:160-170 attendance under threshold based on ALL marked sessions not exception records | NR:28-50 starts from `attendanceRecords`, counts only exceptions; no implicit present rows | GAP | P0 | Rewrite at-risk query FROM marked attendanceSessions CROSS JOIN eligible enrolled learners LEFT JOIN exceptions; missing record = PRESENT. This is a fundamental false-risk dashboard calculation. | S |
| G2-2-012-033 | F12 | LC:170 HAVING marked>0 and attendance ratio below threshold | NR:49 counts only marked exception rows; excludes 100%-present learners but wrongly labels any absence | GAP | P1 | Use complete denominator of marked sessions and protect zero denominator. | S |
| G2-2-012-034 | F12 | LC:140-152 pending ended last7 days, markedAt null, total exact | NA:29-67 fetch starting6 days ago, cap 2000, reverse after query | GAP | P1 | Query full rolling 7 days bounded with accurate COUNT(*) instead of silently truncated total. | S |
| G2-2-012-035 | F12 | LC:180-190 any NOT_GRADED student_assignment | NG:36-37 only assignment status PUBLISHED | GAP | P2 | Verify legacy disabled/unpublished grade backlog parity; if intentional, document exclusion. | S |
| G2-2-012-036 | F12 | LC:198-207 current semester class-course no faculty | NU:38-41 academicPeriod ACTIVE/delivery without current teaching assignment | GAP | P2 | Check parity of current batch semester and elective inclusion. | S |
| G2-2-012-037 | F12 | LC:235-246 due >=now and < today+8d (IST) | NQ:12,22-23 >now and <= now+7*24h | GAP | P2 | Use same calendar-week window boundary inclusive/exclusive rules. | S |
| G2-2-012-038 | F13 | LF:38-42 each card loading skeleton, clear state, failure line | NP:49-66 SSR outputs sections after requests, loading skeleton not part of source page | GAP | P2 | Add route loading.tsx and card-level progressive skeleton for slow section queries. | S |
| G2-2-012-039 | F13 | LF:104-109 retry on full first-load failure | NE:5-10 Retry link to /college causes whole navigation | GAP | P2 | Add in-place per-card retry and optional cached last good state. | S |
| G2-2-012-040 | F13 | LF:131-134 refresh failed, keeps previous same-college data | NP:23-66 SSR full refresh, no retained last-good view | GAP | P2 | Preserve last successful same-college dashboard on refresh errors. | S |
| G2-2-012-041 | F13 | LF:23-47 zero count has green all-clear check | NP:165-168 custom plain all-clear text | GAP | P3 | Restore visually distinct cleared state. | S |
| G2-2-012-042 | F14 | LC:71-248 dashboard read-only, no download/import/file operations | NP:23-295 dashboard read-only, no import/export | MATCH | P3 | N/A. | S |
| G2-2-012-043 | F15 | LC:71-248 no email/SMS/notification emits in GET | NP:49-58 only reads, no outgoing send | MATCH | P3 | N/A. | S |
| G2-2-012-044 | F16 | LF:149 AntD 24-grid xs24/lg12/xl8 | NP:135-295 independent sections/table/mobile responsive | GAP | P2 | Match 1/2/3 attention cards breakpoint layout. | S |
| G2-2-012-045 | F17 | LF:125-129 aria Needs attention, Refresh button | NP:67-295 headings and links; no Needs attention board landmark | GAP | P2 | Restore landmark and refresh semantics for keyboard/screen readers. | S |
| G2-2-012-046 | F18 | LF:151 'Attendance not taken', LF:165 'Under N% attendance' | NP:153 'Attendance not taken'; risk section heading may differ | UNKNOWN | P3 | Inspect full NP 195-250 text; align exact risk copy. | S |
| G2-2-012-047 | F18 | LF:181 'Waiting to be graded', LF:195 'Courses with no teacher', LF:209 'Setup gaps' | NP:195-295 separate dashboard sections with own headings; not six equal cards | GAP | P3 | Match exact heading labels and counts on cards. | S |
| G2-2-012-048 | F18 | LF:153 empty 'Every class held in last 7 days has attendance' | NP:167 'All held sessions have attendance recorded.' | GAP | P3 | Restore exact empty wording. | S |
| G2-2-012-049 | F19 | LC:47 list cap8+count exact | NA:52 cap2000 pre-filter, NR:51 cap200, NU:42 cap300, NG:40 cap100 | GAP | P1 | Add independent COUNT(*) separate from limited preview and avoid hidden totals. | S |
| G2-2-012-050 | F19 | LC:114-122 isolates each section's query failure | NP:49-66 Promise.allSettled seven queries | MATCH | P3 | Keep isolation. | S |
| G2-2-012-051 | F20 | LC:91-99 'weekAgo' midnight today-7, 'monthAgo' today-30, 'weekAhead' today+8 | NA:30 start-6 days; NR:46 now-30d; NQ:12 now+7d | GAP | P2 | Use IST calendar start boundaries rather than rolling hours. | S |
| G2-2-012-052 | F20 | LC:166-170 `attendance_marked_at` required, absence exceptions counted only against marks | NR:33-50 exceptions inner-joined marked session | GAP | P0 | Fix denominator/roster query to include every learner/session combination. | S |
| G2-2-012-053 | F21 | LC:60-64 NamedParameterJdbcTemplate optional/AppSettingsService optional | NA/NR/NG/NU/NS/NQ Drizzle services required, no nullable JDBC field | EXTRA | P3 | Retain fail-closed DB readiness and section-specific degraded UX. | S |
| G2-2-012-054 | F22 | LC:160-170 joins learner,class_schedule,attend; LC:180-190 student_assignment | NR:28-50 exception-based attendanceRecords joins; NG:26-40 courseAssignments/assignmentSubmissions | GAP | P1 | Map legacy data relationships, especially implicit present and grading statuses. | S |
| G2-2-012-055 | F22 | LC:218-231 batches/classes/students/courses setup gaps | NS:20-60 corresponding cohorts/sections/enrollments/offerings/lessons | GAP | P2 | Verify active-vs-archived equivalent filters after schema conversion. | S |
| G2-2-012-056 | F23 | LF:125-149 'Today' then six AttentionCards | NP:67-133 metadata and closing quizzes before Today/needs attention | GAP | P2 | Restore old dashboard attention-first hierarchy. | S |
| G2-2-012-057 | F23 | LC:160-177 accurate risk by marked sessions | NR:28-50 miscounts absence exceptions as denominator | GAP | P0 | Do not present misleading eligibility-risk alerts; correct query before adoption. | S |

## Unit summary
- 57 rows; verdicts GAP 43; MISSING 1; MATCH 10; EXTRA 2; UNKNOWN 1, severity P2 27; P3 20; P1 7; P0 3.
- **P0:** At-risk attendance denominator uses only explicit attendanceRecords (absence/late/etc. exceptions), whereas actual PRESENT rows are implicit after a session is marked. Existing NR:28-50 query cannot compute the correct marked-session percentage; rewrite cohort/session/LEFT JOIN exceptions first, then HAVING threshold (F12/F20/F23).
- **P1:** Today/attendance pending query is capped at 2000 before totals, and date window differs by day; dashboard may suppress older rows and inaccurate counts (F12/F19).
- **P1/P2:** Legacy seven independent cards and exact 8-item preview/total, title, 'and N more', failure skeleton/refresh not mirrored by vNext separate sections and varied caps. Keep Promise.allSettled isolation (F02/F05/F13).

### UNKNOWN / live checks
- Verify at-risk percent against sample learner who attended 9 marked sessions and was absent for only 1: expected 90%; existing exceptions-only query would return 0%, a clear reproduction.
- Confirm Super Admin selected-college dashboard route, 375/768/1280 styling, and whether the production DB guarantees mark/exception integrity.
