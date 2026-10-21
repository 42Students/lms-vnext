# Work packet (wave 2): edit src/components/projects/admin-readiness-workspace-picker.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u004-college-admin-projects-readiness.md, docs/audit/gap2/lane-7/u032-superadmin-readiness.md

## G2-7-004-007  [P2] GAP  facet F02  effort M
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:490-512: Select workspace Card with search+Select+pager.
- vNext now: V/components/projects/project-admin-readiness-page.tsx:123-127; components/projects/admin-readiness-workspace-picker.tsx:20-55: disclosure with radio list.
- Fix: Render searchable combo select with legacy position and width.

## G2-7-032-011  [P2] GAP  facet F03  effort M
- Legacy: readiness/index.js:491-505 420px Search workspaces Input.Search plus searchable Select
- vNext now: admin-readiness-workspace-picker.tsx:20-45 search input, radio list and View readiness
- Fix: Use searchable 420px select with matching placeholder

## G2-7-032-012  [P2] GAP  facet F03  effort S
- Legacy: readiness/index.js:506-510 Previous workspaces/N range/Next workspaces buttons
- vNext now: admin-readiness-workspace-picker.tsx:34-44 Previous/Next 25-item local radios, not same labels
- Fix: Match exact labels, count range and placement

## G2-7-032-069  [P2] GAP  facet F18  effort S
- Legacy: readiness/index.js:491 Search workspaces by title or ID
- vNext now: admin-readiness-workspace-picker.tsx:23 Search workspace placeholder
- Fix: Match exact search placeholder

## G2-7-032-066  [P3] GAP  facet F17  effort S
- Legacy: readiness/index.js:491 Search workspaces by title or ID aria-label
- vNext now: admin-readiness-workspace-picker.tsx:20-23 similar label, Search workspace placeholder
- Fix: Match visible and accessible placeholder
