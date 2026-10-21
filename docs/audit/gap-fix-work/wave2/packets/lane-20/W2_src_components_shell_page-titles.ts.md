# Work packet (wave 2): edit src/components/shell/page-titles.ts

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/cross-22-copy-time-accessibility.md, docs/audit/gap2/lane-2/l12-u031-global-shell.md

## G2-2-037-002  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/utils/pageTitle.js:18-35 TPO title from sidebar
- vNext now: src/components/shell/page-titles.ts:71-93 lacks TPO/HR title resolver
- Fix: Implement role-appropriate page title for TPO/HR including detail routes.

## G2-2-037-028  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/utils/pageTitle.js:15-28 TPO page title derived from nav
- vNext now: src/components/shell/page-titles.ts:71-93 TPO not handled
- Fix: Use sidebar-derived title function for TPO pages.

## G2-2-037-031  [P2] GAP  facet F11  effort S
- Legacy: docs/legacy-source/frontend/src/utils/pageTitle.js:18-35 page title fallback label route
- vNext now: src/components/shell/page-titles.ts:63-93 routes fallback null for unrecognized learn/teacher
- Fix: Restore titleizeRouteSegment fallback on dynamic child routes.

## G2-2-037-055  [P2] GAP  facet F20  effort S
- Legacy: docs/legacy-source/frontend/src/utils/pageTitle.js:4-12 titleize removes bracket route parameters
- vNext now: src/components/shell/page-titles.ts:56-60 titleCase hyphen/underscore but may show dynamic IDs
- Fix: Ensure dynamic route keys never display raw UUIDs in document title.

## G2-2-037-062  [P2] GAP  facet F23  effort S
- Legacy: docs/legacy-source/frontend/src/utils/pageTitle.js:18-28 route fallback titleizes last segment
- vNext now: src/components/shell/page-titles.ts:81-93 unknown learn/teacher title null
- Fix: Restore fallback for valid detail routes while masking IDs.

## G2-12-031-004  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/utils/pageTitle.js:18-35 route-derived browser title
- vNext now: src/components/shell/page-titles.ts:63-105 lacks specific TPO/HR cases
- Fix: Resolve dynamic portal titles from current sidebar route and context.

## G2-12-031-063  [P2] GAP  facet F20  effort S
- Legacy: docs/legacy-source/frontend/src/utils/pageTitle.js:4-12 strips parameterized path labels
- vNext now: src/components/shell/page-titles.ts:56-60 titleCase unknown segment
- Fix: Mask ID-like routes in browser title, don't leak raw UUID.

## G2-2-037-001  [P3] GAP  facet F01  effort S
- Legacy: docs/legacy-source/frontend/src/common/constant.js:11-29 learner/faculty path title map
- vNext now: src/components/shell/page-titles.ts:11-23 shared route title map
- Fix: Cover legacy fileExplorer,assessments,careerCalendar/interviews titles where routes still exist.

## G2-2-037-016  [P3] GAP  facet F05  effort S
- Legacy: docs/legacy-source/frontend/src/common/constant.js:31-60 admin route title keys and labels
- vNext now: src/components/shell/page-titles.ts:25-54 new map omits legacy hiring-dashboard/notifications
- Fix: Map missing legacy titles to active routes explicitly.

## G2-2-037-050  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/common/constant.js:24-25 'Career Calendar', 'My Applications'
- vNext now: src/components/shell/page-titles.ts:11-23 no matching route titles
- Fix: Add active legacy route titles where page survives in vNext.
