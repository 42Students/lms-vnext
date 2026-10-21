# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-2/admin-college-dashboard-controller.md

33 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-2/admin-college-dashboard-controller.md

## G2-2-012-001  [P2] GAP  facet F01  effort S
- Legacy: LC:38-43 GET /api/v1/admin/college-dashboard
- vNext now: NP:23-66 SSR data orchestration in /college, no old GET endpoint
- Fix: Document old data contract break or provide secured compatibility read API.

## G2-2-012-002  [P2] GAP  facet F01  effort S
- Legacy: LF:125-130 'Needs attention' Today cards inside old dashboard
- vNext now: NP:67-134 PageHeader/edit college/actions/card and quizzes before Today
- Fix: Restore needs-attention-first layout.

## G2-2-012-003  [P2] GAP  facet F02  effort S
- Legacy: LF:137-149 compact today bar then 2/3-column attention cards
- vNext now: NP:98-132 metadata and generic KPI cards then Today separate tiles
- Fix: Match 3-counter band/cards ordering and density.

## G2-2-012-004  [P2] GAP  facet F02  effort S
- Legacy: LF:149-237 six 3-column AttentionCards, with headings/count badges/footer link
- vNext now: NP:135-295 separate border sections and table/lists, no matching card grid
- Fix: Restore 6-card visual grid, heading icons, count chips, footers.

## G2-2-012-005  [P2] MISSING  facet F03  effort S
- Legacy: LF:128-130 small Refresh button with ReloadOutlined on attention board
- vNext now: NP:67-295 no manual Refresh button shown
- Fix: Provide Refresh control that reloads seven independent feeds.

## G2-2-012-007  [P2] GAP  facet F03  effort S
- Legacy: LF:53-62 'and N more' after 8 preview items
- vNext now: NP:169-178 list 20 unattended; service NA:62 limit20, other lists 100/300
- Fix: Show first 8 preview items + `and N more` link where total larger.

## G2-2-012-010  [P2] GAP  facet F04  effort S
- Legacy: LC:149-152 attendancePending count + 8 rows (scheduleId,startTime,title,class/course/faculty)
- vNext now: NA:62-67 attendance.unattended count + up to20 rows; no courseName
- Fix: Include course label and use 8-row preview/accurate total.

## G2-2-012-012  [P2] GAP  facet F04  effort S
- Legacy: LC:181-190 gradingBacklog count and oldest, 8 course groups descending pending count
- vNext now: NG:20-40 grouped pending/oldest max100 ascending oldest date, no whole count
- Fix: Return total pending and sort biggest backlog first.

## G2-2-012-013  [P2] GAP  facet F04  effort S
- Legacy: LC:198-211 unstaffed count + 8 section/course/semester pairs
- vNext now: NU:20-55 groups up to300 deliveries by course, no semester
- Fix: Show individual section-course staffing gaps with term label; count distinct gaps.

## G2-2-012-015  [P2] GAP  facet F04  effort S
- Legacy: LC:235-246 due quiz count + 8 title/due/course/class
- vNext now: NQ:13-28 10 quizzes title,due,course, no className
- Fix: Restore class audience label, cap8.

## G2-2-012-016  [P2] GAP  facet F05  effort S
- Legacy: LC:47 LIST_LIMIT=8 for all attention rows
- vNext now: NA:62 20, NR:51 200, NG:40 100, NU:42 300, NQ:26 10
- Fix: Use consistent eight-item preview and total counts, with explicit More link.

## G2-2-012-018  [P2] GAP  facet F05  effort S
- Legacy: LC:190 backlog ORDER COUNT(*) DESC
- vNext now: NG:39 ORDER oldest ascending
- Fix: Restore highest-volume backlog first with oldest date tie-break.

## G2-2-012-019  [P2] GAP  facet F05  effort S
- Legacy: LC:152 attendance pending newest first
- vNext now: NA:51 ASC then .reverse() after cap2000
- Fix: Order DESC in DB with bounded and accurate total; 2000 cap hides overflow.

## G2-2-012-026  [P2] GAP  facet F09  effort S
- Legacy: LF:23-47 AntD Card displays failed, loading, clear states
- vNext now: NP:132-134 and NE:5-10 ErrorState with Retry link; not same card shell
- Fix: Preserve per-card loading/failed/all-clear state styling.

## G2-2-012-030  [P2] GAP  facet F11  effort S
- Legacy: LC:49-57 tenant join and suspended/deleted learner filters
- vNext now: NR:38-47 joins departments/active membership; excludes missing roster?
- Fix: Confirm student inclusion/learner class fallback without cross-tenant leakage.

## G2-2-012-031  [P2] GAP  facet F12  effort S
- Legacy: LC:35-36 dates IST wall-clock, thresholds tenant-configured
- vNext now: NA:12-19 IST shift, NR:46 now-30 calendar days, NQ:12 now+7d
- Fix: Align week window to India midnight, quiz horizon to today+8 start.

## G2-2-012-035  [P2] GAP  facet F12  effort S
- Legacy: LC:180-190 any NOT_GRADED student_assignment
- vNext now: NG:36-37 only assignment status PUBLISHED
- Fix: Verify legacy disabled/unpublished grade backlog parity; if intentional, document exclusion.

## G2-2-012-036  [P2] GAP  facet F12  effort S
- Legacy: LC:198-207 current semester class-course no faculty
- vNext now: NU:38-41 academicPeriod ACTIVE/delivery without current teaching assignment
- Fix: Check parity of current batch semester and elective inclusion.

## G2-2-012-037  [P2] GAP  facet F12  effort S
- Legacy: LC:235-246 due >=now and < today+8d (IST)
- vNext now: NQ:12,22-23 >now and <= now+7*24h
- Fix: Use same calendar-week window boundary inclusive/exclusive rules.

## G2-2-012-038  [P2] GAP  facet F13  effort S
- Legacy: LF:38-42 each card loading skeleton, clear state, failure line
- vNext now: NP:49-66 SSR outputs sections after requests, loading skeleton not part of source page
- Fix: Add route loading.tsx and card-level progressive skeleton for slow section queries.

## G2-2-012-039  [P2] GAP  facet F13  effort S
- Legacy: LF:104-109 retry on full first-load failure
- vNext now: NE:5-10 Retry link to /college causes whole navigation
- Fix: Add in-place per-card retry and optional cached last good state.

## G2-2-012-040  [P2] GAP  facet F13  effort S
- Legacy: LF:131-134 refresh failed, keeps previous same-college data
- vNext now: NP:23-66 SSR full refresh, no retained last-good view
- Fix: Preserve last successful same-college dashboard on refresh errors.

## G2-2-012-044  [P2] GAP  facet F16  effort S
- Legacy: LF:149 AntD 24-grid xs24/lg12/xl8
- vNext now: NP:135-295 independent sections/table/mobile responsive
- Fix: Match 1/2/3 attention cards breakpoint layout.

## G2-2-012-045  [P2] GAP  facet F17  effort S
- Legacy: LF:125-129 aria Needs attention, Refresh button
- vNext now: NP:67-295 headings and links; no Needs attention board landmark
- Fix: Restore landmark and refresh semantics for keyboard/screen readers.

## G2-2-012-051  [P2] GAP  facet F20  effort S
- Legacy: LC:91-99 'weekAgo' midnight today-7, 'monthAgo' today-30, 'weekAhead' today+8
- vNext now: NA:30 start-6 days; NR:46 now-30d; NQ:12 now+7d
- Fix: Use IST calendar start boundaries rather than rolling hours.

## G2-2-012-055  [P2] GAP  facet F22  effort S
- Legacy: LC:218-231 batches/classes/students/courses setup gaps
- vNext now: NS:20-60 corresponding cohorts/sections/enrollments/offerings/lessons
- Fix: Verify active-vs-archived equivalent filters after schema conversion.

## G2-2-012-056  [P2] GAP  facet F23  effort S
- Legacy: LF:125-149 'Today' then six AttentionCards
- vNext now: NP:67-133 metadata and closing quizzes before Today/needs attention
- Fix: Restore old dashboard attention-first hierarchy.

## G2-2-012-006  [P3] GAP  facet F03  effort S
- Legacy: LF:23-47 card icons, total in extra header and all-clear green icon
- vNext now: NP:133-295 headings+lists, no per-card icon/count header style
- Fix: Match legacy icons/chips and all-clear semantics.

## G2-2-012-008  [P3] GAP  facet F04  effort S
- Legacy: LC:101-111 seven section keys+generatedAt+attendanceThreshold
- vNext now: NP:49-66 seven separate Promise.allSettled result objects; no generatedAt in view
- Fix: Expose shared IST generated timestamp and threshold value if needed.

## G2-2-012-020  [P3] GAP  facet F05  effort S
- Legacy: LC:211 unstaffed sorted class name, course name
- vNext now: NU:42 sorts courses name, sections name
- Fix: Restore class-first order.

## G2-2-012-041  [P3] GAP  facet F13  effort S
- Legacy: LF:23-47 zero count has green all-clear check
- vNext now: NP:165-168 custom plain all-clear text
- Fix: Restore visually distinct cleared state.

## G2-2-012-047  [P3] GAP  facet F18  effort S
- Legacy: LF:181 'Waiting to be graded', LF:195 'Courses with no teacher', LF:209 'Setup gaps'
- vNext now: NP:195-295 separate dashboard sections with own headings; not six equal cards
- Fix: Match exact heading labels and counts on cards.

## G2-2-012-048  [P3] GAP  facet F18  effort S
- Legacy: LF:153 empty 'Every class held in last 7 days has attendance'
- vNext now: NP:167 'All held sessions have attendance recorded.'
- Fix: Restore exact empty wording.
