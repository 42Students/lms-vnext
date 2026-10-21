# Work packet (wave 2): edit src/modules/academics/college-batch-promotion-execute.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/batch-controller.md, docs/audit/gap2/lane-5/u021-batch.md

## G2-2-029-051  [P2] GAP  facet F10  effort M
- Legacy: BatchController.java:159-186 promote calls batchService.promoteBatch; audit BATCH_PROMOTE.
- vNext now: college-batch-promotion-execute.ts:39-179 transaction locks progression and audits ACADEMICS_BATCH_PROMOTED.
- Fix: Align admin activity taxonomy and ensure promotion impact details available.

## G2-2-029-075  [P2] GAP  facet F15  effort S
- Legacy: BatchController.java:177-185 BATCH_PROMOTE audit with targetSemester/newAcademicYear.
- vNext now: college-batch-promotion-execute.ts:155-169 includes previous/new term, version, learnerCount and faculty delta.
- Fix: Create Activity Log wording/metadata compatibility mapping.

## G2-5-021-011  [P2] GAP  facet F04  effort M
- Legacy: Legacy currentSemester Integer default1 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Batch.java:34-35`
- vNext now: New separate cohortProgressionState.currentTermNumber and version `src/modules/academics/college-batch-promotion-execute.ts:62-67,139-151`
- Fix: Seed progression1 on cohort creation and map legacy current value.

## G2-5-021-021  [P2] GAP  facet F06  effort M
- Legacy: Legacy academic year auto-calculated from startDate using July threshold `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/BatchServiceImpl.java:93-98,122-136`
- vNext now: New planned term start is explicit `yearStart` in promotion inputs `src/modules/academics/college-batch-promotion-execute.ts:74-85`
- Fix: Apply exact academic-year normalization/default algorithm.

## G2-5-021-036  [P2] GAP  facet F12  effort M
- Legacy: Legacy promotion auto suggests increment academic year after term change `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/BatchServiceImpl.java:164-170`
- vNext now: VNext promotion uses preview planned targetTerm/yearStart `src/modules/academics/college-batch-promotion-execute.ts:74-85`
- Fix: Check odd/even legacy academic-year transition against new term calendar.

## G2-5-021-047  [P2] GAP  facet F20  effort S
- Legacy: Legacy academic year uses JVM local Calendar timezone `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/BatchServiceImpl.java:122-136`
- vNext now: New SQL date-only and currentAcademicYearStart int `src/db/schema/academics.ts:150-152` `src/modules/academics/college-batch-promotion-execute.ts:139-143`
- Fix: Define Asia/Kolkata calendar boundary explicitly.

## G2-2-029-006  [P3] GAP  facet F01  effort S
- Legacy: BatchController.java:229-259 PUT direct semester edit (restricted in service).
- vNext now: src/modules/academics/college-batch-promotion-execute.ts:39-46 only guarded promotion execute.
- Fix: Remove dead UI semester editor or preserve explicit `Use Batch Promotion` help.

## G2-2-029-086  [P3] GAP  facet F18  effort S
- Legacy: BatchController.java:184 `Batch promoted to semester N`.
- vNext now: college-batch-promotion-execute.ts:161-178 returns term number, not human copy.
- Fix: Show exact success status in UI or map term variant.
