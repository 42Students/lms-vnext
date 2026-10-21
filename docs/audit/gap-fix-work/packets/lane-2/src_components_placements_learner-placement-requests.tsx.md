# Work packet: edit src/components/placements/learner-placement-requests.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l14-u023-learner-request-controller.md

## G2-14-023-005  [P1] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRequestController.java:29-30 — kinds allowed WITHDRAWAL/OFFER_EXTENSION/REGISTRATION_CHANGE/ABSENCE_DISPUTE/CORRECTION/EXTERNAL_OFFER/PAP.
- vNext now: src/components/placements/learner-placement-requests.tsx:14-24 and src/modules/placements/tpo-general-request-model.ts:17-30 — split list: APPLICATION_WITHDRAWAL/ROUND_RESCHEDULE/OFFER_EXTENSION and six general kinds.
- Fix: Build one predictable request picker with seven legacy options and new variant mapping.
