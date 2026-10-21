# Gap FIX queue, wave3: lane chat-7

12 packets, 37 findings. Start this queue as soon as your wave-1 queues (lane-7-work.md, work2, work3) are finished; never wait, never idle.

This is wave 3 of the fix job. Work every packet below, in order, one at a time, with these rules:
1. A packet lists EVERY audit finding for ONE vNext file (or one new-feature group). Open it, read the target file in the repo, and apply ALL findings in one editing pass so vNext matches the old LMS (old source: docs/legacy-source/frontend/src and docs/legacy-source/backend/src). Wording parity with docs/audit/legacy-copy-A.md and legacy-copy-B.md is mandatory. Parts of one file come together: do them in order.
2. SKIP NO FINDING. If a finding is marked UNKNOWN-like, ambiguous or in tension with the vNext model (one workspace per role, college x role switcher, membership model), implement the behaviour that matches the old LMS as closely as the vNext model allows. Only if a finding is truly impossible, say so in one line in the commit message.
3. Edit only the files of your packets (nobody else edits them). If a finding needs another file, make the smallest edit in that file only when no other lane's queue lists it; schema or migration changes: lane 14 (migrations 0200+, no journal) and lane 15 (0138-0199 and the journal) only.
4. TypeScript strict, valid syntax: re-read every edited file for matching tags, imports, props and exports before moving on (you cannot run code). No new packages. Never reformat untouched code. Never rename shared exports.
5. Do a SUBSTANTIAL amount of work in every turn: go through many packets back to back, do not stop to report or summarise, do not write proof files. Tick [x] in this queue file as you finish packets, and push (one push containing the code and the ticks) only after every ~10 packets or when you are about to stop. Never push just to report.

Packets:

- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-7/W3_src_app_authenticated_admin_faculty_page.tsx.md` (edit src/app/(authenticated)/admin/faculty/page.tsx; 8 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-7/W3_src_app_company-share_token_page.tsx.md` (edit src/app/company-share/[token]/page.tsx; 5 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-7/W3_src_app_authenticated_hr_colleges_page.tsx.md` (edit src/app/(authenticated)/hr/colleges/page.tsx; 5 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-7/W3_src_app_authenticated_admin_companies_page.tsx.md` (edit src/app/(authenticated)/admin/companies/page.tsx; 4 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-7/W3_src_modules_projects_pr-s2-04-task-fields-model.ts.md` (edit src/modules/projects/pr-s2-04-task-fields-model.ts; 3 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-7/W3_src_modules_placements_tpo-configuration-read-service.ts.md` (edit src/modules/placements/tpo-configuration-read-service.ts; 3 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-7/W3_NEW_docs_audit_gap2_lane-7_l14-u030-super-admin-interview-edit-form.md.md` (new; 2 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-7/W3_src_app_authenticated_admin_placements_analytics_page.tsx.md` (edit src/app/(authenticated)/admin/placements/analytics/page.tsx; 2 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-7/W3_src_modules_projects_task-comment-service.ts.md` (edit src/modules/projects/task-comment-service.ts; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-7/W3_NEW_docs_audit_gap2_lane-7_u017-college-admin-workspace-team.md.md` (new; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-7/W3_src_app_api_placements_jobs_jobId_share-preview_export_route.ts.md` (edit src/app/api/placements/jobs/[jobId]/share-preview/export/route.ts; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-7/W3_NEW_docs_audit_gap2_lane-6_cross-06-files-uploads-media-storage.md.md` (new; 2 findings; best P2)
