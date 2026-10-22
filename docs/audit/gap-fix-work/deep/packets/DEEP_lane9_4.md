# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-6-020-038  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_9.md)
- [ ] G2-15-030-041  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_12.md)
- [ ] G2-19-022-076  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_12.md)
- [ ] G2-19-022-089  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_12.md)
- [ ] G2-2-016-027  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_12.md)
- [ ] G2-2-016-067  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_12.md)
- [ ] G2-2-016-074  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_12.md)
- [ ] G2-2-016-084  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_12.md)
- [ ] G2-2-016-087  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_12.md)
- [ ] G2-2-016-095  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_12.md)

## Results

- G2-6-020-038: OK — vNext src/app/(authenticated)/admin/departments/all/page.tsx:12-40 gives Super Admin a paginated read-only department directory across colleges (listAdminDepartmentsAcrossColleges) with permission-denied and retry states; matches DepartmentController.java:95-124 /fetchAll.
- G2-15-030-041: OK — vNext src/modules/placements/recruiter-company-funnel-model.ts:5-31 keeps the six legacy funnel stages in order, documents the label/semantic change (labels vs legacyLabels, semanticChange, backwardsStage flag, ofAllLabel/previousPercentLabel) and src/app/(authenticated)/hr/company/reports/page.tsx:217-224 renders it; matches docs/legacy-source/frontend/src/pages/recruiter/company.js:15-37 funnelSteps/STAGE_LABEL.
- G2-19-022-076: OK — vNext src/app/api/placements/tpo/messages/threads/route.ts:20-39 separates opening a thread (THREAD_OPENED, no notification) from an explicit body send via sendThreadMessage (MESSAGE_SENT, persisted+notified), with job write guard in src/modules/placements/tpo-messaging-service.ts:403,426 (assertJobForThread); matches TpoHubController.java:325-329.
- G2-19-022-089: OK — vNext src/app/api/placements/tpo/settings/job-types/route.ts:19-39 PUT saveTpoJobTypes is an atomic college-list replacement (ATOMIC_COLLEGE_LIST_REPLACEMENT) with in-use/stale/duplicate/builtin/last-active/limit error mapping; matches TpoHubController.java:410-411.
- G2-2-016-027: OK — vNext src/modules/placements/job-service.ts:1341-1424 archivePlacementJob cancels booked interviews, withdraws issued offers, records the activity event and inserts one in-app notice per applicant in the same transaction (interview-cancelled wording for affected learners), keeping history; matches AdminJobServiceImpl.java:998-1079.
- G2-2-016-067: OK — vNext src/modules/placements/job-service.ts:451-478 getPlacementJobStopImpact returns applications, active offers, booked interviews, scheduled rounds before stop/archive; matches AdminJobController.java:1019-1048.
- G2-2-016-074: OK — vNext src/modules/placements/job-service.ts:184-196,240-254,259-273 server-side paged list, default pageSize 20, default POSTED_DESC sort, status filter and sort options; matches AdminJobController.java:135-164.
- G2-2-016-084: OK — vNext src/modules/placements/super-admin-published-drive-edit-service.ts:21-137 (published-drive edit with expectedUpdatedAt CAS, :36,112) and src/modules/placements/tpo-drive-edit-service.ts provide the safe-field published edit workflow, while job-service.ts:627-650 keeps draft-only full edits; matches AdminJobController.java:236-284 (versioned update).
- G2-2-016-087: OK — vNext src/components/placements/college-application-pipeline-controls.tsx:53-54,144-165 sends assessmentUrl + saveAssessmentUrlToJob (default true) when moving to ASSESSMENT with URL validation; matches AdminJobController.java:516-589.
- G2-2-016-095: OK — vNext college-application-pipeline-controls.tsx:62-69,154,184-185,454-455 handles a stale status write with "Application status has changed since this page loaded. Refresh the current stages before retrying." disabling actions and offering a refresh button (server CAS in src/modules/placements/college-application-stage-service.ts); matches AdminJobController.java:687-697.
