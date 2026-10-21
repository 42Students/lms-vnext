# Work packet (wave 2): edit src/components/tracker/tracker-admin-nav.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u001-tracker-audit-findings.md, docs/audit/gap2/lane-16/u002-tracker-report.md, docs/audit/gap2/lane-16/u003-tracker-issue-detail.md, docs/audit/gap2/lane-16/u004-tracker-issues-index.md, docs/audit/gap2/lane-16/u005-tracker-logs.md

## G2-16-001-002  [P2] GAP  facet F01  effort M
- Legacy: `TrackerShell.jsx:55-62,71-85`: 42 Tracker brand links `/tracker`; separate theme toggle.
- vNext now: `tracker-admin-nav.tsx:7-29`: tabs plus theme toggle, but no standalone 42 Tracker brand/header on this page.
- Fix: Match standalone tracker brand/header and nav hierarchy without disrupting approved authentication.

## G2-16-001-054  [P2] GAP  facet F17  effort M
- Legacy: `TrackerShell.jsx:52-53,88`; `audit-findings.js:161`: skip target and clickable table rows; drawer managed by Ant.
- vNext now: `tracker-admin-nav.tsx:18-29`; `page.tsx:54-55`: skip link and keyboard focusable ID link.
- Fix: Retain proper skip target; if row-click drawer restored, supply Enter/Space and focus return/close.

## G2-16-002-002  [P2] GAP  facet F01  effort M
- Legacy: `TrackerShell.jsx:55-69`: brand 42 Tracker, menu Report Issue, Issues, optional Logs/Audit findings.
- vNext now: `tracker-admin-nav.tsx:7-29`; `tracker/page.tsx:28`: admin-only four tabs, others see My reports link only.
- Fix: Render consistent tracker navigation and brand in permitted role scope; preserve authorized route guards.

## G2-16-002-071  [P2] GAP  facet F17  effort S
- Legacy: `TrackerShell.jsx:52-53,88`: tracker skip-to-content link and target with tabindex -1.
- vNext now: `tracker-admin-nav.tsx:18-29`: skip-to-content rendered only for super admins.
- Fix: Supply skip-to-content/target for all authorized report users.

## G2-16-003-003  [P2] GAP  facet F01  effort M
- Legacy: `TrackerShell.jsx:55-69`: standalone Tracker brand, Report Issue / Issues / logs for managers.
- vNext now: `tracker-admin-nav.tsx:7-29`: tabs within app canvas, brand absent.
- Fix: Restore tracker shell brand/nav hierarchy for issue detail or formally waive standalone shell requirement.

## G2-16-004-004  [P2] GAP  facet F01  effort M
- Legacy: `TrackerShell.jsx:55-69`: standalone tracker navigation for all visitors.
- vNext now: `tracker-admin-nav.tsx:7-29`: admin navigation only inside signed-in shell.
- Fix: Reproduce legacy tracker-brand header/active nav in approved access contexts.

## G2-16-005-003  [P2] GAP  facet F01  effort M
- Legacy: `TrackerShell.jsx:55-69`: tracker header and Logs active nav.
- vNext now: `tracker-admin-nav.tsx:7-29`: admin tabs in authenticated app, no standalone Tracker header.
- Fix: Match Tracker shell/navigation including theme toggle and active-tab style.
