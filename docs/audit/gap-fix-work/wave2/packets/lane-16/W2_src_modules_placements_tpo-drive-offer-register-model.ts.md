# Work packet (wave 2): edit src/modules/placements/tpo-drive-offer-register-model.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/job-offer.md

## G2-13-015-005  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobOffer.java:38-40` default kind OFFER, `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobOffer.java:69-71` status SELECTED
- vNext now: `src/modules/placements/tpo-drive-offer-register-model.ts:3` kind OFFER/LOI filter, status ISSUE/ACCEPT/DECLINE/etc
- Fix: Label 'Selected' vs 'Issued' faithfully where pre-release flows remain distinct

## G2-13-015-006  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobOffer.java:73-83` acceptance_channel IN_APP/EXTERNAL_IMPORT and joining status JOINED/DEFERRED/NOT_JOINED
- vNext now: `src/modules/placements/tpo-drive-offer-register-model.ts:3` joining filter PENDING/JOINED/DEFERRED/DID_NOT_JOIN, acceptance channel in `src/modules/placements/tpo-drive-offer-register-model.ts:75-80`
- Fix: Map legacy NOT_JOINED→DID_NOT_JOIN and show channel labels without conflating acceptance vs joining

## G2-13-015-015  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/tpo/JobOfferRepository.java:14-16` first/latest offer ordered createdAt desc; `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/tpo/JobOfferRepository.java:18-23` all offers by job/learner
- vNext now: `src/db/schema/placements.ts:1597-1609` uniqueness by application/version, `src/modules/placements/tpo-drive-offer-register-model.ts:59` issuedAt descending
- Fix: Order latest by source created timestamp with version tie-breaker; ensure stable multi-version display

## G2-13-015-050  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobOffer.java:69-71` `PENDING_VERIFICATION` and `REVOKED` named states
- vNext now: `src/modules/placements/tpo-drive-offer-register-model.ts:3` status filter has only ISSUED,ACCEPTED,DECLINED,WITHDRAWN,EXPIRED
- Fix: Expose pending verification and revoked with correct badges/report labels where data still exists

## G2-13-015-060  [P2] GAP  facet F22  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/tpo/JobOfferRepository.java:16` latest offer uses createdAt DESC; `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/tpo/JobOfferRepository.java:25` expire selects status RELEASED
- vNext now: `src/db/schema/placements.ts:1534` ISSUED and expiresAt, `src/modules/placements/tpo-drive-offer-register-model.ts:59` sort by issuedAt DESC
- Fix: Align legacy ordering to createdAt vs issuedAt and release-to-expire mapping
