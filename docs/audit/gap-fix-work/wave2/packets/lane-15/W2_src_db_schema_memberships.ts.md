# Work packet (wave 2): edit src/db/schema/memberships.ts

18 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/admin-user-lifecycle-controller.md, docs/audit/gap2/lane-1/user-controller.md, docs/audit/gap2/lane-1/user.md, docs/audit/gap2/lane-13/role.md, docs/audit/gap2/lane-4/faculty-model.md, docs/audit/gap2/lane-5/u019-learner.md

## G2-1-001-007  [P2] GAP  facet F04  effort M
- Legacy: `Faculty.js:764-765,947-948`, `Students.js:915-916,1098-1099` count Active/Suspended using `suspendedAt` on account record.
- vNext now: `college_memberships` status `ACTIVE\|SUSPENDED\|ENDED` and nullable timestamp (`memberships.ts:27-31`); directory pagination in `repository.ts:466-549`.
- Fix: Show counts based on membership-scoped state while matching visible Active/Suspended counters and document cross-college distinction.

## G2-1-001-048  [P2] GAP  facet F22  effort M
- Legacy: `Faculty.java:63-69`, `Learner.java:68-74` use JPA @Version optimistic entity rows.
- vNext now: `memberships.ts:17-49` has updatedAt but no version column; faculty service uses status predicate (`college-faculty-lifecycle-service.ts:64-82`).
- Fix: Use membership version or timestamp CAS consistently for all generic lifecycle mutations if stale-client conflict matters.

## G2-1-008-086  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:448-475`,`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/UserServiceImpl.java:77-133`: separate Faculty/Learner contacts arrays, possible dual rows.
- vNext now: `src/db/schema/memberships.ts:17-67`,`src/modules/people/college-contacts-service.ts:78-97`: one canonical User+college membership with role list.
- Fix: Crosswalk dual-role de-duplication and statuses, tenant uniqueness and name.

## G2-1-021-050  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/test/resources/db/mysql-schema-snapshot.sql:3307-3317: user_roles join table with composite PK and role FK; L:41-48 EAGER CascadeType.ALL.
- vNext now: src/db/schema/memberships.ts:52-84: membership_roles and system_roles typed role grants, no direct user_roles table.
- Fix: Document role name/id migration with college scope and prevent unauthorized ADMIN grants.

## G2-13-016-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Role.java:17-29` JPA role catalog entity with id/name/description, `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:22-37` soft delete/timestamps
- vNext now: `src/db/schema/memberships.ts:52-85` membershipRoles/systemRoles assignments with enum values, no independent editable role catalog
- Fix: Document intentionally noneditable role catalog and map old role IDs/names to scoped enums during import

## G2-13-016-007  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Role.java:25` name and `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Role.java:28` description string nullable/unbounded
- vNext now: `src/db/schema/memberships.ts:59` role membership_role enum required; `src/db/schema/memberships.ts:78` system_role enum required; no description field
- Fix: Retain original descriptions in a migration map if needed for audit/help text; don't invent user-editable free-text roles

## G2-13-016-008  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:23-37` integer generated ID, createdAt,updatedAt,isDeleted
- vNext now: `src/db/schema/memberships.ts:55` UUID generated ID, createdAt only; `src/db/schema/memberships.ts:74` UUID and createdAt only
- Fix: Create old role-ID mapping; document removed updatedAt/isDeleted semantics and derive revocation from row deletion/audit

## G2-13-016-013  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Role.java:22` inherits nullable name/description and soft-deleted flag from `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:36-37`
- vNext now: `src/db/schema/memberships.ts:59` and `src/db/schema/memberships.ts:78` notNull enum role, no soft delete
- Fix: Represent role removal with explicit revoke event instead of allowing soft-deleted role definition

## G2-13-016-038  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:23-26` integer ID; `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Role.java:12-15` examples ID4 and5, not FK-stable role semantics
- vNext now: `src/db/schema/memberships.ts:55` UUID assignment IDs, `src/modules/identity/constants.ts:17-27` code enums
- Fix: Map role IDs to names first, normalize case and reject duplicate/missing seed roles

## G2-13-016-041  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Role.java:17-29` JPA role table + USER_ROLES many-to-many
- vNext now: `src/db/schema/memberships.ts:52-85` Postgres membership_roles/system_roles joined to membership/user
- Fix: Write migration/connector dependency map for old USER_ROLES join references and role ID mapping

## G2-4-020-001  [P2] GAP  facet F01  effort L
- Legacy: Legacy Faculty JPA entity serves the teacher profile and college/super-admin faculty screens. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:19-24`; `docs/legacy-source/frontend/src/pages/teacher/profile.js:15-25`)
- vNext now: New faculty account decomposed into users, collegeMemberships and facultyProfiles with profile route. (`src/db/schema/users.ts:12-24`; `src/db/schema/memberships.ts:17-31`; `src/db/schema/profiles.ts:33-58`; `src/app/(authenticated)/teacher/profile/page.tsx:8-21`)
- Fix: Map all legacy faculty account lookup routes and authority boundaries to membership-scoped data.

## G2-4-020-042  [P2] GAP  facet F12  effort M
- Legacy: Legacy deleted faculty hidden via BaseModel; suspended record remains reversible. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:24-32`)
- vNext now: New membership supports active/suspended/ended and user platform status. (`src/db/schema/memberships.ts:17-31`; `src/db/schema/users.ts:20-22`)
- Fix: Define deleted-vs-ended retention and restore semantics for foreign keys.

## G2-4-020-057  [P2] GAP  facet F19  effort M
- Legacy: Legacy one faculty JPA row fetch carries all personal and JSON fields. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:19-198`)
- vNext now: New normalizes identity, membership, profile and JSON, separate read paths. (`src/db/schema/users.ts:12-24`; `src/db/schema/memberships.ts:17-31`; `src/db/schema/profiles.ts:33-58`)
- Fix: Avoid N+1 joins and JSON decode across large faculty directory pages.

## G2-5-019-033  [P2] GAP  facet F05  effort M
- Legacy: Legacy counts active learners by class/program, excludes suspended `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LearnerRepository.java:14-27`
- vNext now: VNext membership status + section/program join `src/db/schema/memberships.ts:19-43` `src/modules/people/college-student-detail-service.ts:50-90`
- Fix: Rebuild active blast-radius counters using persisted status.

## G2-6-004-070  [P2] GAP  facet F22  effort M
- Legacy: Old userType is one string and All merges both lists `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/UserServiceImpl.java:81-133`
- vNext now: New membership may contain several roles, All returns one membership with role array `src/modules/courses/faculty-contacts-service.ts:72-115` `src/db/schema/memberships.ts:52-68`
- Fix: Define duplicate handling and labels for multi-role users across All/Teachers/Students

## G2-8-001-048  [P2] GAP  facet F22  effort M
- Legacy: `model/Faculty.java:88-96,139` and `model/Learner.java:93-101,144`: contact fields in per-role entity, website image
- vNext now: `db/schema/users.ts:12-24` and `db/schema/memberships.ts:17-32`: canonical identity+membership; `profiles.ts:15-58` role profiles
- Fix: Add explicit DTO mapping/source for legacy contactPhone and image if required, avoid duplicating PII tables

## G2-8-003-045  [P2] GAP  facet F22  effort M
- Legacy: `.../model/Faculty.java:88-96,139`, `.../model/Learner.java:93-101,144`: role-owned contact+website
- vNext now: `src/db/schema/users.ts:12-30`, `memberships.ts:17-68`, `profiles.ts:15-58`: normalized user/membership/role-profile, website not explicit
- Fix: Provide read-model mapping for role image/secondary phone or explicit approved omission; migration is not required

## G2-8-002-047  [P2] GAP  facet F22  effort M
- Legacy: `.../model/Faculty.java:20-21,88-96` and `.../model/Learner.java:17,93-101`: separate per-role tables with contacts
- vNext now: `src/db/schema/users.ts:12-30`, `memberships.ts:17-68`: canonical user, college membership and role mapping
- Fix: Record legacy-to-new mapping for identifiers, role duplicates, contact and profile fields in migration reference; no data migration requested
