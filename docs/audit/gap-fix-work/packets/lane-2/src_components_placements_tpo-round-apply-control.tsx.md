# Work packet: edit src/components/placements/tpo-round-apply-control.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l12-u022-tpo-results-controller.md

## G2-12-022-024  [P2] GAP  facet F08  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/RoundsTab.js:240-246 — modal warning count for skipped, toast Results applied and students notified, unchanged info 8sec
- vNext now: src/components/placements/tpo-round-apply-control.tsx:77-90 — inline numeric report, CSV and Copy results; no success toast
- Fix: Restore distinct success/skip/unchanged feedback with toast wording/duration

## G2-12-022-023  [P3] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/RoundsTab.js:218-221 — pending load failure exact Could not load the pending results. Retry before applying them.
- vNext now: src/components/placements/tpo-round-apply-control.tsx:24-30 — Could not load round preview or Could not preview results
- Fix: Align exact load-error wording and retry accessibility
