# Work packet (wave 3): edit src/modules/people/college-student-csv-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l18-u031-people-management.md

## G2-18-031-053  [P1] MISSING  facet F12  effort L
- Legacy: Legacy bulk-import undo soft-deletes all learners by batch; LearnerController.java:436-463;Learner.java:30-34
- vNext now: vNext CSV import report is per-row with no one-step undo, history based on event; college-student-csv-service.ts:143-212,217-229
- Fix: Create safe batch-scoped undo with dependency preflight and per-row audit, or explicitly deprecate after approval

## G2-18-031-080  [P1] MISSING  facet F22  effort L
- Legacy: Legacy learner bulk_import_batch_id enables undo and roll_number is learner column; Learner.java:30-49
- vNext now: vNext learnerProfiles rollNumber and no registered batch ID, history in activityEvents; profiles.ts:15-31;college-student-csv-service.ts:202-228
- Fix: Add batch_id per imported membership with index, per-row undo journal and dependency guards if undo retained
