# Work packet (wave 2): edit src/modules/placements/hr-today-action-queue-model.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/recruiter-home.md

## G2-13-002-003  [P2] GAP  facet F01  effort M
- Legacy: Task links open drive's relevant tab, or messages without job (`docs/legacy-source/frontend/src/components/recruiter/recruiterRoutes.js:7-15`)
- vNext now: New task actions navigate to drive tabs, slots, inbox and notifications (`src/modules/placements/hr-today-action-queue-model.ts:19-82`)
- Fix: Verify each legacy task destination, including request-tab alias, is reachable.

## G2-13-002-021  [P2] GAP  facet F05  effort S
- Legacy: Tasks sorted by urgent/soon/fine; ties insertion order (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterTodayService.java:77-79`)
- vNext now: New sorts same priority by time then key (`src/modules/placements/hr-today-action-queue-model.ts:83-91`)
- Fix: Match deterministic tie-break order for same-tone tasks.

## G2-13-002-045  [P2] GAP  facet F12  effort M
- Legacy: Old change-request task counts ASK vs CHANGE and includes note (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterTodayService.java:87-98`)
- vNext now: New includes field name in request label/description (`src/modules/placements/hr-today-action-queue-model.ts:19-23`)
- Fix: Restore ASK/CHANGE count and note where employer-visible.

## G2-13-002-049  [P2] GAP  facet F12  effort M
- Legacy: Old offers waiting: RELEASED, nearest respond_by, soon if under 2 days (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterTodayService.java:148-155`)
- vNext now: New actions based on ISSUED/ACCEPTED/DECLINED statuses, no reply-by (`src/modules/placements/hr-today-action-queue-model.ts:31-39`)
- Fix: Restore outstanding reply-by and separate accepted/declined follow-up.
