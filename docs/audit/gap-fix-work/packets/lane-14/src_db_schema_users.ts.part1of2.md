# Work packet: edit src/db/schema/users.ts (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/admin-user-lifecycle-controller.md, docs/audit/gap2/lane-15/l18-u031-people-management.md, docs/audit/gap2/lane-15/recruiter.md, docs/audit/gap2/lane-19/superadmin-students.md, docs/audit/gap2/lane-4/faculty-model.md

## G2-1-001-046  [P1] GAP  facet F22  effort L
- Legacy: `Learner.java:21-28,64-74` and `Faculty.java:25-32,59-69` store per-account `suspended_at`, `suspension_reason`, `token_version`, JPA `version`; `AdminUserLifecycleController.java:97-99` mutates person table.
- vNext now: `memberships.ts:17-49`; `drizzle/0000_hard_the_spike.sql:46-55` store per-college state and reason; `users.ts:12-25` has platform status and no per-user token_version.
- Fix: Preserve equivalent immediate token invalidation using device-session/auth checks instead of removed token_version; document one-account-to-many-memberships mapping.

## G2-18-031-018  [P1] GAP  facet F04  effort L
- Legacy: Legacy Learner model stores first/last, roll, class/program/college IDs, contact, description, dob/gender, identity, qualifications, skills, projects, resume and intro video; Learner.java:21-231
- vNext now: vNext users.displayName and learnerProfiles rollNumber, JSON profileDocument, enrollments; src/db/schema/users.ts:12-31;profiles.ts:15-31
- Fix: Map every demographic and rich learner field to JSON section and academic join; document intentional removed video/files

## G2-18-031-050  [P1] GAP  facet F12  effort L
- Legacy: Legacy learner/faculty identities separate numeric records with 10-digit mobile login and soft suspension state; Learner.java:16-73;Faculty.java:20-64
- vNext now: vNext canonical users unique UID/phone/email and one membership per user/college, multiple roles; users.ts:12-31;memberships.ts:17-68
- Fix: Map identity collision/merges and preserve login alias semantics without sharing records across colleges

## G2-18-031-079  [P1] GAP  facet F22  effort L
- Legacy: Legacy separate learner/faculty tables numeric id, first/last, phone, type, suspendedAt, tokenVersion, isDeleted and profile JSON; Learner.java:16-73,143-231;Faculty.java:20-64,138-196
- vNext now: vNext users UUID canonical uid/phone/email, collegeMemberships UUID statuses, membershipRoles and separate profiles JSON; users.ts:12-31;memberships.ts:17-69;profiles.ts:15-69
- Fix: Produce full ID crosswalk and field mapper, make no claims of migrated data; preserve old profile JSON for existing rows only when approved

## G2-18-031-082  [P1] GAP  facet F22  effort M
- Legacy: Legacy learner/faculty suspendedAt/reason and tokenVersion separate from person type; Learner.java:21-73;Faculty.java:25-64
- vNext now: vNext collegeMemberships suspendedAt/reason, platformStatus, identity_device_sessions with revokedAt; memberships.ts:17-50;users.ts:20-24;identity-device-sessions.ts:20-68
- Fix: Document scope of suspension/OTP invalidation and single account with multiple college memberships

## G2-15-016-001  [P1] GAP  facet F01  effort L
- Legacy: One recruiter identity per real person, separate from faculty/learner. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Recruiter.java:14-23`)
- vNext now: Shared users identity plus recruiter profile in placements. (`src/db/schema/users.ts:12-24`)
- Fix: Crosswalk legacy recruiter to unified user and profile without duplicates.

## G2-15-016-010  [P1] GAP  facet F04  effort M
- Legacy: ContactMobile optional normalized10 and email optional unique255. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Recruiter.java:37-48`)
- vNext now: New phoneE164 unique, email text case-insensitive unique. (`src/db/schema/users.ts:17-19`)
- Fix: Migrate 10-digit phone to E.164; preserve email account key.

## G2-15-016-013  [P1] GAP  facet F04  effort L
- Legacy: tokenVersion and lastLoginAt. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Recruiter.java:68-73`)
- vNext now: Shared users lacks tokenVersion and lastLoginAt columns. (`src/db/schema/users.ts:12-24`)
- Fix: Prove equivalent session revocation and last-login audit in auth tables.

## G2-15-016-015  [P1] GAP  facet F04  effort L
- Legacy: Legacy id int, created/updated LocalDateTime and soft isDeleted. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:23-37`)
- vNext now: User UUID with platformStatus ACTIVE and timestamps. (`src/db/schema/users.ts:15-24`)
- Fix: Migrate soft-deleted/suspended to proper deactivated platform or archived profile.

## G2-15-016-020  [P1] GAP  facet F06  effort M
- Legacy: At least one phone or mail, email primary now. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Recruiter.java:37-48`)
- vNext now: New users identityUid required; optional both phone/email at DB. (`src/db/schema/users.ts:16-19`)
- Fix: Require recruiter-specific reachable email or phone before provision.

## G2-15-016-063  [P1] GAP  facet F21  effort L
- Legacy: Recruiter separate JPA BaseModel/recruiter table. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Recruiter.java:14-23`)
- vNext now: New central identity users plus profile table. (`src/db/schema/users.ts:12-30`)
- Fix: Use unified identity mapping with company grants; do not create duplicate users.

## G2-15-016-065  [P1] GAP  facet F22  effort L
- Legacy: Legacy int PK, LocalDateTime times, isDeleted. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:23-37`)
- vNext now: New uuid, timezone timestamps, platformStatus. (`src/db/schema/users.ts:15-24`)
- Fix: Migrate active/deleted status and timestamps deterministically.

## G2-15-016-066  [P1] GAP  facet F22  effort L
- Legacy: First/last, contact email/mobile, designation, companyId numeric. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Recruiter.java:31-59`)
- vNext now: and N:158-175 Shared displayName/contact + profile company UUID/title. (`src/db/schema/users.ts:17-20`)
- Fix: Split legacy recruiter row into users/profile, map company ID and first/last.

## G2-19-001-087  [P1] GAP  facet F22  effort L
- Legacy: Legacy `learner` single JPA table stores direct class/program/college, demographic/contact, suspension and import-batch fields `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:17-105`
- vNext now: vNext separates `users`, `college_memberships`, `learner_profiles`, and enrollment/section tables `src/db/schema/users.ts:12-30`; `src/db/schema/memberships.ts:17-48`; `src/db/schema/profiles.ts:15-31`; `src/modules/admin-ui/super-admin-scoped-people-service.ts:13-26`
- Fix: Create field-by-field mapping for class transfer, status, contact, JSON profile, bulk batch ID and historical audit IDs; inspect migrations before final parity sign-off.

## G2-4-020-011  [P1] GAP  facet F04  effort M
- Legacy: Legacy faculty uniqueId nullable String and numeric BaseModel ID. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:40-42`)
- vNext now: New membershipId UUID PK for facultyProfiles, user identityUid key for authentication. (`src/db/schema/profiles.ts:33-38`; `src/db/schema/users.ts:15-19`)
- Fix: Define staff code uniqueness/null semantics and legacy ID import.

## G2-4-020-016  [P1] GAP  facet F04  effort M
- Legacy: Legacy contactPhone,contactMobile,contactMail strings. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:88-96`)
- vNext now: New profileDocument contact fields regex phone 10-15,email max320; canonical users.email/phoneE164 separate. (`src/modules/people/faculty-profile-document.ts:46-72`; `src/db/schema/users.ts:16-20`)
- Fix: Resolve primary/secondary contact authority and avoid exposing unverified contact details.

## G2-4-020-027  [P1] GAP  facet F07  effort L
- Legacy: Legacy tokenVersion integer invalidates existing JWT on password change. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:59-61`)
- vNext now: New user schema does not store tokenVersion; identity provider/session revocation separate. (`src/db/schema/users.ts:12-25`)
- Fix: Prove password reset revokes all relevant sessions without legacy token version.

## G2-4-020-040  [P1] GAP  facet F12  effort M
- Legacy: Legacy tokenVersion default0, increment on password reset. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:59-61`)
- vNext now: New platform user has identityUid, platformStatus, no tokenVersion. (`src/db/schema/users.ts:15-24`)
- Fix: Match session invalidation guarantee for password updates.

## G2-4-020-060  [P1] GAP  facet F20  effort L
- Legacy: Legacy uniqueId may collide or be null in old data. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:40-42`)
- vNext now: New user identityUid unique, email case-insensitive unique but no matching staff uniqueId. (`src/db/schema/users.ts:15-29`)
- Fix: Handle duplicate/blank staff codes without importing as identityUid unsafely.

## G2-4-020-064  [P1] GAP  facet F22  effort L
- Legacy: Legacy faculty one table contains BaseModel, tokenVersion, version, facultyType ordinal and all profile JSON. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:19-198`)
- vNext now: New users+collegeMemberships+facultyProfiles with documentVersion and JSONB, no tokenVersion. (`src/db/schema/users.ts:12-32`; `src/db/schema/memberships.ts:17-31`; `src/db/schema/profiles.ts:33-69`)
- Fix: Create full column-by-column mapping, lifecycle status and legacy ordinal migration.
