# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-2/admin-assignment-publish-controller.md

20 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-2/admin-assignment-publish-controller.md

## G2-2-008-002  [P2] GAP  facet F01  effort S
- Legacy: LF:365-371 Publish grades button in each assignment table row
- vNext now: NP:91-94 button inside per-Section submissions disclosure
- Fix: Surface publishing action from assignment row with same disabled rules.

## G2-2-008-004  [P2] GAP  facet F03  effort S
- Legacy: LF:365-371 Publish grades with Popconfirm title and description
- vNext now: NP:29-33 window.confirm and NP:91-94 Publish grades
- Fix: Use ConfirmDialog and exact legacy wording.

## G2-2-008-005  [P2] GAP  facet F03  effort S
- Legacy: LF:365-370 disabled when stats.totalGraded === 0 with tooltip Nothing graded yet
- vNext now: NP:91-94 disabled only bulkBusy
- Fix: Disable when no grades and show the same tooltip.

## G2-2-008-006  [P2] GAP  facet F04  effort S
- Legacy: LC:126-130 response published, skippedUngraded, alreadyPublished, failed[{studentAssignmentId,studentId,reason}]
- vNext now: NP:35-64 tracks only published,failedIds,failed count; no ungraded/alreadyPublished breakdown
- Fix: Track and display all four distinct counters and per-row reason.

## G2-2-008-007  [P2] GAP  facet F04  effort S
- Legacy: LC:110-115 response exposes failed student IDs/reasons only after authorize all
- vNext now: NP:56-58 failed row IDs collected but no reason
- Fix: Return accessible failure details without exposing learner IDs across tenants.

## G2-2-008-008  [P2] GAP  facet F05  effort S
- Legacy: LC:85-87 first page 1000 by created_at DESC
- vNext now: NP:41-46 paginates every Section's submissions, page order by repository
- Fix: Specify stable batch snapshot and deterministic sort; avoid skips on live concurrent changes.

## G2-2-008-010  [P2] GAP  facet F06  effort S
- Legacy: LC:70-72 path ID must positive integer
- vNext now: NR:31-37 submission UUID, NV:169-172 integer version
- Fix: Validate assignment identity UUID and exact college scope at bulk boundary.

## G2-2-008-018  [P2] GAP  facet F09  effort S
- Legacy: LF:365-371 Popconfirm; LF:305-309 failed modal
- vNext now: NP:30-33 native window.confirm; NP:96-101 inline Alert
- Fix: Use shared accessible dialog and reviewable failure table.

## G2-2-008-022  [P2] GAP  facet F10  effort S
- Legacy: LC:85-86 server loads first 1000 once, predictable snapshot
- vNext now: NP:41-61 client fetches pages and issues network requests per grade
- Fix: Design resumable bounded bulk path robust to tab closes and network disconnections.

## G2-2-008-028  [P2] GAP  facet F13  effort S
- Legacy: LC:108-115 failures returned with reason; no abort
- vNext now: NP:50-64 count only and retry; NP:66-69 whole-page errors can retain partial count
- Fix: Track failed reason/status and partial completion across navigations.

## G2-2-008-030  [P2] GAP  facet F13  effort S
- Legacy: LF:365-371 disables when no graded records
- vNext now: NP:91-94 action available whenever PUBLISHED, even zero grade rows
- Fix: Disable or show no-op informative state instead of confusing '0 published'.

## G2-2-008-033  [P2] GAP  facet F15  effort S
- Legacy: LC:118-124 optional AdminAuditLogService summary action
- vNext now: NS:866-881 individual activity events; no summary
- Fix: Emit summary audit while retaining individual trail.

## G2-2-008-035  [P2] GAP  facet F17  effort S
- Legacy: LF:365-371 Popconfirm keyboard focus/Cancel
- vNext now: NP:30-33 window.confirm blocks UI, native focus dependent
- Fix: Use UI-managed dialog with accessible focus return and descriptive button.

## G2-2-008-038  [P2] GAP  facet F19  effort S
- Legacy: LC:32-35 one HTTP invocation, server loops; constant 1 browser request
- vNext now: NP:41-58 1 page GET per page plus N publish POSTs
- Fix: Shift bulk work server-side or bounded chunk endpoint to avoid high latency/timeouts.

## G2-2-008-040  [P2] GAP  facet F20  effort S
- Legacy: LC:95-107 idempotent skip gradePublished, independent commits
- vNext now: NS:835-842 expects version, returns current for already published if fresh token
- Fix: On retry refresh versions from server, avoid treating stale token as permanent failure.

## G2-2-008-044  [P2] GAP  facet F22  effort S
- Legacy: LC:111-114 failure payload has studentAssignmentId,studentId,reason
- vNext now: NB:140-155 membershipId rather than stored studentId, private identity
- Fix: Use scoped recipient label in failure diagnostics, never leak raw IDs to unauthorized users.

## G2-2-008-011  [P3] GAP  facet F06  effort S
- Legacy: LC:94-102 skip already published first then ungraded
- vNext now: NP:48-49 skips ungraded or published; same effect, counters absent
- Fix: Preserve skip classification and counts, not just effect.

## G2-2-008-025  [P3] GAP  facet F12  effort S
- Legacy: LC:94-115 skip ungraded/already published but do not count those as errors
- vNext now: NP:47-59 skips them; counts only failed published attempts
- Fix: Surface skip counts explicitly in output.

## G2-2-008-034  [P3] GAP  facet F16  effort S
- Legacy: LC:41-139 backend only; LF:365-371 compact button/popconfirm
- vNext now: NP:87-101 responsive buttons + alerts
- Fix: Use equivalent touch affordances and accessible confirmation on mobile.

## G2-2-008-036  [P3] GAP  facet F18  effort S
- Legacy: LF:365-370 tooltip 'Nothing graded yet', 'Publish all graded submissions?'
- vNext now: NP:31-32 'Publish grades for every graded submission in this Section?'
- Fix: Restore exact wording and explain Section-only scope.
