# Work packet: edit src/modules/placements/public-page/read-service.ts

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/placements-index.md, docs/audit/gap2/lane-4/public-placements-page-controller.md

## G2-11-001-017  [P1] GAP  facet F04  effort M
- Legacy: Placed counts DISTINCT learners with ACCEPTED offer. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:93`
- vNext now: Defaults to release-based, not accept-based placed. `src/modules/placements/public-page/read-service.ts:70`
- Fix: Align public calculation to accepted-only or record product decision.

## G2-11-001-018  [P1] GAP  facet F04  effort M
- Legacy: Companies count employers with ACCEPTED offer. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:94`
- vNext now: Counts employers across issued+accepted offers. `src/modules/placements/public-page/read-service.ts:47`
- Fix: Restrict to accepted offers with company-name fallback.

## G2-11-001-019  [P1] GAP  facet F04  effort L
- Legacy: Offers filter RELEASED/ACCEPTED and createdAt within 12mo. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:92`
- vNext now: ISSUED/ACCEPTED at issuedAt, only PUBLISHED/CLOSED jobs. `src/modules/placements/public-page/read-service.ts:64`
- Fix: Map ledger/status/time semantics exactly.

## G2-11-001-020  [P1] GAP  facet F04  effort L
- Legacy: Students are eligible learners via PlacementEligibilityService. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:89`
- vNext now: Population derived from saved registered cohort. `src/modules/placements/public-page/read-service.ts:84`
- Fix: Use legacy eligible denominator for public student metric.

## G2-11-001-050  [P1] GAP  facet F12  effort S
- Legacy: Legacy published as soon as enabled. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:78`
- vNext now: vNext also requires publishedAt fresh. `src/modules/placements/public-page/read-service.ts:31`
- Fix: Decide freshness policy or align.

## G2-4-026-016  [P1] GAP  facet F04  effort M
- Legacy: Offers statuses RELEASED/ACCEPTED and created_at last 12 months (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:91-99`)
- vNext now: Offers statuses ISSUED/ACCEPTED, issuedAt and published/closed job filter (`src/modules/placements/public-page/read-service.ts:60-67`)
- Fix: Reconcile migrated status/date semantics and legacy job inclusion.

## G2-4-026-017  [P1] GAP  facet F04  effort M
- Legacy: Placed counts ACCEPTED distinct learners (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:93-97`)
- vNext now: Placed based on college policy OFFER_RELEASED/ACCEPTED; SELECTED null (`src/modules/placements/public-page/read-service.ts:69-75`)
- Fix: Decide if public metric always means accepted or follows policy; label disclosure clearly.

## G2-4-026-018  [P1] GAP  facet F04  effort M
- Legacy: Companies count accepted hiring companies only (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:93-99`)
- vNext now: Employers distinct relationships among issued or accepted offers (`src/modules/placements/public-page/read-service.ts:42-67`)
- Fix: Match accepted-company count and canonical company identity.

## G2-4-026-021  [P1] GAP  facet F04  effort M
- Legacy: Students computed live via PlacementEligibilityService ELIGIBLE rows (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:88-89`)
- vNext now: Population from stored published snapshot (`src/modules/placements/public-page/read-service.ts:18-31,76-86`)
- Fix: Refresh qualifying population from current eligibility or publish clear snapshot semantics.

## G2-4-026-054  [P1] GAP  facet F12  effort M
- Legacy: Offers REL/ACC counted, companies accepted only (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:93-99`)
- vNext now: Count statuses ISSUED/ACC; employers from company-relationship (`src/modules/placements/public-page/read-service.ts:42-67`)
- Fix: Specify cross-version offer status and company identities to match business rules.
