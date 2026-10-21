# Work packet (wave 3): NEW / MISSING items from docs/audit/gap2/lane-7/l12-u027-faculty-teaching-assignment-controller.md

1 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/l12-u027-faculty-teaching-assignment-controller.md

## G2-12-027-060  [P1] MISSING  facet F23  effort L
- Legacy: LBE/controller/FacultyTeachingAssignmentController.java:134-157: full update and hard delete separate from deactivate.
- vNext now: V/app/api/courses/teaching-assignments/[assignmentId]/route.ts:17-55: role PATCH and lifecycle DELETE; legacy full mutation dropped.
- Fix: Inventory affected legacy admin workflows and deliberately document policy decision or restore endpoints.
