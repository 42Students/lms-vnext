# Work packet (wave 2): edit src/app/(authenticated)/admin/electives/page.tsx

27 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-electives.md

## G2-10-006-001  [P2] GAP  facet F01  effort M
- Legacy: Superadmin route /superadmin/electives uses academic group strip only in selected college scope `docs/legacy-source/frontend/src/pages/superadmin/electives.js:7-25`
- vNext now: New route /admin/electives renders PageHeader and standalone Electives content `src/app/(authenticated)/admin/electives/page.tsx:19-41`
- Fix: Preserve legacy route redirect and Academic Setup grouped tab selection

## G2-10-006-002  [P2] GAP  facet F01  effort S
- Legacy: Without college old shows Antd warning Alert only and no academic tabs `docs/legacy-source/frontend/src/pages/superadmin/electives.js:9-18`
- vNext now: New without college shows PageHeader then EmptyState with same copy `src/app/(authenticated)/admin/electives/page.tsx:35-40`
- Fix: Use warning alert with icon and the original compact 16px margin

## G2-10-006-003  [P2] GAP  facet F01  effort M
- Legacy: College switch keys ElectivesConsole by selectedCollegeId forcing full reset `docs/legacy-source/frontend/src/pages/superadmin/electives.js:19-23` `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:77-123`
- vNext now: New server page driven by adminScope but filters preserved as URL parameters `src/app/(authenticated)/admin/electives/page.tsx:19-34`
- Fix: Reset stale program/status/search filters when changing colleges

## G2-10-006-004  [P2] GAP  facet F02  effort M
- Legacy: Old console top toolbar search filters refresh and New slot followed by explainer alert and Table `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:230-259`
- vNext now: New first displays New slot form, filter form, Refresh, stats, articles, final overview link `src/app/(authenticated)/admin/electives/page.tsx:35-110`
- Fix: Match toolbar action order and prominent table before per-slot management

## G2-10-006-005  [P2] GAP  facet F02  effort M
- Legacy: Old selected slot opens interactive ElectiveSlotPanel underneath Table `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:257-260`
- vNext now: New each item embeds Slot details, Slot management and Manage offerings disclosures `src/app/(authenticated)/admin/electives/page.tsx:79-106`
- Fix: Restore one-at-a-time selected slot panel to reduce long multi-row expansion

## G2-10-006-008  [P2] MISSING  facet F03  effort S
- Legacy: Old Slot field shows description in small muted subtitle under name `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:204-207`
- vNext now: New row title renders name only, description only available in edit form `src/app/(authenticated)/admin/electives/page.tsx:80-98`
- Fix: Show description beneath slot name

## G2-10-006-009  [P2] GAP  facet F03  effort S
- Legacy: Old Pick column renders one number when min=max or min–max `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:211-214`
- vNext now: New Slot details shows separate Minimum picks and Maximum picks values `src/app/(authenticated)/admin/electives/page.tsx:86-93`
- Fix: Add compact Pick summary matching old interval convention

## G2-10-006-011  [P2] GAP  facet F03  effort M
- Legacy: Old right actions Open, Edit and conditional Archive visible, even with no panel expanded `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:216-224`
- vNext now: New all actions hidden inside Slot management disclosure, offering manager beneath row `src/app/(authenticated)/admin/electives/page.tsx:94-105`
- Fix: Expose legacy visible Open/Edit/Archive action cluster

## G2-10-006-012  [P2] MISSING  facet F03  effort S
- Legacy: Old top informational Alert explains slot is one elective choice and semester eligibility `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:247-248`
- vNext now: New lacks long intro alert and only short PageHeader description `src/app/(authenticated)/admin/electives/page.tsx:35-40`
- Fix: Restore complete slot concept help banner beneath toolbar

## G2-10-006-018  [P2] GAP  facet F05  effort S
- Legacy: Old slot search placeholder Search slots `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:231-244`
- vNext now: New search input placeholder Slot or program `src/app/(authenticated)/admin/electives/page.tsx:42-45`
- Fix: Restore Search slots placeholder

## G2-10-006-019  [P2] GAP  facet F05  effort M
- Legacy: Old status filter labels Active only and Incl. archived with boolean includeArchived `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:239-243`
- vNext now: New enum Status Active Archived All, which when Archived hides active records `src/app/(authenticated)/admin/electives/page.tsx:47-51` `src/modules/electives/admin-directory-model.ts:2-6`
- Fix: Offer inclusive Active only vs Incl. archived toggle; keep archived-only as additional advanced filter

## G2-10-006-020  [P2] GAP  facet F05  effort S
- Legacy: Old program dropdown placeholder Program searchable and width200, semester dropdown Sem N width110 `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:237-242`
- vNext now: New Program and Semester hidden in More filters with All programs/All semesters options `src/app/(authenticated)/admin/electives/page.tsx:53-68`
- Fix: Keep Program/Semester quick controls visible and searchable inline

## G2-10-006-022  [P2] GAP  facet F05  effort M
- Legacy: Old Table defaults 20 per page with fixed size `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:257-258`
- vNext now: New caps results at 200, no pagination or next action `src/modules/electives/admin-directory-service.ts:47-50` `src/app/(authenticated)/admin/electives/page.tsx:107-108`
- Fix: Implement 20-row pagination across every matching slot and accurate total counts

## G2-10-006-049  [P2] GAP  facet F11  effort S
- Legacy: Old selected college reset component state on scope switches `docs/legacy-source/frontend/src/pages/superadmin/electives.js:19-23` `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:77-123`
- vNext now: New server contextual collegeId, but URL program and semester IDs may persist across scope switch `src/app/(authenticated)/admin/electives/page.tsx:19-34`
- Fix: Clear invalid cross-college URL filters and avoid stale selected slot refs

## G2-10-006-054  [P2] GAP  facet F13  effort M
- Legacy: Old list has Antd loading spinner and lookup error alert, Retry slots `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:30-71` `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:247-258`
- vNext now: New SSR list directly shows results; invalid filter ErrorState with Clear filters, no slot query retry button `src/app/(authenticated)/admin/electives/page.tsx:19-34` `src/app/(authenticated)/admin/electives/page.tsx:79-108`
- Fix: Restore loading skeleton, direct Retry slots and lookup error banner

## G2-10-006-055  [P2] GAP  facet F13  effort S
- Legacy: Old no slots message No elective slots yet. Create one per program × semester, e.g. Professional Elective 1. `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:257-258`
- vNext now: New No elective slots No persisted elective slots match current college and filters. `src/app/(authenticated)/admin/electives/page.tsx:106-107`
- Fix: Restore exact no-data copy and separate filtered-empty wording

## G2-10-006-056  [P2] GAP  facet F13  effort S
- Legacy: Old failed load table empty Could not load elective slots; use Retry above. `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:253-258`
- vNext now: New error may propagate to route boundary instead of inline list message `src/app/(authenticated)/admin/electives/page.tsx:30-34` `src/app/(authenticated)/admin/electives/page.tsx:79-108`
- Fix: Show inline failed-load message and retry in same page context

## G2-10-006-059  [P2] GAP  facet F16  effort M
- Legacy: Old Table 20 per page x-scrolling via Antd on narrower view; toolbar wraps `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:230-258`
- vNext now: New article list all up to 200 with no responsive table overflow `src/app/(authenticated)/admin/electives/page.tsx:79-108`
- Fix: Restore scrollable table with legacy 20-row page controls on 375 and 768px

## G2-10-006-060  [P2] GAP  facet F16  effort M
- Legacy: Old New slot and filters inline toolbar; nested modal works within mobile viewport `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:230-245` `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:262-312`
- vNext now: New control forms grid min2 columns from md and inline 920px editor `src/app/(authenticated)/admin/electives/page.tsx:42-70` `src/components/electives/college-slot-manager.tsx:97-136`
- Fix: Preserve mobile 44px tap targets while matching compact desktop toolbar and modal dialog

## G2-10-006-061  [P2] GAP  facet F17  effort S
- Legacy: Old slot name button opens selected details panel, table actions keyboard accessible `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:204-225`
- vNext now: New each article heading non-clickable; disclosures keyboard native `src/app/(authenticated)/admin/electives/page.tsx:79-106`
- Fix: Add semantic Open button on slot title, with keyboard focus and expanded state

## G2-10-006-065  [P2] GAP  facet F18  effort S
- Legacy: Old New slot and Search slots; selector Active only / Incl. archived `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:231-245`
- vNext now: New New elective slot, Search Slot or program, Status Active/Archived/All `src/components/electives/college-slot-manager.tsx:91-96` `src/app/(authenticated)/admin/electives/page.tsx:42-52`
- Fix: Use old short New slot and Search slots labels, and inclusive archive selector

## G2-10-006-066  [P2] MISSING  facet F18  effort S
- Legacy: Old info copy slot is one elective choice and pick 1 of these 3 courses `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:247-248`
- vNext now: New PageHeader only Manage elective slots and their offerings for this college `src/app/(authenticated)/admin/electives/page.tsx:35-37`
- Fix: Restore full explanatory help text

## G2-10-006-068  [P2] GAP  facet F18  effort S
- Legacy: Old actions Open Edit Archive and save Create or Save `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:216-224` `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:262-264`
- vNext now: New Slot management disclosure, Confirm create/Confirm update `src/app/(authenticated)/admin/electives/page.tsx:94-105` `src/components/electives/college-slot-manager.tsx:126-130`
- Fix: Restore concise action labels in visible toolbar and dialog

## G2-10-006-070  [P2] GAP  facet F19  effort M
- Legacy: Old each slot offers one detailed selected panel with offerings roster and allocation `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:228-260` `docs/legacy-source/frontend/src/components/admin/electives/ElectiveSlotPanel.jsx:10-26`
- vNext now: New per-row Manage offerings and separate roster route; no single selected drilldown `src/app/(authenticated)/admin/electives/page.tsx:94-106` `src/components/electives/college-elective-offering-manager.tsx:119-134`
- Fix: Restore coherent single-slot drilldown path and detailed roster state

## G2-10-006-010  [P3] GAP  facet F03  effort S
- Legacy: Old active status uses green Antd Tag and Archived neutral `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:213-215`
- vNext now: New uses StatusBadge success/neutral with legacyAcademicStatus `src/app/(authenticated)/admin/electives/page.tsx:82-84`
- Fix: Match legacy tag padding, type weight, colors and dimensions

## G2-10-006-063  [P3] GAP  facet F17  effort S
- Legacy: Old errors show Antd showIcon Alerts with Retry button `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:247-255`
- vNext now: New generic EmptyState for no college and error for invalid filters `src/app/(authenticated)/admin/electives/page.tsx:25-40`
- Fix: Restore accessible warning and error alerts in the corresponding states

## G2-10-006-067  [P3] GAP  facet F18  effort S
- Legacy: Old dropdown Sem 1...Sem 12 `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:239-241`
- vNext now: New Semester dropdown numeric 1...12 `src/app/(authenticated)/admin/electives/page.tsx:61-66`
- Fix: Restore Sem N visible option labels
