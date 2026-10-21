# Gap FIX queue, wave3: lane chat-11

15 packets, 34 findings. Start this queue as soon as your wave-1 queues (lane-11-work.md, work2, work3) are finished; never wait, never idle.

This is wave 3 of the fix job. Work every packet below, in order, one at a time, with these rules:
1. A packet lists EVERY audit finding for ONE vNext file (or one new-feature group). Open it, read the target file in the repo, and apply ALL findings in one editing pass so vNext matches the old LMS (old source: docs/legacy-source/frontend/src and docs/legacy-source/backend/src). Wording parity with docs/audit/legacy-copy-A.md and legacy-copy-B.md is mandatory. Parts of one file come together: do them in order.
2. SKIP NO FINDING. If a finding is marked UNKNOWN-like, ambiguous or in tension with the vNext model (one workspace per role, college x role switcher, membership model), implement the behaviour that matches the old LMS as closely as the vNext model allows. Only if a finding is truly impossible, say so in one line in the commit message.
3. Edit only the files of your packets (nobody else edits them). If a finding needs another file, make the smallest edit in that file only when no other lane's queue lists it; schema or migration changes: lane 14 (migrations 0200+, no journal) and lane 15 (0138-0199 and the journal) only.
4. TypeScript strict, valid syntax: re-read every edited file for matching tags, imports, props and exports before moving on (you cannot run code). No new packages. Never reformat untouched code. Never rename shared exports.
5. Do a SUBSTANTIAL amount of work in every turn: go through many packets back to back, do not stop to report or summarise, do not write proof files. Tick [x] in this queue file as you finish packets, and push (one push containing the code and the ticks) only after every ~10 packets or when you are about to stop. Never push just to report.

Packets:

- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-11/W3_src_components_admin_super-admin-today-board.tsx.md` (edit src/components/admin/super-admin-today-board.tsx; 15 findings; best P1)
- [x] `docs/audit/gap-fix-work/wave3/packets/lane-11/W3_src_components_admin_super-admin-hr-detail-drawer.tsx.md` (edit src/components/admin/super-admin-hr-detail-drawer.tsx; 3 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-11/W3_src_modules_colleges_admin-today-attention-service.ts.md` (edit src/modules/colleges/admin-today-attention-service.ts; 2 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-11/W3_src_components_admin_learner-module-access-drawer.tsx.md` (edit src/components/admin/learner-module-access-drawer.tsx; 2 findings; best P1)
- [x] `docs/audit/gap-fix-work/wave3/packets/lane-11/W3_src_modules_colleges_branding-service.ts.md` (edit src/modules/colleges/branding-service.ts; 2 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-11/W3_src_app_authenticated_admin_placements_jobs_jobId_schedule_page.tsx.md` (edit src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-11/W3_src_app_authenticated_admin_module-access_page.tsx.md` (edit src/app/(authenticated)/admin/module-access/page.tsx; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-11/W3_src_app_authenticated_admin_projects_page.tsx.md` (edit src/app/(authenticated)/admin/projects/page.tsx; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-11/W3_src_app_api_admin_settings_overrides_route.ts.md` (edit src/app/api/admin/settings/overrides/route.ts; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-11/W3_src_app_authenticated_admin_tenants_page.tsx.md` (edit src/app/(authenticated)/admin/tenants/page.tsx; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-11/W3_src_components_admin_tenant-directory-csv-control.tsx.md` (edit src/components/admin/tenant-directory-csv-control.tsx; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-11/W3_src_components_admin_super-admin-faculty-bulk-import.tsx.md` (edit src/components/admin/super-admin-faculty-bulk-import.tsx; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-11/W3_src_app_api_colleges_route.ts.md` (edit src/app/api/colleges/route.ts; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-11/W3_src_modules_colleges_service.ts.md` (edit src/modules/colleges/service.ts; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-11/W3_src_components_admin_scoped-membership-lifecycle-actions.tsx.md` (edit src/components/admin/scoped-membership-lifecycle-actions.tsx; 1 findings; best P1)
