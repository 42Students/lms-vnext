# Work packet: edit src/modules/courses/validation.ts (part 2 of 2)

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/course.md

## G2-8-020-027  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CourseServiceImpl.java:95-100 Invalid slug format/Slug already in use
- vNext now: src/modules/courses/validation.ts:22-30 new code validation error wording
- Fix: Separate slug and code validation; preserve explicit errors.
