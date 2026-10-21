# Work packet (wave 2): edit src/modules/courses/learner-course-drilldown-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u027-learner-controller.md

## G2-5-027-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy learner REST controller covers attendance, course stats, personal program summary. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:71-75,151-330`
- vNext now: vNext decomposes into learner attendance/workspace services and delivery-based course pages. `src/modules/attendance/learner-service.ts:59-101`, `src/modules/courses/learner-course-drilldown-service.ts:59-65`
- Fix: Document endpoint-to-workspace route mapping, preserving learner deep links.

## G2-5-027-011  [P2] GAP  facet F03  effort M
- Legacy: Legacy course-home-stat response includes progress, grades, next content, attendance. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:272-311`
- vNext now: vNext drilldown provides course progress and attendance but no identical consolidated JSON response shown. `src/modules/courses/learner-course-drilldown-service.ts:59-98`
- Fix: Expose equivalent aggregate cards/status counts and next content mapping.

## G2-5-027-057  [P2] GAP  facet F13  effort M
- Legacy: Legacy missing learner program details returns 200 null. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:318-330`
- vNext now: vNext missing learner delivery returns empty/no authorized delivery. `src/modules/courses/learner-course-drilldown-service.ts:59-98`
- Fix: Match empty-program guidance; distinguish not-enrolled vs zero courses.
