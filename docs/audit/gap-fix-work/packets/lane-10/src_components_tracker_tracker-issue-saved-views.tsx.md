# Work packet: edit src/components/tracker/tracker-issue-saved-views.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u004-tracker-issues-index.md

## G2-16-004-033  [P3] GAP  facet F07  effort S
- Legacy: `issues/index.js:160-186`; `trackerSavedFilters.js:16-33`: localStorage errors ignored, in-memory saved views still work.
- vNext now: `tracker-issue-saved-views.tsx:41-44`: failure shows `Saved views are unavailable in this browser.` and updates only on successful write.
- Fix: Keep in-memory fallback on blocked storage; add nonblocking warning.

## G2-16-004-036  [P3] MISSING  facet F08  effort S
- Legacy: `issues/index.js:153-158`: save success toast `Saved view "<name>".`.
- vNext now: `tracker-issue-saved-views.tsx:41-54`: saves silently; no success toast.
- Fix: Emit exact success toast after saving.
