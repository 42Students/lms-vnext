# Work packet: edit src/components/admin/lecture-hall-manager.tsx (part 2 of 3)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-lecture-halls.md, docs/audit/gap2/lane-10/superadmin-lecture-halls.md, docs/audit/gap2/lane-19/lecture-hall-entity.md, docs/audit/gap2/lane-4/lecture-hall-controller.md, docs/audit/gap2/lane-6/superadmin-sections-lecture-halls.md

## G2-9-017-036  [P1] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:428-510` — Edit modal duplicate fields, Update and Cancel; unsaved warning on cancel.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:250-263` — Dialog saves with Save hall, Cancel dismisses immediately.
- Fix: Add dirty edit confirmation modal with exact copy.

## G2-9-017-041  [P1] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:366-367` — Capacity limit 1–1000.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:110-112` — Error Capacity must be between 1 and 5000.
- Fix: Use legacy limit and field-level error copy.

## G2-9-017-049  [P1] MISSING  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:176-188` — Dirty edit cancel confirm Discard edits to “NAME”? with Your unsaved changes will be lost, Discard edits.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:250-260` — Dialog simply closes on Cancel even after changes.
- Fix: Restore exact dirty-cancel confirm.

## G2-9-017-061  [P1] GAP  facet F12  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:351-366` — Room type must be explicitly chosen, Capacity max1000.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:40-45` — Default LECTURE_HALL and max5000.
- Fix: Align defaults and capacity policy.

## G2-9-017-063  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:176-188` — Unsaved edit draft cannot close without confirmation.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:250-261` — Cancels immediately even if altered.
- Fix: Add dirty confirmation before dismiss.

## G2-9-017-089  [P1] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:154-167` — Edit prefill + snapshot prevents discard of changed draft.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:48-59` — No snapshot or confirm.
- Fix: Restore normalized draft change tracking.

## G2-9-017-095  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LectureHallDTO.java:8-23` — Legacy DTO @NotBlank @Size(max255) name, capacity @Min1, description @Size(max255), room type @NotNull.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:110-112` — New UI capacity max5000; name/description maxLength255.
- Fix: Reconcile DTO limits with new schema/server validation.

## G2-10-018-030  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:338-347 — Room Name required whitespace trim error 'Please enter room name'; max255.
- vNext now: src/components/admin/lecture-hall-manager.tsx:274-276; src/modules/academics/lecture-hall-service.ts:51-64 — Client 'Enter a name'; Zod Name is required, max255.
- Fix: Align inline validation copy.

## G2-10-018-032  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:372-374 — Description optional TextArea 2 rows with example placeholder.
- vNext now: src/components/admin/lecture-hall-manager.tsx:304-307; src/modules/academics/lecture-hall-service.ts:52-54 — New single-line Input max255, not 2-row textarea.
- Fix: Restore textarea and placeholder.

## G2-10-018-035  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:465-494 — Edit form same required/type/cap rules as create.
- vNext now: src/components/admin/lecture-hall-manager.tsx:274-292 — New edit similarly common form but new max5000/type prefill.
- Fix: Preserve edit validation and defaults.

## G2-10-018-038  [P2] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:221-225 — Toast 'Lecture hall deleted successfully!' / Could not delete the room.
- vNext now: src/components/admin/lecture-hall-manager.tsx:164-181 — New Hall archived or Hall restored toasts, not deletion.
- Fix: Keep truthful archive feedback and record intentional divergence.

## G2-19-018-025  [P2] GAP  facet F07  effort S
- Legacy: Legacy Room Type required 'Select a room type'. `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:351-357`
- vNext now: vNext default room type bypasses required validation. `src/components/admin/lecture-hall-manager.tsx:40-46` `src/components/admin/lecture-hall-manager.tsx:285-291`
- Fix: Remove default and validate with exact text.

## G2-19-018-026  [P2] GAP  facet F07  effort S
- Legacy: Legacy errors 'Capacity too large (max 5000)' and cross-college department message. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LectureHallServiceImpl.java:46-49` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LectureHallServiceImpl.java:62-73`
- vNext now: vNext Zod range plus DEPARTMENT_NOT_FOUND generic error mapping. `src/modules/academics/lecture-hall-service.ts:61-67` `src/components/admin/lecture-hall-manager.tsx:58-75`
- Fix: Map distinct capacity/department user messages.

## G2-19-018-030  [P2] GAP  facet F08  effort S
- Legacy: Legacy deleted success message 'Lecture hall deleted successfully!'. `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:216-224`
- vNext now: vNext Archive/Restore outcomes 'Hall archived' and 'Hall restored'. `src/components/admin/lecture-hall-manager.tsx:152-183`
- Fix: Document removal versus archive; provide equivalent feedback if delete retained.

## G2-4-027-026  [P2] GAP  facet F07  effort S
- Legacy: Wrong department `Department must belong to the same college as the lecture hall` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LectureHallServiceImpl.java:62-74`)
- vNext now: `That department isn't an active department of this college.` (`src/components/admin/lecture-hall-manager.tsx:70-71`)
- Fix: Align wording while keeping archived-dept block.

## G2-4-027-027  [P2] GAP  facet F07  effort S
- Legacy: Duplicate `A lecture hall named "X" already exists in this college` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LectureHallServiceImpl.java:80-86`)
- vNext now: Generic `Another active hall ... already has that name.` (`src/components/admin/lecture-hall-manager.tsx:63-66`)
- Fix: Include user-entered room name for actionable feedback.

## G2-4-027-029  [P2] GAP  facet F07  effort S
- Legacy: Name validation `Please enter room name` and `Room name must be 255 characters or less` (`docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:341-346`)
- vNext now: `Enter a name.` and maxLength255, no inline error per field (`src/components/admin/lecture-hall-manager.tsx:107-113,273-276`)
- Fix: Render exact field-level name messages.

## G2-4-027-030  [P2] GAP  facet F08  effort S
- Legacy: Delete 200 message `Lecture hall deleted successfully` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:196-206`)
- vNext now: Archive toast `Hall archived`, restore `Hall restored` (`src/components/admin/lecture-hall-manager.tsx:152-183`)
- Fix: Use original deletion success when deletion retained; distinguish archive.

## G2-4-027-033  [P2] GAP  facet F08  effort S
- Legacy: Failed create/save fallback `Could not create the room. Try again.` / `Could not save the room. Try again.` (`docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:145-146,210-211`)
- vNext now: `Could not save the hall. Check your connection and retry.` (`src/components/admin/lecture-hall-manager.tsx:146-147`)
- Fix: Match per-operation fallback message.

## G2-6-030-031  [P2] GAP  facet F07  effort S
- Legacy: Legacy service blank name Room name is required, capacity errors at least1 / max5000 (LectureHallServiceImpl.java:39-49).
- vNext now: vNext Zod Name is required, capacity 1..5000 and client generic Capacity must be between 1 and 5000. (lecture-hall-service.ts:51-67; lecture-hall-manager.tsx:109-113).
- Fix: Map precise server/client validation strings while keeping internal bounds consistent.
