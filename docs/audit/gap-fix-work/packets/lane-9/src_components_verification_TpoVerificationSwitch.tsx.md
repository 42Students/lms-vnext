# Work packet: edit src/components/verification/TpoVerificationSwitch.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-verification.md

## G2-10-024-039  [P2] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:286-286 — Switch on: 'The placement cell can now verify profiles'; off: 'Only college admins verify profiles now'.
- vNext now: src/components/verification/TpoVerificationSwitch.tsx:18-20 — Generic 'Verification setting saved.'
- Fix: Use state-specific legacy setting messages
