# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [x] G2-16-003-056  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_6.md)
- [x] G2-16-008-017  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_6.md)
- [x] G2-16-008-028  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_6.md)
- [x] G2-16-008-036  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_6.md)
- [x] G2-16-008-040  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_6.md)
- [x] G2-16-008-044  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_6.md)
- [x] G2-16-008-065  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_6.md)
- [x] G2-16-008-071  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_6.md)
- [x] G2-16-028-001  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_6.md)
- [x] G2-16-028-052  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_6.md)

## Results

- G2-16-003-056: OK — vNext src/app/api/tracker/issues/[publicId]/screenshots/[attachmentId]/view/route.ts:16-50 authorizes the viewer (admin scope or own report), verifies the scanned object and redirects to a 120-second presigned GET (no public object keys; src/modules/bug-tracker/admin-service.ts:263-274 returns metadata only); matches legacy [issueId].js:203-224 previews.
- G2-16-008-017: OK — vNext src/modules/courses/legacy-lesson-item-sort-model.ts:24-36 compareLegacyLearnerLessonItems applies the legacy sequence/date tier then id tie-breaker, used at src/modules/courses/learner-course-service.ts:1166-1195; matches docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/syllabus.js:258-283.
- G2-16-008-028: OK — vNext src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:154-163 renders "Not assigned to a class" with contact-administrator guidance; matches syllabus.js:903-908.
- G2-16-008-036: OK — vNext src/components/courses/learner-roadmap-item-dialog.tsx:29-37 calls router.refresh() when an item dialog closes so progress/quiz/assignment metrics reload; matches syllabus.js:580-589.
- G2-16-008-040: OK — same mechanism (learner-roadmap-item-dialog.tsx:33-35 router.refresh on close) refreshes quiz lists from src/modules/courses/learner-course-service.ts; matches syllabus.js:698-714.
- G2-16-008-044: OK — vNext src/components/courses/learner-course-workspace.tsx:508-516,612,1141 shows "Not submitted" for a past-due unsubmitted assignment while keeping the instructions reviewable; matches syllabus.js:1057-1107.
- G2-16-008-065: OK — vNext src/components/courses/learner-roadmap-item-dialog.tsx:9-12,26-27,32-33 dismissedFocusKeys prevents a deep-linked dialog reopening after the learner closes it or after RSC refresh; matches syllabus.js:769-827 deepLinkKeyRef.
- G2-16-008-071: OK — vNext src/modules/courses/legacy-lesson-item-sort-model.ts:24-36 and learner-course-service.ts:1166-1195 (sequence plus createdAt candidates, id fallback) align mixed migrated content ordering with syllabus.js:258-283.
- G2-16-028-001: OK — vNext src/app/(authenticated)/superadmin/[...legacy]/page.tsx:112-118 maps /superadmin/projects/workspaces/<id>/resources|overview to /admin/projects/<uuid>/resources via resolveWorkspaceBookmark (selected-college scoped legacy id/slug lookup, lines 83-104) and preserves safe from/q query state (lines 181-192); matches resources.js:19-26.
- G2-16-028-052: OK — same nested mapping at src/app/(authenticated)/superadmin/[...legacy]/page.tsx:97-118 (nested-path handler runs before src/modules/admin-ui/legacy-superadmin-destination-model.ts:41-56 single-level mapper), so nested bookmarks are preserved securely; legacy generic redirect VDEST:22-35 only covers flat paths.
