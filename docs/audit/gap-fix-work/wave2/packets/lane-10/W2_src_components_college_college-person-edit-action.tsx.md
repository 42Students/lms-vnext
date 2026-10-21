# Work packet (wave 2): edit src/components/college/college-person-edit-action.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/super-admin-students.md, docs/audit/gap2/lane-19/superadmin-students.md, docs/audit/gap2/lane-6/college-admin-teachers.md, docs/audit/gap2/lane-6/superadmin-faculty-section.md

## G2-14-002-048  [P2] GAP  facet F09  effort S
- Legacy: Legacy Edit Student Modal width600 Save Changes/Cancel; vNext generic Dialog different width — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1593-1609`
- vNext now: `src/components/college/college-person-edit-action.tsx:85-95`
- Fix: Match 600px dialog and action labels/dismiss behavior

## G2-19-001-043  [P2] GAP  facet F09  effort M
- Legacy: Legacy `Edit Student` AntD modal width 600, cannot click backdrop, save/cancel, unsaved confirm `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1593-1609`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:702-715`
- vNext now: vNext shared dialog `Edit Student` with other field subset and no explicit `maskClosable` override `src/components/college/college-person-edit-action.tsx:88-104`,164-172
- Fix: Match dialog width, dismissal protections, field order and confirm-on-discard.

## G2-19-001-073  [P2] GAP  facet F17  effort S
- Legacy: Legacy row icon buttons have per-student `aria-label`s and tooltips/titles `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:966-1025`,1056-1084
- vNext now: vNext uses text action buttons and Open details link `src/app/(authenticated)/admin/students/page.tsx:90`; `src/components/college/college-person-edit-action.tsx:82-88`; `src/components/admin/admin-scoped-read-page.tsx:255-257`
- Fix: Preserve distinguishable student-specific accessible names for repeated row actions.

## G2-19-001-083  [P2] GAP  facet F20  effort M
- Legacy: Legacy edit supports `DD-MM-YYYY` and `YYYY-MM-DD` DOB parsing `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:38-45`,525-537
- vNext now: vNext edit date field directly uses ISO string `src/components/college/college-person-edit-action.tsx:144-146`
- Fix: Normalize legacy DOB formats in persisted data and preserve strict calendar semantics.

## G2-6-001-064  [P2] GAP  facet F18  effort S
- Legacy: Old `Bio / Description` label and `Brief description` hint `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1099-1101`
- vNext now: New edit label just `Bio` `src/components/college/college-person-edit-action.tsx:159-163`
- Fix: Use original field label/helper copy

## G2-6-001-069  [P2] GAP  facet F20  effort S
- Legacy: Old edit parses DOB `YYYY-MM-DD` and `DD-MM-YYYY` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:30-38` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:419-438`
- vNext now: New input uses ISO date strings `src/components/college/college-person-edit-action.tsx:136-140`
- Fix: Accept historical DD-MM-YYYY data and avoid silent DOB loss

## G2-6-002-046  [P2] GAP  facet F09  effort S
- Legacy: Old edit modal width 600, mask non-dismissable, Save Changes/Cancel `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1378-1392`
- vNext now: New CollegePersonEditAction Dialog uses Save changes/Cancel `src/components/college/college-person-edit-action.tsx:88-93` `src/components/college/college-person-edit-action.tsx:164-174`
- Fix: Match exact width, mask close and Save Changes casing

## G2-6-002-083  [P2] GAP  facet F20  effort S
- Legacy: Old DOB parser accepts YYYY-MM-DD and DD-MM-YYYY `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:30-38` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:419-438`
- vNext now: New edit date field consumes standardized ISO string `src/components/college/college-person-edit-action.tsx:136-140`
- Fix: Normalize historical DOB before form display and save
