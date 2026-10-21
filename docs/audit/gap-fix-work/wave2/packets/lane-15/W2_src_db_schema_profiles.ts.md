# Work packet (wave 2): edit src/db/schema/profiles.ts

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/learner-profile-controller.md, docs/audit/gap2/lane-20/teacher-profile.md, docs/audit/gap2/lane-4/faculty-model.md, docs/audit/gap2/lane-5/u019-learner.md, docs/audit/gap2/lane-6/job-preferences.md, docs/audit/gap2/lane-8/college-admin-people.md

## G2-1-004-010  [P2] GAP  facet F04  effort M
- Legacy: `ProfileHeaderDTO.java:10-19` firstName, lastName, rollNumber, programId, collegeId, profileImage.
- vNext now: `learn/profile/page.tsx:43-54,83-113` shows canonical name, roll/reg and academic summary; `profiles.ts:15-30` membership document.
- Fix: Map legacy IDs, program/college names and profile image to visible header.

## G2-20-030-029  [P2] GAP  facet F04  effort M
- Legacy: Legacy faculty About loads all 11 core sections and publications/awards as distinct data sets (`docs/legacy-source/frontend/src/components/profile/about.js:196-261`)
- vNext now: New self-document collapses all editable sections in one JSONB document; summary loads small profile (`src/modules/people/faculty-profile-self.staged.ts:69-96`, `src/db/schema/profiles.ts:43-50`)
- Fix: Preserve section completeness and independent partial-data status when switching storage

## G2-4-020-001  [P2] GAP  facet F01  effort L
- Legacy: Legacy Faculty JPA entity serves the teacher profile and college/super-admin faculty screens. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:19-24`; `docs/legacy-source/frontend/src/pages/teacher/profile.js:15-25`)
- vNext now: New faculty account decomposed into users, collegeMemberships and facultyProfiles with profile route. (`src/db/schema/users.ts:12-24`; `src/db/schema/memberships.ts:17-31`; `src/db/schema/profiles.ts:33-58`; `src/app/(authenticated)/teacher/profile/page.tsx:8-21`)
- Fix: Map all legacy faculty account lookup routes and authority boundaries to membership-scoped data.

## G2-4-020-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy Faculty model stores profile sections in a single row and JSON columns. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:74-198`)
- vNext now: New normalized identity plus faculty profile JSON document and separate teaching assignments pages. (`src/db/schema/profiles.ts:33-58`; `src/app/(authenticated)/teacher/profile/page.tsx:22-31`)
- Fix: Reproduce original About/card ordering, and profile section navigation.

## G2-4-020-057  [P2] GAP  facet F19  effort M
- Legacy: Legacy one faculty JPA row fetch carries all personal and JSON fields. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:19-198`)
- vNext now: New normalizes identity, membership, profile and JSON, separate read paths. (`src/db/schema/users.ts:12-24`; `src/db/schema/memberships.ts:17-31`; `src/db/schema/profiles.ts:33-58`)
- Fix: Avoid N+1 joins and JSON decode across large faculty directory pages.

## G2-4-020-066  [P2] GAP  facet F22  effort M
- Legacy: Legacy @Version JPA Long null for new row. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:63-69`)
- vNext now: New profileDocumentVersion integer default0 plus updatedAt. (`src/db/schema/profiles.ts:49-57`)
- Fix: Map optimistic token between entity and profile JSON mutation, avoid lost updates.

## G2-5-019-029  [P2] MISSING  facet F04  effort M
- Legacy: Legacy videoIntroUrl and uploadedAt `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:218-223`
- vNext now: New profile row lacks dedicated video columns `src/db/schema/profiles.ts:11-29`
- Fix: Map to signed storage receipt and timestamp.

## G2-5-019-031  [P2] GAP  facet F04  effort M
- Legacy: Legacy resumeUrl text `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:230-232`
- vNext now: VNext learnerProfiles no resume column `src/db/schema/profiles.ts:11-29`
- Fix: Map to private verified resume receipt.

## G2-5-019-054  [P2] GAP  facet F14  effort L
- Legacy: Legacy resume/video URL string storage `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:218-232`
- vNext now: VNext learnerProfiles no direct file references `src/db/schema/profiles.ts:11-29`
- Fix: Implement signed receipt-based access/migration.

## G2-5-019-059  [P2] GAP  facet F18  effort M
- Legacy: Legacy labels First/Last name, Contact Mobile, Unique ID align with fields `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:36-47,93-101`
- vNext now: VNext displayName, E164 primary, registrationNumber mean different concepts `src/db/schema/users.ts:16-21` `src/db/schema/profiles.ts:13-18`
- Fix: Compare exact labels, keys and fallback text.

## G2-5-019-066  [P2] GAP  facet F21  effort L
- Legacy: Legacy video/resume on external CDN/R2 URL strings `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:218-232`
- vNext now: VNext profile has JSONB, no dedicated file reference `src/db/schema/profiles.ts:11-29`
- Fix: Plan private storage migration and authorized download.

## G2-6-019-007  [P2] GAP  facet F04  effort M
- Legacy: Legacy unique learner_id FK NOT NULL (JobPreferences.java:18-20).
- vNext now: vNext placement candidate preferences PK membershipId and profileDocument in learner_profiles (placements.ts:295-302; profiles.ts:15-24).
- Fix: Keep 1:1 scoped mapping from legacy learner to active membership; resolve transfers/duplicates.

## G2-8-001-048  [P2] GAP  facet F22  effort M
- Legacy: `model/Faculty.java:88-96,139` and `model/Learner.java:93-101,144`: contact fields in per-role entity, website image
- vNext now: `db/schema/users.ts:12-24` and `db/schema/memberships.ts:17-32`: canonical identity+membership; `profiles.ts:15-58` role profiles
- Fix: Add explicit DTO mapping/source for legacy contactPhone and image if required, avoid duplicating PII tables

## G2-8-003-045  [P2] GAP  facet F22  effort M
- Legacy: `.../model/Faculty.java:88-96,139`, `.../model/Learner.java:93-101,144`: role-owned contact+website
- vNext now: `src/db/schema/users.ts:12-30`, `memberships.ts:17-68`, `profiles.ts:15-58`: normalized user/membership/role-profile, website not explicit
- Fix: Provide read-model mapping for role image/secondary phone or explicit approved omission; migration is not required
