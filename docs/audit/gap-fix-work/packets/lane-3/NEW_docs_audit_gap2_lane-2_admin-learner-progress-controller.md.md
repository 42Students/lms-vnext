# Work packet: NEW / MISSING items from docs/audit/gap2/lane-2/admin-learner-progress-controller.md

1 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-2/admin-learner-progress-controller.md

## G2-2-017-028  [P1] GAP  facet F10  effort L
- Legacy: List all nondeleted course content IDs, find maximum current attempt `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:92-100`
- vNext now: Legacy content repository selects all live IDs; vNext content scoped by offering/delivery `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LessonContentsRepository.java:21-24`
- Fix: Build delivery-aware valid set and current attempt lookup
