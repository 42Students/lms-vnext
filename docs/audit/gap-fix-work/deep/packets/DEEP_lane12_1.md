# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [x] G2-2-012-049  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [ ] G2-2-014-028  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [ ] G2-2-019-001  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [x] G2-20-004-049  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [x] G2-20-008-040  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [x] G2-20-028-010  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [x] G2-3-021-010  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [x] G2-3-021-044  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [x] G2-7-012-035  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_6.md)
- [x] G2-9-014-004  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_7.md)

## Results

- G2-20-004-049: OK — `src/app/request-demo/page.tsx:6-18,111-115` retains exact demo subject and structured `mailto:` body from `docs/legacy-source/frontend/src/components/marketing/data.js:10-18` and the CTA of `docs/legacy-source/frontend/src/pages/request-demo.js:73-82`.
- G2-20-008-040: OK — `src/app/request-demo/page.tsx:13-18,111-115` uses the five legacy fields (Name, Organization, Role, Phone, What you're looking to solve) and exact subject from `docs/legacy-source/frontend/src/components/marketing/data.js:10-18`.
- G2-20-028-010: OK — `src/app/(authenticated)/admin/projects/[projectId]/page.tsx:57-66` forwards validated `from` and `reason` query values to the canonical summary; matches query-retaining redirect described in `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/index.js:17-24`.
- G2-3-021-010: OK — `src/components/tracker/tracker-reporter-issue-detail.tsx:36-51` loads activity independently with `Promise.allSettled` and preserves primary report on activity failure; matches `docs/legacy-source/frontend/src/pages/tracker/issues/[issueId].js:45-79`.
- G2-3-021-044: OK — `src/modules/bug-tracker/reporter-service.ts:88-110` limits activity to authenticated reporter ownership and chronologically sorts; `src/components/tracker/tracker-reporter-issue-detail.tsx:71-87` renders an Activity section; matches `docs/legacy-source/frontend/src/components/tracker/ActivityTimeline.jsx:21-43` and `docs/legacy-source/frontend/src/pages/tracker/issues/[issueId].js:45-79`.

- G2-9-014-004: OK — `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:36-46` explicitly explains the missing College Admin assignment and asks the user to contact their college administrator; matches recovery behavior in `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/shortlisted.js:20-31`.
- G2-2-012-049: OK — independent accurate totals with an eight-row preview: `src/modules/admin-ui/college-dashboard-attendance-service.ts:43-78`, `src/modules/admin-ui/college-dashboard-risk-service.ts:92-105`, `src/modules/admin-ui/college-dashboard-grading-service.ts:40-67`, `src/modules/admin-ui/college-dashboard-staffing-service.ts:62-99`; matches `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCollegeDashboardController.java:47,149-154,170-179,181-211` (full counts separate from preview).
- G2-7-012-035: OK — `src/modules/projects/readiness-service.ts:101-109,132-157,184-195` gates execution on sprints/tasks rather than shipped releases, and reports unshipped releases only as advisory; matches `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectReadinessDTO.java:14-19` (release counts explicitly informational).
