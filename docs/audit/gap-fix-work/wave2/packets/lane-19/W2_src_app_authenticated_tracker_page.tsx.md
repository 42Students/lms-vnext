# Work packet (wave 2): edit src/app/(authenticated)/tracker/page.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u002-tracker-report.md

## G2-16-002-002  [P2] GAP  facet F01  effort M
- Legacy: `TrackerShell.jsx:55-69`: brand 42 Tracker, menu Report Issue, Issues, optional Logs/Audit findings.
- vNext now: `tracker-admin-nav.tsx:7-29`; `tracker/page.tsx:28`: admin-only four tabs, others see My reports link only.
- Fix: Render consistent tracker navigation and brand in permitted role scope; preserve authorized route guards.

## G2-16-002-005  [P2] GAP  facet F02  effort M
- Legacy: `index.js:194-246`: standalone tracker shell, h1 header outside form card; success uses dedicated success card.
- vNext now: `tracker/page.tsx:24-34`; `tracker-report-form.tsx:116-137`: app PageHeader and divider section, no original standalone card.
- Fix: Reproduce report wrap, standalone heading and single form card/success card look while retaining shared visual tokens.

## G2-16-002-068  [P2] GAP  facet F16  effort M
- Legacy: `TrackerShell.jsx:52-69`: tracker-specific header/nav wraps; shell independent from app sidebar.
- vNext now: `tracker/page.tsx:24-34`: authenticated application canvas responsive to global shell.
- Fix: Review 1280/768/375 screenshots; keep intended tracker standalone shell if owner requires literal parity.

## G2-16-002-072  [P2] GAP  facet F18  effort S
- Legacy: `index.js:240-244`: eyebrow `Report an LMS issue`, H1 `What went wrong?`, tagline ends `No login needed.`.
- vNext now: `tracker/page.tsx:25-26`: H1 same but description starts `Report an LMS issue ·` and removes no-login claim.
- Fix: Restore exact legacy heading hierarchy/copy if public access is authorized; otherwise document changed login requirement.
