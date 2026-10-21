# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-7/l18-u021-job-important-date-event-dto.md

6 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/l18-u021-job-important-date-event-dto.md

## G2-18-021-049  [P2] GAP  facet F18  effort S
- Legacy: LBE/dto/response/JobImportantDateEventDTO.java:14-26 fields `label`,`eventType`,`type` with exact upper-case literal `JOB_IMPORTANT_DATE`.
- vNext now: V/components/placements/learner-career-calendar.tsx:138,205-215 uses `Career calendar` and assessment/interview categories.
- Fix: Port exact job event/category labels and tooltip classification while retaining calendar title.

## G2-18-021-051  [P2] GAP  facet F19  effort M
- Legacy: LBE/service/impl/JobServiceImpl.java:1545-1573 returns all valid events for explicit date range, no page cursor.
- vNext now: V/modules/placements/learner-career-calendar-model.ts:77-111 filters client union by view period.
- Fix: Query bounded server date ranges for both round/job sources to control payload size.

## G2-18-021-052  [P2] GAP  facet F19  effort S
- Legacy: LBE/service/impl/JobServiceImpl.java:1550-1572 allows multiple important date entries from same job/date.
- vNext now: V/modules/placements/learner-career-calendar-model.ts:70-77 uses unique applicationId:roundId per booked round.
- Fix: Use stable per-date index/ID so two same-day job events aren't deduped.

## G2-18-021-053  [P2] GAP  facet F20  effort M
- Legacy: LBE/service/impl/JobServiceImpl.java:1576-1578 parses important date as UTC using PlacementDateTimeUtils.
- vNext now: V/modules/placements/learner-career-calendar-model.ts:29-36 displays dayKey in Asia/Kolkata.
- Fix: Document UTC->IST contract and migration of naive LocalDateTime values at midnight.

## G2-18-021-050  [P3] GAP  facet F18  effort S
- Legacy: LBE/controller/JobController.java:928-934 has exact `Calendar dates retrieved successfully` success and fallback `Failed to fetch calendar dates. Please try again or contact support.`.
- vNext now: V/app/(authenticated)/learn/my-placements/calendar/page.tsx:16-29 only page title/description; success copy absent.
- Fix: Specify response copy for legacy API adapter, avoid unnecessary toast on page load.

## G2-18-021-054  [P3] GAP  facet F20  effort S
- Legacy: LBE/service/impl/JobServiceImpl.java:1545-1573 loops source list without ORDER BY; source job fetch ordering depends repository.
- vNext now: V/modules/placements/learner-career-calendar-model.ts:74-76 sorts by start then key.
- Fix: Add deterministic server range order before JSON/ICS output; compare tie-break expectations.
