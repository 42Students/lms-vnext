# Work packet (wave 2): edit src/components/verification/TpoVerificationSwitch.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-verification.md

## G2-10-024-012  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:389-398 — Setting Card shows explanation about decision audit.
- vNext now: src/components/verification/TpoVerificationSwitch.tsx:23-32 — Compact inline switch with different explanation.
- Fix: Use legacy explanatory text and status tag

## G2-10-024-087  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:286-286 — Toggle success state-specific wording.
- vNext now: src/components/verification/TpoVerificationSwitch.tsx:19-20 — Generic sentence.
- Fix: Use source messages

## G2-10-024-050  [P3] GAP  facet F10  effort S
- Legacy: docs/legacy-source/frontend/src/api/Services/VerificationService.js:22-23 — GET/PUT verification settings.
- vNext now: src/components/verification/TpoVerificationSwitch.tsx:12-20 — PATCH admin settings with collegeId.
- Fix: Map mutation method but keep same effect
