# Work packet (wave 2): edit src/app/(authenticated)/hr/drives/page.tsx

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/recruiter-drives-index.md, docs/audit/gap2/lane-2/l14-u025-recruiter-drive.md

## G2-11-003-003  [P2] GAP  facet F01  effort S
- Legacy: Changing q/tab shallow replace without scrolling `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:54`
- vNext now: vNext link-driven full server navigation `src/app/(authenticated)/hr/drives/page.tsx:150`
- Fix: Maintain scroll and filter focus state

## G2-11-003-006  [P2] GAP  facet F02  effort S
- Legacy: Legacy scroll-container + PageShell + ListingPageHeader `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:129`
- vNext now: vNext flat border sections, PageHeader `src/app/(authenticated)/hr/drives/page.tsx:101`
- Fix: Clone shell/content gutters

## G2-11-003-007  [P2] GAP  facet F02  effort S
- Legacy: All controls and rows inside recruiter-drives__workspace Card `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:142`
- vNext now: Tabs/filter/portfolio direct in page stack `src/app/(authenticated)/hr/drives/page.tsx:147`
- Fix: Restore single enclosing card

## G2-11-003-009  [P2] GAP  facet F02  effort S
- Legacy: Segmented tabs inside card toolbar `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:143`
- vNext now: Tabs outside filters/card `src/app/(authenticated)/hr/drives/page.tsx:147`
- Fix: Match toolbar

## G2-11-003-013  [P2] GAP  facet F03  effort S
- Legacy: Search only when >6 or query active `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:151`
- vNext now: VNext always shows search form `src/app/(authenticated)/hr/drives/page.tsx:159`
- Fix: Conditional search based on count

## G2-11-003-032  [P2] GAP  facet F05  effort S
- Legacy: Legacy no rows causes one PanelEmpty with in-card CTA `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:160`
- vNext now: VNext uses varying EmptyState and link below `src/app/(authenticated)/hr/drives/page.tsx:224`
- Fix: Restore shared empty-card style

## G2-11-003-033  [P2] GAP  facet F06  effort S
- Legacy: Search allowClear, URL changes per keystroke `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:151`
- vNext now: vNext Search explicit submit/reset `src/app/(authenticated)/hr/drives/page.tsx:190`
- Fix: Debounced onChange query and clear

## G2-11-003-052  [P2] GAP  facet F09  effort S
- Legacy: One Segmented control not separate filter accordion `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:144`
- vNext now: VNext details for More filters `src/app/(authenticated)/hr/drives/page.tsx:166`
- Fix: Restore one-row controls

## G2-11-003-065  [P2] GAP  facet F13  effort S
- Legacy: Account error Result warning with Retry `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:114`
- vNext now: Invalid filter ErrorState; authorization redirect `src/app/(authenticated)/hr/drives/page.tsx:56`
- Fix: Separate error states

## G2-11-003-066  [P2] GAP  facet F13  effort S
- Legacy: NoCollegeSession component with college-switch advice `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:115`
- vNext now: No active college access EmptyState/chips `src/app/(authenticated)/hr/drives/page.tsx:62`
- Fix: Match exact college-selection guidance

## G2-11-003-080  [P2] GAP  facet F16  effort S
- Legacy: PageShell workspace card padding `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:142`
- vNext now: vNext section gaps responsive `src/app/(authenticated)/hr/drives/page.tsx:101`
- Fix: Match legacy width/margins

## G2-11-003-083  [P2] GAP  facet F17  effort S
- Legacy: Ant Input.Search has clear icon keyboard `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:151`
- vNext now: Native Input type search and Reset separate `src/app/(authenticated)/hr/drives/page.tsx:164`
- Fix: Add clear control, ensure accessible label

## G2-11-003-107  [P2] GAP  facet F23  effort S
- Legacy: All row cards single list `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:189`
- vNext now: VNext pagination count and 20-page controls `src/app/(authenticated)/hr/drives/page.tsx:246`
- Fix: Decide page size

## G2-14-025-006  [P2] GAP  facet F02  effort M
- Legacy: RecruiterDriveController.java:18-21 one recruiter workspace per college
- vNext now: src/app/(authenticated)/hr/drives/page.tsx:1-55 dedicated drives plus separate HR calendar/conversations
- Fix: Clone recruiter portal headings, panel order and drive tabs.
