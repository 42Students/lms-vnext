# Work packet (wave 3): edit src/modules/placements/college-round-slot-action-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-interviews.md

## G2-9-012-051  [P1] MISSING  facet F15  effort L
- Legacy: `docs/legacy-source/frontend/src/api/Services/interviewService.js:161-165` — Legacy feedback submits candidate interview feedback
- vNext now: `src/modules/placements/college-round-slot-action-service.ts:68-185` — No scoring/feedback POST in slot action
- Fix: Preserve interviewer feedback workflow and notifications
