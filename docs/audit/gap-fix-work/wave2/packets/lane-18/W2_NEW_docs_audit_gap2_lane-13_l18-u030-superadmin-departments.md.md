# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-13/l18-u030-superadmin-departments.md

35 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-13/l18-u030-superadmin-departments.md

## G2-18-030-001  [P2] GAP  facet F01 Navigation  effort M
- Legacy: L:30 shared Departments section under Super Admin; old route is `/superadmin/departments`
- vNext now: NR:1-9 redirects Super Admin bookmarks to `/admin/departments` via NL:9-15
- Fix: Verify sidebar active row, top-level group, and URL legacy redirect preserve selected college and history/back semantics

## G2-18-030-003  [P2] GAP  facet F01 Scope selector  effort S
- Legacy: L:82-92 fetchColleges if unscoped and passes collegeId to form when scoped
- vNext now: N:15-30 uses context.adminScope, C:10-15 derives server tenant
- Fix: Confirm platform header college selector is visible, navigable, and persists selection; do not add unsafe arbitrary collegeId mutation

## G2-18-030-004  [P2] GAP  facet F02 Heading  effort M
- Legacy: L:328-330 exact `Departments` h1 class admin-list-page__title
- vNext now: N:49-55 PageHeader `Departments` plus descriptive subtitle and AcademicSetupSteps
- Fix: Align h1 font size/weight/margin and distance to cards per legacy shell; determine whether subtitle/steps should be visually subdued

## G2-18-030-005  [P2] GAP  facet F02 Two-column  effort M
- Legacy: L:331-333 left xs24 lg10, L:373-374 right xs24 lg14, Row gutter=24
- vNext now: N:55-57 sequential DepartmentCreateForm then DepartmentDirectory (stacked)
- Fix: Restore 10/14 split at lg with 24px gutter, stacked xs, preserve natural forms/tables widths

## G2-18-030-006  [P2] GAP  facet F02 Card shells  effort M
- Legacy: L:333/373-376 small Ant Card `Create New Department` and `Existing Departments`
- vNext now: C:51-83 plain form + h2; D:69-71 plain section h2
- Fix: Match legacy card border/radius/header bottom rule/padding/shadow and heading placement in one consistent admin UI

## G2-18-030-007  [P2] GAP  facet F02 Create form layout  effort S
- Legacy: L:336-369 vertical form, label above full-width field, button below
- vNext now: C:52-76 sm:grid-cols-input-and-button horizontally
- Fix: Use vertical stacked field and standalone button within left card, preserve loading/disabled state

## G2-18-030-008  [P2] GAP  facet F02 Toolbar in card header  effort M
- Legacy: L:374-393 existing card `extra` contains search 220px + CSV + Refresh all in head
- vNext now: D:72-101 search full width and `View options` disclosure hides CSV
- Fix: Move toolbar into right card header as visible compact horizontal group; small viewport should wrap rather than overflow

## G2-18-030-010  [P2] GAP  facet F03 Search affordance  effort S
- Legacy: L:379-385 Input.Search allowClear size small width220, exact placeholder `Search departments`
- vNext now: D:74-82 full-width Input and separate conditional Clear search button
- Fix: Match Search suffix icon, inside-field clear, 220px desktop width, search-on-change; retain keyboard labeling

## G2-18-030-011  [P2] GAP  facet F03 CSV/refresh  effort S
- Legacy: L:386-391 visible DownloadOutlined Export CSV, ReloadOutlined Refresh
- vNext now: D:83-100 hides Export CSV in `View options` and has NO actual visible Refresh button
- Fix: Provide visible icons and working Refresh calling router.refresh, preserve disabled export on 0 rows

## G2-18-030-012  [P2] GAP  facet F03 Contents chips  effort M
- Legacy: L:254-274 blue/gray Tag for programs/courses/faculty, singular program/course, tooltip
- vNext now: D:31-43 one plain text line `X programs · Y courses · Z faculty` with title
- Fix: Replace plain string with small legacy Tags (colored by >0) with exact gaps and tooltip/focus information

## G2-18-030-013  [P2] GAP  facet F03 Count loading  effort M
- Legacy: L:258-260 shows secondary `…` when not yet fetched
- vNext now: N:34-47 waits usage queries server-side; D:18-19 renders `—` if resolver failed
- Fix: Use skeleton/ellipsis while usage pending, dash with reason only on genuine error (do not misrepresent 0)

## G2-18-030-014  [P2] GAP  facet F03 Actions  effort M
- Legacy: L:287-321 two icon-only small text Edit/Delete buttons with tooltips, fixed 120px Actions column
- vNext now: D:45-50 actions sr-only header; A:148-169 visible Edit text and More→Archive menu
- Fix: Restore visible `Actions` header and edit/delete icon positions, preserving archive semantics as product decision

## G2-18-030-015  [P2] GAP  facet F04 Table columns  effort S
- Legacy: L:245-325 headers Department Name / Contents / Actions
- vNext now: D:22-52 maintains first two headers, Actions only screen-reader label
- Fix: Restore exact Actions header and align widths/position; mobile accessibility label remains additional

## G2-18-030-019  [P2] GAP  facet F05 Paging  effort S
- Legacy: L:408-416 pageSize10 with size changer, Ant total range
- vNext now: D:60-65,85-92,131-154 size 10/25/50/100 plus Prev/Next
- Fix: Align pagination placement/count text `1-10 of N`, changer, jump behavior when search changes; preserve explicit Prev/Next for a11y

## G2-18-030-020  [P2] GAP  facet F05 Scope refresh  effort M
- Legacy: L:53-79 has loadedScopeKey/errorScopeKey and only last same-scope list during refresh
- vNext now: N:14-47 server loads all and passes static rows; no stale same-scope refresh UI
- Fix: Add refresh button, scoped loader and same-scope stale indication; clear rows on college change

## G2-18-030-022  [P2] GAP  facet F06 College selector  effort M
- Legacy: L:336-351 when no collegeId shows `College` select `Select college`
- vNext now: C:10-15 takes tenant from server scope, no in-form select; N:17-30 tells user use header
- Fix: Preserve user job of picking college before create via global scope selector, NOT client-selected mutation payload

## G2-18-030-025  [P2] GAP  facet F06 Submit affordance  effort S
- Legacy: L:95-119 allows validation on click, disables while loading
- vNext now: C:74-76 button disabled pending OR blank input, no click-based required error while blank
- Fix: Decide legacy click-to-validate versus proactive disabled; if clone exact, allow click and show `Please enter department name`

## G2-18-030-026  [P2] GAP  facet F06 Edit form fields  effort S
- Legacy: L:422-466 Edit Department modal includes College select only when unscoped and name field
- vNext now: A:170-211 modal only name (college fixed by server), descriptive sentence
- Fix: Keep no cross-college movement; ensure chosen college visible in edit title/context without editable unsafe tenant ID

## G2-18-030-027  [P2] GAP  facet F07 Create error alert  effort S
- Legacy: L:333-335 closable red Alert `Department was not created` with server details
- vNext now: C:37-48,77-82 generic inline red paragraph, no close
- Fix: Use shared Alert with exact title/details + dismiss action, differentiate duplicate from unknown errors

## G2-18-030-028  [P2] GAP  facet F07 Edit validation/errors  effort M
- Legacy: L:134-165 client validateFields, field mapping, `Department was not updated` alert
- vNext now: A:45-80 toast-based update errors, no field-level message inside dialog
- Fix: Add field-level name errors and closable edit error Alert, preserve entered draft on failure

## G2-18-030-029  [P2] GAP  facet F07 Delete error/retry  effort M
- Legacy: L:167-185 stores {record,message}; L:395-397 persistent dismissible `Department was not deleted` with Retry delete
- vNext now: A:119-142 toast, A:245-251 alert only inside Archive dialog
- Fix: Keep dismissible error banner after dialog closes and genuine retry button; separate archive semantics in label

## G2-18-030-032  [P2] GAP  facet F08 Delete success  effort S
- Legacy: L:173-176 physical `Department deleted successfully!`
- vNext now: A:132-140 archive soft-delete `Department archived`
- Fix: Clearly label archive action, don't call it delete or imply physical removal; document intentional outcome difference

## G2-18-030-033  [P2] GAP  facet F09 Edit modal  effort M
- Legacy: L:422-466 Ant Modal Edit Department, Save Changes/Cancel, maskClosable false, pending blocks X/keyboard
- vNext now: A:170-212 Dialog with same title/buttons, guarded pending, added description
- Fix: Compare modal width, padding, focus behavior, overlay mask and button order; ensure exact close guard

## G2-18-030-035  [P2] GAP  facet F09 Deletion confirm  effort M
- Legacy: L:301-320 inline Popconfirm `Delete Department`, description, `Yes, Delete` and Cancel
- vNext now: A:217-258 full Archive dialog `Archive department`, `Archive department` danger button
- Fix: Restore compact confirm affordance if pixel clone approved, but retain semantic `Archive` and mandatory safety guard

## G2-18-030-040  [P2] GAP  facet F11 Missing scope state  effort S
- Legacy: L:337-351 unscoped shows College picker and works after selection
- vNext now: N:17-29 dedicated Select a college to continue, no card content
- Fix: Make global header college selector obvious/recoverable while keeping nav and tab strip visible in missing scope

## G2-18-030-044  [P2] GAP  facet F13 Initial loading  effort M
- Legacy: L:405-406 8-row 6-column TableSkeleton `Loading departments`
- vNext now: N:34-47 awaits all list+usage server-side, no matching table skeleton in component
- Fix: Add route loading.tsx and matched right-table skeleton, no false empty state while waiting

## G2-18-030-045  [P2] GAP  facet F13 Refresh failure  effort M
- Legacy: L:398-404 `Couldn't refresh departments` warning with last same-scope rows and Retry
- vNext now: N:34-47 server awaits; no in-component retry or scoped stale data
- Fix: Implement explicit refresh error banner with Retry; don't render old tenant rows after header switches

## G2-18-030-051  [P2] GAP  facet F16 Mobile  effort M
- Legacy: L:331-373 Col xs24 lg10/14, toolbar Space wrap, small table x:max-content L:408-414
- vNext now: C:55 sm horizontal, D:72-101 disclosures/mobile, D:106-124 responsive DataTable
- Fix: Compare at 320,768,992,1280 widths; clone old card stacking and toolbar wrap while retaining 44px touch targets

## G2-18-030-052  [P2] GAP  facet F17 Keyboard  effort M
- Legacy: L:288-319 icon controls aria-label Edit/Delete department and Ant Popconfirm keyboard semantics
- vNext now: A:149-169 action Edit text/More menu; D:106-114 header sort button keyboard accessible
- Fix: Verify keyboard reachability/label for Archive in menu/mobile sheet, focus-return from nested dialog, tooltips when disabled

## G2-18-030-053  [P2] GAP  facet F18 Wording  effort S
- Legacy: L:330-333/373-387 exact `Departments`, `Create New Department`, `Existing Departments`, `Search departments`, `Export CSV`, `Refresh`
- vNext now: COPY:2-14 matches main headings; D:77 search correct, D:83 `View options` is extra, Refresh absent
- Fix: Restore missing Refresh label and reduce extra disclosure; preserve exact legacy create/edit/placeholder text

## G2-18-030-054  [P2] GAP  facet F19 Count query volume  effort M
- Legacy: L:219-223 uses bounded count hook; each of three dependency APIs per dept
- vNext now: N:35-47 starts Promise.allSettled of resolveDepartmentUsage for every department; S:50-118 runs three DB counts each
- Fix: Aggregate counts per college using GROUP BY or bound concurrency to avoid unbounded 3N DB requests for large SA directory

## G2-18-030-056  [P2] GAP  facet F20 Dependency unknown  effort M
- Legacy: L:216-223 unknown counts don't blank table; L:283-320 only positive known count disables delete
- vNext now: A:35-36 unknown counts disable archive, D:125-129 says Refresh but D has no Refresh control
- Fix: Add working Refresh, explain unknown count, optionally allow server-authoritative archive attempt with confirmation

## G2-18-030-057  [P2] GAP  facet F21 Dependencies  effort M
- Legacy: L:8-22 AdminService, Skeletons, CSV util, dependency hook, Ant UI
- vNext now: N:8-10 department service, C/D/A shared server+UI; M:8-9 central activity taxonomy
- Fix: Inventory observable behavior from removed Ant primitives (cards, tooltips, modal, table) and implement equivalent in shared LMS shell

## G2-18-030-061  [P2] MISSING  facet F23 Dropped  effort M
- Legacy: L:386-391 explicit Refresh, L:328-420 two-panel cards and chips L:254-274
- vNext now: N/C/D lack visible Refresh/card split/Tag chips
- Fix: Prioritized parity patch bundle: restore two cards, visible Refresh, 3 colored dependency Tags, inline 3-button toolbar

## G2-18-030-009  [P3] GAP  facet F03 Create icon  effort S
- Legacy: L:364-367 primary Create Department button with PlusOutlined
- vNext now: C:74-76 button plain text
- Fix: Add legacy plus icon with correct 4-8px gap, compact header/call-to-action size
