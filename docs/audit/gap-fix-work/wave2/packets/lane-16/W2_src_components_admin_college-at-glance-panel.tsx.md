# Work packet (wave 2): edit src/components/admin/college-at-glance-panel.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-dashboard.md, docs/audit/gap2/lane-9/superadmin-dashboard.md

## G2-10-005-026  [P2] GAP  facet F05  effort S
- Legacy: Old At a glance four statistic cards 2 per mobile row and four from sm breakpoint `docs/legacy-source/frontend/src/components/admin/dashboard/AtAGlance.js:74-90`
- vNext now: New 1-column mobile, two at 768 and four at xl `src/components/admin/college-at-glance-panel.tsx:44-50`
- Fix: Use old 2-column mobile and 4-column sm distribution

## G2-10-005-044  [P2] GAP  facet F13  effort M
- Legacy: Old glance fetch starts loading skeleton then clear errors with explicit banner `docs/legacy-source/frontend/src/components/admin/dashboard/AtAGlance.js:16-46` `docs/legacy-source/frontend/src/components/admin/dashboard/AtAGlance.js:74-88`
- vNext now: New SSR initial fetch and skeleton only when counts null AND refreshing `src/app/(authenticated)/dashboard/page.tsx:104-105` `src/components/admin/college-at-glance-panel.tsx:17-50`
- Fix: Show first-load skeleton while fetching and avoid dropping to blank cards when initial error

## G2-9-035-026  [P2] GAP  facet F05  effort S
- Legacy: Old At a glance four statistic cards 2 per mobile row and four from sm breakpoint `docs/legacy-source/frontend/src/components/admin/dashboard/AtAGlance.js:74-90`
- vNext now: New 1-column mobile, two at 768 and four at xl `src/components/admin/college-at-glance-panel.tsx:44-50`
- Fix: Use old 2-column mobile and 4-column sm distribution

## G2-9-035-044  [P2] GAP  facet F13  effort M
- Legacy: Old glance fetch starts loading skeleton then clear errors with explicit banner `docs/legacy-source/frontend/src/components/admin/dashboard/AtAGlance.js:16-46` `docs/legacy-source/frontend/src/components/admin/dashboard/AtAGlance.js:74-88`
- vNext now: New SSR initial fetch and skeleton only when counts null AND refreshing `src/app/(authenticated)/dashboard/page.tsx:104-105` `src/components/admin/college-at-glance-panel.tsx:17-50`
- Fix: Show first-load skeleton while fetching and avoid dropping to blank cards when initial error

## G2-9-035-106  [P2] GAP  facet F13  effort M
- Legacy: Legacy AtAGlance requests cancel stale result by requestRef `docs/legacy-source/frontend/src/components/admin/dashboard/AtAGlance.js:19-48`
- vNext now: New client polls 30seconds and no request sequence ID `src/components/admin/college-at-glance-panel.tsx:16-35`
- Fix: Invalidate state on collegeId change and guard stale poll response.

## G2-10-005-015  [P3] GAP  facet F03  effort S
- Legacy: Four At a glance cards have Students Faculty Courses Active drives with matching icons `docs/legacy-source/frontend/src/components/admin/dashboard/AtAGlance.js:54-59`
- vNext now: New At a glance has same four labels but no visible leading icons in ITEMS StatTile `src/components/admin/college-at-glance-panel.tsx:10-15` `src/components/admin/college-at-glance-panel.tsx:47-50`
- Fix: Add legacy icons in stat tiles while maintaining accessible labels

## G2-9-035-015  [P3] GAP  facet F03  effort S
- Legacy: Four At a glance cards have Students Faculty Courses Active drives with matching icons `docs/legacy-source/frontend/src/components/admin/dashboard/AtAGlance.js:54-59`
- vNext now: New At a glance has same four labels but no visible leading icons in ITEMS StatTile `src/components/admin/college-at-glance-panel.tsx:10-15` `src/components/admin/college-at-glance-panel.tsx:47-50`
- Fix: Add legacy icons in stat tiles while maintaining accessible labels
