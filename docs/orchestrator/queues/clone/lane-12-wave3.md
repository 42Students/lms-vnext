# Gap FIX queue, wave3: lane chat-12

12 packets, 36 findings. Start this queue as soon as your wave-1 queues (lane-12-work.md, work2, work3) are finished; never wait, never idle.

This is wave 3 of the fix job. Work every packet below, in order, one at a time, with these rules:
1. A packet lists EVERY audit finding for ONE vNext file (or one new-feature group). Open it, read the target file in the repo, and apply ALL findings in one editing pass so vNext matches the old LMS (old source: docs/legacy-source/frontend/src and docs/legacy-source/backend/src). Wording parity with docs/audit/legacy-copy-A.md and legacy-copy-B.md is mandatory. Parts of one file come together: do them in order.
2. SKIP NO FINDING. If a finding is marked UNKNOWN-like, ambiguous or in tension with the vNext model (one workspace per role, college x role switcher, membership model), implement the behaviour that matches the old LMS as closely as the vNext model allows. Only if a finding is truly impossible, say so in one line in the commit message.
3. Edit only the files of your packets (nobody else edits them). If a finding needs another file, make the smallest edit in that file only when no other lane's queue lists it; schema or migration changes: lane 14 (migrations 0200+, no journal) and lane 15 (0138-0199 and the journal) only.
4. TypeScript strict, valid syntax: re-read every edited file for matching tags, imports, props and exports before moving on (you cannot run code). No new packages. Never reformat untouched code. Never rename shared exports.
5. Do a SUBSTANTIAL amount of work in every turn: go through many packets back to back, do not stop to report or summarise, do not write proof files. Tick [x] in this queue file as you finish packets, and push (one push containing the code and the ticks) only after every ~10 packets or when you are about to stop. Never push just to report.

Packets:

- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-12/W3_src_modules_bug-tracker_independent-audit-findings-service.ts.md` (edit src/modules/bug-tracker/independent-audit-findings-service.ts; 5 findings; best P0)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-12/W3_src_app_authenticated_tpo_placements_lifecycle_page.tsx.md` (edit src/app/(authenticated)/tpo/placements/lifecycle/page.tsx; 8 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-12/W3_src_app_authenticated_tpo_profile_page.tsx.md` (edit src/app/(authenticated)/tpo/profile/page.tsx; 6 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-12/W3_src_modules_activity_notification-service.ts.md` (edit src/modules/activity/notification-service.ts; 4 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-12/W3_src_app_authenticated_tpo_placements_jobs_jobId_change-requests_page.tsx.md` (edit src/app/(authenticated)/tpo/placements/jobs/[jobId]/change-requests/page.tsx; 4 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-12/W3_src_app_authenticated_activity_eventId_page.tsx.md` (edit src/app/(authenticated)/activity/[eventId]/page.tsx; 2 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-12/W3_src_components_activity_activity-center.tsx.md` (edit src/components/activity/activity-center.tsx; 2 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-12/W3_src_components_tpo_recruiter-invite-landing.tsx.md` (edit src/components/tpo/recruiter-invite-landing.tsx; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-12/W3_src_modules_bug-tracker_report-service.ts.md` (edit src/modules/bug-tracker/report-service.ts; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-12/W3_NEW_docs_audit_gap2_lane-16_u001-tracker-audit-findings.md.md` (new; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-12/W3_src_components_tpo_tpo-job-types-editor.tsx.md` (edit src/components/tpo/tpo-job-types-editor.tsx; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-12/W3_src_app_authenticated_tpo_team_page.tsx.md` (edit src/app/(authenticated)/tpo/team/page.tsx; 1 findings; best P2)
