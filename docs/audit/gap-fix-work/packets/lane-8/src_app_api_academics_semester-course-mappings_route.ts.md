# Work packet: edit src/app/api/academics/semester-course-mappings/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/semester-courses.md

## G2-12-002-041  [P1] GAP  facet F10  effort S
- Legacy: POST bulk `{course_ids}` skips already mapped `docs/legacy-source/frontend/src/api/Services/SemesterService.js:28-29`
- vNext now: POST bulk `{mappings}` returns duplicate conflict `src/app/api/academics/semester-course-mappings/route.ts:9-21`
- Fix: Match idempotent duplicate semantics
