# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [x] G2-12-021-012  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_19.md)
- [x] G2-12-021-017  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_19.md)
- [x] G2-15-026-006  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_19.md)
- [x] G2-7-014-054  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_19.md)
- [x] G2-7-015-054  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_19.md)
- [x] G2-7-016-068  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_19.md)
- [x] G2-7-017-051  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_19.md)
- [x] G2-7-018-042  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_19.md)
- [x] G2-7-033-002  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_19.md)
- [x] G2-8-017-080  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_19.md)

## Results

- G2-12-021-012: OK — vNext src/modules/courses/assignment-submission-service.ts:72,229-236,327-445 accepts FILE submissions carrying ordered files plus text and typed repository/external links (SubmissionLink kind+caption) committed together; matches AssignmentServiceImpl.java:318-371.
- G2-12-021-017: OK — vNext src/modules/courses/assignment-submission-service.ts:229-236,335-381,457-480 locks and verifies every distinct receipt (duplicate ids rejected in src/modules/courses/assignment-validation.ts:163,264) and consumes each once inside the single submission transaction; matches AssignmentServiceImpl.java:429-451.
- G2-15-026-006: OK — vNext src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:302 renders CollegeApplicationPipelineControls whose detail drawer (src/components/placements/college-application-detail-drawer.tsx:84-108,426-432,569-572) edits internal notes via appendCollegeApplicationNote with amendsNoteId version check (src/modules/placements/college-application-detail-service.ts:262-292); matches PlacementJobController.java:509-573.
- G2-7-014-054: OK — vNext src/modules/projects/workspace-view-service.ts:51-97 authorizes first, then reads one consistent in-process snapshot; optional meetings/activity degrade per-section (isUnavailableProjectSectionStorage, lines 41-50) and src/components/projects/admin-project-section-page.tsx:123-135 shows a retry recovery panel, so there is no separately cancellable client fetch to mask sprint data; legacy sprints.js:47-71.
- G2-7-015-054: OK — vNext src/modules/projects/college-project-summary-service.ts:85-91 rejects an estimation-unit change when any live task has estimatePoints (PROJECT_SUBMISSION_INVALID_STATE); matches legacy summary.js:341-354.
- G2-7-016-068: FIXED — added the legacy TASK_FIELDS to vNext field/default/validation inventory (key, priority, title, sprint, estimate scale, type, due, description, acceptance, approach, vNext-only status/assignee/blocker) as a doc comment on mentorTaskCreateSchema in src/modules/projects/mentor-task-create-model.ts; estimate scale lives in mentor-estimation-unit-model.ts; legacy projectSectionFieldConfigs.js:90-140.
- G2-7-017-051: OK — vNext src/modules/projects/college-project-roster-model.ts:2-21 enforces the 500-learner effective-roster cap (max(500) per request, COLLEGE_PROJECT_LEARNER_LIMIT, collegeProjectRosterCapacity) with the legacy message; matches team.js:409-424.
- G2-7-018-042: OK — vNext src/modules/projects/instance-restore-service.ts:30-70 restores an archived workspace by status only, leaving every child table (tasks, sprints, resources, meetings, members) untouched, i.e. always the content-preserving recovery; ended members are not re-granted; legacy deleted.js:120-130 recoverableContent.
- G2-7-033-002: OK — vNext src/app/(authenticated)/admin/projects/templates/[templateId]/colleges/page.tsx:25-37 resolves a numeric legacy id or slug to the UUID via resolveTemplateCollegeLegacyId after the project-template.read permission check; matches colleges.js:24-27.
- G2-8-017-080: OK — vNext src/modules/projects/legacy-template-import-model.ts:26-32,98-111 defines transforms for all seven legacy JSON columns (overview, sprints, tasks, resources, delivery, meetings, activity) with strict schema validation (invalid blueprint is inert); matches ProjectTemplate.java:70-90.
