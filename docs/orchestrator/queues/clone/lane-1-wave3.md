# Gap FIX queue, wave3: lane chat-1

6 packets, 20 findings. Start this queue as soon as your wave-1 queues (lane-1-work.md, work2, work3) are finished; never wait, never idle.

This is wave 3 of the fix job. Work every packet below, in order, one at a time, with these rules:
1. A packet lists EVERY audit finding for ONE vNext file (or one new-feature group). Open it, read the target file in the repo, and apply ALL findings in one editing pass so vNext matches the old LMS (old source: docs/legacy-source/frontend/src and docs/legacy-source/backend/src). Wording parity with docs/audit/legacy-copy-A.md and legacy-copy-B.md is mandatory. Parts of one file come together: do them in order.
2. SKIP NO FINDING. If a finding is marked UNKNOWN-like, ambiguous or in tension with the vNext model (one workspace per role, college x role switcher, membership model), implement the behaviour that matches the old LMS as closely as the vNext model allows. Only if a finding is truly impossible, say so in one line in the commit message.
3. Edit only the files of your packets (nobody else edits them). If a finding needs another file, make the smallest edit in that file only when no other lane's queue lists it; schema or migration changes: lane 14 (migrations 0200+, no journal) and lane 15 (0138-0199 and the journal) only.
4. TypeScript strict, valid syntax: re-read every edited file for matching tags, imports, props and exports before moving on (you cannot run code). No new packages. Never reformat untouched code. Never rename shared exports.
5. Do a SUBSTANTIAL amount of work in every turn: go through many packets back to back, do not stop to report or summarise, do not write proof files. Tick [x] in this queue file as you finish packets, and push (one push containing the code and the ticks) only after every ~10 packets or when you are about to stop. Never push just to report.

Packets:

- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-1/W3_src_components_projects_project-workspace.tsx.md` (edit src/components/projects/project-workspace.tsx; 13 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-1/W3_src_components_projects_super-admin-template-plan-editor.tsx.md` (edit src/components/projects/super-admin-template-plan-editor.tsx; 2 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-1/W3_src_components_projects_project-admin-audit-page.tsx.md` (edit src/components/projects/project-admin-audit-page.tsx; 2 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-1/W3_src_components_projects_project-archive-control.tsx.md` (edit src/components/projects/project-archive-control.tsx; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-1/W3_src_components_projects_admin-project-section-page.tsx.md` (edit src/components/projects/admin-project-section-page.tsx; 1 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-1/W3_src_components_projects_class-team-workspace-creator.tsx.md` (edit src/components/projects/class-team-workspace-creator.tsx; 1 findings; best P1)
