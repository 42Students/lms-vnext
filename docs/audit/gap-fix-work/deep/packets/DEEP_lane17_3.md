# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-8-027-049  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_19.md)
- [ ] G2-9-007-021  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_19.md)
- [ ] G2-9-009-014  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_19.md)
- [ ] G2-9-014-036  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_20.md)
- [ ] G2-9-016-072  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_20.md)
- [ ] G2-9-025-066  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_20.md)
- [ ] G2-15-008-016  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_6.md)
- [ ] G2-15-008-025  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_6.md)
- [ ] G2-15-008-064  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_6.md)
- [ ] G2-15-008-068  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_6.md)

## Results

- G2-8-027-049: FIXED — src/modules/placements/college-interview-action-service.ts: scheduling/editing a college interview now locks all of the student's applications (select ... for update) and rejects any overlapping SCHEDULED interview for the same student across every drive ("This student already has an interview at the chosen time."), in addition to the existing interviewer/venue guard. Matches InterviewServiceImpl.java:170-189,233-242 (learner row lock + cross-job overlap).
- G2-9-007-021: OK — vNext src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx:30-36,118-150,255-267 provides search (name/roll/department), state filter ACTIVE/WAITLISTED/REMOVED/ALL, Refresh/Reset, CSV export of the page and 50-row pagination (ROSTER_PAGE_SIZE=50); matches OfferingRosterDrawer.jsx:133-141.
- G2-9-009-014: FIXED — src/proxy.ts now sends a real HTTP 302 from the legacy /college-admin and /college-admin/dashboard aliases to the vNext College Admin dashboard /college (query dropped, no-store), mirroring docs/legacy-source/frontend/src/pages/college-admin/index.js:1-5 (302 + Location).
- G2-9-014-036: OK — vNext src/components/placements/college-application-pipeline-controls.tsx:113-114,301 shows "Cannot move from X to Y" as a role=alert warning on the action row when a target is outside allowedNextStages; matches JobApplications.js:1379-1420.
- G2-9-016-072: OK — vNext src/components/placements/college-retention-inline-preview.tsx:15-72 fetches /api/college/placements/retention only after the disclosure is expanded, with loading, error+Retry, truncation notice and a link to the full report; matches DrivesLanding.js:608-639.
- G2-9-025-066: OK — vNext src/components/courses/faculty-lesson-authoring.tsx:926-933,1334-1352 states that attachments need a CLEAN server-verified receipt and mounts LessonResourceMaterialsControl, whose LessonResourceFileUploader (src/components/courses/lesson-resource-file-uploader.tsx, src/modules/courses/lesson-resource-file-upload-service.ts:89-198) uses per-file signed grants, size/type verification and scan status before READY; replaces the R2 signed-upload dependency of AdminResources.js:14-16,210-244.
- G2-15-008-016: OK — vNext src/modules/courses/learner-course-service.ts:1168-1195 merges contents, assignments and quizzes of a lesson into one list sorted by compareLegacyLearnerLessonItems (authored per-class order, quizzes bound to the lesson and delivery/class), rendered by src/components/courses/learner-course-workspace.tsx:937-1160; matches syllabusDetail.js:451-466.
- G2-15-008-025: OK — vNext src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/error.tsx shows "Lesson content could not be loaded" with a safe explanation and a Retry button on the roadmap route boundary; item-level failures show Retry via LearnerCourseStateRetry (learner-course-workspace.tsx:1119-1120). Matches syllabusDetail.js:360-367,473-478.
- G2-15-008-064: OK — vNext src/modules/courses/learner-course-service.ts:1168-1195 (legacy item comparator over typed UUID contents/assignments/quizzes) and per-content progress maps keyed by content id in src/components/courses/learner-course-workspace.tsx:640-740,1040-1160 replace the numeric lessonId/courseId/classId + progress map of syllabusDetail.js:54-76,143-149,451-470,494-515; unknown content types fall to an explicit unsupported card (:469).
- G2-15-008-068: OK — vNext src/components/courses/learner-course-workspace.tsx:815-817,845,867,1044,1119-1120,1151 keeps content visible with "Lesson completion state could not be fully verified" warnings, retry (LearnerCourseStateRetry) and an unsupported-content card (:469), plus the route boundary error.tsx; matches syllabusDetail.js:338-367,473-478.
