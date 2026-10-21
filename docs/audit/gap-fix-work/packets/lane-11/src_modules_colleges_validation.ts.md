# Work packet: edit src/modules/colleges/validation.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/college-controller.md

## G2-3-028-018  [P1] MISSING  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/CollegeDTO.java:38-41`
- vNext now: `src/modules/colleges/validation.ts:21-33`
- Fix: Legacy optional collegeChairId and collegeViceChairId have no fields in vNext basic college mutation. Map to role links or explicit decision.

## G2-3-028-019  [P1] MISSING  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/CollegeDTO.java:43-55`
- vNext now: `src/modules/colleges/validation.ts:21-50`
- Fix: Legacy accepts domainHost/domainPrimary with college input; vNext requires separate domain setup. Ensure complete accessible workflow.

## G2-3-028-084  [P1] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/CollegeDTO.java:38-55`
- vNext now: `src/modules/colleges/validation.ts:21-50`
- Fix: College chair/vice chair and immediate domain edit missing from base college mutation. Map ownership to alternate settings, not silent drop.
