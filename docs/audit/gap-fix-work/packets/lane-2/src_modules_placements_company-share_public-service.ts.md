# Work packet: edit src/modules/placements/company-share/public-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/public-job-response-dto.md

## G2-17-021-019  [P1] GAP  facet F10  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/PublicJobResponseDTO.java:34-40 — Screening rules and identities intentionally excluded.
- vNext now: src/modules/placements/company-share/public-service.ts:32-63 — Public share selected columns managed by capability token.
- Fix: Do not accidentally expose internal job applicant or targeting fields through public route.

## G2-17-021-035  [P1] GAP  facet F20  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/PublicJobResponseDTO.java:31 — Unvalidated generic map importantDates may leak arbitrary fields.
- vNext now: src/modules/placements/company-share/public-service.ts:32-63 — Share selected columns explicitly, separate route.
- Fix: Sanitize date-map keys and prevent internal key reflection.
