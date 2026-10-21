# Work packet: edit src/components/admin/lecture-hall-manager.tsx (part 3 of 3)

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/superadmin-sections-lecture-halls.md, docs/audit/gap2/lane-9/college-admin-lecture-halls.md, docs/audit/gap2/lane-10/superadmin-lecture-halls.md, docs/audit/gap2/lane-19/lecture-hall-entity.md

## G2-6-030-034  [P2] GAP  facet F08  effort S
- Legacy: Legacy create toast Lecture hall created successfully!, edit updated successfully!, delete deleted successfully! (LectureHalls.js:140-147,206-213,219-226).
- vNext now: vNext create/update messages match copy; archive Hall archived, restore Hall restored (lecture-hall-copy.ts:23-24; lecture-hall-manager.tsx:140-144,173-177).
- Fix: Keep create/edit exact success, define Archive/Restore messaging as intentional replacement of delete.

## G2-9-017-039  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:340-345` — Room name required error Please enter room name and max error Room name must be 255 characters or less.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:107-112` — Generic Enter a name. and HTML maxLength255; no exact copy.
- Fix: Use exact Ant validation message.

## G2-9-017-040  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:351-354` — Missing type yields Select a room type.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:40-45` — Type preselected LECTURE_HALL, so no missing-type error.
- Fix: Restore required select validation.

## G2-9-017-042  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:128-146` — College is required.; create error Could not create the room. Try again.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:61-75` — Error code-specific and Could not save the hall. Check your connection and retry.
- Fix: Restore college error and action-specific create messages.

## G2-9-017-046  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:206-213` — Updated toast Lecture hall updated successfully!; failure Could not save the room. Try again.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:139-150` — Success exact through copy constant; error connection-specific.
- Fix: Match failed-update toast wording.

## G2-9-017-047  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:218-229` — Delete toast Lecture hall deleted successfully!; error Could not delete the room. Try again.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:166-181` — Archive Hall archived or Restore Hall restored, no delete.
- Fix: Use intentional Archive wording and show retention difference.

## G2-10-018-033  [P3] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:328-335 — Optional Department select allowClear, placeholder Select department.
- vNext now: src/components/admin/lecture-hall-manager.tsx:294-303 — New optional Select defaults Shared by all departments.
- Fix: Restore old placeholder while retaining explicit shared option.

## G2-10-018-036  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:140-149 — Success toast 'Lecture hall created successfully!', failure 'Could not create the room. Try again.'.
- vNext now: src/components/admin/lecture-hall-manager.tsx:139-149 — Uses LECTURE_HALL_COPY.createdMessage and generic banner/toast.
- Fix: Match exact user-facing success/error.

## G2-19-018-024  [P3] GAP  facet F07  effort S
- Legacy: Legacy required name validation 'Please enter room name' and max 255 message. `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:338-346`
- vNext now: vNext 'Enter a name.' page banner and input maxLength255. `src/components/admin/lecture-hall-manager.tsx:107-113` `src/components/admin/lecture-hall-manager.tsx:273-276`
- Fix: Use exact field-level validation message.

## G2-19-018-028  [P3] GAP  facet F07  effort S
- Legacy: Legacy create and edit catch separately with exact fallback messages. `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:140-147` `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:206-213`
- vNext now: vNext generic form error and connection fallback. `src/components/admin/lecture-hall-manager.tsx:58-76` `src/components/admin/lecture-hall-manager.tsx:135-149`
- Fix: Restore operation-specific failures.
