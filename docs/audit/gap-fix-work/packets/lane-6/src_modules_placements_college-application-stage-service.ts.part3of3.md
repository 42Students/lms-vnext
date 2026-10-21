# Work packet: edit src/modules/placements/college-application-stage-service.ts (part 3 of 3)

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/job-application-status-validator.md, docs/audit/gap2/lane-14/u011-placement-job-service-impl.md, docs/audit/gap2/lane-2/admin-job-controller.md

## G2-13-010-028  [P2] GAP  facet F08  effort S
- Legacy: Legacy unchanged status does not send duplicate notification (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:59-76`)
- vNext now: New same-stage rejected before any write (`src/modules/placements/college-application-stage-service.ts:75-81`)
- Fix: Show idempotent no-op vs explicit refusal; both must avoid duplicates.

## G2-14-011-031  [P2] GAP  facet F07  effort M
- Legacy: Invalid applicant transition displays valid next statuses `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationStatusValidator.java:106-112`
- vNext now: New stage command rejects with new service code `src/modules/placements/college-application-stage-service.ts:33-90`
- Fix: Expose allowed transitions and exact rejection copy

## G2-14-011-034  [P2] GAP  facet F08  effort S
- Legacy: Successful status mutation says Application status updated successfully `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:725-729`
- vNext now: New college stage service returns stage command results `src/modules/placements/college-application-stage-service.ts:33-49` `src/modules/placements/college-application-stage-service.ts:152-188`
- Fix: Align success wording and notification timing

## G2-14-011-035  [P2] GAP  facet F08  effort S
- Legacy: Bulk partial response includes failure count in message `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:645-654`
- vNext now: New college service returns moved/skipped per-row list `src/modules/placements/college-application-stage-service.ts:47-49`
- Fix: Show exact success/failure summary and failed rows

## G2-2-016-093  [P2] GAP  facet F07  effort M
- Legacy: Bulk application malformed array/status gets `applicationIds must be an array` / `newStatus must be a string` / max100 `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:542-570`
- vNext now: New strict typed command and max3000 matching-filter mutation `src/modules/placements/college-application-stage-service.ts:33-45`
- Fix: Preserve exact client feedback for malformed payload, cap and per-row errors
