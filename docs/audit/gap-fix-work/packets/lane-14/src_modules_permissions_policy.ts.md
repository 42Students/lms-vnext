# Work packet: edit src/modules/permissions/policy.ts

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/cross-02-authorization-roles.md

## G2-2-036-011  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/access/AccessControlService.java:186-200 learner self and staff college-level access
- vNext now: src/modules/permissions/policy.ts:154-160 profile self and :198-204 broad academic read
- Fix: Enforce own-learner scope in every roster and profile endpoint.

## G2-2-036-014  [P1] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/access/AccessControlService.java:327-341 current-semester course audience
- vNext now: src/modules/permissions/policy.ts:198-204 college-wide courses.read
- Fix: Add delivery-level audience check beyond generic read permission.

## G2-2-036-017  [P1] GAP  facet F06  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/security/TpoTeamAccessFilter.java:49-63 delegated faculty TPO admin
- vNext now: src/modules/permissions/policy.ts:236-240 TPO or College Admin only
- Fix: Migrate TPO team delegation to explicit membership/grant.

## G2-2-036-018  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/configuration/WebSecurityConfig.java:143 admin API role; :135-142 global tools
- vNext now: src/modules/permissions/policy.ts:169-181 SA scoped/global exception matrix
- Fix: Audit SA acting-college mutations without demanding local CA membership.

## G2-2-036-027  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/configuration/WebSecurityConfig.java:113-203 HTTP matcher and filters authorization
- vNext now: src/modules/permissions/policy.ts:265-273 per-feature explicit requirePermission
- Fix: Audit all API handlers against typed permission and target owner.

## G2-2-036-028  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/security/RecruiterFenceFilter.java:17-85 recruiter token denied outside allowed prefixes
- vNext now: src/modules/permissions/policy.ts:100-119 recruiter grant checked only for recruiter-specific permissions
- Fix: Establish global recruiter deny-by-default API fence.

## G2-2-036-032  [P1] GAP  facet F11  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/security/TpoTeamAccessFilter.java:49-63 team staff role
- vNext now: src/modules/permissions/policy.ts:236-240 TPO membership role
- Fix: Reconcile team admin role grants and fail-closed mutations.

## G2-2-036-034  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/access/AccessControlService.java:229-251 learner program own only
- vNext now: src/modules/permissions/policy.ts:198-204 academics.read same college
- Fix: Apply own program/section scoping in learner API service queries.

## G2-2-036-056  [P1] GAP  facet F20  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/security/RecruiterFenceFilter.java:144-155 malformed encoded recruiter path rejected
- vNext now: src/modules/permissions/policy.ts:100-119 grant based check
- Fix: Reject encoded/double slash recruiter route traversals at request boundary.

## G2-2-036-059  [P1] GAP  facet F21  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/security/TpoTeamAccessFilter.java:21-27 TpoTeamService team filter
- vNext now: src/modules/permissions/policy.ts:236-240 TPO role direct membership
- Fix: Migrate team service roles to authoritative new membership roles.

## G2-2-036-065  [P1] GAP  facet F23  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/security/RecruiterFenceFilter.java:17-31 global recruiter deny by default
- vNext now: src/modules/permissions/policy.ts:100-119 per-recruiter grant check
- Fix: Add equivalent fence while honoring own auth routes.
