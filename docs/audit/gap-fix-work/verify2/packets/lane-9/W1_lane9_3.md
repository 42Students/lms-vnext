# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-17-029-014 [P1] GAP facet F04
- Files: src/modules/platform-settings/legacy-setting-specs.ts, src/modules/platform-settings/service.ts
- Legacy: legacy TenantSettings.js:192-234 progress %, chat poll 3000-600000, save 5000-600000
- Expected fix: Identify exact runtime consumers for stored overrides; mark no-effect keys clearly, do not advertise active toggle

## G2-17-029-016 [P1] GAP facet F04
- Files: src/modules/platform-settings/service.ts
- Legacy: legacy TenantSettings.js:260-269 schedule.pastBookingGraceMinutes 0..1440
- Expected fix: Document whether override is effective; expose consumer status and do not mislead operators

## G2-19-019-014 [P1] GAP facet F05
- Files: src/modules/courses/faculty-course-service.ts
- Legacy: FacultyTeachingAssignmentRepository.java:43-81 active by faculty,class,semester,batch,course
- Expected fix: Expose class+semester and batch+semester filters when needed; require active membership and active delivery joins

## G2-12-005-006 [P1] MISSING facet F02
- Files: src/app/(authenticated)/learn/my-placements/placement/page.tsx
- Legacy: Placement rules rendered inline with PlacementRules component `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:234-237`
- Expected fix: Embed rules summary/content or explicitly approve standalone navigation

## G2-12-008-012 [P1] GAP facet F04
- Files: src/components/courses/learner-youtube-player.tsx
- Legacy: Percent watched threshold clientSettings watchedThresholdPercent default90 `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:98-105`
- Expected fix: Verify server threshold 90% and tenant override parity

## G2-17-23-055 [P1] GAP facet F11 Module gate
- Files: (none, new feature)
- Legacy: LC:34–41 checks role, TS:172–180 delegates; no placement-module paid/participation check shown in this direct path
- Expected fix: Product decision: when module/eligibility revoked after offer release, provide secure access to legally required pending response instead of silent lockout (or document intentional block)

## G2-17-028-040 [P1] GAP facet F20 Task status edge
- Files: (none, new feature)
- Legacy: LR:25 treats statuses containing COMPLET or exactly DONE as complete, and evidence only truthy submissionUrl
- Expected fix: Clarify status normalization for migrated tasks; count submissions that are valid URLs, not whitespace or stale data; test zero tasks

## G2-18-026-001 [P1] GAP facet F01 Routes
- Files: (none, new feature)
- Legacy: NPC:26,60,86,118,126,134,146,186,213,227 exposes 9 distinct REST operations under `/api/v1/new-program`
- Expected fix: Inventory legacy consumers and map fetchAll/fetchByDept/fetchByCollege/fetch/{id}/details/paged explicitly; update callers or add scoped compatibility routes; never preserve insecure unscoped access

## G2-19-029-016 [P1] GAP facet F04 Status vocabulary
- Files: (none, new feature)
- Legacy: LG:158-165 `READY`, `READY_WITH_WARNINGS`, `BLOCKED` derived readyForDomainLogin and warnings
- Expected fix: Define explicit mapping between domain-login verdict and broad tenant-data verdict; do not equate legacy warnings with UNKNOWN data

## G2-13-006-044 [P1] GAP facet F12
- Files: src/app/(authenticated)/learn/my-placements/announcements/page.tsx
- Legacy: Legacy new flag based on unread state (`docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:56-68`)
- Expected fix: Use durable unread state, recency optional as separate metadata.

## G2-13-013-001 [P1] MISSING facet F01
- Files: src/app/api/courses/lessons/route.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:18-22` provides GET /api/v2/lessons/search and /stats; POST /refresh
- Expected fix: Restore lesson-search API as scoped typed route(s) or document a replacement endpoint and update all callers

## G2-13-013-007 [P1] GAP facet F04
- Files: src/modules/courses/college-learning-directory-service.ts, src/modules/courses/college-learning-directory-model.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchDTO.java:13-25` DTO fields id Integer, lessonName,courseId,courseSlug,courseName,active
- Expected fix: Define compatibility mapping for legacy DTO including courseSlug and active when consumers depend on it

## G2-13-013-008 [P1] GAP facet F04
- Files: src/modules/courses/college-learning-directory-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchCache.java:46-55` loads all active lessons and joins course name,slug from CourseRepository.findAll
- Expected fix: Document deleted/archived/offering path inclusion differences; add dedicated global search read where necessary

## G2-13-013-012 [P1] GAP facet F05
- Files: src/modules/courses/college-learning-directory-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:118-188` exact match then prefix then fuzzy (edit distance ≤2 if few results), score descending
- Expected fix: Implement exact/prefix/fuzzy ranking and relevance sort for autocomplete search surface

## G2-13-013-025 [P1] GAP facet F10
- Files: src/app/api/courses/lessons/route.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:48-79` GET /search calls requirePrincipal, requireAccessCourse, cache.search, filters courseId
- Expected fix: Build search endpoint with independent indexed read, course/tenant scope check and DTO mapping

## G2-13-013-029 [P1] GAP facet F11
- Files: src/modules/courses/college-learning-directory-service.ts, src/modules/courses/lesson-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:53-68` GLOBAL only unrestricted; all other actors must pass courseId with requireAccessCourse
- Expected fix: Restore role-specific global-superadmin search and narrow course-scoped access, including learners/faculty if legacy allowed

## G2-13-013-031 [P1] GAP facet F11
- Files: src/app/api/courses/lessons/route.ts, src/modules/courses/lesson-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:96-101` POST refresh requireSuperAdmin, NOT necessarily global
- Expected fix: Never treat refresh and lesson-create as same privileged operation; preserve separate authorization

## G2-13-013-057 [P1] MISSING facet F23
- Files: src/app/api/courses/lessons/route.ts, src/app/(authenticated)/admin/lessons/page.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:82-102` search stats and manual refresh exposed, vNext no equivalent public endpoints
- Expected fix: Either implement scoped search/stats compatibility endpoints or explicitly retire with traced callers

## G2-13-011-045 [P1] GAP facet F21
- Files: src/modules/messaging/service.ts, src/modules/messaging/providers.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:105-171` dispatcher also sends app and TRAI SMS alongside email
- Expected fix: Create event-to-channel matrix and prove every legacy notification fan-out path is mapped

## G2-18-018-035 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: No negative sequence; legacy `sequence=0` on update means leave unchanged, on create append (`LessonServiceImpl.java:133-142,327-350`).
- Expected fix: Preserve zero sentinel legacy behavior or explicitly migrate UI semantics and errors.

## G2-18-018-039 [P1] GAP facet F14
- Files: src/modules/courses/lesson-content-service.ts
- Legacy: Lesson create nested `contentsDTOs` includes contentType/title/points/classId and data (`LessonServiceImpl.java:147-169`).
- Expected fix: Preserve class targeting and input fields in separate authoring step; provide rollback/partial failure guidance.

## G2-19-022-007 [P1] GAP facet F04
- Files: src/app/(authenticated)/tpo/home/page.tsx
- Legacy: Home payload includes `needsYou`, `team`, season-specific totals and report records (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoHubController.java:47-66,82-94; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoInsightsService.java:278-418).
- Expected fix: Build field-to-field response parity sheet for `needsYou`, `numbers`, `thisWeek`, `companyFunnel`, `team` and distinct `seasonId`.

## G2-14-008-022 [P1] GAP facet F06
- Files: src/components/courses/learner-video-player.tsx, src/modules/courses/learner-playback-settings.ts
- Legacy: Legacy progress interval platform override default15000ms; vNext default5000ms and global override supports 5000–600000 — `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:17-20,70-74`
- Expected fix: Align default 15000ms if no override and exact override validation

## G2-14-008-036 [P1] GAP facet F10
- Files: src/components/courses/faculty-lesson-video-manager.tsx
- Legacy: Legacy teacher delete uses DELETE /api/v1/lesson/contents/delete/:id then 1s refetch; vNext deletes managed video via /api/courses/videos/:id — `docs/legacy-source/frontend/src/utils/courseUtils/syllabusUtils.js:9-20`; `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:168-179`
- Expected fix: Ensure deleting managed video retires related lesson content and learner playback in same transaction

## G2-14-008-037 [P1] GAP facet F10
- Files: src/components/courses/faculty-lesson-video-manager.tsx
- Legacy: Legacy update VideoDrawer calls updateLessonContent(id,NewData) preserving file; vNext manager PATCH video title does not necessarily change lesson content metadata — `docs/legacy-source/frontend/src/components/Course/Syllabus/VideoDrawer.jsx:197-216`
- Expected fix: Synchronize managed video and published lesson content title/points/version

## Chat-18 fast verification triage (2026-10-22)

- G2-17-029-014: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-17-029-016: OK — Stored-only scheduling override is explicitly labeled with 0..1440 bounds and non-effective cutoff.
- G2-19-019-014: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-12-005-006: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-12-008-012: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-17-23-055: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-17-028-040: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-18-026-001: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-19-029-016: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-13-006-044: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-13-013-001: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-13-013-007: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-13-013-008: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-13-013-012: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-13-013-025: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-13-013-029: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-13-013-031: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-13-013-057: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-13-011-045: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-18-018-035: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-18-018-039: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-19-022-007: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-14-008-022: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-14-008-036: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-14-008-037: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
