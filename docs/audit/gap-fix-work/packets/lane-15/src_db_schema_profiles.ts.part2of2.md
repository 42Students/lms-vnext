# Work packet: edit src/db/schema/profiles.ts (part 2 of 2)

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/faculty-model.md, docs/audit/gap2/lane-5/u019-learner.md, docs/audit/gap2/lane-6/college-admin-teachers.md, docs/audit/gap2/lane-6/superadmin-faculty-section.md, docs/audit/gap2/lane-6/superadmin-teachers.md

## G2-4-020-029  [P1] GAP  facet F07  effort M
- Legacy: Legacy FacultyType persisted as ordinal; reordering corrupts role silently. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/enums/FacultyType.java:3-9`)
- vNext now: New employment/academic title plain strings are not protected by enum mapping. (`src/db/schema/profiles.ts:43-44`)
- Fix: Protect legacy-to-new role mapping via migration tests/explicit dictionary.

## G2-4-020-059  [P1] GAP  facet F20  effort M
- Legacy: Legacy @Version Long optimistic locking on whole entity. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:63-69`)
- vNext now: New profileDocumentVersion CAS implemented in staged service; canonical status may be migration-dependent. (`src/modules/people/faculty-profile-self.staged.ts:186-215`; `src/db/schema/profiles.ts:45-51`)
- Fix: Audit stale self profile update and admin same-user edits across devices.

## G2-4-020-064  [P1] GAP  facet F22  effort L
- Legacy: Legacy faculty one table contains BaseModel, tokenVersion, version, facultyType ordinal and all profile JSON. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:19-198`)
- vNext now: New users+collegeMemberships+facultyProfiles with documentVersion and JSONB, no tokenVersion. (`src/db/schema/users.ts:12-32`; `src/db/schema/memberships.ts:17-31`; `src/db/schema/profiles.ts:33-69`)
- Fix: Create full column-by-column mapping, lifecycle status and legacy ordinal migration.

## G2-4-020-065  [P1] GAP  facet F22  effort M
- Legacy: Legacy dept, college and organization integer IDs on row. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:44-51`)
- vNext now: New facultyProfiles.primaryDepartmentId and membership college UUID; org inferred through college. (`src/db/schema/profiles.ts:36-41`; `src/db/schema/memberships.ts:20-27`)
- Fix: Add tenant-scoped FK verification on primaryDepartmentId to membership college.

## G2-5-019-001  [P1] GAP  facet F01  effort L
- Legacy: Legacy learner controller `/api/v1/learner` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:71-75`
- vNext now: VNext identity, membership and profile services split entity `src/db/schema/profiles.ts:11-29`
- Fix: Map all old controller endpoints and user ownership to new IDs.

## G2-5-019-003  [P1] GAP  facet F02  effort L
- Legacy: Legacy single learner record contains account, academic, profile sections `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:20-232`
- vNext now: VNext splits users/member/profile/enrollment `src/db/schema/users.ts:10-30` `src/db/schema/memberships.ts:14-65` `src/db/schema/profiles.ts:11-29`
- Fix: Create field-level migration and unified view projection.

## G2-5-019-006  [P1] MISSING  facet F03  effort M
- Legacy: Legacy uniqueId separate roll_number `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:42-47`
- vNext now: VNext rollNumber,registrationNumber; no uniqueId `src/db/schema/profiles.ts:13-18`
- Fix: Add uniqueId mapping for lookups and display.

## G2-5-019-067  [P1] GAP  facet F22  effort L
- Legacy: Legacy learner table contains account, academic, profile JSON and PII `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:20-232`
- vNext now: New users/memberships/roles/learnerProfiles normalized `src/db/schema/users.ts:12-29` `src/db/schema/memberships.ts:14-65` `src/db/schema/profiles.ts:11-29`
- Fix: Publish complete column mapping including dynamic arrays and PII.

## G2-6-001-072  [P1] GAP  facet F22  effort L
- Legacy: Legacy faculty entity stores college_id, dept_id, faculty_type, dob, mobile, gender and profile JSON `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:35-105` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:151-196`
- vNext now: New faculty profile is membership-linked; membership and identity queried separately `src/db/schema/profiles.ts:33-64` `src/modules/people/college-role-directory-service.ts:233-252`
- Fix: Create field-by-field schema mapping; preserve legacy profile JSON sections in profile models

## G2-6-002-086  [P1] GAP  facet F22  effort L
- Legacy: Old Faculty entity has first/last, collegeId, deptId, facultyType, gender, dob, JSON sections and contact fields `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:35-196`
- vNext now: New facultyProfiles stores membership, department, employment, academicTitle, JSON; users holds names/login `src/db/schema/profiles.ts:33-67` `src/modules/admin-ui/super-admin-scoped-people-service.ts:27-42`
- Fix: Create explicit migration/schema mapping for every legacy faculty field including JSON profile sections

## G2-6-002-088  [P1] GAP  facet F22  effort M
- Legacy: Old department/college IDs are same-record ints `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:44-50`
- vNext now: New primaryDepartmentId FK only to departments; membership references college separately `src/db/schema/profiles.ts:36-43` `src/db/schema/memberships.ts:20-26`
- Fix: Enforce primaryDepartment belongs to membership college at service boundary and audit cross-tenant attempts

## G2-6-003-049  [P1] GAP  facet F22  effort M
- Legacy: Old faculty registration persists single faculty row with college_id and dept_id `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:35-56`
- vNext now: New account uses users, college_memberships and faculty_profiles `src/db/schema/memberships.ts:17-68` `src/db/schema/profiles.ts:33-43`
- Fix: Document old-to-new FK/enum mapping and enforce department-in-selected-college
