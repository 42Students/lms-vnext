# Work packet: edit src/components/admin/college-bulk-import.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-colleges.md

## G2-9-032-048  [P1] GAP  facet F10  effort L
- Legacy: Bulk sequential createCollege per row with independent orgId `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:220-256`
- vNext now: One POST bulk-import server payload organizationId+csv, single org for batch `src/components/admin/college-bulk-import.tsx:26-46` `src/modules/colleges/bulk-import-model.ts:1-49`
- Fix: Support multi-org CSV or explicitly require one org per import

## G2-9-032-061  [P1] GAP  facet F14  effort M
- Legacy: Bulk CSV paste template orgId,name,uniqueId,city,state plus quoted name `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:20-21,625-639`
- vNext now: New name,code,city,state,country in org-selected CSV `src/modules/colleges/bulk-import-model.ts:31-49` `src/components/admin/college-bulk-import.tsx:48-73`
- Fix: Ship import template migration and clarify organization selection

## G2-9-032-073  [P1] GAP  facet F20  effort M
- Legacy: Unsaved edit and import drafts guarded before closing `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:343-378`
- vNext now: Create draft persisted, bulk guarded; edit not guarded `src/components/admin/college-create-form.tsx:34-35` `src/components/admin/college-edit-dialog.tsx:116-129` `src/components/admin/college-bulk-import.tsx:85-89`
- Fix: Add edit dirty guard and warn on scope navigation

## G2-9-032-080  [P1] GAP  facet F23  effort L
- Legacy: Old import can mix multiple orgIds in one CSV `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:611-671`
- vNext now: New import one org selected for entire batch; skips duplicate codes `src/components/admin/college-bulk-import.tsx:19-46` `src/modules/colleges/bulk-import-model.ts:31-49`
- Fix: Provide legacy importer mode or explicit conversion workflow
