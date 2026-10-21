# Work packet (wave 2): edit src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/loading.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u001-faculty-course-tab.md

## G2-18-001-066  [P2] GAP  facet F13  effort M
- Legacy: Legacy skeleton varies by active tab: roster, attendance grid, chat, tree, faculty overview. `docs/legacy-source/frontend/src/components/Course/Common/CourseTabSkeleton.jsx:158-182`
- vNext now: vNext common `GracefulPageLoading` directory shape on catch-all routes. `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/loading.tsx:1-5`
- Fix: Use tab-aware skeleton shapes with comparable aria labeling and stable layout.
