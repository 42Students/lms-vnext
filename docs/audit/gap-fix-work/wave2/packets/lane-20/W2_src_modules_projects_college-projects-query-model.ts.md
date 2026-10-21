# Work packet (wave 2): edit src/modules/projects/college-projects-query-model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u019-college-admin-project-workspaces-list.md

## G2-7-019-028  [P2] GAP  facet F05  effort S
- Legacy: workspaces/index.js:436-447 1-based visible AntD current; backend page 0-based; size default20 options10/20/50/100
- vNext now: college-projects-query-model.ts:11-17 default page1 size25; controls.tsx:144-148 includes25
- Fix: Default to 20 and offer only 10/20/50/100 to college-admin list.

## G2-7-019-057  [P2] GAP  facet F12  effort S
- Legacy: workspaces/index.js:55-73 invalid status→All and pageSize→20 while loading
- vNext now: college-projects-query-model.ts:11-44 strict parser rejects invalid value
- Fix: Normalize stale URL values to defaults rather than blocking full list.

## G2-7-019-082  [P2] GAP  facet F20  effort S
- Legacy: workspaces/index.js:55-95 URL hydration snapshots filter baseline preserving bookmarked page
- vNext now: college-projects-query-model.ts:23-44 strict URL parsing and default one-based page
- Fix: Provide legacy search/pageSize URL compatibility and preserve valid deep-page bookmarks.
