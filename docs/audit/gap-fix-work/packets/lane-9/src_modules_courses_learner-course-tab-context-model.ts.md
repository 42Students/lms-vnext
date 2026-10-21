# Work packet: edit src/modules/courses/learner-course-tab-context-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u006-learner-course-redirect.md

## G2-16-006-024  [P1] GAP  facet F12  effort S
- Legacy: `index.js:13-16`: preserves raw query suffix verbatim, including cls and unknown params.
- vNext now: `[deliveryId]/page.tsx:9`; `learner-course-tab-context-model.ts:1-9`: redirect loses context although tab-to-tab helper retains most keys.
- Fix: Share the safe persistent query function with base redirect; preserve allowed unknown query keys with bounds.
