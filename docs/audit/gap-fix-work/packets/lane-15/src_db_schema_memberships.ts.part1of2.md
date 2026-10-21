# Work packet: edit src/db/schema/memberships.ts (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/admin-user-lifecycle-controller.md, docs/audit/gap2/lane-13/role.md, docs/audit/gap2/lane-15/l18-u031-people-management.md, docs/audit/gap2/lane-19/superadmin-students.md, docs/audit/gap2/lane-2/cross-02-authorization-roles.md, docs/audit/gap2/lane-3/college-org-domain-workspace-scope.md

## G2-1-001-046  [P1] GAP  facet F22  effort L
- Legacy: `Learner.java:21-28,64-74` and `Faculty.java:25-32,59-69` store per-account `suspended_at`, `suspension_reason`, `token_version`, JPA `version`; `AdminUserLifecycleController.java:97-99` mutates person table.
- vNext now: `memberships.ts:17-49`; `drizzle/0000_hard_the_spike.sql:46-55` store per-college state and reason; `users.ts:12-25` has platform status and no per-user token_version.
- Fix: Preserve equivalent immediate token invalidation using device-session/auth checks instead of removed token_version; document one-account-to-many-memberships mapping.

## G2-13-016-019  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/User.java:41-48` eager load USER_ROLES joins Role globally
- vNext now: `src/modules/identity/context-service.ts:73-81` systemRoles query by user; `src/db/schema/memberships.ts:52-68` membershipRoles need membership id
- Fix: Load roles per chosen active membership and system role separately, with no tenant bleed across switch

## G2-13-016-043  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Role.java:22-29` role.name,role.description plus `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:23-37` id,createdAt,updatedAt,isDeleted
- vNext now: `src/db/schema/memberships.ts:52-85` membership/system enum role with id/createdAt; no role definition metadata
- Fix: Document every dropped role-definition column and migrate only authorized assignments; preserve audit date provenance if required

## G2-13-016-044  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/User.java:41-48` USER_ROLES globally keyed to User.id; no college field
- vNext now: `src/db/schema/memberships.ts:20-27` membership links user to college, `src/db/schema/memberships.ts:56-60` membershipRoles join
- Fix: Assign roles in each correct college based on trusted legacy tenant memberships, never duplicate across all colleges

## G2-18-031-050  [P1] GAP  facet F12  effort L
- Legacy: Legacy learner/faculty identities separate numeric records with 10-digit mobile login and soft suspension state; Learner.java:16-73;Faculty.java:20-64
- vNext now: vNext canonical users unique UID/phone/email and one membership per user/college, multiple roles; users.ts:12-31;memberships.ts:17-68
- Fix: Map identity collision/merges and preserve login alias semantics without sharing records across colleges

## G2-18-031-052  [P1] GAP  facet F12  effort L
- Legacy: Legacy Students delete permanently removes learner and records; Students.js:1066-1084;LearnerController.java:1116-1141
- vNext now: vNext ENDED membership preserves shared identity/history; membership-domain.ts:75-89;memberships.ts:17-50
- Fix: Define legal deletion vs reversible end and data retention; implement vetted delete only after dependent records/privacy review

## G2-18-031-079  [P1] GAP  facet F22  effort L
- Legacy: Legacy separate learner/faculty tables numeric id, first/last, phone, type, suspendedAt, tokenVersion, isDeleted and profile JSON; Learner.java:16-73,143-231;Faculty.java:20-64,138-196
- vNext now: vNext users UUID canonical uid/phone/email, collegeMemberships UUID statuses, membershipRoles and separate profiles JSON; users.ts:12-31;memberships.ts:17-69;profiles.ts:15-69
- Fix: Produce full ID crosswalk and field mapper, make no claims of migrated data; preserve old profile JSON for existing rows only when approved

## G2-18-031-081  [P1] GAP  facet F22  effort L
- Legacy: Legacy faculty dept_id, faculty_type and many typed fields on faculty row; Faculty.java:43-99,138-196
- vNext now: vNext facultyProfiles primaryDepartmentId, employmentType, academicTitle and JSON doc, separate roles; profiles.ts:33-69;memberships.ts:52-69
- Fix: Define migration of faculty role/type mapping and protected admin/TPO roles and department FK

## G2-18-031-082  [P1] GAP  facet F22  effort M
- Legacy: Legacy learner/faculty suspendedAt/reason and tokenVersion separate from person type; Learner.java:21-73;Faculty.java:25-64
- vNext now: vNext collegeMemberships suspendedAt/reason, platformStatus, identity_device_sessions with revokedAt; memberships.ts:17-50;users.ts:20-24;identity-device-sessions.ts:20-68
- Fix: Document scope of suspension/OTP invalidation and single account with multiple college memberships

## G2-19-001-087  [P1] GAP  facet F22  effort L
- Legacy: Legacy `learner` single JPA table stores direct class/program/college, demographic/contact, suspension and import-batch fields `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:17-105`
- vNext now: vNext separates `users`, `college_memberships`, `learner_profiles`, and enrollment/section tables `src/db/schema/users.ts:12-30`; `src/db/schema/memberships.ts:17-48`; `src/db/schema/profiles.ts:15-31`; `src/modules/admin-ui/super-admin-scoped-people-service.ts:13-26`
- Fix: Create field-by-field mapping for class transfer, status, contact, JSON profile, bulk batch ID and historical audit IDs; inspect migrations before final parity sign-off.

## G2-2-036-060  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/security/UserPrincipal.java:17-46 integer principal, facultyType
- vNext now: src/db/schema/memberships.ts:17-84 UUID membership/role/system-role tables
- Fix: Provide immutable legacy ID, type and membership mapping.

## G2-3-032-041  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/access/ScopeResolutionService.java:134-169`
- vNext now: `src/db/schema/memberships.ts:17-48`
- Fix: Legacy learner resolves college directly or through home/elective class, vNext active college membership+role determines workspace access.

## G2-3-032-069  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/access/ScopeResolutionService.java:188-265`
- vNext now: `src/db/schema/memberships.ts:17-86`
- Fix: Legacy org/college and learner/class chain scopes vs users/system_roles/college_memberships/membership_roles, many-to-many role workspace. Build map.

## G2-4-020-009  [P1] GAP  facet F03  effort L
- Legacy: Legacy userType String and faculty_type ordinal encodes ADMIN,MENTOR,TPO among others. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:53-57`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/enums/FacultyType.java:3-9`)
- vNext now: New membershipRoles and generic faculty employmentType/academicTitle, no facultyType ordinal. (`src/db/schema/memberships.ts:51-63`; `src/db/schema/profiles.ts:43-44`)
- Fix: Convert all legacy ordinal values to explicit roles/title without guessing.

## G2-4-020-012  [P1] GAP  facet F04  effort L
- Legacy: Legacy deptId/collegeId/organizationId integer IDs on faculty row. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:44-51`)
- vNext now: New departmentId FK UUID, collegeId on membership, organization through College relation. (`src/db/schema/profiles.ts:36-41`; `src/db/schema/memberships.ts:20-27`)
- Fix: Map org/college/department and prevent cross-college FK mismatch.

## G2-4-020-013  [P1] GAP  facet F04  effort L
- Legacy: Legacy FacultyType values PERMANENT,GUEST,VISITING,CONTRACT,ADMIN,HEAD,COORDINATOR,CLERK,PROFESSOR,ASSOCIATE_PROFESSOR,ASSISTANT_PROFESSOR,LECTURER,ADJUNCT,MENTOR,TPO. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/enums/FacultyType.java:3-9`)
- vNext now: New faculty profile has free employmentType and academicTitle, membership Roles separate. (`src/db/schema/profiles.ts:39-44`; `src/db/schema/memberships.ts:51-63`)
- Fix: Map every ordinal and role overlap without reordering historical enum.

## G2-4-020-039  [P1] GAP  facet F11  effort M
- Legacy: Legacy suspended faculty account blocks login while suspendedAt set. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:25-29`)
- vNext now: New membership status SUSPENDED and platform account status, lifecycle service toggles status. (`src/db/schema/memberships.ts:27-31`; `src/modules/people/college-faculty-lifecycle-service.ts:70-82`)
- Fix: Verify login/session invalidation for already-open faculty sessions.

## G2-4-020-041  [P1] GAP  facet F12  effort L
- Legacy: Legacy facultyType ADMIN, MENTOR and TPO all belong to FACULTY userType with subroles. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:53-57`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/enums/FacultyType.java:3-9`)
- vNext now: New membershipRole map enables multiple explicit roles on same membership. (`src/db/schema/memberships.ts:51-63`)
- Fix: Resolve multiple historical facultyType values into current permission roles.

## G2-4-020-064  [P1] GAP  facet F22  effort L
- Legacy: Legacy faculty one table contains BaseModel, tokenVersion, version, facultyType ordinal and all profile JSON. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:19-198`)
- vNext now: New users+collegeMemberships+facultyProfiles with documentVersion and JSONB, no tokenVersion. (`src/db/schema/users.ts:12-32`; `src/db/schema/memberships.ts:17-31`; `src/db/schema/profiles.ts:33-69`)
- Fix: Create full column-by-column mapping, lifecycle status and legacy ordinal migration.

## G2-4-020-065  [P1] GAP  facet F22  effort M
- Legacy: Legacy dept, college and organization integer IDs on row. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:44-51`)
- vNext now: New facultyProfiles.primaryDepartmentId and membership college UUID; org inferred through college. (`src/db/schema/profiles.ts:36-41`; `src/db/schema/memberships.ts:20-27`)
- Fix: Add tenant-scoped FK verification on primaryDepartmentId to membership college.
