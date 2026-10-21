# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-14/l18-u021-job-important-date-event-dto.md

12 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-14/l18-u021-job-important-date-event-dto.md

## G2-18-021-001  [P2] GAP  facet F01  effort M
- Legacy: Old DTO returned from `/api/v1/jobs/calendar-dates` and `/calendar-dates/learner/{learnerId}` (JobController:903-969)
- vNext now: New TPO calendar `/tpo/calendar` and learner Career Calendar views consume typed TS models (calendar-workspace, learner-career-calendar)
- Fix: Map both audiences to vNext calendar routes and explain old date feed compatibility

## G2-18-021-005  [P2] GAP  facet F03  effort S
- Legacy: `eventType` defaults `JOB_IMPORTANT_DATE` (DTO:19)
- vNext now: New `PlacementCalendarKind` union ROUND/BLOCKED/INTERVIEW_SLOT/APPLICATION_DEADLINE/FOLLOW_UP (placement-calendar-model:5-12)
- Fix: Retain canonical origin/eventType field even if displayed kind is normalized

## G2-18-021-010  [P2] GAP  facet F05  effort S
- Legacy: Old label free text from original job importantDates, `.trim()` (JobServiceImpl:1554-1563)
- vNext now: New TPO deadline label synthesized `Application deadline: ${jobTitle}` (calendar-service:547-552)
- Fix: Display user-entered important date label intact, with job title separate

## G2-18-021-013  [P2] GAP  facet F06  effort S
- Legacy: Old job important date fallback supports `dateType` alias (JobServiceImpl:1562-1567)
- vNext now: New legacyPostingDetails types only label/at (placements.ts:489)
- Fix: Accept/emit old `type` and `dateType` aliases when importing or editing

## G2-18-021-019  [P2] GAP  facet F09  effort S
- Legacy: Old multiple dates from one job may occupy one day with distinct labels (JobServiceImpl:1545-1573)
- vNext now: New TPO calendar renders grouped event kinds sorted by startsAt and id (calendar-model:64-79)
- Fix: Allow same-day multiple important date labels with stable IDs and type chips

## G2-18-021-020  [P2] GAP  facet F10  effort M
- Legacy: Old admin GET `/api/v1/jobs/calendar-dates?start&end` (JobController:906-934)
- vNext now: New listPlacementCalendarEvents requires college + date params (calendar-service:188-207)
- Fix: Provide admin mapping of date window and job date rows; preserve college/org visibility

## G2-18-021-026  [P2] GAP  facet F12  effort M
- Legacy: Old invalid records skipped; archived/deleted jobs excluded for learner (JobServiceImpl:1516-1541)
- vNext now: New placement calendar excludes ARCHIVED jobs, DRAFT deadlines by default (calendar-service:180-184)
- Fix: Define explicit eligibility/status truth table for job important-date inclusion by role

## G2-18-021-031  [P2] GAP  facet F14  effort S
- Legacy: Old event labels can be arbitrary Unicode; no truncation at DTO layer (DTO:18)
- vNext now: New labels generated from job title or round data (calendar-service:551, learner-career-model:79)
- Fix: Retain arbitrary original label safely escaped in ICS and UI

## G2-18-021-035  [P2] GAP  facet F18  effort S
- Legacy: Old raw label shown in calendar; type controls classification rather than guessed label patterns (DTO:18,20-29)
- vNext now: New title `Application deadline: ${jobTitle}` (calendar-service:551)
- Fix: Keep label as separate primary text; show company/job metadata second

## G2-18-021-036  [P2] GAP  facet F18  effort S
- Legacy: Old eventType uppercase `JOB_IMPORTANT_DATE` (DTO:19)
- vNext now: New `APPLICATION_DEADLINE` kind uppercase plus ROUND/FOLLOW_UP etc (calendar-model:5-12)
- Fix: Map canonical date type to kind without losing source eventType

## G2-18-021-041  [P2] GAP  facet F20  effort M
- Legacy: Old stable event identity not part of DTO (DTO:15-29)
- vNext now: New id string `deadline:${jobId}` for one date (calendar-service:547)
- Fix: Use job UUID + source date index/identifier to avoid collisions across several important dates

## G2-18-021-043  [P2] GAP  facet F21  effort S
- Legacy: Old admin jobs for college or organization, no selected scope => empty (JobServiceImpl:1472-1489)
- vNext now: New requirePlacementManageScope returns current selected college (calendar-service:188-201)
- Fix: Document org-level Super Admin calendar behavior and no-selected-college empty state
