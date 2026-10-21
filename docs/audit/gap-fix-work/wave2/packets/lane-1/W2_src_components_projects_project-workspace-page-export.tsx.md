# Work packet (wave 2): edit src/components/projects/project-workspace-page-export.tsx

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-projects-workspaces.md, docs/audit/gap2/lane-7/u036-cross-exports-imports.md

## G2-10-028-016  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:404-435 — exported fields Workspace/Status/Progress/Mentor/Template ID.
- vNext now: src/components/projects/project-workspace-page-export.tsx:11-18 — ID/Workspace/Mentor/Status/Progress/Members/Updated.
- Fix: Restore exact export columns and Template ID.

## G2-7-036-001  [P2] GAP  facet F01  effort M
- Legacy: AdminTableToolbar.js:7-18 admin search/export/refresh combined in one reusable toolbar
- vNext now: project-workspace-page-export.tsx:8-26 separate export button, no integrated search/refresh
- Fix: Restore legacy compact shared toolbar and controls

## G2-7-036-004  [P2] GAP  facet F02  effort M
- Legacy: AdminTableToolbar.js:56-80 Space wrap search, result count, export, refresh
- vNext now: project-workspace-page-export.tsx:21-27 one export button plus notice
- Fix: Co-locate search and refresh with export, match card positioning

## G2-7-036-007  [P2] GAP  facet F03  effort S
- Legacy: AdminTableToolbar.js:61-79 Search input 220px allowClear, DownloadOutlined Export CSV, ReloadOutlined
- vNext now: project-workspace-page-export.tsx:21-25 Export this page · CSV without icons
- Fix: Match icon, width, button copy and toolbar size

## G2-7-036-060  [P2] GAP  facet F16  effort M
- Legacy: AdminTableToolbar.js:56-80 wrapped Space responsive controls
- vNext now: project-workspace-page-export.tsx:21-27 unwrapped flex row and status
- Fix: Match toolbar wrap and minimum touch sizes at 375/768/1280

## G2-7-036-063  [P2] GAP  facet F17  effort S
- Legacy: AdminTableToolbar.js:61-68 Input.Search aria-label and allowClear
- vNext now: project-workspace-page-export.tsx:21-25 no integrated search
- Fix: Group labelled search with export and refresh

## G2-7-036-066  [P2] GAP  facet F18  effort S
- Legacy: AdminTableToolbar.js:77 Export CSV
- vNext now: project-workspace-page-export.tsx:24 Export this page · CSV
- Fix: Match button wording

## G2-10-028-043  [P3] GAP  facet F14  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:435 — button Export this page.
- vNext now: src/components/projects/project-workspace-page-export.tsx:22-25 — Export this page · CSV.
- Fix: Restore exact label.

## G2-10-028-049  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:389,435 — Search title or slug, Export this page.
- vNext now: src/components/projects/project-admin-collection-controls.tsx:79-84 and src/components/projects/project-workspace-page-export.tsx:22-25 — search matches, export label diverges.
- Fix: Restore export wording.
