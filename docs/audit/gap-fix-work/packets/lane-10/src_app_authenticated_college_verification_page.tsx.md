# Work packet: edit src/app/(authenticated)/college/verification/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-verification.md

## G2-9-020-029  [P2] GAP  facet F07  effort M
- Legacy: Legacy access fetch failure Could not check your verification access `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:157-166,379-382`
- vNext now: New page catches unavailable tables and limit errors separately `src/app/(authenticated)/college/verification/page.tsx:31-48`
- Fix: Show access-specific error and retry distinct from DB availability.
