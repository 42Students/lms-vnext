# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-13-031-085  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_5.md)
- [ ] G2-14-028-034  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_5.md)
- [ ] G2-4-005-009  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_5.md)
- [ ] G2-4-017-029  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_5.md)
- [ ] G2-4-017-031  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_5.md)
- [ ] G2-4-017-065  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_5.md)
- [ ] G2-4-022-001  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_5.md)
- [ ] G2-4-029-011  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_5.md)
- [ ] G2-4-029-016  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_5.md)
- [ ] G2-5-004-026  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_5.md)

## Results

- G2-13-031-085: OK — vNext src/app/(authenticated)/tpo/reports/unplaced/page.tsx:82-101,156-157 computes a distinct "Ready, unplaced" metric requiring a Placements registration, resume uploaded, recorded CGPA and 10th %, and no placed-status offer, and the table shows Lowest %, UG %, Marks verified and Resume columns (:166); matches docs/legacy-source/backend/.../service/tpo/TpoInsightsService.java:96-101.
- G2-14-028-034: OK — vNext src/modules/projects/college-project-summary-service.ts:17-50 documents the API adapter (LEGACY_COLLEGE_PROJECT_MUTATION_MAP: old PUT /project-workspaces/:id -> updateCollegeProjectSummary with only summary fields) and the editor sends only user-touched fields (src/components/projects/college-project-summary-editor-full.tsx:136-146, partial PATCH) with expectedTitle/Summary/Status/UpdatedAt tokens; matches docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:267-312 (detailsToken + touched scalars).
- G2-4-005-009: OK — vNext src/app/(authenticated)/college/faculty-assignment/page.tsx:181-192 lists Semester ("Semester N (current)" / Not recorded), Year (academic period name), Role and Active columns, with semester/year derived from the section's cohort and academic period instead of free-typed values so they cannot contradict the class (documented at :78-79); matches docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:353-380.
- G2-4-017-029: OK — vNext replaces the one bundled PUT with independent, versioned operations per section: src/modules/projects/college-project-summary-service.ts:17-47 maps each legacy section (summary, overview, sprints, resources, delivery, activity) to its own service with its own optimistic token/PROJECT_SUBMISSION_CONFLICT, so a stale section can never overwrite another section's child rows; matches docs/legacy-source/backend/.../dto/projects/ProjectWorkspaceUpdateDTO.java:26-36.
- G2-4-017-031: FIXED — src/components/projects/college-project-summary-editor-full.tsx now shows the server's customer-safe message (or "This workspace changed elsewhere. Refresh the latest data before trying again." for any 409) instead of the raw PROJECT_SUBMISSION_CONFLICT code when a stale token is rejected; the service already rejects with 409 and leaves child collections untouched (college-project-summary-service.ts:66-70,120-126), and friendly-error.ts maps 409 to the conflict copy. Matches ProjectWorkspaceUpdateDTO.java:26-36.
- G2-4-017-065: OK — vNext src/modules/projects/college-project-summary-service.ts:65-70,120-127 compares the token under a FOR UPDATE row lock, writes updatedAt as max(now, previous+1ms) so every successful write yields a distinct millisecond token, and the UPDATE re-checks date_trunc('milliseconds', updated_at) = expectedUpdatedAt, so sub-millisecond database precision cannot hide a stale write; replaces docs/legacy-source/backend/.../model/ProjectWorkspace.java:119-125 @Version.
- G2-4-022-001: OK — vNext maps every legacy TpoStudentsHub route onto scoped UI/actions on src/app/(authenticated)/tpo/students/page.tsx: /table -> TpoStudentsSpreadsheet, /detail + /notes -> student quick panel and TpoStudentsSelectedNote, /register + /bulk/register -> TpoStudentsBulkAdd, /bulk/nudge -> TpoStudentNudgePanel, /bulk/assign-prep -> TpoStudentsAssignPrep, /bulk/debar + /lift-debarment -> TpoStudentsBulkDebar/timed debar, /bulk/drive-override(+restore) -> TpoStudentsDriveVisibility, /bulk/verify + /send-back -> TpoRosterVerificationBulk, /bulk/higher-studies + /restore-registration -> TpoBulkActionPanel/after-college editor, /academic-import -> TpoAcademicImportWorkspace; every action is previewed/confirmed through src/app/api/placements/tpo/bulk-actions/*. Matches docs/legacy-source/backend/.../controller/tpo/TpoStudentsHubController.java:56-218.
- G2-4-029-011: OK — vNext renders the legacy four-column Resource activity table (Resource, Action, Actor with type, When) in src/components/projects/project-resource-audit-list.tsx:60-108, mounted in the workspace Audit section (src/components/projects/project-workspace.tsx:2410) with Added/Edited/Removed counts; matches docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:63-85.
- G2-4-029-016: OK — column order Resource -> Action -> Actor -> When is fixed in src/components/projects/project-resource-audit-list.tsx:81-95; matches WorkspaceResourceAudit.jsx:63-85.
- G2-5-004-026: OK — vNext src/app/(authenticated)/mentor/calendar/page.tsx:119-123 offers every stored lifecycle value in the Status filter (ALL, DRAFT, REQUESTED, SCHEDULED, RESCHEDULED, COMPLETED, CANCELLED); matches docs/legacy-source/frontend/src/pages/mentor/calendar.js:55-63.
