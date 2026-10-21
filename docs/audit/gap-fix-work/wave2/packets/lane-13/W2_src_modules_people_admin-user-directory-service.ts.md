# Work packet (wave 2): edit src/modules/people/admin-user-directory-service.ts

16 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/learner-search-controller.md, docs/audit/gap2/lane-8/people-directory-component.md, docs/audit/gap2/lane-8/superadmin-people.md

## G2-15-013-004  [P2] GAP  facet F01  effort M
- Legacy: exists/name check and admin cache refresh routes. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:349-374`)
- vNext now: New directory service lacks existence and cache-refresh operations. (`src/modules/people/admin-user-directory-service.ts:8-58`)
- Fix: Define equivalents or document removal of cache semantics and substitute indexed DB querying.

## G2-15-013-015  [P2] GAP  facet F04  effort M
- Legacy: Stats totalLearners/departments/colleges/programs/classes numeric. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:301-345`)
- vNext now: New service returns total matching memberships, not same aggregates. (`src/modules/people/admin-user-directory-service.ts:47-58`)
- Fix: Compute scoped distinct learner aggregates from DB, not result-page count.

## G2-15-013-019  [P2] MISSING  facet F05  effort M
- Legacy: Popular sorted by cache usage and defaults10. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:140-156`)
- vNext now: New admin list sorts display name asc, no popularity ranking. (`src/modules/people/admin-user-directory-service.ts:49-50`)
- Fix: Add optional ranked popular list and exact sort/limit.

## G2-15-013-040  [P2] MISSING  facet F10  effort M
- Legacy: GET /popular; usage ranked cache and scoped filter. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:140-157`)
- vNext now: New DB list with no popular/usage rank. (`src/modules/people/admin-user-directory-service.ts:8-58`)
- Fix: Create safe usage aggregate/ordering with opt-in privacy controls.

## G2-15-013-044  [P2] GAP  facet F10  effort M
- Legacy: GET /stats computes scoped counters. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:291-347`)
- vNext now: New directory returns page totals and role grants. (`src/modules/people/admin-user-directory-service.ts:47-58`)
- Fix: Provide distinct scoped counters.

## G2-15-013-052  [P2] GAP  facet F11  effort S
- Legacy: Stats restricted to superadmin or college admin; scoped. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:298-320`)
- vNext now: New superadmin lists users with selected scope and permission. (`src/modules/people/admin-user-directory-service.ts:8-17`)
- Fix: Preserve admin-only stats access, not faculty or learner.

## G2-15-013-055  [P2] MISSING  facet F12  effort M
- Legacy: Popular ranks by previously selected counts. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:150-155`)
- vNext now: New alphabetical query and pagination. (`src/modules/people/admin-user-directory-service.ts:49-50`)
- Fix: Recreate optional popularity-based ordering if old feature reachable.

## G2-8-003-011  [P2] GAP  facet F04  effort M
- Legacy: `.../dto/response/ContactDTO.java:7-13`: split names, userType, email, contactMobile, contactPhone, profileImageUrl
- vNext now: `src/modules/people/college-contacts-service.ts:12-15,92-105` and `admin-user-directory-service.ts:31-42`: displayName/phone/roles/status, no profileImageUrl
- Fix: Map image and split names if available; avoid inventing legacy secondary phone from canonical phone

## G2-8-003-027  [P2] GAP  facet F10  effort M
- Legacy: `.../hooks/useContacts.js:17-45`: GET `/users/contacts`, AbortController, success maps contactDTOList+size, 0-based paging
- vNext now: `src/modules/people/college-contacts-service.ts:16-105` and `admin-user-directory-service.ts:8-59`: server DB reads, 1-based paging
- Fix: Write explicit API-to-query adapter expectations, preserve filters/total and cancellation semantics

## G2-8-002-010  [P2] GAP  facet F04  effort M
- Legacy: `.../dto/response/ContactDTO.java:7-13`: split name, user type, email/mobile/phone/avatar
- vNext now: `src/modules/people/admin-user-directory-service.ts:31-46,55-58`: displayName, canonical contact, membership status, college, updatedAt; no avatar or split name
- Fix: Introduce safe avatar optional field and legacy visible fields in read model without removing scoped privacy controls

## G2-8-002-013  [P2] GAP  facet F05  effort M
- Legacy: `.../components/contacts/ContactsGrid.js:105-116`: live client search name/email/mobile, case-insensitive
- vNext now: `src/modules/people/admin-user-directory-service.ts:26-29`: persisted search only display name or college name
- Fix: Decide exact search scope: safely add scoped email/phone search or disclose changed semantics

## G2-8-002-026  [P2] GAP  facet F10  effort M
- Legacy: `.../hooks/useContacts.js:17-27`: GET `/users/contacts?collegeId,userType,pageNumber,pageSize`
- vNext now: `src/modules/people/admin-user-directory-service.ts:8-58`: direct Drizzle select from memberships/users/colleges, no API call from SSR page
- Fix: Document endpoint adapter; match read-only output pagination and failures; do not require legacy URL compatibility without clients

## G2-8-002-031  [P2] GAP  facet F12  effort S
- Legacy: `.../service/impl/UserServiceImpl.java:77-130`: faculty then learner concat, duplicate dual-role is possible
- vNext now: `src/modules/people/admin-user-directory-service.ts:43-58`: one membership row with membershipRoles aggregate
- Fix: Document role de-duplication and ensure tabs include dual-role memberships in both categories

## G2-8-002-048  [P2] GAP  facet F22  effort M
- Legacy: `.../dto/response/ContactDTO.java:7-13`: first/last, role, contactMobile and profileImageUrl DTO
- vNext now: `src/modules/people/admin-user-directory-service.ts:31-58`: no profileImageUrl, one displayName and membership roles array
- Fix: Enrich safe contact view model with optional image and name fallback; do not expose cross-college PII

## G2-15-013-014  [P3] GAP  facet F04  effort S
- Legacy: College option output id/name/city/state. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:192-201`)
- vNext now: Admin query produces college ID/name, no city/state. (`src/modules/people/admin-user-directory-service.ts:31-45`)
- Fix: Expand optional college selector DTO if legacy dependent picker exists.

## G2-15-013-067  [P3] MISSING  facet F18  effort S
- Legacy: Popular learners retrieved. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:156-157`)
- vNext now: No popular status message. (`src/modules/people/admin-user-directory-service.ts:55-58`)
- Fix: Preserve label if popular endpoint implemented.
