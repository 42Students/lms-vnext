# Work packet: edit src/modules/placements/tpo-drive-offer-register-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/job-offer.md

## G2-13-015-025  [P1] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobOffer.java:69-71` default SELECTED is not visible as released letter
- vNext now: `src/modules/placements/tpo-drive-offer-register-model.ts:19-25` model ISSUED as awaiting learner response
- Fix: Do not show unreleased SELECTED legacy offers as response-ready ISSUED when migrating

## G2-13-015-039  [P1] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:370-397` expire RELEASED if respondBy passed; if application already answered correct to ACCEPTED/DECLINED
- vNext now: `src/modules/placements/tpo-drive-offer-register-model.ts:40-48` derives EXPIRED vs OPEN/DUE_SOON from timestamps on ISSUED offers, `src/db/schema/placements.ts:1614-1617` EXPIRED status
- Fix: Ensure durable expiry sweep transitions and reconciles previously answered offers, not just badge derivation
