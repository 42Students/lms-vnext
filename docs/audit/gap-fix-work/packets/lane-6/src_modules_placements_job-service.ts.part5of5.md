# Work packet: edit src/modules/placements/job-service.ts (part 5 of 5)

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l15-u026-placement-job-controller.md, docs/audit/gap2/lane-2/admin-job-controller.md

## G2-15-026-021  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:334-337 stale edit message 'This job was updated by someone else. Please refresh and try again.'
- vNext now: src/modules/placements/job-service.ts:272-416 app errors via code and lost version check
- Fix: Surface exact job conflict/reload copy, preserve edit draft

## G2-2-016-096  [P3] GAP  facet F08  effort S
- Legacy: Successful job listing response `Jobs fetched successfully` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:123-131`
- vNext now: New server service returns bare rows; no corresponding exact success message `src/modules/placements/job-service.ts:86-135`
- Fix: Match legacy success copy in any user-visible list toast or remove obsolete feedback intentionally

## G2-15-026-025  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:153-156 'Jobs retrieved successfully'
- vNext now: src/modules/placements/job-service.ts:86-134 returns rows with no legacy envelope
- Fix: Map list success wording only when UI displays a fetch toast
