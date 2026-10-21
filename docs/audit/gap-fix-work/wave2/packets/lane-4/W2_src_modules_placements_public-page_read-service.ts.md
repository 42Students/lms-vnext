# Work packet (wave 2): edit src/modules/placements/public-page/read-service.ts

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/public-job-response-dto.md, docs/audit/gap2/lane-4/public-placements-page-controller.md

## G2-17-021-001  [P2] GAP  facet F01  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/PublicJobResponseDTO.java:11-17 — Public-safe Job DTO intended for external links/API.
- vNext now: src/modules/placements/public-page/read-service.ts:16-35 — Public placements page provides college aggregate statistics, not per-job public DTO.
- Fix: Confirm live old endpoint/caller; implement public-safe job detail only if previously reachable.

## G2-17-021-006  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/PublicJobResponseDTO.java:19-32 — Visible job title, company name/logo, responsibility, type, location, CTC, dates and slug.
- vNext now: src/modules/placements/public-page/read-service.ts:81-88 — Public stats exposes placed/population/offers/employers/median/highest.
- Fix: Build safe per-job presentation if current product still offers link.

## G2-17-021-007  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/PublicJobResponseDTO.java:30-31 — Important dates label/date pairs.
- vNext now: src/modules/placements/public-page/read-service.ts:81-88 — Statistics response lacks importantDates.
- Fix: Expose sanitized important-date list only for public job detail.

## G2-17-021-023  [P2] GAP  facet F12  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/PublicJobResponseDTO.java:16-17 — LowerCamelCaseStrategy.
- vNext now: src/modules/placements/public-page/read-service.ts:81-88 — Public stats keys placed/population/etc.
- Fix: Preserve exact JSON keys for legacy consumers or version endpoint.

## G2-17-021-034  [P2] GAP  facet F20  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/PublicJobResponseDTO.java:28-29 — LocalDateTime requires timezone interpretation.
- vNext now: src/modules/placements/public-page/read-service.ts:24-31 — Publication freshness uses Date/time.
- Fix: Normalize timezone before comparing expiration/deadline.

## G2-4-026-020  [P2] GAP  facet F04  effort M
- Legacy: Median LPA rounds midpoint to 2 decimals; strips trailing zeros (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:163-172`)
- vNext now: percentile_cont on INR then format fixed 1 decimal LPA (`src/modules/placements/public-page/read-service.ts:50-52,87-88`)
- Fix: Restore two-decimal HALF_UP median and variable decimal formatting.

## G2-4-026-055  [P2] GAP  facet F12  effort M
- Legacy: Median even list uses two-decimal HALF_UP LPA (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:163-172`)
- vNext now: Postgres percentile_cont over INR, formatting fixed 1 decimal (`src/modules/placements/public-page/read-service.ts:50-52,87-88`)
- Fix: Match precision and midpoint semantics exactly.

## G2-4-026-074  [P2] GAP  facet F19  effort M
- Legacy: GET recomputes per-request eligibility plus offer/CTC SQL (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:88-115`)
- vNext now: Stored gated snapshot plus live SQL ledger read (`src/modules/placements/public-page/read-service.ts:18-31,38-89`)
- Fix: Document freshness/consistency and benchmark high-traffic public views.

## G2-4-026-083  [P2] GAP  facet F21  effort M
- Legacy: Live queries placement eligibility and offers (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:88-99`)
- vNext now: Queries placement ledger plus publication guard (`src/modules/placements/public-page/read-service.ts:33-67`)
- Fix: Align eligibility/publication updates with published metric rule.

## G2-17-021-010  [P3] GAP  facet F04  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/PublicJobResponseDTO.java:27-27 — CTC is free text ctcRange.
- vNext now: src/modules/placements/public-page/read-service.ts:87-88 — Public stats median/highest numeric INR aggregates.
- Fix: Retain ctcRange as safe display-only role field if exposed.

## G2-17-021-032  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/PublicJobResponseDTO.java:20-32 — JSON names `jobTitle`, `companyLogo`, `ctcRange`, `importantDates`.
- vNext now: src/modules/placements/public-page/read-service.ts:81-88 — Public stats API uses different names.
- Fix: Use old display labels only where same public job feature retained.
