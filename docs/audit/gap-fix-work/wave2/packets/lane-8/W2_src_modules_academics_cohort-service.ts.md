# Work packet (wave 2): edit src/modules/academics/cohort-service.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/batch-controller.md, docs/audit/gap2/lane-5/u021-batch.md

## G2-2-029-002  [P2] GAP  facet F01  effort M
- Legacy: BatchController.java:94-103 GET `/getBranchDetailsById?batchId=` (misnamed branch).
- vNext now: src/modules/academics/cohort-service.ts:127-153 list by program; college batch row actions `college-cohort-management.tsx:159-244`.
- Fix: Expose authenticated batch detail read/route without legacy misnomer; map ID and shape.

## G2-2-029-004  [P2] GAP  facet F01  effort M
- Legacy: BatchController.java:135-156 GET `/fetchByProgram`, `/fetchByCollege`.
- vNext now: src/modules/academics/cohort-service.ts:127-153 scoped by program; `college-batch-promotion-service.ts:46-71` scoped by college.
- Fix: Map legacy list/filter URLs and response envelope; preserve two read entry routes where required.

## G2-2-029-021  [P2] GAP  facet F04  effort S
- Legacy: BatchController.java:137-144 uses `{status:'OK',message:'OK',data:batches}` for program fetch.
- vNext now: src/app/api/college/batches/route.ts:19 uses `{cohort}` response; `cohort-service.ts:127-153` raw list.
- Fix: Map envelope variants and ensure client parser does not infer success from absent `.data`.

## G2-2-029-023  [P2] GAP  facet F05  effort M
- Legacy: BatchServiceImpl.java:346-359 findByProgram/College/Organization returns BatchResponseDTO collections.
- vNext now: cohort-service.ts:127-153 lists cohorts per program sorted createdAt then id.
- Fix: Confirm default legacy sort from repository; align visible order/filter.

## G2-5-021-015  [P2] GAP  facet F05  effort S
- Legacy: Legacy BatchRepository list by program/college/org no ordering `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BatchRepository.java:15-35`
- vNext now: VNext listCohorts sorted createdAt/name ASC `src/modules/academics/cohort-service.ts:127-150`
- Fix: Confirm default batch order with legacy UI, preserve pagination expectations.

## G2-5-021-029  [P2] GAP  facet F10  effort M
- Legacy: Legacy batch create trims name then checks uniqueness under program row lock `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/BatchServiceImpl.java:80-84` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/BatchServiceImpl.java:30-38`
- vNext now: New checks code uniqueness pre-insert plus DB unique `src/modules/academics/cohort-service.ts:34-75,168-205`
- Fix: Match name uniqueness while keeping hard DB guard.

## G2-5-021-033  [P2] GAP  facet F11  effort M
- Legacy: Legacy global organization batch list endpoint joins org `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BatchRepository.java:30-35`
- vNext now: New cohort list requires explicit programId scoped to college `src/modules/academics/cohort-service.ts:127-150`
- Fix: Provide Super Admin selected-org/college directory equivalent.

## G2-5-021-044  [P2] GAP  facet F18  effort S
- Legacy: Legacy duplicate/name and date errors literal sentences `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/BatchServiceImpl.java:75-79,113-119`
- vNext now: New uses machine error codes `src/modules/academics/cohort-service.ts:57-75`
- Fix: Audit exact validation toast/inline wording in UI.
