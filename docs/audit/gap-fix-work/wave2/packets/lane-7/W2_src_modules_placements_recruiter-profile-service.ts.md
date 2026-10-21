# Work packet (wave 2): edit src/modules/placements/recruiter-profile-service.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/recruiter-profile.md, docs/audit/gap2/lane-10/recruiter-self-controller.md, docs/audit/gap2/lane-14/u016-recruiter-college-access.md, docs/audit/gap2/lane-15/recruiter.md

## G2-1-035-019  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:131-166: GET /me returns scope GLOBAL/COLLEGE, selected collegeId and capabilities and colleges info.
- vNext now: src/modules/placements/recruiter-profile-service.ts:28-66: returns user, company and trusted grant context but not old scope/capabilities fields on page.
- Fix: Restore current recruiter scope and capabilities context where business needs it.

## G2-10-025-015  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:159-166 — user object returned via RecruiterAuthService.authUser.
- vNext now: src/modules/placements/recruiter-profile-service.ts:32-67 — Returns users displayName/email/phone/title/company/grants DTO.
- Fix: Map source user fields incl split names

## G2-10-025-016  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:148-154 — Colleges numeric collegeId, code, logo, validUntil, membershipKey.
- vNext now: src/modules/placements/recruiter-profile-service.ts:65-67; src/app/(authenticated)/hr/home/page.tsx:58-69 — UUID grant IDs and code but logo/membership key missing.
- Fix: Define ID/key translation and logo inclusion

## G2-10-025-049  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:131-166 — GET /api/v1/recruiter/me returns scope and identity.
- vNext now: src/modules/placements/recruiter-profile-service.ts:28-67 — getRecruiterSelfProfile reads DB user/profile/company plus grants.
- Fix: Add scope/capabilities/colleges to API DTO

## G2-10-025-096  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:139-166 — RecruiterCollegeAccess grant validUntil/capabilities/membershipKey.
- vNext now: src/modules/placements/recruiter-profile-service.ts:65-67 — UUID grants with relationship/company constraints.
- Fix: Map lifecycle/capability fields to DTO

## G2-10-025-100  [P2] GAP  facet F23  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:131-166 — Old globalMembershipKey and scoped membershipKey.
- vNext now: src/modules/placements/recruiter-profile-service.ts:65-67 — UUID grants, no legacy membership keys exposed.
- Fix: Document intentional migration and remove reliance on legacy keys

## G2-14-016-044  [P2] GAP  facet F13  effort S
- Legacy: Legacy unusable recruiter returns Recruiter account is not active `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterAccessService.java:77-79`
- vNext now: New hasActiveRecruiter denies as authorization error `src/modules/placements/recruiter-profile-service.ts:16-25`
- Fix: Restore helpful suspended-account guidance

## G2-15-016-036  [P2] GAP  facet F10  effort M
- Legacy: Contacts stored in recruiter table. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Recruiter.java:37-48`)
- vNext now: New contact from users and separate public contacts. (`src/modules/placements/recruiter-profile-service.ts:28-65`)
- Fix: Project into old recruiter profile DTO without leaking private login factor.
