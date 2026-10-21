# Work packet: NEW / MISSING items from docs/audit/gap2/lane-2/admin-college-dashboard-controller.md

11 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-2/admin-college-dashboard-controller.md

## G2-2-012-032  [P0] GAP  facet F12  effort S
- Legacy: LC:160-170 attendance under threshold based on ALL marked sessions not exception records
- vNext now: NR:28-50 starts from `attendanceRecords`, counts only exceptions; no implicit present rows
- Fix: Rewrite at-risk query FROM marked attendanceSessions CROSS JOIN eligible enrolled learners LEFT JOIN exceptions; missing record = PRESENT. This is a fundamental false-risk dashboard calculation.

## G2-2-012-052  [P0] GAP  facet F20  effort S
- Legacy: LC:166-170 `attendance_marked_at` required, absence exceptions counted only against marks
- vNext now: NR:33-50 exceptions inner-joined marked session
- Fix: Fix denominator/roster query to include every learner/session combination.

## G2-2-012-057  [P0] GAP  facet F23  effort S
- Legacy: LC:160-177 accurate risk by marked sessions
- vNext now: NR:28-50 miscounts absence exceptions as denominator
- Fix: Do not present misleading eligibility-risk alerts; correct query before adoption.

## G2-2-012-011  [P1] GAP  facet F04  effort S
- Legacy: LC:161-177 attendanceAtRisk count, 8 rows learnerId,name,rollNumber,className,held,absent,percent
- vNext now: NR:28-61 returns membershipId/displayName/marked/attended/percent, no roll/class or total
- Fix: Return safe roll, class, total and correct percentage semantics, including implicit present marks.

## G2-2-012-017  [P1] GAP  facet F05  effort S
- Legacy: LC:174 at-risk ORDER lowest attendance ratio then held DESC
- vNext now: NR:50 ORDER present divided by total exceptions; denominators wrong
- Fix: Compute marked sessions per learner INCLUDING implicit PRESENT, then sort lowest percent.

## G2-2-012-029  [P1] GAP  facet F11  effort S
- Legacy: LC:79-83 superadmin or collegeadmin scoped via AccessControl
- vNext now: NP:24-37 requires membership; superadmin selected college without membership cannot render this page
- Fix: Provide selected-college Super Admin admin dashboard access via approved acting scope.

## G2-2-012-033  [P1] GAP  facet F12  effort S
- Legacy: LC:170 HAVING marked>0 and attendance ratio below threshold
- vNext now: NR:49 counts only marked exception rows; excludes 100%-present learners but wrongly labels any absence
- Fix: Use complete denominator of marked sessions and protect zero denominator.

## G2-2-012-034  [P1] GAP  facet F12  effort S
- Legacy: LC:140-152 pending ended last7 days, markedAt null, total exact
- vNext now: NA:29-67 fetch starting6 days ago, cap 2000, reverse after query
- Fix: Query full rolling 7 days bounded with accurate COUNT(*) instead of silently truncated total.

## G2-2-012-049  [P1] GAP  facet F19  effort S
- Legacy: LC:47 list cap8+count exact
- vNext now: NA:52 cap2000 pre-filter, NR:51 cap200, NU:42 cap300, NG:40 cap100
- Fix: Add independent COUNT(*) separate from limited preview and avoid hidden totals.

## G2-2-012-054  [P1] GAP  facet F22  effort S
- Legacy: LC:160-170 joins learner,class_schedule,attend; LC:180-190 student_assignment
- vNext now: NR:28-50 exception-based attendanceRecords joins; NG:26-40 courseAssignments/assignmentSubmissions
- Fix: Map legacy data relationships, especially implicit present and grading statuses.

## G2-2-012-023  [P3] GAP  facet F07  effort S
- Legacy: LC:76-82 precise 400 collegeId error, 401 Authentication required
- vNext now: NP:27-45 missing-scope EmptyState and protected server context
- Fix: Provide equivalent denial/not-assigned messaging without ID leak.
