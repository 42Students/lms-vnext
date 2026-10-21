# Work packet (wave 2): edit src/app/(authenticated)/admin/placements/drives/page.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-all.md, docs/audit/gap2/lane-11/l17-u030-drives-landing.md, docs/audit/gap2/lane-8/super-admin-jobs-directory.md

## G2-10-016-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/all.js:10-14,32-39 — Secondary flat list accessed from primary Drives card-grid landing, within SuperAdminGroupShell placements.
- vNext now: src/app/(authenticated)/admin/placements/page.tsx:50-76; src/app/(authenticated)/admin/placements/drives/page.tsx:68-80 — vNext has full directory secondary to placement overview, but heading/tab shell different.
- Fix: Restore group shell and quiet 'All drives' return.

## G2-10-016-002  [P2] GAP  facet F01  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/all.js:16-29 — Missing selected scope shows warning 'Select a college to continue' plus Organization + College guidance.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:17-20 — EmptyState 'Choose a college', no Ant warning.
- Fix: Use exact warning message/colors.

## G2-10-016-004  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:671-681 — College-scoped Jobs header title 'Jobs', not generic platform Jobs Management.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:70-82 — Heading 'Drives' with subtitle, placement overview back.
- Fix: Reproduce legacy header in clone mode while retaining directory title as needed.

## G2-10-016-005  [P2] GAP  facet F02  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:669-757 — Header search, status, Create Job, then inline StudentPlacementLookup, table/card, modal.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:68-112 — Header actions include Placement overview, Student lookup link and Create drive; form separate below; no embedded lookup.
- Fix: Match vertical rhythm and embedded student lookup, or document intentional separation.

## G2-10-016-006  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:723-754 — Selection >0 reveals blue (#e6f4ff) bulk strip below header.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:109-112; src/components/placements/super-admin-bulk-drive-actions.tsx:46-70 — Bulk Open/Close collapsed disclosure separate from table.
- Fix: Show selected count and visible blue action strip.

## G2-10-016-007  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:823-875 — Desktop wide Ant Table; mobile distinct list of cards and simple Pagination.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:108-112 — Single responsive DataTable with collapsed fields.
- Fix: Restore desktop table vs mobile card designs.

## G2-10-016-008  [P2] GAP  facet F02  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:879-901 — Create/Edit Job Modal width800, JobForm in overlay.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:95-98 — Create route /admin/placements/new, Edit from job workspace.
- Fix: Match modal transition/focus and return-to-list.

## G2-10-016-009  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:495-514 — Job title 220px, status badge BEFORE title, company name small below.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:66-70 — Title and company span, status badge AFTER company in same flex row.
- Fix: Align badge/title/company visual hierarchy.

## G2-10-016-010  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:516-520 — Job Type is colored Tag via getJobTypeTag.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:71-72 — Type plain employmentType string.
- Fix: Render Ant-like type Tag.

## G2-10-016-013  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:699-722 — Search input has placeholder 'Search by job title or company' and Create Job button.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:88-105 — Label Search by drive or company, no placeholder; Create drive →.
- Fix: Match exact labels/icons.

## G2-10-016-014  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:778-821 — Errors as red Alert/Retry, yellow stale warning, status retry warnings.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:32-60 — Server ErrorState with Retry on total load but no last-good warnings or specific status retry.
- Fix: Add stale-list and mutation retry states.

## G2-10-016-017  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:549-555 — Posted date uses postedDate or createdAt, format DD MMM YYYY.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:77-78 — Uses publishedAt only; drafts with no publish become em dash.
- Fix: For drafts fallback createdAt matching legacy posted convention.

## G2-10-016-018  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:557-563 — Applicant count from `applicationCount ?? applicantCount`, unknown is '—'.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:79-80 — Uses metrics.submittedApplications count always, may be zero/unavailable distinction.
- Fix: Render unavailable count as unknown, not fabricated zero.

## G2-10-016-019  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:565-611 — Actions fixed right width250, with icon labels/confirmation.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:80-85 — No fixed actions; only Open drive text.
- Fix: Restore fixed right actions and confirm affordances.

## G2-10-016-022  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:118-135 — Search debounced ~400ms auto-updates router, resets page; status filter instant.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:87-105 — Server GET requires manual Filter submit.
- Fix: Restore debounce/auto-filter or mark deliberate change.

## G2-10-016-024  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:827-845 — Ant size changer 10/20/50/100, count as 'first-last of total'.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:106-112 — PageSize chooser exists 10/20/50/100; count 'N matching drives · Page i of j'.
- Fix: Display visible item range and chosen page size.

## G2-10-016-027  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:314-333 — View Applications deep link opens job applications preserving college context.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:82-84 — Open drive links overview first.
- Fix: Provide direct Applications link.

## G2-10-016-041  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:879-901 — Create/Edit full JobForm is Modal width800; closes on cancel and success.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:93-96 — Separate route for create, edit in nested workspace.
- Fix: Restore modal workflow and focus if strict clone.

## G2-10-016-042  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:163-186 — Empty drives PanelEmpty has CTA Create drive or Clear filters.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:109-112 — New EmptyState no CTA, clear is separate link.
- Fix: Use matching empty CTA.

## G2-10-016-049  [P2] GAP  facet F11  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/all.js:32-39 — JobsErrorBoundary controls errors while preserving group shell.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:17-20 — App Router page errors show ErrorState for operation fetch.
- Fix: Match group shell and recoverability.

## G2-10-016-053  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:763-781 — Fetch failure red-bordered error card with CloseCircleOutlined48 and Try Again.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:42-60 — ErrorState 'Drives unavailable' and Retry loading drives.
- Fix: Clone legacy error card icon, text, and retry style.

## G2-10-016-056  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:163-186 — No drives yet / No drives match these filters with create/clear CTA.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:109-112 — Single No drives found / No drives match these filters.
- Fix: Differentiate no data vs filtered empty.

## G2-10-016-063  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:699-722 — Search width260, status Select width120, wrap header with Create Job.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:88-105 — Grid with search, status, rows/page, Filter/Clear all.
- Fix: Match exact widths, spacing and breakpoint.

## G2-10-016-066  [P2] MISSING  facet F17  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:572-606 — Per-row View/Edit/Close/Delete aria-label includes job title.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:80-85 — Only link Open drive →, no distinct operation labels.
- Fix: Restore action names with contextual title.

## G2-10-016-068  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/all.js:16-26 — No college warning message 'Select a college to continue' description 'Drives is college-scoped...'.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:17-20 — 'Choose a college', different copy.
- Fix: Copy exact warning.

## G2-10-016-069  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:680-722 — Page heading 'Jobs', primary button 'Create Job', search placeholder 'Search by job title or company'.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:88-105 — Heading Drives, 'Create drive →', 'Search by drive or company'.
- Fix: Align three strings exactly.

## G2-10-016-070  [P2] GAP  facet F18  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:572-608 — Actions 'View Applications', 'Edit', 'Close'/'Open', 'Delete'.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:82-84 — Only Open drive →.
- Fix: Restore exact labels in desktop row.

## G2-10-016-071  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:163-186 — Empty 'No drives yet', 'Create drive' or 'Clear filters'.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:109-112 — Always 'No drives found' and no adjacent CTA.
- Fix: Match copy and controls.

## G2-10-016-074  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:163-186 — Desktop table 20 rows initial default.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:106-112 — Directory defaults10 rows, doubling paging.
- Fix: Set default20 and proper range.

## G2-10-016-079  [P2] GAP  facet F21  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:757-759 — StudentPlacementLookup embedded directly above drive table.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:71-80 — A header link opens separate student-lookup route.
- Fix: Restore inline lookup or intentional design exception.

## G2-10-016-080  [P2] GAP  facet F21  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:879-901 — JobForm modal handles create/edit in place.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:93-98 — Create/Edit separate page/workspace.
- Fix: Align screen interactions and referrer/scroll.

## G2-10-016-081  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:485-565 — Legacy job fields isDraft/isActive, postedDate, jobType, applicationCount, deadline.
- vNext now: src/modules/placements/admin-drive-directory-model.ts:44-48; src/app/(authenticated)/admin/placements/drives/page.tsx:65-80 — UUID normalized placementJobs/status, applicant metric count.
- Fix: Project exact status/date and nullable applicant count, no fabricated defaults.

## G2-10-016-084  [P2] GAP  facet F23  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/all.js:10-14; docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:669-757 — All drives is secondary flat table, selected college, old Jobs look.
- vNext now: src/app/(authenticated)/admin/placements/page.tsx:50-76; src/app/(authenticated)/admin/placements/drives/page.tsx:68-105 — Secondary flat list exists, but table appearance and toolbar differ.
- Fix: Clone list shell/controls rather than invent new module.

## G2-17-030-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy shared component under `/superadmin/jobs` and `/college-admin/jobs`, basePath preserved for all internal links; DrivesLanding.js:47-51,227-232
- vNext now: vNext `/admin/placements` overview and `/admin/placements/drives` directory, college equivalent `/college/placements`; admin/placements/page.tsx:22-86; admin/placements/drives/page.tsx:16-115
- Fix: Preserve legacy job landing deep links and contextual returnTo across selected admin/college roles.

## G2-17-030-014  [P2] GAP  facet F04  effort M
- Legacy: Search q from URL, client filters title/company only loaded 60 active; DrivesLanding.js:62-64,204-208
- vNext now: vNext quick search separate from portfolio with full operations data and directory q in form; placement-operations-overview.tsx:95-105; admin/placements/drives/page.tsx:83-103
- Fix: Place search next to Active drives heading and preserve query param/empty/result-count behavior.

## G2-17-030-017  [P2] GAP  facet F04  effort M
- Legacy: Dates: array [year,month,day] vs UTC input parsed moment local; DrivesLanding.js:30-39,560-563
- vNext now: vNext uses Date and en-IN format Asia/Kolkata; admin/placements/drives/page.tsx:71-79
- Fix: Normalize dates to DD MMM on cards, YYYY-MM-DD HH:mm modal and IST boundary without array off-by-one.

## G2-17-030-020  [P2] GAP  facet F05  effort M
- Legacy: Legacy `Search by drive or company` Input.Search 240px, allowClear and URL shallow replace; DrivesLanding.js:215-225,485-492
- vNext now: Admin directory search full-width form with Filter/Clear all, quick search separate; admin/placements/drives/page.tsx:88-105; placement-operations-overview.tsx:95-99
- Fix: Clone instant shallow q/search clear and 240px desktop width near Active drives.

## G2-8-030-001  [P2] GAP  facet F01  effort M
- Legacy: Old Jobs component embedded in SuperAdmin/college admin placements, basePath /superadmin default docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:41-46.
- vNext now: New /admin/placements/drives selected college page, back link Placement overview src/app/(authenticated)/admin/placements/drives/page.tsx:19-27,76-84.
- Fix: Preserve old nav label Jobs Management (LMS) and college admin route/link compatibility.

## G2-8-030-002  [P2] GAP  facet F01  effort M
- Legacy: Old View Applications link /superadmin/jobs/{id}/applications?type=lms&collegeId with returnTo docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:324-332.
- vNext now: New row action links /admin/placements/jobs/{uuid} not direct Applications src/app/(authenticated)/admin/placements/drives/page.tsx:71-74.
- Fix: Restore direct View Applications deep link preserving filter/context.

## G2-8-030-003  [P2] GAP  facet F01  effort M
- Legacy: Old Create Job opens 800px modal in same screen docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:314-317,879-900.
- vNext now: New Create drive → navigates /admin/placements/new page src/app/(authenticated)/admin/placements/drives/page.tsx:80-84.
- Fix: Match modal entry or restore equivalent back/return context from new page.
