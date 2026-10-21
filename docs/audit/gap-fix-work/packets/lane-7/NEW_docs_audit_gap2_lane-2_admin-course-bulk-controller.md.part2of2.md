# Work packet: NEW / MISSING items from docs/audit/gap2/lane-2/admin-course-bulk-controller.md (part 2 of 2)

7 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-2/admin-course-bulk-controller.md

## G2-2-014-050  [P1] GAP  facet F23  effort S
- Legacy: LF:595-620 cross-page selection
- vNext now: NP:21-25 page-only selection
- Fix: Restore selection across paginated catalog while isolating acting-college scopes.

## G2-2-014-016  [P2] GAP  facet F07  effort S
- Legacy: LC:89-90 'Maximum N courses per bulk update'
- vNext now: NS:13 max100 Zod error
- Fix: Use configured N in both validation and message.

## G2-2-014-017  [P2] GAP  facet F07  effort S
- Legacy: LC:92-93 'Set at least one of active, enabled or allowedForDisplay'
- vNext now: NS:14 requires only visibleToStudents
- Fix: Validate partial flag updates; retain legacy error.

## G2-2-014-018  [P2] GAP  facet F07  effort S
- Legacy: LC:95-97 'allowedForDisplay must be 0 or 1'
- vNext now: NS:14 typed boolean prevents old body format
- Fix: Support safe versioned legacy body mapping.

## G2-2-014-020  [P2] GAP  facet F08  effort S
- Legacy: LC:150-151 'Updated X of Y course(s)'
- vNext now: NP:77-79 'X updated · Y unchanged · Z failed' content-level counts
- Fix: Include per-course requested/updated counts in summary.

## G2-2-014-021  [P2] GAP  facet F08  effort S
- Legacy: LF:576-590 partly completed banner with up to 5 per-course failed reasons
- vNext now: NP:77-84 generic lesson failures count, retry only
- Fix: Show sanitized per-course failure details and partial-success warning.

## G2-2-014-015  [P3] GAP  facet F07  effort S
- Legacy: LC:86-87 'courseIds is required and must not be empty'
- vNext now: NS:13 Zod array min1, NR:13 generic apiErrorResponse
- Fix: Surface exact empty selection message.
