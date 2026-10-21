# Work packet (wave 2): edit src/db/schema/users.ts

25 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/login-user.md, docs/audit/gap2/lane-1/user-controller.md, docs/audit/gap2/lane-1/user.md, docs/audit/gap2/lane-15/recruiter.md, docs/audit/gap2/lane-4/faculty-model.md, docs/audit/gap2/lane-5/u019-learner.md

## G2-1-018-005  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LoginUser.java:22-23 and docs/legacy-source/backend/src/test/resources/db/mysql-schema-snapshot.sql:1980-1982: user_name VARCHAR255 nullable.
- vNext now: src/db/schema/users.ts:16-19: identity UID required, phoneE164 and email optional, displayName; no user_name column.
- Fix: Record user_name disposition and legacy identity lookup mapping or formal retirement after consumer proof.

## G2-1-018-035  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/test/resources/db/mysql-schema-snapshot.sql:1975-1983: six cols id INT PK, created_at DATETIME nullable, is_deleted TINYINT default0, updated_at DATETIME nullable, password VARCHAR255 nullable, user_name VARCHAR255 nullable.
- vNext now: src/db/schema/users.ts:12-31: users has UUID identity and contact fields, no login_user table; src/db/schema/identity-auth-attempts.ts:22-52/T:20-38 add HMAC challenges and sessions.
- Fix: Record explicit six-field retirement/disposition, prove no active SQL consumers, obtain owner signoff.

## G2-1-008-084  [P2] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/User.java:10-48`: user table username,password,email,phone,name,uniqueId,userType,businessTitle,USER_ROLES.
- vNext now: `src/db/schema/users.ts:12-30`: UUID identityUid, phoneE164, email, displayName, platformStatus.
- Fix: Crosswalk identity fields and explicitly retire password/businessTitle.

## G2-1-021-007  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/User.java:16-17 and docs/legacy-source/backend/src/test/resources/db/mysql-schema-snapshot.sql:3302: user_name VARCHAR255 nullable.
- vNext now: src/db/schema/users.ts:16-19: no username, identityUid required, phone/email/displayName.
- Fix: Map or retire username lookup with field-specific owner acceptance.

## G2-1-021-010  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/User.java:26-27, docs/legacy-source/backend/src/test/resources/db/mysql-schema-snapshot.sql:3300: phone VARCHAR255 nullable.
- vNext now: src/db/schema/users.ts:17: phoneE164 VARCHAR32 unique nullable.
- Fix: Define E.164 normalization and legacy phone collision resolution, preserve unformatted source as needed.

## G2-1-021-012  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/User.java:32-33, docs/legacy-source/backend/src/test/resources/db/mysql-schema-snapshot.sql:3301: unique_id VARCHAR255 nullable (not SQL UNIQUE).
- vNext now: src/db/schema/users.ts:16-19: identityUid different provider/local ID, no legacy uniqueId field.
- Fix: Determine actual unique_id consumers, create domain alias mapping if needed.

## G2-1-021-014  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/User.java:38-39, docs/legacy-source/backend/src/test/resources/db/mysql-schema-snapshot.sql:3296: business_title VARCHAR255 nullable.
- vNext now: src/db/schema/users.ts:12-25: no businessTitle; recruiter title can exist in placementRecruiterProfiles via H:89-95.
- Fix: Map business title to scoped recruiter profile or explicitly retire for non-recruiters.

## G2-1-021-042  [P2] GAP  facet F18  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/UserDto.java:12-23: form keys userName, password, email, phone, name, businessTitle.
- vNext now: src/db/schema/users.ts:16-19: identityUid, phoneE164, email, displayName; no username/password/business title.
- Fix: Map exact labels/placeholders or explicitly retire obsolete form fields.

## G2-1-021-049  [P2] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/test/resources/db/mysql-schema-snapshot.sql:3291-3305: user table has twelve columns including 8 own fields and four BaseModel fields; all own fields nullable.
- vNext now: src/db/schema/users.ts:12-31: 7 fields id, identityUid, phoneE164, email, displayName, platformStatus, timestamps (actually 7? count as 7); no literal user parity.
- Fix: Create column-by-column disposition for username/password/uniqueId/userType/businessTitle plus timestamps/contacts.

## G2-1-021-053  [P2] GAP  facet F23  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/User.java:32-39: unique_id, business_title, user_type fields not direct users columns.
- vNext now: src/db/schema/users.ts:16-19, M:17-84: normalized identity and roles, recruiter title H:89-95.
- Fix: Record each retired/distributed field and actual consumers before approval.

## G2-15-016-041  [P2] GAP  facet F11  effort M
- Legacy: Any email row including deleted found for clean duplicate message. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/RecruiterRepository.java:24-30`)
- vNext now: Global email_ci unique even if archived. (`src/db/schema/users.ts:27-30`)
- Fix: Retain clear cannot reuse archived email message and account recovery.

## G2-15-016-044  [P2] GAP  facet F12  effort S
- Legacy: One contact required; email is default account key. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Recruiter.java:37-42`)
- vNext now: New identityUid always present; contact values optional. (`src/db/schema/users.ts:16-19`)
- Fix: Validate at least one reachable contact at invite completion.

## G2-4-020-001  [P2] GAP  facet F01  effort L
- Legacy: Legacy Faculty JPA entity serves the teacher profile and college/super-admin faculty screens. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:19-24`; `docs/legacy-source/frontend/src/pages/teacher/profile.js:15-25`)
- vNext now: New faculty account decomposed into users, collegeMemberships and facultyProfiles with profile route. (`src/db/schema/users.ts:12-24`; `src/db/schema/memberships.ts:17-31`; `src/db/schema/profiles.ts:33-58`; `src/app/(authenticated)/teacher/profile/page.tsx:8-21`)
- Fix: Map all legacy faculty account lookup routes and authority boundaries to membership-scoped data.

## G2-4-020-007  [P2] GAP  facet F03  effort M
- Legacy: Legacy firstName,lastName as separate strings, uniqueId text. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:34-42`)
- vNext now: New user displayName single string and per-member identity, no separate faculty first/last columns. (`src/db/schema/users.ts:15-20`)
- Fix: Preserve name parsing/format and staff unique code mapping without collision.

## G2-4-020-042  [P2] GAP  facet F12  effort M
- Legacy: Legacy deleted faculty hidden via BaseModel; suspended record remains reversible. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:24-32`)
- vNext now: New membership supports active/suspended/ended and user platform status. (`src/db/schema/memberships.ts:17-31`; `src/db/schema/users.ts:20-22`)
- Fix: Define deleted-vs-ended retention and restore semantics for foreign keys.

## G2-4-020-057  [P2] GAP  facet F19  effort M
- Legacy: Legacy one faculty JPA row fetch carries all personal and JSON fields. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:19-198`)
- vNext now: New normalizes identity, membership, profile and JSON, separate read paths. (`src/db/schema/users.ts:12-24`; `src/db/schema/memberships.ts:17-31`; `src/db/schema/profiles.ts:33-58`)
- Fix: Avoid N+1 joins and JSON decode across large faculty directory pages.

## G2-5-019-005  [P2] GAP  facet F03  effort M
- Legacy: Legacy firstName/lastName distinct `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:36-41`
- vNext now: VNext only users.displayName `src/db/schema/users.ts:16-21`
- Fix: Retain separate names or reconstruct losslessly.

## G2-5-019-012  [P2] GAP  facet F04  effort S
- Legacy: Legacy first/last names String nullable `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:36-41`
- vNext now: VNext displayName nullable text `src/db/schema/users.ts:16-21`
- Fix: Reconcile null and name concatenation rules.

## G2-5-019-059  [P2] GAP  facet F18  effort M
- Legacy: Legacy labels First/Last name, Contact Mobile, Unique ID align with fields `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:36-47,93-101`
- vNext now: VNext displayName, E164 primary, registrationNumber mean different concepts `src/db/schema/users.ts:16-21` `src/db/schema/profiles.ts:13-18`
- Fix: Compare exact labels, keys and fallback text.

## G2-8-001-048  [P2] GAP  facet F22  effort M
- Legacy: `model/Faculty.java:88-96,139` and `model/Learner.java:93-101,144`: contact fields in per-role entity, website image
- vNext now: `db/schema/users.ts:12-24` and `db/schema/memberships.ts:17-32`: canonical identity+membership; `profiles.ts:15-58` role profiles
- Fix: Add explicit DTO mapping/source for legacy contactPhone and image if required, avoid duplicating PII tables

## G2-8-001-049  [P2] GAP  facet F22  effort M
- Legacy: `dto/response/ContactDTO.java:7-13`: separate firstName and lastName
- vNext now: `db/schema/users.ts:19`, `modules/people/college-contacts-service.ts:92-105`: single displayName
- Fix: Verify lossless display for split names, whitespace and initials; use canonical split metadata only if available

## G2-8-003-045  [P2] GAP  facet F22  effort M
- Legacy: `.../model/Faculty.java:88-96,139`, `.../model/Learner.java:93-101,144`: role-owned contact+website
- vNext now: `src/db/schema/users.ts:12-30`, `memberships.ts:17-68`, `profiles.ts:15-58`: normalized user/membership/role-profile, website not explicit
- Fix: Provide read-model mapping for role image/secondary phone or explicit approved omission; migration is not required

## G2-8-002-047  [P2] GAP  facet F22  effort M
- Legacy: `.../model/Faculty.java:20-21,88-96` and `.../model/Learner.java:17,93-101`: separate per-role tables with contacts
- vNext now: `src/db/schema/users.ts:12-30`, `memberships.ts:17-68`: canonical user, college membership and role mapping
- Fix: Record legacy-to-new mapping for identifiers, role duplicates, contact and profile fields in migration reference; no data migration requested

## G2-1-018-008  [P3] GAP  facet F04  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:28-34 and docs/legacy-source/backend/src/test/resources/db/mysql-schema-snapshot.sql:1977-1979: nullable naive created_at and updated_at.
- vNext now: src/db/schema/users.ts:23-24: createdAt/updatedAt timezone-aware NOT NULL default now.
- Fix: Document nullable→nonnull timestamp conversion and account provenance; never invent legacy dates.

## G2-1-018-013  [P3] GAP  facet F06  effort S
- Legacy: docs/legacy-source/backend/src/test/resources/db/mysql-schema-snapshot.sql:1980-1981: max 255 bytes-ish MySQL varchar characters for both nullable credentials.
- vNext now: src/db/schema/users.ts:16-19: identityUid VARCHAR128, phone VARCHAR32, email text, no password.
- Fix: Capture exact former username length and mapping in field ledger; do not invent a new password max.
