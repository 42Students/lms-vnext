# Work packet (wave 2): edit src/components/admin/college-archive-button.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/college-controller.md, docs/audit/gap2/lane-9/superadmin-colleges.md

## G2-3-028-010  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:428-448`
- vNext now: `src/components/admin/college-archive-button.tsx:124-160`
- Fix: Legacy Delete College Popconfirm overlays icon; vNext Archive college is full dialog with different layout.

## G2-9-032-040  [P2] GAP  facet F09  effort M
- Legacy: Delete College Popconfirm, Yes, Delete / Cancel, server blocks dependents `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:428-447`
- vNext now: Archive college Dialog with Archive college/Cancel, expanded dependency list `src/components/admin/college-archive-button.tsx:135-171`
- Fix: Document action lifecycle and match consequence copy

## G2-3-028-015  [P3] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:429-445`
- vNext now: `src/components/admin/college-archive-button.tsx:137-160`
- Fix: Legacy destructive Yes, Delete / Cancel vs vNext Archive college / Cancel; owner must decide exact life-cycle copy.

## G2-3-028-042  [P3] GAP  facet F09  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:428-448`
- vNext now: `src/components/admin/college-archive-button.tsx:137-160`
- Fix: Popconfirm versus dialog destructive interaction position and keyboard return-focus differ.
