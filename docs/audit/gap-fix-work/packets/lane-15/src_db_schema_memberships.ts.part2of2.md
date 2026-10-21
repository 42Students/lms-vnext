# Work packet: edit src/db/schema/memberships.ts (part 2 of 2)

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u019-learner.md, docs/audit/gap2/lane-5/u027-learner-controller.md, docs/audit/gap2/lane-5/u031-admin-users.md, docs/audit/gap2/lane-6/superadmin-faculty-section.md, docs/audit/gap2/lane-6/superadmin-teachers.md, docs/audit/gap2/lane-9/l15-u027-faculty-controller.md

## G2-5-019-003  [P1] GAP  facet F02  effort L
- Legacy: Legacy single learner record contains account, academic, profile sections `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:20-232`
- vNext now: VNext splits users/member/profile/enrollment `src/db/schema/users.ts:10-30` `src/db/schema/memberships.ts:14-65` `src/db/schema/profiles.ts:11-29`
- Fix: Create field-level migration and unified view projection.

## G2-5-019-008  [P1] GAP  facet F04  effort L
- Legacy: Legacy numeric BaseModel id and tenant IDs on learner `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:49-59` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:22-37`
- vNext now: VNext UUID user and college memberships + relation `src/db/schema/users.ts:12-18` `src/db/schema/memberships.ts:15-22`
- Fix: Maintain old numeric→UUID mapping, verify cross-tenant identity.

## G2-5-019-009  [P1] GAP  facet F04  effort M
- Legacy: Legacy suspendedAt and suspensionReason learner-wide `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:21-28`
- vNext now: VNext membership scoped suspendedAt/reason, user platformStatus `src/db/schema/memberships.ts:19-27` `src/db/schema/users.ts:20-25`
- Fix: Define precedence and multi-college suspension scope.

## G2-5-019-011  [P1] GAP  facet F04  effort L
- Legacy: Legacy tokenVersion0 and @Version Long `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:64-74`
- vNext now: VNext users/membership tables lack matching columns `src/db/schema/users.ts:12-29` `src/db/schema/memberships.ts:14-43`
- Fix: Prove session revocation and optimistic concurrency after split.

## G2-5-019-050  [P1] GAP  facet F12  effort M
- Legacy: Legacy active suspension distinguished from isDeleted `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:21-28` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:36-37`
- vNext now: VNext global platformStatus and per-membership status/ended lifecycle `src/db/schema/users.ts:20-25` `src/db/schema/memberships.ts:19-27`
- Fix: Define precedence for suspended, inactive, ended and deleted.

## G2-5-019-067  [P1] GAP  facet F22  effort L
- Legacy: Legacy learner table contains account, academic, profile JSON and PII `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:20-232`
- vNext now: New users/memberships/roles/learnerProfiles normalized `src/db/schema/users.ts:12-29` `src/db/schema/memberships.ts:14-65` `src/db/schema/profiles.ts:11-29`
- Fix: Publish complete column mapping including dynamic arrays and PII.

## G2-5-019-068  [P1] GAP  facet F22  effort L
- Legacy: Legacy BaseModel int key/isDeleted and @Version/tokenVersion `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:22-37` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:64-74`
- vNext now: New UUID+status but no original version/tokenVersion `src/db/schema/memberships.ts:14-43` `src/db/schema/users.ts:12-29`
- Fix: Specify deletion, session validity and legacy ID mapping.

## G2-5-027-081  [P1] GAP  facet F22  effort M
- Legacy: Legacy Learner entity centric integer ID and many profile fields. `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LearnerDTO.java:14-40`
- vNext now: vNext UUID user/college membership + learnerProfiles JSON, academic enrollment separate. `src/db/schema/memberships.ts:17-65`, `src/modules/people/college-student-registration-service.ts:38-80`
- Fix: Write field-by-field migration map and preserve learner ID for bookmarks.

## G2-5-031-065  [P1] GAP  facet F22  effort M
- Legacy: Legacy Admin user is Faculty record with facultyType ADMIN or TPO, isDeleted, phone,email,organizationId,collegeId. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:295-301`
- vNext now: vNext user+college_membership+membership_roles and platformStatus, UUIDs. `src/db/schema/memberships.ts:17-65`, `src/modules/colleges/admin-session-service.ts:44-68`
- Fix: Map numeric Faculty IDs to person/membership and migration status.

## G2-6-002-088  [P1] GAP  facet F22  effort M
- Legacy: Old department/college IDs are same-record ints `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:44-50`
- vNext now: New primaryDepartmentId FK only to departments; membership references college separately `src/db/schema/profiles.ts:36-43` `src/db/schema/memberships.ts:20-26`
- Fix: Enforce primaryDepartment belongs to membership college at service boundary and audit cross-tenant attempts

## G2-6-003-049  [P1] GAP  facet F22  effort M
- Legacy: Old faculty registration persists single faculty row with college_id and dept_id `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:35-56`
- vNext now: New account uses users, college_memberships and faculty_profiles `src/db/schema/memberships.ts:17-68` `src/db/schema/profiles.ts:33-43`
- Fix: Document old-to-new FK/enum mapping and enforce department-in-selected-college

## G2-15-027-010  [P1] GAP  facet F04  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:53-69 facultyType, userType and tokenVersion/version on Faculty
- vNext now: src/db/schema/users.ts:12-24 user account and src/db/schema/memberships.ts:17-67 multi-role memberships separate
- Fix: Specify migration equivalence and protected-role semantics across split entities.

## G2-15-027-068  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:20-69,89-100 single faculty entity with integer id/college/department/contacts
- vNext now: src/db/schema/users.ts:12-29 users global UUID plus src/db/schema/memberships.ts:17-67 membership/roles
- Fix: Map every retained legacy field and scoped ID to users,memberships,facultyProfiles.
