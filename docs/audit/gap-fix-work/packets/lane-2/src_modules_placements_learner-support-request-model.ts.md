# Work packet: edit src/modules/placements/learner-support-request-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l14-u023-learner-request-controller.md

## G2-14-023-026  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRequestController.java:52-55 — mine returns all types from student_request table.
- vNext now: src/modules/placements/learner-support-request-model.ts:7-24 — own placement app support requests; general requests are separate.
- Fix: Unify personal history across both request types.
