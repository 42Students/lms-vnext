# Work packet (wave 2): edit src/app/(authenticated)/learn/my-placements/applications/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/placement-applications.md

## G2-12-006-012  [P2] GAP  facet F04  effort S
- Legacy: Drive cancellation reason and company rejection message `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:148-154`
- vNext now: DriveStatus and screening feedback without cancelReason field `src/app/(authenticated)/learn/my-placements/applications/page.tsx:37-61`
- Fix: Pass cancel reason and display matching copy

## G2-12-006-041  [P2] GAP  facet F13  effort S
- Legacy: Malformed journey warns and Retry, loads 8-row Skeleton `docs/legacy-source/frontend/src/components/Placements/student/useJourney.js:4-10,18-35`
- vNext now: Server read/route error and only filters Suspense skeleton `src/app/(authenticated)/learn/my-placements/applications/page.tsx:15-20,76-84`
- Fix: Restore section-specific skeleton/error retry

## G2-12-006-059  [P2] GAP  facet F19  effort S
- Legacy: One journey API read, no overview `docs/legacy-source/frontend/src/components/Placements/student/useJourney.js:18-35`
- vNext now: Journey read plus optional request workspace and link computations `src/app/(authenticated)/learn/my-placements/applications/page.tsx:16-35`
- Fix: Review extra join burden and independent error recovery
