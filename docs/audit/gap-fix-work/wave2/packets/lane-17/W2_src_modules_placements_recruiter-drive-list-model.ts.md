# Work packet (wave 2): edit src/modules/placements/recruiter-drive-list-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/recruiter-drives-index.md

## G2-11-003-029  [P2] GAP  facet F05  effort M
- Legacy: All results rendered in client list, no pagination `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:123`
- vNext now: VNext paginates 20 per page `src/modules/placements/recruiter-drive-list-model.ts:81`
- Fix: Match legacy all-list or explicit owner choice

## G2-11-003-034  [P2] GAP  facet F06  effort S
- Legacy: No maxLength prop on Input.Search `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:154`
- vNext now: vNext Zod rejects >100 chars and input max100 `src/modules/placements/recruiter-drive-list-model.ts:6`
- Fix: Document 100-char new cap or match legacy
