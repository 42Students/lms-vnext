# Work packet: edit src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/teacher-report-assignment-content-id.md

## G2-4-013-001  [P1] GAP  facet F01  effort M
- Legacy: Route /teacher/report/assignment/[contentId] loads AssignmentReportContent from client page. (`docs/legacy-source/frontend/src/pages/teacher/report/assignment/[contentId].js:1-7`; `docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:29-36`)
- vNext now: Same route parsed as UUID with optional deliveryId and loads server report. (`src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx:21-38`)
- Fix: Keep deep links working for authorized report IDs; resolve shared offering section explicitly.

## G2-4-013-002  [P1] GAP  facet F01  effort M
- Legacy: Report opens from teacher All Assignments row and course Blueprint preview; both navigate with contentId alone. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:29-33`)
- vNext now: Report requires deliveryId for shared assignment collision; link from faculty list includes it. (`src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx:28-38`; `src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx:48-65`)
- Fix: Add legacy URL compatibility where single authorized delivery is known, safe chooser for multiple.

## G2-4-013-018  [P1] GAP  facet F04  effort M
- Legacy: Legacy Submitted stat N/rosterSize if roster found, else N only. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:160-163`)
- vNext now: New Submitted always N/eligibleLearners and requires roster. (`src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx:95-100`; `src/modules/courses/faculty-assessment-report-service.ts:304-315`)
- Fix: Support submission-only report partial state when roster unavailable.
