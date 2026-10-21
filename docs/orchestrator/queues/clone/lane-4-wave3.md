# Gap FIX queue, wave3: lane chat-4

15 packets, 33 findings. Start this queue as soon as your wave-1 queues (lane-4-work.md, work2, work3) are finished; never wait, never idle.

This is wave 3 of the fix job. Work every packet below, in order, one at a time, with these rules:
1. A packet lists EVERY audit finding for ONE vNext file (or one new-feature group). Open it, read the target file in the repo, and apply ALL findings in one editing pass so vNext matches the old LMS (old source: docs/legacy-source/frontend/src and docs/legacy-source/backend/src). Wording parity with docs/audit/legacy-copy-A.md and legacy-copy-B.md is mandatory. Parts of one file come together: do them in order.
2. SKIP NO FINDING. If a finding is marked UNKNOWN-like, ambiguous or in tension with the vNext model (one workspace per role, college x role switcher, membership model), implement the behaviour that matches the old LMS as closely as the vNext model allows. Only if a finding is truly impossible, say so in one line in the commit message.
3. Edit only the files of your packets (nobody else edits them). If a finding needs another file, make the smallest edit in that file only when no other lane's queue lists it; schema or migration changes: lane 14 (migrations 0200+, no journal) and lane 15 (0138-0199 and the journal) only.
4. TypeScript strict, valid syntax: re-read every edited file for matching tags, imports, props and exports before moving on (you cannot run code). No new packages. Never reformat untouched code. Never rename shared exports.
5. Do a SUBSTANTIAL amount of work in every turn: go through many packets back to back, do not stop to report or summarise, do not write proof files. Tick [x] in this queue file as you finish packets, and push (one push containing the code and the ticks) only after every ~10 packets or when you are about to stop. Never push just to report.

Packets:

- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-4/W3_src_components_placements_college-application-detail-drawer.tsx.md` (edit src/components/placements/college-application-detail-drawer.tsx; 7 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-4/W3_src_components_placements_super-admin-published-drive-edit.tsx.md` (edit src/components/placements/super-admin-published-drive-edit.tsx; 5 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-4/W3_src_modules_placements_college-stage-action-model.ts.md` (edit src/modules/placements/college-stage-action-model.ts; 3 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-4/W3_src_modules_placements_college-placement-student-lookup-service.ts.md` (edit src/modules/placements/college-placement-student-lookup-service.ts; 3 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-4/W3_src_modules_placements_tpo-offer-lifecycle-service.ts.md` (edit src/modules/placements/tpo-offer-lifecycle-service.ts; 3 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-4/W3_src_components_placements_tpo-round-drive-day-read-only.tsx.md` (edit src/components/placements/tpo-round-drive-day-read-only.tsx; 2 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-4/W3_src_components_placements_tpo-drive-change-requests.tsx.md` (edit src/components/placements/tpo-drive-change-requests.tsx; 2 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-4/W3_src_components_placements_placement-operations-overview.tsx.md` (edit src/components/placements/placement-operations-overview.tsx; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-4/W3_src_components_placements_placement-drive-workspace.tsx.md` (edit src/components/placements/placement-drive-workspace.tsx; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-4/W3_src_modules_placements_tpo-drive-edit-service.ts.md` (edit src/modules/placements/tpo-drive-edit-service.ts; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-4/W3_NEW_docs_audit_gap2_lane-15_u005-learner-placement-job-detail.md.md` (new; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-4/W3_src_app_api_placements_jobs_jobId_change-requests_route.ts.md` (edit src/app/api/placements/jobs/[jobId]/change-requests/route.ts; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-4/W3_src_modules_placements_tpo-public-join-link-service.ts.md` (edit src/modules/placements/tpo-public-join-link-service.ts; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-4/W3_src_modules_placements_college-round-slot-action-service.ts.md` (edit src/modules/placements/college-round-slot-action-service.ts; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-4/W3_src_modules_placements_public-recruiter-invite-accept-service.ts.md` (edit src/modules/placements/public-recruiter-invite-accept-service.ts; 1 findings; best P1)
