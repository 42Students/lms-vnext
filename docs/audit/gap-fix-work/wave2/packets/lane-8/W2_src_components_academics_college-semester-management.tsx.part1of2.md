# Work packet (wave 2): edit src/components/academics/college-semester-management.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l15-u029-superadmin-semesters.md, docs/audit/gap2/lane-12/new-program-structure.md, docs/audit/gap2/lane-5/l12-u016-semester-entity.md, docs/audit/gap2/lane-5/l18-u029-semester-management.md, docs/audit/gap2/lane-5/u025-semester-controller.md, docs/audit/gap2/lane-9/college-admin-semesters.md

## G2-15-029-008  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:414-430 — Program select placeholder Select program
- vNext now: src/components/academics/college-semester-management.tsx:43,79-86 — auto-select first active program, no placeholder option
- Fix: Restore unselected initial state requiring explicit program choice

## G2-15-029-009  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:432-449 — number/name blank required fields
- vNext now: src/components/academics/college-semester-management.tsx:44-45,88-96 — term number defaults '1', name blank
- Fix: Match default semester number in old flow or document changed default

## G2-15-029-013  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:378-390 — inline edit icon and danger delete icon with Popconfirm
- vNext now: src/components/academics/college-semester-management.tsx:176-188,218-222 — Edit text button and More dropdown Delete, ConfirmDialog
- Fix: Match old actions/icon ordering and popconfirm

## G2-15-029-014  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:434-447 — required semester number, name max255
- vNext now: src/components/academics/college-semester-management.tsx:88-96 — number input min1 max12 step1, name max255
- Fix: Verify old upper bound; new max12 can reject old number >12

## G2-15-029-023  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/api/Services/SemesterService.js:5-18 — /api/v1/semester/create/update/delete/fetchByProgram
- vNext now: src/components/academics/college-semester-management.tsx:32-35,62-63,138-166 — /api/academics/semesters POST/PATCH/DELETE
- Fix: Document request/response and REST endpoint migration

## G2-15-029-024  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:182-187 — snake_case semester_number, total_credits, is_active
- vNext now: src/components/academics/college-semester-management.tsx:52-63 — camelCase termNumber/name/totalCredits nullable
- Fix: Provide DTO mapping old and new enum/status fields

## G2-15-029-044  [P2] GAP  facet F21  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:200-205,267-273 — server per-field errors mapped to Form controls
- vNext now: src/components/academics/college-semester-management.tsx:52-68,138-154 — first Zod issue / generic error notice
- Fix: Restore mapped errors for program, number, active, name

## G2-15-029-048  [P2] GAP  facet F23  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:432-447 — name required max255, semester number >=1
- vNext now: src/components/academics/college-semester-management.tsx:88-96 — number min1 max12, defaults to 1
- Fix: Validate upper bound against legacy data and migration

## G2-12-018-043  [P2] MISSING  facet F18  effort S
- Legacy: Old statuses labelled ACTIVE/INACTIVE/COMPLETED from StatusType `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgramStructure.java:30-32` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ProgramStructureServiceImpl.java:90-103`
- vNext now: New status UI says Active/Inactive only `src/components/academics/college-semester-management.tsx:202-205`
- Fix: Show Completed in status selector/badge.

## G2-12-016-003  [P2] GAP  facet F02  effort M
- Legacy: Legacy semantics a numbered semester within each program. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Semester.java:12-15`
- vNext now: vNext semester editor uses create disclosure, separate directory and mapping manager. `src/components/academics/college-semester-management.tsx:73-99`
- Fix: Match original SemesterManagement card/table placement.

## G2-12-016-007  [P2] GAP  facet F03  effort M
- Legacy: Legacy totalCredits shown as standalone value. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Semester.java:38-39`
- vNext now: vNext create hides credits and explains they derive from mapping. `src/components/academics/college-semester-management.tsx:99-100`
- Fix: Show total credits on list/edit and make ownership explicit.

## G2-12-016-020  [P2] GAP  facet F09  effort M
- Legacy: Legacy creation/form modal and error feedback. `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:161-205`
- vNext now: vNext details disclosure and confirmation, different overlay. `src/components/academics/college-semester-management.tsx:72-99`
- Fix: Use legacy modal layout while preserving safe confirm.

## G2-12-016-048  [P2] GAP  facet F23  effort M
- Legacy: Legacy credits separately admin editable. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Semester.java:35-39`
- vNext now: vNext derived credits notice in create, edit still persisted totalCredits. `src/components/academics/college-semester-management.tsx:99-100`
- Fix: Clarify authoritative total and sync with mapped course sum.

## G2-18-029-030  [P2] GAP  facet F09  effort M
- Legacy: Legacy Edit Semester AntD modal, maskClosable false, keyboard disabled during busy. `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:547-615`
- vNext now: vNext Dialog and pending control; overlay policy differs. `src/components/academics/college-semester-management.tsx:189-216`
- Fix: Match modal width/dismiss/focus.

## G2-18-029-032  [P2] GAP  facet F09  effort M
- Legacy: Legacy Delete Popconfirm Yes/No, disabled during any delete. `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:378-390`
- vNext now: vNext ConfirmDialog Confirm delete and disabled if mappedCourses>0. `src/components/academics/college-semester-management.tsx:218-222`
- Fix: Match confirmation copy, preserve safety blocker.

## G2-18-029-044  [P2] GAP  facet F13  effort M
- Legacy: Legacy error banners distinct create/edit/delete. `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:411-412,563-564`
- vNext now: vNext inline notices per action. `src/components/academics/college-semester-management.tsx:67-68,153-155,169-170`
- Fix: Match banner severity and close behavior.

## G2-18-029-050  [P2] GAP  facet F17  effort M
- Legacy: Legacy Form.Item validation associated with fields. `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:413-457`
- vNext now: vNext native required and inline notice. `src/components/academics/college-semester-management.tsx:78-109`
- Fix: Connect aria-invalid/error for inputs.

## G2-18-029-051  [P2] GAP  facet F18  effort M
- Legacy: Legacy main title Semesters, left Create New Semester. `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:407-410`
- vNext now: vNext title same; disclosure label differs. `src/app/(authenticated)/admin/semesters/page.tsx:77-81`, `src/components/academics/college-semester-management.tsx:73-75`
- Fix: Use exact Create New Semester heading.

## G2-18-029-057  [P2] GAP  facet F20  effort M
- Legacy: Legacy deleteRef prevents simultaneous destructive actions. `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:278-301`
- vNext now: vNext row pending only, multi-row deletes may overlap. `src/components/academics/college-semester-management.tsx:159-171`
- Fix: Guard user action or leverage DB locks.

## G2-5-025-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy semester view filters semesters by selected program and offers searchable table. `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:22-48,61-105`
- vNext now: vNext create form appears as details disclosure with preselected first program; listings separately composed. `src/components/academics/college-semester-management.tsx:40-99`
- Fix: Clone legacy program/table controls and query/empty state at screen level.

## G2-5-025-017  [P2] GAP  facet F06  effort M
- Legacy: Legacy create requires program,number,name and allows optional active/totalCredits; active defaults true. `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/SemesterDTO.java:13-21`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterServiceImpl.java:48-67`
- vNext now: vNext create requires same core fields but no isActive and sends totalCredits null. `src/modules/academics/semester-mutation-model.ts:6-11`, `src/components/academics/college-semester-management.tsx:40-55`
- Fix: Allow active and optional total credits where parity needed.

## G2-5-025-030  [P2] GAP  facet F09  effort M
- Legacy: Legacy Ant Design modal form create/update with error application. `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:1-22,161-205`
- vNext now: vNext Create New Semester is native details disclosure. `src/components/academics/college-semester-management.tsx:72-99`
- Fix: Use legacy modal/submit affordances or approved exact visual clone.

## G2-5-025-045  [P2] GAP  facet F13  effort M
- Legacy: Legacy lookup failure sets loadError while preserving existing data and retry UI. `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:61-105`
- vNext now: vNext SSR page failure travels error boundary; create editor separate. `src/app/(authenticated)/college/semester-courses/page.tsx:8-21`, `src/components/academics/college-semester-management.tsx:40-99`
- Fix: Add in-place reload/error state for list and selected program.

## G2-5-025-046  [P2] GAP  facet F13  effort M
- Legacy: Legacy failed create shows field errors without closing modal. `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:161-205`
- vNext now: vNext sets one overall notice from first Zod/server error. `src/components/academics/college-semester-management.tsx:52-68`
- Fix: Bind error per field and retain values/focus.

## G2-9-019-005  [P2] GAP  facet F02  effort S
- Legacy: Create New Semester Ant Card visible on arrival `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:409-413`
- vNext now: details collapsed initially `src/components/academics/college-semester-management.tsx:67-76`
- Fix: Keep create form expanded in its left panel.

## G2-9-019-007  [P2] GAP  facet F03  effort S
- Legacy: Create Semester plus icon `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:450-454`
- vNext now: Primary Create Semester button no icon `src/components/academics/college-semester-management.tsx:109-112`
- Fix: Restore plus icon.

## G2-9-019-008  [P2] GAP  facet F03  effort S
- Legacy: Edit/Delete icon-only row actions `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:369-390`
- vNext now: Edit text button and More dropdown > Delete `src/components/academics/college-semester-management.tsx:175-191`
- Fix: Use legacy icons, names and adjacent row actions.

## G2-9-019-023  [P2] GAP  facet F06  effort S
- Legacy: Create form Program starts blank and requires selection `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:414-427`
- vNext now: Program starts first available id by default `src/components/academics/college-semester-management.tsx:42-44,79-84`
- Fix: Start unselected with Select program placeholder.

## G2-9-019-026  [P2] GAP  facet F06  effort M
- Legacy: Create form is vertical card, one form number half-width `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:413-451`
- vNext now: Create form grid md two equal columns `src/components/academics/college-semester-management.tsx:76-109`
- Fix: Match vertical card layout/halfwidth number.

## G2-9-019-027  [P2] GAP  facet F06  effort M
- Legacy: Edit shows disabled Program selector and disabled Semester Number with tooltips `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:562-583`
- vNext now: Edit dialog excludes both entirely `src/components/academics/college-semester-management.tsx:195-225`
- Fix: Show read-only program/number fields with explicit tooltip.

## G2-9-019-028  [P2] GAP  facet F06  effort S
- Legacy: Edit Status Switch checkedChildren Active / Inactive `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:599-605`
- vNext now: Switch plus separate text Active / Inactive `src/components/academics/college-semester-management.tsx:210-219`
- Fix: Use same switch-inner status captions.

## G2-9-019-041  [P2] GAP  facet F09  effort S
- Legacy: Delete Popconfirm title Delete this semester? Yes/No buttons `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:378-389`
- vNext now: ConfirmDialog with Confirm delete label `src/components/academics/college-semester-management.tsx:226-231`
- Fix: Match confirmation CTA Yes / No and delete wording.

## G2-9-019-044  [P2] GAP  facet F10  effort M
- Legacy: Legacy PUT /api/v1/semester/update/{id}, payload retains program_id,semester_number and is_active `docs/legacy-source/frontend/src/api/Services/SemesterService.js:8-9` `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:252-260`
- vNext now: PATCH /api/academics/semesters/{id}, only name/totalCredits/isActive/expectedUpdatedAt/confirm `src/components/academics/college-semester-management.tsx:137-159` `src/app/api/academics/semesters/[semesterId]/route.ts:21-33`
- Fix: Keep disabled fields visible, don't send immutable ones.

## G2-9-019-059  [P2] GAP  facet F16  effort M
- Legacy: xs24 lg10+14 two cards, nested xs24 sm12 for semester # `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:408-438`
- vNext now: Stacked details, md:grid-cols-2, FilterBar four cols 992px `src/components/academics/college-semester-management.tsx:76-103` `src/components/academics/college-academic-directory.tsx:64-69`
- Fix: Rebuild mobile stack/desktop proportions and half width input.

## G2-9-019-061  [P2] GAP  facet F17  effort M
- Legacy: Ant form errors field-level `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:414-449`
- vNext now: Semantic labels and role=status for inline response `src/components/academics/college-semester-management.tsx:76-117`
- Fix: Keep both accessible inline statuses and field error announcements.

## G2-9-019-076  [P2] MISSING  facet F23  effort M
- Legacy: Legacy edit disabled Program and Semester # `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:562-584`
- vNext now: vNext removes immutable controls from dialog `src/components/academics/college-semester-management.tsx:195-225`
- Fix: Restore read-only controls and explanatory tooltips.

## G2-12-018-044  [P3] GAP  facet F18  effort S
- Legacy: Legacy delete status response 'Deleted successfully' `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:90-98`
- vNext now: New semester success message 'Semester deleted successfully!' `src/components/academics/college-semester-management.tsx:159-169`
- Fix: Keep entity-specific delete wording.

## G2-9-019-040  [P3] GAP  facet F09  effort S
- Legacy: Edit Modal with footer Save Changes/Cancel and maskClosable=false `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:543-562`
- vNext now: Dialog embedded form, Cancel and Save Changes `src/components/academics/college-semester-management.tsx:195-225`
- Fix: Verify same backdrop/close controls and disabled pending visuals.

## G2-9-019-042  [P3] GAP  facet F09  effort S
- Legacy: Unsaved edit confirmation title Discard semester changes? `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:311-324`
- vNext now: Same title, different description `src/components/academics/college-semester-management.tsx:226-231`
- Fix: Use exact legacy description Your unsaved semester edits will be lost.

## G2-9-019-043  [P3] GAP  facet F10  effort S
- Legacy: Legacy POST /api/v1/semester/create, snake_case including is_active:true `docs/legacy-source/frontend/src/api/Services/SemesterService.js:5-6` `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:180-187`
- vNext now: POST /api/academics/semesters JSON programId,termNumber,name,totalCredits:null, creates isActive default true `src/components/academics/college-semester-management.tsx:48-59` `src/app/api/academics/semesters/route.ts:8-19`
- Fix: Record API translation and ensure active defaults.
