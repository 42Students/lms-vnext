# Work packet (wave 2): edit src/app/(authenticated)/admin/placements/drives/page.tsx (part 2 of 2)

25 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/super-admin-jobs-directory.md, docs/audit/gap2/lane-10/superadmin-jobs-all.md

## G2-8-030-004  [P2] GAP  facet F02  effort M
- Legacy: Old heading Jobs or Jobs Management (LMS), search/status/Create Job same row, StudentPlacementLookup directly beneath docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:669-757.
- vNext now: New PageHeader Drives with actions, filter form, bulk section, count, table and pagination src/app/(authenticated)/admin/placements/drives/page.tsx:76-113.
- Fix: Restore original section sequence and integrated student lookup.

## G2-8-030-005  [P2] GAP  facet F02  effort M
- Legacy: Old mobile grid cards replace desktop table docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:614-667,823-876.
- vNext now: New shared DataTable handles responsive rows and actions, no separate card component src/app/(authenticated)/admin/placements/drives/page.tsx:59-75,109-111.
- Fix: Compare phone row density, headings, actions and borders pixel by pixel.

## G2-8-030-009  [P2] GAP  facet F04  effort M
- Legacy: Old job rows show Job, Company, Type, Status, Deadline, Posted, Applicants, Actions docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:492-612.
- vNext now: New Job Title with company/status nested, Type, Location,Deadline,Posted,Applicants,Actions src/app/(authenticated)/admin/placements/drives/page.tsx:59-75.
- Fix: Restore separate Company and Status columns and column ordering, Location can remain extra.

## G2-8-030-011  [P2] GAP  facet F04  effort M
- Legacy: Old Posted fallback record.postedDate or createdAt and DD MMM YYYY docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:547-554.
- vNext now: New uses publishedAt only, may be null on draft src/app/(authenticated)/admin/placements/drives/page.tsx:68-68.
- Fix: Preserve createdAt fallback and distinguish never-published draft.

## G2-8-030-013  [P2] GAP  facet F04  effort M
- Legacy: Old Job type getJobTypeTag includes job-specific classification docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:18-19,628-630.
- vNext now: New employmentType replaces underscores src/app/(authenticated)/admin/placements/drives/page.tsx:63-63.
- Fix: Map old jobType enum badge and capitalization, not employmentType raw.

## G2-8-030-015  [P2] GAP  facet F05  effort M
- Legacy: Old URL q,status,page,size restored; page default1,size20 options10/20/50/100 docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:81-116.
- vNext now: New URL q,status,page,pageSize strict, pageSize default10 options same src/modules/placements/admin-drive-directory-model.ts:9-14; src/app/(authenticated)/admin/placements/drives/page.tsx:85-103.
- Fix: Set default pageSize20 and alias legacy size query.

## G2-8-030-016  [P2] GAP  facet F05  effort M
- Legacy: Old 400ms debounced search, page1 on typing, URL replaced shallow scroll false docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:118-135.
- vNext now: New GET form requires Filter click and full navigation src/app/(authenticated)/admin/placements/drives/page.tsx:85-105.
- Fix: Restore debounced live search and selected-page invalidation.

## G2-8-030-020  [P2] GAP  facet F06  effort M
- Legacy: Old Create Job modal uses JobForm with selectedCollegeId bound docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:879-900.
- vNext now: New Create drive page receives adminScope/college server-side src/app/(authenticated)/admin/placements/drives/page.tsx:22-27,82-83.
- Fix: Ensure create form fields/defaults and cancellation match legacy JobForm; direct audit separately.

## G2-8-030-030  [P2] GAP  facet F09  effort M
- Legacy: Old Create/Edit opens Modal width800 destroyOnClose, JobForm footer internal docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:879-901.
- vNext now: New Create drive page not a modal, row Edit absent src/app/(authenticated)/admin/placements/drives/page.tsx:71-84.
- Fix: Restore edit/create modal or explicit full-page pattern approved.

## G2-8-030-038  [P2] GAP  facet F11  effort M
- Legacy: Old college-admin can reuse Jobs component with pinned collegeId and different basePath docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:41-46,205-220.
- vNext now: New directory only under Super Admin, college equivalent separate portal src/app/(authenticated)/admin/placements/drives/page.tsx:19-27.
- Fix: Ensure college admin actions and URL copy reviewed in college page.

## G2-8-030-042  [P2] GAP  facet F13  effort M
- Legacy: Old page shows skeleton first load and Refreshing drives badge, refresh error stale data docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:812-825.
- vNext now: New SSR ErrorState hides list on fetch fail; no stale-last-data display src/app/(authenticated)/admin/placements/drives/page.tsx:38-54.
- Fix: Provide safe cached refresh state if data current scope matches.

## G2-8-030-043  [P2] GAP  facet F13  effort M
- Legacy: Old No drives yet versus No drives match these filters, custom CTA docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:163-182.
- vNext now: New No drives found / No drives match these filters for both cases src/app/(authenticated)/admin/placements/drives/page.tsx:109-110.
- Fix: Restore first-drive CTA and distinct zero-results copy.

## G2-8-030-044  [P2] GAP  facet F13  effort M
- Legacy: Old no college warning Select a College to manage Jobs, header selector description docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:669-678.
- vNext now: New Choose a college EmptyState selected Super Admin scope instruction src/app/(authenticated)/admin/placements/drives/page.tsx:22-26.
- Fix: Match old warning text and header position.

## G2-8-030-047  [P2] GAP  facet F16  effort M
- Legacy: Old desktop table scroll x:max-content; mobile job card Title/Company/JobType/Deadline/Applicant count/ View/Edit/Open/Delete docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:614-667,823-875.
- vNext now: New DataTable responsive handling, only Open drive link per row src/app/(authenticated)/admin/placements/drives/page.tsx:59-75,109-111.
- Fix: Retain full mobile action set, click affordance and breakpoint card content.

## G2-8-030-048  [P2] GAP  facet F17  effort M
- Legacy: Old accessible row buttons aria-label View/Edit/Close/Delete job name; table aria-label Jobs table docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:571-607,846-847.
- vNext now: New shared DataTable caption All drives and accessible Open drive link src/app/(authenticated)/admin/placements/drives/page.tsx:71-75,109-110.
- Fix: Preserve per-row distinct action accessible labels.

## G2-8-030-049  [P2] GAP  facet F18  effort M
- Legacy: Old page title Jobs Management (LMS), Create Job, Search by job title or company docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:680-721.
- vNext now: New Drives, Create drive, Search by drive or company src/app/(authenticated)/admin/placements/drives/page.tsx:76-89.
- Fix: Match literal old labels for Super Admin if owner goal includes page copy.

## G2-8-030-053  [P2] GAP  facet F20  effort M
- Legacy: Old deadline parser handles legacy UTC and applicationDeadline/importantDates docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:27-39,195-203.
- vNext now: New uses Date and IST formatter; Date comparator uses <= now src/modules/placements/admin-drive-directory-model.ts:38-49; src/app/(authenticated)/admin/placements/drives/page.tsx:65-67.
- Fix: Test old deadline minute and timezone rounding, preserve fallback.

## G2-8-030-054  [P2] GAP  facet F21  effort M
- Legacy: Old JobForm and StudentPlacementLookup integrated; mutation AdminService audit/notifications docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:6-21,757-758,879-901.
- vNext now: New direct placement TPO operations read, bulk through closePlacementJob and activity events src/app/(authenticated)/admin/placements/drives/page.tsx:38-55; src/modules/placements/super-admin-bulk-drive-service.ts:74-81,100-102.
- Fix: Keep student lookup and per-action audit/notice parity.

## G2-8-030-058  [P2] GAP  facet F23  effort M
- Legacy: Old Jobs list coexists with StudentPlacementLookup and edit/delete flows docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:757-758,879-901.
- vNext now: New directory focuses review+open and links student lookup as separate page src/app/(authenticated)/admin/placements/drives/page.tsx:79-84.
- Fix: Document intentional omission or restore integrated administrative workflow.

## G2-10-016-011  [P3] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:530-545 — Deadline calendar icon gray/orange, expired strikethrough.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:73-76 — Strikethrough only, no calendar icon.
- Fix: Add calendar icon and orange expired cue.

## G2-10-016-016  [P3] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:525-528 — Absent Location '-' (ASCII hyphen).
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:72-73 — Absent locations 'Not specified'.
- Fix: Use source placeholder.

## G2-10-016-058  [P3] GAP  facet F14  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:879-901 — Create/Edit JobForm can include rich text, no media upload in list.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:93-98 — Create form is separate route.
- Fix: Keep file semantics unchanged, restore editing UI.

## G2-10-016-065  [P3] GAP  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:699-716 — Search aria-label 'Search jobs', status aria-label 'Filter by status'.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:88-105 — Inputs wrapped in textual labels, accessible but wording differs.
- Fix: Mirror accessible names when clone.

## G2-10-016-067  [P3] GAP  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:823-847 — Table aria-label 'Jobs table', precise pagination range announcement.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:105-112 — caption All drives, page controls labels differ.
- Fix: Retain Jobs table accessible naming.

## G2-8-030-014  [P3] GAP  facet F04  effort M
- Legacy: Old expired icon CalendarOutlined orange, strike-through only expired deadline docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:531-543.
- vNext now: New line-through for expired, no icon and default muted font src/app/(authenticated)/admin/placements/drives/page.tsx:65-67.
- Fix: Clone icon, color and text decoration, test minute boundary.
