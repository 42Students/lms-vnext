# Work packet (wave 2): edit src/modules/courses/learner-course-tab-context-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/learner-courses-courseid-catchall.md

## G2-17-006-014  [P2] GAP  facet F05  effort 
- Legacy: docs/legacy-source/frontend/src/layouts/CourseTabsLayout.js:39-46 strips lesson/content/filter when moving tabs, retains other query keys.
- vNext now: src/modules/courses/learner-course-tab-context-model.ts:1-9 strips same three keys but truncates to 20 and 500 chars.
- Fix: Compare repeated/malformed query normalization and explicitly document cap.
