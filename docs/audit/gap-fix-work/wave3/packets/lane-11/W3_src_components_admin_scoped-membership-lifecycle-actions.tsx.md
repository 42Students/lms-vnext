# Work packet (wave 3): edit src/components/admin/scoped-membership-lifecycle-actions.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/superadmin-faculty-section.md

## G2-6-002-050  [P1] MISSING  facet F09  effort L
- Legacy: Old Clear OTP, Suspend, Reactivate, Delete each have distinct confirmations `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:838-935`
- vNext now: New only suspend/reactivate ConfirmDialog `src/components/admin/scoped-membership-lifecycle-actions.tsx:35-62`
- Fix: Expose secured OTP reset/delete confirmation flows with dependency messages
