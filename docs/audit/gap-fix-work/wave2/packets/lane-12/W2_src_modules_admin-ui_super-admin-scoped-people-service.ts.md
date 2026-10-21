# Work packet (wave 2): edit src/modules/admin-ui/super-admin-scoped-people-service.ts

32 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/super-admin-user-admin-controller.md, docs/audit/gap2/lane-14/super-admin-students.md, docs/audit/gap2/lane-19/faculty-search-controller.md, docs/audit/gap2/lane-19/superadmin-students.md, docs/audit/gap2/lane-6/superadmin-faculty-section.md, docs/audit/gap2/lane-6/superadmin-teachers.md

## G2-1-007-011  [P2] GAP  facet F04  effort M
- Legacy: `SuperAdminUserAdminController.java:167` response `{items: List<Faculty>}`.
- vNext now: `super-admin-scoped-people-service.ts:93-111` paginated `{query,total,totalPages,items}` with name/details/status and UUID membership.
- Fix: Map legacy faculty model fields into normalized rows; preserve role/department.

## G2-14-002-018  [P2] GAP  facet F04  effort S
- Legacy: Legacy first/last concatenation or dash; vNext database users.displayName — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:928-934`
- vNext now: `src/modules/admin-ui/super-admin-scoped-people-service.ts:27-34,90-104`
- Fix: Use legacy format + dash and preserve sorting semantics

## G2-14-002-019  [P2] GAP  facet F04  effort M
- Legacy: Legacy shows raw phone and email; vNext users.phoneE164/users.email projected as details, not dedicated columns — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:935-939`
- vNext now: `src/modules/admin-ui/super-admin-scoped-people-service.ts:27-34,90-104`
- Fix: Expose permitted contact columns, local display format and privacy masking

## G2-14-002-020  [P2] GAP  facet F04  effort M
- Legacy: Legacy class name by classId fallback ID then dash; vNext active section derived by enrollment — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:940-947`
- vNext now: `src/modules/admin-ui/super-admin-scoped-people-service.ts:13-26,90-104`
- Fix: Resolve current section name and numeric/blank fallback

## G2-14-002-021  [P2] GAP  facet F04  effort S
- Legacy: Legacy Gender dedicated column; vNext list projection lacks explicit Gender — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:948-948`
- vNext now: `src/modules/admin-ui/super-admin-scoped-people-service.ts:27-34,90-104`
- Fix: Include gender in typed student roster display

## G2-14-002-022  [P2] GAP  facet F04  effort M
- Legacy: Legacy suspendedAt drives statuses Active or Suspended; vNext membership includes ENDED and platformStatus — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:949-957`
- vNext now: `src/app/(authenticated)/admin/students/page.tsx:20-20`; `src/modules/admin-ui/super-admin-scoped-people-service.ts:27-34,71-71`
- Fix: Map platform login suspension separately from membership status

## G2-14-002-024  [P2] GAP  facet F05  effort M
- Legacy: Legacy clickable Name and Roll numeric sort; vNext fixed server name then ID sort — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:928-936`
- vNext now: `src/modules/admin-ui/super-admin-scoped-people-service.ts:88-91`
- Fix: Support both sort keys and numeric roll sorting

## G2-14-002-088  [P2] GAP  facet F19  effort M
- Legacy: Legacy remote suggestions 15 + popular top10; vNext paged search no suggestion endpoint in this page — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:241-298,910-926`
- vNext now: `src/modules/admin-ui/super-admin-scoped-people-service.ts:66-91`
- Fix: Build scoped suggestion API and cache recent non-sensitive IDs

## G2-19-013-010  [P2] GAP  facet F04  effort M
- Legacy: Legacy first+last name fallback uniqueId in DTO `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchDTO.java:39-49`
- vNext now: vNext title displayName or Unnamed person `src/modules/admin-ui/super-admin-scoped-people-service.ts:93-95`
- Fix: Implement legacy name fallback only if uniqueId exists in new profile.

## G2-19-013-011  [P2] GAP  facet F04  effort M
- Legacy: Legacy searchableText includes 9 fields including type+college `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchDTO.java:51-65`
- vNext now: vNext admin SQL q filters displayName,email,phone only `src/modules/admin-ui/super-admin-scoped-people-service.ts:77-81`
- Fix: Add sanctioned department/type/identifier searches and privacy controls.

## G2-19-013-013  [P2] GAP  facet F05  effort M
- Legacy: Legacy search `query`, limit, collegeId, deptId, facultyType filters `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:80-93`
- vNext now: vNext directory q/status/departmentId/employmentType, paged `src/modules/admin-ui/super-admin-scoped-people-service.ts:10-12` `src/modules/admin-ui/super-admin-scoped-people-service.ts:71-82` `src/components/admin/admin-scoped-read-page.tsx:114-174`
- Fix: Map query parameter names, faculty type enum and department/college selection.

## G2-19-013-015  [P2] GAP  facet F05  effort M
- Legacy: Legacy cache expands synonyms for prof, hod, asst, assoc, teacher, contact words `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchCache.java:79-96`
- vNext now: vNext directory uses ILIKE text search, no synonym map in mapped module `src/modules/admin-ui/super-admin-scoped-people-service.ts:77-81`
- Fix: Add safe synonym expansion on authorized fields if parity requested.

## G2-19-013-016  [P2] GAP  facet F05  effort M
- Legacy: Legacy category route equalsIgnoreCase department `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:287-306`
- vNext now: vNext admin directory departmentId exact SQL equality `src/modules/admin-ui/super-admin-scoped-people-service.ts:66-76`
- Fix: Support case-insensitive category name mapping to college department IDs.

## G2-19-013-019  [P2] GAP  facet F06  effort M
- Legacy: Legacy `/exists/{facultyName}` path string with exact case-insensitive display-name equality `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:355-368`
- vNext now: vNext directory q ILIKE substring, no exact-existence endpoint in mapped view `src/modules/admin-ui/super-admin-scoped-people-service.ts:77-81`
- Fix: Provide scoped exact existence check when deduping faculty.

## G2-19-013-028  [P2] GAP  facet F10  effort M
- Legacy: Legacy `GET /search` with five query params `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:80-93`
- vNext now: vNext server listAdminScopedPeople(context,'FACULTY',query) `src/app/(authenticated)/admin/faculty/page.tsx:44-44` `src/modules/admin-ui/super-admin-scoped-people-service.ts:10-12`
- Fix: Expose compatible scoped GET endpoint only for extant clients.

## G2-19-013-032  [P2] GAP  facet F10  effort M
- Legacy: Legacy GET `/stats` and `/exists/{facultyName}` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:328-369`
- vNext now: vNext admin directory counts, no mapped exact-check route `src/components/admin/admin-scoped-read-page.tsx:69-106` `src/modules/admin-ui/super-admin-scoped-people-service.ts:77-81`
- Fix: Expose scoped counts and duplicate-check as needed.

## G2-19-013-037  [P2] GAP  facet F12  effort M
- Legacy: Legacy in-memory cache loads non-deleted faculty, not necessarily active membership `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchCache.java:103-130`
- vNext now: vNext list reads membership status including ACTIVE/SUSPENDED/ENDED with filters `src/modules/admin-ui/super-admin-scoped-people-service.ts:69-76` `src/components/admin/admin-scoped-read-page.tsx:118-121`
- Fix: Define visibility of suspended faculty in quick search vs management directory.

## G2-19-013-055  [P2] GAP  facet F20  effort M
- Legacy: Legacy popularity `recordUsage(facultyId)` can be called multiple times `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:309-325`
- vNext now: vNext no equivalent usage mutation in scoped read/picker `src/modules/admin-ui/super-admin-scoped-people-service.ts:10-12` `src/modules/courses/college-faculty-picker-service.ts:12-33`
- Fix: If popular suggestions kept, add rate-limited usage tracking.

## G2-19-013-057  [P2] GAP  facet F21  effort M
- Legacy: Legacy FacultySearchCache GenericSearchCache with synonyms, popularity and refresh `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchCache.java:24-34` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchCache.java:67-99`
- vNext now: vNext SQL directory, picker and filters rather than generic in-memory cache `src/modules/admin-ui/super-admin-scoped-people-service.ts:10-12` `src/modules/courses/college-faculty-picker-service.ts:9-33`
- Fix: Document substitution and feature parity matrix per endpoint.

## G2-19-001-011  [P2] GAP  facet F04  effort M
- Legacy: Legacy full name derived `firstName + lastName`, empty `-` `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:930-934`
- vNext now: vNext displays `users.displayName` or `Unnamed person` `src/modules/admin-ui/super-admin-scoped-people-service.ts:31`,93-95
- Fix: Normalize name display to legacy full-name fallback where both parts are available.

## G2-19-001-024  [P2] GAP  facet F05  effort M
- Legacy: Legacy search is client `includes` over seven identity/contact fields `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:917-926`
- vNext now: vNext server `ilike` name/email/roll/phone `src/modules/admin-ui/super-admin-scoped-people-service.ts:78-81`
- Fix: Test matching case, punctuation and contact fields; implement consistent scoped search across permitted student-contact fields.

## G2-19-001-079  [P2] GAP  facet F19  effort M
- Legacy: Legacy popular learner query 10, autocomplete limit 15, debounce 200ms `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:241-252`,424-431
- vNext now: vNext no popular/recent suggestions; server directory query size capped 100 `src/modules/admin-ui/super-admin-scoped-people-service.ts:90-91`; `src/modules/admin-ui/super-admin-read-directory-model.ts:14`
- Fix: Offer bounded suggestions via a scoped endpoint; avoid full client roster fetch.

## G2-6-002-011  [P2] GAP  facet F04  effort S
- Legacy: Old Name cell joins firstName/lastName with dash when absent `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:769-774`
- vNext now: New name uses users.displayName, fallback `Unnamed person` `src/modules/admin-ui/super-admin-scoped-people-service.ts:93-95`
- Fix: Add compatibility name rendering and legacy dash fallback

## G2-6-002-012  [P2] GAP  facet F04  effort M
- Legacy: Old Department column shows resolved deptName or dash `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:775-779`
- vNext now: New department is details line `Department: X` with `Not assigned` fallback `src/modules/admin-ui/super-admin-scoped-people-service.ts:96-104`
- Fix: Restore separate Department column and dash placeholder

## G2-6-002-013  [P2] GAP  facet F04  effort M
- Legacy: Old Mobile column uses contactMobile `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:780-781`
- vNext now: New `Mobile: +91...` is details line, sourced users.phoneE164 `src/modules/admin-ui/super-admin-scoped-people-service.ts:27-35` `src/modules/admin-ui/super-admin-scoped-people-service.ts:103-106`
- Fix: Display normalized/permission-safe mobile in its own column and align formatting

## G2-6-002-014  [P2] GAP  facet F04  effort S
- Legacy: Old Email has ellipsis in dedicated table column `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:781-784`
- vNext now: New Email is full details line `Email: ...` `src/modules/admin-ui/super-admin-scoped-people-service.ts:102-106`
- Fix: Restore dedicated Email column with clipping and tooltip

## G2-6-002-016  [P2] GAP  facet F04  effort S
- Legacy: Old Gender visible as standalone column `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:792-793`
- vNext now: New Gender appears in details sourced JSON profile field `src/modules/admin-ui/super-admin-scoped-people-service.ts:39-42` `src/modules/admin-ui/super-admin-scoped-people-service.ts:101-103`
- Fix: Restore Gender table column, honoring permission boundaries

## G2-6-002-025  [P2] GAP  facet F05  effort M
- Legacy: Old selecting suggestion narrows roster to exact faculty and tracks popularity `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:291-316`
- vNext now: New search matches name, email or phone via ilike `src/modules/admin-ui/super-admin-scoped-people-service.ts:77-82`
- Fix: Support exact selection and optional popularity tracking with tenant filtering

## G2-6-002-084  [P2] MISSING  facet F21  effort M
- Legacy: Old faculty autocomplete popularity telemetry from recordFacultySelection `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:291-316`
- vNext now: New directory only DB read; no selection telemetry in page `src/modules/admin-ui/super-admin-scoped-people-service.ts:77-91` `src/app/(authenticated)/admin/faculty/page.tsx:36-44`
- Fix: Reintroduce consent-aware scoped selection tracking if requirement remains

## G2-6-003-011  [P2] GAP  facet F04  effort M
- Legacy: Old list fields drawn from faculty entity name/department/mobile/type `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:769-801` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:35-105`
- vNext now: New list draws joined membership+user+faculty_profile fields `src/modules/admin-ui/super-admin-scoped-people-service.ts:27-69`
- Fix: Apply field mapping for legacy table columns in nested Faculty list

## G2-19-013-051  [P3] GAP  facet F18  effort S
- Legacy: Legacy search frontend comment `ultra-fast` and `fuzzy matching` `docs/legacy-source/frontend/src/api/Services/FacultySearchService.js:6-10`
- vNext now: vNext search title/label generic `Search`, text q `src/components/admin/admin-scoped-read-page.tsx:114-116` `src/modules/admin-ui/super-admin-scoped-people-service.ts:77-81`
- Fix: Avoid unsupported fuzzy claim or restore expansion.

## G2-19-001-013  [P3] GAP  facet F04  effort S
- Legacy: Legacy class falls back to numeric classId or `-` `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:940-946`
- vNext now: vNext class falls back to `Not assigned` `src/modules/admin-ui/super-admin-scoped-people-service.ts:43-59`,104-105
- Fix: Match legacy class fallback and avoid leaking internal raw IDs if intentional privacy change is approved.
