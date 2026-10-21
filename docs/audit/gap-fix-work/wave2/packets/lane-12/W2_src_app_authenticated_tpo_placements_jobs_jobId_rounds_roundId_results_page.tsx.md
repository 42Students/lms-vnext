# Work packet (wave 2): edit src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/[roundId]/results/page.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l12-u022-tpo-results-controller.md

## G2-12-022-003  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/RoundsTab.js:210-225,321,374 — Open apply modal from round card's Review and apply N results
- vNext now: src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/[roundId]/results/page.tsx:31-40 — separate round results route with PageHeader and apply control
- Fix: Provide link from round card and preserve one-click discoverability

## G2-12-022-005  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/ResultsEntryModal.jsx:152-190 — 900px modal: paste block then outcome counters/toggle and AG Grid
- vNext now: src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/[roundId]/results/page.tsx:40-62,64-93 — separate collapsible bulk/import sections, then filter and article list
- Fix: Map old modal's user journey to vNext page without hiding primary paste workflow

## G2-12-022-012  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/ResultsEntryModal.jsx:127-141 — AG Grid columns Student, Roll no., Branch, Result, Waitlist rank; editable result
- vNext now: src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/[roundId]/results/page.tsx:75-92 — per-applicant article with Stage result disclosure; no inline sheet cells
- Fix: Provide spreadsheet-style bulk editing or document intentional change

## G2-12-022-013  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/ResultsEntryModal.jsx:185-189 — grid search name/roll and checklist filters Result/Branch; export
- vNext now: src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/[roundId]/results/page.tsx:64-74 — GET filter q Student or role and result status only
- Fix: Restore branch/result-outcome filter and roll-number search on results page

## G2-12-022-042  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/ResultsEntryModal.jsx:43-51,158-159,188-190 — candidate load error with retry; empty No students are in this round yet
- vNext now: src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/[roundId]/results/page.tsx:75-76 — No eligible shortlisted submitted applicants match filter; invalid-filter alert
- Fix: Distinguish truly empty round from filtered zero and unavailable candidate query

## G2-12-022-048  [P2] GAP  facet F17  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/ResultsEntryModal.jsx:133-141,153-157 — single-click select and Enter to choose outcome, modal keyboard close unless saving
- vNext now: src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/[roundId]/results/page.tsx:41-56,83-90 — details summary with focus styles; no AG Grid keyboard cells
- Fix: Provide equivalent keyboard bulk-entry workflow including Enter and focus return

## G2-12-022-011  [P3] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/RoundsTab.js:26,307-312 — round dates formatted D MMM YYYY h:mm A and empty To be decided / -
- vNext now: src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/[roundId]/results/page.tsx:31-39,75-82 — results page shows only round name, counts and stage; no date
- Fix: Surface schedule metadata only where old round review displayed it
