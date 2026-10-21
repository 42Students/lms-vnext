# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-7/l17-u021-public-job-response-dto.md

2 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/l17-u021-public-job-response-dto.md

## G2-17-021-041  [P2] GAP  facet F18  effort S
- Legacy: LBE/dto/response/PublicJobResponseDTO.java:29 `importantDates` list of label/date.
- vNext now: V/modules/placements/placement-legacy-posting-model.ts:24-31 uses label/at, no outward map.
- Fix: Mirror `label` and `date` in external JSON, without `at` wire breakage.

## G2-17-021-043  [P2] GAP  facet F20  effort M
- Legacy: LBE/dto/response/PublicJobResponseDTO.java:27-30 LocalDateTime postedDate/deadline, Map date objects may stringify without explicit timezone.
- vNext now: V/modules/placements/placement-legacy-posting-model.ts:24-27 ISO offset validated and V/db/schema/placements.ts:510-535 timestamptz.
- Fix: Normalize old naive timestamps to IST and ship explicit offset/UTC in public DTO.
