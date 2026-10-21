# Work packet: NEW / MISSING items from docs/audit/gap2/lane-20/learner-saved-job-repository.md

1 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-20/learner-saved-job-repository.md

## G2-20-014-013  [P3] GAP  facet F07  effort S
- Legacy: Legacy unsave error 'Failed to unsave. Please try again or contact support.' `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:821-824`
- vNext now: New unsave returns removed bool, route maps exceptions globally [N:56-69,R:7-12]
- Fix: Restore safe actionable failure copy for toggle
