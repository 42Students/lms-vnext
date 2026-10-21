# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-11/l19-u027-course-controller.md

1 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-11/l19-u027-course-controller.md

## G2-19-027-019  [P2] MISSING  facet F06  effort M
- Legacy: Legacy `parent_course_id` nullable integer distinguishes absent vs 0 to clear; CourseDTO.java:22-26; CourseServiceImpl.java:306-321
- vNext now: vNext updateCourseInputSchema rejects parent ID and departmentId; validation.ts:66-89
- Fix: Map hierarchy to real parent relation or explicitly remove dead parent control from clone; avoid silently losing stored hierarchy.
