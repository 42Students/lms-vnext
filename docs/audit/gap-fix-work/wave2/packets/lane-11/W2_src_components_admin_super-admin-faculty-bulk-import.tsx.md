# Work packet (wave 2): edit src/components/admin/super-admin-faculty-bulk-import.tsx

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/superadmin-faculty-section.md, docs/audit/gap2/lane-7/u036-cross-exports-imports.md, docs/audit/gap2/lane-9/l15-u027-faculty-controller.md, docs/audit/gap2/lane-15/l18-u031-people-management.md

## G2-6-002-067  [P2] GAP  facet F14  effort S
- Legacy: Old bulk sample `First Name,Last Name,Mobile Number,Email,Faculty Type`, John/Jane examples `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:746-754`
- vNext now: New sample has only four columns, Anjali example `src/components/admin/super-admin-faculty-bulk-import.tsx:78-85`
- Fix: Match exact sample header, including Faculty Type column/defaults

## G2-6-002-072  [P2] GAP  facet F16  effort M
- Legacy: Old `Row/Col` registration becomes one column on phone and two on lg `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:975-981` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1110-1114`
- vNext now: New onboarding uses md two-column dialog; import one-column disclosure `src/components/admin/person-onboard-dialog.tsx:149-163` `src/components/admin/super-admin-faculty-bulk-import.tsx:87-96`
- Fix: Match card stacking at breakpoints and preserve mobile minimum touch target

## G2-7-036-006  [P2] GAP  facet F02  effort M
- Legacy: Faculty.js:604-632 FileReader then preflight then Create
- vNext now: super-admin-faculty-bulk-import.tsx:29-76 local parse then confirmation then create
- Fix: Expose distinct preflight stage and keep file/name status in same section

## G2-7-036-035  [P2] GAP  facet F09  effort M
- Legacy: Faculty.js:593-631 upload, validate, create UI
- vNext now: super-admin-faculty-bulk-import.tsx:87-119 inline section with confirm dialog
- Fix: Match modal context and navigation back to list

## G2-7-036-062  [P2] GAP  facet F16  effort S
- Legacy: Faculty.js:593-631 modal/CSV flow
- vNext now: super-admin-faculty-bulk-import.tsx:87-100 responsive stacked mobile actions
- Fix: Match action ordering and text widths

## G2-7-036-068  [P2] GAP  facet F18  effort S
- Legacy: Faculty.js:625 Parsed N row(s)...
- vNext now: super-admin-faculty-bulk-import.tsx:98 N rows validated locally
- Fix: Explain validation status precisely

## G2-7-036-077  [P2] GAP  facet F21  effort L
- Legacy: Faculty.js:648-650 preflight checks existing mobile/email
- vNext now: super-admin-faculty-bulk-import.tsx:66-73 one POST
- Fix: Audit duplicate lookup timing before persistence

## G2-15-027-035  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:593-650 bulk import panel file/college/dept/Validate/Create flows
- vNext now: src/components/admin/super-admin-faculty-bulk-import.tsx:87-117 single CSV file picker with confirm and Create
- Fix: Provide separate Validate and Create steps with department selector and row preview.

## G2-15-027-053  [P2] GAP  facet F14  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:173-184 dedicated bulk-validate before register
- vNext now: src/components/admin/super-admin-faculty-bulk-import.tsx:48-77 local parse then confirmation then create
- Fix: Restore preflight server-side duplicate check without creating rows.

## G2-15-027-060  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:634-649 Validate or Create separate button labels
- vNext now: src/components/admin/super-admin-faculty-bulk-import.tsx:100-102 Validate and Create single CTA
- Fix: Split controls into Validate and Create with correct disabled states.

## G2-18-031-060  [P3] GAP  facet F14  effort S
- Legacy: Legacy CSV upload via AntD Upload beforeUpload false + sample download; Students.js:731-750;Faculty.js:1154-1162
- vNext now: vNext FileUpload accept .csv with maxBytes and template/report download; college-student-csv-import.tsx:70-115;super-admin-faculty-bulk-import.tsx:78-97
- Fix: Match upload dropzone/button, selected filename/error states and 44px touch affordances
