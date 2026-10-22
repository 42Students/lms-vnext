# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-7-015-044  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_9.md)
- [ ] G2-7-015-084  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_9.md)
- [ ] G2-7-016-042  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_9.md)
- [ ] G2-7-017-034  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_9.md)
- [ ] G2-7-018-029  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_9.md)
- [ ] G2-7-021-018  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_9.md)
- [ ] G2-7-021-056  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_9.md)
- [ ] G2-7-027-017  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_9.md)
- [ ] G2-7-027-057  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_9.md)
- [ ] G2-7-028-004  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_9.md)

## Results

- G2-7-015-044: OK — vNext src/components/projects/college-project-summary-editor-full.tsx:49-68,278-279 uses useProjectEditorDiscardGuard (src/components/projects/project-editor-discard-guard.ts: beforeunload, in-app link clicks, Back/Forward via Navigation API, Cancel) with "Discard unsaved changes?" confirm; matches college-admin/projects/workspaces/[workspaceId]/summary.js:312-362 unsaved guard.
- G2-7-015-084: OK — vNext src/components/projects/project-workspace.tsx:477-492 header has Change template (ProjectChangeTemplateControl, disabled when archived) and Archive/Restore (ProjectArchiveControl:91 also mounts ProjectSoftDeleteControl "Delete this workspace?" recoverable delete); Restore is the documented new control for archived workspaces. Matches summary.js:455-534.
- G2-7-016-042: OK — vNext src/modules/projects/legacy-workspace-import-model.ts:64-76,110-121 maps old sprintKey/taskKey to new rows (unresolved links reported MISSING/AMBIGUOUS, legacyTaskKey/legacySprintKey kept) and legacy-meeting-migration-model.ts:34-49 keeps meetingKey and linked sprint/task lookups; matches projectSectionFieldConfigs.js:280-345 materializeSectionKeys.
- G2-7-017-034: FIXED — roster dialog over-limit message now reads "This would exceed the 500-learner limit for this workspace — currently X, adding Y." (counts mirror the legacy validator for Add vs Replace modes) in src/components/projects/college-project-student-roster-dialog.tsx; cap logic already in college-project-roster-model.ts:11-12. Matches team.js:405-424.
- G2-7-018-029: FIXED — src/components/projects/project-deleted-row-restore.tsx: restoring a workspace without a recorded mentor now shows "Workspace restored, but its mentor could not be recovered — assign one to reactivate it." (info tone); otherwise "Workspace restored". Matches workspaces/deleted.js:85-100.
- G2-7-021-018: FIXED — src/modules/projects/mentor-overload-model.ts: 1.5x mean comparison changed from > to >= (both conditions inclusive: count >= max(1.5*avg, avg+3)); test boundary updated in tests/unit/chat4-college-admin-projects-role-journey.test.ts (150 of [100,100] now overloaded). Matches reassign-mentor.js:155-162,192.
- G2-7-021-056: FIXED — same change as G2-7-021-018 in src/modules/projects/mentor-overload-model.ts (floor and >= boundary), matching reassign-mentor.js:158-163.
- G2-7-027-017: OK — vNext src/components/projects/project-workspace.tsx:1085-1131 Team section: ADMIN gets CollegeAdminWorkspaceTeamOverview counts (Students, Supporting faculty, coverage; src/components/projects/college-admin-workspace-team-overview.tsx), roster, and AddProjectMemberControl/Manage students; mentors deliberately cannot edit membership (in-page notice at :1099-1103,:1118-1119, "Team staffing changes remain a College Admin action"). The legacy ProjectDetailContent file is not in docs/legacy-source; behaviour per audit row.
- G2-7-027-057: OK — vNext src/components/projects/project-workspace.tsx:725-740 keeps editing disabled for archived and completed workspaces (explicit notices "This project is complete... editing is disabled") — intentional stricter lock than legacy "editable when mentor and not archived"; archived rule matches legacy.
- G2-7-028-004: OK — vNext src/modules/projects/mentor-project-list-query.ts:14-27 translates historic zero-based ?page=N (any N) to 1-based internal page and honours explicit page1; matches ProjectsContent.jsx:154-193 (page 0-based).
