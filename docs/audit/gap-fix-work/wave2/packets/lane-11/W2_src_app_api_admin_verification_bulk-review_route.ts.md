# Work packet (wave 2): edit src/app/api/admin/verification/bulk-review/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-verification.md

## G2-10-024-049  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/api/Services/VerificationService.js:21-21 — POST /verify-many items per learner/section.
- vNext now: src/components/verification/SuperAdminVerificationPanel.tsx:53-59; src/app/api/admin/verification/bulk-review/route.ts:9-16 — POST bulk-review, result summary/failed.
- Fix: Map partial reasons and document per-item receipts
