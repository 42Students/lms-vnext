# Work packet (wave 3): edit src/components/projects/project-admin-audit-page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u030-superadmin-project-audit.md, docs/audit/gap2/lane-9/l15-u017-project-resource-audit.md

## G2-7-030-061  [P1] MISSING  facet F15  effort L
- Legacy: audit/index.js:19-74 covers assignment and destructive audit events from backend producers
- vNext now: project-admin-audit-page.tsx:341-343 says legacy-only actions not yet in shared taxonomy
- Fix: Instrument all remaining legacy action producers to recordActivityEventInTransaction

## G2-15-017-050  [P1] MISSING  facet F23  effort L
- Legacy: docs/legacy-source/frontend/src/pages/college-admin/projects/workspaces/[workspaceId]/audit.js:71-105 tab and dedicated resource audit
- vNext now: src/components/projects/project-admin-audit-page.tsx:329-342 warns legacy-only actions remain pending
- Fix: Keep project activity feed and add independent resource trail
