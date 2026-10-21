# Work packet: edit src/modules/courses/faculty-contacts-service.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/teacher-contacts-index.md, docs/audit/gap2/lane-6/teacher-contacts-tab.md

## G2-6-005-020  [P1] GAP  facet F11  effort M
- Legacy: Old index does not perform role/tenant check, contacts target enforces access `docs/legacy-source/frontend/src/pages/teacher/contacts/index.js:11-19` `docs/legacy-source/frontend/src/pages/teacher/contacts/[contactsTab].js:15-23`
- vNext now: New index similarly has no auth check in route, target list service gates membership `src/app/(authenticated)/teacher/contacts/page.tsx:3-5` `src/modules/courses/faculty-contacts-service.ts:25-49`
- Fix: Document narrower Faculty-only requirement at destination and ensure non-Faculty staff route resolution

## G2-6-004-016  [P1] GAP  facet F04  effort L
- Legacy: Old contact mobile and email sourced ContactDTO fields `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/UserServiceImpl.java:81-90` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/UserServiceImpl.java:94-104`
- vNext now: New public directory query deliberately selects only displayName and departmentName `src/modules/courses/faculty-contacts-service.ts:72-79`
- Fix: Resolve privacy decision explicitly: authorized direct contact vs masked/removed contact fields

## G2-6-004-022  [P1] GAP  facet F05  effort L
- Legacy: Old page search matches name, email, mobile substring, fetching up to 5000 rows `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:78-116`
- vNext now: New SQL search matches displayName or department only `src/modules/courses/faculty-contacts-service.ts:57-65`
- Fix: If contact data is allowed, support email/mobile search with permission guard; otherwise record privacy-motivated difference

## G2-6-004-030  [P1] GAP  facet F07  effort M
- Legacy: Old backend guards staff-only with `The contacts directory is for staff only` on learner/recruiter `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:441-447`
- vNext now: New service denies non-FACULTY and missing courses.read as `FACULTY_TEACHING_SCOPE_REQUIRED` `src/modules/courses/faculty-contacts-service.ts:25-49`
- Fix: Define whether superadmin/mentor/staff access parity is needed and match access error wording

## G2-6-004-038  [P1] GAP  facet F10  effort M
- Legacy: Old UserServiceImpl merges faculty and learner contacts, no writes `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/UserServiceImpl.java:77-134`
- vNext now: New directory builds from collegeMemberships joined users/roles and returns active records `src/modules/courses/faculty-contacts-service.ts:72-115`
- Fix: Reconcile record count, role duplicates and inactive inclusion semantics with old source

## G2-6-004-039  [P1] GAP  facet F10  effort L
- Legacy: Old `getContacts` returns ContactDTO with public email, phone and avatar URL `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/UserServiceImpl.java:81-90`
- vNext now: New returns `{membershipId,displayName,departmentName,roles}` only `src/modules/courses/faculty-contacts-service.ts:111-115`
- Fix: Document/contact data availability decision and implement authorized masking/access

## G2-6-004-040  [P1] GAP  facet F11  effort M
- Legacy: Old controller denies learners/recruiters but allows same-college staff and SuperAdmin `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:441-448`
- vNext now: New `requirePersistedFaculty` requires active faculty membership and courses.read `src/modules/courses/faculty-contacts-service.ts:25-49`
- Fix: Support original audience or explicitly change navigation for other staff

## G2-6-004-068  [P1] GAP  facet F22  effort L
- Legacy: Old ContactDTO has first/last, email, mobile, profile image, userType `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/UserServiceImpl.java:81-104`
- vNext now: New joined users/member roles returns displayName, department, roles only `src/modules/courses/faculty-contacts-service.ts:72-115`
- Fix: Map each legacy DTO field, document intentionally private omissions and data access policy
