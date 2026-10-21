# Work packet: NEW / MISSING items from docs/audit/gap2/lane-14/l18-u021-job-important-date-event-dto.md

16 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-14/l18-u021-job-important-date-event-dto.md

## G2-18-021-003  [P1] GAP  facet F02  effort L
- Legacy: DTO represents one date of any job importantDates array: application deadline, screening etc (DTO:8-19)
- vNext now: New placement calendar composed rounds, deadlines and follow-ups; not generic date rows (placement-calendar-service:538-600)
- Fix: Include all configured important date events with type and label, not just deadline+scheduled rounds

## G2-18-021-004  [P1] MISSING  facet F02  effort M
- Legacy: Old importantDates without matching active scheduled round still rendered as calendar marker (JobServiceImpl:1545-1570)
- vNext now: New round events require persisted scheduled rounds; generic JSON dates not selected (calendar-service:241-599)
- Fix: Project informational dates even when no corresponding round exists, de-dupe when scheduled event matches

## G2-18-021-006  [P1] GAP  facet F03  effort M
- Legacy: Explicit `type` distinguishes screening/technical/application deadlines; independent `label` (DTO:20-29)
- vNext now: New placement calendar event has kind+roundKind, no generic important date type (placement-calendar-model:14-36)
- Fix: Add optional raw importantDateType and label to model; color/classify by type first

## G2-18-021-007  [P1] GAP  facet F04  effort M
- Legacy: Seven DTO properties jobId,jobTitle,companyName,label,date,eventType,type (DTO:15-29)
- vNext now: New event has id,kind,startsAt,title,companyId,companyName,jobId,jobTitle,roundId,etc but no raw type/label (calendar-model:14-41)
- Fix: Crosswalk all seven fields; preserve label/type separately from generated display title

## G2-18-021-009  [P1] GAP  facet F04  effort M
- Legacy: Old type from map[`type`] else map[`dateType`] (JobServiceImpl:1562-1567)
- vNext now: New legacyPostingDetails.importantDates only `{label,at}` (db/schema/placements.ts:482-490)
- Fix: Store type/dateType in legacyPostingDetails metadata or normalized date rows

## G2-18-021-011  [P1] GAP  facet F05  effort M
- Legacy: Old source job importantDates array can include multiple events per job (JobServiceImpl:1546-1573)
- vNext now: New deadline event id `deadline:${jobId}` only one per job (calendar-service:547)
- Fix: Support stable per-item IDs including index/typed key so multiple dates do not collapse

## G2-18-021-012  [P1] GAP  facet F06  effort M
- Legacy: DTO is response-only, no creation form; backing JSON input `{label,date,type/dateType}` (Job.java:92-100, JobServiceImpl:1548-1568)
- vNext now: New placement job create form parses legacyPairs label and datetime into `{label,at}` (create-form:376-378)
- Fix: Add type input/preservation to authoring + roundtrip; do not invent type from text

## G2-18-021-017  [P1] GAP  facet F08  effort M
- Legacy: Old zero event list is empty success, frontend falls back to importantDates from jobs (DTO:20-29 comment)
- vNext now: New calendar service may return empty because dates not projected; fallback absent in inspected TS service
- Fix: Distinguish no dates from unsupported source; add explicit metadata projection rather than empty-success

## G2-18-021-021  [P1] GAP  facet F10  effort L
- Legacy: Old learner GET `/calendar-dates/learner/{learnerId}` includes all visible and applied jobs (JobController:942-972; JobServiceImpl:1506-1541)
- vNext now: New learner careerCalendarEvents takes only application rounds (learner-career-calendar-model:64-87)
- Fix: Merge targeted-visible un-applied job dates AND past applied-job dates in learner calendar

## G2-18-021-025  [P1] GAP  facet F11  effort L
- Legacy: Old learner calendar includes jobs visible on Jobs page + jobs applied, deduped by ID (JobServiceImpl:1506-1540)
- vNext now: New event source applicationId,roundId and scheduledAt (learner-career-calendar-model:3-20,64-86)
- Fix: Verify public-targeted jobs with future dates included despite no application; preserve applied after deadline

## G2-18-021-027  [P1] GAP  facet F12  effort M
- Legacy: Old event `type` selected before `dateType` fallback; does not replace meaningful type with label parsing (JobServiceImpl:1562-1567)
- vNext now: New generic `kind` enum cannot encode source-specific type (calendar-model:5-12)
- Fix: Preserve and prioritize raw type over label heuristics at all consumers

## G2-18-021-038  [P1] GAP  facet F19  effort L
- Legacy: Old job list `getCalendarJobsForLearner` dedup visible+applied (JobServiceImpl:1506-1541)
- vNext now: New Career events from rounds, no un-applied source in current model (career-calendar-model:64-87)
- Fix: Union visible and applied job rows once and project each important date only once

## G2-18-021-039  [P1] GAP  facet F20  effort M
- Legacy: Old DATE `parseImportantDate` uses PlacementDateTimeUtils.parseUtcDateTime (JobServiceImpl:1576-1580)
- vNext now: New dates stored timestamptz and IST grouping via careerDayKey (calendar-model:64-87)
- Fix: Define UTC storage→IST day mapping; test +05:30 boundary and naive date strings

## G2-18-021-044  [P1] GAP  facet F22  effort M
- Legacy: Old `Job.importantDates` JSON list containing `{label,date,type/dateType}` (Job.java:92-100; JobServiceImpl:1548-1567)
- vNext now: New `placementJobs.legacyPostingDetails.importantDates` typed `{label:string,at:string}` (placements.ts:482-490)
- Fix: Schema add optional `type`, `dateType` and preserve during write and read; include existing legacy payloads

## G2-18-021-046  [P1] GAP  facet F23  effort M
- Legacy: Old DTO Lombok getters/all-args constructor with field `type` added to fix primary/fallback classification drift (DTO:11-29)
- vNext now: New TypeScript calendar projection omits direct type/dateType, offering only normalized kinds (calendar-model:5-36)
- Fix: Write explicit typed job-date projection contract + fixture for primary/fallback classification agreement

## G2-18-021-015  [P2] GAP  facet F07  effort S
- Legacy: Old controller validates `start` and `end` required, start <= end (JobController:911-921,957-962)
- vNext now: New placement query Zod ISO day via calendarDateSchema and filters (calendar-service:44-81)
- Fix: Map original range errors and inclusive day bounds to vNext query warnings
