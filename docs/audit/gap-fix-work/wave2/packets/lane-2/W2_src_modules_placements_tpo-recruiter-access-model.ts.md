# Work packet (wave 2): edit src/modules/placements/tpo-recruiter-access-model.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l15-u022-tpo-recruiter-access-controller.md, docs/audit/gap2/lane-14/u016-recruiter-college-access.md

## G2-15-022-008  [P2] GAP  facet F04  effort M
- Legacy: List fields recruiterId, name, company, designation, `******`+last4 phone, status, grantedAt, validUntil, expired, revokedAt, joinedVia; TpoRecruiterAccessController.java:68-83
- vNext now: View has displayName/designation/company/status/grantedDate/revokedDate/validUntilDate/ended/capabilities/verification; tpo-recruiter-access-model.ts:61-81,103-131
- Fix: Add safe masked phone and joined-through provenance or document deliberate privacy removal; do not expose full number.

## G2-15-022-009  [P2] MISSING  facet F04  effort M
- Legacy: `joinedVia` maps PUBLIC_LINK/COMPANY_LINK/INVITE; TpoRecruiterAccessController.java:80-82; settings.js:727-728
- vNext now: No joinedVia in scoped select/view; tpo-recruiter-access-service.ts:78-101; tpo-recruiter-access-model.ts:61-81
- Fix: Persist grant source and display `Public link`, `Company link`, `Invitation` badges.

## G2-14-016-006  [P2] GAP  facet F03  effort M
- Legacy: Legacy TPO list returns name company designation phone masked status dates and joinedVia `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterAccessController.java:58-83`
- vNext now: New DTO shows displayName designation company dates status capabilities verification but no joinedVia `src/modules/placements/tpo-recruiter-access-model.ts:61-74` `src/modules/placements/tpo-recruiter-access-model.ts:103-130`
- Fix: Restore joinedVia and masked contact field with need-to-know access

## G2-14-016-007  [P2] GAP  facet F03  effort S
- Legacy: Legacy masked phone as six stars plus last 4 digits `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterAccessController.java:73-75`
- vNext now: New projection deliberately omits contact fields from TPO grant view `src/modules/placements/tpo-recruiter-access-model.ts:94-105`
- Fix: Decide privacy waiver and if allowed restore same masked format

## G2-14-016-008  [P2] GAP  facet F03  effort S
- Legacy: Legacy list shows expired bool `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterAccessController.java:77-79`
- vNext now: New shows ended bool for revoked, missing/expired validUntil `src/modules/placements/tpo-recruiter-access-model.ts:120-129`
- Fix: Keep distinct expired and revoked counters/labels

## G2-14-016-052  [P2] GAP  facet F18  effort S
- Legacy: Legacy list uses joinedVia PUBLIC_LINK COMPANY_LINK INVITE `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterAccessController.java:80-83`
- vNext now: New view model lacks joinedVia `src/modules/placements/tpo-recruiter-access-model.ts:61-74`
- Fix: Restore source-of-grant label in TPO list

## G2-14-016-053  [P2] GAP  facet F18  effort S
- Legacy: Legacy phone displays six stars + final4 digits `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterAccessController.java:73-75`
- vNext now: New view model excludes phone altogether `src/modules/placements/tpo-recruiter-access-model.ts:94-105`
- Fix: Document intentional privacy reduction or restore masked last4

## G2-15-022-011  [P3] GAP  facet F04  effort S
- Legacy: Legacy date via dayjs `day()` and access status `Until`; settings.js:705-709
- vNext now: IST formatted en-GB date plus ISO expectedUpdatedAt; tpo-recruiter-access-model.ts:83-95,113-130
- Fix: Compare actual locale/date token and confirm expected IST rendering on 320px/desktop.
