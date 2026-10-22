# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [x] G2-13-013-031  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_3.md)
- [x] G2-13-013-057  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_3.md)
- [x] G2-14-008-022  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_3.md)
- [x] G2-14-008-036  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_3.md)
- [x] G2-14-008-037  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_3.md)
- [x] G2-17-028-040  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_3.md)
- [x] G2-17-029-014  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_3.md)
- [x] G2-17-23-055  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_3.md)
- [x] G2-18-018-035  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_3.md)
- [x] G2-18-018-039  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_3.md)

## Results

- G2-13-013-031: OK — vNext src/app/api/courses/lessons/route.ts:19-23 documents that refresh is retired and never shares lesson-create rights; POST create goes through createCourseLesson with its own authorization; legacy LessonSearchController.java:96-101.
- G2-13-013-057: OK — vNext src/app/api/courses/lessons/route.ts:19-22,34-70 provides scoped replacements GET ?view=search and ?view=stats (selected-college), refresh explicitly retired with live-DB rationale; legacy LessonSearchController.java:82-102.
- G2-14-008-022: OK — vNext src/modules/courses/learner-playback-settings.ts:6-12,34-37 default progressSaveIntervalMs 15000 with override validated 5000-600000, used by src/components/courses/learner-video-player.tsx:24,59 (saveIntervalMs=15000); matches docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:17-20,70-74.
- G2-14-008-036: FIXED — removeLessonVideo now archives the linked lesson content in the same transaction (unless another live video uses it) in src/modules/courses/lesson-video-service.ts so learners are not left with a published item for a deleted video; matches syllabusUtils.js:9-20 / video.js:168-179.
- G2-14-008-037: FIXED — updateLessonVideo now syncs the linked lesson content title (version+1) in the same transaction when the managed video title changes, in src/modules/courses/lesson-video-service.ts; matches VideoDrawer.jsx:197-216.
- G2-17-028-040: OK — vNext src/modules/projects/readiness-service.ts:25-33,89-93,141-165 normalizes DONE/COMPLETE/COMPLETED/COMPLET_* (not INCOMPLETE) as complete, counts proof only for non-blank trimmed submissionUrl and exposes proofCoverage (covered, completedTasks, unknown); matches legacy readiness.js:23-28.
- G2-17-029-014: FIXED — the four consumed overrides (course.watchedThresholdPercent, course.minInProgressPercent, ui.chatPollIntervalMs, ui.progressSaveIntervalMs) were mislabelled STORED_ONLY/READER_VERIFICATION_REQUIRED; now RUNTIME_CONSUMED with exact readers (readLearnerPlaybackSettings in progress-service.ts:248, learn/courses page.tsx:278-284, learner-course-workspace.tsx:1115) in src/modules/platform-settings/legacy-setting-specs.ts, service.ts and admin-editor-service.ts; genuinely unread keys keep Stored only labels; legacy TenantSettings.js:192-234.
- G2-17-23-055: OK — vNext src/modules/placements/offer-service.ts:858-860 deliberately requires requireLearnerPlacementAccess (module enabled + eligible participation, src/modules/placements/learner-participation-guard.ts:32-100) for self acceptance/decline and documents it is not bypassable; TPO withdrawal/recording stays a separate staff path; legacy LearnerOfferController.java:34-41.
- G2-18-018-035: OK — vNext src/modules/courses/lesson-service.ts:213 (create: sequence<=0 appends) and :359-361 (update: sequence 0 leaves order unchanged, collisions rejected by constraint at :54) preserve the zero sentinel; matches LessonServiceImpl.java:133-142,327-350.
- G2-18-018-039: OK — vNext src/modules/courses/lesson-content-service.ts:46-54,109-137 keeps class targeting (deliveryId validated against the lesson's offering/college), contentType, title and points in the separate content-authoring step, each content create being its own transaction so a failure leaves earlier items intact; matches LessonServiceImpl.java:147-169.
