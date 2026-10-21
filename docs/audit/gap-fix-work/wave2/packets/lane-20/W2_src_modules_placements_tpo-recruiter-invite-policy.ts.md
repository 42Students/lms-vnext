# Work packet (wave 2): edit src/modules/placements/tpo-recruiter-invite-policy.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/public-recruiter-invite-controller.md

## G2-3-026-044  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:135-141`
- vNext now: `src/modules/placements/tpo-recruiter-invite-policy.ts:91-125`
- Fix: Legacy accepts a valid stored invite token of <=200 chars; vNext rejects any token not exactly 43 base64url chars. Accept known issued credential format only and document migration.

## G2-3-026-049  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:135-141`
- vNext now: `src/modules/placements/tpo-recruiter-invite-policy.ts:91-125`
- Fix: Legacy uses LocalDateTime isBefore expiry (boundary equality still passes); vNext expires at >= boundary and rejects clock-before-issue; document boundary choice.

## G2-3-026-073  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:135-141`
- vNext now: `src/modules/placements/tpo-recruiter-invite-policy.ts:91-115`
- Fix: Time arithmetic differs near seven-day exact boundary/timezone. Add deterministic boundary tests and state exact expiry rule.
