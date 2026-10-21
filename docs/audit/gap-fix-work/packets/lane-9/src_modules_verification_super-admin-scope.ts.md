# Work packet: edit src/modules/verification/super-admin-scope.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-verification.md

## G2-10-024-032  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:160-166 — Access error 'Could not check your verification access' separate retry.
- vNext now: src/app/(authenticated)/admin/colleges/[collegeId]/verification/page.tsx:27-33; src/modules/verification/super-admin-scope.ts:6-14 — Permission failures throw route error, no access-only Retry.
- Fix: Show source unauthorized info vs transient access error
