# Work packet: NEW / MISSING items from docs/audit/gap2/lane-7/l17-u021-public-job-response-dto.md

4 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/l17-u021-public-job-response-dto.md

## G2-17-021-044  [P1] MISSING  facet F20  effort M
- Legacy: LBE/dto/response/PublicJobResponseDTO.java:31 jobSlug stored as string, stable across job edits if persisted.
- vNext now: V/db/schema/placements.ts:462-543 uuid identifier and no source slug in placementJobs row.
- Fix: Import old slug mapping and HTTP 301/308 redirects to stable public link.

## G2-17-021-047  [P1] GAP  facet F22  effort L
- Legacy: LBE/model/Job.java:22-121 has text/status/date fields, including raw important_dates JSON.
- vNext now: V/db/schema/placements.ts:462-541 normalizes job fields, JSONB legacyPostingDetails importantDates.
- Fix: Design row-level migration preserving public responsibilities, dates, salary, original slug and published timestamp.

## G2-17-021-048  [P1] GAP  facet F22  effort M
- Legacy: LBE/dto/response/PublicJobResponseDTO.java:35-44 excludes private evaluation/targeting data at projection boundary.
- vNext now: V/modules/placements/placement-legacy-posting-model.ts:31-42 includes candidatePreferences/customEligibilityRules in JSONB.
- Fix: Ensure DTO select explicitly whitelists needed nested JSON only; validate no accidental serialization.

## G2-17-021-050  [P1] GAP  facet F23  effort M
- Legacy: LBE/dto/response/PublicJobResponseDTO.java:35-44 commented excluded list distinguishes public display fields and internal criteria.
- vNext now: V/modules/placements/learner-job-service.ts:155-210 enforces targeting for authenticated list and returns internal eligibility state.
- Fix: Keep public projection narrowly safe and never reuse learner eligibility view on public URLs.
