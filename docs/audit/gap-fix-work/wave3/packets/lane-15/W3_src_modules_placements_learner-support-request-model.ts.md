# Work packet (wave 3): edit src/modules/placements/learner-support-request-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l14-u023-learner-request-controller.md

## G2-14-023-051  [P1] MISSING  facet F23  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRequestController.java:52-55 — all request types unified in mine.
- vNext now: src/modules/placements/learner-support-request-model.ts:3-5,13-24 — only application withdrawal/round reschedule/offer extension in support history.
- Fix: Offer unified learner request history.
