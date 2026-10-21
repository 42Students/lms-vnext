# Work packet (wave 2): edit src/modules/verification/super-admin-scope.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-verification.md

## G2-10-024-054  [P2] GAP  facet F11  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:379-381 — Access denied shows 'You cannot verify profiles here' with backend reason.
- vNext now: src/modules/verification/super-admin-scope.ts:6-14; src/app/(authenticated)/admin/colleges/[collegeId]/verification/page.tsx:27-33 — Throws permission denial; local denial panel absent.
- Fix: Render explicit information permission state
