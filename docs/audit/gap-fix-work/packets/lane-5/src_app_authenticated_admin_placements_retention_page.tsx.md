# Work packet: edit src/app/(authenticated)/admin/placements/retention/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-index.md, docs/audit/gap2/lane-11/l17-u030-drives-landing.md

## G2-10-017-036  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:176-191 — Retention fetch error Alert with Retry, lazy GET on expand.
- vNext now: src/app/(authenticated)/admin/placements/retention/page.tsx:14-42 — Route fetch may fail entirely; no inline retry.
- Fix: Add panel-local Retry.

## G2-17-030-027  [P2] GAP  facet F07  effort S
- Legacy: Retention fetch error `Couldn't load the data retention report.` Retry; DrivesLanding.js:176-190,608-617
- vNext now: vNext dedicated retention page, no inline retry; admin/placements/retention/page.tsx:9-42
- Fix: Provide inline retention error/retry in collapsed disclosure or route return link preserving page.
