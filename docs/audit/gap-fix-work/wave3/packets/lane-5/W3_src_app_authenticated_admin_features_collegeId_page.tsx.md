# Work packet (wave 3): edit src/app/(authenticated)/admin/features/[collegeId]/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-module-access.md

## G2-10-019-068  [P1] MISSING  facet F12  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:75-87 — Tree includes every academic scope whether override exists.
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/page.tsx:318-329 — Explicitly documents missing academic nodes without stored overrides.
- Fix: Include all academic scopes in resolved hierarchy.

## G2-10-019-108  [P1] MISSING  facet F23  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:603-703 — Original hierarchy page directly edits every node from tree.
- vNext now: src/app/(authenticated)/admin/module-access/page.tsx:39-82; src/app/(authenticated)/admin/features/[collegeId]/page.tsx:317-330 — New directory + split college detail explicitly marks hierarchy read-only/partial.
- Fix: Finish original tree/editor, not only link-out admin inventory.
