# Work packet: edit src/components/tracker/tracker-issue-bulk-actions.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u004-tracker-issues-index.md

## G2-16-004-050  [P1] GAP  facet F12  effort S
- Legacy: `issues/index.js:190-213`: after success bulk exits selection; on failure leaves failed IDs selected.
- vNext now: `tracker-issue-bulk-actions.tsx:47-55`: clears selection only after all success; on failure keeps ALL selected (including success).
- Fix: Retain only failed IDs for retry, excluding already-updated rows and preventing redundant writes.

## G2-16-004-034  [P2] GAP  facet F07  effort M
- Legacy: `issues/index.js:200-217`: failure list includes failed IDs and first server error, retry on retained selection.
- vNext now: `tracker-issue-bulk-actions.tsx:47-55,93-94`: failure IDs and generic message; no first specific error.
- Fix: Display first safe cause per failed ID, leave only failures selected.

## G2-16-004-037  [P3] GAP  facet F08  effort S
- Legacy: `issues/index.js:204-209`: bulk success `Updated N issue(s).`; failed `N could not be updated (<IDs>): <reason>`.
- vNext now: `tracker-issue-bulk-actions.tsx:47-55,93-94`: inline `N issues updated.` and generic failures.
- Fix: Restore singular/plural and detailed toast copy.
