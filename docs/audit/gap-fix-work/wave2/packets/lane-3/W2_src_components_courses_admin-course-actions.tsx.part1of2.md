# Work packet (wave 2): edit src/components/courses/admin-course-actions.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l19-u027-course-controller.md, docs/audit/gap2/lane-12/courses.md, docs/audit/gap2/lane-18/u003-superadmin-courses.md, docs/audit/gap2/lane-3/college-admin-courses.md, docs/audit/gap2/lane-4/superadmin-faculty-assignment.md, docs/audit/gap2/lane-6/course-home-edit-drawer.md

## G2-19-027-006  [P2] GAP  facet F03  effort M
- Legacy: Course title is link with thumbnail/image and optional short title/tag, per-row Edit, Duplicate and Delete button + Popconfirm; Courses.js:20-25,474-512
- vNext now: vNext `Course` column name/code + nested Course details Disclosure; Edit button + More Dropdown with Duplicate/Archive; admin-course-overview.tsx:86-164; admin-course-actions.tsx:100-146
- Fix: Restore thumbnail, exact course-name secondary text, direct Delete/Archive affordance, AntD icon/badge sizes and confirmation; keep action menu keyboard safe.

## G2-19-027-007  [P2] GAP  facet F03  effort S
- Legacy: Legacy delete button danger with DeleteOutlined, EditOutlined and CopyOutlined actions; Courses.js:4-6,493-512
- vNext now: vNext mostly text Edit and Dropdown trigger More with Duplicate and Archive, no DeleteOutlined; admin-course-actions.tsx:121-146
- Fix: Match 14px icon sizes, button treatment and shortcut order, but label true archive semantics accurately if not destructive delete.

## G2-19-027-029  [P2] GAP  facet F09  effort M
- Legacy: Legacy create/edit course modal with image uploader, Popconfirm `Delete “name”?` and detailed consequence; Courses.js:4-6,34-95,505-512
- vNext now: vNext Create Course and offering Disclosure, Edit Course Dialog and Archive ConfirmDialog; admin-course-overview.tsx:450-480; admin-course-actions.tsx:135-219
- Fix: Match legacy 600/800px dialog geometry, form grid, image preview, exact confirm copy, focus restore; separate newer multi-step offering wizard.

## G2-19-027-030  [P2] GAP  facet F09  effort M
- Legacy: Legacy duplicate uses create modal populated from original with image metadata, parent/date values preserved; Courses.js:4-11,240-300
- vNext now: vNext duplicate link `?duplicate={UUID}` prefill in AdminCourseCreatePanel for name/code/description/partial metadata; admin-course-actions.tsx:131-142; admin-course-create-panel.tsx:99-135
- Fix: Compare full duplicated metadata including image/shortTitle and reset unique code; never duplicate internal tenant IDs.

## G2-19-027-046  [P2] GAP  facet F16  effort M
- Legacy: Legacy antd course table horizontal scroll and form Row gutter12 xs24 sm12 with image preview; Courses.js:34-62,473-512
- vNext now: vNext DataTable responsive mobile-priority actions, Edit dialog grid and disclosure; admin-course-overview.tsx:86-165,545-558; admin-course-actions.tsx:135-219
- Fix: Screenshot-compare 320/768/1280 table action wrapping, form gutter12 and image aspect; retain 44px mobile touch target.

## G2-19-027-049  [P2] GAP  facet F18  effort S
- Legacy: Legacy success `Updated course “name”.`, `Deleted course “name”.`, retry banner `Course was not deleted`; Courses.js:364-377,391-403,570-575
- vNext now: vNext update toast `Updated course “name”.`, archive action uses separate title; admin-course-actions.tsx:34-65,181-203
- Fix: Retain updated copy match, replace archive/delete wording only when semantically honest, mirror original retry banner.

## G2-12-003-011  [P2] GAP  facet F03  effort S
- Legacy: Inline Edit, Duplicate, Delete buttons with icons `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:499-515`
- vNext now: Edit + More menu Duplicate/Archive `src/components/courses/admin-course-actions.tsx:124-141`
- Fix: Restore inline action placement and icons

## G2-12-003-042  [P2] GAP  facet F09  effort S
- Legacy: Edit modal title `Edit “<name>”`, width660, Save Changes/Cancel, maskClosable=false `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:635-652`
- vNext now: Dialog title `Edit Course`, Save/Cancel; dismissible when idle `src/components/courses/admin-course-actions.tsx:143-190`
- Fix: Restore dynamic title, width, exact footer/close

## G2-12-003-057  [P2] GAP  facet F12  effort S
- Legacy: Metadata fields retained on edits even if hidden controls not rendered `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:37-40`
- vNext now: Edit PATCH sends name/code/shortTitle/officialCode/cardColor/takeaways/description only `src/components/courses/admin-course-actions.tsx:101-104,164-181`
- Fix: Preserve all legacy metadata or document intentional removal

## G2-12-003-070  [P2] GAP  facet F17  effort S
- Legacy: Course actions dynamic aria labels with course name `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:500-512`
- vNext now: Edit text button; More menu generic `Course actions` `src/components/courses/admin-course-actions.tsx:126-140`
- Fix: Add course-qualified accessible actions

## G2-18-003-012  [P2] GAP  facet F03  effort S
- Legacy: Legacy duplicate button in row and info notice with Cancel copy; focuses first form input. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:306-323`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:500-504`
- vNext now: vNext duplicateHref via CourseActions and copied prefill from `?duplicate=uuid`. `src/components/courses/admin-course-actions.tsx:128-140`, `src/components/courses/admin-course-create-panel.tsx:111-129`
- Fix: Provide info banner, Cancel copy, scroll/focus first input after navigation.

## G2-18-003-014  [P2] GAP  facet F03  effort S
- Legacy: Legacy card colour input native color picker width80. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:86-89`
- vNext now: vNext cardColor string Input in metadata editor. `src/components/courses/admin-course-actions.tsx:94-98`, `src/components/courses/admin-course-actions.tsx:213-218`
- Fix: Use color picker+HEX validation and 80px width, preserving signed-safe style.

## G2-18-003-018  [P2] GAP  facet F03  effort M
- Legacy: Legacy Edit/Duplicate/Delete with glyphs shown inline. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:499-513`
- vNext now: vNext Edit with More dropdown (Duplicate/Archive). `src/components/courses/admin-course-actions.tsx:124-142`
- Fix: Use visible 3-action row buttons with legacy icons/tooltip and retain archive safeguards.

## G2-18-003-023  [P2] GAP  facet F04  effort M
- Legacy: Legacy Official course code optional max40, if blank fallback short title. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:58-61`
- vNext now: vNext course code required, optional officialCode max64; separate shortTitle max120. `src/modules/courses/validation.ts:16-41`, `src/components/courses/admin-course-actions.tsx:207-213`
- Fix: Map old official code into officialCode with 40-char compatibility; ensure visible code fallback.

## G2-18-003-037  [P2] GAP  facet F06  effort S
- Legacy: Legacy In this Course Description required textarea rows3. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:68-71`
- vNext now: vNext optional description max5000 and may be empty. `src/modules/courses/validation.ts:39-45`, `src/components/courses/admin-course-actions.tsx:234-245`
- Fix: Restore required validation if literal parity; preserve max5000 as safe cap.

## G2-18-003-038  [P2] GAP  facet F06  effort M
- Legacy: Legacy Course Takeaways ordered points editor. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:72-75`
- vNext now: vNext single Textarea string max2000. `src/components/courses/admin-course-actions.tsx:213-215`, `src/modules/courses/validation.ts:36-39`
- Fix: Use editable ordered-point rows preserving ordering, sanitize and persist list.

## G2-18-003-054  [P2] GAP  facet F09  effort S
- Legacy: Legacy duplicate is not a modal; preloads Create form, scrolls/focus first field. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:306-323`
- vNext now: vNext duplicate navigates `?duplicate` and prefill; refresh may move focus unexpectedly. `src/components/courses/admin-course-actions.tsx:136-140`, `src/components/courses/admin-course-create-panel.tsx:111-129`
- Fix: Preserve focus and avoid resetting prefilled form on route changes.

## G2-18-003-055  [P2] GAP  facet F09  effort S
- Legacy: Legacy Delete Popconfirm cites linked lessons and server check; prevents action if dependencies known. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:493-513`
- vNext now: vNext archive ConfirmDialog warns active offering blocker. `src/components/courses/admin-course-actions.tsx:254-260`
- Fix: Include both dependency types and no unlinking under different tenant.

## G2-18-003-056  [P2] GAP  facet F09  effort S
- Legacy: Legacy Edit Modal width660, Cancel/Save Changes, no outside click during edit, image upload disables close. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:635-653`
- vNext now: vNext Dialog Edit Course with own footer and dirty guard. `src/components/courses/admin-course-actions.tsx:143-180`, `src/components/courses/admin-course-actions.tsx:248-252`
- Fix: Match 660px modal, errors, image upload pending and keyboard/ESC behavior.

## G2-18-003-070  [P2] GAP  facet F11  effort S
- Legacy: Legacy deletion blocked if linked lesson, safety/ownership rechecked server. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:487-513`
- vNext now: vNext blocks archive with active offerings and requires courses.manage. `src/components/courses/admin-course-actions.tsx:254-260`, `src/modules/courses/course-service.ts:320-435`
- Fix: Display both linked lessons and offerings with no unauthorized leak.

## G2-18-003-075  [P2] GAP  facet F12  effort M
- Legacy: Legacy delete with active lessons blocked, avoid cascade orphan data. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:487-513`
- vNext now: vNext archive blocked on active offerings, historical rows preserved. `src/components/courses/admin-course-actions.tsx:254-260`, `src/modules/courses/course-service.ts:320-435`
- Fix: Add dependency details and archive behavior explanation.

## G2-18-003-088  [P2] GAP  facet F16  effort S
- Legacy: Legacy edit modal 660px, Image preview 100px and buttons inline. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:635-653`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:76-84`
- vNext now: vNext Dialog defaults custom responsive width, image absent. `src/components/courses/admin-course-actions.tsx:143-252`
- Fix: Match 660px max, vertically scrollable modal, preview/action layout.

## G2-18-003-089  [P2] GAP  facet F17  effort S
- Legacy: Legacy duplicate scrolls form into view then focuses first input. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:306-323`
- vNext now: vNext duplicate navigation prefill, no focus management in create component. `src/components/courses/admin-course-actions.tsx:136-140`, `src/components/courses/admin-course-create-panel.tsx:111-129`
- Fix: Focus first input and announce duplication on navigation.

## G2-18-003-091  [P2] GAP  facet F17  effort S
- Legacy: Legacy Edit/Duplicate/Delete aria-label includes course name. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:499-513`
- vNext now: vNext per-row button names generic Edit/More. `src/components/courses/admin-course-actions.tsx:124-142`
- Fix: Ensure per-course accessible name via aria-label and keyboard focus.

## G2-18-003-097  [P2] GAP  facet F18  effort S
- Legacy: Legacy delete action says Delete; vNext says Archive. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:505-513`
- vNext now: vNext archive captures historical records. `src/components/courses/admin-course-actions.tsx:254-260`
- Fix: Document intentional deletion replacement; message exact consequences and restore location.

## G2-3-008-010  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:469-517`
- vNext now: `src/components/courses/admin-course-overview.tsx:87-169`; `src/components/courses/admin-course-actions.tsx:124-140`
- Fix: Old row includes image thumbnail, Edit, Duplicate, Delete icon buttons; new row omits image and puts Duplicate/Archive under More.

## G2-3-008-032  [P2] GAP  facet F06  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:635-652`
- vNext now: `src/components/courses/admin-course-actions.tsx:143-181`
- Fix: Legacy Edit modal width 660 with exact form including dept/shortTitle/media; vNext Edit Course Dialog with immutable dept and name/code/description.

## G2-3-008-042  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:635-652`
- vNext now: `src/components/courses/admin-course-actions.tsx:143-181`
- Fix: Restore Edit modal width660, header `Edit “course”`, Save Changes/Cancel and dirty confirmation; vNext generic title `Edit Course`.

## G2-3-008-044  [P2] GAP  facet F09  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:350-353`
- vNext now: `src/components/courses/admin-course-actions.tsx:101-109`
- Fix: Legacy discard message `Discard unsaved course changes?` includes specific course name; new generic ConfirmDialog loses detail.

## G2-3-008-065  [P2] GAP  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:500-515`
- vNext now: `src/components/courses/admin-course-actions.tsx:124-140`
- Fix: Legacy row buttons have aria-label `Edit course X`, `Duplicate course X`, `Delete course X`; vNext Edit generic + More menu, restore accessible record-specific labels.

## G2-3-008-066  [P2] GAP  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:635-652`
- vNext now: `src/components/courses/admin-course-actions.tsx:143-181`
- Fix: Legacy Modal Escape disabled during save/upload, maskClosable=false; new Dialog dismissible when !pending only; verify dirty handling and keyboard focus.

## G2-4-008-038  [P2] GAP  facet F09  effort M
- Legacy: Delete Popconfirm `Delete teaching assignment?`/`This removes the faculty from teaching the listed course.`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:373-379`)
- vNext now: ConfirmDialog title matches via legacyCopy but description adds history notice; button End/Remove. (`src/components/courses/admin-course-actions.tsx:559-575`)
- Fix: Match dialog wording/label, document retention instead of physical delete.

## G2-4-008-052  [P2] GAP  facet F13  effort M
- Legacy: Old delete failure offers Retry delete and closable Alert. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:319-337;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:492-494`)
- vNext now: New error routed to course mutation toast; no separate retry. (`src/components/courses/admin-course-actions.tsx:566-575`)
- Fix: Add per-row retry state.

## G2-4-008-062  [P2] GAP  facet F18  effort M
- Legacy: Old `Create Assignment`, `Edit`, `Delete`, `Save Changes`, `Filter by class`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:370-379;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:471-483;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:516-520`)
- vNext now: New `Create teaching assignment`, `Assign faculty`, `Edit role`, `End`, `All classes`. (`src/components/admin/super-admin-faculty-assignment-create.tsx:59-64;src/components/admin/super-admin-faculty-assignment-create.tsx:111-117;src/components/admin/super-admin-faculty-assignment-create.tsx:151-169;src/components/courses/admin-course-actions.tsx:548-555;src/components/admin/admin-scoped-read-page.tsx:179-183`)
- Fix: Match exact legacy action copy or scope-approved variants.

## G2-6-009-003  [P2] GAP  facet F02  effort S
- Legacy: Old DrawerWidget right placement and 352px width `docs/legacy-source/frontend/src/pages/Dashboard/course/Home/HomeEditDrawer.js:18-24`
- vNext now: New Dialog editor centered, not a right drawer `src/components/courses/admin-course-actions.tsx:143-148`
- Fix: If legacy dormant action restored, use 352px right drawer with old vertical hierarchy

## G2-6-009-004  [P2] GAP  facet F02  effort S
- Legacy: Old drawer content uses `ln-drawer-body`/`ln-drawer-content h-100` then two `mb-4` form groups `docs/legacy-source/frontend/src/pages/Dashboard/course/Home/HomeEditDrawer.js:31-74`
- vNext now: New Dialog grid gap-4 with additional metadata fields `src/components/courses/admin-course-actions.tsx:193-220`
- Fix: Match legacy label spacing/two-field layout only if re-enabling old drawer

## G2-6-009-005  [P2] GAP  facet F03  effort S
- Legacy: Old drawer title `Course Information` `docs/legacy-source/frontend/src/pages/Dashboard/course/Home/HomeEditDrawer.js:18-23`
- vNext now: New modal title `Edit Course` `src/components/courses/admin-course-actions.tsx:143-148`
- Fix: Use old Course Information caption in equivalent course-home context

## G2-6-009-011  [P2] GAP  facet F06  effort S
- Legacy: Old Course title is required Text Input, whitespace:true invalid, no maxLength `docs/legacy-source/frontend/src/pages/Dashboard/course/Home/HomeEditDrawer.js:35-48`
- vNext now: New name Input maxLength 255, Save disabled on !name.trim() `src/components/courses/admin-course-actions.tsx:159-163` `src/components/courses/admin-course-actions.tsx:194-204`
- Fix: Document 255-character new cap and retain trimmed nonblank logic

## G2-6-009-012  [P2] GAP  facet F06  effort S
- Legacy: Old Course info required TextArea, whitespace:false, height200 `docs/legacy-source/frontend/src/pages/Dashboard/course/Home/HomeEditDrawer.js:51-69`
- vNext now: New description initialized optional and sends null on whitespace-only `src/components/courses/admin-course-actions.tsx:93-98` `src/components/courses/admin-course-actions.tsx:171-179`
- Fix: Match required info semantics if old drawer feature is approved

## G2-6-009-013  [P2] GAP  facet F06  effort S
- Legacy: Old first field `name=Course_title` (capital C underscore), placeholder `Course title` `docs/legacy-source/frontend/src/pages/Dashboard/course/Home/HomeEditDrawer.js:36-47`
- vNext now: New controlled name uses COLLEGE_COURSES_COPY.nameLabel and no inline placeholder `src/components/courses/admin-course-actions.tsx:193-205`
- Fix: Restore exact Course title label/placeholder in matching editor
