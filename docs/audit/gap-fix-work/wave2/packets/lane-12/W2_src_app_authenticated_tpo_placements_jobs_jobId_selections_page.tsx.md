# Work packet (wave 2): edit src/app/(authenticated)/tpo/placements/jobs/[jobId]/selections/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u031-placements-end-to-end.md

## G2-16-031-079  [P2] GAP  facet F18  effort M
- Legacy: tpo/drives/[jobId].js:266-287 main button texts `Apply <round> results`, `Verify <N> selections`, `Share <N> applicants with <company>`.
- vNext now: tpo/placements/jobs/[jobId]/rounds/page.tsx:47-66 uses `Manage and reorder rounds` and `See who / record results`; selections/page.tsx:22-24 uses `Offer register`.
- Fix: Expose old contextual next-action copy with counts on workspace hero, retain drill-in links secondarily.
