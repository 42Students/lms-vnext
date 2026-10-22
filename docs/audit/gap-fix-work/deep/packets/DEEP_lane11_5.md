# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-12-005-006  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_3.md)
- [ ] G2-12-008-012  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_3.md)
- [ ] G2-13-006-044  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_3.md)
- [ ] G2-13-011-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_3.md)
- [ ] G2-13-013-001  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_3.md)
- [ ] G2-13-013-007  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_3.md)
- [ ] G2-13-013-008  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_3.md)
- [ ] G2-13-013-012  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_3.md)
- [ ] G2-13-013-025  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_3.md)
- [ ] G2-13-013-029  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_3.md)

## Results

- G2-12-005-006: OK — vNext src/app/(authenticated)/learn/my-placements/placement/page.tsx:31,73-97 (inline "Placement rules" section #rules rendering the learner's rules summary from getOwnLearnerPlacementRulesView, with a link to the full rules page and a retry message on failure) matches docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:234-237.
- G2-12-008-012: OK — vNext src/modules/courses/learner-playback-settings.ts:11,33,42-70 (watchedThresholdPercent default 90, tenant override course.watchedThresholdPercent validated 1-100) enforced server-side in src/modules/courses/progress-service.ts:541 and passed to src/components/courses/learner-youtube-player.tsx matches docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:98-105.
- G2-13-006-044: OK — vNext src/app/(authenticated)/learn/my-placements/announcements/page.tsx:66-83 (unread comes from the learner's persisted announcement receipts, readAt === null; unknown receipts are shown as unknown, never as zero; recency is a separate filter at :95) matches docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:56-68 (isNew from unread).
- G2-13-011-045: FIXED — added the per-event LEGACY_NOTIFICATION_EVENT_CHANNELS matrix (every legacy NotificationEvent -> channels from NotificationEventRegistry plus the vNext producer that owns it) and corrected the coarse COURSE_EVENT lane to in-app only (legacy sent no learner email for course events) in src/modules/messaging/service.ts; SMS lane/template in src/modules/messaging/providers.ts:300-345; matches NotificationDispatcherServiceImpl.java:105-171.
- G2-13-013-001: OK — vNext src/app/api/courses/lessons/route.ts:19-79 (GET ?view=search with query/limit/courseId and GET ?view=stats replace /api/v2/lessons/search and /stats as scoped, validated routes; POST /refresh intentionally retired because search is a live database read, not an in-process cache) matches docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:18-22.
- G2-13-013-007: OK — vNext src/modules/courses/college-learning-directory-service.ts:607-616 (items map to id, lessonName, courseId, courseSlug, courseName, courseCode, offeringId, active) is the compatibility mapping of LessonSearchDTO.java:13-25; legacy Integer ids are replaced by UUIDs by design (no guessed numeric mapping).
- G2-13-013-008: OK — vNext src/modules/courses/college-learning-directory-service.ts:513-530 (documented scope: only ACTIVE lessons whose learning path is not archived, offering ACTIVE, course ACTIVE and not deleted, offering cohort/period ancestry inside the college; unlike the legacy cache the archived/deleted parents are excluded) plus the new GLOBAL read path below matches LessonSearchCache.java:46-55.
- G2-13-013-012: OK — vNext src/modules/courses/college-learning-directory-service.ts:498-511,574-605 (SQL candidate match before the cap, score 100 exact / 80 prefix / 60 word-prefix / 40 substring / 20 edit-distance-<=2 fuzzy only when fewer than 5 results and query >= 3 chars, sorted by score descending then name) matches docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:118-188.
- G2-13-013-025: OK — vNext src/app/api/courses/lessons/route.ts:27-65 (authenticated request context, query/limit/courseId validated, courseId required for non-Super-Admin, scoped indexed read through searchCollegeLessons with courses.read permission and a courseId filter, DTO mapping) matches LessonSearchController.java:48-79.
- G2-13-013-029: FIXED — restored legacy role split: an unscoped GLOBAL Super Admin may search all lessons and read global stats, everyone else stays limited to the authorized college and (unless a selected-college Super Admin) must pass courseId; searchCollegeLessons/scopedLessonSearchConditions accept a null college only for the global mode with per-lesson college ancestry preserved in src/modules/courses/college-learning-directory-service.ts, and src/app/api/courses/lessons/route.ts now serves getGlobalLessonSearchStats for the global scope. Matches LessonSearchController.java:53-68.
