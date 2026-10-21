# Work packet (wave 2): edit src/app/(authenticated)/tpo/audit/page.tsx

21 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-audit.md, docs/audit/gap2/lane-8/cross-08-audit-activity-tracker-analytics.md

## G2-11-006-002  [P2] GAP  facet F01  effort S
- Legacy: Sidebar entry label `Audit log`, entry route /tpo/audit. `docs/legacy-source/frontend/src/pages/tpo/audit.js:76`
- vNext now: Route unchanged but page title capitalized `Audit Log`. `src/app/(authenticated)/tpo/audit/page.tsx:155`
- Fix: Match exact casing and nav label.

## G2-11-006-005  [P2] GAP  facet F02  effort L
- Legacy: PageShell, ListingPageHeader, entity quick looks, bordered Card, range bar, spreadsheet. `docs/legacy-source/frontend/src/pages/tpo/audit.js:72`
- vNext now: PageHeader, four tiles, saved views, date shortcuts, tabs, form, Event history, grid, footers. `src/app/(authenticated)/tpo/audit/page.tsx:195`
- Fix: Restore exact legacy hierarchy and section order while accommodating approved additions.

## G2-11-006-006  [P2] GAP  facet F02  effort M
- Legacy: Audit workspace has radius 14 border/shadow, header 17px 18px and table padding 16px 18px 20px. `docs/legacy-source/frontend/src/styles/components/_tpo-audit.scss:42`
- vNext now: Separate sections use border strip and grid spacing rather than legacy Card. `src/app/(authenticated)/tpo/audit/page.tsx:228`
- Fix: Clone `.tpo-audit__workspace`, header and table geometry.

## G2-11-006-007  [P2] GAP  facet F02  effort S
- Legacy: Header subtitle inside secondary text; no eyebrow. `docs/legacy-source/frontend/src/pages/tpo/audit.js:76`
- vNext now: PageHeader adds `TPO · Oversight` eyebrow. `src/app/(authenticated)/tpo/audit/page.tsx:153`
- Fix: Remove eyebrow and reproduce subtitle alignment.

## G2-11-006-008  [P2] GAP  facet F03  effort M
- Legacy: `N recent events. Look at:` then up to seven entity buttons with counts. `docs/legacy-source/frontend/src/pages/tpo/audit.js:85`
- vNext now: Quick looks are four time chips; stats now four independent metrics. `src/app/(authenticated)/tpo/audit/page.tsx:221`
- Fix: Restore entity quick-look buttons, counts and placement.

## G2-11-006-009  [P2] GAP  facet F03  effort M
- Legacy: Entity button aria-pressed toggles off when clicked again. `docs/legacy-source/frontend/src/pages/tpo/audit.js:87`
- vNext now: Date chip navigation does not implement same toggle-off behavior. `src/app/(authenticated)/tpo/audit/page.tsx:225`
- Fix: Implement category press-to-toggle and clear.

## G2-11-006-017  [P2] GAP  facet F04  effort M
- Legacy: Entity mix based on loaded rows, latest and distinct actor counts computed client-side. `docs/legacy-source/frontend/src/pages/tpo/audit.js:63`
- vNext now: Full filtered source totals, decisions/changes, shares, other; no distinct actor count. `src/app/(authenticated)/tpo/audit/page.tsx:194`
- Fix: Restore unique actor and recent mix metrics with clear scope.

## G2-11-006-022  [P2] GAP  facet F05  effort M
- Legacy: Latest 500 rows shown in client grid without server page-size control. `docs/legacy-source/frontend/src/pages/tpo/audit.js:54`
- vNext now: Server page default 25, optional 50/100, Previous/Next. `src/app/(authenticated)/tpo/audit/page.tsx:338`
- Fix: Preserve visual row density and scrolling while safely paging.

## G2-11-006-025  [P2] GAP  facet F06  effort M
- Legacy: One clearable DatePicker.RangePicker; `D MMM YYYY`, placeholders From and To. `docs/legacy-source/frontend/src/pages/tpo/audit.js:110`
- vNext now: Two independent ISO DateInput fields labelled From (IST) and To (IST). `src/app/(authenticated)/tpo/audit/page.tsx:250`
- Fix: Port coupled legacy range picker and exact text.

## G2-11-006-026  [P2] GAP  facet F06  effort M
- Legacy: Date change calls setRange/load automatically. `docs/legacy-source/frontend/src/pages/tpo/audit.js:51`
- vNext now: Get form requires Apply filters and Clear filters action. `src/app/(authenticated)/tpo/audit/page.tsx:299`
- Fix: Apply range immediately while updating query state.

## G2-11-006-036  [P2] GAP  facet F09  effort M
- Legacy: Audit filter side panel trigger/title `Filter the audit log`. `docs/legacy-source/frontend/src/pages/tpo/audit.js:123`
- vNext now: Replaced by form plus Exports and Saved Views Disclosure. `src/app/(authenticated)/tpo/audit/page.tsx:169`
- Fix: Restore filter panel, overlay and chip trigger.

## G2-11-006-048  [P2] GAP  facet F12  effort S
- Legacy: Today/Week/Month/Older use dj day boundaries. `docs/legacy-source/frontend/src/pages/tpo/audit.js:20`
- vNext now: 7/30 day shortcuts compute elapsed 6/29 x 86400000ms before IST date conversion. `src/app/(authenticated)/tpo/audit/page.tsx:138`
- Fix: Subtract calendar days rather than elapsed milliseconds.

## G2-11-006-052  [P2] GAP  facet F13  effort S
- Legacy: Search/filter no match uses `No rows match the current filters`, not genuinely empty copy. `docs/legacy-source/frontend/src/components/tpo/TpoDataTable.js:126`
- vNext now: vNext total zero always says `Nothing logged yet`, even filtered. `src/app/(authenticated)/tpo/audit/page.tsx:339`
- Fix: Differentiate empty log from no filter matches.

## G2-11-006-061  [P2] GAP  facet F17  effort S
- Legacy: Quick looks role=group and buttons aria-pressed, keyboard focusable. `docs/legacy-source/frontend/src/pages/tpo/audit.js:86`
- vNext now: VNext date links in nav with selected chip styling. `src/app/(authenticated)/tpo/audit/page.tsx:226`
- Fix: Preserve accessible pressed-toggle semantics.

## G2-11-006-064  [P2] GAP  facet F18  effort S
- Legacy: Title exact `Audit log`. `docs/legacy-source/frontend/src/pages/tpo/audit.js:76`
- vNext now: New title `Audit Log` plus eyebrow. `src/app/(authenticated)/tpo/audit/page.tsx:154`
- Fix: Match capitalization and eliminate eyebrow.

## G2-11-006-066  [P2] GAP  facet F18  effort S
- Legacy: Search placeholder `Search`, filter title `Filter the audit log`, columns Actor/Event/When. `docs/legacy-source/frontend/src/pages/tpo/audit.js:121`
- vNext now: Search `What happened, job or who`, title `Audit filters`, and grid Who/When/Event. `src/app/(authenticated)/tpo/audit/page.tsx:229`
- Fix: Restore exact microcopy and labels.

## G2-11-006-067  [P2] GAP  facet F18  effort S
- Legacy: Range guidance says `The latest ... events. Pick dates to see everything in a period.` `docs/legacy-source/frontend/src/pages/tpo/audit.js:111`
- vNext now: New page says `Showing X–Y of Z records` and `Most recent first · IST`. `src/app/(authenticated)/tpo/audit/page.tsx:321`
- Fix: Retain original range guidance and incomplete-export advice.

## G2-8-031-003  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/audit.js:15-18 deep links to /tpo/drives/{id}, recruiter leads and students.
- vNext now: src/modules/placements/tpo-audit-service.ts:579-581 creates entityHref from normalized subject; src/app/(authenticated)/tpo/audit/page.tsx:166-171 still Audit Log.
- Fix: Map old action entity links to new equivalent and preserve default visible link action per row.

## G2-8-031-011  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/tpo/audit.js:80-118 quick looks for Drives, Recruiters, Students, Offers, Rounds, Shares, Settings, Bulk, General.
- vNext now: src/app/(authenticated)/tpo/audit/page.tsx:166-180 dedicated Actor/entity filters and CSV navigation; subject types summarized by src/modules/placements/tpo-audit-service.ts:557-581.
- Fix: Show one-click TPO quick-look chips and active selection indicators in page header.

## G2-8-031-024  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/audit.js:17-26 four audited dimensions for filters with when quick range chips.
- vNext now: src/app/(authenticated)/tpo/audit/page.tsx:166-180 offers deep actor/entity filters; source view may require extra click.
- Fix: Keep first-class filter drawer and one-click entity chips accessible without route navigation.

## G2-11-006-028  [P3] GAP  facet F06  effort S
- Legacy: Legacy grid global search placeholder `Search`. `docs/legacy-source/frontend/src/components/tpo/TpoDataTable.js:137`
- vNext now: Top search placeholder `What happened, job or who`. `src/app/(authenticated)/tpo/audit/page.tsx:276`
- Fix: Match input copy.
