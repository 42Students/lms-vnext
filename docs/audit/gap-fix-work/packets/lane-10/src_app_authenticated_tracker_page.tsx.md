# Work packet: edit src/app/(authenticated)/tracker/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u002-tracker-report.md

## G2-16-002-001  [P1] GAP  facet F01  effort L
- Legacy: `index.js:191-195,344`; `TrackerShell.jsx:52-69`: public `/tracker` reporting landing, standalone branded shell and Report Issue link; no login needed.
- vNext now: `src/app/(authenticated)/tracker/page.tsx:13-28`: session required; active user; non-Super Admin has My reports; shell is authenticated app layout.
- Fix: Restore anonymous intake with approved restricted reporter-session model, or explicitly record signed-in-only policy and adjust external entry links.

## G2-16-002-050  [P1] GAP  facet F11  effort L
- Legacy: `index.js:240-244`; `PublicBugTrackerController.java:15-35`: no-login public report permitted.
- vNext now: `tracker/page.tsx:21-23`; `report-service.ts:18-20`: active authenticated current user required.
- Fix: Implement policy-approved public report access with throttling/safe session, or explicitly document owner exception.

## G2-16-002-060  [P1] GAP  facet F13  effort M
- Legacy: `index.js:194`: public route usable when no user session.
- vNext now: `tracker/page.tsx:21-23,29-33`: route needs session and ready DB flag; else banner/redirect.
- Fix: Expose deliberate unavailable/expired-session recovery to public reporter if public policy reinstated.
