# Work packet: edit src/app/(authenticated)/college/placements/page.tsx

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-index.md

## G2-9-016-006  [P1] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:602-655` — Data retention report and StudentPlacementLookup appear below cards.
- vNext now: `src/app/(authenticated)/college/placements/page.tsx:38-45` — Operations overview, seasons, companies, recruiter access instead.
- Fix: Restore housekeeping and student lookup after cards; keep extra sections secondary.

## G2-9-016-014  [P1] MISSING  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:251-258` — Four metrics Active drives, Needs attention, Closed / draft, All drives with accurate totals.
- vNext now: `src/app/(authenticated)/college/placements/page.tsx:22-40` — No metric tiles, only attention.total in disclosure.
- Fix: Render four exact tiles and overall job counts.

## G2-9-016-031  [P1] MISSING  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:619-640` — Retention report data totalStaleCount, thresholdDays default180, sample with status/lastActivityAt up to200.
- vNext now: `src/app/(authenticated)/college/placements/page.tsx:38-45` — No retention report dataset in page.
- Fix: Add lazy read-only retention DTO and sample truncation.

## G2-9-016-033  [P1] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:462-492` — Search by drive or company, client filters top60; URL q shallow synced.
- vNext now: `src/app/(authenticated)/college/placements/page.tsx:34-45` — No search input on active page; full archive separately filterable.
- Fix: Place search on Active drives section and preserve q deep link.

## G2-9-016-043  [P1] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:126-132` — Failed active list loads error Couldn't load drives. Check your connection and retry.
- vNext now: `src/app/(authenticated)/college/placements/page.tsx:19-20` — Attention data thrown on server request; no local active list error message.
- Fix: Return section-scoped Retry with exact list error message.

## G2-9-016-044  [P1] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:145-153` — Attention failures Couldn't check for anything that needs attention. shows own retry, independent of jobs.
- vNext now: `src/app/(authenticated)/college/placements/page.tsx:19-20` — Single await attention, failure aborts whole page.
- Fix: Isolate attention failure and leave drives/operations working.

## G2-9-016-059  [P1] MISSING  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/api/Services/AdminService.js:920-955` — getAdminDataRetentionReport collegeId,180 lazy fetch.
- vNext now: `src/app/(authenticated)/college/placements/page.tsx:19-45` — No retention fetch.
- Fix: Add lazy server route scoped to college for retention sample.

## G2-9-016-063  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/index.js:33-39` — AdminGroupShell placements gates module availability.
- vNext now: `src/app/(authenticated)/college/placements/page.tsx:12-20` — Membership guard and service permission, no module-off informational UI.
- Fix: Restore disabled placements explanation and actions.

## G2-9-016-072  [P1] MISSING  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:608-639` — Data retention report lazy loads only after expansion with status/err states.
- vNext now: `src/app/(authenticated)/college/placements/page.tsx:38-45` — Not available.
- Fix: Implement lazily fetched disclosure with retries and truncation.

## G2-9-016-048  [P2] MISSING  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:608-619` — Retention loading skeleton and per-panel Retry alert on failure.
- vNext now: `src/app/(authenticated)/college/placements/page.tsx:38-45` — No retention panel.
- Fix: Add retryable retention failure state distinct from other errors.

## G2-9-016-053  [P2] MISSING  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:622-640` — Retention sample truncated says Showing first 200 of N — sample truncated.
- vNext now: `src/app/(authenticated)/college/placements/page.tsx:38-45` — No sample/truncation UI.
- Fix: Restore exact sample count and warning.
