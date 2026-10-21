# Work packet: edit src/modules/placements/tpo-recruiter-grant-write-model.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l15-u022-tpo-recruiter-access-controller.md, docs/audit/gap2/lane-14/u016-recruiter-college-access.md

## G2-15-022-017  [P1] GAP  facet F06  effort M
- Legacy: ExtendRequest `months` defaults6 on null body; valid 0..60 (0 removes end); TpoRecruiterAccessController.java:87-105
- vNext now: EXTEND action accepts only 3,6,12; tpo-recruiter-grant-write-model.ts:10-14
- Fix: Support 0,24 and valid 1..60 or document intentional business rules; preserve default6 where applicable.

## G2-15-022-019  [P1] MISSING  facet F06  effort S
- Legacy: Revoke accepts optional `reason`, trimmed max500, server stores; TpoRecruiterAccessController.java:114-135
- vNext now: REVOKE union has no reason field; tpo-recruiter-grant-write-model.ts:16-21; write-service.ts:159-174
- Fix: Add optional reason (≤500 chars) to confirmation and grant update; include in event metadata.

## G2-14-016-011  [P1] GAP  facet F04  effort M
- Legacy: Legacy revokeReason length500 persisted `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/RecruiterCollegeAccess.java:67-68`
- vNext now: New revokeReason text column exists but TPO revoke input has no reason field `src/db/schema/placements.ts:239-243` `src/modules/placements/tpo-recruiter-grant-write-model.ts:15-20`
- Fix: Add optional reason max500 to revoke action and audit

## G2-14-016-017  [P1] GAP  facet F06  effort M
- Legacy: Legacy extend defaults months=6 when missing `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterAccessController.java:87-102`
- vNext now: New EXTEND requires months exactly 3,6 or12 `src/modules/placements/tpo-recruiter-grant-write-model.ts:10-14`
- Fix: Match default6 and support requested legacy 1..60 months where allowed

## G2-14-016-018  [P1] GAP  facet F06  effort M
- Legacy: Legacy extend accepts 0 months for no end date `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterAccessController.java:87-105`
- vNext now: New EXTEND rejects zero and requires expiry `src/modules/placements/tpo-recruiter-grant-write-model.ts:10-14` `src/modules/placements/recruiter-grant-expiry-policy.ts:5-19`
- Fix: Decide whether indefinite grants intentionally prohibited and surface migration policy

## G2-15-022-022  [P2] GAP  facet F07  effort S
- Legacy: Invalid duration `Choose between 0 (no end date) and 60 months`; TpoRecruiterAccessController.java:100-102
- vNext now: Schema rejects unsupported month values without same message; tpo-recruiter-grant-write-model.ts:10-14
- Fix: Mirror help/error wording on UI and API validation.

## G2-15-022-023  [P2] MISSING  facet F07  effort S
- Legacy: Overlong revoke reason `Keep the reason under 500 characters`; TpoRecruiterAccessController.java:125-126
- vNext now: No reason input so no equivalent validation; tpo-recruiter-grant-write-model.ts:16-21
- Fix: Validate trimmed text at 500 and show exact message by field.

## G2-14-016-023  [P2] GAP  facet F07  effort S
- Legacy: Legacy duration invalid says Choose between 0 (no end date) and 60 months `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterAccessController.java:100-102`
- vNext now: New Zod rejects months outside 3 6 12 `src/modules/placements/tpo-recruiter-grant-write-model.ts:10-14`
- Fix: Use accurate allowed duration guidance

## G2-14-016-024  [P2] MISSING  facet F07  effort S
- Legacy: Legacy revoke reason >500 yields Keep the reason under 500 characters `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterAccessController.java:123-127`
- vNext now: New revoke does not accept reason `src/modules/placements/tpo-recruiter-grant-write-model.ts:15-20`
- Fix: Add length500 validation message
