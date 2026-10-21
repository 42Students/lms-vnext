# Work packet (wave 2): edit src/components/courses/faculty-lesson-authoring.tsx

22 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l13-u027-faculty-lesson-content-controller.md, docs/audit/gap2/lane-3/lesson-content-controller.md, docs/audit/gap2/lane-4/teacher-all-assignments.md, docs/audit/gap2/lane-9/superadmin-admin-resources.md

## G2-13-027-003  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyLessonContentController.java:55-99 — single JSON-create endpoint with no wizard
- vNext now: src/components/courses/faculty-lesson-authoring.tsx:599-687 — separate mode chooser and authoring form
- Fix: Document changed task flow and compare against legacy faculty lesson drawer.

## G2-13-027-004  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:214-279 — generic lesson create returns wrapper to calling client
- vNext now: src/components/courses/faculty-lesson-authoring.tsx:432-449 — draft then optional publish with success banner and refresh
- Fix: Align content visibility decisions, publish confirmation, and error recovery.

## G2-13-027-005  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LessonContentsDTO.java:24-28 — contentType enum, contentTitle required max255
- vNext now: src/components/courses/faculty-lesson-authoring.tsx:599-682,248-266 — modes RESOURCE, YOUTUBE, LIVE_CLASS, ASSIGNMENT, QUIZ; title required
- Fix: Map legacy contentType taxonomy for all specific types PPT/PDF/LECTURE.

## G2-13-027-006  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LessonContentsDTO.java:23-32 — sequence, points, active/enabled per write
- vNext now: src/components/courses/faculty-lesson-authoring.tsx:267-295,805-809 — points 0-1000, optional Publish now and draft state
- Fix: Preserve enabled/active semantics and explicit sequence source.

## G2-13-027-007  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LessonContentsDTO.java:34-47 — deadline and clearDeadline for assignment
- vNext now: src/components/courses/faculty-lesson-authoring.tsx:825-840 — due date IST input; no explicit clear toggle in authoring
- Fix: Distinguish leave unchanged from explicit clear on assignment edit.

## G2-13-027-010  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LessonContentsDTO.java:18-25 — content title, type, class and points fields
- vNext now: src/components/courses/faculty-lesson-authoring.tsx:688-870 — type-specific form includes notes, URL, duration, due date
- Fix: Restore ordering/labels of legacy lesson entry fields for selected content types.

## G2-3-027-008  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:214-224`
- vNext now: `src/components/courses/faculty-lesson-authoring.tsx:248-302`
- Fix: Legacy POST accepts lesson and class-specific content; vNext authoring is a multi-kind form tied to course delivery and self-scoped lesson.

## G2-3-027-009  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:439-471`
- vNext now: `src/components/courses/faculty-lesson-authoring.tsx:660-676`
- Fix: Legacy global faculty assignment list is a distinct endpoint with course selector; vNext exposes separate assignments management link.

## G2-3-027-010  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:501-512`
- vNext now: `src/components/courses/faculty-lesson-authoring.tsx:660-676`
- Fix: Legacy class course filter for All Quizzes/Assignments comes from distinct backend query; vNext navigation by delivery and separate manage UI.

## G2-3-027-012  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:214-281`
- vNext now: `src/components/courses/faculty-lesson-authoring.tsx:598-706`
- Fix: Legacy create generic API returns status OK; vNext authoring presents per-type fields, draft/discard control and status transitions, not one Add Content action.

## G2-3-027-070  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:203-208`
- vNext now: `src/components/courses/faculty-lesson-authoring.tsx:121-150`
- Fix: Legacy 403 Learners cannot create/update/delete lesson contents; vNext UI hides actions for learner, keep server rejection and accessible disabled explanation.

## G2-4-012-025  [P2] GAP  facet F06  effort S
- Legacy: Assignment Title label, placeholder Assignment title and required rule. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:569-577`)
- vNext now: New Title label no placeholder with maxLength255. (`src/components/courses/faculty-lesson-authoring.tsx:692-705`)
- Fix: Use exact title label, placeholder and validation.

## G2-4-012-071  [P2] GAP  facet F16  effort S
- Legacy: Points/Due Date side by side at md 6+6 columns. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:677-733`)
- vNext now: New Title/Points grid and due field elsewhere. (`src/components/courses/faculty-lesson-authoring.tsx:691-775`)
- Fix: Pair Points and Due Date in original order at md.

## G2-4-012-077  [P2] GAP  facet F18  effort M
- Legacy: Builder headers Assignment Details, Assignment Resources, How Learners Can Submit. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:569-570`; `docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:735-741`; `docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:885-887`)
- vNext now: New simple form missing resource/method sections. (`src/components/courses/faculty-lesson-authoring.tsx:685-775`)
- Fix: Restore sections and explanations.

## G2-4-012-078  [P2] GAP  facet F18  effort S
- Legacy: Success copies Assignment created successfully, Assignment updated successfully. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:490-497`)
- vNext now: New draft success and editor refresh differ. (`src/components/courses/faculty-lesson-authoring.tsx:384-399`; `src/components/courses/faculty-assessment-editor.tsx:140-156`)
- Fix: Use exact copy for equivalent transition.

## G2-9-025-025  [P2] GAP  facet F06  effort M
- Legacy: Visibility switch and Upload-icon Create Resource/Save changes controls `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:404-410`
- vNext now: PublishNow flag; Save text no upload icon and different layout `src/components/courses/faculty-lesson-authoring.tsx:118-119` `src/components/courses/super-admin-content-actions.tsx:169-170`
- Fix: Match switch/submit button copy/icons.

## G2-9-025-038  [P2] GAP  facet F09  effort S
- Legacy: Unsaved changes window.confirm Discard the changes to this resource? `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:203-208`
- vNext now: Creation uses confirm dialog for draft; edit native Discard resource changes? `src/components/courses/faculty-lesson-authoring.tsx:135-152` `src/components/courses/super-admin-content-actions.tsx:105-118`
- Fix: Use exact old discard text and include links/material changes.

## G2-9-025-047  [P2] GAP  facet F12  effort M
- Legacy: Creation visible defaults true and active/enabled preserved `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:189-190,266-285`
- vNext now: New Publish Now semantics depend on publish path and ancestor state `src/modules/courses/super-admin-content-directory-model.ts:43-51` `src/components/courses/faculty-lesson-authoring.tsx:118-119`
- Fix: Map visible and active/enabled to published state exactly.

## G2-9-025-054  [P2] GAP  facet F14  effort M
- Legacy: Create resource accepts arbitrary HTTPS link with optional title `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:391-394`
- vNext now: New single externalUrl for resource, no title `src/components/courses/faculty-lesson-authoring.tsx:274-296`
- Fix: Support multiple titled external links.

## G2-13-027-033  [P3] GAP  facet F17  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LessonContentsDTO.java:26-27 — @NotBlank title required
- vNext now: src/components/courses/faculty-lesson-authoring.tsx:258-265,688-691 — client-side Enter a title before saving and native fieldset disables on submit
- Fix: Align accessible required markers/errors and focus management.

## G2-13-027-034  [P3] GAP  facet F18  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyLessonContentController.java:80-87 — distinct permission reason strings
- vNext now: src/components/courses/faculty-lesson-authoring.tsx:450-456 — generic caught Error in Alert
- Fix: Map permission/validation failure to field or contextual guidance.

## G2-13-027-035  [P3] GAP  facet F18  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyLessonContentController.java:94-97 — Assignment saved vs generic content writer response
- vNext now: src/components/courses/faculty-lesson-authoring.tsx:441-445 — mode-specific Resource saved / Assignment draft created
- Fix: Document exact messages for proposed UI-copy parity.
