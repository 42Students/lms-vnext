# Work packet (wave 2): edit src/components/admin/learner-module-access-drawer.tsx

26 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-module-access.md, docs/audit/gap2/lane-4/superadmin-module-access.md

## G2-10-019-004  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:790-793,828-840 — Selecting learner from overrides opens in-page explanatory drawer.
- vNext now: src/components/admin/learner-module-access-drawer.tsx:65-75; src/app/(authenticated)/admin/features/[collegeId]/page.tsx:112-122 — Search opens Drawer but full trace is separate page.
- Fix: Support in-place full breakdown preserving list context.

## G2-10-019-009  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:618-624 — AutoComplete width320, SearchOutlined, allowClear, async learner suggestions.
- vNext now: src/components/admin/learner-module-access-drawer.tsx:54-72 — Labeled input full width and separate suggestion list, no search suffix.
- Fix: Recreate compact autocomplete sizing/icon and dropdown placement.

## G2-10-019-022  [P2] GAP  facet F04  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:840-935 — Trace output each level, status decided/ignored/overridden, lock icon, source name.
- vNext now: src/components/admin/learner-module-access-drawer.tsx:90-98; src/app/(authenticated)/admin/features/[collegeId]/trace/page.tsx:160-170 — New drawer concise module explanation; detailed trace delegated route.
- Fix: Surface level-by-level trace in drawer or explicit equivalent.

## G2-10-019-027  [P2] MISSING  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:785-788 — Overrides drawer table 15/page.
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/trace/page.tsx:150-157; src/components/admin/learner-module-access-drawer.tsx:65-75 — Learner search listing is not overrides-only paginated roster.
- Fix: Provide distinct 15-row override register.

## G2-10-019-049  [P2] MISSING  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:777-827 — Student overrides drawer right 520px with table/review.
- vNext now: src/components/admin/learner-module-access-drawer.tsx:74-113 — Explanation Drawer, no override roster popup.
- Fix: Add override/lock roster drawer with Review trigger.

## G2-10-019-050  [P2] GAP  facet F09  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:828-939 — Trace drawer right 520px with per-level effective chain and tri-state.
- vNext now: src/components/admin/learner-module-access-drawer.tsx:74-113 — Student explanation drawer abbreviated and separate full-trace link.
- Fix: Show full trace inline and preserve edit state.

## G2-10-019-055  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:314-324; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ModuleAccessController.java:203-221 — GET /api/v1/admin/module-access/explain?learnerId on select.
- vNext now: src/components/admin/learner-module-access-drawer.tsx:31-45; src/app/(authenticated)/admin/features/[collegeId]/trace/page.tsx:124-148 — New trace fetch depends membership UUID not numeric learner ID.
- Fix: Map identity and preserve exact chain/status semantics.

## G2-10-019-057  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:382-395; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ModuleAccessController.java:92-115 — Same PUT at LEARNER scope for optional personal override.
- vNext now: src/components/admin/learner-module-access-drawer.tsx:90-98 — StudentRuleEditor separate request, membership IDs.
- Fix: Map learner IDs to membership and verify lock conflict.

## G2-10-019-070  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:677-696 — Separate override loading/error and whole-tree error banners.
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/page.tsx:104-112; src/components/admin/learner-module-access-drawer.tsx:62-73 — Mixed route-level errors, suggestion busy only.
- Fix: Implement separate tree, override and trace busy/failed states.

## G2-10-019-077  [P2] GAP  facet F15  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:110-117 — When student denied Placements, inline notice says menu hidden and direct page access error.
- vNext now: src/components/admin/learner-module-access-drawer.tsx:80-93 — Explains eligibility but no exact denial/banner text.
- Fix: Show precise learner-visible denial effects in trace.

## G2-10-019-080  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:705-709,778-779,829-830 — Drawers width640 history, 520 overrides and trace.
- vNext now: src/components/admin/learner-module-access-drawer.tsx:74-113; src/app/(authenticated)/admin/features/[collegeId]/history/page.tsx:18-38 — Generic Drawer and separate page; different width behavior.
- Fix: Match drawer widths and small-screen full viewport.

## G2-10-019-110  [P2] GAP  facet F23  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:704-940 — In-page history/overrides/full trace.
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/history/page.tsx:18-36; src/components/admin/learner-module-access-drawer.tsx:74-113; src/app/(authenticated)/admin/features/[collegeId]/trace/page.tsx:160-170 — New separate history page, abbreviated drawer, trace page.
- Fix: Match in-place surface then link full route as optional.

## G2-4-030-011  [P2] GAP  facet F03  effort M
- Legacy: PlacementExplain includes green/red step results and decision author (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:99-132`)
- vNext now: Shows placement cell decision only as paragraphs (`src/components/admin/learner-module-access-drawer.tsx:80-89`)
- Fix: Restore step-by-step college switch and eligibility status visuals.

## G2-4-030-024  [P2] GAP  facet F06  effort S
- Legacy: Autocomplete placeholder Why can't a student see a module? Search… (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:618-625`)
- vNext now: Placeholder Name or roll number and separate heading (`src/components/admin/learner-module-access-drawer.tsx:54-60`)
- Fix: Restore placeholder in search box.

## G2-4-030-040  [P2] GAP  facet F09  effort M
- Legacy: Why this student sees what they see Drawer width520 (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:828-939`)
- vNext now: Student module access explanation Drawer (`src/components/admin/learner-module-access-drawer.tsx:74-113`)
- Fix: Restore title, 520px width, chain rows, per-scope source explanation.

## G2-4-030-062  [P2] GAP  facet F16  effort M
- Legacy: History Drawer 640px, override/trace Drawers 520px (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:704-708`)
- vNext now: Drawer uses shared width defaults, history now route (`src/components/admin/learner-module-access-drawer.tsx:74-113`)
- Fix: Set intended drawer widths per viewport and verify overlay scroll.

## G2-4-030-076  [P2] GAP  facet F21  effort M
- Legacy: lodash debounce 300ms, LearnerSearchService backend (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:281-303`)
- vNext now: Native fetch trace endpoint and 260ms timeout (`src/components/admin/learner-module-access-drawer.tsx:29-52`)
- Fix: Match search request rate and result limits.

## G2-10-019-028  [P3] GAP  facet F05  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:281-303 — Search min2 characters debounce300ms and top10 learner suggestions.
- vNext now: src/components/admin/learner-module-access-drawer.tsx:28-52 — min2 and debounce260ms, results request model distinct.
- Fix: Match 300ms and ten-result suggestion cap.

## G2-10-019-054  [P3] GAP  facet F10  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:290-303; docs/legacy-source/frontend/src/api/Services/AdminService.js:82-92 — searchLearners GET top10 suggestions scoped to selected college.
- vNext now: src/components/admin/learner-module-access-drawer.tsx:31-45 — GET `/api/admin/features/:collegeId/trace?q=...` returns suggestions.
- Fix: Guarantee same college and 10-result cap across route.

## G2-10-019-072  [P3] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:832-839 — Trace drawer pending spinner and error Retry.
- vNext now: src/components/admin/learner-module-access-drawer.tsx:62-74 — Pending search status and popup only on detail; different waiting state.
- Fix: Preserve open trace skeleton and retry CTA.

## G2-10-019-078  [P3] GAP  facet F16  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:618-624 — Autocomplete width320 and max-width calc viewport−120.
- vNext now: src/components/admin/learner-module-access-drawer.tsx:54-61 — Search full-width with 44px controls and stacking.
- Fix: Adapt width to legacy desktop while preserving mobile min44 touch.

## G2-10-019-086  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:622-623 — Placeholder 'Why can't a student see a module? Search…'.
- vNext now: src/components/admin/learner-module-access-drawer.tsx:55-60 — Visible label same query but placeholder 'Name or roll number'.
- Fix: Use exact legacy placeholder and Search icon.

## G2-10-019-090  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:829-830 — Drawer title 'Why this student sees what they see'.
- vNext now: src/components/admin/learner-module-access-drawer.tsx:74-75 — 'Student module access explanation'.
- Fix: Use exact source drawer title.

## G2-10-019-094  [P3] GAP  facet F19  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:281-303 — Search is debounced and top10 server suggestions.
- vNext now: src/components/admin/learner-module-access-drawer.tsx:28-52 — debounce260, no explicit 10 result limit at UI.
- Fix: Enforce small result cap in trace service and debounce 300.

## G2-4-030-023  [P3] GAP  facet F06  effort S
- Legacy: Student search min2, debounce 300ms, limit 10 suggestions (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:281-304`)
- vNext now: Debounce 260ms and search min2; service pages 25 learners (`src/components/admin/learner-module-access-drawer.tsx:46-52`)
- Fix: Set debounce 300ms and suggestion cap10 for exact old behavior.

## G2-4-030-061  [P3] GAP  facet F16  effort S
- Legacy: AutoComplete 320px max calc(100vw - 120px) (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:618-624`)
- vNext now: Full-width labeled search min-height44 (`src/components/admin/learner-module-access-drawer.tsx:54-60`)
- Fix: Compare widths at 375px and preserve touch reachability.
