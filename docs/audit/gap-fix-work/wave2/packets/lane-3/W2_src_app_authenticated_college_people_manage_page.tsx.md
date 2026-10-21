# Work packet (wave 2): edit src/app/(authenticated)/college/people/manage/page.tsx

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/learner-search-controller.md, docs/audit/gap2/lane-19/faculty-search-controller.md

## G2-15-013-001  [P2] GAP  facet F01  effort M
- Legacy: GET/POST search API rooted at /api/v2/learners. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:34-38`)
- vNext now: New college directory is /college/people/manage, under role-limited UI. (`src/app/(authenticated)/college/people/manage/page.tsx:52-55`)
- Fix: Map legacy learner search entrypoints to new directory/autocomplete APIs.

## G2-15-013-003  [P2] MISSING  facet F01  effort S
- Legacy: popular learners endpoint. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:140-158`)
- vNext now: New college people management page has no popular learners section. (`src/app/(authenticated)/college/people/manage/page.tsx:77-89`)
- Fix: Add popular/most used picker only where old UI linked this endpoint.

## G2-15-013-006  [P2] GAP  facet F02  effort S
- Legacy: Colleges and scoped options returned by separate endpoint. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:159-203`)
- vNext now: New page has filters and people actions but separate college dropdown not present. (`src/app/(authenticated)/college/people/manage/page.tsx:81-117`)
- Fix: Place tenant/college selector where superadmin scope is explicit, not college admin.

## G2-15-013-007  [P2] GAP  facet F02  effort M
- Legacy: Stats returns five counters. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:291-347`)
- vNext now: New filtered people section has matching-membership count but not 5 search cache stats. (`src/app/(authenticated)/college/people/manage/page.tsx:118-132`)
- Fix: If legacy stats widget consumed, add totalLearners/departments/colleges/programs/classes.

## G2-15-013-012  [P2] GAP  facet F04  effort S
- Legacy: Display name prefers first+last, first, roll, unique ID. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchDTO.java:40-53`)
- vNext now: New person displays displayName or Unnamed person. (`src/app/(authenticated)/college/people/manage/page.tsx:27-33`)
- Fix: Use legacy fallback ordering when transforming student rows.

## G2-15-013-027  [P2] GAP  facet F06  effort S
- Legacy: recordSelection POST learnerId integer, no body. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:277-288`)
- vNext now: New PersonMembershipActions identified by membership UUID. (`src/app/(authenticated)/college/people/manage/page.tsx:43-50`)
- Fix: Use membership ID in new selection event API, validate persisted learner ownership.

## G2-15-013-059  [P2] GAP  facet F13  effort S
- Legacy: Unauthenticated 401 returns error envelope. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:123-124`)
- vNext now: UI redirects dashboard; API should have 401. (`src/app/(authenticated)/college/people/manage/page.tsx:52-55`)
- Fix: Ensure API-level 401/session expiry and page-appropriate redirect.

## G2-15-013-061  [P2] GAP  facet F13  effort S
- Legacy: Query empty displays first15 (not all). (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:129-135`)
- vNext now: New first page populated 25 for college directory. (`src/app/(authenticated)/college/people/manage/page.tsx:68-73`)
- Fix: In autocomplete, default to 15 suggestions; not full people list.

## G2-19-013-003  [P2] GAP  facet F01  effort M
- Legacy: Legacy frontend FacultySearchService imports all 11 API methods `docs/legacy-source/frontend/src/api/Services/FacultySearchService.js:3-111`
- vNext now: vNext college people page uses server-side listCollegePeopleWithRuntime `src/app/(authenticated)/college/people/manage/page.tsx:52-73`
- Fix: Replace API service callers with typed server directory operations.

## G2-15-013-008  [P3] MISSING  facet F03  effort M
- Legacy: POST recordSelection returns Selection recorded. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:277-289`)
- vNext now: New row has PersonMembershipActions, not pick popularity/selection record. (`src/app/(authenticated)/college/people/manage/page.tsx:27-50`)
- Fix: Restore selected-learner usage event for search picker where applicable.

## G2-15-013-038  [P3] GAP  facet F09  effort S
- Legacy: Admin POST refresh immediate, no confirmation modal. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:360-374`)
- vNext now: New people management no cache refresh button or dialog. (`src/app/(authenticated)/college/people/manage/page.tsx:81-117`)
- Fix: If refresh added, keep immediate safe admin action with feedback.

## G2-15-013-066  [P3] GAP  facet F18  effort S
- Legacy: Legacy success wording Learners retrieved. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:137-137`)
- vNext now: New text matching memberships/No memberships. (`src/app/(authenticated)/college/people/manage/page.tsx:118-125`)
- Fix: Use legacy search wording in dedicated learner selector; keep people directory text distinct.

## G2-15-013-069  [P3] GAP  facet F18  effort S
- Legacy: Stats retrieved. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:344-345`)
- vNext now: New matching membership totals, not stats phrase. (`src/app/(authenticated)/college/people/manage/page.tsx:118-132`)
- Fix: Retain separate stats endpoint response wording.
