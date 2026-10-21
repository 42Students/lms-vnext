# Work packet: edit src/modules/placements/hr-interview-slot-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u019-interview.md

## G2-14-019-020  [P1] GAP  facet F06  effort M
- Legacy: Legacy duration defaults60; global min15 max480 configurable `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:78-82` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:58-91` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:275-284`
- vNext now: New HR slot maximum8h, min >0, no 60 default `src/modules/placements/hr-interview-slot-model.ts:14-17`
- Fix: Use configured min/max and 60-min default for equivalent direct interview create

## G2-14-019-026  [P2] GAP  facet F07  effort S
- Legacy: Legacy missing round description has detailed user-facing message `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:259-267`
- vNext now: New slot label optional, generic invalid round may be thrown `src/modules/placements/hr-interview-slot-model.ts:10-11`
- Fix: Restore explicit round description help/error
