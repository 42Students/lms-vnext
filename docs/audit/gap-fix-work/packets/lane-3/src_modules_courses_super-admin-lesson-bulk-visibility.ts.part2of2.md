# Work packet: edit src/modules/courses/super-admin-lesson-bulk-visibility.ts (part 2 of 2)

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-lesson-bulk-controller.md

## G2-2-018-028  [P2] GAP  facet F08  effort S
- Legacy: AdminLessonBulkController.java:141-142 exact HTTP response message `Updated N of M lesson(s)`
- vNext now: super-admin-lesson-bulk-visibility.ts:55 no message field
- Fix: Return and surface same message.
