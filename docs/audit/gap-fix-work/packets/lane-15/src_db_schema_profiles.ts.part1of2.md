# Work packet: edit src/db/schema/profiles.ts (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/faculty-profile-controller.md, docs/audit/gap2/lane-1/learner-profile-controller.md, docs/audit/gap2/lane-10/l19-u030-tpo-profile.md, docs/audit/gap2/lane-15/l18-u031-people-management.md, docs/audit/gap2/lane-15/u002-student-placement-lookup.md, docs/audit/gap2/lane-19/superadmin-students.md

## G2-1-003-076  [P1] GAP  facet F22  effort L
- Legacy: `FacultyProfileServiceImpl.java:90-615` stores metadata, arrays and identity in legacy `Faculty` entity JPA fields.
- vNext now: `src/db/schema/profiles.ts:33-68` stores JSON document and version in per-membership faculty_profiles table; migration `drizzle/0067_faculty_profile_document.sql:1-3`.
- Fix: Build field-by-field migration contract for all 15 sections and legacy orphaned faculty profiles; validate tenant-specific mapping.

## G2-1-004-037  [P1] GAP  facet F10  effort L
- Legacy: `LearnerProfileServiceImpl.java:83-1044` persists JPA Learner, Qualification, JobPreferences and storage refs.
- vNext now: `profiles.ts:15-30` membership-keyed JSONB, `learner-profile-document-edit-service.ts:18-46` transaction.
- Fix: Write field-by-field parity/migration recipe respecting current no-data-migration decision.

## G2-1-004-061  [P1] GAP  facet F22  effort L
- Legacy: `LearnerProfileServiceImpl.java:83-1044` maps Learner/Qualification/JobPreferences and private refs.
- vNext now: `profiles.ts:15-30` single membership-keyed profile JSONB, roll and registration normalized.
- Fix: Document full old→new field schema with no PII migration until owner approves.

## G2-19-030-061  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyProfileController.java:204-215 and docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyProfileServiceImpl.java:112-130 — faculty.website stores approved image URL/key.
- vNext now: src/db/schema/profiles.ts:33-57 — faculty profileDocument JSONB, department FK, no explicitly fetched photo.
- Fix: Define avatar storage relationship, issuer IDs, asset ownership and migration.

## G2-18-031-018  [P1] GAP  facet F04  effort L
- Legacy: Legacy Learner model stores first/last, roll, class/program/college IDs, contact, description, dob/gender, identity, qualifications, skills, projects, resume and intro video; Learner.java:21-231
- vNext now: vNext users.displayName and learnerProfiles rollNumber, JSON profileDocument, enrollments; src/db/schema/users.ts:12-31;profiles.ts:15-31
- Fix: Map every demographic and rich learner field to JSON section and academic join; document intentional removed video/files

## G2-18-031-019  [P1] GAP  facet F04  effort L
- Legacy: Legacy Faculty model stores faculty_type, department, mobile/email, education/identity/certification/skills/publications/awards; Faculty.java:20-196
- vNext now: vNext facultyProfiles academicTitle/employmentType/primaryDepartmentId plus profileDocument JSON; src/db/schema/profiles.ts:33-69
- Fix: Map LECTURER/MENTOR/TPO/ADMIN to membership roles plus employment type, check preservation of structured identity fields

## G2-18-031-079  [P1] GAP  facet F22  effort L
- Legacy: Legacy separate learner/faculty tables numeric id, first/last, phone, type, suspendedAt, tokenVersion, isDeleted and profile JSON; Learner.java:16-73,143-231;Faculty.java:20-64,138-196
- vNext now: vNext users UUID canonical uid/phone/email, collegeMemberships UUID statuses, membershipRoles and separate profiles JSON; users.ts:12-31;memberships.ts:17-69;profiles.ts:15-69
- Fix: Produce full ID crosswalk and field mapper, make no claims of migrated data; preserve old profile JSON for existing rows only when approved

## G2-18-031-081  [P1] GAP  facet F22  effort L
- Legacy: Legacy faculty dept_id, faculty_type and many typed fields on faculty row; Faculty.java:43-99,138-196
- vNext now: vNext facultyProfiles primaryDepartmentId, employmentType, academicTitle and JSON doc, separate roles; profiles.ts:33-69;memberships.ts:52-69
- Fix: Define migration of faculty role/type mapping and protected admin/TPO roles and department FK

## G2-15-002-078  [P1] MISSING  facet F21  effort M
- Legacy: Profile Resume PUT validates owned storage reference (`LearnerProfileController.java:254-255,1223-1235`).
- vNext now: No profile integration; stored profileDocument field available (`profiles.ts:15-31`; `admin/placements/student-lookup/page.tsx:56-75`).
- Fix: Use scoped signed URL access and ownership/ref validation for resume writes.

## G2-15-002-080  [P1] GAP  facet F22  effort L
- Legacy: Resume, skills, job preferences obtained as separate learner profile sections (`ProfileSectionsPanel.js:35-51,475-505`; `ProfileService.js:104-115,144-154`).
- vNext now: learnerProfiles has JSONB profileDocument, but lookup only reads roll number (`profiles.ts:15-31`; `college-placement-student-lookup-service.ts:14-20`).
- Fix: Specify typed JSONB section schema and mapping/validation, read and write audit/version behavior.

## G2-19-001-087  [P1] GAP  facet F22  effort L
- Legacy: Legacy `learner` single JPA table stores direct class/program/college, demographic/contact, suspension and import-batch fields `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:17-105`
- vNext now: vNext separates `users`, `college_memberships`, `learner_profiles`, and enrollment/section tables `src/db/schema/users.ts:12-30`; `src/db/schema/memberships.ts:17-48`; `src/db/schema/profiles.ts:15-31`; `src/modules/admin-ui/super-admin-scoped-people-service.ts:13-26`
- Fix: Create field-by-field mapping for class transfer, status, contact, JSON profile, bulk batch ID and historical audit IDs; inspect migrations before final parity sign-off.

## G2-20-030-084  [P1] GAP  facet F22  effort L
- Legacy: Legacy faculty persisted in faculty table with contact/photo/identity and section JSON columns (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:20-22`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:35-95`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:137-196`)
- vNext now: vNext identity/person/member split and faculty_profiles JSONB profileDocument/version (`src/db/schema/profiles.ts:33-57`)
- Fix: Create parity matrix for all legacy fields, preserve scoped protected reads and migration disposition

## G2-20-030-085  [P1] GAP  facet F22  effort L
- Legacy: Legacy image website and identity JSON carry storage refs (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:137-153`)
- vNext now: New facultyProfiles schema has no first-class photo/document reference columns; staged receipt ids in JSON (`src/db/schema/profiles.ts:33-58`, `src/modules/people/faculty-self-section-model.ts:71-80`)
- Fix: Define sanctioned dedicated private-object references before enabling uploads

## G2-4-020-008  [P1] GAP  facet F03  effort L
- Legacy: Legacy primary deptId integer, text department and facultyType enum. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:44-54`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:71-72`)
- vNext now: New facultyProfiles primaryDepartmentId UUID, employmentType and academicTitle strings. (`src/db/schema/profiles.ts:39-44`)
- Fix: Map department, faculty-type roles and academic title with exact enum semantics.

## G2-4-020-009  [P1] GAP  facet F03  effort L
- Legacy: Legacy userType String and faculty_type ordinal encodes ADMIN,MENTOR,TPO among others. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:53-57`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/enums/FacultyType.java:3-9`)
- vNext now: New membershipRoles and generic faculty employmentType/academicTitle, no facultyType ordinal. (`src/db/schema/memberships.ts:51-63`; `src/db/schema/profiles.ts:43-44`)
- Fix: Convert all legacy ordinal values to explicit roles/title without guessing.

## G2-4-020-011  [P1] GAP  facet F04  effort M
- Legacy: Legacy faculty uniqueId nullable String and numeric BaseModel ID. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:40-42`)
- vNext now: New membershipId UUID PK for facultyProfiles, user identityUid key for authentication. (`src/db/schema/profiles.ts:33-38`; `src/db/schema/users.ts:15-19`)
- Fix: Define staff code uniqueness/null semantics and legacy ID import.

## G2-4-020-012  [P1] GAP  facet F04  effort L
- Legacy: Legacy deptId/collegeId/organizationId integer IDs on faculty row. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:44-51`)
- vNext now: New departmentId FK UUID, collegeId on membership, organization through College relation. (`src/db/schema/profiles.ts:36-41`; `src/db/schema/memberships.ts:20-27`)
- Fix: Map org/college/department and prevent cross-college FK mismatch.

## G2-4-020-013  [P1] GAP  facet F04  effort L
- Legacy: Legacy FacultyType values PERMANENT,GUEST,VISITING,CONTRACT,ADMIN,HEAD,COORDINATOR,CLERK,PROFESSOR,ASSOCIATE_PROFESSOR,ASSISTANT_PROFESSOR,LECTURER,ADJUNCT,MENTOR,TPO. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/enums/FacultyType.java:3-9`)
- vNext now: New faculty profile has free employmentType and academicTitle, membership Roles separate. (`src/db/schema/profiles.ts:39-44`; `src/db/schema/memberships.ts:51-63`)
- Fix: Map every ordinal and role overlap without reordering historical enum.

## G2-4-020-023  [P1] GAP  facet F06  effort M
- Legacy: Legacy facultyType is ordinal Java enum with append-only values. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/enums/FacultyType.java:3-9`)
- vNext now: New typed role strings and profile fields have no ordinal position. (`src/db/schema/profiles.ts:39-44`)
- Fix: Create explicit ordinal-to-code migration, do not cast integer to string label.

## G2-4-020-028  [P1] GAP  facet F07  effort M
- Legacy: Legacy @Version Long serves optimistic update conflict on entity. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:63-69`)
- vNext now: New faculty profileDocumentVersion integer CAS in dedicated profile row, no version on all identity fields. (`src/db/schema/profiles.ts:45-65`; `src/modules/people/faculty-profile-self.staged.ts:186-215`)
- Fix: Enforce optimistic concurrency on profile, admin employment and lifecycle edits independently.
