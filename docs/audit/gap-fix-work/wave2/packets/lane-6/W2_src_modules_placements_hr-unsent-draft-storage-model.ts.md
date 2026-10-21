# Work packet (wave 2): edit src/modules/placements/hr-unsent-draft-storage-model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/recruiter-drives-new.md

## G2-11-004-109  [P2] GAP  facet F19  effort S
- Legacy: Legacy draft localStorage and no expiry in parser `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:129`
- vNext now: Restoration enforces expiry, 24h storage `src/modules/placements/hr-unsent-draft-storage-model.ts:38`
- Fix: Plan migration/expiry messaging

## G2-11-004-110  [P2] GAP  facet F19  effort S
- Legacy: Draft keyed user and college `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:92`
- vNext now: New key scoped to fromJobId also `src/modules/placements/hr-unsent-draft-storage-model.ts:5`
- Fix: Migrate legacy key and avoid cross-source contamination

## G2-11-004-120  [P2] GAP  facet F22  effort S
- Legacy: Browser storage key recruiter-drive-draft:user:college `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:18`
- vNext now: New hrDriveSessionStorageKey format `src/modules/placements/hr-unsent-draft-storage-model.ts:5`
- Fix: Safely import unexpired legacy drafts
