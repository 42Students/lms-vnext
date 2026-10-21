# Work packet (wave 2): edit src/modules/colleges/service.ts

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-recycle-bin-controller.md, docs/audit/gap2/lane-3/college-controller.md, docs/audit/gap2/lane-4/college-search-controller.md

## G2-2-023-013  [P2] GAP  facet F04  effort M
- Legacy: AdminRecycleBinController.java:284-285 response status OK, message type restored and no descendants
- vNext now: src/modules/colleges/service.ts:578-623 archive service returns archived row; restore service separate
- Fix: Return explicit result indicating non-cascade restore.

## G2-2-023-031  [P2] GAP  facet F10  effort M
- Legacy: AdminRecycleBinController.java:279-283 dynamic `${TYPE}_RESTORE` audit
- vNext now: src/modules/colleges/service.ts:617-622 COLLEGE archived event; restorations have own event
- Fix: Log type-specific restore actor/row/name/college.

## G2-2-023-057  [P2] GAP  facet F21  effort M
- Legacy: AdminRecycleBinController.java:61-74 nine repositories, scoped resolver and audit
- vNext now: src/modules/organizations/service.ts, colleges/service.ts, announcements/service.ts separate implementations
- Fix: Centralize registry dispatch; delegate to domain-specific restore services rather than generic bool update.

## G2-3-028-020  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CollegeController.java:103-134`
- vNext now: `src/modules/colleges/service.ts:137-299`
- Fix: Legacy selector DTO has numeric id/orgId, logo/uniqueId; vNext UUID, code, logoObjectPath projection; add adapter.

## G2-3-028-026  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CollegeServiceImpl.java:87-126`
- vNext now: `src/modules/colleges/service.ts:137-299`
- Fix: Legacy list maps repository order for nondeleted records, vNext alphabetically sorts ACTIVE-only rows.

## G2-3-028-047  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CollegeController.java:194-239`
- vNext now: `src/modules/colleges/service.ts:578-625`
- Fix: Legacy isDeleted with five major dependency categories vs ARCHIVED and broader usage guards.

## G2-3-028-048  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CollegeServiceImpl.java:238-253`
- vNext now: `src/modules/colleges/service.ts:493-575`
- Fix: Legacy writes chair/vice-chair, org and logo at creation; vNext fields and storage representation differ.

## G2-3-028-051  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CollegeController.java:120-135`
- vNext now: `src/modules/colleges/service.ts:254-295`
- Fix: Legacy non-superadmin sees same-organization colleges; vNext non-superadmin sees only membership college.

## G2-3-028-053  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CollegeController.java:197-217`
- vNext now: `src/modules/colleges/service.ts:591-601`
- Fix: Legacy college admin may delete if authorized; vNext archive restricts isSuperAdmin.

## G2-3-028-055  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CollegeController.java:83-135`
- vNext now: `src/modules/colleges/service.ts:137-299`
- Fix: Legacy global SA gets entire college selector list when no scope; vNext ACTIVE-only and selected-scope list.

## G2-3-028-056  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CollegeServiceImpl.java:192-235`
- vNext now: `src/modules/colleges/service.ts:299-491`
- Fix: Different delete/archive dependency set; document precise cleanup and archive blockers.

## G2-3-028-077  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CollegeServiceImpl.java:135-153`
- vNext now: `src/modules/colleges/service.ts:540-575`
- Fix: Legacy org move corrects denormalized placement organization references; vNext intentionally prevents org rescope.

## G2-4-014-019  [P2] MISSING  facet F05  effort M
- Legacy: /popular default limit10 and query org-scoped. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:166-180`)
- vNext now: New no popular list; sorted by name in service. (`src/modules/colleges/service.ts:220-249`)
- Fix: Add authorized popular ranking with default10.

## G2-4-014-037  [P2] MISSING  facet F10  effort M
- Legacy: GET /popular reads ranked cache and filters org. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:166-185`)
- vNext now: No read/popularity metrics in new listColleges. (`src/modules/colleges/service.ts:137-249`)
- Fix: Provide top10 popularity API and store usage.

## G2-4-014-044  [P2] GAP  facet F11  effort S
- Legacy: Scoped Super Admin ignores requested orgId in search. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:86-91`)
- vNext now: New rejects conflicting organizationId request through AuthorizationError. (`src/modules/colleges/service.ts:152-167`)
- Fix: Preserve fail-closed behavior; document ignored vs rejected difference.

## G2-4-014-053  [P2] GAP  facet F13  effort M
- Legacy: Empty query falls back to popular ranking; empty org returns no results. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:118-122`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:65-70`)
- vNext now: New blank q returns alphabetic active college list. (`src/app/(authenticated)/admin/colleges/page.tsx:111-119`; `src/modules/colleges/service.ts:220-249`)
- Fix: Show popular results for empty query on search dropdown.

## G2-4-014-058  [P2] GAP  facet F14  effort M
- Legacy: DTO includes logo string, address and zip for autocomplete display. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchDTO.java:19-32`)
- vNext now: New GET returns logoObjectPath/postalCode, client may require signed image URL. (`src/modules/colleges/service.ts:175-191`)
- Fix: Map logo read URL and legacy field names in search results.

## G2-4-014-068  [P2] GAP  facet F19  effort M
- Legacy: Cache initialized at startup via @PostConstruct and DB findAll, indexes built. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchCache.java:30-41`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchCache.java:102-115`)
- vNext now: New listColleges reads DB in a permission-scoped transaction every GET. (`src/modules/colleges/service.ts:137-151`)
- Fix: Assess 20-college to 10k-college latency; decide indexed SQL vs cache.

## G2-4-014-073  [P2] GAP  facet F20  effort M
- Legacy: Cache usage increment and request search may race; ConcurrentHashMap handles counts, load synchronized. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:47-48`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:53-72`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:255-262`)
- vNext now: New no popularity counter, DB transaction for scope. (`src/modules/colleges/service.ts:137-151`)
- Fix: Add atomic usage increments if feature restored.

## G2-4-014-074  [P2] GAP  facet F20  effort M
- Legacy: New GET list uses selected Super Admin college scope and returns one row when selected. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:140-155`)
- vNext now: Scoped new service restricts collegeId if chosen. (`src/modules/colleges/service.ts:169-207`)
- Fix: Expose scoped autocomplete across authorized organization when UI selected college; avoid unintentional narrowing.
