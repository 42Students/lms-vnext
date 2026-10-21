# Work packet: edit src/components/verification/CollegeVerificationPanel.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-verification.md

## G2-9-020-026  [P2] GAP  facet F07  effort S
- Legacy: Sendback reason >=3; empty validation Say what needs to change `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:325-326`
- vNext now: Bulk reason >=3 disabled confirmation with helper copy `src/components/verification/CollegeVerificationPanel.tsx:180-186`
- Fix: Restore exact validation wording in error state.

## G2-9-020-027  [P2] GAP  facet F07  effort S
- Legacy: Single sendback modal placeholder Or write what needs to change `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:464-471`
- vNext now: Bulk textarea placeholder Describe the correction required `src/components/verification/CollegeVerificationPanel.tsx:180-183`
- Fix: Use correct placeholder in matching individual action.
