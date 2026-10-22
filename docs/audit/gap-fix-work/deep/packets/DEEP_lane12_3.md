# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-7-009-001  (source: docs/audit/gap-fix-work/verify2/packets/lane-2/W1_lane2_8.md)
- [ ] G2-7-011-028  (source: docs/audit/gap-fix-work/verify2/packets/lane-2/W1_lane2_8.md)
- [ ] G2-7-013-030  (source: docs/audit/gap-fix-work/verify2/packets/lane-2/W1_lane2_8.md)
- [ ] G2-8-5-037  (source: docs/audit/gap-fix-work/verify2/packets/lane-2/W1_lane2_9.md)
- [ ] G2-11-017-024  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_5.md)
- [ ] G2-11-023-035  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_5.md)
- [ ] G2-11-029-025  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_5.md)
- [ ] G2-14-029-012  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_5.md)
- [ ] G2-4-022-011  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_5.md)
- [ ] G2-4-022-012  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_5.md)

## Results

- G2-7-009-001: OK — vNext src/app/(authenticated)/college/projects/workspaces/[workspaceId]/page.tsx:12-16 redirects to /college/projects/:id/summary forwarding the validated query (openTemplate/from/reason) via src/modules/projects/legacy-workspace-summary-query.ts; matches docs/legacy-source/frontend/src/pages/college-admin/projects/workspaces/[workspaceId]/index.js:18-26.
- G2-7-011-028: OK — vNext src/components/projects/workspace-brief-editor.tsx:43-76 re-initialises the draft and version token when the server version changes (and flags stale instead of saving over concurrent edits, :82-85), matching overview.js:72-81 reset/refill.
- G2-7-013-030: FIXED — added "Item N: Title required" row errors to src/components/projects/project-task-plan-editor.tsx and src/components/projects/project-meeting-plan-editor.tsx and explicit over-limit messages (tasks: 100 changed per save, meetings: 500 rows with "Remove N before saving"); sprint editor (project-sprint-plan-editor.tsx:134,190-199) and resource editor (project-resource-library-editor.tsx:60,157,160) already had them. Matches RepeatingItemEditor.jsx:250-276.
- G2-8-5-037: OK — vNext src/app/(authenticated)/learn/my-placements/rules/page.tsx:15-18 keeps the old bookmark working by redirecting /learn/my-placements/rules (no from=) to /learn/my-placements/placement#rules, the same destination as docs/legacy-source/frontend/src/pages/learn/my-placements/rules.js:1-6 (server redirect, so no placeholder needed); internal links with from=cell keep the detailed view.
- G2-11-017-024: OK — vNext src/components/tpo/tpo-more-navigation.tsx:36-80 fetches the scoped read-only GET /api/tpo/shell-counts on mount, validates counts, shows the "Waiting requests and unread messages could not be counted." notice with a Retry button (data-testid tpo.more.counts-failed); matches tpo/more.js:59-80 and TpoHubService.js:37-48.
- G2-11-023-035: FIXED — bulk approve now skips requests whose required proof is missing: src/components/placements/tpo-request-bulk-decision.tsx disables selection for such rows when Approve is chosen and shows "No proof attached: open it to decide" (reject and one-by-one review still allowed); src/app/(authenticated)/tpo/requests/page.tsx passes proofMissing (proof-required kinds OFF_CAMPUS_OFFER/ABSENCE_DISPUTE/CORRECTION_WITH_PROOF without proof); src/modules/placements/tpo-students-service.ts proofAttached also recognises letterUrl. Matches RequestsPanel.js:261-276.
- G2-11-029-025: OK — vNext src/components/projects/super-admin-template-plan-editor.tsx:47,197-210 saves via PATCH /api/projects/templates/:id with expectedVersion (version-checked, a concurrent edit yields a conflict, never a silent overwrite), equivalent to the sprint/scalars-only payload of sprints.js:82-116.
- G2-14-029-012: OK — vNext src/components/tpo/tpo-batch-student-keyboard-actions.tsx:44-63 (Select visible / Select all learners on this page / Clear / Copy / filtered CSV export) and tpo-batch-student-bulk-notes.tsx:12-24 state the per-page and 100-learner limits explicitly, while the students hub src/components/tpo/tpo-bulk-action-panel.tsx:179-187 offers "Act on all N in this view" in verified batches; matches batches/[batchId].js:316-340 semantics with explicit limits.
- G2-4-022-011: OK — vNext replaces numeric learnerIds/jobId with scoped UUIDs: src/components/tpo/tpo-students-drive-visibility.tsx:23-45 posts to /api/placements/jobs/{uuid}/..., src/modules/placements/tpo-after-college-bulk-service.ts:15-17 parses membershipId as uuid, all college-scoped; matches TpoStudentsHubController.java:30-46 BulkRequest (identifier mapping).
- G2-4-022-012: OK — vNext src/modules/placements/tpo-after-college-model.ts:39-45 (registrationChoiceSchema enum with REGISTRATION_CHOICE_LABELS) and tpo-after-college-bulk-service.ts:93 (audited placements.student.after_college_updated participation events) map legacy register choice/label/detail into typed registration/participation events with history (src/app/api/placements/tpo/batches/[batchId]/registrations/[membershipId]/history/export/route.ts); matches TpoStudentsHubController.java:78-82,121-125.
