# Work packet: edit drizzle/0067_faculty_profile_document.sql

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/faculty-profile-controller.md

## G2-1-003-044  [P1] GAP  facet F10  effort L
- Legacy: `FacultyProfileServiceImpl.java:90-615` updates columns/lists embedded in `Faculty` JPA row with facultyRepository.save after operations.
- vNext now: `faculty-profile-self.staged.ts:72-223` maintains versioned JSONB in faculty_profiles table via transaction, migration `drizzle/0067_faculty_profile_document.sql:1-3`.
- Fix: Plan/execute migration from each legacy Faculty column and serial list into stable vNext JSONB paths; verify round-trip fidelity.

## G2-1-003-076  [P1] GAP  facet F22  effort L
- Legacy: `FacultyProfileServiceImpl.java:90-615` stores metadata, arrays and identity in legacy `Faculty` entity JPA fields.
- vNext now: `src/db/schema/profiles.ts:33-68` stores JSON document and version in per-membership faculty_profiles table; migration `drizzle/0067_faculty_profile_document.sql:1-3`.
- Fix: Build field-by-field migration contract for all 15 sections and legacy orphaned faculty profiles; validate tenant-specific mapping.
