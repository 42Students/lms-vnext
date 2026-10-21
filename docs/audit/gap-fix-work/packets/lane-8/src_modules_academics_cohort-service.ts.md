# Work packet: edit src/modules/academics/cohort-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u021-batch.md

## G2-5-021-018  [P1] GAP  facet F06  effort L
- Legacy: Legacy create DTO startDate/endDate, name/program/status/year `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/BatchServiceImpl.java:73-103`
- vNext now: VNext cohort input name/code/program/startPeriodId/expectedEndPeriodId `src/modules/academics/cohort-service.ts:153-193`
- Fix: Provide date/academic year mapping, status/default equivalence.

## G2-5-021-023  [P2] GAP  facet F07  effort M
- Legacy: Legacy name conflict 'A batch named X already exists for this program' `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/BatchServiceImpl.java:113-120`
- vNext now: VNext code conflict maps to COHORT_CODE_CONFLICT `src/modules/academics/cohort-service.ts:34-72`
- Fix: Implement name collision validation/wording at form boundary.

## G2-5-021-025  [P3] GAP  facet F08  effort S
- Legacy: Legacy create returns BatchResponseDTO after save `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/BatchServiceImpl.java:100-105`
- vNext now: New create returns created cohort row + audit `src/modules/academics/cohort-service.ts:180-203`
- Fix: Map response envelope and user success toast on consumer.
