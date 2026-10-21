# Work packet: edit src/app/(authenticated)/tpo/placements/jobs/[jobId]/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drives-jobid.md

## G2-11-010-002  [P1] GAP  facet F01  effort M
- Legacy: Query tab=overview aliases to about; unrecognized defaults based on lifecycle. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:49`
- vNext now: Query tab routes recognized to separate pages and defaults workspace overview. `src/app/(authenticated)/tpo/placements/jobs/[jobId]/page.tsx:39`
- Fix: Preserve lifecycle default About for request/draft, Applicants otherwise.

## G2-11-010-028  [P1] GAP  facet F05  effort M
- Legacy: Draft/request/sent-back/rejected default tab About, published/closed Applicants. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:266`
- vNext now: vNext root always workspace overview. `src/app/(authenticated)/tpo/placements/jobs/[jobId]/page.tsx:43`
- Fix: Implement lifecycle-aware default tab redirect.

## G2-11-010-038  [P2] GAP  facet F07  effort M
- Legacy: Job GET 404 maps to PanelNotFound; other errors generic PanelError. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:102`
- vNext now: Malformed/unauthorized/not-found map all to notFound(); other errors throw. `src/app/(authenticated)/tpo/placements/jobs/[jobId]/page.tsx:30`
- Fix: Restore 404 contextual Go to Drives and retryable fetch error.
