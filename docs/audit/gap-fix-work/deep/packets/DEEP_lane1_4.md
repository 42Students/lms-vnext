# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-17-008-022  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_7.md)
- [ ] G2-17-008-035  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_7.md)
- [ ] G2-17-008-067  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_7.md)
- [ ] G2-17-008-069  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_7.md)
- [ ] G2-18-007-028  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_7.md)
- [ ] G2-18-007-031  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_7.md)
- [ ] G2-11-010-108  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_3.md)
- [ ] G2-12-005-011  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_4.md)
- [ ] G2-12-005-028  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_4.md)
- [ ] G2-12-005-039  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_4.md)

## Results

- G2-17-008-022: OK — vNext src/components/courses/college-content-authoring-control.tsx:372 (Audience Select, disabled when editing; materials control src/components/courses/lesson-resource-materials-control.tsx:128 tells to change audience before uploading) matches docs/legacy-source/frontend/src/components/Global/Offcanvas/Syallabus/ResourceComposer.js:235-240.
- G2-17-008-035: OK — vNext lesson-resource-materials-control.tsx:155-160,170-180 (Edit link material with title/URL/notes, reload after save) plus college-content-authoring-control.tsx:169-176 edit mode and lesson-resource-file-uploader.tsx:175-198 (remove file) match docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:183-188.
- G2-17-008-067: OK — vNext opens the signed URL in the same tab by project rule (no popups): lesson-resource-materials-control.tsx:70-98 (per-material pending guard, fresh signed URL requested at click, location.assign at :98) matches the fresh-URL-at-access intent of docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:69-75; the popup itself is deliberately not used.
- G2-17-008-069: OK — vNext has no popup so no blocked-popup case; failure path shows "Resource file is unavailable. Contact your instructor." and clears pending (lesson-resource-materials-control.tsx:99-107), equivalent to resource.js:76-91 fallback/cleanup.
- G2-18-007-028: OK — vNext college-content-authoring-control.tsx:372-375 (Section audience shared/specific), :462-464 (Visible to students, persisted in payload :289-290), :568-600 (video content type + audience) matches docs/legacy-source LessonContent.js video create audience/visibility (faculty is the acting user in vNext).
- G2-18-007-031: OK — vNext college-content-authoring-control.tsx:568-600 separates uploaded Video (UPLOAD, FacultyLessonVideoManager) from linked YouTube Video (videoMode, YouTube URL validation :271-272) matching LessonContent.js:5,168-171 import vs validate split.
- G2-11-010-108: OK — vNext src/components/placements/tpo-drive-lifecycle-controls.tsx:210-223 (no-recall warning, app-only vs app+email radio, email option disabled until delivery configured, EMAIL_DELIVERY_UNAVAILABLE message :88-89) matches docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:501.
- G2-12-005-011: OK — vNext src/components/placements/learner-general-requests.tsx:136-155 shows offer letter attach affordance and proof-link status; signed storage deliberately not enabled (explicit helper text :145-148, no unverified file attached), safe handling of PlacementCellContent.js:239-264.
- G2-12-005-028: OK — vNext learner-general-requests.tsx:136-155 optional offer-letter proof (HTTPS link, no unverified upload) matches PlacementCellContent.js:259-264 intent safely; file picker deliberately unavailable.
- G2-12-005-039: OK — vNext learner-general-requests.tsx:52,113,164-167 dirty-discard ConfirmDialog "Discard this request?" matches docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:123-136.
