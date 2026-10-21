# Work packet (wave 2): edit src/app/(authenticated)/tpo/drive-day/[roundId]/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drive-day-roundid.md

## G2-11-008-062  [P2] GAP  facet F13  effort M
- Legacy: Initial roster error alert with Retry inside round page. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:218`
- vNext now: TPO throws 404 or bubbles error; no inline Retry. `src/app/(authenticated)/tpo/drive-day/[roundId]/page.tsx:46`
- Fix: Add error panel and refresh Retry.

## G2-11-008-064  [P2] GAP  facet F13  effort S
- Legacy: Skeleton `Loading drive-day roster`. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:257`
- vNext now: Server data loading route; different appearance. `src/app/(authenticated)/tpo/drive-day/[roundId]/page.tsx:41`
- Fix: Match labelled skeleton state.
