# Work packet (wave 2): edit src/app/(authenticated)/tpo/placements/jobs/[jobId]/page.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drives-jobid.md, docs/audit/gap2/lane-16/u031-placements-end-to-end.md, docs/audit/gap2/lane-3/tpo-drive-controller.md

## G2-11-010-016  [P2] GAP  facet F03  effort S
- Legacy: Discussion button visible next to header main action. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:383`
- vNext now: Discuss is nested under Drive shortcuts details. `src/app/(authenticated)/tpo/placements/jobs/[jobId]/page.tsx:51`
- Fix: Promote Discussion as visible header action.

## G2-11-010-069  [P2] GAP  facet F13  effort S
- Legacy: First load DetailSkeleton Loading drive workspace. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:261`
- vNext now: New server page loads component; skeleton boundary not in code. `src/app/(authenticated)/tpo/placements/jobs/[jobId]/page.tsx:30`
- Fix: Add matching detail skeleton and load label.

## G2-11-010-070  [P2] GAP  facet F13  effort S
- Legacy: Not found panel says This drive doesn't exist; Go to Drives. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:262`
- vNext now: Next notFound() renders generic 404. `src/app/(authenticated)/tpo/placements/jobs/[jobId]/page.tsx:36`
- Fix: Restore direct link and explanation.

## G2-11-010-071  [P2] GAP  facet F13  effort M
- Legacy: Network fault PanelError with Retry. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:263`
- vNext now: Throws to global error boundary. `src/app/(authenticated)/tpo/placements/jobs/[jobId]/page.tsx:37`
- Fix: Render in-page Retry with loaded state preserved.

## G2-16-031-071  [P2] GAP  facet F16  effort M
- Legacy: tpo/drives/[jobId].js:459-485 has AntD tabs and section content with destroyInactiveTabPane, in one page.
- vNext now: tpo/placements/jobs/[jobId]/page.tsx:39-45 uses navigation redirects, separate views for each tab.
- Fix: Match old active-tab thickness/color and avoid full-page context jump when switching.

## G2-3-023-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:25-74`
- vNext now: `src/modules/placements/tpo-drive-lifecycle-list-service.ts:15-101`, `src/app/(authenticated)/tpo/placements/jobs/[jobId]/page.tsx:17-45`
- Fix: Legacy route /api/v1/tpo/drives list and detail vs vNext paged TPO placement lifecycle view. Preserve equivalents and actor scope.
