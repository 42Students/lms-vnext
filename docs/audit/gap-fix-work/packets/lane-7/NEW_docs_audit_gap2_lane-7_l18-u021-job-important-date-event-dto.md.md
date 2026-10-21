# Work packet: NEW / MISSING items from docs/audit/gap2/lane-7/l18-u021-job-important-date-event-dto.md

6 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/l18-u021-job-important-date-event-dto.md

## G2-18-021-057  [P1] GAP  facet F22  effort L
- Legacy: LBE/model/Job.java:110-121 persists `important_dates` as JSON list of `{label,date}`; legacy DTO `date` parsed LocalDateTime at LBE/service/impl/JobServiceImpl.java:1548-1573.
- vNext now: V/modules/placements/placement-legacy-posting-model.ts:24-31 persists typed {label,at}; V/db/schema/placements.ts:482-492 JSONB `legacyPostingDetails`.
- Fix: Write migration for JSON `date`→`at` with type/dateType, preserving insertion order and malformed-row reports.

## G2-18-021-058  [P1] GAP  facet F22  effort L
- Legacy: LBE/dto/response/JobImportantDateEventDTO.java:15 jobId numeric BIGINT, title/company snapshot from job.
- vNext now: V/db/schema/placements.ts:462-541 UUID jobs with company relationship.
- Fix: Map old integer job identity and company display snapshot into UUID job and relationships.

## G2-18-021-059  [P1] MISSING  facet F22  effort M
- Legacy: LBE/dto/response/JobImportantDateEventDTO.java:20,26 exposes eventType+type but no DB column in DTO.
- vNext now: V/modules/placements/placement-legacy-posting-model.ts:24-31 stores no type and model no explicit job event source.
- Fix: Add subtype migration/schema projection, never infer from free-text after migration.

## G2-18-021-060  [P1] GAP  facet F23  effort M
- Legacy: LBE/service/impl/JobServiceImpl.java:1505-1540 includes applied-job dates even when no longer visible (non-deleted).
- vNext now: V/app/(authenticated)/learn/my-placements/calendar/page.tsx:11-29 only round dates.
- Fix: Preserve applied-job history event visibility after deadline for learner career continuity.

## G2-18-021-061  [P1] GAP  facet F23  effort L
- Legacy: LBE/dto/response/JobImportantDateEventDTO.java:20-26 subtype backed by producer type/dateType fallback.
- vNext now: V/modules/placements/learner-career-calendar-model.ts:16-27 derives only kind from roundKind.
- Fix: Make calendar multi-source: job important dates, existing booked rounds, blocked college dates with consistent legend, ICS and event links.

## G2-18-021-062  [P1] GAP  facet F23  effort M
- Legacy: LBE/controller/JobController.java:906-974 separates own learner from college-admin query permissions.
- vNext now: V/app/(authenticated)/learn/my-placements/calendar/page.tsx:11-29 loads scoped learner only; admin feed not represented.
- Fix: Choose role-specific data providers and preserve tenant boundaries, not a single global job date query.
