# Work packet (wave 2): edit src/components/courses/faculty-assessment-overview.tsx (part 2 of 2)

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/teacher-all-assignments.md

## G2-4-012-070  [P2] GAP  facet F16  effort M
- Legacy: Legacy horizontal action rail and 640px drawer. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:126-193`; `docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:527-548`)
- vNext now: New disclosure actions grid, nested drawers without stated width. (`src/components/courses/faculty-assessment-overview.tsx:193-253`; `src/components/courses/faculty-assessment-create.tsx:47-81`)
- Fix: Match desktop card action row and mobile stacking, drawer width.

## G2-4-012-072  [P2] GAP  facet F17  effort M
- Legacy: Card primary is focusable with aria-label View assignment: title. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:128-134`)
- vNext now: No card-wide View focus target. (`src/components/courses/faculty-assessment-overview.tsx:163-255`)
- Fix: Add keyboard View primary and nested action safe click handling.

## G2-4-012-076  [P2] GAP  facet F18  effort S
- Legacy: Row labels View Submissions and Report. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:157-183`)
- vNext now: New View submissions and View Report differ in capitalization. (`src/components/courses/faculty-assessment-overview.tsx:236-246`)
- Fix: Use exact old action text and icon.

## G2-4-012-079  [P2] GAP  facet F19  effort L
- Legacy: Old server pages size20, fetches small submission preflight on deletion. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:282-309`; `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:441-454`)
- vNext now: New eager aggregation of assignments and submitted IDs, client page slicing. (`src/modules/courses/faculty-assessment-service.ts:69-90`; `src/components/courses/faculty-assessment-overview.tsx:48-57`)
- Fix: Add bounded server paging and efficient submission existence fetch.

## G2-4-012-083  [P2] GAP  facet F20  effort M
- Legacy: Legacy moment supports Jackson array/ISO dates. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:25-61`)
- vNext now: New JS Date with fixed IST locale. (`src/components/courses/faculty-assessment-overview.tsx:59-69`)
- Fix: Audit conversion at midnight and missing date/zone.

## G2-4-012-013  [P3] GAP  facet F04  effort S
- Legacy: Legacy title uses contentTitle or Untitled. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:133-140`)
- vNext now: New prints DB nonnull title directly. (`src/components/courses/faculty-assessment-overview.tsx:179-180`; `src/db/schema/assessments.ts:39-39`)
- Fix: Fallback to Untitled for historical blank title.

## G2-4-012-080  [P3] GAP  facet F19  effort M
- Legacy: Legacy drawers/modals lazy dynamic imports. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:17-20`)
- vNext now: New review statically imported and rendered per row. (`src/components/courses/faculty-assessment-overview.tsx:16-17`; `src/components/courses/faculty-assessment-overview.tsx:278-284`)
- Fix: Lazy load grading/review until requested.
