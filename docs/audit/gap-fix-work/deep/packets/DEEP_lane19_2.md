# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [x] G2-8-022-020  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)
- [x] G2-8-028-051  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)
- [x] G2-8-028-058  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)
- [x] G2-8-028-064  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)
- [ ] G2-9-002-087  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)
- [x] G2-9-008-006  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)
- [x] G2-9-008-011  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)
- [x] G2-9-008-020  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)
- [x] G2-9-008-022  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)
- [ ] G2-9-008-031  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)

## Results

- G2-9-008-020: OK — `src/components/placements/college-hiring-funnel.tsx:30-37,94-103` clears the Program selection on Department change and filters programs to the selected department, matching `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:352-366`.
- G2-9-008-022: OK — `src/components/placements/college-hiring-funnel.tsx:90-126` keeps jobId, departmentId, programId, cohortId and date inputs in the GET filter form, and Clear all navigates via `collegeHiringAnalyticsHref({})` without any of those filters, matching `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:225-231`.

- G2-9-008-006: FIXED — `749a337` in `src/components/placements/college-hiring-funnel.tsx`; all nine baseline status metrics remain immediately visible and average time appears only when available, matching `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:437-499`.
- G2-9-008-011: FIXED — `749a337` in `src/components/placements/college-hiring-funnel.tsx`; previous-stage conversion tags use the legacy `% of [stage]` phrasing, matching `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:510-525`.

- G2-8-028-058: OK — `src/components/projects/class-team-workspace-creator.tsx:260-264,778-778` tracks dirty fields and invokes `useProjectEditorDiscardGuard`; `src/components/projects/project-editor-discard-guard.ts:15-65,67-91` blocks beforeunload, in-app navigation and supported history navigation until explicit discard confirmation. Matches `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:10,59,360-363`.

- G2-8-028-064: OK — `src/app/(authenticated)/college/projects/create/page.tsx:16-18,61-81` defaults to `single`, exposes explicit mode navigation and renders `CreateProjectControl` in single mode; `src/components/projects/class-team-workspace-creator.tsx:415-420` links back to that single-workspace form instead of requiring a slug within the class-team planner. Matches `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:35-37,404-416`.

- G2-8-028-051: OK — `src/modules/projects/class-team-workspace-service.ts:125-152,178-186` creates one group per explicitly selected team and inserts only those `plan.membershipIds` into `lmsGroupMembers` and `projectMembers`; it writes an audit event but sends no class-wide notification. `src/components/projects/class-team-workspace-creator.tsx:383-386` restricts reporting to the selected memberships. Matches the leak-prevention intent documented at `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:485-490`, where single-mode classId was removed to prevent broadcasting to unrelated learners.

- G2-8-022-020: OK — `src/components/placements/tpo-season-registration-controls.tsx:19-46,81-93` validates a future IST `datetime-local` deadline and submits the OPEN_REGISTRATION action, `src/app/api/placements/seasons/[seasonId]/open-registration/route.ts` scopes the request through `changeTpoSeasonRegistration`, and `src/modules/placements/tpo-season-write-service.ts:33-72` persists it with TPO authority and validation; matches `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoSeasonController.java:56-60` (registration-open deadline action).
