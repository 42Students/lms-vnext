# Work packet (wave 2): edit src/app/(authenticated)/teacher/profile/details/page.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/faculty-profile-controller.md, docs/audit/gap2/lane-20/teacher-profile.md, docs/audit/gap2/lane-4/faculty-model.md

## G2-1-003-001  [P2] GAP  facet F01  effort M
- Legacy: `FacultyProfileController.java:24-28` declares `/api/v1/profile/faculty/{facultyId}/*` for any authorized faculty/admin.
- vNext now: `src/app/(authenticated)/teacher/profile/page.tsx:8-22` and `details/page.tsx:11-24` split read-only overview and self editor; `src/app/api/people/faculty-self-document/route.ts:10-27` uses selected membership.
- Fix: Route legacy profile links to new self and scoped college-admin destinations; retain exact profile entry points.

## G2-1-003-055  [P2] GAP  facet F13  effort M
- Legacy: `ProfileSectionsPanel.js:205-230,278-309` per-section Spin, server error, reload, empty view; list `:318-347,414-468` similar.
- vNext now: `teacher/profile/details/page.tsx:21-24` whole-page blocking migration warning; `faculty-profile-editor.tsx:78-85` error, pending and success inline.
- Fix: Add per-section loading/error/retry and accessible empty state matching old while keeping database-blocker honest.

## G2-1-003-057  [P2] GAP  facet F13  effort S
- Legacy: `ProfileSectionsPanel.js:486` missing record 'No record selected'.
- vNext now: `teacher/profile/details/page.tsx:13` role mismatch notFound(); no record-specific empty state.
- Fix: Use role-safe empty profile/recovery if selected membership lacks faculty profile row.

## G2-20-030-005  [P2] GAP  facet F01  effort M
- Legacy: Deep link ?section=connect-accounts scrolls Social Profiles; other section values scroll Contacts (`docs/legacy-source/frontend/src/pages/teacher/profile.js:96-110`)
- vNext now: Profile route has no query-based section targeting; separate details and contacts routes (`src/app/(authenticated)/teacher/profile/page.tsx:8-50`, `src/app/(authenticated)/teacher/profile/details/page.tsx:16-24`)
- Fix: Honor section query and anchor IDs or redirect deep links correctly

## G2-20-030-034  [P2] GAP  facet F06  effort M
- Legacy: Legacy section cards start in read mode and enter editing on per-card Edit/Add (`docs/legacy-source/frontend/src/components/profile/about.js:81-99`, `docs/legacy-source/frontend/src/components/profile/about.js:938-973`)
- vNext now: Details page editor fields always visible if profile storage ready (`src/app/(authenticated)/teacher/profile/details/page.tsx:21-25`, `src/components/people/faculty-profile-editor.tsx:92-135`)
- Fix: Default to read mode and enter editable mode via action

## G2-4-020-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy teacher profile loads full details on one page via About component. (`docs/legacy-source/frontend/src/pages/teacher/profile.js:1-12`; `docs/legacy-source/frontend/src/pages/teacher/profile.js:65-84`)
- vNext now: New summary Profile page links to About & details editor on second route. (`src/app/(authenticated)/teacher/profile/page.tsx:19-35`; `src/app/(authenticated)/teacher/profile/details/page.tsx:16-24`)
- Fix: Review one-page About layout against new split route and exact hero/sections.

## G2-4-020-022  [P2] GAP  facet F06  effort M
- Legacy: Legacy one Faculty row with all fields can be updated via profile APIs. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:34-198`)
- vNext now: New self editor writes profileDocument; admin employment fields separately managed. (`src/modules/people/faculty-profile-self.staged.ts:101-129`; `src/app/(authenticated)/teacher/profile/details/page.tsx:16-24`)
- Fix: Define immutable college-managed fields vs self-edit and update contract per field.
