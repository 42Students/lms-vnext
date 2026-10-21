# Work packet: edit src/components/tpo/tpo-students-spreadsheet.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/tpo-students.md, docs/audit/gap2/lane-4/tpo-students-hub-controller.md

## G2-14-001-055  [P1] GAP  facet F14  effort M
- Legacy: Legacy Excel/CSV export selected/view with academics and view filename; vNext XLSX and CSV exist with different columns — `docs/legacy-source/frontend/src/components/tpo/grid/GridWorkspace.jsx:321-335`; `docs/legacy-source/frontend/src/pages/tpo/students/index.js:142-178`
- vNext now: `src/components/tpo/tpo-students-spreadsheet.tsx:96-97,117-142,223-227`
- Fix: Align export field ordering, marks and saved-view names

## G2-4-022-011  [P1] GAP  facet F04  effort L
- Legacy: Legacy learnerIds are integer list, jobId/courseId/assessmentId numeric in BulkRequest. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:30-46`)
- vNext now: New selection and API use UUID membership/drive identifiers. (`src/components/tpo/tpo-students-spreadsheet.tsx:98-104`; `src/components/tpo/tpo-students-drive-visibility.tsx:38-56`)
- Fix: Map old numeric identifiers to scoped UUID membership, job and content.

## G2-4-022-012  [P1] GAP  facet F04  effort M
- Legacy: Legacy placement registration accepts choice,label,detail string fields. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:78-82`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:121-125`)
- vNext now: New roster registration choice models and participation endpoints use typed values. (`src/app/(authenticated)/tpo/students/page.tsx:84-90`; `src/components/tpo/tpo-students-spreadsheet.tsx:88-89`)
- Fix: Map choice/label/detail and registration history into new participation events.

## G2-14-001-033  [P2] GAP  facet F08  effort S
- Legacy: Legacy clipboard Copied / Copied N rows. Paste into Excel or Sheets.; vNext success has no toast — `docs/legacy-source/frontend/src/components/tpo/grid/GridWorkspace.jsx:321-336`
- vNext now: `src/components/tpo/tpo-students-spreadsheet.tsx:174-188`
- Fix: Show exact success text and accessible status after copy
