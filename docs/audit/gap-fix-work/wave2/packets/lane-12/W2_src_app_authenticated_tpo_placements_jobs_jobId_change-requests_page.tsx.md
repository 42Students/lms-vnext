# Work packet (wave 2): edit src/app/(authenticated)/tpo/placements/jobs/[jobId]/change-requests/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u023-tpo-change-request-controller.md

## G2-5-023-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy renders an embedded `Change requests` card within the drive, opened through a `Request a change` modal. `docs/legacy-source/frontend/src/components/tpo/drive/ChangeRequests.jsx:160-170`
- vNext now: vNext is a separate page accessed from secondary `Change requests` link, with expandable inline composer. `src/app/(authenticated)/tpo/placements/jobs/[jobId]/change-requests/page.tsx:11-25`, `src/modules/placements/tpo-drive-tab-model.ts:18-28`
- Fix: Restore contextual embedded access or provide equivalent in-drive jump/action while retaining new route.

## G2-5-023-047  [P2] GAP  facet F13  effort M
- Legacy: Legacy loading card spinner, failed load inline alert/retry, empty sides-specific guidance. `docs/legacy-source/frontend/src/components/tpo/drive/ChangeRequests.jsx:84-105,160-164`
- vNext now: vNext server-rendered page with generic thrown error; empty `No change requests for this drive.` `src/app/(authenticated)/tpo/placements/jobs/[jobId]/change-requests/page.tsx:15-25`, `src/components/placements/tpo-drive-change-requests.tsx:79-80`
- Fix: Add loading/error/retry/empty states with original side-specific copy.
