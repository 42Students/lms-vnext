# Work packet (wave 2): edit src/modules/courses/faculty-report-pdf.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/teacher-report-assignment-content-id.md

## G2-4-013-043  [P2] GAP  facet F10  effort L
- Legacy: Legacy download generates jsPDF client-side from already fetched report and local class roster. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:102-125`; `docs/legacy-source/frontend/src/utils/downloadAssignmentReportPdf.js:19-37`)
- vNext now: New client builds custom PDF from server-scoped arrays. (`src/components/courses/faculty-report-download.tsx:14-44`; `src/modules/courses/faculty-report-pdf.ts:43-75`)
- Fix: Match PDF visual/layout and warning stamp while retaining server authorization.

## G2-4-013-062  [P2] GAP  facet F14  effort M
- Legacy: Legacy PDF embeds Not submitted roster as second table and INCOMPLETE DATA banner when roster fails. (`docs/legacy-source/frontend/src/utils/downloadAssignmentReportPdf.js:38-48`; `docs/legacy-source/frontend/src/utils/downloadAssignmentReportPdf.js:100-116`)
- vNext now: New PDF contains plain Not submitted lines and summary text This report is incomplete. (`src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx:83-94`; `src/modules/courses/faculty-report-pdf.ts:60-75`)
- Fix: Match missing roster table and prominent incomplete stamp.

## G2-4-013-087  [P2] GAP  facet F21  effort L
- Legacy: Legacy jsPDF/autoTable produces PDF (third-party library). (`docs/legacy-source/frontend/src/utils/downloadAssignmentReportPdf.js:1-20`)
- vNext now: New dependency-free PDF builder generates text-only PDF. (`src/modules/courses/faculty-report-pdf.ts:1-44`)
- Fix: Adopt a styled PDF exporter with dependable multilingual font support.
