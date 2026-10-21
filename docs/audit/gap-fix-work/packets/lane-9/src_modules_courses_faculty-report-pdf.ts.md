# Work packet: edit src/modules/courses/faculty-report-pdf.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/teacher-report-assignment-content-id.md

## G2-4-013-061  [P1] GAP  facet F14  effort L
- Legacy: Legacy PDF exports A4 styled jsPDF with teal heading, summary cards and autoTable. (`docs/legacy-source/frontend/src/utils/downloadAssignmentReportPdf.js:19-98`)
- vNext now: New custom Courier text PDF with line-by-line sections, no styled cards. (`src/modules/courses/faculty-report-pdf.ts:43-100`)
- Fix: Rebuild polished A4 PDF visual parity: summary strip, tables, colors and layout.

## G2-4-013-063  [P1] GAP  facet F14  effort L
- Legacy: Legacy PDF uses jsPDF unicode-compatible text fallback; date Generated MMM D, YYYY at h:mm A. (`docs/legacy-source/frontend/src/utils/assignmentReport.js:114-115`; `docs/legacy-source/frontend/src/utils/downloadAssignmentReportPdf.js:35-37`)
- vNext now: New printable() strips accents and non-ASCII to question mark and generated UTC timestamp. (`src/modules/courses/faculty-report-pdf.ts:17-23`; `src/modules/courses/faculty-report-pdf.ts:60-64`)
- Fix: Preserve accented/non-English names and old generation timestamp format.
