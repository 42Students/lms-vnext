# Work packet (wave 2): edit src/modules/placements/college-stage-action-model.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/job-application-status-validator.md

## G2-13-010-010  [P2] GAP  facet F04  effort S
- Legacy: Old strings case-insensitively match target/status using toUpperCase (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationStatusValidator.java:77-82`)
- vNext now: New Zod enum only uppercase exact uppercase member values (`src/modules/placements/college-stage-action-model.ts:3-12`)
- Fix: Uppercase legacy inputs at compatibility boundary or document reject.

## G2-13-010-014  [P2] GAP  facet F05  effort S
- Legacy: Old transitions enumerated exact next order per stage (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationStatusValidator.java:18-57`)
- vNext now: New source array order differs and some options omitted (`src/modules/placements/college-stage-action-model.ts:24-32`)
- Fix: Restore visible option ordering in stage-select UI where stage is same.

## G2-13-010-016  [P2] GAP  facet F05  effort L
- Legacy: Old SHORTLISTED next ASSESSMENT,INTERVIEW,REJECTED,APPLIED,WITHDRAWN,WAITLISTED (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationStatusValidator.java:21-23`)
- vNext now: New SHORTLISTED next ASSESSMENT,INTERVIEW,WAITLISTED,REJECTED (`src/modules/placements/college-stage-action-model.ts:26-26`)
- Fix: Add legitimate back-to-APPLIED correction after screening state audit; keep withdrawal separate.

## G2-13-010-021  [P2] GAP  facet F06  effort M
- Legacy: Old stage-change call can notifyStudent=true or false (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:54-76`)
- vNext now: New command input has notifyByEmail default false; in-app notices via service (`src/modules/placements/college-stage-action-model.ts:6-15`)
- Fix: Separate learner in-app notify setting from email optionality and map legacy behavior.

## G2-13-010-046  [P2] GAP  facet F17  effort S
- Legacy: Old FE map normalizes numeric/string IDs before bulk submit (`docs/legacy-source/frontend/src/utils/placementApplicationTransitions.js:29-69`)
- vNext now: New uses strict UUIDs and uniqueness refine (`src/modules/placements/college-stage-action-model.ts:6-9`)
- Fix: Make legacy ID→UUID mapping explicit in migration and selection state.

## G2-13-010-053  [P2] GAP  facet F20  effort S
- Legacy: Old same-status check is case-sensitive before normalized map (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationStatusValidator.java:72-82`)
- vNext now: New input only uppercase enum, same-stage string compare exact (`src/modules/placements/college-stage-action-model.ts:3-12`)
- Fix: Explicit trim/uppercase to avoid inconsistent case equivalence.

## G2-13-010-054  [P2] GAP  facet F20  effort S
- Legacy: Legacy map unknown status does not allow same-status? same string returns true first (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationStatusValidator.java:72-79`)
- vNext now: New unknown never in valid Zod enum, cannot select (`src/modules/placements/college-stage-action-model.ts:6-12`)
- Fix: Decide unknown-state no-op compatibility and fail safely.
