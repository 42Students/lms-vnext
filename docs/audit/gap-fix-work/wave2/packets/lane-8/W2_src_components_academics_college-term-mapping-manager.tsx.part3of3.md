# Work packet (wave 2): edit src/components/academics/college-term-mapping-manager.tsx (part 3 of 3)

25 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u025-semester-controller.md, docs/audit/gap2/lane-12/semester-courses.md, docs/audit/gap2/lane-16/u007-college-semester-courses.md, docs/audit/gap2/lane-17/superadmin-semester-course-mapping.md

## G2-5-025-007  [P2] GAP  facet F02  effort M
- Legacy: Legacy maps in sortable table with drag-sort and edit controls. `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:11-16`
- vNext now: vNext order control edits position with normalization, not same drag handle. `src/components/academics/college-term-mapping-manager.tsx:122-125,128-152`
- Fix: Restore drag interaction and row-level visual feedback, preserve keyboard alternative.

## G2-5-025-009  [P2] GAP  facet F03  effort M
- Legacy: Legacy Semester–Course Mapping emphasizes Course Type, Core Mandatory and electives. `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:1-16`
- vNext now: vNext model preserves selected labels but add defaults CORE. `src/modules/academics/college-term-mapping-model.ts:43-54`, `src/components/academics/college-term-mapping-manager.tsx:128-162`
- Fix: Expose course type selection in add action as legacy.

## G2-5-025-021  [P2] GAP  facet F06  effort M
- Legacy: Legacy reorder accepts mappingIds complete sequence. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:553-599`
- vNext now: vNext edit position requires credits value even if only changing order. `src/modules/academics/college-term-mapping-model.ts:9-21`, `src/components/academics/college-term-mapping-manager.tsx:90-125`
- Fix: Provide order-only move and dense ordering with no credits rewrite.

## G2-5-025-031  [P2] GAP  facet F09  effort M
- Legacy: Legacy mapping reorder drag-and-drop table rows with server complete-list update. `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:1-16`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:553-599`
- vNext now: vNext position input row editor. `src/components/academics/college-term-mapping-manager.tsx:90-125`
- Fix: Add sortable rows and accessible keyboard movement.

## G2-5-025-047  [P2] GAP  facet F13  effort M
- Legacy: Legacy mapping partial lookup failures separated by semester scope. `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:44-52`
- vNext now: vNext exposes one combined notice/error for mapping actions. `src/components/academics/college-term-mapping-manager.tsx:31-60`
- Fix: Keep lookup vs mapping save errors separate with retry.

## G2-12-002-011  [P3] GAP  facet F03  effort S
- Legacy: Plus icon add, edit/delete icons, reload icon `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:372-375,312-320,383-384`
- vNext now: Text buttons and arrow strings; no matching icons `src/components/academics/college-term-mapping-manager.tsx:165-170,231-251`
- Fix: Restore matching action icons

## G2-12-002-038  [P3] GAP  facet F09  effort S
- Legacy: Popconfirm remove with course name `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:315-320`
- vNext now: Shared ConfirmDialog Remove `src/components/academics/college-term-mapping-manager.tsx:258-267`
- Fix: Clone confirmation presentation

## G2-12-002-063  [P3] GAP  facet F17  effort S
- Legacy: AntD Form.Item associated validation and alert icons `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:335-346,417-425`
- vNext now: Inline role=alert/status paragraphs `src/components/academics/college-term-mapping-manager.tsx:256-269`
- Fix: Associate per-field errors with fields

## G2-16-007-009  [P3] GAP  facet F03  effort S
- Legacy: `SemesterCourseMapping.js:335`: left Card heading `Assign Courses to Semester`.
- vNext now: `college-term-mapping-manager.tsx:129-130,152`: heading `Program semester curriculum mappings` and disclosure `Add courses`.
- Fix: Restore left card title and treat add form as always visible.

## G2-16-007-013  [P3] GAP  facet F04  effort S
- Legacy: `SemesterCourseMapping.js:305-307`: code width120, credits width80, order width70, actions width175.
- vNext now: `college-term-mapping-manager.tsx:180-254`: DataTable has no explicit per-column pixel widths.
- Fix: Set legacy widths and horizontal overflow.

## G2-16-007-025  [P3] GAP  facet F06  effort S
- Legacy: `SemesterCourseMapping.js:190-200`: single bulk add POST, clears draft only after success.
- vNext now: `college-term-mapping-manager.tsx:77-87,36-58`: bulk add with confirmation, clears selected term after success.
- Fix: Confirm whether extra confirmation required; keep atomic add and reset only after success.

## G2-16-007-048  [P3] GAP  facet F12  effort S
- Legacy: `SemesterCourseMapping.js:372-375`: no selected-course guard in disable; clicking triggers toast.
- vNext now: `college-term-mapping-manager.tsx:167-168`: disable until courseIds length >0.
- Fix: Preserve error feedback for keyboard/empty submission if matching legacy; disabled safeguard acceptable if approved.

## G2-16-007-053  [P3] GAP  facet F13  effort S
- Legacy: `SemesterCourseMapping.js:403`: `Select a program and semester to view/manage courses`.
- vNext now: `college-term-mapping-manager.tsx:173`: `Select a program and semester to view mapped courses.`
- Fix: Use exact legacy empty text.

## G2-16-007-054  [P3] GAP  facet F13  effort S
- Legacy: `SemesterCourseMapping.js:402`: empty table `No courses mapped to this semester. Select courses to add.`
- vNext now: `college-term-mapping-manager.tsx:174-179`: `No courses mapped to this semester.`
- Fix: Restore instruction sentence.

## G2-16-007-056  [P3] GAP  facet F15  effort S
- Legacy: `SemesterCourseMapping.js:190-277`: CRUD success/failure shown in Ant toasts only; no emails in frontend.
- vNext now: `college-term-mapping-manager.tsx:36-120`: notice and errors inline; backend records activity events.
- Fix: Use legacy toast lifecycle; retain activity audit, no email requirement evidenced.

## G2-16-007-064  [P3] GAP  facet F18  effort S
- Legacy: `SemesterCourseMapping.js:349-356`: `Select program`, `Select semester`.
- vNext now: `college-term-mapping-manager.tsx:137,147`: `Choose program`, `Choose semester`.
- Fix: Use exact placeholders.

## G2-16-007-065  [P3] GAP  facet F18  effort S
- Legacy: `SemesterCourseMapping.js:363-369`: `Select courses to add`, helper on draft retention.
- vNext now: `college-term-mapping-manager.tsx:154-164`: size8 list without placeholder, helper emphasizes exclusion.
- Fix: Restore compact placeholder and draft retention text.

## G2-16-007-066  [P3] GAP  facet F18  effort S
- Legacy: `SemesterCourseMapping.js:380-382`: card title `Select a Semester to View Courses` initially.
- vNext now: `college-term-mapping-manager.tsx:173`: just empty body text.
- Fix: Restore card heading.

## G2-16-007-067  [P3] GAP  facet F18  effort S
- Legacy: `SemesterCourseMapping.js:410-414`: modal `Edit Course Mapping: ...`, `Save Changes`.
- vNext now: `college-term-mapping-manager.tsx:204-229`: inline `Edit`/`Save`.
- Fix: Restore exact edit labels/modal.

## G2-16-007-070  [P3] GAP  facet F19  effort S
- Legacy: `SemesterCourseMapping.js:394-396`: skeleton 6 rows and 6 cols.
- vNext now: `college-term-mapping-manager.tsx:173-179`: instantaneous table after server fetch, no table skeleton.
- Fix: Use 6x6 shape fallback in loading boundary.

## G2-17-002-011  [P3] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:312-320 EditOutlined and DeleteOutlined action buttons labeled Edit and Remove.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:230-252 text buttons Edit, ↑, ↓, Remove without old icons.
- Fix: Match legacy Edit/Remove icons; retain new ↑/↓ as enhancements if approved.

## G2-17-002-012  [P3] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:372-375 Add Courses to Semester has PlusOutlined icon.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:166-169 same label via src/modules/academics/college-term-mapping-model.ts:45, no plus icon.
- Fix: Add Plus icon inside primary Add button.

## G2-17-002-024  [P3] GAP  facet F06  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:363-364 helper 'Selecting a different program or semester keeps your unsaved choices as a draft for this semester.'.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:161-163 says 'Choose multiple courses; already-mapped courses are excluded. Selection is retained per semester.'.
- Fix: Use legacy helper text for clone parity.

## G2-17-002-075  [P3] GAP  facet F18  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:402 no mapped courses copy 'No courses mapped to this semester. Select courses to add.'.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:174 says only 'No courses mapped to this semester.'.
- Fix: Restore complete call to action in empty text.

## G2-5-025-010  [P3] GAP  facet F03  effort S
- Legacy: Legacy `Course added to semester`, `{N} courses added to semester` mutation message. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:363-367,409-415`
- vNext now: vNext `Added N course(s) to this semester.` copy. `src/modules/academics/college-term-mapping-model.ts:43-54`, `src/components/academics/college-term-mapping-manager.tsx:49-56`
- Fix: Match legacy endpoint and toast phrasing where visible.
