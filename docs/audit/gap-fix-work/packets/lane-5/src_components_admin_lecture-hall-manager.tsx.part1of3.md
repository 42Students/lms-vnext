# Work packet: edit src/components/admin/lecture-hall-manager.tsx (part 1 of 3)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-lecture-halls.md, docs/audit/gap2/lane-19/lecture-hall-entity.md, docs/audit/gap2/lane-4/lecture-hall-controller.md, docs/audit/gap2/lane-6/superadmin-sections-lecture-halls.md, docs/audit/gap2/lane-9/college-admin-lecture-halls.md

## G2-10-018-025  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:150-186 — Edit prefill via editForm and original snapshot; Cancel with dirty-check confirm.
- vNext now: src/components/admin/lecture-hall-manager.tsx:101-106 — Modal useState draft, Cancel immediately closes without explicit dirty guard.
- Fix: Implement unsaved edit confirmation.

## G2-10-018-027  [P1] GAP  facet F06  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:216-228 — Delete directly sends DELETE after Popconfirm; success removes record.
- vNext now: src/components/admin/lecture-hall-manager.tsx:152-181 — Archive status hides active hall and supports Restore; no physical DELETE.
- Fix: Document lifecycle change and clone controls without losing safety.

## G2-10-018-031  [P1] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:352-367 — Room Type required 'Select a room type'; capacity min1 max1000 default50.
- vNext now: src/components/admin/lecture-hall-manager.tsx:280-289; src/modules/academics/lecture-hall-service.ts:63-64 — New room type preselected Lecture Hall; capacity min1 max5000 default50.
- Fix: Match legacy required select and 1000 cap or formally change constraint.

## G2-10-018-041  [P1] MISSING  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:173-186 — Unsaved edit confirmation on cancel, snapshot tracking.
- vNext now: src/components/admin/lecture-hall-manager.tsx:250-267 — Cancel immediately closes, no dirty warning.
- Fix: Add dirty edit ConfirmDialog.

## G2-10-018-079  [P1] GAP  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:150-186 — Edit original snapshot drives unsaved navigation guard.
- vNext now: src/components/admin/lecture-hall-manager.tsx:101-106 — Editing draft lacks snapshot/dirty exit confirmation.
- Fix: Add dirty comparison.

## G2-10-018-089  [P1] MISSING  facet F23  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:163-186 — Unsaved edit Cancel requires confirmation.
- vNext now: src/components/admin/lecture-hall-manager.tsx:101-106 — New immediate modal close.
- Fix: Restore unsaved confirmation.

## G2-19-018-020  [P1] GAP  facet F06  effort M
- Legacy: Legacy optional department can be cleared, submitting dept_id=0. `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:328-336` `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:132-139`
- vNext now: vNext empty select maps to departmentId null UUID. `src/components/admin/lecture-hall-manager.tsx:118-133` `src/components/admin/lecture-hall-manager.tsx:294-302`
- Fix: Normalize zero-department records to null and map API shapes.

## G2-19-018-022  [P1] GAP  facet F06  effort M
- Legacy: Legacy create form inline resets on success; edit Cancel checks dirty snapshot. `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:140-143` `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:173-185`
- vNext now: vNext create/edit both use dialog; Cancel closes with no dirty guard. `src/components/admin/lecture-hall-manager.tsx:101-105` `src/components/admin/lecture-hall-manager.tsx:250-263`
- Fix: Add dirty-dismiss confirmation for cancel/Escape/backdrop.

## G2-19-018-027  [P1] GAP  facet F07  effort M
- Legacy: Legacy same-name conflict includes quoted name; all halls considered. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LectureHallServiceImpl.java:76-87`
- vNext now: vNext HALL_NAME_TAKEN generic and unique active-only index. `src/components/admin/lecture-hall-manager.tsx:63-65` `src/db/schema/lecture-halls.ts:18-19`
- Fix: Resolve archived-name reuse semantics and display name conflict.

## G2-19-018-032  [P1] GAP  facet F09  effort M
- Legacy: Legacy dirty edit confirm 'Discard edits to “name”?' and 'Your unsaved changes will be lost.'. `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:173-185`
- vNext now: vNext Dialog dismissal does not inspect edited form. `src/components/admin/lecture-hall-manager.tsx:250-260`
- Fix: Add unsaved-edits confirmation with exact title/body.

## G2-19-018-035  [P1] GAP  facet F10  effort L
- Legacy: Legacy physical DELETE blocks on any associated class schedule. `docs/legacy-source/frontend/src/api/Services/AdminService.js:642-643` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LectureHallServiceImpl.java:143-153`
- vNext now: vNext PATCH ARCHIVED allowed except future/ongoing scheduled events. `src/components/admin/lecture-hall-manager.tsx:152-183` `src/modules/academics/lecture-hall-service.ts:289-309`
- Fix: Approve archive-vs-delete business change and preserve booking referential history.

## G2-19-018-067  [P1] GAP  facet F23  effort L
- Legacy: Legacy unrestricted Super Admin list and left creation card are no longer exposed as such. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:80-101` `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:300-305`
- vNext now: vNext exact selected college and dialog create. `src/app/(authenticated)/admin/lecture-halls/page.tsx:26-34` `src/components/admin/lecture-hall-manager.tsx:250-266`
- Fix: Seek product decision and do not silently call removed capabilities equivalent.

## G2-4-027-028  [P1] GAP  facet F07  effort M
- Legacy: Delete conflict `Cannot delete lecture hall: it has scheduled classes. Remove or reassign those schedules first.` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LectureHallServiceImpl.java:148-151`)
- vNext now: No delete, archive conflict copy lists upcoming class count (`src/components/admin/lecture-hall-manager.tsx:64-70,233-238`)
- Fix: Restore delete conflict guidance or explicitly replace with archive policy.

## G2-4-027-035  [P1] MISSING  facet F09  effort M
- Legacy: Cancel dirty edit prompts `Discard edits to ...` with danger confirm (`docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:173-185`)
- vNext now: Cancel closes unconditionally (`src/components/admin/lecture-hall-manager.tsx:250-260`)
- Fix: Restore unsaved-changes guard and exact discard modal.

## G2-4-027-073  [P1] GAP  facet F23  effort M
- Legacy: Hard-delete legacy and exact message + scheduled classes guard (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:175-206`)
- vNext now: Archive/restore instead, with future-only guard (`src/components/admin/lecture-hall-manager.tsx:231-240,312-320`)
- Fix: Document owner decision for irreversible action removed; adapt user journey.

## G2-6-030-022  [P1] GAP  facet F06  effort M
- Legacy: Legacy create includes optional College Select when unscoped (LectureHalls.js:312-326).
- vNext now: vNext create payload collegeId from authenticated selected scope and no college selector (admin/lecture-halls/page.tsx:26-34; lecture-hall-manager.tsx:118-132).
- Fix: Resolve Super Admin unscoped create parity with secure college picker.

## G2-6-030-033  [P1] GAP  facet F07  effort M
- Legacy: Legacy delete when ANY class schedule exists 409 Cannot delete lecture hall: it has scheduled classes. Remove or reassign those schedules first. (LectureHallServiceImpl.java:143-152).
- vNext now: vNext archive blocked only if upcoming scheduled classes; error It has N upcoming class(es)... (lecture-hall-service.ts:289-309; lecture-hall-manager.tsx:64-70).
- Fix: Decide hard delete vs archive and historic-use semantics; expose exact reason and required reassignment.

## G2-9-017-007  [P1] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:305-381` — Create New Lecture Hall / Room Card always visible with fields.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:189-201` — Create button opens Dialog; form hidden until click.
- Fix: Show creation form persistently in left card.

## G2-9-017-033  [P1] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:351-365` — Room Type required, initial no choice; Select type placeholder.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:40-45` — Draft defaults LECTURE_HALL, removes required field choice.
- Fix: Default empty type and require explicit selection.

## G2-9-017-034  [P1] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:366-368` — Capacity default 50, min1,max1000.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:40-45` — Default50 but min1,max5000.
- Fix: Reduce max to1000 for exact legacy constraint.
