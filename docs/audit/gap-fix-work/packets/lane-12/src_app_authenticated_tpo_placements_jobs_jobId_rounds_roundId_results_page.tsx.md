# Work packet: edit src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/[roundId]/results/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l12-u022-tpo-results-controller.md

## G2-12-022-037  [P1] GAP  facet F11  effort M
- Legacy: docs/legacy-source/frontend/src/api/Services/TpoService.js:3-5 — TPO API intentionally works for college ADMIN where no TPO account exists
- vNext now: src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/[roundId]/results/page.tsx:20-23 — TPO-only membership; redirect others /dashboard
- Fix: Decide admin delegation parity and document permission role exception

## G2-12-022-052  [P1] GAP  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/ResultsEntryModal.jsx:185-189 — grid 420px viewport and table virtualization
- vNext now: src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/[roundId]/results/page.tsx:43-51,75-92 — eligible list capped 500; bulk staging disabled above 500
- Fix: Provide multi-page eligible roster/bulk operations for large campus drives
