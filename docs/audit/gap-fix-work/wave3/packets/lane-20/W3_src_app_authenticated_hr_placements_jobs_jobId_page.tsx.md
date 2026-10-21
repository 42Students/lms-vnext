# Work packet (wave 3): edit src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/recruiter-drives-jobid.md

## G2-11-002-009  [P0] MISSING  facet F02  effort L
- Legacy: Offers tab embeds send selection list form `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:509`
- vNext now: Offers explicitly read-only `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:658`
- Fix: Restore selection composer

## G2-11-002-037  [P0] MISSING  facet F06  effort L
- Legacy: Offer/LOI kind default OFFER, CTC form `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:744`
- vNext now: VNext states no selection sent `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:683`
- Fix: Build full selection form

## G2-11-002-054  [P0] MISSING  facet F09  effort L
- Legacy: CTC unusual warning inside selection confirmation `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:734`
- vNext now: No selection confirmation `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:683`
- Fix: Implement confirmation

## G2-11-002-055  [P0] MISSING  facet F10  effort L
- Legacy: POST selections endpoint `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterDriveController.java:178`
- vNext now: No selection mutation in Offers `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:683`
- Fix: Add recruiter selection API

## G2-11-002-098  [P0] MISSING  facet F23  effort L
- Legacy: Selection send CTA under Offers `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:509`
- vNext now: Only readiness panel, no selection mutation `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:679`
- Fix: Restore CTA
