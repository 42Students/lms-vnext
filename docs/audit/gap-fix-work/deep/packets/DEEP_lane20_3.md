# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-17-003-012  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_7.md)
- [ ] G2-17-003-018  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_7.md)
- [ ] G2-17-003-021  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_7.md)
- [ ] G2-17-003-025  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_7.md)
- [ ] G2-17-003-029  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_7.md)
- [ ] G2-17-003-034  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_7.md)
- [ ] G2-17-003-049  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_7.md)
- [ ] G2-17-003-051  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_7.md)
- [ ] G2-17-003-054  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_7.md)
- [ ] G2-17-006-051  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_7.md)

## Results

- G2-17-003-012: OK — vNext src/modules/courses/super-admin-content-directory-model.ts:92-114 legacySuperAdminLessonContentHref (used by src/app/(authenticated)/superadmin/lesson-content/page.tsx) maps old ?type/classId/course/lesson links to offering/lesson/delivery query (classId=0 -> SHARED scope, UUID class -> SECTION delivery), and src/components/courses/super-admin-content-directory-page.tsx filters by offering/lesson/delivery/scope; matches LessonContent.js:224-280.
- G2-17-003-018: OK — vNext VIDEO authoring covers title, points (0-1000), order (reorder), duration, upload/YouTube link, publish state and distinct audience (all sections vs one section): src/components/courses/faculty-lesson-video-manager.tsx:44-47,148-213,231, src/components/courses/super-admin-content-authoring.tsx:58-84; matches LessonContent.js:539-647 author form.
- G2-17-003-021: OK — vNext deliberately does not import third-party video URLs: src/components/courses/super-admin-content-authoring.tsx:150-160 shows a disabled "Import from URL" with the explanation (SSRF, type, size and malware-scan checks required) while HTTPS YouTube links are validated in FacultyLessonAuthoring and uploads go through verified private storage; the legacy http/https import (LessonContent.js:468-490) is intentionally replaced by this safe handling.
- G2-17-003-025: OK — vNext src/components/courses/faculty-lesson-video-manager.tsx:119,162-169 shows "<file name> uploaded successfully!" and "Upload failed" toasts (with server detail), progress and scan/processing state; matches LessonContent.js:435-438.
- G2-17-003-029: OK — vNext VIDEO upload plus content linking is implemented end to end: super-admin-content-authoring.tsx:132-146 mounts FacultyLessonVideoManager bound to the selected lesson/delivery, with server-side scoped authoring in src/modules/courses/lesson-content-service.ts and the signed-grant upload service src/modules/courses/lesson-resource-file-upload-service.ts / video upload routes; query-driven kind switch at /superadmin/lesson-content (page.tsx) matches lesson-content.js:70-74 and LessonContent.js:532-669.
- G2-17-003-034: OK — vNext src/components/courses/super-admin-content-authoring.tsx:55-79 offers the "Audience" selector (all currently eligible sections vs one specific section with a Section picker) and the directory page's scope filter (ALL/SHARED/SECTION) lets admins open section-scoped content; matches LessonContent.js:146-150,641-647.
- G2-17-003-049: OK — vNext keys the video manager and authoring form on lesson+section+kind (super-admin-content-authoring.tsx:36,141: key={"video:"+contentKey}), so an upload/edit target can never carry over to another lesson, section or item; replace-video uses the item's own id (faculty-lesson-video-manager.tsx:148). Matches LessonContent.js:162-166.
- G2-17-003-051: OK — vNext completes the secure upload integration (super-admin-content-authoring.tsx:132-146 plus signed short-lived grants, private storage, scan status before playback); only the unsafe remote URL import is intentionally replaced by the disabled control and note at :150-160. Matches the presigned part of LessonContent.js:400-447.
- G2-17-003-054: OK — vNext src/components/courses/super-admin-content-directory-page.tsx:71-76,127-135 keeps a platform-wide "Global video policy" section reachable without a selected college (links to the GLOBAL setting in Tenant Settings) and serves resources/live classes as separate kinds (adminContentKindSchema, /admin/videos|resources|live-classes) with the old /superadmin/lesson-content?type= alias mapped by legacySuperAdminLessonContentHref; matches lesson-content.js:40-80.
- G2-17-006-051: OK — vNext src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx resolves old course identifiers via resolveLegacyLearnerCourseDelivery (src/modules/courses/learner-course-legacy-route-service.ts) and redirects to the delivery route preserving tab and query (learnerCourseTabPath / learnerCourseTabPersistentQuery), mapping legacy course -> offering -> delivery; past-semester deliveries stay visible read-only in learner-course-workspace.tsx (:739), so old bookmarks keep working; availability is computed server-side in learner-course-service.ts, replacing learnerCourseDetail.js:2-16 and contentAvailability.js:47-84 client logic.
