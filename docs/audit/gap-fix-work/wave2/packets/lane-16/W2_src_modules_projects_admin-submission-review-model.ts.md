# Work packet (wave 2): edit src/modules/projects/admin-submission-review-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/superadmin-projects-submissions.md

## G2-4-009-032  [P2] GAP  facet F09  effort M
- Legacy: Legacy Review modal always allows Accept button (even if state unsuitable), submit backend rejects invalid state. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:859-874`)
- vNext now: New canAdminSettleDelivery hides all invalid-state actions and sometimes whole Review button. (`src/modules/projects/admin-submission-review-model.ts:2-7;src/components/projects/project-admin-submission-review.tsx:45-61`)
- Fix: Show modal read-only current status with disabled actions for invalid states, no misleading state.
