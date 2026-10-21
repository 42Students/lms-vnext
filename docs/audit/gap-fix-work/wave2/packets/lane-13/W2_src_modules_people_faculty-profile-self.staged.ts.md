# Work packet (wave 2): edit src/modules/people/faculty-profile-self.staged.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/teacher-profile.md, docs/audit/gap2/lane-4/faculty-model.md

## G2-20-030-029  [P2] GAP  facet F04  effort M
- Legacy: Legacy faculty About loads all 11 core sections and publications/awards as distinct data sets (`docs/legacy-source/frontend/src/components/profile/about.js:196-261`)
- vNext now: New self-document collapses all editable sections in one JSONB document; summary loads small profile (`src/modules/people/faculty-profile-self.staged.ts:69-96`, `src/db/schema/profiles.ts:43-50`)
- Fix: Preserve section completeness and independent partial-data status when switching storage

## G2-20-030-051  [P2] GAP  facet F10  effort M
- Legacy: Legacy initial GET /api/v1/faculty/getInstructorDetails?facultyId, section GETs afterward (`docs/legacy-source/frontend/src/api/Services/UserServices.js:12-20`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:246-282`, `docs/legacy-source/frontend/src/components/profile/about.js:196-261`)
- vNext now: New server getOwnFacultyProfile then staged self JSONB load on details (`src/app/(authenticated)/teacher/profile/page.tsx:8-17`, `src/modules/people/faculty-profile-self.staged.ts:69-96`)
- Fix: Crosswalk endpoint payloads and avoid losing legacy section fields

## G2-20-030-077  [P2] GAP  facet F19  effort M
- Legacy: Legacy fans out 11 base + faculty-specific GET endpoints on mount, Promise.allSettled and visible stale profile (`docs/legacy-source/frontend/src/components/profile/about.js:196-261`)
- vNext now: vNext performs single document JSONB read and self summary read (`src/modules/people/faculty-profile-self.staged.ts:69-96`, `src/app/(authenticated)/teacher/profile/page.tsx:8-17`)
- Fix: Retain partial-outage behavior; keep efficient single read with item-level error model

## G2-4-020-022  [P2] GAP  facet F06  effort M
- Legacy: Legacy one Faculty row with all fields can be updated via profile APIs. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:34-198`)
- vNext now: New self editor writes profileDocument; admin employment fields separately managed. (`src/modules/people/faculty-profile-self.staged.ts:101-129`; `src/app/(authenticated)/teacher/profile/details/page.tsx:16-24`)
- Fix: Define immutable college-managed fields vs self-edit and update contract per field.

## G2-4-020-024  [P2] GAP  facet F06  effort M
- Legacy: Legacy contact, bio and repeated JSON updates may set nullable fields. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:74-198`)
- vNext now: New faculty profile document Zod defaults missing sections, strict validation and versioned write. (`src/modules/people/faculty-profile-document.ts:282-333`; `src/modules/people/faculty-profile-self.staged.ts:109-119`)
- Fix: Support partial field merge/cancel without erasing old unsupported fields.
