# Work packet (wave 2): edit src/modules/courses/learner-course-tab-route-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/learner-courses-courseid-catchall.md

## G2-17-006-015  [P2] GAP  facet F05  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/courses/[courseId]/[...courseTab].js:101-108 invalid tab keeps query when redirecting; courseTab first segment even if array longer.
- vNext now: src/modules/courses/learner-course-tab-route-model.ts:6-9 rejects catch-all pathSegments length !=1 and redirects.
- Fix: Test path /roadmap/item; decide strict invalid multi-segment behavior and canonical fallback.
