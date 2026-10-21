# Work packet (wave 2): edit src/app/(authenticated)/admin/features/[collegeId]/history/page.tsx

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-module-access.md

## G2-10-019-007  [P2] GAP  facet F02  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:704-940 — Three right drawers for history, individual overrides and access trace.
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/page.tsx:112-126; src/app/(authenticated)/admin/features/[collegeId]/history/page.tsx:18-37 — New history separate route, trace drawer separate module, no override roster drawer.
- Fix: Restore three in-context drawers in source order.

## G2-10-019-048  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:704-775 — History drawer right 640px, Refresh action, 4-column table.
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/history/page.tsx:18-36 — Standalone page/list with CSV and cursor, no drawer.
- Fix: Support context-preserving drawer layout.

## G2-10-019-053  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:164-188; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ModuleAccessController.java:178-199 — GET history?collegeId&limit=50 on drawer open.
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/history/page.tsx:10-16 — New history page cursor service instead of lazy 50 entry request.
- Fix: Restore lazy history reader with count cap or equivalent drawer fetch.

## G2-10-019-076  [P2] GAP  facet F15  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:164-188; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ModuleAccessController.java:178-199 — Recent changes includes college toggle and per-scope overrides for operator awareness.
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/history/page.tsx:18-35 — Separate audited history, now includes Electives.
- Fix: Ensure same action events, actor provenance, time and scope in history.

## G2-10-019-080  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:705-709,778-779,829-830 — Drawers width640 history, 520 overrides and trace.
- vNext now: src/components/admin/learner-module-access-drawer.tsx:74-113; src/app/(authenticated)/admin/features/[collegeId]/history/page.tsx:18-38 — Generic Drawer and separate page; different width behavior.
- Fix: Match drawer widths and small-screen full viewport.

## G2-10-019-110  [P2] GAP  facet F23  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:704-940 — In-page history/overrides/full trace.
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/history/page.tsx:18-36; src/components/admin/learner-module-access-drawer.tsx:74-113; src/app/(authenticated)/admin/features/[collegeId]/trace/page.tsx:160-170 — New separate history page, abbreviated drawer, trace page.
- Fix: Match in-place surface then link full route as optional.

## G2-10-019-019  [P3] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:733-734 — History timestamps `new Date(value).toLocaleString()` in local browser timezone.
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/history/page.tsx:29-34 — Audit timestamp pinned to Asia/Kolkata, unlike browser local.
- Fix: Use IST by owner choice but identify intentional locale deviation.

## G2-10-019-020  [P3] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:763-771 — History scope type + #id; actor name or User #id/System fallback.
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/history/page.tsx:29-34 — Scope/actor shown but identifier and fallback formatting differ.
- Fix: Map legacy id and actor fallback explicitly.

## G2-10-019-026  [P3] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:719-726 — History table 15 rows/page, horizontal scroll 620px, no item search.
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/history/page.tsx:26-36 — Cursor paginated events with Load more, not 15/page table.
- Fix: Recreate history drawer/table pagination without dropping cursor support.

## G2-10-019-083  [P3] GAP  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:704-709 — History drawer close and Refresh accessible via Ant native actions.
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/history/page.tsx:18-36 — Standalone Link and implicit browser history.
- Fix: Keep focus lifecycle on drawer close and refresh.

## G2-10-019-093  [P3] GAP  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:171-188 — History is fetched lazily only on open limit50; drawer displays 15/page.
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/history/page.tsx:16-36 — History fetched on route load and cursor paginated.
- Fix: Keep lazy route navigation or drawer deferred load; avoid 50-row initial read.
