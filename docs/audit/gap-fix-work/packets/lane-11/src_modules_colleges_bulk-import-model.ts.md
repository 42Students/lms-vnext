# Work packet: edit src/modules/colleges/bulk-import-model.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-colleges.md

## G2-9-032-048  [P1] GAP  facet F10  effort L
- Legacy: Bulk sequential createCollege per row with independent orgId `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:220-256`
- vNext now: One POST bulk-import server payload organizationId+csv, single org for batch `src/components/admin/college-bulk-import.tsx:26-46` `src/modules/colleges/bulk-import-model.ts:1-49`
- Fix: Support multi-org CSV or explicitly require one org per import

## G2-9-032-052  [P1] GAP  facet F12  effort M
- Legacy: CSV requires numeric orgId plus normalized uniqueId per row `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:129-153`
- vNext now: CSV parser only name/code/city/state/country; org UUID applies globally `src/modules/colleges/bulk-import-model.ts:2-49`
- Fix: Document org mapping and multi-org import option

## G2-9-032-053  [P1] GAP  facet F12  effort M
- Legacy: Optional header orgId/name/uniqueId and 3–5 positional columns `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:155-217`
- vNext now: Header requires name+code; positional columns name,code,city,state,country `src/modules/colleges/bulk-import-model.ts:31-39`
- Fix: Accept legacy CSV template or provide converter with explicit error

## G2-9-032-061  [P1] GAP  facet F14  effort M
- Legacy: Bulk CSV paste template orgId,name,uniqueId,city,state plus quoted name `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:20-21,625-639`
- vNext now: New name,code,city,state,country in org-selected CSV `src/modules/colleges/bulk-import-model.ts:31-49` `src/components/admin/college-bulk-import.tsx:48-73`
- Fix: Ship import template migration and clarify organization selection

## G2-9-032-080  [P1] GAP  facet F23  effort L
- Legacy: Old import can mix multiple orgIds in one CSV `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:611-671`
- vNext now: New import one org selected for entire batch; skips duplicate codes `src/components/admin/college-bulk-import.tsx:19-46` `src/modules/colleges/bulk-import-model.ts:31-49`
- Fix: Provide legacy importer mode or explicit conversion workflow
