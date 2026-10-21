# Work packet: edit src/app/(authenticated)/college/classes/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u003-college-admin-classes.md

## G2-5-003-010  [P1] GAP  facet F03 Visible elements  effort M
- Legacy: Warning 'Some setup options failed to load' with Retry options button. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:429-435)
- vNext now: No independent programs/batches partial lookup error banner and retry. (src/components/academics/college-section-management.tsx:80-87; src/app/(authenticated)/college/classes/page.tsx:31-34)
- Fix: Surface partial lookup failures without treating them as no options.
