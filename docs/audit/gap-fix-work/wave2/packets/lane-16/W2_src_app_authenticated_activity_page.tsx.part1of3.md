# Work packet (wave 2): edit src/app/(authenticated)/activity/page.tsx (part 1 of 3)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l18-u024-superadmin-audit-controller.md, docs/audit/gap2/lane-10/superadmin-audit.md, docs/audit/gap2/lane-8/cross-08-audit-activity-tracker-analytics.md

## G2-18-024-004  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:184-196 — bare list response plus actor/target name maps.
- vNext now: src/app/(authenticated)/activity/page.tsx:133-170 — event groups with latest/earliest rather than flat list.
- Fix: Provide flat raw audit table alongside grouped activity.

## G2-18-024-044  [P2] GAP  facet F18  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:110-112,175-179 — activity-centre important/setup/people/teaching/projects, Unknown activity category.
- vNext now: src/app/(authenticated)/activity/page.tsx:90-97 — Important/Academic setup/People & access/Teaching/Projects/Everything.
- Fix: Align chip labels and classification exactly.

## G2-10-003-001  [P2] GAP  facet F01  effort S
- Legacy: Old superadmin standalone sidebar Activity Log points to /superadmin/audit `docs/legacy-source/frontend/src/pages/superadmin/audit.js:9-20`
- vNext now: vNext activity lives at shared /activity for superadmin and college admin `src/app/(authenticated)/activity/page.tsx:48-64` `src/app/(authenticated)/activity/page.tsx:210-214`
- Fix: Preserve old deep-link redirect and selected sidebar state for superadmin Activity Log

## G2-10-003-002  [P2] GAP  facet F01  effort M
- Legacy: SuperAdminAudit uses SuperAdminLayout and PageShell title Activity Log `docs/legacy-source/frontend/src/pages/superadmin/audit.js:2-4` `docs/legacy-source/frontend/src/pages/superadmin/audit.js:12-24`
- vNext now: vNext route uses PageHeader Activity Log within authenticated shared shell `src/app/(authenticated)/activity/page.tsx:210-228`
- Fix: Match old global PageShell title sizing and canvas for admin route

## G2-10-003-004  [P2] GAP  facet F02  effort M
- Legacy: Layout starts scope info Alert then category+range toolbar and dated list `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditHub.js:9-36` `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:178-257`
- vNext now: New page has description, export/findings actions, scope status, collapsible category presets, date links, large filter form and activity list `src/app/(authenticated)/activity/page.tsx:210-251` `src/app/(authenticated)/activity/page.tsx:252-416`
- Fix: Restore old immediate category/range toolbar above feed; move advanced search to progressive disclosure

## G2-10-003-005  [P2] GAP  facet F02  effort M
- Legacy: Categories and date ranges use Antd Segmented inline bar `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:180-188`
- vNext now: Categories appear as hyperlinks inside collapsible details; date ranges separate row `src/app/(authenticated)/activity/page.tsx:237-251`
- Fix: Use legacy segmented controls with active-state styling and compact spacing

## G2-10-003-006  [P2] GAP  facet F02  effort S
- Legacy: Old scope context banner is Antd Alert with icon and description `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditHub.js:9-31`
- vNext now: New scope appears as one-line border-bottom status text `src/app/(authenticated)/activity/page.tsx:230-236`
- Fix: Render matching informational Alert banner with rich scope-specific instructions

## G2-10-003-012  [P2] GAP  facet F03  effort M
- Legacy: Old details show up to 14 payload keys and IP/When in inline dl `docs/legacy-source/frontend/src/components/admin/activity/activityText.js:100-108` `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:231-240`
- vNext now: New detail uses sanitized metadata, Entity/Action/time/grouped fields; lacks IP in feed projection `src/components/activity/activity-center.tsx:180-189` `src/app/(authenticated)/activity/page.tsx:133-170`
- Fix: Restore permitted audit IP and old When details for authorized audit viewers

## G2-10-003-019  [P2] GAP  facet F05  effort M
- Legacy: Old pagination appends next page of 50 to current feed `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:21-21` `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:74-116` `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:250-255`
- vNext now: New cursor route navigates to older 50 only; group list replaced not appended `src/app/(authenticated)/activity/page.tsx:98-131` `src/app/(authenticated)/activity/page.tsx:172-208` `src/components/activity/activity-center.tsx:197-204`
- Fix: Use append-style load more or make older-page behavior explicit to avoid losing prior context

## G2-10-003-021  [P2] GAP  facet F05  effort S
- Legacy: Old 30d default uses dayjs subtract 30 and startOf day `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:32-44` `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:60-62`
- vNext now: New defaultFrom is today minus 29 days IST `src/app/(authenticated)/activity/page.tsx:74-80`
- Fix: Align exactly old inclusive date range count and cutoff at start of day

## G2-10-003-022  [P2] GAP  facet F05  effort M
- Legacy: Old category projects matches only PROJECT PROJECT_TASK PROJECT_TEMPLATE entities `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/AdminAuditLogRepository.java:84-105`
- vNext now: New preset filters module PROJECTS, based on event taxonomy `src/app/(authenticated)/activity/page.tsx:90-97` `src/modules/activity/service.ts:535-541`
- Fix: Audit category membership and map legacy project-template actions into PROJECTS module

## G2-10-003-025  [P2] GAP  facet F06  effort S
- Legacy: Old Today 7d 30d All time segmented ranges with clear selected state `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:32-44` `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:181-185`
- vNext now: New ranges are links Today 7 days 30 days All time; selected-state styling absent from links `src/app/(authenticated)/activity/page.tsx:244-251`
- Fix: Highlight selected range and render legacy segmented labels exactly

## G2-10-003-032  [P2] GAP  facet F10  effort M
- Legacy: Old UI GET /api/v1/superadmin/audit via searchAuditLogs, query category since page size `docs/legacy-source/frontend/src/api/Services/SuperAdminAuditService.js:1-4` `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:97-107`
- vNext now: New server invokes listActivityEvents directly in server page, no GET fetch `src/app/(authenticated)/activity/page.tsx:98-131` `src/modules/activity/service.ts:504-516`
- Fix: Document backend contract mapping and match server-side category semantics

## G2-10-003-037  [P2] GAP  facet F11  effort S
- Legacy: Old scope selector supplies selected org/college and Alert explains scope `docs/legacy-source/frontend/src/pages/superadmin/audit.js:9-18` `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditHub.js:9-31`
- vNext now: New scope uses current adminScope and optional college picker; no explicit org picker on page `src/modules/activity/service.ts:422-501` `src/app/(authenticated)/activity/page.tsx:230-261`
- Fix: Restore selected-organization scope guidance in a prominent alert

## G2-10-003-039  [P2] GAP  facet F12  effort M
- Legacy: Old category and since computed on client using local day start and UTC serialization `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:39-44` `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:97-105`
- vNext now: New from/to parsed IST and local presets resolved on server `src/app/(authenticated)/activity/page.tsx:73-97` `src/modules/activity/service.ts:50-61`
- Fix: Audit cutoff inclusive milliseconds and timezone conversion at midnight IST

## G2-10-003-042  [P2] GAP  facet F13  effort S
- Legacy: Old initial scope change clears old rows and shows ListSkeleton 6 rows `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:74-95` `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:203-209`
- vNext now: New server route plus ActivityCenter renders data or EmptyState; separate loading boundary needed `src/app/(authenticated)/activity/page.tsx:98-131` `src/components/activity/activity-center.tsx:105-111`
- Fix: Ensure route loading skeleton matches six-row visual density

## G2-10-003-043  [P2] MISSING  facet F13  effort M
- Legacy: Old refresh retains previous good result and displays RefreshStatus `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:74-96` `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:195-201`
- vNext now: New URL render has no same-page refresh state or retention `src/app/(authenticated)/activity/page.tsx:98-131` `src/app/(authenticated)/activity/page.tsx:405-416`
- Fix: Add nonblocking refresh preserving current entries

## G2-10-003-044  [P2] GAP  facet F13  effort S
- Legacy: Old fetch error banner Couldn't load activity and Retry `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:117-123` `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:199-201`
- vNext now: New server component has no local retry banner in page `src/app/(authenticated)/activity/page.tsx:98-131` `src/app/(authenticated)/activity/page.tsx:210-419`
- Fix: Provide old error banner and refresh action on audit read failures

## G2-10-003-050  [P2] GAP  facet F16  effort M
- Legacy: Old Antd toolbar uses inline Segmenteds and wrapping Space `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:180-188`
- vNext now: New stacked navigation, separate advanced filter panel; md and xl grid breakpoints `src/app/(authenticated)/activity/page.tsx:237-252` `src/app/(authenticated)/activity/page.tsx:252-403`
- Fix: Match 375px 768px 1280px toolbar and responsive card controls

## G2-10-003-053  [P2] GAP  facet F17  effort S
- Legacy: Old category and range Segmented controls expose selected option `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:180-185`
- vNext now: New quick filters are links without aria-current selected state `src/app/(authenticated)/activity/page.tsx:237-251`
- Fix: Mark active preset with aria-current and selected visual state

## G2-10-003-057  [P2] GAP  facet F18  effort S
- Legacy: Legacy Refresh and Export small icon buttons `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:183-187`
- vNext now: New Export header text link and Apply filters Reset controls `src/app/(authenticated)/activity/page.tsx:215-221` `src/app/(authenticated)/activity/page.tsx:394-401`
- Fix: Restore Refresh and Export icon-button terminology and placement

## G2-10-003-058  [P2] GAP  facet F18  effort S
- Legacy: Legacy important hint Deletions and restores promotions suspensions impersonation module access and feature changes and identity views `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:189-193`
- vNext now: New hint Choose a preset then narrow by college actor or dates `src/app/(authenticated)/activity/page.tsx:240-242`
- Fix: Restore legacy important explanation when Important selected

## G2-10-003-060  [P2] GAP  facet F19  effort M
- Legacy: Legacy pageSize 50 initial and load-more appends all accumulated entries `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:20-21` `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:74-116` `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:250-255`
- vNext now: New limit 50 and cursor link replaces page, with group collapse of related records `src/app/(authenticated)/activity/page.tsx:98-131` `src/modules/activity/service.ts:698-749`
- Fix: Clarify and verify total/visible record counts for collapsed events and appended pages

## G2-10-003-063  [P2] GAP  facet F20  effort M
- Legacy: Legacy refresh keeps last successful rows when reloading same query `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:74-96` `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:117-123`
- vNext now: New navigation no explicit last-good-results retention `src/app/(authenticated)/activity/page.tsx:98-131` `src/app/(authenticated)/activity/page.tsx:405-416`
- Fix: Preserve old results on same-query transient refresh failure

## G2-8-031-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/audit.js:9-24 renders Activity Log in /superadmin/audit with SuperAdminLayout and PageShell.
- vNext now: src/app/(authenticated)/activity/page.tsx:48-64 renders /activity and redirects non Super Admin/College Admin; no legacy /superadmin/audit redirect proved.
- Fix: Add safe legacy route alias/redirect and preserve menu title 'Activity Log' under same shell.

## G2-8-031-002  [P2] GAP  facet F01  effort S
- Legacy: docs/legacy-source/frontend/src/pages/college-admin/audit.js:14-49 renders per-college Activity Log with 'View project activity' link.
- vNext now: src/app/(authenticated)/activity/page.tsx:48-64 shares /activity for College Admin; src/app/(authenticated)/activity/page.tsx:210-230 header/export does not render legacy project activity button.
- Fix: Restore college project's audit cross-link while enforcing current college scope.

## G2-8-031-005  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/AuditHub.js:9-35 starts with scope info Alert then ActivityCenter.
- vNext now: src/app/(authenticated)/activity/page.tsx:210-260 renders PageHeader and scope status plus collapsed category details; hierarchy and alert styling differ.
- Fix: Restore prominent scope banner 'Showing this college/organization/platform-wide activity' and original section order.

## G2-8-031-006  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:178-190 bar: segmented category, segmented range, Refresh, Export above feed.
- vNext now: src/app/(authenticated)/activity/page.tsx:237-338 uses accordion presets and GET form/filter panel; direct segmented bar absent.
- Fix: Use two old segmented controls in page head followed by Refresh/Export at right.

## G2-8-031-009  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:23-36 category labels Important, Academic setup, People & access, Teaching, Projects, Everything; ranges Today, 7 days, 30 days, All time.
- vNext now: src/app/(authenticated)/activity/page.tsx:90-97 preset names same but today/range shortcuts differ; src/app/(authenticated)/activity/page.tsx:237-245 categories nested instead of immediately selectable segmented buttons.
- Fix: Render direct clickable category/range chips with exact labels/selection state.

## G2-8-031-017  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:21 PAGE_SIZE=50, :74-116 append 50-event pages; category/date filter and total count.
- vNext now: src/app/(authenticated)/activity/page.tsx:98-131 lists limit50 with beforeOccurredAt/beforeId cursor; src/components/activity/activity-center.tsx:90-110 empty state.
- Fix: Preserve visible 'Load more' count and total semantics, validating 50 records against legacy page behavior.

## G2-8-031-018  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:11 DEFAULT_PAGE_SIZE=50, :114-120 allows page size changes via AntD pagination.
- vNext now: src/app/(authenticated)/activity/page.tsx:129 fixes 50 per request and cursor-based paging, no size selector in ActivityCenter.
- Fix: Expose optional 25/50/100 raw table page size; keep cursor for underlying scalability.

## G2-8-031-022  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:255-279 raw audit filter fields action key, actorUserId, organizationId, collegeId, entityId, dateRange.
- vNext now: src/app/(authenticated)/activity/page.tsx:255-390 adds module/importance/actorName/q/subjectId, no raw legacy actionKey input.
- Fix: Add exact actionKey match (eventType mapping) and optional entityId, actorId raw filters in advanced filter form.

## G2-8-031-045  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:75-96 distinguishes scope-changed loading (clear stale rows), append loading and refresh loading, skeleton and stale alert.
- vNext now: src/app/(authenticated)/activity/page.tsx:98-131 SSR blocking fetch, NC:105-110 empty state 'No meaningful activity matches these filters.'
- Fix: Provide skeleton before changed-scope results, distinct append spinner, stale refresh error.

## G2-8-031-046  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:312-335 TableSkeleton ten rows on first load, RefreshStatus on subsequent refresh.
- vNext now: src/app/(authenticated)/activity/page.tsx:48-131 server load, no equivalent component states visible here.
- Fix: Match 10-row raw audit skeleton, separate refresh from initial load.

## G2-8-031-048  [P2] GAP  facet F14  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:156-176 activity CSV filename activity-{category}-{date}.csv, columns Time,Who,What,Item,Action key,IP.
- vNext now: src/app/(authenticated)/activity/page.tsx:194-220 server-side export endpoints; output full query not just loaded rows.
- Fix: Match exact CSV headers/date formatting or offer clearly named full-range export separate from page CSV.

## G2-8-031-053  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:314-335 responsive table scroll width and raw filters wrap; docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:178-188 Segmented bar can overflow on phone.
- vNext now: src/app/(authenticated)/activity/page.tsx:237-390 collapsible forms, src/components/activity/activity-center.tsx:123-179 responsive flex with min-h-11 controls.
- Fix: Verify old/new at 375,768,1280; clone segment/text wrap and scroll affordance without shrinking taps.

## G2-8-031-055  [P2] GAP  facet F17  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:181-185 Segmented button keyboard reachable; docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:314-335 AntD Table aria row controls.
- vNext now: src/components/activity/activity-center.tsx:172-189 detail link/Disclosure focusable; presets in src/app/(authenticated)/activity/page.tsx:237 are disclosure-based.
- Fix: Use role=tablist or labeled segmented control with visible focus; announce active category and loaded count.

## G2-8-031-057  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/audit.js:14 title 'Activity Log'; docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:184-186 'Refresh'/'Export'.
- vNext now: src/app/(authenticated)/activity/page.tsx:210-220 uses 'Export' plus expandable 'Activity Log category presets'; direct Refresh absent.
- Fix: Match exact labels and primary action placement, keep improved descriptive text supplementary.

## G2-8-031-058  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:117-122 exact 'Couldn't load activity.'; NC:107-109 empty 'No meaningful activity matches these filters.'
- vNext now: src/app/(authenticated)/activity/page.tsx:48-131 can throw service error rather than inline error.
- Fix: Restore exact load error/empty copy for parity, or log intentional owner change.

## G2-8-031-063  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:74-85 queryKey for filters/scope clears stale on change; :117-126 same-query refresh keeps previous successful result.
- vNext now: src/app/(authenticated)/activity/page.tsx:98-131 reload on navigation, no same-query refresh handling.
- Fix: Retain last successful rows for refresh failure only within identical scope+filters.
