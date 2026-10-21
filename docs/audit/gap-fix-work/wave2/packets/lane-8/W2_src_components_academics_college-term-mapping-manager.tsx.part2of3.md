# Work packet (wave 2): edit src/components/academics/college-term-mapping-manager.tsx (part 2 of 3)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u007-college-semester-courses.md, docs/audit/gap2/lane-17/superadmin-semester-course-mapping.md

## G2-16-007-039  [P2] MISSING  facet F09  effort M
- Legacy: `SemesterCourseMapping.js:173-175,185-187`: confirm switch programs and switch semesters with unsaved draft choices.
- vNext now: `college-term-mapping-manager.tsx:132-145`: notices but no confirmation.
- Fix: Restore both change-scope confirmations and preserved draft after confirm.

## G2-16-007-040  [P2] GAP  facet F10  effort L
- Legacy: `SemesterService.js:14-18,25-45,69-70`: API GET programs/semesters/mapping/staffing; PUT update/reorder; POST bulk add; DELETE unmap.
- vNext now: `college-term-mapping-manager.tsx:42-48,103-107`; `college-term-mapping-service.ts:60-135,137-331`: Next route CRUD and DB reads, comparable semantics.
- Fix: Audit response shapes/selected semester failure independently; keep transaction semantics.

## G2-16-007-041  [P2] GAP  facet F10  effort M
- Legacy: `SemesterService.js:69-70`: reorder sends entire mappingIds array in one PUT to `/courses/reorder`.
- vNext now: `college-term-mapping-manager.tsx:90-107`: single mapping PATCH with position to reorder.
- Fix: Ensure equivalent atomic all-row reorder & keyboard controls; can use single PATCH if validated.

## G2-16-007-050  [P2] GAP  facet F13  effort S
- Legacy: `SemesterCourseMapping.js:342-346`: no programs info Alert with link Go to Programs.
- vNext now: `college-term-mapping-manager.tsx:128-151`: empty native program dropdown with no explanation or link.
- Fix: Restore `No programs found` info and link to Programs.

## G2-16-007-052  [P2] GAP  facet F13  effort M
- Legacy: `SemesterCourseMapping.js:394-403`: table loading skeleton 6x6, stale-refresh banner and `Mapping unavailable` empty.
- vNext now: `college-term-mapping-manager.tsx:173-179`: no loading skeleton/explicit mapping-fetch recovery; server-rendered initial content.
- Fix: Provide matching 6x6 placeholder and retryable failure states.

## G2-16-007-058  [P2] GAP  facet F16  effort M
- Legacy: `SemesterCourseMapping.js:333-335,379`: lg 10/14 columns at 992px, xs full width.
- vNext now: `college-term-mapping-manager.tsx:131,173-175`: single column at all widths.
- Fix: Restore breakpoint and card balance at 992px; keep mobile stacked.

## G2-16-007-059  [P2] GAP  facet F16  effort M
- Legacy: `SemesterCourseMapping.js:365-366`: responsive tags and scrollable Ant Table max-content.
- vNext now: `college-term-mapping-manager.tsx:154-160,175`: native 8-row multi and DataTable mobile priority.
- Fix: Match compact chips, horizontal scroll and widths at 1280/768/375.

## G2-16-007-060  [P2] GAP  facet F17  effort M
- Legacy: `SemesterCourseMapping.js:404-406`: sortable table supplies keyboard reorder and visual drag handle.
- vNext now: `college-term-mapping-manager.tsx:182-194,238-247`: draggable course name plus arrow up/down buttons with aria labels.
- Fix: Restore dedicated drag grip and keyboard reorder affordance; retain visible arrow controls if approved.

## G2-16-007-061  [P2] GAP  facet F17  effort M
- Legacy: `SemesterCourseMapping.js:349-359,365-370`: searchable Ant Select supports keyboard filtering.
- vNext now: `college-term-mapping-manager.tsx:132-160`: native selects, course multi selector requires scanning.
- Fix: Implement searchable Combobox with option announcements and keyboard interaction.

## G2-16-007-062  [P2] GAP  facet F17  effort M
- Legacy: `SemesterCourseMapping.js:410-426`: modal maskClosability false, busy keyboard disabled.
- vNext now: `college-term-mapping-manager.tsx:205-229`: inline edit, no modal or focus trap.
- Fix: Restore focus handling, Escape cancel/unsaved confirm.

## G2-16-007-069  [P2] GAP  facet F19  effort M
- Legacy: `SemesterCourseMapping.js:107-112`: same-semester refresh keeps old rows, different semester clears stale rows.
- vNext now: `college-term-mapping-manager.tsx:23-34`: server data snapshot, no stale refresh logic.
- Fix: On Refresh preserve only same-term stale rows until request resolves.

## G2-16-007-072  [P2] GAP  facet F20  effort M
- Legacy: `SemesterCourseMapping.js:260-276`: reorder rollback guarded by selectedSemesterRef.
- vNext now: `college-term-mapping-manager.tsx:186-194,90-120`: no optimistic reorder; patch initiated for captured ID; success refresh.
- Fix: Retain semester-guarded update/rollback and no-op while scope switched.

## G2-16-007-074  [P2] GAP  facet F21  effort M
- Legacy: `SemesterService.js:14-45,69-70`: old Spring `/api/v1/semester/...` routes.
- vNext now: `college-term-mapping-manager.tsx:42-48,103-107`: Next `/api/academics/semester-course-mappings` routes.
- Fix: Verify all flows mapped; legacy saved/bookmarked API URLs need migration decision.

## G2-16-007-080  [P2] GAP  facet F23  effort L
- Legacy: `SemesterCourseMapping.js:333-427`: 2-card layout, searchable multiselect, editing modal, refresh/stale states.
- vNext now: `college-term-mapping-manager.tsx:128-271`: vertical list, native size8, inline editing, generic loading.
- Fix: Implement detailed UX deltas in F02/F03/F09/F13 as legacy clone.

## G2-17-002-004  [P2] GAP  facet F01  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:342-344 gives no-program action Go to Programs via role-relative path.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:132-150 only empty Program select; src/app/(authenticated)/college/semester-courses/page.tsx:13-17 adds Course offerings header link.
- Fix: Restore contextual Go to Programs action when no programs; preserve useful offerings as separate optional link.

## G2-17-002-005  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:333-409 Row gutter24, left xs24/lg10 card Assign Courses, right xs24/lg14 card Courses in semester.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:128-175 single vertical section, Program/Semester select grid and separate disclosure/table.
- Fix: Match two-column card layout and 10/14 proportional widths on lg, stacked on small screens.

## G2-17-002-006  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:335 says Assign Courses to Semester and :380-384 says Courses in [semester], with Refresh in right card header.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:129-130 generic 'Program semester curriculum mappings' heading and :173-175 has no dynamic card heading or Refresh.
- Fix: Restore exact dynamic headings and Refresh in right card header.

## G2-17-002-007  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:410-426 edit mapping overlays modal and form.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:204-230 edit inputs appear inside the row Actions cell.
- Fix: Place edit controls in legacy-style Modal with Save Changes and Cancel.

## G2-17-002-008  [P2] MISSING  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:383-384 displays disabled Refresh button until semester chosen.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:173-255 lacks manual refresh entirely.
- Fix: Add labeled Refresh disabled with no selected term and busy when fetching.

## G2-17-002-009  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:289-303 staffing warning red/orange Tag with WarningOutlined icon and Tooltip listing classes.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:195-199 plain text warning with title attribute, no chip or warning icon.
- Fix: Render colored warning chip with icon and accessible class list tooltip.

## G2-17-002-010  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:404-405 always shows drag-handle and keyboard instructions under nonempty mapping table.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:175-255 has native draggable text and up/down buttons, no instructions.
- Fix: Show exact keyboard reorder instructions and provide actual keyboard drag handle.

## G2-17-002-013  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:307 Credits column displays credits??3; :311 Order displays stored course_order or em dash.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:200-203 displays null credits as em dash and computed ordinal Order.
- Fix: Match 3-credit null fallback and stored order presentation, with explicit invalid-order handling.

## G2-17-002-015  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:358-360 semester option is name or 'Semester N' fallback.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:148 always formats '[name] (N)'.
- Fix: Use legacy option label and fallback behavior.

## G2-17-002-017  [P2] GAP  facet F05  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:286-322 table columns drag handle, Course Name, Course Code, Credits, Order, Actions; Core/Elective deliberately omitted at :308-309.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:175-255 has same core data columns, but no separate handle column.
- Fix: Add separate drag handle column and retain no misleading Type in editor.

## G2-17-002-021  [P2] GAP  facet F06  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:349-353 Program Ant Select searchable, required 'Select a program', placeholder 'Select program'.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:132-140 native select, placeholder 'Choose program', browser required validity.
- Fix: Use searchable control, exact placeholder and field error.

## G2-17-002-022  [P2] GAP  facet F06  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:355-361 Semester selector disabled before Program, required error 'Select a semester', placeholder 'Select semester'.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:142-149 placeholder 'Choose semester', not explicitly disabled before choosing program.
- Fix: Disable term picker until program chosen and align label/placeholder/error.

## G2-17-002-023  [P2] GAP  facet F06  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:363-370 Courses to Add Ant Select mode=multiple showSearch maxTagCount=responsive with placeholder 'Select courses to add'.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:154-163 native multiple Select size=8, no search, no token chips, no placeholder.
- Fix: Restore searchable multiselect and responsive tokens.

## G2-17-002-028  [P2] GAP  facet F06  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:422-423 input 'Display Order', min1; no fixed max in browser.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:217-221 label 'Order', min1 max orderedPeers count.
- Fix: Align visible label and explain bounded reordering contract.

## G2-17-002-048  [P2] GAP  facet F10  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:221-231 edit PUT mapping ID {credits,is_mandatory,course_order}.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:90-112 PATCH src/app/api/academics/semester-course-mappings/[mappingId]/route.ts:25-34 credits,position and src/modules/academics/college-term-mapping-service.ts:176-235 atomically resequences peers.
- Fix: Document removed mandatory field and changed global ordering side effects.

## G2-17-002-060  [P2] GAP  facet F13  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:342-344 no-program state links to Programs, :397-403 distinguishes no selection, no mapping and mapping unavailable.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:173-175 only two text empties, no no-programs action or unavailable state.
- Fix: Restore all distinct empty/error states with legacy exact copy and links.

## G2-17-002-067  [P2] GAP  facet F16  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:333-409 xs24/lg10 and xs24/lg14 cards stack below lg and align side-by-side above.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:128-175 always stacks form/table; only program/term selectors are 2 columns at sm :131.
- Fix: Match old 10/14 large-screen grid and single-column small breakpoints.

## G2-17-002-068  [P2] GAP  facet F16  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:365-366 responsive maxTagCount and :401 horizontally scrollable AntD table.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:154-158 native size8 multi list plus :175-255 DataTable with mobilePriority collapsing.
- Fix: Match responsive tag picker and prevent missing columns/actions in narrow viewport, verify 320px.

## G2-17-002-069  [P2] GAP  facet F17  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:404-405 keyboard reorder instructions and :14 sortable handle hook.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:181-194 native drag on course label, :238-247 separate move up/down buttons.
- Fix: Use focusable drag handle with expected keyboard movement and live position announcements.

## G2-17-002-070  [P2] GAP  facet F17  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:313-319 aria-label 'Edit mapping for Course' and 'Remove Course from semester'.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:231-251 plain generic Edit and Remove labels; up/down buttons carry course names.
- Fix: Add row-specific accessible names to Edit and Remove actions.

## G2-17-002-071  [P2] GAP  facet F17  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:410-414 Modal traps focus and disables close while editLoading.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:204-230 inline edit, src/components/ui/confirm-dialog.tsx:13-18 uses alertdialog only for ADD/REMOVE.
- Fix: If restoring edit modal, implement proper focus return/escape/disabled states.

## G2-17-002-073  [P2] GAP  facet F18  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:335 'Assign Courses to Semester', :380-384 'Courses in X' and 'Select a Semester to View Courses'.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:129-130 'Program semester curriculum mappings', :152 'Add courses'.
- Fix: Restore exact card headings and selected-semester interpolation.

## G2-17-002-074  [P2] GAP  facet F18  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:350 'Select program', :356 'Select semester', :365 'Select courses to add'.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:137 'Choose program', :147 'Choose semester', multi select with no placeholder :154-159.
- Fix: Match three verbatim placeholders.

## G2-17-002-076  [P2] GAP  facet F18  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:385-386 status labels 'Refreshing semester courses…' and 'Saving course order…'.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:256-257 shows only post-action notice/error with no reorder-saving copy.
- Fix: Render exact progress messages and persist until write succeeds/fails.

## G2-17-002-078  [P2] GAP  facet F19  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:100-126 same-semester refresh retains previously loaded rows, request sequence guard.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:23-34 all data are immutable server props, :58 router.refresh after write; no stale-while-revalidate.
- Fix: Preserve last good table and fetch granularly for Refresh.

## G2-17-002-080  [P2] GAP  facet F20  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:263-276 optimistic reorder applies new list immediately; same-semester rollback on rejection.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:186-192 uses PATCH and router.refresh later, no optimistic row reorder/rollback notice.
- Fix: Restore scoped optimistic drag behavior or explicit saving indicator.
