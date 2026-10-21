# Work packet (wave 2): edit src/components/college/college-student-register-form.tsx

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/super-admin-students.md, docs/audit/gap2/lane-15/l18-u031-people-management.md, docs/audit/gap2/lane-19/superadmin-students.md, docs/audit/gap2/lane-5/u027-learner-controller.md

## G2-14-002-031  [P2] GAP  facet F06  effort S
- Legacy: Legacy First and Last required with named error Enter the first/last name; vNext HTML required max120 default native — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1134-1149`
- vNext now: `src/components/college/college-student-register-form.tsx:71-75`
- Fix: Add field-level matching copy and placeholders

## G2-14-002-033  [P2] GAP  facet F06  effort M
- Legacy: Legacy mobile 10 digits/max10 and Used for OTP login helper; vNext E164 normalize and placeholder9876543210 — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1163-1171`
- vNext now: `src/components/college/college-student-register-form.tsx:77-81`
- Fix: Apply 10-digit UI rule and E164 conversion only on submit

## G2-14-002-037  [P2] GAP  facet F06  effort S
- Legacy: Legacy read-only College field shows name; vNext register form has no College field — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1180-1188`
- vNext now: `src/components/college/college-student-register-form.tsx:69-126`
- Fix: Add disabled College with scoped name

## G2-14-002-077  [P2] GAP  facet F16  effort M
- Legacy: Legacy lg two register/bulk columns and sm paired fields; vNext full-width stacked forms — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1128-1173,1255-1258`
- vNext now: `src/app/(authenticated)/admin/students/page.tsx:70-81`; `src/components/college/college-student-register-form.tsx:69-120`
- Fix: Use two card columns at lg, paired field grid at sm

## G2-18-031-026  [P2] GAP  facet F06  effort S
- Legacy: Legacy student Program and Class fields reject unavailable lookups, College shown disabled read-only with actual name; Students.js:1186-1221
- vNext now: vNext dependent Program→Batch→Class selects reset on parent; college-student-register-form.tsx:88-106
- Fix: Reproduce unavailable states and visible College read-only field; keep added Batch requirement

## G2-18-031-064  [P2] GAP  facet F16  effort M
- Legacy: Legacy Students/Faculty AntD Actions column pinned right from md screens and responsive grids xs24/lg12; Students.js:959-965,1131-1221;Faculty.js:796-801,979-1105
- vNext now: vNext page responsive forms with md:grid-cols-2, mobile 44px controls; college-student-register-form.tsx:70-124;person-onboard-dialog.tsx:120-155
- Fix: Clone breakpoint for pinned actions and original form columns; test 375/768/1280 without action overflow

## G2-18-031-067  [P2] GAP  facet F17  effort S
- Legacy: Legacy Form.Item has required labels, named errors, person selection, popconfirm cancel; Students.js:1134-1221;Faculty.js:983-1061
- vNext now: vNext native labels/aria roles but some errors top-level banner rather than field; college-student-register-form.tsx:70-132;person-onboard-dialog.tsx:153-253
- Fix: Attach field errors with aria-describedby and focus invalid field after rejected submit

## G2-19-001-027  [P2] GAP  facet F06  effort S
- Legacy: Legacy registration College disabled read-only with fetched friendly college name `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1186-1188`
- vNext now: vNext omits College input and relies on server selected scope `src/components/college/college-student-register-form.tsx:70-106`; `src/modules/people/college-student-registration-service.ts:30-43`
- Fix: Display non-editable selected college name in register form without accepting it from request body.

## G2-19-001-028  [P2] GAP  facet F06  effort S
- Legacy: Legacy mobile input `10-digit mobile`, maxlength 10, autocomplete tel `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1164-1170`
- vNext now: vNext mobile input `9876543210`, no maxlength, type tel `src/components/college/college-student-register-form.tsx:77-80`
- Fix: Set legacy maxlength/input autocomplete/placeholder while retaining E.164 normalization.

## G2-19-001-031  [P2] GAP  facet F06  effort M
- Legacy: Legacy date uses AntD DatePicker `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1235-1237`
- vNext now: vNext native date input `src/components/college/college-student-register-form.tsx:115-116`
- Fix: Compare calendar popup, locale, clear behavior and date formatting to legacy.

## G2-5-027-009  [P2] GAP  facet F02  effort M
- Legacy: Legacy registration and bulk flow accessed by existing admin forms. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:338-468`
- vNext now: vNext dedicated Register students and Import students with sections and confirm controls. `src/components/college/college-student-register-form.tsx:70-129`, `src/components/college/college-student-csv-import.tsx:60-65`
- Fix: Place forms in matching entry order and consolidate import-history jump.

## G2-5-027-070  [P2] GAP  facet F18  effort M
- Legacy: Legacy login errors include `Too many OTP requests. Please try again later.` and `OTP triggered`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:686-702`
- vNext now: vNext registration success says `Student registered successfully! They can now login with their mobile number.` `src/components/college/college-student-register-form.tsx:60-68`
- Fix: Maintain context-specific legacy OTP text in sign-in route, not register.

## G2-19-001-029  [P3] GAP  facet F06  effort S
- Legacy: Legacy roll placeholder `e.g., 22CS101` `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1155-1161`
- vNext now: vNext Roll Number has no placeholder `src/components/college/college-student-register-form.tsx:85-86`
- Fix: Set exact legacy roll placeholder.
