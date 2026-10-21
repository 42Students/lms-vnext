# Work packet: edit src/db/schema/db02-learner-import-batches.staged.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u019-learner.md

## G2-5-019-010  [P1] GAP  facet F04  effort L
- Legacy: Legacy bulkImportBatchId column `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:30-34`
- vNext now: VNext batch tables staged, not active `src/db/schema/db02-learner-import-batches.staged.ts:1-18`
- Fix: Activate tracked import lineage after safety review.

## G2-5-019-046  [P1] GAP  facet F10  effort L
- Legacy: Legacy bulkImportBatchId makes created learners collectively traceable `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:30-34`
- vNext now: VNext separate staged batch relations not registered `src/db/schema/db02-learner-import-batches.staged.ts:1-72`
- Fix: Activate safe lineage and inspect existing dependencies before undo.

## G2-5-019-055  [P1] GAP  facet F14  effort L
- Legacy: Legacy V126 supports batch undo by soft delete `docs/legacy-source/backend/src/main/resources/db/migration/V126__learner_bulk_import_batch_id.sql:1-13`
- vNext now: New batch staging specifically avoids mass-delete primitive `src/db/schema/db02-learner-import-batches.staged.ts:1-8`
- Fix: Implement safe reversible process only with dependency proof.

## G2-5-019-069  [P1] GAP  facet F22  effort L
- Legacy: Legacy batch ID column/index V126 `docs/legacy-source/backend/src/main/resources/db/migration/V126__learner_bulk_import_batch_id.sql:1-13`
- vNext now: VNext batch member composite FKs staged only `src/db/schema/db02-learner-import-batches.staged.ts:14-70`
- Fix: Register migration and backfill actor/batch identity safely.
