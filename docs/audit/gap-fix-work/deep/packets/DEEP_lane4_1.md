# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [x] G2-9-007-050  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_14.md)
- [ ] G2-9-012-026  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_14.md)
- [x] G2-9-013-060  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_14.md)
- [ ] G2-9-014-049  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_14.md)
- [x] G2-9-015-065  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_14.md)
- [x] G2-9-036-018  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_14.md)
- [x] G2-9-036-047  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_14.md)
- [x] G2-9-036-049  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_14.md)
- [x] G2-9-036-057  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_14.md)
- [x] G2-9-036-058  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_14.md)

## Results

- G2-9-015-065: FIXED — `4dc297fca80a883188615aece15e0de87711e785`, `src/app/(authenticated)/college/placements/drives/page.tsx`; guards the directory when Placements is disabled and provides Super Admin recovery guidance. Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/all.js:35-43`.

- G2-9-036-057: OK — vNext `src/modules/module-access/service.ts:123-129`; legacy `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleFeatureCatalog.java:62-85`; college-level Placements ignores learner/section/cohort/program/department scopes.
- G2-9-036-058: OK — vNext `src/modules/module-access/admin-college-rule-write.ts:35-55`; legacy `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:178-206`; rejects mutation under a college-local or inherited lock.
- G2-9-036-049: OK — vNext `src/modules/module-access/admin-college-rule-write.ts:58-76`; legacy `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:208-222`; performs scoped upsert and required audit insertion in the same transaction.
- G2-9-013-060: FIXED — commit `0ea77c7f70195fc279055d820e39e21d9d5dad97`; `src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx`. Legacy: `docs/legacy-source/frontend/src/components/admin/ModuleGroupGuard.jsx:27-75`; disabled Placements now blocks the settings page with Super Admin recovery guidance.
- G2-9-007-050: OK — vNext `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx:37-58`; legacy `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/electives/ElectiveAdminController.java:38-42`; scoped Super Admin role and selected college checked before academics.manage.
- G2-9-036-018: OK — vNext `src/modules/module-access/admin-read-service.ts:200-258`; legacy `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:293-299`; overview module counters count the full matching college scope rather than one result page.
- G2-9-036-047: OK — vNext `src/app/api/admin/features/[collegeId]/rules/route.ts:10-49` and `src/modules/module-access/admin-college-rule-write.ts:13-20`; legacy `docs/legacy-source/frontend/src/api/Services/AdminService.js:48-54`; versioned SET/INHERIT expected-state API intentionally replaces legacy bare module/enabled write and preserves catalog validation and authorization.
