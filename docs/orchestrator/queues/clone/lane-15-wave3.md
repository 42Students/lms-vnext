# Gap FIX queue, wave3: lane chat-15

18 packets, 48 findings. Start this queue as soon as your wave-1 queues (lane-15-work.md, work2, work3) are finished; never wait, never idle.

This is wave 3 of the fix job. Work every packet below, in order, one at a time, with these rules:
1. A packet lists EVERY audit finding for ONE vNext file (or one new-feature group). Open it, read the target file in the repo, and apply ALL findings in one editing pass so vNext matches the old LMS (old source: docs/legacy-source/frontend/src and docs/legacy-source/backend/src). Wording parity with docs/audit/legacy-copy-A.md and legacy-copy-B.md is mandatory. Parts of one file come together: do them in order.
2. SKIP NO FINDING. If a finding is marked UNKNOWN-like, ambiguous or in tension with the vNext model (one workspace per role, college x role switcher, membership model), implement the behaviour that matches the old LMS as closely as the vNext model allows. Only if a finding is truly impossible, say so in one line in the commit message.
3. Edit only the files of your packets (nobody else edits them). If a finding needs another file, make the smallest edit in that file only when no other lane's queue lists it; schema or migration changes: lane 14 (migrations 0200+, no journal) and lane 15 (0138-0199 and the journal) only.
4. TypeScript strict, valid syntax: re-read every edited file for matching tags, imports, props and exports before moving on (you cannot run code). No new packages. Never reformat untouched code. Never rename shared exports.
5. Do a SUBSTANTIAL amount of work in every turn: go through many packets back to back, do not stop to report or summarise, do not write proof files. Tick [x] in this queue file as you finish packets, and push (one push containing the code and the ticks) only after every ~10 packets or when you are about to stop. Never push just to report.

Packets:

- [x] `docs/audit/gap-fix-work/wave3/packets/lane-15/W3_src_db_schema_inbound-mail.ts.md` (edit src/db/schema/inbound-mail.ts; 3 findings; best P0)
- [x] `docs/audit/gap-fix-work/wave3/packets/lane-15/W3_src_db_schema_index.ts.md` (edit src/db/schema/index.ts; 2 findings; best P0)
- [x] `docs/audit/gap-fix-work/wave3/packets/lane-15/W3_src_db_schema_placements.ts.md` (edit src/db/schema/placements.ts; 17 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-15/W3_src_db_schema_db10-audit-findings.draft.ts.md` (edit src/db/schema/db10-audit-findings.draft.ts; 4 findings; best P1)
- [x] `docs/audit/gap-fix-work/wave3/packets/lane-15/W3_src_db_schema_project-audit-staged.ts.md` (edit src/db/schema/project-audit-staged.ts; 4 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-15/W3_src_db_schema_platform-setting-overrides.ts.md` (edit src/db/schema/platform-setting-overrides.ts; 2 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-15/W3_src_components_placements_learner-placement-job-detail.tsx.md` (edit src/components/placements/learner-placement-job-detail.tsx; 2 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-15/W3_src_db_schema_db10-bug-tracker.ts.md` (edit src/db/schema/db10-bug-tracker.ts; 2 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-15/W3_src_db_schema_identity-auth-attempts.ts.md` (edit src/db/schema/identity-auth-attempts.ts; 2 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-15/W3_src_app_api_people_faculty-self-document_route.ts.md` (edit src/app/api/people/faculty-self-document/route.ts; 2 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-15/W3_src_modules_placements_learner-support-request-model.ts.md` (edit src/modules/placements/learner-support-request-model.ts; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-15/W3_src_db_schema_profiles.ts.md` (edit src/db/schema/profiles.ts; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-15/W3_src_db_schema_db06-history-staged.ts.md` (edit src/db/schema/db06-history-staged.ts; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-15/W3_src_modules_placements_tpo-outcome-label-settings-service.ts.md` (edit src/modules/placements/tpo-outcome-label-settings-service.ts; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-15/W3_drizzle_0057_college_branding.sql.md` (edit drizzle/0057_college_branding.sql; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-15/W3_src_db_schema_assessments.ts.md` (edit src/db/schema/assessments.ts; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-15/W3_src_db_schema_discussions.ts.md` (edit src/db/schema/discussions.ts; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-15/W3_src_components_projects_mentor-release-editor.tsx.md` (edit src/components/projects/mentor-release-editor.tsx; 1 findings; best P2)
