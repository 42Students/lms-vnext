# Work packet: edit src/app/(authenticated)/admin/projects/audit/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u030-superadmin-project-audit.md

## G2-7-030-046  [P1] GAP  facet F11  effort M
- Legacy: audit/index.js:469-487 no-college blocks audit under shell
- vNext now: admin/projects/audit/page.tsx:35-49 super-admin global audit may bypass college requirement
- Fix: Show global vs selected-college scope clearly to avoid cross-tenant surprise

## G2-7-030-032  [P2] GAP  facet F07  effort S
- Legacy: audit/index.js:472-484 Select a college to continue while scopeLoaded true
- vNext now: admin/projects/audit/page.tsx:35-47 Select a college scope and different description
- Fix: Restore exact missing-college warning and loading state
