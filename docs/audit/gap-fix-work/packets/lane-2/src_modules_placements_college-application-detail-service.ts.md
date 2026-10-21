# Work packet: edit src/modules/placements/college-application-detail-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-job-controller.md

## G2-2-016-101  [P2] GAP  facet F08  effort S
- Legacy: Offer letter PATCH reports `Offer letter attached` on success `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:846-852`
- vNext now: New offer info has separate offer record and attachment timestamp `src/modules/placements/college-application-detail-service.ts:74-79`
- Fix: Ensure user-facing attachment success matches old copy
