# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-14-007-016 [P1] GAP facet F07
- Files: src/app/(authenticated)/college/groups/[groupId]/page.tsx
- Legacy: Legacy no validation text or not-found message; vNext canonical detail displays 404 for unknown GroupReadError — `docs/legacy-source/frontend/src/pages/college-admin/student-groups/[id].js:8-12`
- Expected fix: Old group URLs must redirect even if invalid ID, not display 404

## G2-18-029-005 [P1] GAP facet F05
- Files: (none, new feature)
- Legacy: Inline table-card filter program select 200px, Search semesters, Refresh and CSV (legacy:462-505)
- Expected fix: Recreate compact tools in list card header, including search placeholder

## G2-14-002-026 [P1] GAP facet F05
- Files: src/components/admin/admin-scoped-read-page.tsx
- Legacy: Legacy Program/Batch/Class filters dependent and clear child on parent change; vNext three independent GET fields — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:896-926,1503-1523`
- Expected fix: Make parent changes clear child and scope option lists

## G2-14-002-068 [P1] GAP facet F13
- Files: src/app/(authenticated)/admin/students/page.tsx
- Legacy: Legacy academic options failure disables register/edit only; vNext could block entire Student register page — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1476-1480`
- Expected fix: Separate option fetch errors from authorized roster read

## G2-18-031-027 [P1] MISSING facet F06
- Files: src/components/admin/person-onboard-dialog.tsx
- Legacy: Legacy Faculty register requires First/Last/Mobile/Department/Faculty Type and conditional college, optional Email/Gender/DOB/Address/Bio; Faculty.js:983-1105
- Expected fix: Restore Department and faculty type validation at initial registration or enforce explicit post-registration completion step

## G2-18-031-030 [P1] GAP facet F06
- Files: src/components/admin/person-onboard-dialog.tsx, src/modules/people/membership-service.ts
- Legacy: Legacy register Faculty Type includes protected ADMIN/TPO and Mentor plus department; Faculty.js:1038-1078;FacultyController.java:137-154
- Expected fix: Ensure only SA can grant protected roles and faculty type/department remain independently mapped

## G2-15-004-017 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: Archived must never display stale manually authored nextAction (ProjectsContent.jsx:396-418)
- Expected fix: Suppress actions for archived records, show view-only affordance

## G2-15-005-077 [P1] GAP facet F23
- Files: (none, new feature)
- Legacy: Legacy hero role/company/logo, eligibility panel, journey, cards, right rail, mobile bar (JobDetailContent.jsx:1094-1344)
- Expected fix: Clone legacy page layout/shell and preserve necessary newer role-detail content subordinate

## G2-15-008-028 [P1] GAP facet F07
- Files: (none, new feature)
- Legacy: Legacy unknown type has `This content type isn't supported yet`, `Contact your instructor if this looks wrong.` (syllabusDetail.js:553-559)
- Expected fix: Render noninteractive unknown-type diagnostic rather than drop authored learning item

## G2-16-004-021 [P1] GAP facet F05
- Files: (none, new feature)
- Legacy: `BugReportRepository.java:18-32`: reporter matches case-insensitively exact value.
- Expected fix: Apply equality match for dropdown reporter; optional fuzzy search separately if approved.

## G2-16-014-021 [P1] GAP facet F11
- Files: src/modules/placements/tpo-offer-lifecycle-service.ts
- Legacy: JobOfferRepository.java:25-31 system-wide scheduled due scan.
- Expected fix: Give system scheduler isolated job identity and tenant-scoped transactions.

## G2-16-020-019 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: College.java:36-41 chair/vice chair tied to faculty IDs.
- Expected fix: Implement assignment/validation as separate association with audit.

## G2-16-028-027 [P1] GAP facet F10
- Files: src/modules/projects/resource-service.ts
- Legacy: AdminService.js:361-363 and resources.js:49-52 issue PUT `/api/v1/admin/projects/{id}?collegeId={id}` with `{resources,resourcesToken}`.
- Expected fix: Implement one atomic section replace/reorder endpoint with resources token or adjust UX to explicit per-row saves.

## G2-16-028-029 [P1] GAP facet F10
- Files: src/modules/projects/resource-service.ts
- Legacy: ProjectWorkspaceUpdateDTO.java:22-36 resourcesToken rejects stale full-array writes with 409.
- Expected fix: Add collection version/token validation to prevent concurrent section saves/reorder overwrites.

## G2-17-001-039 [P1] GAP facet F20
- Files: src/app/(authenticated)/teacher/courses/[deliveryId]/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/index.js:10 splits path and query, strips trailing /, retains original query literally; :7-14 uses redirectedRef.
- Expected fix: Add canonical URL construction that carries query safely and tests trailing slash, encoded slug, repeated query keys, long/special strings.

## G2-19-007-024 [P1] GAP facet F06
- Files: src/app/(authenticated)/college/courses/offerings/[offeringId]/page.tsx
- Legacy: Legacy numeric route detection `!isNaN(id)` and parseInt `docs/legacy-source/frontend/src/pages/college-admin/courses/[id].js:93-95`
- Expected fix: Validate and map numeric IDs without accepting unsupported tenant IDs.

## G2-19-013-018 [P1] GAP facet F06
- Files: src/components/admin/admin-scoped-read-page.tsx, src/modules/admin-ui/super-admin-scoped-people-service.ts
- Legacy: Legacy `facultyType` typed Java FacultyType enum `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:91-93` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:249-259`
- Expected fix: Define mapping between FacultyType and new employmentType/academicTitle.

## G2-19-013-034 [P1] GAP facet F11
- Files: src/components/admin/admin-scoped-read-page.tsx, src/modules/admin-ui/super-admin-scoped-people-service.ts
- Legacy: Legacy global SA may search/cache all tenants; scoped SA restricted `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:63-77` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:95-115`
- Expected fix: Owner decide global search capability while preserving tenant isolation.

## G2-19-013-061 [P1] GAP facet F23
- Files: src/components/admin/admin-scoped-read-page.tsx
- Legacy: Legacy global SA `/search`, `/colleges`, `/stats` sees global overview `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:95-99` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:191-216` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:328-337`
- Expected fix: Decide approved cross-tenant global directory behavior.

## G2-19-018-020 [P1] GAP facet F06
- Files: src/components/admin/lecture-hall-manager.tsx
- Legacy: Legacy optional department can be cleared, submitting dept_id=0. `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:328-336` `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:132-139`
- Expected fix: Normalize zero-department records to null and map API shapes.

## G2-19-018-022 [P1] GAP facet F06
- Files: src/components/admin/lecture-hall-manager.tsx
- Legacy: Legacy create form inline resets on success; edit Cancel checks dirty snapshot. `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:140-143` `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:173-185`
- Expected fix: Add dirty-dismiss confirmation for cancel/Escape/backdrop.

## G2-19-018-027 [P1] GAP facet F07
- Files: src/components/admin/lecture-hall-manager.tsx, src/db/schema/lecture-halls.ts
- Legacy: Legacy same-name conflict includes quoted name; all halls considered. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LectureHallServiceImpl.java:76-87`
- Expected fix: Resolve archived-name reuse semantics and display name conflict.

## G2-19-018-032 [P1] GAP facet F09
- Files: src/components/admin/lecture-hall-manager.tsx
- Legacy: Legacy dirty edit confirm 'Discard edits to “name”?' and 'Your unsaved changes will be lost.'. `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:173-185`
- Expected fix: Add unsaved-edits confirmation with exact title/body.

## G2-19-018-035 [P1] GAP facet F10
- Files: src/components/admin/lecture-hall-manager.tsx, src/modules/academics/lecture-hall-service.ts
- Legacy: Legacy physical DELETE blocks on any associated class schedule. `docs/legacy-source/frontend/src/api/Services/AdminService.js:642-643` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LectureHallServiceImpl.java:143-153`
- Expected fix: Approve archive-vs-delete business change and preserve booking referential history.

## G2-19-018-067 [P1] GAP facet F23
- Files: src/app/(authenticated)/admin/lecture-halls/page.tsx, src/components/admin/lecture-hall-manager.tsx
- Legacy: Legacy unrestricted Super Admin list and left creation card are no longer exposed as such. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:80-101` `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:300-305`
- Expected fix: Seek product decision and do not silently call removed capabilities equivalent.
