# Work packet (wave 2): edit src/app/(authenticated)/learn/projects/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u004-learner-projects.md

## G2-15-004-055  [P2] GAP  facet F17  effort M
- Legacy: Legacy aria-label Search my projects, status/attention labels, aria-busy and SkeletonRegion (ProjectsContent.jsx:259-312)
- vNext now: Desktop label matches; mobile Search Projects, page no aria-busy (project-participant-list-controls.tsx:74-84; learner-project-mobile-filters.tsx:32-38; learn/projects/page.tsx:142-214)
- Fix: Restore status announcements, accessible names and busy region
