# Work packet (wave 2): edit src/components/tpo/tpo-students-spreadsheet.tsx

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/tpo-students.md, docs/audit/gap2/lane-4/tpo-students-hub-controller.md

## G2-14-001-007  [P2] GAP  facet F03  effort M
- Legacy: Legacy four multiselects Batch/Program/Department/Class with counts; vNext Batch one-value in advanced and Program/Class inside grid — `docs/legacy-source/frontend/src/components/tpo/students/StudentsTop.jsx:93-109`
- vNext now: `src/app/(authenticated)/tpo/students/page.tsx:587-593`; `src/components/tpo/tpo-students-spreadsheet.tsx:151-154`
- Fix: Recreate grouped multi selectors with dependent counts and finished labels

## G2-14-001-012  [P2] GAP  facet F04  effort M
- Legacy: Legacy panel has raw contact email/phone with copy and mailto/tel; vNext only masked last four and email export-only — `docs/legacy-source/frontend/src/components/tpo/StudentPanel.js:344-359`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoStudentsReadService.java:62-83`
- vNext now: `src/components/tpo/tpo-student-quick-panel.tsx:113-133`; `src/components/tpo/tpo-students-spreadsheet.tsx:47,96`
- Fix: Add authorized contact reveal/copy while honoring vNext masking policy

## G2-14-001-014  [P2] GAP  facet F04  effort M
- Legacy: Legacy academic marks display entered/conversion and Verified tag per level; vNext flat CGPA/PG/marks without converted provenance — `docs/legacy-source/frontend/src/components/tpo/StudentPanel.js:310-345`
- vNext now: `src/components/tpo/tpo-students-spreadsheet.tsx:64-73`; `src/components/tpo/tpo-student-quick-panel.tsx:113-133`
- Fix: Add 10th/12th/Diploma/UG/PG mark rows with verified/converted notes and tooltips

## G2-14-001-016  [P2] GAP  facet F05  effort M
- Legacy: Legacy default columns Student/Roll/Batch/Stage/After college/Profile/Best/Applications/Offers; vNext defines other columns earlier — `docs/legacy-source/frontend/src/pages/tpo/students/index.js:142-178`
- vNext now: `src/components/tpo/tpo-students-spreadsheet.tsx:36-97,145-150`
- Fix: Reorder default visible columns, hide all other vNext additions in chooser

## G2-14-001-017  [P2] GAP  facet F05  effort M
- Legacy: Legacy Class/Branch/Gender/Email/Phone optional hidden fields; vNext Branch and Gender among early columns, Email export-only — `docs/legacy-source/frontend/src/pages/tpo/students/index.js:142-178`
- vNext now: `src/components/tpo/tpo-students-spreadsheet.tsx:40-47,96-97`
- Fix: Add Class and hide fields by default, allow appropriate contact columns with permission gate

## G2-14-001-019  [P2] GAP  facet F05  effort S
- Legacy: Legacy default firstName,lastName sorting; vNext local page sorts displayName lexically — `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoStudentsReadService.java:84-88`
- vNext now: `src/components/tpo/tpo-students-spreadsheet.tsx:107-113`
- Fix: Use firstname/lastname deterministic server sort across entire roster

## G2-14-001-020  [P2] GAP  facet F05  effort M
- Legacy: Legacy numeric Applications/Offers header sort; vNext separate page-only Sort visible roster page select — `docs/legacy-source/frontend/src/pages/tpo/students/index.js:172-178`
- vNext now: `src/components/tpo/tpo-students-spreadsheet.tsx:215-223`
- Fix: Add clickable numeric headers and server-safe whole-filter sorting

## G2-14-001-021  [P2] GAP  facet F05  effort L
- Legacy: Legacy one Filter students drawer with live option counts and chips; vNext advanced form plus grid filters plus main GET form — `docs/legacy-source/frontend/src/components/tpo/students/studentGridRules.js:92-133`; `docs/legacy-source/frontend/src/components/tpo/grid/GridWorkspace.jsx:384-438`
- vNext now: `src/app/(authenticated)/tpo/students/page.tsx:443-607,870-934`; `src/components/tpo/tpo-students-spreadsheet.tsx:151-173`
- Fix: Unify filters in six ordered drawers/categories, live counts, Reset and Show N, chips

## G2-14-001-047  [P2] GAP  facet F12  effort M
- Legacy: Legacy finished batches hidden default but selectable with From badge; vNext supports batch selection with different label — `docs/legacy-source/frontend/src/components/tpo/students/studentGridRules.js:22-30`; `docs/legacy-source/frontend/src/components/tpo/students/StudentsTop.jsx:93-99`
- vNext now: `src/app/(authenticated)/tpo/students/page.tsx:587-610`; `src/components/tpo/tpo-students-spreadsheet.tsx:36-40`
- Fix: Use All active batches and marked finished batch options in grouped selector

## G2-14-001-058  [P2] GAP  facet F16  effort M
- Legacy: Legacy actions dropdown on mobile and filter sheet; vNext long stacked below-grid bulk area and card grid — `docs/legacy-source/frontend/src/components/tpo/students/StudentActions.jsx:33-44`; `docs/legacy-source/frontend/src/components/tpo/students/StudentsTop.jsx:111-152`
- vNext now: `src/app/(authenticated)/tpo/students/page.tsx:971-1021`; `src/components/tpo/tpo-students-spreadsheet.tsx:223-245`
- Fix: Use mobile action-category select and bottom-sheet filters

## G2-14-001-059  [P2] GAP  facet F16  effort S
- Legacy: Legacy responsive Batch 360/Program220/Department240/Class220 with max-width100%; vNext split controls — `docs/legacy-source/frontend/src/components/tpo/students/StudentsTop.jsx:93-109`
- vNext now: `src/app/(authenticated)/tpo/students/page.tsx:587-593,870-934`; `src/components/tpo/tpo-students-spreadsheet.tsx:151-154`
- Fix: Restore width/wrap token sizing at mobile/tablet/desktop

## G2-14-001-060  [P2] GAP  facet F17  effort M
- Legacy: Legacy grid Enter opens student, Ctrl+A selection, Ctrl+C copy; vNext wrapper Ctrl+A/C and accessible Open panel button — `docs/legacy-source/frontend/src/components/tpo/grid/GridWorkspace.jsx:475-487`; `docs/legacy-source/frontend/src/pages/tpo/students/index.js:35-43`
- vNext now: `src/components/tpo/tpo-students-spreadsheet.tsx:174-188,228-235`
- Fix: Verify Enter and focus-cell copy, add missing shortcuts/toast

## G2-4-022-004  [P2] GAP  facet F02  effort L
- Legacy: Legacy students table with views, per-student panel, notes, registration, bulk actions and import. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:14-18`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:56-62`)
- vNext now: New spreadsheet with extensive custom columns, filters, selection and quick panel. (`src/app/(authenticated)/tpo/students/page.tsx:957-1021`; `src/components/tpo/tpo-students-spreadsheet.tsx:30-98`)
- Fix: Match original column order, saved-view labels, toolbar and right-panel geometry.

## G2-4-022-007  [P2] GAP  facet F03  effort M
- Legacy: Legacy table emits compact per-student summary and stage/registration/placement state from read service. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:56-62`)
- vNext now: New grid has Student, roll, batch, branch, stage, profile, CGPA, offers, best results and custom columns. (`src/components/tpo/tpo-students-spreadsheet.tsx:36-96`)
- Fix: Map exact legacy fields and display order, avoid extra default columns.
