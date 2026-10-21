# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-20/learner-group-controller.md

3 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-20/learner-group-controller.md

## G2-20-023-004  [P2] MISSING  facet F03  effort M
- Legacy: Seats left/state/waitlist/locked badges `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/groups/GroupView.java:20-35`
- vNext now: DB holds state and waitlist, no UI [D:42-65,F:1]
- Fix: Render complete badges

## G2-20-023-017  [P2] MISSING  facet F13  effort S
- Legacy: Empty mine returns [] `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/LearnerGroupController.java:61-73`
- vNext now: No learner page empty state `src/app/(authenticated)/learn/groups/page.tsx:1`
- Fix: Show browse groups CTA

## G2-20-023-021  [P2] MISSING  facet F17  effort S
- Legacy: Backend no ARIA `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/LearnerGroupController.java:30-49`
- vNext now: Empty learner page `src/app/(authenticated)/learn/groups/page.tsx:1`
- Fix: Accessible join/leave controls
