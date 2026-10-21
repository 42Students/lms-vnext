# Work packet: edit src/app/(authenticated)/tracker/issues/page.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u004-tracker-issues-index.md

## G2-16-004-001  [P1] GAP  facet F01  effort L
- Legacy: `issues/index.js:225-236`: public `/tracker/issues`, TrackerShell active Issues, Report issue primary link.
- vNext now: `src/app/(authenticated)/tracker/issues/page.tsx:32-34,81-95`: unscoped Super Admin-only, app shell, no Report issue CTA.
- Fix: Restore safe public issue discovery with privacy policy and Report issue link or get explicit authenticated-only sign-off.

## G2-16-004-019  [P1] GAP  facet F05  effort M
- Legacy: `issues/index.js:99-122`: GET filters status/environment/reporter/search/sort, default 20 per page.
- vNext now: `tracker/issues/page.tsx:67-80`; `issues-query-model.ts:5-15`: query uses status/severity/environment/q/reporter/sort, always limit 50.
- Fix: Restore legacy visible 20/page and equivalent query/filter contract, retain new severity filter as optional enhancement.

## G2-16-004-045  [P1] GAP  facet F11  effort L
- Legacy: `issues/index.js:227-235`; `PublicBugTrackerController.java:15-47`: public list by default, any visitor may inspect reported issues.
- vNext now: `tracker/issues/page.tsx:32-34`: requires unscoped Super Admin.
- Fix: Define privacy-safe reporter list (at least public redacted subset), retain private engineering separation.

## G2-16-004-032  [P2] GAP  facet F07  effort M
- Legacy: `issues/index.js:114-116`: GET error shows API message or `Issues could not be loaded.`.
- vNext now: `tracker/issues/page.tsx:38-59,67`: ready/invalid state handled, unhandled DB list error falls into Next error boundary.
- Fix: Catch list failure and show inline `Issues could not be loaded.` with retry.

## G2-16-004-038  [P3] GAP  facet F08  effort S
- Legacy: `issues/index.js:293`: load failure Ant alert.
- vNext now: `tracker/issues/page.tsx:38-62`: warning/error state for setup/invalid filters, no regular query failure alert.
- Fix: Show inline retryable Alert on query errors.
