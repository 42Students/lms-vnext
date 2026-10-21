# Work packet (wave 2): edit src/components/courses/super-admin-content-directory-page.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/superadmin-lesson-content-wrapper.md, docs/audit/gap2/lane-19/lesson-content.md, docs/audit/gap2/lane-9/superadmin-admin-resources.md

## G2-17-003-003  [P2] GAP  facet F01  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/lesson-content.js:70 wraps content with SuperAdminGroupShell groupKey='content' (tab navigation).
- vNext now: src/components/courses/super-admin-content-directory-page.tsx:85-88 uses PageBackLink Courses and separate PageHeader, no legacy group shell tab strip.
- Fix: Render same Courses & Content group tab strip atop videos/resources/live classes.

## G2-17-003-004  [P2] GAP  facet F02  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/lesson-content.js:69-75 one ln-module admin-list-page group shell around edit/workspace.
- vNext now: src/components/courses/super-admin-content-directory-page.tsx:85-168 page header, authoring disclosure, filter form, result directory and pagination in vertical flow.
- Fix: Match legacy shell/header, move directory below visible editor without hiding core controls.

## G2-17-003-005  [P2] GAP  facet F02  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:111-114 video/live tab title and help, :117-176 has course/class selectors and author form.
- vNext now: src/components/courses/super-admin-content-directory-page.tsx:86-92 headline and authoring module initially closed details via src/components/courses/super-admin-content-authoring.tsx:16-19.
- Fix: Expose primary lesson authoring form without extra closed disclosure click.

## G2-17-003-006  [P2] GAP  facet F02  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:327-379 resource area includes pickers, Add Resource, Refresh, scoped table.
- vNext now: src/components/courses/super-admin-content-directory-page.tsx:93-166 instead displays global search/status/four filters and card list.
- Fix: Recreate resources scoped picker + editor+table composition before optional global directory.

## G2-17-003-007  [P2] GAP  facet F03  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/lesson-content.js:25-33 scope applying is a colored Alert (info/error), with distinct message and description.
- vNext now: src/components/courses/super-admin-content-directory-page.tsx:55-65 immediately checks admin identity/selected scope and renders EmptyState, no transitional scope-applying state.
- Fix: Show 'Applying college scope' info state and distinct failed-apply error before any scoped data calls.

## G2-17-003-010  [P2] GAP  facet F03  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:360-361 separate Add Resource/Refresh controls always visible after lesson selection.
- vNext now: src/components/courses/super-admin-content-authoring.tsx:16-17 all Add actions nested inside collapsed disclosure; src/components/courses/super-admin-content-directory-page.tsx:85-168 no Refresh content button.
- Fix: Expose primary Add/Refresh buttons as legacy top controls.

## G2-17-003-015  [P2] GAP  facet F05  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:247-263 fetches selected lesson/class content, table locally per choice; docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:375-378 Resources Table pageSize15.
- vNext now: src/components/courses/super-admin-content-directory-page.tsx:133-167 directory pages globally at 25 items with card articles, no table columns or drag handles.
- Fix: Restore table list within chosen lesson/class, editable sortable row and 15-page default for Resources.

## G2-17-003-016  [P2] GAP  facet F05  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:48-90 has focusable HolderOutlined sortable handle with Space/arrows behavior.
- vNext now: src/components/courses/super-admin-content-directory-page.tsx:133-163 article cards report sequence but provide no same-handle keyboard drag.
- Fix: Reimplement keyboard sortable handles in scoped content table.

## G2-17-003-027  [P2] MISSING  facet F09  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/lesson-content.js:49-62 renders bordered Video policy Card when no college and type=video; not a modal.
- vNext now: src/components/courses/super-admin-content-directory-page.tsx:62-65 skips card entirely; no policy overlay.
- Fix: Add global policy Card styled like legacy.

## G2-17-003-035  [P2] GAP  facet F13  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/lesson-content.js:22-35 shows explicit scope loading and error Alerts, :38-47 no-college warning.
- vNext now: src/components/courses/super-admin-content-directory-page.tsx:50-79 has invalid filters, denied, unselected college, source-error branches but no token application state.
- Fix: Match applying scope, failed applying scope, selected college error and no college as distinct visible states.

## G2-17-003-036  [P2] GAP  facet F13  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:84-87 distinguishes initial loading vs refreshing same scope; :365-377 retains last good rows on refresh failure.
- vNext now: src/components/courses/super-admin-content-directory-page.tsx:68-79 server allSettled allows directory while authoring/sections fail but full directory failure replaces data.
- Fix: Keep per-lesson cached rows and stale-error recovery where legacy editor requires it.

## G2-17-003-040  [P2] GAP  facet F16  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/lesson-content.js:24-35 uses ln-module admin-list-page shell, :50 Card for policy; docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1-2 AntD Row/Col/Card layouts.
- vNext now: src/components/courses/super-admin-content-directory-page.tsx:85-132 responsive Tailwind grid sm/md/xl but different geometry and headings.
- Fix: Match canvas margins, old cards and breakpoint layouts at 320/768/1280.

## G2-17-003-041  [P2] MISSING  facet F17  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:75-82 explicitly describes focusable keyboard drag handle Space/arrows/Space.
- vNext now: src/components/courses/super-admin-content-directory-page.tsx:133-163 article list lacks sortable handle and equivalent keyboard directions.
- Fix: Add focusable sortable control and aria instructions to scoped authoring list.

## G2-17-003-043  [P2] GAP  facet F18  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/lesson-content.js:27 'Applying college scope', :29-30 'Select the college again in the header or refresh before editing lesson content.'.
- vNext now: src/components/courses/super-admin-content-directory-page.tsx:62-65 generic 'Select a college to continue'.
- Fix: Use exact separate applying/error copy.

## G2-17-003-045  [P2] GAP  facet F18  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/lesson-content.js:50 'Video policy', :55 'Video "watched" threshold', :56 help text.
- vNext now: src/components/courses/super-admin-content-directory-page.tsx:62-65 no video policy text, src/modules/platform-settings/legacy-setting-specs.ts:97-105 specifies different label 'Video watched threshold (%)'.
- Fix: Restore policy card's full wording, subtitle and % suffix.

## G2-17-003-046  [P2] GAP  facet F19  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:216-281 uses request sequence counters to reject old lesson/class lookup responses; :247-279 only loads chosen scope.
- vNext now: src/components/courses/super-admin-content-directory-page.tsx:68-72 prefetches entire paged directory + all authoring lessons + all section options per route.
- Fix: Bound course/lesson selector work for large colleges and preserve no-stale-selection behavior.

## G2-19-002-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy `SuperAdminGroupShell groupKey='content'` surrounds content tabs `docs/legacy-source/frontend/src/pages/superadmin/lesson-content.js:68-75`
- vNext now: vNext individual server pages use `SuperAdminContentDirectoryPage` with `PageBackLink` to Courses `src/components/courses/super-admin-content-directory-page.tsx:85-88`
- Fix: Match legacy group tabs and header instead of one-off Courses backlink.

## G2-19-002-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy create-left and Existing Content-right `Row gutter={24}` `Col xs24 lg12` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1144-1147` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1571-1574`
- vNext now: vNext collapsed authoring `<details>` above filters and article list `src/components/courses/super-admin-content-authoring.tsx:16-35` `src/components/courses/super-admin-content-directory-page.tsx:85-93` `src/components/courses/super-admin-content-directory-page.tsx:134-165`
- Fix: Restore desktop side-by-side Add and Existing Content cards and mobile stack.

## G2-19-002-006  [P2] GAP  facet F02  effort M
- Legacy: Legacy title `Videos` or `Live classes` followed by policy notice and two Cards `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1131-1147`
- vNext now: vNext PageHeader, collapsed Add, filter section and rows; no policy notice `src/components/courses/super-admin-content-directory-page.tsx:85-93`
- Fix: Place global video-policy information after title with legacy styling and preserve card order.

## G2-19-002-007  [P2] GAP  facet F02  effort M
- Legacy: Legacy `Existing Content` titled Card has inline toolbar and three selectors `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1571-1604`
- vNext now: vNext global filter form then list, no `Existing Content` Card title `src/components/courses/super-admin-content-directory-page.tsx:93-134`
- Fix: Rebuild existing-content card, compact toolbar and selector hierarchy.

## G2-19-002-010  [P2] GAP  facet F03  effort M
- Legacy: Legacy table row Edit/Delete icon buttons with per-title tooltip and aria `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1037-1073`
- vNext now: vNext Actions collapsed per article and text buttons `Edit`/`Publish`/`Delete` `src/components/courses/super-admin-content-directory-page.tsx:153-160` `src/components/courses/super-admin-content-actions.tsx:121-128`
- Fix: Use compact icon action-cell controls for desktop and accessible responsive fallback.

## G2-19-002-011  [P2] GAP  facet F03  effort M
- Legacy: Legacy row `Join` for live class, `View` for https/file, or `No link`/`Invalid link` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:981-1033`
- vNext now: vNext conditional `Open public link` and start/end text; missing explicit Join/No link UI `src/components/courses/super-admin-content-directory-page.tsx:148-151`
- Fix: Render legacy row-specific Join/View/no-link content action and safe fallback.

## G2-19-002-015  [P2] GAP  facet F04  effort M
- Legacy: Legacy Order cell `index+1` based on visible table order `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:976-978`
- vNext now: vNext `Order within lesson: sequence+1` database order `src/components/courses/super-admin-content-directory-page.tsx:143-146`
- Fix: Match displayed order semantics and verify any zero/duplicate legacy sequence data.

## G2-19-002-020  [P2] GAP  facet F05  effort M
- Legacy: Legacy dropdown Course→Lesson cascade clears existing selected lesson/data on Course change `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1610-1616`
- vNext now: vNext filters nested `<details>`; course and lesson selectors are URL form values `src/components/courses/super-admin-content-directory-page.tsx:106-122`
- Fix: Implement immediate dependent Lesson/Section reset and disable until parent known.

## G2-19-002-021  [P2] GAP  facet F05  effort M
- Legacy: Legacy Section choices include `All content in this lesson` and per-section `what its students see` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:926-931`
- vNext now: vNext Section dropdown `All sections` and audience filter with SHARED/SECTION `src/components/courses/super-admin-content-directory-page.tsx:119-126`
- Fix: Use exact legacy Section labels and semantics for combined generic+section view.

## G2-19-002-022  [P2] GAP  facet F05  effort M
- Legacy: Legacy paging default 10 with size-changer and `start-end of total` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1691-1713`
- vNext now: vNext 25 per page fixed, no size selector `src/modules/courses/super-admin-content-directory-model.ts:2` `src/components/courses/super-admin-content-directory-page.tsx:133` `src/components/courses/super-admin-content-directory-page.tsx:166-167`
- Fix: Allow default 10, size changer and legacy total range.

## G2-19-002-025  [P2] GAP  facet F05  effort M
- Legacy: Legacy table 10 rows and horizontal `scroll.x=max-content` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1691-1713`
- vNext now: vNext stacked article rows, 25 and no horizontal table scroll `src/components/courses/super-admin-content-directory-page.tsx:133-167`
- Fix: Match column density, fixed/cropped behavior at md, mobile alternative.

## G2-19-002-047  [P2] GAP  facet F09  effort M
- Legacy: Legacy edit opens 600px non-mask-dismissible modal titled `Edit Content: <name>` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1720-1730`
- vNext now: vNext inline article `Actions` disclosure, then inline editable fieldset `src/components/courses/super-admin-content-directory-page.tsx:153-160` `src/components/courses/super-admin-content-actions.tsx:105-131`
- Fix: Restore 600px modal for Edit Content and matching dismissal behavior.

## G2-19-002-064  [P2] GAP  facet F13  effort M
- Legacy: Legacy loading spinner on table and each Course/Faculty/Lesson selector `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:130-151` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1148-1155` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1691-1712`
- vNext now: vNext server-page blocking navigation and inline warning, no table loading spinner `src/components/courses/super-admin-content-directory-page.tsx:67-93` `src/components/courses/super-admin-content-directory-page.tsx:134-165`
- Fix: Provide loading skeleton/table spinner on filter/navigation.

## G2-19-002-065  [P2] GAP  facet F13  effort S
- Legacy: Legacy error `Lesson content could not be loaded` with `Retry content` and table retained `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1596-1600`
- vNext now: vNext `Content directory unavailable` full ErrorState + retry link `src/components/courses/super-admin-content-directory-page.tsx:73-80`
- Fix: Keep existing content table and legacy banner with retry where safe.

## G2-19-002-066  [P2] GAP  facet F13  effort S
- Legacy: Legacy empty selected/none messages distinct `No content found.` vs `Select a course and lesson to view content.` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1697-1714`
- vNext now: vNext generic EmptyState combines `No content found.` title with `Select a course and lesson...` even for filtered global search `src/components/courses/super-admin-content-directory-page.tsx:164-165`
- Fix: Branch empty states based on missing lesson selection versus zero matching results.

## G2-19-002-074  [P2] GAP  facet F16  effort M
- Legacy: Legacy grid desktop two half-width Cards (`lg=12`), form subrows sm12 `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1144-1147` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1169-1172` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1571-1574`
- vNext now: vNext one-column author disclosure, md filter grids and stacked article listing `src/components/courses/super-admin-content-authoring.tsx:16-35` `src/components/courses/super-admin-content-directory-page.tsx:93-135`
- Fix: Reproduce lg two-column layout and 24px gutters across breakpoints.

## G2-19-002-075  [P2] GAP  facet F16  effort M
- Legacy: Legacy table horizontal max-content scroll, small AntD buttons and visible drag handle `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1691-1713` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:75-82`
- vNext now: vNext no horizontal scroll, text buttons min 44px / min 36px md `src/components/courses/super-admin-content-directory-page.tsx:134-163` `src/components/courses/super-admin-content-actions.tsx:121-127`
- Fix: Match responsive desktop density and mobile keyboard-compatible actions.

## G2-19-002-081  [P2] GAP  facet F18  effort S
- Legacy: Legacy audience labels `All currently eligible sections for this course`/`One specific section` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1235-1242`
- vNext now: vNext read audience filter labels similar but authoring fixed OFFERING `src/components/courses/super-admin-content-directory-page.tsx:124-126` `src/components/courses/super-admin-content-authoring.tsx:26-29`
- Fix: Match creation audience radio labels and contextual eligibility hint.

## G2-9-025-001  [P2] GAP  facet F01  effort S
- Legacy: Old Resources is a standalone ln-module admin-list-page with heading h2 `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:324-328`
- vNext now: Admin route wraps centralized PageHeader Resources and Courses back link `src/app/(authenticated)/admin/resources/page.tsx:1-6` `src/components/courses/super-admin-content-directory-page.tsx:85-89`
- Fix: Match legacy heading scale/spacing and remove additional back-link from primary head.

## G2-9-025-003  [P2] GAP  facet F01  effort S
- Legacy: Old subtitle Give a lesson reading material: files, links and notes, together in one resource. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:324-328`
- vNext now: New description Manage lesson resources in the selected college. `src/components/courses/super-admin-content-directory-page.tsx:85-88`
- Fix: Restore literal subtitle.

## G2-9-025-004  [P2] GAP  facet F02  effort L
- Legacy: Single uninterrupted selector toolbar + below Table, followed by modal editor `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:324-335`
- vNext now: Separate Back, PageHeader, authoring details, filter form, and individual article results `src/components/courses/super-admin-content-directory-page.tsx:85-169`
- Fix: Restore legacy selectors/table/modal overall composition.

## G2-9-025-005  [P2] GAP  facet F02  effort M
- Legacy: Course, Lesson and Class selectors and Add Resource/Refresh actions in one horizontal Space `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:335-362`
- vNext now: Authoring includes only lesson select behind Add resource; directory filters in separate disclosure `src/components/courses/super-admin-content-directory-page.tsx:93-132` `src/components/courses/super-admin-content-authoring.tsx:16-25`
- Fix: Place three selection controls in primary toolbar with Add Resource/Refresh.

## G2-9-025-007  [P2] GAP  facet F03  effort S
- Legacy: Add Resource primary Plus icon and Refresh button disabled without lesson `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:360-362`
- vNext now: Collapsed Add resource summary, no inline Refresh action `src/components/courses/super-admin-content-authoring.tsx:16-18` `src/components/courses/super-admin-content-directory-page.tsx:85-94`
- Fix: Restore visible Plus icon and scoped Refresh.

## G2-9-025-008  [P2] GAP  facet F03  effort M
- Legacy: Table Edit button icon and dangerous Delete with Popconfirm `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:307-322`
- vNext now: Actions hidden in per-row details; Edit, Publish, Delete as text buttons `src/components/courses/super-admin-content-directory-page.tsx:153-161` `src/components/courses/super-admin-content-actions.tsx:120-128`
- Fix: Expose Edit/Delete side by side in Actions column and keep Publish secondary.
