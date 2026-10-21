# Work packet (wave 3): edit src/app/(authenticated)/college/faculty-assignment/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/l19-u019-faculty-teaching-assignment.md

## G2-19-019-019  [P1] MISSING  facet F06  effort L
- Legacy: FacultyTeachingAssignmentServiceImpl.java:89-105 createBulk creates one row per course/class target
- vNext now: src/app/(authenticated)/college/faculty-assignment/page.tsx:154-168 single-row actions, no bulk form established
- Fix: Build bulk assignment wizard or identify current multiple-delivery API; report row-by-row success/error
