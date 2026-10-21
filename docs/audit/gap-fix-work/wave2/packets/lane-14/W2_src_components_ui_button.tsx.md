# Work packet (wave 2): edit src/components/ui/button.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/cross-22-copy-time-accessibility.md

## G2-2-037-017  [P2] GAP  facet F06  effort M
- Legacy: docs/design/old-lms-shell.css:31-32 sidebar item min-height44, radius8
- vNext now: src/components/ui/button.tsx:18-28 button min control-height and mobile44
- Fix: Ensure nav links/inputs maintain legacy row size separate from shared button min height.

## G2-2-037-044  [P3] GAP  facet F17  effort S
- Legacy: docs/design/old-lms-shell.css:32 focus-visible 2px outline in sidebar
- vNext now: src/components/ui/button.tsx:28 focus-visible outline2 offset3
- Fix: Unify exact outline color/offset at nav versus button surfaces.
