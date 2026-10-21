# Work packet: edit src/modules/identity/context-service.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/role.md, docs/audit/gap2/lane-2/cross-02-authorization-roles.md

## G2-13-016-003  [P1] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/config/roles.js:14-32` frontend account roles includes SUPER_ADMIN,ADMIN,TPO,MENTOR,FACULTY,LEARNER,RECRUITER
- vNext now: `src/modules/identity/constants.ts:17-27` membership roles LEARNER/FACULTY/COLLEGE_ADMIN/MENTOR/TPO, system SUPER_ADMIN; `src/modules/identity/context-service.ts:84-111` recruiter profile separate
- Fix: Write exact account-role mapping (ADMIN→COLLEGE_ADMIN; RECRUITER→profile/grants) with stable routing labels

## G2-13-016-019  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/User.java:41-48` eager load USER_ROLES joins Role globally
- vNext now: `src/modules/identity/context-service.ts:73-81` systemRoles query by user; `src/db/schema/memberships.ts:52-68` membershipRoles need membership id
- Fix: Load roles per chosen active membership and system role separately, with no tenant bleed across switch

## G2-13-016-023  [P1] GAP  facet F11  effort L
- Legacy: `docs/legacy-source/frontend/src/config/roles.js:56-68` resolves app role by userType/facultyType/id, not necessarily stored User.roles
- vNext now: `src/modules/identity/context-service.ts:73-81` loads persisted system roles and active membership roles
- Fix: Audit legacy JWT/legacy Role table consistency and base migration on authoritative resolved identity, not only User.roles

## G2-13-016-040  [P1] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/config/roles.js:56-68` legacy role inference uses userType/facultyType even absent User.roles
- vNext now: `src/modules/identity/context-service.ts:39-55` membership choice and activeRole, `src/modules/identity/context-service.ts:73-81` persisted system grant
- Fix: Audit source of truth: legacy stored roles alone may under-represent active account persona

## G2-2-036-010  [P1] GAP  facet F04  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/security/UserPrincipal.java:17-46 int accountId,userType,facultyType,org,college
- vNext now: src/modules/identity/context-service.ts:225-291 UUID user/membership plus roles
- Fix: Write integer→UUID identity and facultyType→membership role migration mapping.

## G2-2-036-013  [P1] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/access/AccessControlService.java:254-263 learner class+elective membership
- vNext now: src/modules/identity/context-service.ts:277-291 active college membership role but not class set
- Fix: Filter learner content and roster queries by enrolled section/elective classes.

## G2-2-036-054  [P1] GAP  facet F20  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/access/AccessControlService.java:254-263 elective group section membership
- vNext now: src/modules/identity/context-service.ts:277-291 active membership snapshot
- Fix: Recheck active learner section at query/write time.
