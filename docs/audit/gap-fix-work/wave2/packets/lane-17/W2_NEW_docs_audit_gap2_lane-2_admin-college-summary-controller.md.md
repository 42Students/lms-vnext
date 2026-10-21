# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-2/admin-college-summary-controller.md

21 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-2/admin-college-summary-controller.md

## G2-2-013-001  [P2] GAP  facet F01  effort S
- Legacy: LC:34-39 GET /api/v1/admin/college-summary
- vNext now: NP:23-66 /college server page uses NS:13-19, no public summary REST route
- Fix: Document typed SSR replacement/serve secured compatibility endpoint if clients remain.

## G2-2-013-002  [P2] GAP  facet F01  effort S
- Legacy: LF:61-65 'At a glance' section beneath greeting
- vNext now: NP:132 CollegeDashboardCards following college metadata and other actions
- Fix: Restore summary directly below greeting.

## G2-2-013-003  [P2] GAP  facet F02  effort S
- Legacy: LF:74-91 four AntD Card/Statistic tiles xs12 sm6
- vNext now: NC:15-20 1-col mobile md2 lg4 StatTile grid
- Fix: Match two-column mobile layout with legacy icon/number typography.

## G2-2-013-004  [P2] GAP  facet F02  effort S
- Legacy: LF:64-65 heading plus in-place Retry on error
- vNext now: NC:16 heading, NP:132 section failure separate ErrorState
- Fix: Show inline Retry in card heading and preserve previous success.

## G2-2-013-006  [P2] GAP  facet F03  effort S
- Legacy: LF:64-69 Retry button on failure/refresh
- vNext now: NP:132 failed section ErrorState link to /college, no per-section retry button
- Fix: Add inline Retry with loading feedback.

## G2-2-013-007  [P2] GAP  facet F04  effort S
- Legacy: LC:76-102 four keys studentCount,facultyCount,courseCount,activeDriveCount
- vNext now: NM:17-20 cards keys students,faculty,course-list,jobs; same four labels
- Fix: Map DTO fields exactly for exported REST clients.

## G2-2-013-008  [P2] GAP  facet F04  effort S
- Legacy: LC:98 countActiveByCollegeId of jobs
- vNext now: NL:94-96 PUBLISHED and not archived placementJobs
- Fix: Verify actual legacy ACTIVE drive status semantics vs published-only; reconcile if active != published.

## G2-2-013-010  [P2] GAP  facet F04  effort S
- Legacy: LC:84 facultyRepository.countByCollegeId
- vNext now: NL:76-79 counts active FACULTY membership roles
- Fix: Validate legacy faculty status/include deleted differences and role multiplicity.

## G2-2-013-011  [P2] GAP  facet F04  effort S
- Legacy: LC:90-92 courseRepository.fetchByCollegeIdPaged total
- vNext now: NL:39-41 counts only ACTIVE courses
- Fix: Confirm legacy excludes deleted and inactive equivalently.

## G2-2-013-013  [P2] GAP  facet F06  effort S
- Legacy: LC:62 requires collegeId positive integer, no user-editable field
- vNext now: NS:16 schema strict empty, NL:16-26 derived current membership
- Fix: Document identifier and scope contract switch; never trust caller-supplied college.

## G2-2-013-017  [P2] GAP  facet F09  effort S
- Legacy: LF:67-73 inline red Alert for complete summary failure and warning for stale values
- vNext now: NP:132 CollegeDashboardSectionFailure full-width error, no stale warning
- Fix: Restore inline red/warning alert variants and retained last success.

## G2-2-013-023  [P2] GAP  facet F12  effort S
- Legacy: LC:98 activeDriveCount jobRepository.countActiveByCollegeId
- vNext now: NL:94-96 published,not archived placements
- Fix: Confirm if accepted/open/expired statuses differ from legacy job active definition.

## G2-2-013-024  [P2] GAP  facet F13  effort S
- Legacy: LF:78-87 Skeleton per tile while loading
- vNext now: NP:23-66 SSR waits allSettled; NC:15-20 no local skeleton
- Fix: Add loading UI for summary stat strip.

## G2-2-013-025  [P2] GAP  facet F13  effort S
- Legacy: LF:68-73 keeps prior counts on same-college refresh failure
- vNext now: NP:132 full failed section, no prior data cache
- Fix: Retain last successful same-college totals with warning.

## G2-2-013-029  [P2] GAP  facet F16  effort S
- Legacy: LF:75-91 mobile xs12 two columns, small 4
- vNext now: NC:17 one col until md, 2 until lg, 4 large
- Fix: Match xs two-column and sm four-column breakpoints.

## G2-2-013-036  [P2] GAP  facet F21  effort S
- Legacy: LC:41-51 repositories learner/faculty/course/jobs
- vNext now: NL:33-97 Drizzle joins role/course/placements and other setup tables
- Fix: Map old counts to new relational schema and compare fixture totals.

## G2-2-013-037  [P2] GAP  facet F22  effort S
- Legacy: LC:76-102 legacy learner/faculty/course/job entity IDs
- vNext now: NL:76-97 collegeMemberships, membershipRoles, placementJobs, courses
- Fix: Document identity/status migration mapping; no migration of old data expected, but behavioral parity matters.

## G2-2-013-005  [P3] GAP  facet F03  effort S
- Legacy: LF:55-58 icon UserOutlined/TeamOutlined/BookOutlined/SolutionOutlined per stat
- vNext now: NC:18 StatTile label/count no icon
- Fix: Restore exact legacy icon per metric.

## G2-2-013-030  [P3] GAP  facet F17  effort S
- Legacy: LF:78-87 Statistic icon and title in accessible Card
- vNext now: NC:18 StatTile link with label/count
- Fix: Ensure icon hidden decoratively, contextual link is keyboard operable.

## G2-2-013-032  [P3] GAP  facet F18  effort S
- Legacy: LF:68 `Couldn't load college summary`; LF:72 `Summary refresh failed`
- vNext now: NP:132 `At a glance` ErrorState Could not load right now
- Fix: Restore exact error and stale-warning wording.

## G2-2-013-040  [P3] GAP  facet F23  effort S
- Legacy: LF:55-58 four concise stat cards, icon prefix
- vNext now: NC:15-20 four linked tiles but no prefix icon
- Fix: Restore exact tile visual values and state sequence.
