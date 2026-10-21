# Work packet (wave 2): edit src/components/ui/drawer.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/mobile-responsive-contract.md

## G2-3-033-009  [P2] GAP  facet F02  effort M
- Legacy: `docs/design/old-lms-shell.css:88-99`
- vNext now: `src/components/ui/drawer.tsx:37-51`
- Fix: Old drawer body keeps sidebar list with heading indentation; vNext Drawer has separate header/logo and padding.

## G2-3-033-028  [P2] GAP  facet F06  effort M
- Legacy: `docs/design/old-lms-shell.css:88-99`
- vNext now: `src/components/ui/drawer.tsx:30-51`
- Fix: Legacy left mobile menu drawer 256px; vNext Drawer close button/button footer and 300px cap differ.

## G2-3-033-034  [P2] GAP  facet F09  effort M
- Legacy: `docs/design/old-lms-shell.css:88-99`
- vNext now: `src/components/ui/drawer.tsx:37-51`
- Fix: Legacy menu drawer and any Ant Design overlay use overlay/positioning; vNext native dialog/drawer widths, safe-area and side transitions differ.

## G2-3-033-056  [P2] GAP  facet F16  effort M
- Legacy: `docs/design/old-lms-shell.css:88-99`
- vNext now: `src/components/ui/drawer.tsx:37-50`
- Fix: Mobile left sidebar old 16rem vs vNext 82vw up to300px, i.e. 300px at375px; fix to256px if cloning.

## G2-3-033-061  [P2] GAP  facet F17  effort M
- Legacy: `docs/design/old-lms-shell.css:88-99`
- vNext now: `src/components/ui/drawer.tsx:37-51`
- Fix: Legacy mobile menu focus trap depends Ant Drawer, vNext native dialog with historyMode marker; compare Escape/Back, opener focus restoration.

## G2-3-033-074  [P2] GAP  facet F21  effort M
- Legacy: `docs/design/old-lms-shell.css:73-85`
- vNext now: `src/components/ui/drawer.tsx:30-51`
- Fix: Legacy phone behavior controlled by Ant Drawer and browser CSS; vNext HTMLDialogElement on webview, test Android back and iOS viewport.

## G2-3-033-079  [P2] GAP  facet F23  effort M
- Legacy: `docs/design/old-lms-shell.css:88-99`
- vNext now: `src/components/ui/drawer.tsx:37-51`
- Fix: Legacy mobile drawer 256px, vNext max300px. Difference deliberate only if documented, otherwise clone.
