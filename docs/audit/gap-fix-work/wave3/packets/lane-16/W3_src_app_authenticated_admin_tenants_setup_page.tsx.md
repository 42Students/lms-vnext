# Work packet (wave 3): edit src/app/(authenticated)/admin/tenants/setup/page.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-tenants.md

## G2-10-023-015  [P1] MISSING  facet F03  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:150-165 — Organizations row Actions Edit and red Delete buttons.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:115-133 — Links to other directories; no row actions in setup.
- Fix: Embed edit/delete row actions or route directly with equivalent UX

## G2-10-023-023  [P1] MISSING  facet F05  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:552-608 — Colleges Table with search/refresh/bulk action and inline row actions.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:115-134 — No equivalent scoped college CRUD list in setup.
- Fix: Restore colleges table, search, bulk import, edit/delete actions

## G2-10-023-033  [P1] MISSING  facet F06  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:162-236 — Logo and branding fields with live preview and Save.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:148-159 — Link to branding page only.
- Fix: Restore brand form and preview in Launch

## G2-10-023-046  [P1] MISSING  facet F09  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:611-659 — Bulk Import Colleges (CSV) Modal with template, preview/result table.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:103-134 — No bulk dialog in setup.
- Fix: Restore CSV import dialog and validation

## G2-10-023-053  [P1] MISSING  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:129-255 — Bulk CSV parser validates and POSTs rows, tracks failures.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:103-134 — No import service action.
- Fix: Reproduce row-wise import and report

## G2-10-023-068  [P1] MISSING  facet F14  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:611-659 — CSV bulk import accepts pasted CSV text and returns per-row Created/Failed.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:103-134 — No import controls.
- Fix: Restore CSV template, parser and per-row results

## G2-10-023-089  [P1] MISSING  facet F19  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:129-255 — Bulk create processed row-wise, reports partial success.
- vNext now: src/app/(authenticated)/admin/tenants/setup/page.tsx:103-134 — No batch import performance path.
- Fix: Implement bounded upload/parser with cap and partial results
