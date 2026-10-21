# Work packet: NEW / MISSING items from docs/audit/gap2/lane-20/student-image-controller.md

1 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-20/student-image-controller.md

## G2-20-024-017  [P1] GAP  facet F14  effort L
- Legacy: Legacy stores URL/key, not upload binary `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentImageController.java:62-90`
- vNext now: Private receipt model requires signed storage grant [N:188-212,V:6-14]
- Fix: Implement authorized upload/grant/read lifecycle
