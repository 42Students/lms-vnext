# Work packet (wave 2): edit src/components/admin/lecture-hall-manager.tsx (part 1 of 3)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-lecture-halls.md, docs/audit/gap2/lane-19/lecture-hall-entity.md, docs/audit/gap2/lane-4/lecture-hall-controller.md

## G2-10-018-007  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:427-436 — Only Edit uses modal width500; Create form always visible.
- vNext now: src/components/admin/lecture-hall-manager.tsx:250-267 — Both Create and Edit use Dialog of same style.
- Fix: Keep Create inline and Edit modal.

## G2-10-018-008  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:349-371 — Capacity and Room Type side-by-side 12/12 columns within create card.
- vNext now: src/components/admin/lecture-hall-manager.tsx:278-293 — Modal responsive grid md2; reversed capacity/type order.
- Fix: Match field order and 12px gutter.

## G2-10-018-009  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:305-306 — Card title exact 'Create New Lecture Hall / Room'.
- vNext now: src/components/admin/lecture-hall-manager.tsx:190-191 — Add button text from LECTURE_HALL_COPY.createTitle, no card.
- Fix: Restore title and card border.

## G2-10-018-010  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:376-381 — Submit primary plus icon and text Create Lecture Hall, in inline card.
- vNext now: src/components/admin/lecture-hall-manager.tsx:250-265 — Modal primary save action, no plus icon.
- Fix: Restore CTA size/icon/placement.

## G2-10-018-011  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:267-295 — Visible EditOutlined pencil and red DeleteOutlined icons per row.
- vNext now: src/components/admin/lecture-hall-manager.tsx:226-240 — Action Dropdown labelled Actions, Edit and Archive nested.
- Fix: Render direct edit/delete icons with tooltip.

## G2-10-018-012  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:277-294 — Small red Delete Popconfirm with title Delete this room?, gray helper.
- vNext now: src/components/admin/lecture-hall-manager.tsx:312-320 — Full ConfirmDialog Archive lecture hall, destructive text differs.
- Fix: Preserve confirmation semantics/wording where truthful.

## G2-10-018-013  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:230-262 — Compact Ant Table small with 80px capacity and ellipsized description.
- vNext now: src/components/admin/lecture-hall-manager.tsx:200-226 — Responsive generic DataTable and status/availability fields.
- Fix: Match visual row sizing and column widths.

## G2-10-018-017  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:261-262 — Description single-line ellipsis.
- vNext now: src/components/admin/lecture-hall-manager.tsx:202-222 — New description may wrap and show additional metrics.
- Fix: Apply one-line ellipsis with same column bounds.

## G2-10-018-024  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:123-149 — Inline Create form submits, clears inputs and shows success toast.
- vNext now: src/components/admin/lecture-hall-manager.tsx:101-149 — Create in modal, then closes and router refreshes.
- Fix: Restore inline submit/clear and toast semantics.

## G2-10-018-040  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:427-436 — Edit Ant Modal width500, maskClosable unless saving, Escape disabled during save.
- vNext now: src/components/admin/lecture-hall-manager.tsx:250-266 — Generic Dialog open, pending disabled buttons, modal geometry differs.
- Fix: Match width, backdrop, close suppression.

## G2-10-018-042  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:277-295 — Delete Popconfirm attached to row icon, title Delete this room?, explanation.
- vNext now: src/components/admin/lecture-hall-manager.tsx:312-321 — Archive full ConfirmDialog, different size/action.
- Fix: Match anchored confirmation visual or document safe replacement.

## G2-10-018-057  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:413-421 — Empty table exact 'No lecture halls found.'; error empty 'Could not load lecture halls; use Retry above.'.
- vNext now: src/components/admin/lecture-hall-manager.tsx:194-200 — EmptyState title 'No lecture halls found.', no distinct failed-list copy.
- Fix: Match empty/error variants.

## G2-10-018-065  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:413-422 — Horizontal Ant table max-content on mobile.
- vNext now: src/components/admin/lecture-hall-manager.tsx:200-249 — Responsive DataTable collapses fields and Actions dropdown.
- Fix: Clone overflow layout/row density.

## G2-10-018-066  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:349-371 — Capacity/Type two-column form even within inline card.
- vNext now: src/components/admin/lecture-hall-manager.tsx:278-292 — Modal grid switches to two cols at md.
- Fix: Match form fields at 320/768/992 breakpoints.

## G2-10-018-067  [P2] GAP  facet F17  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:268-294 — Icon buttons aria-label Edit lecture hall/Delete lecture hall and tooltip titles.
- vNext now: src/components/admin/lecture-hall-manager.tsx:226-240 — Dropdown Actions with MenuItems Edit, Archive, Restore.
- Fix: Keep per-row explicit accessible labels.

## G2-10-018-071  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:302-306 — Exact heading 'Lecture Halls'; card 'Create New Lecture Hall / Room'.
- vNext now: src/components/admin/lecture-hall-manager.tsx:190-192 — Heading same; create button separate, card title absent.
- Fix: Restore card title.

## G2-10-018-073  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:428-435 — Edit Modal title 'Edit Lecture Hall', buttons Cancel/Update.
- vNext now: src/components/admin/lecture-hall-manager.tsx:254-260 — New title 'Edit lecture hall', primary label Save (from copy).
- Fix: Copy capitalization and button.

## G2-10-018-074  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:278-283 — Popconfirm 'Delete this room?' Delete/Cancel.
- vNext now: src/components/admin/lecture-hall-manager.tsx:315-318 — New 'Archive lecture hall', 'Archive hall'.
- Fix: Flag intentional archive naming, do not claim Delete.

## G2-10-018-083  [P2] GAP  facet F21  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:428-514 — Legacy Edit Modal + Delete Popconfirm, direct icons.
- vNext now: src/components/admin/lecture-hall-manager.tsx:250-321 — New common Dialog + Archive ConfirmDialog/menu.
- Fix: Match interaction affordances.

## G2-10-018-088  [P2] GAP  facet F23  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:277-294 — Edit/Delete always directly visible, with scheduled-class block warning.
- vNext now: src/components/admin/lecture-hall-manager.tsx:226-240 — Edit/Archive/Restore hidden in Actions dropdown.
- Fix: Match discoverability and warning.

## G2-19-018-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy section reachable in both College Admin and Super Admin lecture halls workspace, inline creation. `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:300-305`
- vNext now: vNext standalone college/admin pages open create dialog. `src/app/(authenticated)/admin/lecture-halls/page.tsx:68-71` `src/components/admin/lecture-hall-manager.tsx:188-192`
- Fix: Restore old create entry/section order.

## G2-19-018-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy h1 and left create card, right existing halls card at lg breakpoint. `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:300-305` `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:386-390`
- vNext now: vNext filter section and manager list, creation is separate modal. `src/app/(authenticated)/admin/lecture-halls/page.tsx:68-71` `src/components/admin/lecture-hall-manager.tsx:188-192` `src/components/admin/lecture-hall-manager.tsx:250-266`
- Fix: Match legacy card and section anatomy.

## G2-19-018-006  [P2] GAP  facet F03  effort M
- Legacy: Row action icons Edit pencil, Delete red trash, small link controls. `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:263-295`
- vNext now: Actions menu holds Edit/Archive/Restore and separate Availability link. `src/components/admin/lecture-hall-manager.tsx:220-241`
- Fix: Restore icon row action visual pattern and document archive addition.

## G2-19-018-008  [P2] GAP  facet F03  effort M
- Legacy: Independent college and department failure Alert Retry affordances. `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:306-310`
- vNext now: vNext manager has no corresponding partial lookup retry alert. `src/components/admin/lecture-hall-manager.tsx:188-200` `src/app/(authenticated)/admin/lecture-halls/page.tsx:36-42`
- Fix: Render lookup-specific warning and Retry separately from list state.

## G2-19-018-010  [P2] GAP  facet F04  effort S
- Legacy: Legacy row department 0/null shows '-' and College column resolves name/id. `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:242-261`
- vNext now: vNext shows department '—' and no College column in scoped table. `src/components/admin/lecture-hall-manager.tsx:200-218`
- Fix: Restore fallback placeholder and college column for cross-college views.

## G2-19-018-011  [P2] GAP  facet F04  effort S
- Legacy: Legacy Description is its own truncated column. `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:261-261`
- vNext now: vNext description appears secondary inside Name cell. `src/components/admin/lecture-hall-manager.tsx:200-205`
- Fix: Split Description into matching column.

## G2-19-018-014  [P2] GAP  facet F05  effort S
- Legacy: Legacy column order Name, Room Type, Capacity, College, Department, Description, Actions. `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:230-265`
- vNext now: vNext name, type, capacity, department, upcoming, status, actions. `src/components/admin/lecture-hall-manager.tsx:200-225`
- Fix: Reorder columns and restore missing ones.

## G2-19-018-018  [P2] GAP  facet F06  effort S
- Legacy: Legacy create starts capacity=50, room type unselected and required. `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:351-368`
- vNext now: vNext capacity '50', room type preselected LECTURE_HALL. `src/components/admin/lecture-hall-manager.tsx:40-46`
- Fix: Begin type blank and require user selection.

## G2-19-018-019  [P2] GAP  facet F06  effort S
- Legacy: Legacy InputNumber exposes min1,max1000 while service accepts max5000. `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:365-368` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LectureHallServiceImpl.java:46-49`
- vNext now: vNext input min1,max5000 and validation max5000. `src/components/admin/lecture-hall-manager.tsx:109-113` `src/components/admin/lecture-hall-manager.tsx:279-282`
- Fix: Resolve desired UI max while retaining backend check.

## G2-19-018-031  [P2] GAP  facet F09  effort M
- Legacy: Legacy delete Popconfirm says 'Delete this room?' with scheduled-class warning, Delete/Cancel buttons. `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:276-295`
- vNext now: vNext Archive ConfirmDialog with future-class warning and Archive hall button. `src/components/admin/lecture-hall-manager.tsx:312-320`
- Fix: Differentiate archive transition and exact legacy deletion dialog.

## G2-19-018-033  [P2] GAP  facet F10  effort M
- Legacy: Legacy POST /api/v1/lectureHall/create snake_case returns 200 Response(data=room). `docs/legacy-source/frontend/src/api/Services/AdminService.js:623-625` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:56-77`
- vNext now: vNext POST /api/lecture-halls camelCase returns 201 {hall}. `src/app/api/lecture-halls/route.ts:25-45` `src/components/admin/lecture-hall-manager.tsx:118-133`
- Fix: Specify API migration and response remapping.

## G2-19-018-043  [P2] GAP  facet F13  effort M
- Legacy: Legacy fetch failures expose Retry and distinct error-empty message. `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:68-82` `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:411-421`
- vNext now: vNext invalid-query ErrorState and list EmptyState; no matching retry in manager. `src/app/(authenticated)/admin/lecture-halls/page.tsx:36-42` `src/components/admin/lecture-hall-manager.tsx:194-200`
- Fix: Show request failure with Retry separately from zero rows.

## G2-19-018-049  [P2] GAP  facet F16  effort M
- Legacy: Legacy 24-col mobile and lg 10/14 create/list grid. `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:303-305` `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:386-387`
- vNext now: vNext list-first layout and mobile-safe dialog controls. `src/app/(authenticated)/admin/lecture-halls/page.tsx:71-88` `src/components/admin/lecture-hall-manager.tsx:250-282`
- Fix: Match desktop split and phone stacking geometry.

## G2-4-027-006  [P2] GAP  facet F02  effort M
- Legacy: Two columns: left always-open Create card, right Existing Halls card (`docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:300-311,386-410`)
- vNext now: Single Create button opening dialog above table (`src/components/admin/lecture-hall-manager.tsx:188-200,250-267`)
- Fix: Clone left create card and right table 10/14 grid; keep mobile stacked.

## G2-4-027-007  [P2] GAP  facet F02  effort S
- Legacy: Edit opens separate Modal title `Edit Lecture Hall` (`docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:427-437`)
- vNext now: One shared create/edit dialog; edit title sentence-case (`src/components/admin/lecture-hall-manager.tsx:250-266`)
- Fix: Restore edit title capitalization and modal layout.

## G2-4-027-008  [P2] GAP  facet F02  effort M
- Legacy: Table Name/Room Type/Capacity/College/Department/Description/Actions (`docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:230-298`)
- vNext now: Table Name/Type/Capacity/Department/Upcoming/Status/Actions (`src/components/admin/lecture-hall-manager.tsx:200-246`)
- Fix: Reorder columns; place description as column, preserve legacy conditional college column.

## G2-4-027-009  [P2] GAP  facet F03  effort S
- Legacy: Description is its own ellipsized column (`docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:230-262`)
- vNext now: Description appears as subtitle under Name (`src/components/admin/lecture-hall-manager.tsx:201-205`)
- Fix: Use independent ellipsized description cell.

## G2-4-027-010  [P2] GAP  facet F03  effort M
- Legacy: Edit/Delete icon-only actions with aria-labels (`docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:268-294`)
- vNext now: Availability link and Actions dropdown with Edit/Archive/Restore (`src/components/admin/lecture-hall-manager.tsx:225-241`)
- Fix: Match original action icons and delete confirm where allowed.

## G2-4-027-022  [P2] GAP  facet F06  effort M
- Legacy: Create field order department→name→room type/capacity→description (`docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:338-374`)
- vNext now: Dialog name→capacity/type→department→description (`src/components/admin/lecture-hall-manager.tsx:273-307`)
- Fix: Reorder fields exactly as legacy, retain labels.

## G2-4-027-023  [P2] GAP  facet F06  effort S
- Legacy: Optional department Select placeholder `Select department` allowClear (`docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:328-336`)
- vNext now: Select first value `Shared by all departments` (`src/components/admin/lecture-hall-manager.tsx:295-302`)
- Fix: Use legacy placeholder/clear UX; preserve shared semantics.
