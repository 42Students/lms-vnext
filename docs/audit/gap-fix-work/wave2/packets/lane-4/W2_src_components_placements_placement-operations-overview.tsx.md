# Work packet (wave 2): edit src/components/placements/placement-operations-overview.tsx

16 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l17-u030-drives-landing.md, docs/audit/gap2/lane-6/l17-u030-superadmin-drives-landing.md

## G2-17-030-002  [P2] GAP  facet F01  effort M
- Legacy: Page head Placement Drives, four KPIs, New drive, All drives; DrivesLanding.js:248-263
- vNext now: Admin placements has Drives header/New drive only, 4 metrics nested in operations overview; admin/placements/page.tsx:61-84; placement-operations-overview.tsx:31-44
- Fix: Consolidate old header, four KPI layout and both actions above attention rather than split main and directory.

## G2-17-030-004  [P2] GAP  facet F02  effort L
- Legacy: Section order: header metrics, global Placements policy, Needs attention, Active drives grid, All drives link, retention disclosure, student lookup; DrivesLanding.js:246-263,264-388,390-655
- vNext now: vNext head, oversight nav, Related directories, operations metrics, attention, funnel, upcoming rounds, search, job portfolio, policy; admin/placements/page.tsx:61-86; placement-operations-overview.tsx:31-109
- Fix: Restore old order/spacing; move extra funnel/upcoming/season into separate secondary sections after active drive cards.

## G2-17-030-009  [P2] GAP  facet F03  effort S
- Legacy: Four KPI labels Active drives, Needs attention, Closed / draft, All drives in that order; DrivesLanding.js:251-256
- vNext now: vNext Active drives, Closed / draft, All drives, Needs attention + second Live jobs metrics strip; placement-operations-overview.tsx:33-44
- Fix: Match metric order, remove duplicated top four-stat strip from direct view, keep extra KPIs below.

## G2-17-030-010  [P2] MISSING  facet F03  effort S
- Legacy: Active card avatar 40px, job title ellipsis, company secondary 12px; DrivesLanding.js:540-545
- vNext now: vNext portfolio row plain text job/company, no company avatar; placement-operations-overview.tsx:101-106
- Fix: Reintroduce 40px company logo/initials and two-line identity/card title truncation.

## G2-17-030-011  [P2] GAP  facet F03  effort M
- Legacy: Applicants Tag blue if count>0, gray if 0; deadline calendar icon/`DD MMM`, attention gold badge with descriptive aria-label; DrivesLanding.js:546-563
- vNext now: vNext portfolio plain `{count} applications`, status badge and rounds; placement-operations-overview.tsx:101-106
- Fix: Add applicants Tag, calendar icon/date and amber attention bubble to active cards.

## G2-17-030-014  [P2] GAP  facet F04  effort M
- Legacy: Search q from URL, client filters title/company only loaded 60 active; DrivesLanding.js:62-64,204-208
- vNext now: vNext quick search separate from portfolio with full operations data and directory q in form; placement-operations-overview.tsx:95-105; admin/placements/drives/page.tsx:83-103
- Fix: Place search next to Active drives heading and preserve query param/empty/result-count behavior.

## G2-17-030-019  [P2] GAP  facet F05  effort S
- Legacy: Active grid New Drive and All drives secondary, archive count `including N closed/draft`; DrivesLanding.js:485-495,593-597
- vNext now: Admin page has New drive top and separate `/admin/placements/drives` full table; placement-operations-overview.tsx:100-107
- Fix: Add adjacent All drives link and archive count wording in landing at both header/footer.

## G2-17-030-020  [P2] GAP  facet F05  effort M
- Legacy: Legacy `Search by drive or company` Input.Search 240px, allowClear and URL shallow replace; DrivesLanding.js:215-225,485-492
- vNext now: Admin directory search full-width form with Filter/Clear all, quick search separate; admin/placements/drives/page.tsx:88-105; placement-operations-overview.tsx:95-99
- Fix: Clone instant shallow q/search clear and 240px desktop width near Active drives.

## G2-17-030-046  [P2] GAP  facet F16  effort M
- Legacy: Ant grid xs24 sm12 lg8 xl6, 40px avatar and 16px gaps; DrivesLanding.js:522-542
- vNext now: vNext portfolio linear and responsive divider; placement-operations-overview.tsx:100-107
- Fix: Test 320/600/992/1200 breakpoint card cols 1/2/3/4 with exact padding/radius.

## G2-17-030-048  [P2] GAP  facet F17  effort S
- Legacy: Attention rows role=button tabIndex0 + Enter/Space; drive card role=button tabIndex0, nested dropdown stopPropagation; DrivesLanding.js:421-434,526-537,565-584
- vNext now: vNext attention semantic Link and portfolio `Open drive` Link; super-admin-needs-attention.tsx:22-26; placement-operations-overview.tsx:103-106
- Fix: Preserve keyboard destination and non-nesting; focus ring/aria on restored card action dropdown.

## G2-17-030-049  [P2] MISSING  facet F17  effort S
- Legacy: Attention Badge aria-label `Drive status: N item(s) need attention`, More actions aria-label; DrivesLanding.js:546-550,583
- vNext now: vNext no card badge/dropdown in portfolio; placement-operations-overview.tsx:100-107
- Fix: Add accessible attention badge and menu button label on new cards.

## G2-17-030-050  [P2] GAP  facet F18  effort S
- Legacy: Legacy labels `Placement Drives`, `New Drive`, `All drives`, `Active drives (N)`; DrivesLanding.js:248-263,461-495
- vNext now: vNext `Drives`, `New drive`, `Job portfolio` and `Open drive`; admin/placements/page.tsx:60-75; placement-operations-overview.tsx:100-106
- Fix: Restore exact capitalization and headings for cloned landing.

## G2-17-030-067  [P2] GAP  facet F17  effort M
- Legacy: Legacy active card has keyboard Enter/Space support and controls stop propagation. `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:526`
- vNext now: vNext each portfolio row has Open drive link, no card-level activation. `src/components/placements/placement-operations-overview.tsx:102`
- Fix: Restore full-card keyboard navigation while excluding action menu nested button events.

## G2-17-030-068  [P2] GAP  facet F17  effort S
- Legacy: Legacy attention badge includes aria-label Drive status: X item(s) need attention. `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:546`
- vNext now: vNext portfolio no attention badge or accessible count. `src/components/placements/placement-operations-overview.tsx:102`
- Fix: Add accessible attention count label and live count semantics.

## G2-17-030-074  [P2] MISSING  facet F19  effort M
- Legacy: Legacy retention report lazy, sampleTruncatedAt200. `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:623`
- vNext now: vNext has no report, no lazy/cap logic. `src/components/placements/placement-operations-overview.tsx:100`
- Fix: Add on-demand capped retention reporting and pagination/export outside landing.

## G2-17-030-047  [P3] GAP  facet F16  effort S
- Legacy: Search 240px on desktop; wrap New Drive, title row flex-wrap gap12; DrivesLanding.js:461-495
- vNext now: vNext quick search separated and page header one CTA; placement-operations-overview.tsx:95-105; admin/placements/page.tsx:61-75
- Fix: Restore desktop 240px search and action wrap at 320px; compare screenshots.
