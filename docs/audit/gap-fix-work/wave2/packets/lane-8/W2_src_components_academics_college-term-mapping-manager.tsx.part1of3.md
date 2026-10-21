# Work packet (wave 2): edit src/components/academics/college-term-mapping-manager.tsx (part 1 of 3)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/semester-courses.md, docs/audit/gap2/lane-16/u007-college-semester-courses.md

## G2-12-002-006  [P2] GAP  facet F02  effort S
- Legacy: Left card title `Assign Courses to Semester` `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:333-335`
- vNext now: Section title `Program semester curriculum mappings` `src/components/academics/college-term-mapping-manager.tsx:128-130`
- Fix: Restore section title

## G2-12-002-007  [P2] MISSING  facet F02  effort S
- Legacy: Right card title changes with selected semester `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:379-383`
- vNext now: No per-semester dynamic card heading `src/components/academics/college-term-mapping-manager.tsx:173-179`
- Fix: Restore right card title

## G2-12-002-009  [P2] MISSING  facet F03  effort S
- Legacy: No programs found alert links Go to Programs `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:342-344`
- vNext now: No such alert/link in manager `src/components/academics/college-term-mapping-manager.tsx:131-151`
- Fix: Add specific no-programs alert and link

## G2-12-002-010  [P2] GAP  facet F03  effort S
- Legacy: Color-coded staffing Tag with WarningOutlined and Tooltip `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:288-303`
- vNext now: Plain warning text/title attr `src/components/academics/college-term-mapping-manager.tsx:195-199`
- Fix: Restore icon+orange/red badge and tooltip

## G2-12-002-012  [P2] GAP  facet F04  effort S
- Legacy: Course name fallback includes course ID `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:279-282`
- vNext now: Uses row.courseName raw `src/components/academics/college-term-mapping-manager.tsx:195-200`
- Fix: Provide missing-name fallback

## G2-12-002-013  [P2] GAP  facet F04  effort S
- Legacy: Course code fallback lookup then em dash `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:305-306`
- vNext now: Uses row.courseCode directly `src/components/academics/college-term-mapping-manager.tsx:199-201`
- Fix: Display em dash on missing code

## G2-12-002-014  [P2] GAP  facet F04  effort S
- Legacy: Null credits render 3 `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:306-307`
- vNext now: Null credits render em dash `src/components/academics/college-term-mapping-manager.tsx:201`
- Fix: Use 3 on absent legacy credits

## G2-12-002-015  [P2] GAP  facet F04  effort S
- Legacy: Order from `course_order`, null placeholder em dash `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:310-311`
- vNext now: Derived ordinal index from sorted peers `src/components/academics/college-term-mapping-manager.tsx:201-203`
- Fix: Preserve persisted displayOrder/null behavior

## G2-12-002-017  [P2] GAP  facet F05  effort S
- Legacy: Table column drag handle, Course Name, Course Code, Credits, Order, Actions `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:285-322`
- vNext now: Course Name draggable, no handle column `src/components/academics/college-term-mapping-manager.tsx:175-205`
- Fix: Add explicit sortable handle

## G2-12-002-021  [P2] GAP  facet F06  effort S
- Legacy: Searchable Program select placeholder `Select program` `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:349-354`
- vNext now: Native Select placeholder `Choose program` `src/components/academics/college-term-mapping-manager.tsx:131-140`
- Fix: Use searchable control and exact placeholder

## G2-12-002-022  [P2] GAP  facet F06  effort S
- Legacy: Semester Select placeholder `Select semester` `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:355-361`
- vNext now: Native Select placeholder `Choose semester`; only active terms `src/components/academics/college-term-mapping-manager.tsx:141-150`
- Fix: Restore placeholder and historical selection

## G2-12-002-023  [P2] GAP  facet F06  effort S
- Legacy: Multi-select searchable tag picker with responsive maxTagCount `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:363-370`
- vNext now: Native `<select multiple size=8>`, no tags/search `src/components/academics/college-term-mapping-manager.tsx:152-163`
- Fix: Restore searchable tag selector

## G2-12-002-025  [P2] GAP  facet F06  effort S
- Legacy: Warn before program/semester switch with unsaved selections `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:168-188`
- vNext now: Switch directly with inline notice, drafts retained `src/components/academics/college-term-mapping-manager.tsx:132-148`
- Fix: Restore dirty-change confirm dialogs

## G2-12-002-026  [P2] GAP  facet F06  effort S
- Legacy: Edit modal Credits min1 max10 and Display Order min1; hidden isMandatory `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:410-425`
- vNext now: Inline edit Credits min1 max10 and Order min1..peers; no isMandatory `src/components/academics/college-term-mapping-manager.tsx:205-229`
- Fix: Restore modal fields and persistence of mandatory flag

## G2-12-002-035  [P2] MISSING  facet F09  effort S
- Legacy: Two unsaved switch confirmation modals `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:169-188`
- vNext now: None; notice only `src/components/academics/college-term-mapping-manager.tsx:132-148`
- Fix: Add both confirm dialogs

## G2-12-002-036  [P2] GAP  facet F09  effort S
- Legacy: Edit modal Save Changes/Cancel, maskClosable=false `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:410-425`
- vNext now: Inline edit Save/Cancel `src/components/academics/college-term-mapping-manager.tsx:205-229`
- Fix: Restore modal and exact footer actions

## G2-12-002-043  [P2] GAP  facet F10  effort S
- Legacy: PUT full reorder `{mappingIds}` `docs/legacy-source/frontend/src/api/Services/SemesterService.js:69-70`
- vNext now: PATCH a mapping with new position `src/components/academics/college-term-mapping-manager.tsx:90-112`
- Fix: Keep transactional whole-list order guarantees

## G2-12-002-052  [P2] GAP  facet F12  effort S
- Legacy: Remove mapping and safeguard scope; course_order can be manually edited `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:110-147`
- vNext now: Position operation renumbers peers under lock `src/components/academics/college-term-mapping-manager.tsx:90-112`
- Fix: Document reordered cascade, stale edits and delete blockers

## G2-12-002-056  [P2] GAP  facet F13  effort S
- Legacy: Empty hint includes `Select courses to add.` `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:394-403`
- vNext now: Empty `No courses mapped to this semester.` `src/components/academics/college-term-mapping-manager.tsx:173-179`
- Fix: Restore exact hint

## G2-12-002-059  [P2] GAP  facet F16  effort S
- Legacy: AntD responsive xs24/lg10+14 cards; table x-scroll `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:333-335,379-403`
- vNext now: Single-column editor, mobile-first DataTable `src/components/academics/college-term-mapping-manager.tsx:128-180`
- Fix: Restore split layout and scroll behavior

## G2-12-002-060  [P2] GAP  facet F16  effort S
- Legacy: Select with responsive maxTagCount `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:363-370`
- vNext now: Native multi row selector min-h40 `src/components/academics/college-term-mapping-manager.tsx:152-163`
- Fix: Restore mobile searchable tags

## G2-12-002-061  [P2] GAP  facet F17  effort S
- Legacy: Accessible keyboard sortable table handle+caption `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:14-15,404-406`
- vNext now: Pointer dragging course name; arrow buttons available `src/components/academics/college-term-mapping-manager.tsx:181-194,238-247`
- Fix: Restore clear focusable drag handle/keyboard control

## G2-12-002-062  [P2] GAP  facet F17  effort S
- Legacy: Row Edit/Remove aria labels include course name `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:312-320`
- vNext now: Edit/Remove textual only, arrows row-specific aria `src/components/academics/college-term-mapping-manager.tsx:231-251`
- Fix: Add dynamic row accessible names

## G2-12-002-065  [P2] GAP  facet F18  effort S
- Legacy: Select program/semester/courses placeholders `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:349-370`
- vNext now: Choose program/semester and none for courses `src/components/academics/college-term-mapping-manager.tsx:131-160`
- Fix: Restore each exact placeholder

## G2-12-002-066  [P2] GAP  facet F18  effort S
- Legacy: Modal action `Save Changes` `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:410-414`
- vNext now: Inline `Save` `src/components/academics/college-term-mapping-manager.tsx:223-227`
- Fix: Restore exact button label

## G2-12-002-070  [P2] GAP  facet F20  effort S
- Legacy: Optimistic reorder rollbacks only within same semester on failure `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:260-277`
- vNext now: Waits for PATCH then router.refresh `src/components/academics/college-term-mapping-manager.tsx:90-112`
- Fix: Add progress/rollback feedback if optimistic UI

## G2-12-002-078  [P2] GAP  facet F23  effort S
- Legacy: Legacy modal/edit direct `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:410-425`
- vNext now: VNext inline edit and shared confirmation `src/components/academics/college-term-mapping-manager.tsx:205-269`
- Fix: Document intended usability deviation

## G2-16-007-005  [P2] GAP  facet F02  effort M
- Legacy: `SemesterCourseMapping.js:333-335,379-383`: 24-gutter row: left xs24/lg10 Assign card, right xs24/lg14 courses card.
- vNext now: `college-term-mapping-manager.tsx:128-151,173-255`: single vertical section with Program/Semester then Add courses disclosure then full-width DataTable.
- Fix: Restore 10/14 desktop two-card layout with independent headings, mobile stacked.

## G2-16-007-007  [P2] MISSING  facet F02  effort M
- Legacy: `SemesterCourseMapping.js:380-384`: right card title depends on selected semester; Refresh button at upper right.
- vNext now: `college-term-mapping-manager.tsx:173-175`: no titled right card and no per-term Refresh.
- Fix: Add dynamic `Courses in ...`/`Select a Semester to View Courses` heading and Refresh button.

## G2-16-007-008  [P2] GAP  facet F03  effort M
- Legacy: `SemesterCourseMapping.js:349-368`: Program and Semester Ant searchable Select, courses multi mode with responsive tags.
- vNext now: `college-term-mapping-manager.tsx:131-160`: native select, courses size8 native multi-list.
- Fix: Recreate searchable selects and compact multitag control with responsive max tags.

## G2-16-007-011  [P2] MISSING  facet F03  effort S
- Legacy: `SemesterCourseMapping.js:383-384`: explicit Refresh button disabled until semester selected.
- vNext now: `college-term-mapping-manager.tsx:173-255`: no per-term refresh control (only full router.refresh after mutation).
- Fix: Add right-panel Refresh and skeleton/warning feedback.

## G2-16-007-012  [P2] GAP  facet F04  effort M
- Legacy: `SemesterCourseMapping.js:286-322`: columns drag handle, Course Name, Course Code, Credits, Order, Actions.
- vNext now: `college-term-mapping-manager.tsx:180-254`: Course Name, Course Code, Credits, Order, Actions; no drag handle column.
- Fix: Restore drag handle as first table column with keyboard reorder.

## G2-16-007-014  [P2] GAP  facet F04  effort S
- Legacy: `SemesterCourseMapping.js:307`: null credits displays fallback 3.
- vNext now: `college-term-mapping-manager.tsx:201`: null credits displays `—`.
- Fix: Display 3 for null credits (retain explicit null underlying value until edit).

## G2-16-007-015  [P2] GAP  facet F04  effort S
- Legacy: `SemesterCourseMapping.js:310-311`: order displays persisted course_order, else em dash.
- vNext now: `college-term-mapping-manager.tsx:202-203`: recomputes order from sorted current peers, 1-indexed.
- Fix: Use explicit stored displayOrder to avoid misleading noncontiguous positions.

## G2-16-007-016  [P2] GAP  facet F04  effort M
- Legacy: `SemesterCourseMapping.js:288-304`: staffing red/orange Tag with icon and tooltip action guidance.
- vNext now: `college-term-mapping-manager.tsx:195-199`: warning plain text with browser title.
- Fix: Restore warning colour semantics, icon and rich tooltip including Faculty Assignment guidance.

## G2-16-007-021  [P2] GAP  facet F05  effort M
- Legacy: `SemesterCourseMapping.js:365-370`: multiselect searchable by course label and code.
- vNext now: `college-term-mapping-manager.tsx:154-160`: native multi-select without search.
- Fix: Add search by course name/code, keep no-duplicates filter.

## G2-16-007-023  [P2] GAP  facet F06  effort M
- Legacy: `SemesterCourseMapping.js:168-188`: switching Program/Semester with selected draft asks Modal confirmation before preserving draft.
- vNext now: `college-term-mapping-manager.tsx:132-146`: switches immediately and displays notice `Unsaved ... retained`.
- Fix: Restore confirmation dialog before context switch and preserve per-semester selection.

## G2-16-007-026  [P2] GAP  facet F06  effort M
- Legacy: `SemesterCourseMapping.js:263-276`: dragging reorders optimistically, restoring previous positions on backend failure.
- vNext now: `college-term-mapping-manager.tsx:182-194,90-120`: drop triggers PATCH and router refresh, no optimistic reorder display nor rollback.
- Fix: Reproduce optimistic drag state and rollback when scoped term still active.

## G2-16-007-036  [P2] GAP  facet F09  effort M
- Legacy: `SemesterCourseMapping.js:410-426`: edit opens Ant Modal named `Edit Course Mapping: <course>` with Save Changes and Cancel.
- vNext now: `college-term-mapping-manager.tsx:204-230`: inline table row form Save/Cancel; no edit modal.
- Fix: Restore edit modal, dedicated focus/keyboard and exact button copy.

## G2-16-007-038  [P2] GAP  facet F09  effort M
- Legacy: `SemesterCourseMapping.js:315-320`: remove uses inline Popconfirm title and Remove/Cancel.
- vNext now: `college-term-mapping-manager.tsx:258-268`: central ConfirmDialog with lengthy description.
- Fix: Use compact anchored Popconfirm and exact remove title/buttons.
