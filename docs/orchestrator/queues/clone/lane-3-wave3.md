# Gap FIX queue, wave3: lane chat-3

15 packets, 64 findings. Start this queue as soon as your wave-1 queues (lane-3-work.md, work2, work3) are finished; never wait, never idle.

This is wave 3 of the fix job. Work every packet below, in order, one at a time, with these rules:
1. A packet lists EVERY audit finding for ONE vNext file (or one new-feature group). Open it, read the target file in the repo, and apply ALL findings in one editing pass so vNext matches the old LMS (old source: docs/legacy-source/frontend/src and docs/legacy-source/backend/src). Wording parity with docs/audit/legacy-copy-A.md and legacy-copy-B.md is mandatory. Parts of one file come together: do them in order.
2. SKIP NO FINDING. If a finding is marked UNKNOWN-like, ambiguous or in tension with the vNext model (one workspace per role, college x role switcher, membership model), implement the behaviour that matches the old LMS as closely as the vNext model allows. Only if a finding is truly impossible, say so in one line in the commit message.
3. Edit only the files of your packets (nobody else edits them). If a finding needs another file, make the smallest edit in that file only when no other lane's queue lists it; schema or migration changes: lane 14 (migrations 0200+, no journal) and lane 15 (0138-0199 and the journal) only.
4. TypeScript strict, valid syntax: re-read every edited file for matching tags, imports, props and exports before moving on (you cannot run code). No new packages. Never reformat untouched code. Never rename shared exports.
5. Do a SUBSTANTIAL amount of work in every turn: go through many packets back to back, do not stop to report or summarise, do not write proof files. Tick [x] in this queue file as you finish packets, and push (one push containing the code and the ticks) only after every ~10 packets or when you are about to stop. Never push just to report.

Packets:

- [x] `docs/audit/gap-fix-work/wave3/packets/lane-3/W3_src_components_courses_super-admin-content-authoring.tsx.md` (edit src/components/courses/super-admin-content-authoring.tsx; 12 findings; best P1)
- [x] `docs/audit/gap-fix-work/wave3/packets/lane-3/W3_src_components_courses_faculty-lesson-authoring.tsx.md` (edit src/components/courses/faculty-lesson-authoring.tsx; 10 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-3/W3_src_components_courses_admin-course-create-panel.tsx.md` (edit src/components/courses/admin-course-create-panel.tsx; 9 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-3/W3_src_components_courses_college-content-authoring-control.tsx.md` (edit src/components/courses/college-content-authoring-control.tsx; 8 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-3/W3_src_components_courses_super-admin-content-directory-page.tsx.md` (edit src/components/courses/super-admin-content-directory-page.tsx; 4 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-3/W3_src_components_courses_admin-course-actions.tsx.md` (edit src/components/courses/admin-course-actions.tsx; 3 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-3/W3_src_components_courses_admin-course-overview.tsx.md` (edit src/components/courses/admin-course-overview.tsx; 3 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-3/W3_src_modules_courses_discussion-service.ts.md` (edit src/modules/courses/discussion-service.ts; 2 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-3/W3_src_modules_courses_course-service.ts.md` (edit src/modules/courses/course-service.ts; 2 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-3/W3_src_modules_courses_validation.ts.md` (edit src/modules/courses/validation.ts; 2 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-3/W3_src_components_courses_lesson-resource-materials-control.tsx.md` (edit src/components/courses/lesson-resource-materials-control.tsx; 2 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-3/W3_src_modules_courses_progress-service.ts.md` (edit src/modules/courses/progress-service.ts; 2 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-3/W3_src_app_api_courses_progress_contentId_route.ts.md` (edit src/app/api/courses/progress/[contentId]/route.ts; 2 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-3/W3_src_components_courses_super-admin-content-actions.tsx.md` (edit src/components/courses/super-admin-content-actions.tsx; 2 findings; best P1)
- [ ] `docs/audit/gap-fix-work/wave3/packets/lane-3/W3_src_modules_courses_lesson-service.ts.md` (edit src/modules/courses/lesson-service.ts; 1 findings; best P1)
