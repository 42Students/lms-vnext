# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-7-028-026  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_9.md)
- [ ] G2-7-028-086  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_9.md)
- [ ] G2-7-029-004  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_9.md)
- [ ] G2-7-029-086  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_9.md)
- [ ] G2-7-030-020  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_9.md)
- [ ] G2-7-030-027  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_9.md)
- [ ] G2-7-030-036  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_9.md)
- [ ] G2-7-030-042  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_9.md)
- [ ] G2-7-030-048  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_9.md)
- [ ] G2-7-030-051  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_9.md)

## Results

- G2-7-028-026: OK — vNext src/app/(authenticated)/mentor/projects/page.tsx:323-331 suppresses actionLine/next action and blocked link when project.status is ARCHIVED and shows a "Read-only" label; matches docs/legacy-source/frontend/src/components/Projects/ProjectsContent.jsx:397-419.
- G2-7-028-086: OK — vNext src/modules/projects/mentor-project-list-query.ts:14-27 treats legacy ?page=N as zero-based (page=(legacyPage??page??0)+1, explicit page1 for new links) so every old bookmark page, not only page=0, maps consistently; matches docs/legacy-source/frontend/src/components/Projects/ProjectsContent.jsx:154-165.
- G2-7-029-004: OK — vNext src/modules/projects/admin-risk-query-model.ts:27-45 translates legacy filter=stalled|blocker|review into riskBucket and search= into q before the strict schema parse; matches docs/legacy-source/frontend/src/pages/superadmin/projects/at-risk/index.js:82-101.
- G2-7-029-086: OK — same mapping in src/modules/projects/admin-risk-query-model.ts:27-45 (old bookmark keys are translated before strict parsing, conflicting old+new keys rejected); matches at-risk/index.js:82-101.
- G2-7-030-020: OK — vNext src/components/projects/project-admin-audit-page.tsx:228-233,401-419 counts raw activity events (rawEvents=result.items), unique actor ids over raw events and destructive raw events, and discloses "Displaying N raw audit actions in M grouped entries"; matches docs/legacy-source/frontend/src/pages/superadmin/projects/audit/index.js:285-292.
- G2-7-030-027: FIXED — extended legacyProjectAuditActions in src/modules/projects/admin-audit-query-model.ts so every old action key (PROJECT_UPDATE, TEMPLATE_ATTACH, ASSIGN_LEARNERS, MEMBER_ADD/UPDATE/REMOVE, TASK_CREATE/UPDATE/DELETE/SYNC, MEETINGS_SYNC, DELIVERY_UPDATE, RELEASE_SHIPPED/UNSHIPPED/DELETED_AFTER_SHIP, in addition to the existing PROJECT_TEMPLATE_* and role actions) maps to a persisted vNext event type; the clearable action select in project-admin-audit-page.tsx lists them under "Legacy actions". Matches audit/index.js:20-70,577-584.
- G2-7-030-036: OK — vNext src/components/projects/project-admin-audit-page.tsx:401-419 labels counts "(partial)" when a next cursor exists, states "Counts are minimums for this page" and the per-page cap (25 all-time, 200 for date ranges); matches audit/index.js:295-297.
- G2-7-030-042: FIXED — src/modules/projects/admin-audit-query-model.ts now maps the legacy GET /api/v1/admin/projects/audit field set onto activityEvents filters: actionKey is accepted as an alias of action (and translated via legacyProjectAuditActions), entityId->subjectId and range/since->from already via projectLegacyAuditLink, collegeId comes from the authorized admin scope (never a URL value); matches docs/legacy-source/frontend/src/api/Services/AdminService.js:473-474.
- G2-7-030-048: OK — vNext src/components/projects/project-admin-audit-page.tsx:28-55 (destructiveProjectEventTypes + destructiveProjectActivity) uses an exact event-type set incl. template archive/rollback/college revoke, team member changes and release deletion only when metadata marks afterShip/shipped (and task tombstones), not a regex on the latest group row (the regex helper only styles labels); matches audit/index.js:76-101.
- G2-7-030-051: OK — same raw-event counting (project-admin-audit-page.tsx:228-233): people are unique actor ids over every raw event so grouped actors are not undercounted; matches audit/index.js:285-293.
