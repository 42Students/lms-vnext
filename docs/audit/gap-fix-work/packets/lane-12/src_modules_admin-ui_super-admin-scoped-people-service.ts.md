# Work packet: edit src/modules/admin-ui/super-admin-scoped-people-service.ts

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/super-admin-students.md, docs/audit/gap2/lane-19/faculty-search-controller.md, docs/audit/gap2/lane-19/superadmin-students.md, docs/audit/gap2/lane-6/superadmin-faculty-section.md

## G2-14-002-094  [P1] GAP  facet F22  effort L
- Legacy: Legacy learner flat entity fields, vNext users+membership+profiles+enrollments normalized; projection loses some old columns — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:535-578`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:928-957`
- vNext now: `src/modules/admin-ui/super-admin-scoped-people-service.ts:5-34,90-104`
- Fix: Create explicit field-by-field mapping including null and multi-section behavior

## G2-19-013-009  [P1] GAP  facet F04  effort L
- Legacy: Legacy FacultySearchDTO fields id, firstName,lastName,uniqueId,contactMail,mobile,facultyType,deptId,orgId,collegeId `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchDTO.java:20-32`
- vNext now: vNext admin directory fields membershipId, user displayName/email/phone, dept, academicTitle and employmentType `src/modules/admin-ui/super-admin-scoped-people-service.ts:28-40` `src/modules/admin-ui/super-admin-scoped-people-service.ts:93-108`
- Fix: Map exact faculty entity fields to UUID memberships without dropping required institution IDs.

## G2-19-013-018  [P1] GAP  facet F06  effort M
- Legacy: Legacy `facultyType` typed Java FacultyType enum `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:91-93` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:249-259`
- vNext now: vNext employmentType text filter plus Mentor role special case `src/components/admin/admin-scoped-read-page.tsx:162-164` `src/modules/admin-ui/super-admin-scoped-people-service.ts:72-76`
- Fix: Define mapping between FacultyType and new employmentType/academicTitle.

## G2-19-013-034  [P1] GAP  facet F11  effort L
- Legacy: Legacy global SA may search/cache all tenants; scoped SA restricted `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:63-77` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:95-115`
- vNext now: vNext super admin directory requires selected college `src/components/admin/admin-scoped-read-page.tsx:48-56` `src/modules/admin-ui/super-admin-scoped-people-service.ts:10-12`
- Fix: Owner decide global search capability while preserving tenant isolation.

## G2-19-013-058  [P1] GAP  facet F22  effort L
- Legacy: Legacy FacultySearchDTO numeric faculty/college/dept IDs `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchDTO.java:20-32`
- vNext now: vNext membership UUID, department FK/college UUID and facultyProfiles `src/modules/admin-ui/super-admin-scoped-people-service.ts:28-40` `src/modules/admin-ui/super-admin-scoped-people-service.ts:60-81`
- Fix: Map faculty primary key to membership UUID; validate one user across colleges.

## G2-19-013-059  [P1] GAP  facet F22  effort L
- Legacy: Legacy faculty type enum and first/last contact fields `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchDTO.java:20-32`
- vNext now: vNext employmentType academicTitle, name, email/phone in user+profile `src/modules/admin-ui/super-admin-scoped-people-service.ts:28-40` `src/modules/admin-ui/super-admin-scoped-people-service.ts:93-108`
- Fix: Reconcile faculty title/type and contact normalization in migration.

## G2-19-001-010  [P1] GAP  facet F04  effort M
- Legacy: Table columns `Name`, `Roll No.`, `Mobile`, `Email`, `Class`, `Gender`, `Status`, `Actions` `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:928-962`
- vNext now: vNext article rows: title/status/subtitle and text detail paragraphs; no named data-table columns `src/components/admin/admin-scoped-read-page.tsx:247-259`; `src/modules/admin-ui/super-admin-scoped-people-service.ts:93-110`
- Fix: Render legacy seven data columns and Actions with matching field mapping; retain accessible mobile fallback.

## G2-19-001-012  [P1] GAP  facet F04  effort M
- Legacy: Legacy mobile/contact email from `contactMobile`/`contactMail` `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:937-938`
- vNext now: vNext uses canonical `users.phoneE164`/`users.email` `src/modules/admin-ui/super-admin-scoped-people-service.ts:33-34`,104-107
- Fix: Specify which canonical vs student contact fields are intended; expose legacy student-contact values if required and authorized.

## G2-19-001-018  [P1] GAP  facet F05  effort M
- Legacy: Legacy column sorters for name and numeric-aware roll number `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:930-936`
- vNext now: vNext always orders by name then ID server-side; no per-column sort controls `src/modules/admin-ui/super-admin-scoped-people-service.ts:90-91`; `src/components/admin/admin-scoped-read-page.tsx:247-259`
- Fix: Add clickable Name and Roll No. sort with numeric-aware roll comparator and server paging.

## G2-19-001-045  [P1] GAP  facet F09  effort L
- Legacy: Legacy `Profile — <name>` modal width 860 renders 20 profile sections `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1763-1777`
- vNext now: vNext only `Open details →` membership route `src/components/admin/admin-scoped-read-page.tsx:255-257`; `src/modules/admin-ui/super-admin-scoped-people-service.ts:110`
- Fix: Restore deep learner profile sections or direct to a complete equivalent with identical sections.

## G2-19-001-059  [P1] GAP  facet F12  effort M
- Legacy: Legacy record.suspendedAt determines actions/status `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:949-956`,1028-1065
- vNext now: vNext `collegeMemberships.status` plus platformStatus separate `src/modules/admin-ui/super-admin-scoped-people-service.ts:29-33`,93-107
- Fix: Specify mapping of suspension at membership and platform levels; ensure login block matches legacy.

## G2-19-001-087  [P1] GAP  facet F22  effort L
- Legacy: Legacy `learner` single JPA table stores direct class/program/college, demographic/contact, suspension and import-batch fields `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:17-105`
- vNext now: vNext separates `users`, `college_memberships`, `learner_profiles`, and enrollment/section tables `src/db/schema/users.ts:12-30`; `src/db/schema/memberships.ts:17-48`; `src/db/schema/profiles.ts:15-31`; `src/modules/admin-ui/super-admin-scoped-people-service.ts:13-26`
- Fix: Create field-by-field mapping for class transfer, status, contact, JSON profile, bulk batch ID and historical audit IDs; inspect migrations before final parity sign-off.

## G2-6-002-015  [P1] GAP  facet F04  effort M
- Legacy: Old Faculty Type badge maps enum to human-friendly case `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:22-28` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:784-791`
- vNext now: New Type is plain detail, mentor membership overrides profile employmentType `src/modules/admin-ui/super-admin-scoped-people-service.ts:97-103`
- Fix: Separate faculty-type enum label from membership Mentor role and render badge

## G2-6-002-017  [P1] GAP  facet F04  effort M
- Legacy: Old Active/Suspended badge derives faculty.suspendedAt `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:794-801`
- vNext now: New status uses collegeMemberships.status; platform status appears separately `src/modules/admin-ui/super-admin-scoped-people-service.ts:27-32` `src/modules/admin-ui/super-admin-scoped-people-service.ts:93-108`
- Fix: Define status mapping and avoid confusing global and scoped suspension

## G2-6-002-086  [P1] GAP  facet F22  effort L
- Legacy: Old Faculty entity has first/last, collegeId, deptId, facultyType, gender, dob, JSON sections and contact fields `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:35-196`
- vNext now: New facultyProfiles stores membership, department, employment, academicTitle, JSON; users holds names/login `src/db/schema/profiles.ts:33-67` `src/modules/admin-ui/super-admin-scoped-people-service.ts:27-42`
- Fix: Create explicit migration/schema mapping for every legacy faculty field including JSON profile sections
