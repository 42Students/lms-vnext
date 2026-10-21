# Work packet (wave 2): edit src/components/shell/mobile-navigation.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/mobile-responsive-contract.md

## G2-3-033-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/design/old-lms-shell.css:88-99`
- vNext now: `src/components/shell/mobile-navigation.tsx:11-43`
- Fix: Legacy mobile drawer is a 16rem sidebar under 768; vNext Drawer left width82% max300. Match drawer geometry and header.

## G2-3-033-015  [P2] GAP  facet F03  effort M
- Legacy: `docs/design/old-lms-shell.css:74-85`
- vNext now: `src/components/shell/mobile-navigation.tsx:31-40`
- Fix: Old menu button and mobile org/account icons 36/38/40px; vNext menu SVG20 inside shared button, verify hit area and strokes.

## G2-3-033-038  [P2] GAP  facet F10  effort M
- Legacy: `docs/design/old-lms-shell.css:73-85`
- vNext now: `src/components/shell/mobile-navigation.tsx:17-43`
- Fix: Legacy menu opens via drawer at <768; vNext Drawer native modal and same SidebarNav navigation close behavior; compare history/back side-effects.

## G2-3-033-049  [P2] GAP  facet F13  effort M
- Legacy: `docs/design/old-lms-shell.css:88-99`
- vNext now: `src/components/shell/mobile-navigation.tsx:17-43`
- Fix: Mobile drawer can remain open when viewport crosses 768 in legacy; vNext closes on matchMedia width crossing to desktop.

## G2-3-033-066  [P3] GAP  facet F18  effort S
- Legacy: `docs/design/old-lms-shell.css:88-99`
- vNext now: `src/components/shell/mobile-navigation.tsx:31-40`
- Fix: Legacy mobile menu drawer did not explicitly title Navigation menu in given CSS; vNext Drawer title Navigation menu visible; compare.
