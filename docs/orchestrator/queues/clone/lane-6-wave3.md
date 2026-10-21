# Gap FIX queue, wave3: lane chat-6

12 packets, 32 findings. Start this queue as soon as your wave-1 queues (lane-6-work.md, work2, work3) are finished; never wait, never idle.

This is wave 3 of the fix job. Work every packet below, in order, one at a time, with these rules:
1. A packet lists EVERY audit finding for ONE vNext file (or one new-feature group). Open it, read the target file in the repo, and apply ALL findings in one editing pass so vNext matches the old LMS (old source: docs/legacy-source/frontend/src and docs/legacy-source/backend/src). Wording parity with docs/audit/legacy-copy-A.md and legacy-copy-B.md is mandatory. Parts of one file come together: do them in order.
2. SKIP NO FINDING. If a finding is marked UNKNOWN-like, ambiguous or in tension with the vNext model (one workspace per role, college x role switcher, membership model), implement the behaviour that matches the old LMS as closely as the vNext model allows. Only if a finding is truly impossible, say so in one line in the commit message.
3. Edit only the files of your packets (nobody else edits them). If a finding needs another file, make the smallest edit in that file only when no other lane's queue lists it; schema or migration changes: lane 14 (migrations 0200+, no journal) and lane 15 (0138-0199 and the journal) only.
4. TypeScript strict, valid syntax: re-read every edited file for matching tags, imports, props and exports before moving on (you cannot run code). No new packages. Never reformat untouched code. Never rename shared exports.
5. Do a SUBSTANTIAL amount of work in every turn: go through many packets back to back, do not stop to report or summarise, do not write proof files. Tick [x] in this queue file as you finish packets, and push (one push containing the code and the ticks) only after every ~10 packets or when you are about to stop. Never push just to report.

Packets:

- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-6/W3_src_modules_placements_recruiter-message-email-inbound-service.ts.md` (edit src/modules/placements/recruiter-message-email-inbound-service.ts; 3 findings; best P0)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-6/W3_src_modules_placements_learner-job-service.ts.md` (edit src/modules/placements/learner-job-service.ts; 3 findings; best P0)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-6/W3_src_modules_placements_tpo-drive-change-request-service.ts.md` (edit src/modules/placements/tpo-drive-change-request-service.ts; 3 findings; best P0)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-6/W3_src_components_placements_tpo-drive-edit-form.tsx.md` (edit src/components/placements/tpo-drive-edit-form.tsx; 8 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-6/W3_src_components_placements_college-application-pipeline-controls.tsx.md` (edit src/components/placements/college-application-pipeline-controls.tsx; 3 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-6/W3_src_modules_placements_college-application-stage-service.ts.md` (edit src/modules/placements/college-application-stage-service.ts; 3 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-6/W3_src_components_placements_placement-job-create-form.tsx.md` (edit src/components/placements/placement-job-create-form.tsx; 3 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-6/W3_src_modules_admin-ui_super-admin-placement-interviews-service.ts.md` (edit src/modules/admin-ui/super-admin-placement-interviews-service.ts; 2 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-6/W3_src_components_placements_super-admin-drive-quick-search.tsx.md` (edit src/components/placements/super-admin-drive-quick-search.tsx; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-6/W3_src_modules_placements_company-service.ts.md` (edit src/modules/placements/company-service.ts; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-6/W3_src_modules_placements_application-service.ts.md` (edit src/modules/placements/application-service.ts; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-6/W3_src_app_api_placements_tpo_offers_expiry_route.ts.md` (edit src/app/api/placements/tpo/offers/expiry/route.ts; 1 findings; best P1)
