# Work packet: edit src/app/(authenticated)/tpo/students/page.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/tpo-students.md, docs/audit/gap2/lane-4/tpo-students-hub-controller.md, docs/audit/gap2/lane-5/u022-tpo-student-controller.md

## G2-14-001-026  [P1] GAP  facet F06  effort M
- Legacy: Legacy bulk message ready chips, textarea rows4 max1000; vNext nudge separate from bulk picker — `docs/legacy-source/frontend/src/components/tpo/students/StudentActions.jsx:23-30,62-77`
- vNext now: `src/app/(authenticated)/tpo/students/page.tsx:971-979`
- Fix: Restore all five ready messages and textarea within unified actions

## G2-14-001-041  [P1] GAP  facet F10  effort L
- Legacy: Legacy Actions window covers drive overrides, message, After college, debar/lift, verify/sendback, prep and note; vNext general picker narrower and split controls — `docs/legacy-source/frontend/src/components/tpo/students/StudentActions.jsx:62-83,94-107,302-356`
- vNext now: `src/components/tpo/tpo-bulk-action-panel.tsx:25-41`; `src/app/(authenticated)/tpo/students/page.tsx:971-1020`
- Fix: Unify all 11 with precise per-action skip and undo semantics

## G2-4-022-001  [P1] GAP  facet F01  effort L
- Legacy: Legacy Students page GET /api/v1/tpo/students/table, detail, notes, register and 13 bulk endpoints. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:56-218`)
- vNext now: New /tpo/students server page composes intelligence, spreadsheet and multiple dedicated APIs. (`src/app/(authenticated)/tpo/students/page.tsx:411-415`; `src/app/(authenticated)/tpo/students/page.tsx:957-1021`)
- Fix: Map legacy route-by-route action results to new scoped API and UI.

## G2-4-022-002  [P1] GAP  facet F01  effort M
- Legacy: Legacy /table everyone=false lists only students participating in placements; everyone=true includes college students. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:56-62`)
- vNext now: New page uses placement rosters and batch/filter query, unclear direct everyone=true equivalent. (`src/app/(authenticated)/tpo/students/page.tsx:55-82`; `src/modules/placements/tpo-students-service.ts:240-253`)
- Fix: Add/verify all-college roster selection for pickers and bulk enrollment.

## G2-4-022-012  [P1] GAP  facet F04  effort M
- Legacy: Legacy placement registration accepts choice,label,detail string fields. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:78-82`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:121-125`)
- vNext now: New roster registration choice models and participation endpoints use typed values. (`src/app/(authenticated)/tpo/students/page.tsx:84-90`; `src/components/tpo/tpo-students-spreadsheet.tsx:88-89`)
- Fix: Map choice/label/detail and registration history into new participation events.

## G2-5-022-001  [P1] GAP  facet F01  effort M
- Legacy: Legacy root `/api/v1/tpo/students` GET and learner mutation children `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentController.java:20-30,43-88`
- vNext now: VNext TPO Students page and `/api/placements/tpo` routes, not legacy path `src/app/(authenticated)/tpo/students/page.tsx:1-55`
- Fix: Map old five student endpoints and consuming navigation to registered vNext routes.
