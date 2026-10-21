# Work packet (wave 2): edit src/app/(authenticated)/admin/features/[collegeId]/page.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-module-access.md, docs/audit/gap2/lane-4/superadmin-module-access.md

## G2-10-019-002  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/module-access.js:14-23 — PageShell title Module Access wraps hierarchy without extra navigation step.
- vNext now: src/app/(authenticated)/admin/module-access/page.tsx:40-77; src/app/(authenticated)/admin/features/[collegeId]/page.tsx:104-112 — Directory requires click on each college, changing route to /admin/features/:collegeId.
- Fix: Restore direct route workflow and back/active sidebar parity.

## G2-10-019-004  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:790-793,828-840 — Selecting learner from overrides opens in-page explanatory drawer.
- vNext now: src/components/admin/learner-module-access-drawer.tsx:65-75; src/app/(authenticated)/admin/features/[collegeId]/page.tsx:112-122 — Search opens Drawer but full trace is separate page.
- Fix: Support in-place full breakdown preserving list context.

## G2-10-019-007  [P2] GAP  facet F02  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:704-940 — Three right drawers for history, individual overrides and access trace.
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/page.tsx:112-126; src/app/(authenticated)/admin/features/[collegeId]/history/page.tsx:18-37 — New history separate route, trace drawer separate module, no override roster drawer.
- Fix: Restore three in-context drawers in source order.

## G2-10-019-011  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:641-658 — 'How this page works' information alert and exact hierarchy explainer.
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/page.tsx:210-222,317-330 — Multiple explanatory paragraphs without same info banner.
- Fix: Recreate explanatory banner and wording.

## G2-10-019-012  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:670-675 — Blue info panel when College-level edits unavailable.
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/page.tsx:153-156; src/components/admin/college-feature-rule-editor.tsx:72-85 — College editor offered to superadmin; no same notice.
- Fix: Show role-specific notice for unauthorized college editing.

## G2-10-019-013  [P2] MISSING  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:686-693 — Warning badge with count of learner override/lock and Review action.
- vNext now: src/app/(authenticated)/admin/module-access/page.tsx:49-50; src/app/(authenticated)/admin/features/[collegeId]/page.tsx:112-126 — Count metric but no count-triggered Review banner.
- Fix: Show exact warning/review affordance.

## G2-10-019-016  [P2] MISSING  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:592-600 — Each scope shows type tag and student population numeric right alignment.
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/page.tsx:271-286 — Stored rule table lacks per-node learner counts.
- Fix: Include scope population and scope type tags in tree.

## G2-10-019-017  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:586-601 — Table columns Scope, Students in scope, Projects, Placements in order.
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/page.tsx:225-241,271-286 — Separate ancestor and stored rows with Module/Scope/Rule; Electives also included.
- Fix: Restore original tree columns/order and per-node values.

## G2-10-019-024  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:228-230 — Initial expansion root only for large colleges.
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/page.tsx:245-250 — Inventory shows paged 500 scope choices rather than tree root expansion.
- Fix: Use root-expanded hierarchy with child lazy display.

## G2-10-019-025  [P2] MISSING  facet F05  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:628-635 — Expand all/Collapse all buttons with disable conditions.
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/page.tsx:245-250; src/components/admin/descendant-feature-rule-editor.tsx:43-68 — No expansion controls in rule editor.
- Fix: Add Expand/Collapse including `disabled` when all selected.

## G2-10-019-032  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:435-457 — College row disables when backend `canEditCollegeLevel` false; locked-ancestor disables.
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/page.tsx:153-156; src/components/admin/college-feature-rule-editor.tsx:25-27 — Separate editor checks ancestorLocked and permission; no integrated row affordance.
- Fix: Drive disabled state from resolved rights/locks at each node.

## G2-10-019-070  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:677-696 — Separate override loading/error and whole-tree error banners.
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/page.tsx:104-112; src/components/admin/learner-module-access-drawer.tsx:62-73 — Mixed route-level errors, suggestion busy only.
- Fix: Implement separate tree, override and trace busy/failed states.

## G2-10-019-071  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:694-703 — Tree empty message 'No departments, programs or classes set up for this college yet.'
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/page.tsx:271-277 — Empty message 'No lower-level overrides', misleading when academic nodes exist.
- Fix: Differentiate empty academic hierarchy from zero stored overrides.

## G2-10-019-079  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:698-703 — Nested table scroll x:max-content at narrow widths.
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/page.tsx:225-241,271-286 — DataTable mobile priority transforms columns/rows.
- Fix: Preserve hierarchy columns via horizontal scroll on tablet/phone.

## G2-10-019-092  [P2] GAP  facet F19  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:228-230,698-703 — Opens only tree root and keeps child rows unmounted until expanded.
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/page.tsx:245-250 — Paginates academic choices up to 500 scopes and stored rules 30/page.
- Fix: Use lazy root expansion with bounded fetching/virtualization.

## G2-10-019-099  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:701-703 — No pagination but collapsible descendants; load errors don't quietly show empty state.
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/page.tsx:271-277 — Zero stored overrides and out-of-range page differentiated, but no hierarchy-empty evidence.
- Fix: Do not conflate missing academic nodes with missing rules.

## G2-4-030-003  [P2] GAP  facet F01  effort M
- Legacy: Actions student lookup, recent changes, expand/collapse, refresh inline (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:618-637`)
- vNext now: Student search and history link on separate page, no inline expand/collapse/refresh (`src/app/(authenticated)/admin/features/[collegeId]/page.tsx:106-126`)
- Fix: Provide original toolbar on selected college detail route.

## G2-4-030-004  [P2] GAP  facet F01  effort M
- Legacy: Hierarchy rendered directly for current college (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:195-230`)
- vNext now: Academic rules moved to second screen after inheritance (`src/app/(authenticated)/admin/features/[collegeId]/page.tsx:245-251`)
- Fix: Show hierarchy as primary content inside selected college scope.

## G2-4-030-006  [P2] GAP  facet F02  effort M
- Legacy: Card with instruction Alert, scope warnings, overrides Alert, tree table (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:640-703`)
- vNext now: Search, history, summary cards, inheritance, scope editor, overrides in separate sections (`src/app/(authenticated)/admin/features/[collegeId]/page.tsx:112-315`)
- Fix: Reorder to intro, info alert, warnings, direct hierarchical grid, drawers.

## G2-4-030-007  [P2] GAP  facet F02  effort M
- Legacy: All three drawers overlay current hierarchy (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:704-939`)
- vNext now: Access trace via nested drawer; history via separate route (`src/app/(authenticated)/admin/features/[collegeId]/page.tsx:112-126`)
- Fix: Restore history/override/trace drawer triggers in same page.

## G2-4-030-008  [P2] MISSING  facet F03  effort M
- Legacy: Recent changes, Expand all, Collapse all, Refresh buttons (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:616-637`)
- vNext now: Only Open learner access trace and history link (`src/app/(authenticated)/admin/features/[collegeId]/page.tsx:112-126`)
- Fix: Add missing toolbar controls with disabled rules.

## G2-4-030-009  [P2] GAP  facet F03  effort M
- Legacy: Each module cell is colored pill with inherited source and lock icon (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:501-579`)
- vNext now: StatusBadge with module status and separate editor (`src/app/(authenticated)/admin/features/[collegeId]/page.tsx:129-157`)
- Fix: Replicate pill's case, colors, inherited source, shadowed text and lock affordance.

## G2-4-030-010  [P2] MISSING  facet F03  effort M
- Legacy: Alerts college control info, loading overrides and clickable Review (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:670-691`)
- vNext now: Policy notes; no overrides review Alert (`src/app/(authenticated)/admin/features/[collegeId]/page.tsx:317-330`)
- Fix: Restore exact warning banner and review action.

## G2-4-030-012  [P2] GAP  facet F04  effort M
- Legacy: Table columns Scope, Students in scope, Projects, Placements (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:586-601`)
- vNext now: Stored rules table Scope, Academic path / membership, Module, Stored rule (`src/app/(authenticated)/admin/features/[collegeId]/page.tsx:271-286`)
- Fix: Use two module columns plus count and tree hierarchy.

## G2-4-030-015  [P2] GAP  facet F04  effort M
- Legacy: Shows explicit ON/OFF or inherited lowercase on/off with deciding-level shorthand (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:565-575`)
- vNext now: Inheritance matrix shows stored values and Effective On/Off separately (`src/app/(authenticated)/admin/features/[collegeId]/page.tsx:225-241`)
- Fix: Add inherited-source qualifier per scope cell.

## G2-4-030-017  [P2] GAP  facet F05  effort M
- Legacy: Hierarchical parent-child tree with expanded root-only keys (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:65-87`)
- vNext now: Academic scopes displayed via inventory/editor, not AntD expandable tree (`src/app/(authenticated)/admin/features/[collegeId]/page.tsx:245-251`)
- Fix: Recreate collapsible hierarchy and parent-child scope count.

## G2-4-030-019  [P2] GAP  facet F05  effort M
- Legacy: Initially expands root only to prevent hundreds of class rows (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:228-230`)
- vNext now: Scope inventory paginated, no root-expanded state (`src/app/(authenticated)/admin/features/[collegeId]/page.tsx:245-251`)
- Fix: Match initial root-only expanded selection.

## G2-4-030-025  [P2] GAP  facet F06  effort M
- Legacy: Inline Segmented options Inherit,On,Off on click cell (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:523-527`)
- vNext now: Separate CollegeFeatureRuleEditor below card (`src/app/(authenticated)/admin/features/[collegeId]/page.tsx:153-155`)
- Fix: Show tri-state editor inline within selected cell.

## G2-4-030-038  [P2] GAP  facet F09  effort M
- Legacy: History Drawer width640 right, Refresh, 4 columns (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:704-776`)
- vNext now: Link to separate full history route (`src/app/(authenticated)/admin/features/[collegeId]/page.tsx:124-127`)
- Fix: Recreate right-side history drawer with same dimensions and pagination.

## G2-4-030-039  [P2] GAP  facet F09  effort M
- Legacy: Students with own override/lock Drawer width520 (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:777-827`)
- vNext now: List of stored overrides, no dedicated review drawer (`src/app/(authenticated)/admin/features/[collegeId]/page.tsx:252-315`)
- Fix: Recreate overriders Drawer filtered to real student overrides.

## G2-4-030-041  [P2] GAP  facet F10  effort M
- Legacy: Tree GET then learner overrides GET; history fetched on demand (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:218-246`)
- vNext now: Loads college scope module reads and scope choice query SSR (`src/app/(authenticated)/admin/features/[collegeId]/page.tsx:67-71`)
- Fix: Keep independent retries/availability for tree and override reads.

## G2-4-030-045  [P2] GAP  facet F10  effort M
- Legacy: History fetches latest 50 audited changes (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:171-193`)
- vNext now: View audited college module changes link instead of same-page fetch (`src/app/(authenticated)/admin/features/[collegeId]/page.tsx:124-127`)
- Fix: Provide 50-event scope history adapter.

## G2-4-030-055  [P2] GAP  facet F13  effort M
- Legacy: Student override fetch loading/error independent of tree (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:677-685`)
- vNext now: Overrides section requires college aggregate read (`src/app/(authenticated)/admin/features/[collegeId]/page.tsx:252-286`)
- Fix: Give override-only skeleton/retry without blanking whole page.

## G2-4-030-056  [P2] GAP  facet F13  effort M
- Legacy: Tree table empty No departments, programs or classes set up for this college yet. (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:697-702`)
- vNext now: No lower-level overrides even when structure exists (`src/app/(authenticated)/admin/features/[collegeId]/page.tsx:273-277`)
- Fix: Distinguish no academic scopes vs no persisted override rows.

## G2-4-030-060  [P2] GAP  facet F16  effort M
- Legacy: Tree small table scroll x=max-content (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:697-703`)
- vNext now: Responsive DataTable with selected fields, no hierarchical horizontal grid (`src/app/(authenticated)/admin/features/[collegeId]/page.tsx:271-286`)
- Fix: Match mobile horizontal module columns and nested indentation.

## G2-4-030-063  [P2] GAP  facet F17  effort M
- Legacy: Inactive cell focusable span with role button, Enter opens inline editor (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:549-552`)
- vNext now: Separate interactive editor, module badges not cell focusable (`src/app/(authenticated)/admin/features/[collegeId]/page.tsx:129-155`)
- Fix: Preserve Enter keyboard edit and announce inherited winner.

## G2-4-030-067  [P2] GAP  facet F18  effort S
- Legacy: Recent changes button label (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:625-627`)
- vNext now: View audited college module changes link (`src/app/(authenticated)/admin/features/[collegeId]/page.tsx:124-127`)
- Fix: Match exact Recent changes label when drawer retained.

## G2-4-030-068  [P2] MISSING  facet F18  effort M
- Legacy: Expand all / Collapse all / Refresh controls (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:628-636`)
- vNext now: No equal controls (`src/app/(authenticated)/admin/features/[collegeId]/page.tsx:245-251`)
- Fix: Restore exact button copy and disabled states.

## G2-4-030-069  [P2] GAP  facet F18  effort M
- Legacy: Tooltip Placements switched whole college; placement cell decides in Batches (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:507-511`)
- vNext now: Placements college-level impact disclosure, different explanation (`src/app/(authenticated)/admin/features/[collegeId]/page.tsx:160-170`)
- Fix: Use exact placement cell responsibility copy in managed child cells.

## G2-10-019-035  [P3] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:616-637 — Refresh reloads scope tree/override lists in place, keeping route.
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/page.tsx:104-109; src/components/admin/descendant-feature-rule-editor.tsx:59-65 — Individual Recheck scope, not full hierarchy refresh.
- Fix: Restore visible page Refresh.
