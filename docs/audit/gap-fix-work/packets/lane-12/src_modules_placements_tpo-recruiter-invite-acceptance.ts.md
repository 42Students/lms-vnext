# Work packet: edit src/modules/placements/tpo-recruiter-invite-acceptance.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/l13-u025-recruiter-pending-invite-controller.md

## G2-13-025-002  [P1] MISSING  facet F01  effort M
- Legacy: RecruiterService has three pending APIs `docs/legacy-source/frontend/src/api/Services/RecruiterService.js:37-40`
- vNext now: Acceptance contract has no post-login consent UI `src/modules/placements/tpo-recruiter-invite-acceptance.ts:9-15`; NONE: no authenticated recruiter/pending-invites API (schema `src/db/schema/placements.ts:206-294`)
- Fix: Add pending invitation panel to authenticated recruiter app.
