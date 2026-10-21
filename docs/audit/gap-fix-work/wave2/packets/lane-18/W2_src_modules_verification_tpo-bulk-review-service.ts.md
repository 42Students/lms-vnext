# Work packet (wave 2): edit src/modules/verification/tpo-bulk-review-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/profile-verification-controller.md

## G2-1-010-005  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/ProfileVerificationController.java:86-89`: /verify-many batch endpoint; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/ProfileVerificationController.java:91-100`: /settings GET/PUT.
- vNext now: `src/modules/verification/tpo-bulk-review-service.ts:15-41`,`src/modules/profile-verification/settings-service.ts:89-119`: separate bulk and setting services.
- Fix: Publish route mapping, authorization and partial-result contract.
