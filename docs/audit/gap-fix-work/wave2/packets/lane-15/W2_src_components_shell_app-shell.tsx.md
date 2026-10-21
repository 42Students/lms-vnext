# Work packet (wave 2): edit src/components/shell/app-shell.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/mobile-responsive-contract.md

## G2-3-033-006  [P2] GAP  facet F02  effort M
- Legacy: `docs/design/old-lms-shell-spec.md:19-20`
- vNext now: `src/components/shell/app-shell.tsx:125-128`
- Fix: Old single canvas x=280 at 1280 with 24px pad; vNext main shell wrapper adds fluid outer padding and may change available canvas width.

## G2-3-033-046  [P2] GAP  facet F12  effort M
- Legacy: `docs/design/old-lms-shell.css:13-18`
- vNext now: `src/components/shell/app-shell.tsx:78-96`
- Fix: Desktop hover rail width 96→256 and duration150ms; verify vNext CSS in actual rendered shell rather than infer from component.

## G2-3-033-055  [P2] GAP  facet F16  effort M
- Legacy: `docs/design/old-lms-shell.css:67-72`
- vNext now: `src/components/shell/app-shell.tsx:125-128`
- Fix: Tablet 768–991 outer page gap vs old 14px topbar padding; compare x positions and grid edges.
