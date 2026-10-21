# Work packet (wave 2): edit src/modules/placements/recruiter-self-grants-service.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/recruiter-profile.md, docs/audit/gap2/lane-9/l13-u025-recruiter-pending-invite-controller.md

## G2-1-035-076  [P2] GAP  facet F22  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:137-166: RecruiterCollegeAccess grants include logoUrl, collegeCode, validUntil, membershipKey.
- vNext now: src/modules/placements/recruiter-self-grants-service.ts:102-169: current grants collegeName/status/grant date/validUntil, but no logo/membershipKey.
- Fix: Include college logo/code when showing access list as legacy.

## G2-13-025-007  [P2] GAP  facet F04  effort S
- Legacy: GET object keys collegeId,collegeName,company,invitedContact `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:296-299`
- vNext now: Profile grant fields collegeName, collegeCode, grantStatus; active only `src/modules/placements/recruiter-self-grants-service.ts:102-117`
- Fix: Add pending projection and map display copy.

## G2-13-025-030  [P2] MISSING  facet F13  effort S
- Legacy: QueryForList returns [] with zero pending `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:295-300`
- vNext now: Only active-grants empty list on self page `src/modules/placements/recruiter-self-grants-service.ts:74-80`
- Fix: Show empty pending-invites state distinct from no active colleges.

## G2-13-025-038  [P2] MISSING  facet F18  effort S
- Legacy: Old payload gives college name, company and invited contact `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:295-300`
- vNext now: Active grant overview omits company and invite contact `src/modules/placements/recruiter-self-grants-service.ts:104-117`
- Fix: Present exact pending card information, validate old CTA text live.

## G2-13-025-040  [P2] GAP  facet F19  effort M
- Legacy: Old pending list has no LIMIT `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:296-300`
- vNext now: New grant reader query bounded to trusted active grants `src/modules/placements/recruiter-self-grants-service.ts:102-167`
- Fix: Bound own pending invite result safely; preserve complete list via pagination.
