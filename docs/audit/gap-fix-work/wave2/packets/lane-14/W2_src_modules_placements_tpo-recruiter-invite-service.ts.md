# Work packet (wave 2): edit src/modules/placements/tpo-recruiter-invite-service.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u022-tpo-recruiter-lead-controller.md, docs/audit/gap2/lane-3/public-recruiter-invite-controller.md

## G2-14-022-050  [P2] GAP  facet F15  effort M
- Legacy: Legacy reminder sends day4 via scheduler when still unopened `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadService.java:330-349`
- vNext now: New remindTpoRecruiterInvite checks activity/click/one-shot and calls delivery `src/modules/placements/tpo-recruiter-invite-service.ts:183-235`
- Fix: Wire recurring scheduler and prove timing

## G2-14-022-063  [P2] GAP  facet F21  effort M
- Legacy: Legacy invite email includes TPO note + company public-link metadata `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadService.java:299-325`
- vNext now: New token creation returns link and delivery mediated by email provider `src/modules/placements/tpo-recruiter-invite-service.ts:168-175`
- Fix: Compare every legacy invite merge field and outbound template

## G2-3-026-013  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:150-164`
- vNext now: `src/modules/placements/tpo-recruiter-invite-service.ts:269-283`
- Fix: Legacy preview includes optional reviewDrive title from job lookup; vNext preview DTO has no reviewDrive member.

## G2-3-026-014  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:151-157`
- vNext now: `src/modules/placements/tpo-recruiter-invite-service.ts:274-283`
- Fix: Legacy field name email differs from vNext contactEmail, and expiresAt serializes legacy LocalDateTime vs ISO Date; document adapter for consumers.

## G2-3-026-037  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:144-149`
- vNext now: `src/modules/placements/tpo-recruiter-invite-service.ts:286-326`
- Fix: Legacy GET preview writes inviteClickedAt on first open; vNext requires client POST /opened. Verify reminder suppression if script/hydration fails.

## G2-3-026-052  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:335-343`
- vNext now: `src/modules/placements/tpo-recruiter-invite-service.ts:60-81`
- Fix: Legacy adds six calendar months with default LocalDate while vNext uses IST with month-end clamping; compare leap/day31 and locale behavior live.

## G2-3-026-077  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:144-149`
- vNext now: `src/modules/placements/tpo-recruiter-invite-service.ts:286-326`
- Fix: Legacy first-open side effect occurs in GET and suppresses day4 reminder; vNext depends on browser POST /opened. Test mail-scanner/read-only discrepancy.

## G2-3-026-080  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:135-164`
- vNext now: `src/modules/placements/tpo-recruiter-invite-service.ts:239-283`
- Fix: Legacy recruiter_lead integer ID, email/domain and reviewJobId map to placement_tpo_leads UUID and companyRelationshipId; preserve invite and drive relationship semantics.
