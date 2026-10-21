# Work packet (wave 2): edit src/components/admin/lecture-hall-manager.tsx (part 2 of 3)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/lecture-hall-controller.md, docs/audit/gap2/lane-6/superadmin-sections-lecture-halls.md, docs/audit/gap2/lane-9/college-admin-lecture-halls.md, docs/audit/gap2/lane-10/superadmin-lecture-halls.md, docs/audit/gap2/lane-19/lecture-hall-entity.md

## G2-4-027-024  [P2] GAP  facet F06  effort S
- Legacy: Description multiline two rows (`docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:367-374`)
- vNext now: Description single line Input (`src/components/admin/lecture-hall-manager.tsx:304-308`)
- Fix: Use two-row textarea.

## G2-4-027-036  [P2] GAP  facet F09  effort M
- Legacy: Delete Popconfirm with `Delete this room?`, schedule warning (`docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:277-294`)
- vNext now: Archive ConfirmDialog `Archive lecture hall` (`src/components/admin/lecture-hall-manager.tsx:312-320`)
- Fix: Match intent/wording and keep schedule constraint.

## G2-4-027-054  [P2] GAP  facet F16  effort M
- Legacy: AntD Row/Col xs24, lg10/14; horizontally scroll table (`docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:300-304,384-425`)
- vNext now: Responsive full-width data table; button above (`src/components/admin/lecture-hall-manager.tsx:188-248`)
- Fix: Clone column widths and mobile overflow at 375/768/1280.

## G2-4-027-056  [P2] GAP  facet F17  effort S
- Legacy: Edit/Delete icon buttons each with specific aria-label (`docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:268-295`)
- vNext now: Dropdown + Availability link (`src/components/admin/lecture-hall-manager.tsx:227-241`)
- Fix: Ensure distinct accessible edit/archive/restoration labels.

## G2-4-027-058  [P2] GAP  facet F18  effort S
- Legacy: `Create New Lecture Hall / Room` and `Existing Lecture Halls / Rooms` (`docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:302-305,387-389`)
- vNext now: Create title on button/dialog only; no Existing section title (`src/components/admin/lecture-hall-manager.tsx:190-191,250-255`)
- Fix: Restore original two-card headings.

## G2-4-027-074  [P2] GAP  facet F23  effort M
- Legacy: Always-visible create panel and table in two cards (`docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:303-425`)
- vNext now: Create dialog and table in one column (`src/components/admin/lecture-hall-manager.tsx:188-267`)
- Fix: Clone side-by-side canvas/panel hierarchy exactly.

## G2-6-030-003  [P2] GAP  facet F02  effort L
- Legacy: Legacy h1 Lecture Halls then two side-by-side cards xs24/lg10 Create New Lecture Hall / Room and xs24/lg14 Existing Lecture Halls / Rooms (LectureHalls.js:300-307,383-409).
- vNext now: vNext PageHeader, full-width Filter section then manager rows and create-button dialog (admin/lecture-halls/page.tsx:68-145; lecture-hall-manager.tsx:188-199,250-310).
- Fix: Clone exact two-column card layout with inline create form and list toolbar on large screens.

## G2-6-030-006  [P2] GAP  facet F03  effort M
- Legacy: Legacy Create form title Create New Lecture Hall / Room and CTA Create Lecture Hall with PlusOutlined (LectureHalls.js:305-306,376-380).
- vNext now: vNext button opens create dialog labelled via LECTURE_HALL_COPY, without Plus icon (lecture-hall-copy.ts:11-15; lecture-hall-manager.tsx:190-192,250-255).
- Fix: Show original create form always and Plus icon on CTA.

## G2-6-030-056  [P2] GAP  facet F16  effort M
- Legacy: Legacy two-column responsive Col xs24 lg10/lg14 and modal500px (LectureHalls.js:303-305,386-390,428-435).
- vNext now: vNext responsive stacked filter grid + dialog, table mobilePriority and action menu mobileSheet (admin/lecture-halls/page.tsx:72-88; lecture-hall-manager.tsx:200-244).
- Fix: Compare widths 375/768/1280, restore legacy form/table columns and scroll.

## G2-6-030-059  [P2] GAP  facet F18  effort S
- Legacy: Legacy exact visible titles Lecture Halls, Create New Lecture Hall / Room, Existing Lecture Halls / Rooms (LectureHalls.js:300-307,386-390).
- vNext now: vNext PageHeader Lecture Halls, create dialog title Create New Lecture Hall / Room, no Existing Lecture Halls / Rooms section header (admin/lecture-halls/page.tsx:68-70; lecture-hall-manager.tsx:250-255).
- Fix: Restore original list header and place create form title in persistent card.

## G2-6-030-070  [P2] GAP  facet F22  effort M
- Legacy: Legacy capacity service maximum 5000 but UI max1000; duplicate name protected app-layer only (LectureHallServiceImpl.java:39-49,76-100; LectureHalls.js:365-368).
- vNext now: vNext DB capacity1..5000, partial unique index ACTIVE, max client5000 (lecture-halls.ts:17-23; lecture-hall-manager.tsx:109-113).
- Fix: Align UI cap and uniqueness semantics to explicit approved policy.

## G2-9-017-005  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:268-286` — Per-row icon Edit/Delete are local actions, no availability route.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:225-242` — Per-row Availability navigates hall detail; Actions dropdown Edit/Archive/Restore.
- Fix: Keep extra availability but restore direct Edit/Delete icons.

## G2-9-017-009  [P2] GAP  facet F02  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:428-436` — Edit Lecture Hall modal overlays page, width500.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:250-265` — Edit lecture hall Dialog with generic design tokens, title casing changed.
- Fix: Match 500px modal and capitalization.

## G2-9-017-011  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:376-380` — Create Lecture Hall primary PlusOutlined button in always-open form.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:189-192` — Button title Create New Lecture Hall / Room, opens dialog; icon absent.
- Fix: Restore Create Lecture Hall primary icon/label inside form.

## G2-9-017-012  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:268-286` — EditOutlined link and danger DeleteOutlined with titles/aria-labels.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:225-240` — Availability link and Actions dropdown, no per-row icons.
- Fix: Restore icon controls with explicit labels/tooltips.

## G2-9-017-014  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:279-296` — Delete Popconfirm title Delete this room?, body mentions scheduled class sessions.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:312-320` — Archive lecture hall Dialog, blocks upcoming classes.
- Fix: Keep archive safety but use legacy warning context and destructive styling.

## G2-9-017-015  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:380-381` — Create button loading spinner and disabled if colleges request failed.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:260-263` — Modal primary shows Saving…, disabled pending.
- Fix: Match disable/retry at create form.

## G2-9-017-017  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:502-510` — Modal Cancel and Update primary button, title Edit Lecture Hall.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:254-263` — Modal Cancel + Save hall, title Edit lecture hall.
- Fix: Restore Update label and capitalization.

## G2-9-017-018  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:231-265` — Table Name Room Type Capacity College Department Description Actions, college column hidden in college mode.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:200-245` — Name Type Capacity Dept Upcoming classes Status Actions, no Description column.
- Fix: Restore description column and legacy placement/order.

## G2-9-017-020  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:262-262` — Description dedicated column ellipsis truncation.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:202-202` — Description appears in small second line within Name, column absent.
- Fix: Restore separate Description ellipsis column.

## G2-9-017-023  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LectureHall.java:14-27` — Legacy lecture_hall has college_id,dept_id,name,capacity,description,room_type.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:20-30` — DTO has UUID id,name,capacity,roomType,description,status,department.
- Fix: Map zero dept_id to null and old fields to UUID relationships.

## G2-9-017-031  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:328-336` — Department (Optional) with allowClear placeholder Select department.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:295-303` — Select no clear icon, placeholder is Shared by all departments.
- Fix: Match placeholder and independent clear button.

## G2-9-017-032  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:338-346` — Room Name required whitespace, max255, placeholder e.g., Room 101, Lab A.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:274-278` — Name input max255 and same placeholder, validation only on save.
- Fix: Show inline legacy required/max errors on blur/submit.

## G2-9-017-035  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:372-375` — Description TextArea rows2, placeholder e.g., AC room, projector available.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:305-307` — Single-line Input maxLength255, same placeholder.
- Fix: Restore 2-line textarea with 255 schema limit.

## G2-9-017-037  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:154-163` — Edit form prefills fields and snapshots original for dirty detection.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:48-58` — toDraft prefills but no dirty snapshot, allows silent cancel.
- Fix: Track normalized initial draft for dirty guard.

## G2-9-017-038  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:350-368` — Room type list 6 choices, capacity adjacent 12/12.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:279-291` — Capacity appears before Type, two-column md grid.
- Fix: Restore Type left / Capacity right field order.

## G2-9-017-050  [P2] GAP  facet F09  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:277-296` — Delete this room? Popconfirm, context scheduled class sessions and Delete/Cancel.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:312-321` — Archive lecture hall confirm with can't archive while upcoming classes.
- Fix: Preserve archive semantics but match confirmation style/intent.

## G2-9-017-051  [P2] GAP  facet F09  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:428-436` — Edit Lecture Hall Modal width500, maskClosable/keyboard false while saving.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:250-263` — Dialog dismissible={!pending}, no explicit width500.
- Fix: Match width and focus behavior.

## G2-9-017-052  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:56-76` — POST /api/v1/lectureHall/create with college_id,dept_id,room_type snake_case.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:116-133` — POST /api/lecture-halls JSON camelCase collegeId,departmentId,roomType.
- Fix: Document API mapper; preserve zero dept/null semantics.

## G2-9-017-054  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:131-160` — PUT /api/v1/lectureHall/update/{id}.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:123-135` — PATCH /api/lecture-halls/{uuid}, body no collegeId.
- Fix: Confirm parity of partial vs replace semantics.

## G2-9-017-062  [P2] GAP  facet F12  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:128-139` — College id required, department optional and zero default.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:116-133` — College UUID passed, department null if blank.
- Fix: Map optional dept semantics in schema, no zero UUID.

## G2-9-017-075  [P2] GAP  facet F16  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:413-425` — Ant table horizontal scroll on mobile.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:199-245` — Responsive DataTable with mobilePriority name/actions.
- Fix: Compare mobile table overflow/sticky columns to old.

## G2-9-017-076  [P2] GAP  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:268-286` — Edit icon and Delete icon have aria-label Edit/Delete lecture hall.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:231-242` — Dropdown label Lecture hall actions and nested Edit/Archive.
- Fix: Restore direct accessible buttons and action focus.

## G2-9-017-077  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:176-188` — Modal confirms unsaved edits and blocks close while editLoading.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:250-263` — Blocks close while pending but no dirty guard.
- Fix: Add dirty guard for escape/mask/cancel with focus restore.

## G2-9-017-080  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:502-509` — Edit modal Edit Lecture Hall, button Update.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:254-263` — Edit lecture hall, Save hall.
- Fix: Use exact Title Case and Update.

## G2-9-017-081  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:328-337` — Select department placeholder Select department, optional clear.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:295-303` — Shared by all departments.
- Fix: Restore old placeholder and allow clear.

## G2-9-017-082  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:231-264` — Table column Description visible, no Upcoming classes or Status.
- vNext now: `src/components/admin/lecture-hall-manager.tsx:202-225` — Column added Upcoming classes/Status, Description folded into Name.
- Fix: Restore column list and order.

## G2-10-018-015  [P3] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:256-259 — No department prints '-' (not 'Shared by all departments').
- vNext now: src/components/admin/lecture-hall-manager.tsx:203-211 — Department fallback descriptive Shared by all departments.
- Fix: Use old table placeholder.

## G2-10-018-018  [P3] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:241-241 — Capacity number with fixed80px column.
- vNext now: src/components/admin/lecture-hall-manager.tsx:204-204 — Capacity number but flexible width.
- Fix: Set fixed 80px desktop.

## G2-19-018-005  [P3] GAP  facet F02  effort S
- Legacy: Edit dialog width 500, titled Edit Lecture Hall. `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:427-436`
- vNext now: Shared Dialog titled Edit lecture hall, generic description. `src/components/admin/lecture-hall-manager.tsx:250-256`
- Fix: Match exact title width and header copy.
