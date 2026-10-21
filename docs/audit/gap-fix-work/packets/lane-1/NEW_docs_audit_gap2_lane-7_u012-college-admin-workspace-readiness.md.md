# Work packet: NEW / MISSING items from docs/audit/gap2/lane-7/u012-college-admin-workspace-readiness.md

3 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u012-college-admin-workspace-readiness.md

## G2-7-012-035  [P1] GAP  facet F12  effort M
- Legacy: ProjectReadinessDTO.java:14-19 explicit releases informational, not submission gate
- vNext now: readiness-service.ts:100-107 requires all releases shipped for executionComplete
- Fix: Remove release gate or record explicit business decision

## G2-7-012-059  [P1] GAP  facet F22  effort M
- Legacy: ProjectReadinessDTO.java:7-27 flat counts override submission status
- vNext now: readiness-service.ts:117-155 nested execution and finalSubmission fields
- Fix: Make explicit field projection/migration mapping

## G2-7-012-060  [P1] GAP  facet F22  effort M
- Legacy: ProjectReadinessDTO.java:14-19 release status informational
- vNext now: readiness-service.ts:100-107 release gate
- Fix: Fix submission eligibility business invariant
