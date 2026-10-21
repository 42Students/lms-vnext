# Work packet (wave 2): edit src/components/admin/lecture-hall-manager.tsx (part 3 of 3)

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/lecture-hall-entity.md, docs/audit/gap2/lane-4/lecture-hall-controller.md, docs/audit/gap2/lane-9/college-admin-lecture-halls.md

## G2-19-018-007  [P3] GAP  facet F03  effort S
- Legacy: Create button includes plus icon and disabled when college list unavailable. `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:376-380`
- vNext now: Manager create button has no icon; no college selector in manager. `src/components/admin/lecture-hall-manager.tsx:188-192`
- Fix: Match plus glyph/disabled state or explain scoped selection.

## G2-19-018-021  [P3] GAP  facet F06  effort S
- Legacy: Legacy 2-row description textarea with example placeholder. `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:372-374` `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:498-500`
- vNext now: vNext single line Input, 255 maxlength. `src/components/admin/lecture-hall-manager.tsx:304-307`
- Fix: Use 2-row textarea while preserving max length.

## G2-19-018-051  [P3] GAP  facet F17  effort S
- Legacy: Legacy Edit/Delete icon buttons have aria-label and title. `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:268-293`
- vNext now: vNext dropdown text actions and label, no separate icon controls. `src/components/admin/lecture-hall-manager.tsx:227-240`
- Fix: Preserve accessible names if restoring icon action controls.

## G2-19-018-053  [P3] GAP  facet F18  effort S
- Legacy: Legacy card titles 'Create New Lecture Hall / Room' and 'Existing Lecture Halls / Rooms'. `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:302-305` `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:386-390`
- vNext now: vNext first phrase only in copy constant, no existing-list section title. `src/modules/academics/lecture-hall-copy.ts:11-25` `src/components/admin/lecture-hall-manager.tsx:188-200`
- Fix: Match entire section heading wording.

## G2-19-018-054  [P3] GAP  facet F18  effort S
- Legacy: Legacy optional dept select placeholder 'Select department'. `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:328-336`
- vNext now: vNext option 'Shared by all departments'. `src/modules/academics/lecture-hall-copy.ts:19-20` `src/components/admin/lecture-hall-manager.tsx:294-302`
- Fix: Align placeholder with legacy while preserving meaning.

## G2-4-027-011  [P3] GAP  facet F03  effort S
- Legacy: Capacity input min1 max1000 (`docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:367-369`)
- vNext now: Capacity min1 max5000 (`src/components/admin/lecture-hall-manager.tsx:280-282`)
- Fix: Resolve legacy FE1000-vs-BE5000 discrepancy; use agreed cap and validation hint.

## G2-4-027-055  [P3] GAP  facet F16  effort S
- Legacy: RoomType and Capacity side-by-side at all screen sizes (`docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:349-369`)
- vNext now: One column mobile, two columns md (`src/components/admin/lecture-hall-manager.tsx:278-293`)
- Fix: Decide responsive exception to preserve usable mobile fields.

## G2-4-027-059  [P3] GAP  facet F18  effort S
- Legacy: `Edit Lecture Hall` capitalization (`docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:429`)
- vNext now: `Edit lecture hall` (`src/components/admin/lecture-hall-manager.tsx:254`)
- Fix: Correct modal title to exact capitalization.

## G2-9-017-019  [P3] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:255-260` — Department missing renders '-' (literal).
- vNext now: `src/components/admin/lecture-hall-manager.tsx:205-205` — Missing dept renders em dash.
- Fix: Use literal hyphen for unknown department.
