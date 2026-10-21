# Work packet (wave 2): edit src/app/(authenticated)/teacher/report/assignment/[contentId]/loading.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/teacher-report-assignment-content-id.md

## G2-4-013-055  [P2] GAP  facet F13  effort S
- Legacy: Legacy loading shows DashboardSkeleton metrics4 and Loading assignment report. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:128-133`)
- vNext now: New GracefulPageLoading directory shape. (`src/app/(authenticated)/teacher/report/assignment/[contentId]/loading.tsx:1-6`)
- Fix: Render four stat skeleton cards and report chart skeleton.
