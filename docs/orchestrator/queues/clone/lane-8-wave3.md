# Gap FIX queue, wave3: lane chat-8

15 packets, 33 findings. Start this queue as soon as your wave-1 queues (lane-8-work.md, work2, work3) are finished; never wait, never idle.

This is wave 3 of the fix job. Work every packet below, in order, one at a time, with these rules:
1. A packet lists EVERY audit finding for ONE vNext file (or one new-feature group). Open it, read the target file in the repo, and apply ALL findings in one editing pass so vNext matches the old LMS (old source: docs/legacy-source/frontend/src and docs/legacy-source/backend/src). Wording parity with docs/audit/legacy-copy-A.md and legacy-copy-B.md is mandatory. Parts of one file come together: do them in order.
2. SKIP NO FINDING. If a finding is marked UNKNOWN-like, ambiguous or in tension with the vNext model (one workspace per role, college x role switcher, membership model), implement the behaviour that matches the old LMS as closely as the vNext model allows. Only if a finding is truly impossible, say so in one line in the commit message.
3. Edit only the files of your packets (nobody else edits them). If a finding needs another file, make the smallest edit in that file only when no other lane's queue lists it; schema or migration changes: lane 14 (migrations 0200+, no journal) and lane 15 (0138-0199 and the journal) only.
4. TypeScript strict, valid syntax: re-read every edited file for matching tags, imports, props and exports before moving on (you cannot run code). No new packages. Never reformat untouched code. Never rename shared exports.
5. Do a SUBSTANTIAL amount of work in every turn: go through many packets back to back, do not stop to report or summarise, do not write proof files. Tick [x] in this queue file as you finish packets, and push (one push containing the code and the ticks) only after every ~10 packets or when you are about to stop. Never push just to report.

Packets:

- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-8/W3_src_components_hr_hr-drive-draft-form.tsx.md` (edit src/components/hr/hr-drive-draft-form.tsx; 4 findings; best P0)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-8/W3_NEW_docs_audit_gap2_lane-6_skill.md.md` (new; 4 findings; best P0)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-8/W3_src_modules_skills_catalog-readiness.ts.md` (edit src/modules/skills/catalog-readiness.ts; 3 findings; best P0)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-8/W3_src_app_api_skills_route.ts.md` (edit src/app/api/skills/route.ts; 4 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-8/W3_src_modules_academics_semester-mutation-service.ts.md` (edit src/modules/academics/semester-mutation-service.ts; 3 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-8/W3_src_components_electives_college-elective-offering-manager.tsx.md` (edit src/components/electives/college-elective-offering-manager.tsx; 2 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-8/W3_src_modules_academics_college-term-mapping-service.ts.md` (edit src/modules/academics/college-term-mapping-service.ts; 2 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-8/W3_src_modules_skills_catalog-service.ts.md` (edit src/modules/skills/catalog-service.ts; 2 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-8/W3_NEW_docs_audit_gap2_lane-5_u003-college-admin-classes.md.md` (new; 2 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-8/W3_src_modules_academics_college-academic-directory-service.ts.md` (edit src/modules/academics/college-academic-directory-service.ts; 2 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-8/W3_src_modules_academics_program-service.ts.md` (edit src/modules/academics/program-service.ts; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-8/W3_src_modules_academics_college-section-mutation-service.ts.md` (edit src/modules/academics/college-section-mutation-service.ts; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-8/W3_src_components_academics_college-section-lifecycle-action.tsx.md` (edit src/components/academics/college-section-lifecycle-action.tsx; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-8/W3_src_components_academics_college-section-management.tsx.md` (edit src/components/academics/college-section-management.tsx; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-8/W3_src_app_api_academics_sections_route.ts.md` (edit src/app/api/academics/sections/route.ts; 1 findings; best P1)
