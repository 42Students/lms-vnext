# Work packet: edit src/modules/people/faculty-profile-self.staged.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/faculty-profile-controller.md, docs/audit/gap2/lane-20/teacher-profile.md, docs/audit/gap2/lane-4/faculty-model.md

## G2-1-003-044  [P1] GAP  facet F10  effort L
- Legacy: `FacultyProfileServiceImpl.java:90-615` updates columns/lists embedded in `Faculty` JPA row with facultyRepository.save after operations.
- vNext now: `faculty-profile-self.staged.ts:72-223` maintains versioned JSONB in faculty_profiles table via transaction, migration `drizzle/0067_faculty_profile_document.sql:1-3`.
- Fix: Plan/execute migration from each legacy Faculty column and serial list into stable vNext JSONB paths; verify round-trip fidelity.

## G2-1-003-082  [P1] GAP  facet F23  effort L
- Legacy: `FacultyProfileServiceImpl.java:207-592` repeatable lists have no max; vNext capped sections, migrated legacy over-limit lists may fail entire document.
- vNext now: `faculty-profile-document.ts:292-298` max item counts; `faculty-profile-self.staged.ts:72-223` full document parsing.
- Fix: Implement pre-migration exception report and no-truncation remediation for over-limit records.

## G2-20-030-057  [P1] GAP  facet F11  effort L
- Legacy: Legacy backend restricts sensitive identity refs to tenant folder and self/authorized admin (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyProfileController.java:55-106`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyProfileController.java:117-155`)
- vNext now: vNext forbids identity/secret metadata edits and requires profile.self.manage (`src/modules/people/faculty-self-section-model.ts:41-51`, `src/modules/people/faculty-profile-self.staged.ts:69-82`)
- Fix: Design secure migration preserving authorized identity uploads without permitting arbitrary ref injection

## G2-20-030-063  [P1] GAP  facet F13  effort M
- Legacy: Legacy independent section reads allSettled, show missing section names and Retry sections (`docs/legacy-source/frontend/src/components/profile/about.js:177-262`, `docs/legacy-source/frontend/src/components/profile/about.js:905-914`)
- vNext now: New single document request; any error blocks entire details page (`src/app/(authenticated)/teacher/profile/details/page.tsx:13-25`, `src/modules/people/faculty-profile-self.staged.ts:69-96`)
- Fix: Surface granular partial failures and section retry where backend supports it

## G2-4-020-028  [P1] GAP  facet F07  effort M
- Legacy: Legacy @Version Long serves optimistic update conflict on entity. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:63-69`)
- vNext now: New faculty profileDocumentVersion integer CAS in dedicated profile row, no version on all identity fields. (`src/db/schema/profiles.ts:45-65`; `src/modules/people/faculty-profile-self.staged.ts:186-215`)
- Fix: Enforce optimistic concurrency on profile, admin employment and lifecycle edits independently.

## G2-4-020-035  [P1] GAP  facet F10  effort L
- Legacy: Legacy faculty row has personal/contact/social fields and JSON collections. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:74-198`)
- vNext now: New self profile editor writes JSON with optimistic version; staging says not wired to runtime until registration. (`src/modules/people/faculty-profile-document.ts:282-333`; `src/modules/people/faculty-profile-self.staged.ts:60-69`)
- Fix: Verify canonical schema/journal and route integration before marking self profile complete.

## G2-4-020-059  [P1] GAP  facet F20  effort M
- Legacy: Legacy @Version Long optimistic locking on whole entity. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:63-69`)
- vNext now: New profileDocumentVersion CAS implemented in staged service; canonical status may be migration-dependent. (`src/modules/people/faculty-profile-self.staged.ts:186-215`; `src/db/schema/profiles.ts:45-51`)
- Fix: Audit stale self profile update and admin same-user edits across devices.
