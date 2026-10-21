# Work packet: edit src/components/courses/learner-course-overview.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/shared-course-home.md

## G2-8-009-022  [P2] GAP  facet F07  effort M
- Legacy: legacy learner progress error shows Progress could not be loaded. You can still open course content. (`docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:413-420`)
- vNext now: vNext no-denominator warning Course progress not yet measurable (`src/components/courses/learner-course-overview.tsx:410-415`)
- Fix: Distinguish actual fetch failure from no measurable denominator; preserve failure copy
