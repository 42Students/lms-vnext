# Work packet: NEW / MISSING items from docs/audit/gap2/lane-20/learner-group-controller.md

2 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-20/learner-group-controller.md

## G2-20-023-003  [P1] MISSING  facet F02  effort M
- Legacy: Mine then Open group lists `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/LearnerGroupController.java:56-89`
- vNext now: No learner lists in empty page `src/app/(authenticated)/learn/groups/page.tsx:1`
- Fix: Add two list panels

## G2-20-023-011  [P2] MISSING  facet F08  effort M
- Legacy: Join/leave returns GroupView `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/LearnerGroupController.java:100-114`
- vNext now: New service result, page absent [S:222-229,F:1]
- Fix: Refresh row on success
