# Work packet (wave 2): edit src/components/verification/VerificationExportControl.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-verification.md

## G2-10-024-069  [P2] GAP  facet F14  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:423-426 — TpoDataTable exports CSV named verification-<tab>.
- vNext now: src/components/verification/SuperAdminVerificationPanel.tsx:126-129; src/components/verification/VerificationExportControl.tsx:4-27 — Export CSV named super-admin-profile-verification.csv.
- Fix: Use view-specific filename and column parity
