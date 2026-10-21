# Work packet (wave 2): edit src/components/hr/hr-unsent-drive-alert.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/recruiter-drives-index.md

## G2-11-003-102  [P2] GAP  facet F22  effort S
- Legacy: Legacy localStorage key recruiter-drive-draft:user:college `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:92`
- vNext now: VNext storage scoped through hrDriveSessionStorageKey `src/components/hr/hr-unsent-drive-alert.tsx:10`
- Fix: Migrate old browser draft key or warn before cutoff
