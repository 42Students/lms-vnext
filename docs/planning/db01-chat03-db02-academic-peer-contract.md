# DB004 → DB005 academic cross-domain peer closure

All six DB-004 fields routed to DB-005 now have explicit dispositions.

- `faculty.dept_id` → `faculty_profiles.primary_department_id`
- `faculty.department` → derived department name from that FK
- `learner.program_id` → unique ACTIVE `learner_program_enrollments.program_id`
- `learner.class_id` → active period-aware `section_enrollments.section_id`
- `learner.department` → derived through active program → department
- `learner.bulk_import_batch_id` → normalized immutable
  `learner_import_batches + learner_import_batch_members`

The last field is **not an undo primitive**. V126 originally introduced it so a
bad import could be grouped for undo, but current `LearnerServiceImpl.undoBulkImport`
deliberately throws because mass deletion can orphan assignments, attendance,
projects and other learner work. vNext therefore keeps batch traceability and
same-college lineage with RESTRICT semantics and requires individual audited
correction/suspension for affected accounts.

Source/design evidence only. The staged schema is not exported, the SQL is not
registered, and PostgreSQL/runtime proof remains pending.
