# Work packet (wave 2): edit src/app/globals.css

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/mobile-responsive-contract.md

## G2-3-033-021  [P2] GAP  facet F04  effort M
- Legacy: `docs/design/old-lms-shell.css:67-85`
- vNext now: `src/app/globals.css:641-645`
- Fix: Legacy responsive header changes at 767px while page canvas font and padding change at 639px; verify 640–767 intermediate view.

## G2-3-033-024  [P2] GAP  facet F05  effort M
- Legacy: `docs/design/old-lms-shell.css:67-72`
- vNext now: `src/app/globals.css:641-645`
- Fix: Legacy tablet header narrows search at 768–1199; vNext mobile table changes at 768, canvas at640. Inspect breakpoint interactions.

## G2-3-033-053  [P2] GAP  facet F15  effort M
- Legacy: `docs/design/old-lms-shell.css:73-85`
- vNext now: `src/app/globals.css:112-115`
- Fix: Legacy global notification toast may overlap mobile footer; vNext reserves offset64 via footer CSS, verify stack ordering.

## G2-3-033-058  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/styles/pages/_courses.scss:757-817`
- vNext now: `src/app/globals.css:641-645`
- Fix: Legacy learner lecture content uses @media max767 and adjusts card padding/icon widths; vNext global canvas has max639, validate 640–767.

## G2-3-033-068  [P2] GAP  facet F19  effort M
- Legacy: `docs/design/old-lms-shell.css:38-43`
- vNext now: `src/app/globals.css:193-201`
- Fix: Legacy thin scrollbars appear on sidebar hover, while vNext globally hides scrollbar chrome; maintain visible overflow cues.
