# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-17/public-job-response-dto.md

1 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-17/public-job-response-dto.md

## G2-17-021-025  [P2] GAP  facet F12  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/PublicJobResponseDTO.java:31 — Important dates list generic maps, no validation in DTO.
- vNext now: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobServiceImpl.java:1548-1550 — Service reads untyped list and filters rows.
- Fix: Validate label/date structure before exposing to public.
