# Work packet (wave 2): edit src/modules/admin-ui/super-admin-read-directory-model.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/superadmin-students.md, docs/audit/gap2/lane-4/superadmin-sections-faculty-assignment.md, docs/audit/gap2/lane-5/u014-class-search-controller.md, docs/audit/gap2/lane-6/superadmin-faculty-section.md

## G2-19-001-019  [P2] GAP  facet F05  effort M
- Legacy: Legacy default table paging 25; changer offers 25,50,100,200 `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1583`
- vNext now: vNext default 25; size chooser 10,25,50,100 `src/modules/admin-ui/super-admin-read-directory-model.ts:2`,14; `src/components/admin/admin-scoped-read-page.tsx:184-189`
- Fix: Match legacy size options including 200, update bounded query and DB pagination.

## G2-19-001-079  [P2] GAP  facet F19  effort M
- Legacy: Legacy popular learner query 10, autocomplete limit 15, debounce 200ms `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:241-252`,424-431
- vNext now: vNext no popular/recent suggestions; server directory query size capped 100 `src/modules/admin-ui/super-admin-scoped-people-service.ts:90-91`; `src/modules/admin-ui/super-admin-read-directory-model.ts:14`
- Fix: Offer bounded suggestions via a scoped endpoint; avoid full client roster fetch.

## G2-4-011-024  [P2] GAP  facet F05  effort S
- Legacy: Client paging default 25 and options 10,25,50,100 remembered in localStorage. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:19-20`; `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:81-101`; `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:504-510`)
- vNext now: Server paging same sizes, URL state, no localStorage preference in shared directory. (`src/modules/admin-ui/super-admin-read-directory-model.ts:2-14`; `src/components/admin/admin-scoped-read-page.tsx:184-195`)
- Fix: Persist last page size under legacy key.

## G2-5-014-015  [P2] GAP  facet F05  effort S
- Legacy: Legacy /search default limit=15, unrestricted int declared (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:74-79`)
- vNext now: vNext superadmin paged query default pageSize 25, legal 10/25/50/100 (`src/modules/admin-ui/super-admin-read-directory-model.ts:2-15`)
- Fix: Preserve 15 suggestions for autocomplete, keep paged directory separate

## G2-6-002-021  [P2] GAP  facet F05  effort M
- Legacy: Old Ant Table default 25, sizes 25/50/100/200 `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1362-1370`
- vNext now: New select options 10/25/50/100 and model max100 `src/components/admin/admin-scoped-read-page.tsx:180-190` `src/modules/admin-ui/super-admin-read-directory-model.ts:10-15`
- Fix: Offer 200 or explain intentional server cap separately; align page size list
