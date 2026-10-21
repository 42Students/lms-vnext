# Work packet (wave 3): edit src/db/schema/profiles.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l18-u031-people-management.md

## G2-18-031-080  [P1] MISSING  facet F22  effort L
- Legacy: Legacy learner bulk_import_batch_id enables undo and roll_number is learner column; Learner.java:30-49
- vNext now: vNext learnerProfiles rollNumber and no registered batch ID, history in activityEvents; profiles.ts:15-31;college-student-csv-service.ts:202-228
- Fix: Add batch_id per imported membership with index, per-row undo journal and dependency guards if undo retained
