# Work packet (wave 2): edit src/modules/academics/lecture-hall-copy.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/superadmin-sections-lecture-halls.md, docs/audit/gap2/lane-19/lecture-hall-entity.md

## G2-6-030-027  [P2] GAP  facet F06  effort S
- Legacy: Legacy Description TextArea rows2, placeholder e.g., AC room, projector available (LectureHalls.js:372-374).
- vNext now: vNext single-line Input with same placeholder and max255 (lecture-hall-manager.tsx:304-307; lecture-hall-copy.ts:21-22).
- Fix: Use multiline Textarea rows2 in create/edit.

## G2-19-018-053  [P3] GAP  facet F18  effort S
- Legacy: Legacy card titles 'Create New Lecture Hall / Room' and 'Existing Lecture Halls / Rooms'. `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:302-305` `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:386-390`
- vNext now: vNext first phrase only in copy constant, no existing-list section title. `src/modules/academics/lecture-hall-copy.ts:11-25` `src/components/admin/lecture-hall-manager.tsx:188-200`
- Fix: Match entire section heading wording.

## G2-19-018-054  [P3] GAP  facet F18  effort S
- Legacy: Legacy optional dept select placeholder 'Select department'. `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:328-336`
- vNext now: vNext option 'Shared by all departments'. `src/modules/academics/lecture-hall-copy.ts:19-20` `src/components/admin/lecture-hall-manager.tsx:294-302`
- Fix: Align placeholder with legacy while preserving meaning.
