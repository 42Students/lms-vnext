# Work packet (wave 2): edit src/components/courses/college-assignment-create.tsx

34 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-admin-assignments.md, docs/audit/gap2/lane-4/superadmin-assignments.md, docs/audit/gap2/lane-4/superadmin-sections-assignments.md

## G2-4-004-006  [P2] GAP  facet F02  effort M
- Legacy: Builder appears in 720px Ant Design Modal separate from page. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:275-289`)
- vNext now: Creation expands inline form under header, confirmation dialogs on submit/discard. (`src/components/courses/college-assignment-create.tsx:91-163`)
- Fix: Use legacy-sized 720px Create/Edit modal with form footer instead of inline creation panel.

## G2-4-004-008  [P2] GAP  facet F03  effort M
- Legacy: Table has button `Create Assignment` with PlusOutlined icon. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:415-418`)
- vNext now: Inline trigger `Create New Assignment` without matching plus icon. (`src/components/courses/college-assignment-create.tsx:91-99`)
- Fix: Use `Create Assignment` exact label and plus icon in toolbar.

## G2-4-004-033  [P2] GAP  facet F06  effort M
- Legacy: Course and Lesson separate searchable/dependent fields; both disabled editing existing assignment. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:303-320`)
- vNext now: Create a single Course / Lesson dropdown; existing edit never offers course/lesson selector. (`src/components/courses/college-assignment-create.tsx:100-107; src/components/courses/college-assignment-actions.tsx:104-120`)
- Fix: Restore distinct course then lesson controls and edit-time immutable display.

## G2-4-004-034  [P2] GAP  facet F06  effort M
- Legacy: Audience radio ALL vs SPECIFIC, specific Section select required only on SPECIFIC. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:321-349`)
- vNext now: Audience is select of Shared offering vs concrete section values. (`src/components/courses/college-assignment-create.tsx:108-115`)
- Fix: Use legacy radio/conditional section picker with section count helper.

## G2-4-004-035  [P2] GAP  facet F06  effort M
- Legacy: Instructions placeholder `What the student needs to submit`, rows4; deadline DatePicker showTime (wall-clock). (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:358-366`)
- vNext now: Instructions rows3 no placeholder; deadline native datetime-local IST. (`src/components/courses/college-assignment-create.tsx:129-136`)
- Fix: Align editor field visuals/help and deadline picker/timezone semantics.

## G2-4-004-046  [P2] GAP  facet F09  effort M
- Legacy: Builder Modal title `Create Assignment` / `Edit Assignment`, width720, Save/Create footer, blocked close during upload/save. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:254-303`)
- vNext now: Inline region plus distinct Create draft and Discard confirm dialogs. (`src/components/courses/college-assignment-create.tsx:100-163`)
- Fix: Rebuild single width720 builder modal with backdrop/close guard and editable resource sections.

## G2-4-004-067  [P2] GAP  facet F13  effort M
- Legacy: Section option fetch error displays `Section list unavailable` + `Retry sections`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:396-400`)
- vNext now: vNext delivery options static prop, no section-specific loading/failure/retry UI. (`src/components/courses/college-assignment-create.tsx:38-41; src/components/courses/college-assignment-create.tsx:108-115`)
- Fix: Represent separate section-loading error and retry affordance.

## G2-4-004-078  [P2] GAP  facet F16  effort M
- Legacy: Builder width720/modal, grade drawer width760 on all widths; responsive antd breakpoint via `Grid.useBreakpoint`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:87-89; docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:275-289; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:160-162`)
- vNext now: vNext inline create grid sm2 and mobile buttons full-width; review inline. (`src/components/courses/college-assignment-create.tsx:91-152; src/components/courses/college-assignment-review.tsx:77-103`)
- Fix: Reproduce responsive overlay dimensions/scroll/focus and legacy action stacking.

## G2-4-004-079  [P2] GAP  facet F17  effort M
- Legacy: Legacy builder fields are Ant Design Form.Item associated labels; grade input aria-label `Points for NAME`, row edit/delete aria-labels. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:303-366; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:113-118; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:372-377`)
- vNext now: vNext nested label inputs, per-student grade points label; confirmation uses native window.confirm for bulk and delete. (`src/components/courses/college-assignment-create.tsx:100-140; src/components/courses/faculty-assignment-review.tsx:352-389; src/components/courses/college-assignment-actions.tsx:50-55; src/components/courses/college-assignment-review.tsx:29-34`)
- Fix: Replace blocking window.confirm with keyboard/focus-managed shared ConfirmDialog.

## G2-4-004-081  [P2] GAP  facet F18  effort M
- Legacy: Header/button wording `Assignments`, `Create Assignment`, `Export CSV (page)`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:384-419`)
- vNext now: `Assignments`, `Create New Assignment`, `Export CSV`. (`src/components/courses/college-assessment-aggregate.tsx:77-90; src/components/courses/college-assignment-create.tsx:91-97`)
- Fix: Match exact action strings and page head alignment.

## G2-4-004-082  [P2] GAP  facet F18  effort M
- Legacy: Legacy form `Audience`, `Specific section`, `All currently eligible sections for this course`. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:321-349`)
- vNext now: VNext form says Audience and `All currently eligible sections (shared offering)`; other text capitalization differs. (`src/components/courses/college-assignment-create.tsx:108-126`)
- Fix: Use copy catalogue exact audience labels and helper text.

## G2-4-004-090  [P2] GAP  facet F20  effort M
- Legacy: Legacy deadline is India wall-clock local date time, no timezone in payload. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:218-229; docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LessonContents.java:55-58`)
- vNext now: VNext parses IST to ISO and stores timezone-aware timestamp, formats IST to users. (`src/components/courses/college-assignment-create.tsx:65-77; src/components/courses/college-assessment-aggregate.tsx:41-48`)
- Fix: Verify midnight/DST/locale and migration interpretation of historical local deadlines; use IST consistently.

## G2-4-007-006  [P2] GAP  facet F02  effort M
- Legacy: Legacy edit/creation in centered width720 Modal. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:275-289`)
- vNext now: CollegeAssignmentCreate inline rendered above directory. (`src/app/(authenticated)/admin/assignments/page.tsx:52-56;src/components/courses/college-assignment-create.tsx:91-163`)
- Fix: Match exact legacy interaction and value or explicitly record approved divergence.

## G2-4-007-007  [P2] GAP  facet F03  effort M
- Legacy: Button Create Assignment with plus icon, disabled if course options inaccessible. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:415-419`)
- vNext now: Inline Create New Assignment input form, warning if options unavailable. (`src/app/(authenticated)/admin/assignments/page.tsx:52-56;src/components/courses/college-assignment-create.tsx:91-99`)
- Fix: Match exact legacy interaction and value or explicitly record approved divergence.

## G2-4-007-023  [P2] GAP  facet F06  effort M
- Legacy: Submission method default WRITTEN_RESPONSE. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:80-135`)
- vNext now: All methods selected default. (`src/components/courses/college-assignment-create.tsx:23-31`)
- Fix: Match exact legacy interaction and value or explicitly record approved divergence.

## G2-4-007-024  [P2] GAP  facet F06  effort M
- Legacy: Legacy class scope ALL vs one specific section radio controls. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:321-349`)
- vNext now: New delivery selector encodes audience as shared offering vs section. (`src/components/courses/college-assignment-create.tsx:108-115`)
- Fix: Match exact legacy interaction and value or explicitly record approved divergence.

## G2-4-007-048  [P2] GAP  facet F16  effort M
- Legacy: Table horizontal x:max-content, right fixed action column at md; builder widths720/760. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:343-382;docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:423-425`)
- vNext now: Responsive item cards, inline form and inline review. (`src/components/courses/admin-assessment-read-directory.tsx:62-108;src/components/courses/college-assignment-create.tsx:91-163`)
- Fix: Match exact legacy interaction and value or explicitly record approved divergence.

## G2-4-007-051  [P2] GAP  facet F18  effort M
- Legacy: Toolbar Create Assignment, Export CSV (page). (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:415-419`)
- vNext now: New Export, inline Create New Assignment. (`src/app/(authenticated)/admin/assignments/page.tsx:58-61;src/components/courses/college-assignment-create.tsx:91-99`)
- Fix: Match exact legacy interaction and value or explicitly record approved divergence.

## G2-4-010-006  [P2] GAP  facet F02  effort M
- Legacy: Builder appears in 720px Ant Design Modal separate from page. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:275-289`)
- vNext now: Creation expands inline form under header, confirmation dialogs on submit/discard. (`src/components/courses/college-assignment-create.tsx:91-163`)
- Fix: Use legacy-sized 720px Create/Edit modal with form footer instead of inline creation panel.

## G2-4-010-008  [P2] GAP  facet F03  effort M
- Legacy: Table has button `Create Assignment` with PlusOutlined icon. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:415-418`)
- vNext now: Inline trigger `Create New Assignment` without matching plus icon. (`src/components/courses/college-assignment-create.tsx:91-99`)
- Fix: Use `Create Assignment` exact label and plus icon in toolbar.

## G2-4-010-033  [P2] GAP  facet F06  effort M
- Legacy: Course and Lesson separate searchable/dependent fields; both disabled editing existing assignment. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:303-320`)
- vNext now: Create a single Course / Lesson dropdown; existing edit never offers course/lesson selector. (`src/components/courses/college-assignment-create.tsx:100-107; src/components/courses/college-assignment-actions.tsx:104-120`)
- Fix: Restore distinct course then lesson controls and edit-time immutable display.

## G2-4-010-034  [P2] GAP  facet F06  effort M
- Legacy: Audience radio ALL vs SPECIFIC, specific Section select required only on SPECIFIC. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:321-349`)
- vNext now: Audience is select of Shared offering vs concrete section values. (`src/components/courses/college-assignment-create.tsx:108-115`)
- Fix: Use legacy radio/conditional section picker with section count helper.

## G2-4-010-035  [P2] GAP  facet F06  effort M
- Legacy: Instructions placeholder `What the student needs to submit`, rows4; deadline DatePicker showTime (wall-clock). (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:358-366`)
- vNext now: Instructions rows3 no placeholder; deadline native datetime-local IST. (`src/components/courses/college-assignment-create.tsx:129-136`)
- Fix: Align editor field visuals/help and deadline picker/timezone semantics.

## G2-4-010-046  [P2] GAP  facet F09  effort M
- Legacy: Builder Modal title `Create Assignment` / `Edit Assignment`, width720, Save/Create footer, blocked close during upload/save. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:254-303`)
- vNext now: Inline region plus distinct Create draft and Discard confirm dialogs. (`src/components/courses/college-assignment-create.tsx:100-163`)
- Fix: Rebuild single width720 builder modal with backdrop/close guard and editable resource sections.

## G2-4-010-067  [P2] GAP  facet F13  effort M
- Legacy: Section option fetch error displays `Section list unavailable` + `Retry sections`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:396-400`)
- vNext now: vNext delivery options static prop, no section-specific loading/failure/retry UI. (`src/components/courses/college-assignment-create.tsx:38-41; src/components/courses/college-assignment-create.tsx:108-115`)
- Fix: Represent separate section-loading error and retry affordance.

## G2-4-010-078  [P2] GAP  facet F16  effort M
- Legacy: Builder width720/modal, grade drawer width760 on all widths; responsive antd breakpoint via `Grid.useBreakpoint`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:87-89; docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:275-289; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:160-162`)
- vNext now: vNext inline create grid sm2 and mobile buttons full-width; review inline. (`src/components/courses/college-assignment-create.tsx:91-152; src/components/courses/college-assignment-review.tsx:77-103`)
- Fix: Reproduce responsive overlay dimensions/scroll/focus and legacy action stacking.

## G2-4-010-079  [P2] GAP  facet F17  effort M
- Legacy: Legacy builder fields are Ant Design Form.Item associated labels; grade input aria-label `Points for NAME`, row edit/delete aria-labels. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:303-366; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:113-118; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:372-377`)
- vNext now: vNext nested label inputs, per-student grade points label; confirmation uses native window.confirm for bulk and delete. (`src/components/courses/college-assignment-create.tsx:100-140; src/components/courses/faculty-assignment-review.tsx:352-389; src/components/courses/college-assignment-actions.tsx:50-55; src/components/courses/college-assignment-review.tsx:29-34`)
- Fix: Replace blocking window.confirm with keyboard/focus-managed shared ConfirmDialog.

## G2-4-010-081  [P2] GAP  facet F18  effort M
- Legacy: Header/button wording `Assignments`, `Create Assignment`, `Export CSV (page)`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:384-419`)
- vNext now: `Assignments`, `Create New Assignment`, `Export CSV`. (`src/components/courses/college-assessment-aggregate.tsx:77-90; src/components/courses/college-assignment-create.tsx:91-97`)
- Fix: Match exact action strings and page head alignment.

## G2-4-010-082  [P2] GAP  facet F18  effort M
- Legacy: Legacy form `Audience`, `Specific section`, `All currently eligible sections for this course`. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:321-349`)
- vNext now: VNext form says Audience and `All currently eligible sections (shared offering)`; other text capitalization differs. (`src/components/courses/college-assignment-create.tsx:108-126`)
- Fix: Use copy catalogue exact audience labels and helper text.

## G2-4-010-090  [P2] GAP  facet F20  effort M
- Legacy: Legacy deadline is India wall-clock local date time, no timezone in payload. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:218-229; docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LessonContents.java:55-58`)
- vNext now: VNext parses IST to ISO and stores timezone-aware timestamp, formats IST to users. (`src/components/courses/college-assignment-create.tsx:65-77; src/components/courses/college-assessment-aggregate.tsx:41-48`)
- Fix: Verify midnight/DST/locale and migration interpretation of historical local deadlines; use IST consistently.

## G2-4-010-106  [P2] GAP  facet F03  effort M
- Legacy: Create Assignment button (+ icon) in top toolbar, disabled if no authorized course options. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:415-419`)
- vNext now: New inline creation form occupies page intro, creation options absent shows generic banner. (`src/app/(authenticated)/admin/assignments/page.tsx:52-56;src/components/courses/college-assignment-create.tsx:91-99`)
- Fix: Show modal-opening Create Assignment button at original toolbar position; disable when no course.

## G2-4-010-112  [P2] GAP  facet F06  effort M
- Legacy: Old modal has separate Course and Lesson searchable selects, audience ALL vs specific class. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:303-350`)
- vNext now: New create has combined lesson/delivery picker and audience select. (`src/components/courses/college-assignment-create.tsx:100-115`)
- Fix: Restore two dependent selectors and audience radio with class picker.

## G2-4-010-126  [P2] GAP  facet F16  effort M
- Legacy: Old Table scroll x max-content, fixed actions right; builder modal720 and submission modal760. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:343-382;docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:423-425`)
- vNext now: New SA card layout removes horizontal scroll and overlays. (`src/components/courses/admin-assessment-read-directory.tsx:62-109;src/components/courses/college-assignment-create.tsx:91-163`)
- Fix: Restore responsive fixed-action table and modal sizes, compare at 680/1120px.

## G2-4-010-128  [P2] GAP  facet F18  effort M
- Legacy: Shared section heading `Assignments` and `Create Assignment`, `Export CSV (page)`, `Publish grades`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:384-435`)
- vNext now: SA PageHeader `Assignments`, action `Export`, inline `Create New Assignment`. (`src/app/(authenticated)/admin/assignments/page.tsx:50-62;src/components/courses/college-assignment-create.tsx:91-99`)
- Fix: Copy legacy action labels exactly.
