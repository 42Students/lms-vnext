# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-6/superadmin-sections-lecture-halls.md

21 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/superadmin-sections-lecture-halls.md

## G2-6-030-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy component LectureHalls displayed inside Super Admin Academic Setup section and supports optional scoped collegeId (LectureHalls.js:38-40,300-303).
- vNext now: vNext dedicated /admin/lecture-halls route requires exact selected college (admin/lecture-halls/page.tsx:20-34).
- Fix: Match tab/route placement and selected college behavior; no cross-college leak.

## G2-6-030-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy lists 6 fields + actions in small AntD Table directly inside Existing Lecture Halls card (LectureHalls.js:230-298,386-425).
- vNext now: vNext DataTable under filters outside secondary Card, with status/upcoming/availability (lecture-hall-manager.tsx:200-248).
- Fix: Match Card title/table geometry, row density, header order and responsive scroll.

## G2-6-030-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy edit form is a separate 500px Modal with footer buttons (LectureHalls.js:427-515).
- vNext now: vNext same Dialog handles create/edit with footer and 2-col fields (lecture-hall-manager.tsx:250-310).
- Fix: Restore legacy edit-only 500px modal padding/field order/footer.

## G2-6-030-007  [P2] GAP  facet F03  effort M
- Legacy: Legacy table Actions EditOutlined and DeleteOutlined link danger buttons with titles/aria-label (LectureHalls.js:262-295).
- vNext now: vNext Availability link plus Actions dropdown Edit, Archive/Restore (lecture-hall-manager.tsx:221-241).
- Fix: Restore icon actions for Edit/Delete; make any Archive additional and clearly documented.

## G2-6-030-008  [P2] GAP  facet F03  effort M
- Legacy: Legacy table shows Name, Room Type, Capacity, College when unscoped, Department, Description, Actions (LectureHalls.js:230-298,413-416).
- vNext now: vNext shows Name, type, Capacity, Department, Upcoming classes, Status, actions, no College column (lecture-hall-manager.tsx:201-243).
- Fix: Reconcile full unscoped columns and original order; keep added status/availability supplementary.

## G2-6-030-009  [P2] GAP  facet F03  effort M
- Legacy: Legacy table toolbar AdminTableToolbar Search halls, Refresh and Export CSV (LectureHalls.js:390-408).
- vNext now: vNext main filter form Search halls + Search button, independent Refresh and Export CSV links (admin/lecture-halls/page.tsx:71-84,124-133).
- Fix: Place legacy controls inside Existing Lecture Halls / Rooms Card title and match icons/sizing.

## G2-6-030-010  [P2] GAP  facet F03  effort M
- Legacy: Legacy required field asterisks and validation by AntD Form.Item (LectureHalls.js:311-381).
- vNext now: vNext plain labels Input/Select and single Banner formError (lecture-hall-manager.tsx:267-308).
- Fix: Restore inline required marks and per-field validation placements.

## G2-6-030-011  [P2] GAP  facet F04  effort M
- Legacy: Legacy table College resolves name via loaded colleges or raw ID; hides College when collegeId prop exists (LectureHalls.js:242-250,413-416).
- vNext now: vNext route always requires selected college and renders header description collegeName (admin/lecture-halls/page.tsx:26-34,68-70).
- Fix: Support intentional all-college mode or document removal of College column.

## G2-6-030-013  [P2] GAP  facet F04  effort M
- Legacy: Legacy description separate ellipsis table column, max backend length255 (LectureHalls.js:261; LectureHallDTO.java:21-22).
- vNext now: vNext description rendered second line inside Name cell and absent if empty (lecture-hall-manager.tsx:201-203).
- Fix: Put Description back into its own truncated column with tooltip.

## G2-6-030-017  [P2] GAP  facet F05  effort S
- Legacy: Legacy search client-side matches name OR roomType case-insensitive (LectureHalls.js:47-54).
- vNext now: vNext SQL search only hall name (lecture-hall-service.ts:175-182), separate Room Type filter (admin/lecture-halls/page.tsx:95-102).
- Fix: Include room type text/label in search or maintain equivalent quick search.

## G2-6-030-023  [P2] GAP  facet F06  effort S
- Legacy: Legacy Department optional, allowClear, placeholder Select department (LectureHalls.js:328-336).
- vNext now: vNext native Select placeholder Shared by all departments and empty means null (lecture-hall-manager.tsx:294-302).
- Fix: Use original label/placeholder and clear affordance while keeping FK validation.

## G2-6-030-024  [P2] GAP  facet F06  effort S
- Legacy: Legacy Room Name required, whitespace not allowed, max255 exact errors, placeholder e.g., Room 101, Lab A (LectureHalls.js:338-347).
- vNext now: vNext maxLength255, generic Enter a name on submit (lecture-hall-manager.tsx:107-113,273-277).
- Fix: Restore exact Please enter room name and Room name must be 255 characters or less per-field.

## G2-6-030-025  [P2] GAP  facet F06  effort S
- Legacy: Legacy Room Type required Select with placeholder Select type, no initial selection (LectureHalls.js:349-364).
- vNext now: vNext create draft defaults LECTURE_HALL, making selection optional (lecture-hall-manager.tsx:40-46,284-292).
- Fix: Remove default room type and require explicit choice.

## G2-6-030-026  [P2] GAP  facet F06  effort S
- Legacy: Legacy Capacity initialValue50, input min1 max1000 in form (LectureHalls.js:365-368).
- vNext now: vNext draft default50 but max5000 (lecture-hall-manager.tsx:40-45,109-113,278-282).
- Fix: Align visible form max1000 and specific helper, keep backend rule5000 separately documented.

## G2-6-030-036  [P2] GAP  facet F09  effort M
- Legacy: Legacy Delete Popconfirm Delete this room?, description about scheduled sessions, actions Delete/Cancel (LectureHalls.js:277-294).
- vNext now: vNext ConfirmDialog Archive lecture hall with description about upcoming classes, confirm Archive hall (lecture-hall-manager.tsx:312-320).
- Fix: Document/delete-to-archive change; clone confirmation geometry and explicit cancellation.

## G2-6-030-037  [P2] GAP  facet F09  effort S
- Legacy: Legacy Edit Lecture Hall modal width500, maskClosable !editLoading, keyboard !editLoading (LectureHalls.js:427-435).
- vNext now: vNext Dialog title Edit lecture hall, dismissible !pending; width not visible at callsite (lecture-hall-manager.tsx:250-256).
- Fix: Clone 500px modal geometry and exact title case, focus retention.

## G2-6-030-039  [P2] GAP  facet F10  effort M
- Legacy: Legacy API POST /api/v1/lectureHall/create, PUT /update/{id}, DELETE /delete/{id} with snake_case body (LectureHallController.java:56-78,131-160,162-194; LectureHalls.js:132-140).
- vNext now: vNext POST /api/lecture-halls, PATCH /api/lecture-halls/{uuid}, archive via status PATCH with camelCase JSON (lecture-hall-manager.tsx:118-132,152-161).
- Fix: Produce endpoint/payload compatibility map and update old clients if any.

## G2-6-030-052  [P2] GAP  facet F13  effort M
- Legacy: Legacy table loading spinner and create form remains interactive (LectureHalls.js:300-383,411-420).
- vNext now: vNext server-first page data loads before manager action; cannot create until fetch completes (admin/lecture-halls/page.tsx:44-68,138-145).
- Fix: Keep create affordance available while list reloads.

## G2-6-030-058  [P2] GAP  facet F17  effort M
- Legacy: Legacy AntD Form.Item required live errors, Popconfirm focus behavior (LectureHalls.js:311-381,427-515).
- vNext now: vNext plain form controlled draft, Banner error, Dialog/ConfirmDialog (lecture-hall-manager.tsx:267-320).
- Fix: Add aria-describedby/field errors and focus restoration on dialog close.

## G2-6-030-060  [P2] GAP  facet F18  effort S
- Legacy: Legacy create/edit labels/placeholder from Form in exact order College, Department (Optional), Room Name, Room Type, Capacity, Description (LectureHalls.js:311-380,437-513).
- vNext now: vNext order Room Name, Capacity, Room Type, Department, Description (lecture-hall-manager.tsx:273-307).
- Fix: Reorder fields exactly and restore Room Type placeholder Select type.

## G2-6-030-061  [P2] GAP  facet F18  effort S
- Legacy: Legacy Delete text/message; vNext archive/restore lifecycle changed (LectureHalls.js:277-293; lecture-hall-manager.tsx:231-240).
- vNext now: vNext Archived/Active statuses, Archive hall modal and Hall restored feedback (lecture-hall-manager.tsx:152-183,312-320).
- Fix: Document intentional status wording deviation and avoid relabelling archive as delete.
