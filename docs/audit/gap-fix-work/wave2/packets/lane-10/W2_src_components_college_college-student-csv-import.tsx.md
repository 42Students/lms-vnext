# Work packet (wave 2): edit src/components/college/college-student-csv-import.tsx

21 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/super-admin-students.md, docs/audit/gap2/lane-15/l18-u031-people-management.md, docs/audit/gap2/lane-19/superadmin-students.md, docs/audit/gap2/lane-5/u027-learner-controller.md, docs/audit/gap2/lane-7/u036-cross-exports-imports.md

## G2-14-002-070  [P2] GAP  facet F14  effort S
- Legacy: Legacy sample bulk_learners_sample.csv with two John/Jane rows; vNext student-import-template.csv — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:881-891`
- vNext now: `src/components/college/college-student-csv-import.tsx:62-75`
- Fix: Use legacy filename/example content, maintain safe parser

## G2-14-002-084  [P2] GAP  facet F18  effort S
- Legacy: Legacy bulk Validate/Create/Sample CSV/Import History; vNext Preview/Confirm import/Download template — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1405-1419`
- vNext now: `src/components/college/college-student-csv-import.tsx:62-75,145-166`
- Fix: Use exact button labels and order

## G2-18-031-058  [P2] GAP  facet F14  effort M
- Legacy: Legacy student CSV max500 and header First Name,Last Name,Roll Number,Mobile Number,Email, bulk validation & sample, history and undo; Students.js:147-148,720-888
- vNext now: vNext up to500 max1MB, same template, PREVIEW, explicit import confirmation, neutralized report CSV; college-student-csv-import.tsx:60-165
- Fix: Restore original sample filename/header and historical import undo; retain safe neutralized CSV export

## G2-18-031-065  [P2] GAP  facet F16  effort M
- Legacy: Legacy bulk tables have dense rows and horizontal scrolling for 500, modals desktop centered; Students.js:928-965,1280-1400
- vNext now: vNext imported validation DataTable with mobile priorities and full-width buttons; college-student-csv-import.tsx:127-165
- Fix: Match legacy table header/row heights, mobile priority and footer without losing error detail

## G2-19-001-048  [P2] GAP  facet F10  effort M
- Legacy: Legacy bulk POST `/api/v1/learner/bulk-validate` then `/bulk-register` with college/program/class and learner rows `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:395-430`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:770-771`,835-848
- vNext now: vNext single POST `/api/people/student-import` with PREVIEW/IMPORT and CSV text `src/components/college/college-student-csv-import.tsx:42-54`; `src/app/api/people/student-import/route.ts:8-16`
- Fix: Verify corresponding duplicate rules and row receipt parity; preserve validation before commit.

## G2-19-001-064  [P2] GAP  facet F14  effort S
- Legacy: Legacy sample `bulk_learners_sample.csv` includes two example people `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:881-889`
- vNext now: vNext template `student-import-template.csv` header only `src/components/college/college-student-csv-import.tsx:69-74`
- Fix: Ship same sample filename and example rows (with safe non-real values).

## G2-19-001-068  [P2] GAP  facet F14  effort S
- Legacy: Legacy CSV parse failures show `Failed to parse CSV: ...` toast `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:740-754`
- vNext now: vNext validation errors embedded in report and import alert `src/components/college/college-student-csv-import.tsx:117-124`,127-149
- Fix: Surface precise parse failure prior to network request with legacy wording.

## G2-19-001-077  [P2] GAP  facet F18  effort S
- Legacy: Legacy actions `Validate`, `Create`, `Sample CSV`, `Import History` `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1405-1418`
- vNext now: vNext `Preview validation`, `Confirm import of validated rows`, `Download CSV template`, `Import History` `src/components/college/college-student-csv-import.tsx:69-74`,117-123,157-165; `src/components/admin/super-admin-student-import-history.tsx:14-16`
- Fix: Align labels where semantics truly match; document added explicit confirmation separately.

## G2-5-027-009  [P2] GAP  facet F02  effort M
- Legacy: Legacy registration and bulk flow accessed by existing admin forms. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:338-468`
- vNext now: vNext dedicated Register students and Import students with sections and confirm controls. `src/components/college/college-student-register-form.tsx:70-129`, `src/components/college/college-student-csv-import.tsx:60-65`
- Fix: Place forms in matching entry order and consolidate import-history jump.

## G2-5-027-026  [P2] GAP  facet F06  effort M
- Legacy: Legacy bulk request requires college,program,class and learners, max 500. `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/BulkRegisterRequest.java:20-34`
- vNext now: vNext CSV supports 500 rows, 1MB, and program/cohort/optional section as pickers. `src/modules/people/college-student-csv-model.ts:4-31`, `src/components/college/college-student-csv-import.tsx:60-65`
- Fix: Maintain template field compatibility and explain class optionality.

## G2-5-027-071  [P2] MISSING  facet F18  effort M
- Legacy: Legacy undo says `Undone: N learner(s) removed`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:455-460`
- vNext now: vNext import uses generic report, no matching undo message. `src/components/college/college-student-csv-import.tsx:42-56`
- Fix: Restore exact undo receipt once compensation exists.

## G2-7-036-002  [P2] GAP  facet F01  effort S
- Legacy: Students.js:881-891 Bulk register learner sample via student administration
- vNext now: college-student-csv-import.tsx:60-74 dedicated Import section and template action
- Fix: Preserve entry and two-row sample content

## G2-7-036-005  [P2] GAP  facet F02  effort M
- Legacy: Students.js:820-865 Validate then Create then report
- vNext now: college-student-csv-import.tsx:60-130 Upload/Paste, Preview validation, result below
- Fix: Match form steps, wizard headings and report card order

## G2-7-036-010  [P2] GAP  facet F03  effort S
- Legacy: Students.js:881-891 Download sample CSV with two students
- vNext now: college-student-csv-import.tsx:70-74 Download CSV template, header only
- Fix: Restore legacy sample and labels

## G2-7-036-019  [P2] GAP  facet F05  effort M
- Legacy: Students.js:842-859 result createdIds and failure rows
- vNext now: college-student-csv-import.tsx:127-170 VALID/INVALID/IMPORTED/FAILED/PARTIAL rows
- Fix: Preserve created IDs and full row-index failure detail

## G2-7-036-034  [P2] GAP  facet F09  effort M
- Legacy: Students.js:820-865 bulk validate/create modal
- vNext now: college-student-csv-import.tsx:60-170 inline upload and separate report
- Fix: Align dialog trigger and confirmation actions

## G2-7-036-050  [P2] GAP  facet F13  effort S
- Legacy: Students.js:858 zero records Created N=0 shows error
- vNext now: college-student-csv-import.tsx:49 bad response Unable to validate student CSV
- Fix: Distinguish no creations from malformed response

## G2-7-036-054  [P2] GAP  facet F14  effort S
- Legacy: Students.js:881-890 two sample learner rows in bulk_learners_sample.csv
- vNext now: college-student-csv-import.tsx:70-74 header-only student-import-template.csv
- Fix: Supply legacy two sample rows and filename

## G2-7-036-061  [P2] GAP  facet F16  effort S
- Legacy: Students.js:881-890 sample action within modal
- vNext now: college-student-csv-import.tsx:60-170 responsive section layout
- Fix: Match responsive sample action placement

## G2-7-036-067  [P2] GAP  facet F18  effort S
- Legacy: Students.js:881-890 Download sample CSV
- vNext now: college-student-csv-import.tsx:70-74 Download CSV template
- Fix: Restore sample label and filename

## G2-18-031-060  [P3] GAP  facet F14  effort S
- Legacy: Legacy CSV upload via AntD Upload beforeUpload false + sample download; Students.js:731-750;Faculty.js:1154-1162
- vNext now: vNext FileUpload accept .csv with maxBytes and template/report download; college-student-csv-import.tsx:70-115;super-admin-faculty-bulk-import.tsx:78-97
- Fix: Match upload dropzone/button, selected filename/error states and 44px touch affordances
