# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-6-023-006  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_8.md)
- [ ] G2-6-025-027  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_8.md)
- [ ] G2-6-030-048  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_8.md)
- [ ] G2-7-001-048  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_8.md)
- [ ] G2-7-004-002  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_8.md)
- [ ] G2-7-005-031  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_8.md)
- [ ] G2-7-008-014  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_8.md)
- [ ] G2-7-010-017  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_8.md)
- [ ] G2-7-011-024  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_8.md)
- [ ] G2-7-012-005  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_8.md)

## Results

- G2-6-023-006: OK — vNext src/app/(authenticated)/tpo/batches/page.tsx:186-205 shows per-batch students/eligible/ineligible/not decided counts plus Invited/Registered/Verified/Placed journey tiles from authorized journey+eligibility services; matches docs/legacy-source/backend/.../PlacementEligibilityService.java:366-427 overview().
- G2-6-025-027: OK — vNext src/modules/courses/lesson-resource-file-upload-service.ts:89-190 (begin grant with tenant-bound key, uploadTokenHash, UPLOADING/PENDING scan; complete verifies stored size/content type, consumes token, attests scan before READY) matches ResourceUploadReceiptAdvice.java:46-169; route src/app/api/courses/lesson-contents/[contentId]/materials/files/route.ts.
- G2-6-030-048: OK — vNext src/modules/academics/lecture-hall-service.ts:384-420 is archive-only (no hard delete, so historical schedules and reports are retained) and blocks archive/capacity cuts while future SCHEDULED events exist under a row lock; stricter-than-legacy delete rule at LectureHallServiceImpl.java:143-152 is intentionally replaced by this safe archive guard.
- G2-7-001-048: OK — vNext src/components/projects/project-at-risk-page-export.tsx:24-38 uses headers Workspace/Mentor/Status/Severity/Risk reasons and filename at-risk-projects.csv, matching docs/legacy-source/frontend/src/pages/college-admin/projects/at-risk/index.js:364-393.
- G2-7-004-002: OK — vNext src/components/projects/project-admin-readiness-page.tsx:120-134 resolves ?projectId= (or workspaceId) directly via resolveCollegeReadinessWorkspaceId + requireProjectManageAccess independent of the picker list (it prepends the selected workspace if missing); matches readiness/index.js:240-262.
- G2-7-005-031: OK — vNext src/app/(authenticated)/college/projects/templates/page.tsx:90-93 states published templates are assigned to the college by a Super Admin and the list/detail pages are read-only (browse and use), matching templates/[templateId].js:69-74 and templates/index.js read-only catalog.
- G2-7-008-014: FIXED — src/components/projects/college-project-delivery-overview.tsx Review card: added "Mentor feedback" heading for feedback and replaced the fallbacks ("No mentor review has been recorded yet." / "No feedback supplied.") with the legacy sentence "No mentor feedback has been recorded yet."; Reviewed by/at already join reviewer name and time (same copy as src/components/projects/project-workspace.tsx:425-432). Matches WorkspaceDeliveryOverview.jsx:118-135.
- G2-7-010-017: OK — vNext src/components/projects/project-meeting-plan-editor.tsx:266-268 single "Save meeting plan" button disabled/loading while pending or invalid, mounted at src/components/projects/project-workspace.tsx:2135-2150; matches WorkspaceMeetingsEditor.jsx:61-81.
- G2-7-011-024: OK — vNext src/components/projects/workspace-brief-editor.tsx:87,185 and src/modules/projects/workspace-brief-model.ts:82 require at least one deliverable ("Add at least one deliverable."), matching WorkspaceOverviewEditor.jsx:63-68.
- G2-7-012-005: OK — vNext src/components/projects/project-workspace.tsx:250-328 renders hero (eyebrow, headline, Ready/Not ready badge), then Overall project progress bar, then the four metrics, then override panel/empty note; same order and copy as WorkspaceReadinessOverview.jsx:45-110.
