# Work packet: edit src/components/placements/college-drive-bulk-actions.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-all.md

## G2-9-015-068  [P1] GAP  facet F12  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:426-475` — Delete impact reveals notifications and cancelled interviews before soft delete.
- vNext now: `src/components/placements/college-drive-bulk-actions.tsx:64-68` — Bulk close withdraws issued offers, not delete.
- Fix: Keep separate close/archive semantics and show cascade effects.

## G2-9-015-051  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:337-355` — Single status success Job opened successfully / Job closed successfully.
- vNext now: `src/components/placements/college-drive-bulk-actions.tsx:72-79` — Bulk summary n drive(s) updated; single action status wording elsewhere.
- Fix: Use legacy exact open/close success copy.

## G2-9-015-052  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:358-405` — Bulk success n drive(s) opened/closed, partial n failed with retry failed.
- vNext now: `src/components/placements/college-drive-bulk-actions.tsx:72-78` — n drive(s) updated;n skipped with skipped reasons.
- Fix: Use verb-specific summary and preserved failed selection.
