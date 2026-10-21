# Work packet (wave 2): edit src/components/shell/topbar/legacy-topbar.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/mobile-responsive-contract.md

## G2-3-033-007  [P2] GAP  facet F02  effort M
- Legacy: `docs/design/old-lms-shell.css:55-57`
- vNext now: `src/components/shell/topbar/legacy-topbar.tsx:40-62`
- Fix: Old desktop header 68px with 220–380px search command column; vNext topbar command layout is separately styled; measure grid columns.

## G2-3-033-008  [P2] GAP  facet F02  effort M
- Legacy: `docs/design/old-lms-shell.css:73-85`
- vNext now: `src/components/shell/topbar/legacy-topbar.tsx:40-69`
- Fix: Legacy phone header 58px min and icon-only new/search controls; confirm vNext compact control geometry at <768.

## G2-3-033-027  [P2] GAP  facet F06  effort M
- Legacy: `docs/design/old-lms-shell.css:73-82`
- vNext now: `src/components/shell/topbar/legacy-topbar.tsx:46-62`
- Fix: Legacy icon-only mobile search/new button with hidden label at <768; inspect vNext command actions label, tooltip and disabled rule.

## G2-3-033-044  [P2] GAP  facet F12  effort M
- Legacy: `docs/design/old-lms-shell.css:67-72`
- vNext now: `src/components/shell/topbar/legacy-topbar.tsx:41-62`
- Fix: Tablet 768–1199 old command search 180–1fr and org chip190px; validate vNext exact min widths and overflow.

## G2-3-033-054  [P2] GAP  facet F16  effort M
- Legacy: `docs/design/old-lms-shell.css:73-85`
- vNext now: `src/components/shell/topbar/legacy-topbar.tsx:40-70`
- Fix: Phone header height/padding/command search must be checked at 320/375/430px; source min58 vs vNext stylesheet undefined here.

## G2-3-033-063  [P2] GAP  facet F17  effort M
- Legacy: `docs/design/old-lms-shell.css:73-85`
- vNext now: `src/components/shell/topbar/legacy-topbar.tsx:41-68`
- Fix: Legacy icon-only actions retain accessible names via Ant controls; verify vNext new/search icon a11y labels and keyboard shortcuts.
