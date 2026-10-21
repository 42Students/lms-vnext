# Work packet: edit src/app/(authenticated)/tpo/placements/jobs/[jobId]/change-requests/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u023-tpo-change-request-controller.md

## G2-5-023-041  [P1] GAP  facet F11  effort M
- Legacy: Legacy `/api/v1/tpo/**` permits TPO or college admin fallback when no TPO account (per client service contract). `docs/legacy-source/frontend/src/api/Services/TpoService.js:3-5`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoChangeRequestController.java:22-35`
- vNext now: vNext page strictly requires TPO membership; no College Admin fallback. `src/app/(authenticated)/tpo/placements/jobs/[jobId]/change-requests/page.tsx:11-14`, `src/modules/placements/tpo-drive-change-request-service.ts:18-26`
- Fix: Restore controlled College Admin delegation/acting-role path as required by access policy.

## G2-5-023-026  [P2] GAP  facet F07  effort M
- Legacy: Legacy shows load error `Couldn't load the change requests`, toast backend error, and a `Retry` button. `docs/legacy-source/frontend/src/components/tpo/drive/ChangeRequests.jsx:97-113,160-164`
- vNext now: vNext throws on load instead of inline retry, and mutation strips server reason to generic notice. `src/app/(authenticated)/tpo/placements/jobs/[jobId]/change-requests/page.tsx:15-17,23-25`, `src/components/placements/tpo-drive-change-requests.tsx:53-55`
- Fix: Add inline fetch failure/retry and surface safe server errors.
