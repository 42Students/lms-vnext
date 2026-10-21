# Work packet (wave 2): edit src/components/shell/sidebar-nav.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/mobile-responsive-contract.md

## G2-3-033-011  [P2] GAP  facet F03  effort M
- Legacy: `docs/design/old-lms-shell.css:26-36`
- vNext now: `src/components/shell/sidebar-nav.tsx:95-132`
- Fix: Old sidebar nav items min44, icon20/24 and grouped headings; verify rendered vNext item spacing against old CSS.

## G2-3-033-012  [P2] GAP  facet F03  effort M
- Legacy: `docs/design/old-lms-shell.css:38-53`
- vNext now: `src/components/shell/sidebar-nav.tsx:105-132`
- Fix: Old collapsed badges scaled 0.72 at left50% and group dividers; vNext SidebarNav outputs badge/heading but CSS exact position not proven.
