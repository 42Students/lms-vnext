# Work packet (wave 2): edit src/components/placements/college-drive-row-lifecycle-action.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-all.md

## G2-9-015-060  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/api/Services/AdminService.js:812-824` — Single setAdminJobStatus POST .../{jobId}/status {isActive}.
- vNext now: `src/components/placements/college-drive-row-lifecycle-action.tsx:1-80` — VNext row action uses explicit status lifecycle handlers, not bool.
- Fix: Translate legacy booleans to guarded CLOSED/PUBLISHED transitions.
