# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-7-012-006  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_8.md)
- [ ] G2-7-012-008  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_8.md)
- [ ] G2-7-012-022  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_8.md)
- [ ] G2-7-012-032  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_8.md)
- [ ] G2-7-012-036  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_8.md)
- [ ] G2-7-012-040  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_8.md)
- [ ] G2-7-012-064  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_9.md)
- [ ] G2-7-013-016  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_9.md)
- [ ] G2-7-014-019  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_9.md)
- [ ] G2-7-014-036  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_9.md)

## Results

- G2-7-012-006: OK — vNext src/components/projects/project-workspace.tsx:312-327 (WorkspaceReadinessSnapshot) renders the override alert (Force unlocked/blocked with Reason, Set by, Set at) or the empty card "No manual readiness override is active…", below the hero; same facts in project-workspace-readiness.tsx:170-195. Matches docs/legacy-source/frontend/src/components/admin/projects/WorkspaceReadinessOverview.jsx:76-105.
- G2-7-012-008: OK — vNext src/components/projects/project-workspace.tsx:279-292 renders the "Submission readiness" eyebrow, headline ("This workspace is ready to submit"/"still has readiness gaps") and Ready/Not ready StatusBadge; matches WorkspaceReadinessOverview.jsx:50-56.
- G2-7-012-022: OK — vNext src/components/projects/project-workspace.tsx:252-256 renders "Readiness snapshot is unavailable" with the legacy explanation and a Retry link when the snapshot is missing; matches WorkspaceReadinessOverview.jsx:16-25.
- G2-7-012-032: OK — vNext src/components/projects/project-workspace.tsx:712-716 links "Manage override" to /college/projects/readiness?projectId=… or /admin/projects/readiness?projectId=… by role base path; both routes exist and enforce scope (src/app/(authenticated)/admin/projects/readiness/page.tsx:22-40 requires Super Admin + selected college; college route is College Admin scoped). Matches docs/legacy-source/frontend/src/pages/college-admin/projects/workspaces/[workspaceId]/readiness.js:78-82.
- G2-7-012-036: OK — vNext src/components/projects/project-workspace.tsx:257-261 computes effective readiness with effectiveProjectSubmissionReady(execution.complete, override.state, hasFinalSubmission) (server execution verdict plus override); matches WorkspaceReadinessOverview.jsx:28,52-55 (readyForSubmission).
- G2-7-012-040: OK — vNext src/components/projects/project-workspace.tsx:252-256 and :527-532 guard a missing readiness and render the warning instead of dereferencing it; matches WorkspaceReadinessOverview.jsx:16-25.
- G2-7-012-064: OK — vNext uses one canonical hero/override renderer, WorkspaceReadinessSnapshot (project-workspace.tsx:250-328), and the dedicated Readiness page src/components/projects/project-workspace-readiness.tsx:67-190 shows the same hero plus override facts (Reason / Set by / Set at, effective readiness table); matches WorkspaceReadinessOverview.jsx:45-105.
- G2-7-013-016: OK — vNext src/db/schema/projects.ts:743-748 (projectResources) stores template_key plus legacy_resource_key, legacy_sprint_key, legacy_task_key, legacy_sort_order and legacy file/url columns, and src/modules/projects/mentor-resource-audit-model.ts:57-58 keys audit identity by templateKey/id, so legacy resource key identity and sprint/task link references survive migration; new resources use stable generated UUIDs instead of the typed key preview in docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:144.
- G2-7-014-019: OK — vNext deliberately replaces the legacy unsaved multi-row editor with persisted, audited per-item operations: add/edit resources (src/components/projects/project-resource-controls.tsx), Move up/Move down reorder (project-resource-list.tsx:242-243, task reorder project-workspace.tsx:1712), archive with confirmation (project-resource-controls.tsx:469-600), and an unsaved-edit guard (:227,:411) so nothing is lost; matches intent of docs/legacy-source/frontend/src/components/admin/projects/RepeatingItemEditor.jsx:62-95 without staging.
- G2-7-014-036: OK — removal in vNext is a confirmed Archive (project-resource-controls.tsx:469-600) that is reversible by setting the resource status back to Active (status select :148) and audited; deleted workspaces have explicit Restore (src/components/projects/project-deleted-row-restore.tsx). Because no unsaved form exists, the inline "Undo remove" of docs/legacy-source/frontend/src/components/admin/projects/RepeatingItemEditor.jsx:104-108 is replaced by this reversible soft-delete path.
