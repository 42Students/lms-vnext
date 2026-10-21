# Work packet (wave 2): edit src/app/(authenticated)/college/courses/offerings/[offeringId]/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/college-admin-course-detail.md

## G2-19-007-004  [P2] GAP  facet F01  effort M
- Legacy: Legacy college admin route uses AdminLayout `docs/legacy-source/frontend/src/pages/college-admin/courses/[id].js:184`
- vNext now: vNext uses authenticated college layout + AdminOfferingLearningPage `src/app/(authenticated)/college/courses/offerings/[offeringId]/page.tsx:25-33`
- Fix: Match Course page shell/sidebar, breadcrumb and horizontal rhythm.
