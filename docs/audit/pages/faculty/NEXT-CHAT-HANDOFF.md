# Faculty vNext — next-chat implementation and audit handoff
Prepared 26 October 2026. Read this together with [00-closure-ledger.md](00-closure-ledger.md) and all [screen-NN-action-audit.md](./) checklists. The latest main HEAD must always be fetched afresh; any SHA below is a point-in-time observation.

## Objective and user decision
The user wants a **brutally exhaustive, screenshot-by-screenshot Faculty prototype-to-vNext audit** that is easy to navigate, with **the original uploaded screenshot visible alongside each page's code references, itemised shortcomings, implementation checklist, and passing-test evidence**. After that audit, **complete each Faculty page systematically**, one active page at a time, directly on main, with no premature completion claims, no superficial status messages, and no intermediate statistics. User has explicitly authorized direct main work in this repository. Functional correctness comes first, detailed visual sign-off later, but design must ultimately match the newest screenshots. Do not ask the user to repeat context.

Repository: https://github.com/42Students/lms-vnext
Default/working branch: main. Legacy FE: docs/legacy-source/frontend, and existing backend/services in vNext. Read AGENTS.md, docs/planning/../../../tracker.json and docs/planning/clone-parity-protocol.md.

## Actual visual authority and portable deliverables
- **Original user upload**: 42LMS pages prototype-png-faculty.zip. This exact filename is in the user's ChatGPT Library (file ID file_00000000700482119395be41e0084bb4); it was materialized during the previous chat to /mnt/data/files/42LMS pages prototype-png-faculty.zip. In another chat do not assume this container path still exists; search Library or ask the user to attach the downloadable audit package if necessary.
- The ZIP has 13 PNGs. The first PNG, Companies › Today (some ZIP encodings garble the arrow), is **TPO**. Only the remaining 12 PNGs are Faculty screens #02 through #13.
- **Portable visual audit package made in the previous chat**: faculty-prototype-audit-package.zip (about 7 MB), containing "Faculty Audit/open-tracker.html", all 12 exact user-uploaded reference PNGs, the overall adversarial audit, and one checklist per page. The HTML has original image previews embedded and can be opened offline; it is a companion, **not the authoritative completion ledger**.
- Verified in the preparing session: SHA-256 digest of each of the 12 PNGs in the portable package matches its corresponding PNG in the original user upload. The images are not re-generations.
- Also available in the preparing chat: faculty-prototype-audit.html (standalone offline visual tracker, embedded PNGs) and faculty-prototype-adversarial-audit.md. When the next chat starts, the user can attach the audit ZIP; the next assistant should use the repository docs and original Library ZIP independently.
- The single authoritative **live** repo tracker: docs/audit/pages/faculty/00-closure-ledger.md.
- Detailed persistent checklists: docs/audit/pages/faculty/screen-02-action-audit.md through screen-13-action-audit.md. 115 specific checks across the 12 pages, plus seven acceptance categories per page; **none of these are automatically complete just because an audit item is documented**.
- Older focused notes: today-prototype-02.md, courses-prototype-03.md, course-overview-prototype-04.md.

## Screens and URLs — check original image FIRST on every screen
| Screen | Exact uploaded reference | vNext route | Principal code |
| --- | --- | --- | --- |
| #02 Today | Faculty › Today.png | /teacher | src/app/(authenticated)/teacher/page.tsx; src/components/faculty/faculty-today-panel.tsx; src/app/api/courses/faculty/shell-counts/route.ts |
| #03 Courses | Faculty › Courses.png | /teacher/courses | src/app/(authenticated)/teacher/courses/page.tsx; src/components/courses/faculty-prototype-course-directory.tsx; src/modules/courses/faculty-course-month-attendance-model.ts |
| #04 Course Overview | Course › Overview.png | /teacher/courses/:deliveryId/home | src/components/courses/faculty-prototype-course-priorities.tsx; faculty-course-workspace.tsx; src/modules/courses/faculty-course-home-service.ts |
| #05 Blueprint | Course › Blueprint.png | /teacher/courses/:deliveryId/blueprint | src/components/courses/faculty-prototype-blueprint.tsx; faculty-prototype-lesson-items.tsx; faculty-prototype-blueprint-row-actions.tsx; faculty-course-workspace.tsx |
| #06 Students | Course › Students.png | /teacher/courses/:deliveryId/students | src/components/courses/faculty-prototype-student-directory.tsx; src/modules/courses/faculty-course-home-service.ts |
| #07 Attendance | Course › Attendance.png | /teacher/courses/:deliveryId/attendanceDetail | src/components/attendance/faculty-prototype-attendance.tsx; src/modules/attendance/faculty-prototype-session-selection.ts |
| #08 Discussions | Course › Discussions.png | /teacher/courses/:deliveryId/discussions | src/components/courses/learner-course-discussion.tsx; src/app/(authenticated)/teacher/courses/[deliveryId]/discussions/page.tsx |
| #09 Assignments/Quizzes | Assignments & quizzes.png | /teacher/assessments | src/components/courses/faculty-prototype-assessment-directory.tsx; src/components/courses/faculty-assessment-create.tsx |
| #10 Grading | Assignments › Grade.png | /teacher/report/assignment/:contentId/grade?deliveryId=... | src/app/(authenticated)/teacher/report/assignment/[contentId]/grade/page.tsx; src/components/courses/faculty-prototype-inline-grader.tsx; faculty-assignment-review.tsx |
| #11 Assignment Report | Assignments › Report.png | /teacher/report/assignment/:contentId?deliveryId=... | src/components/courses/faculty-prototype-assignment-report.tsx; src/modules/courses/faculty-assessment-report-service.ts |
| #12 Class Schedule | Class schedule.png | /teacher/calendar | src/components/courses/faculty-prototype-schedule.tsx; src/modules/courses/faculty-schedule-service.ts |
| #13 Find/Bell/Profile | Find, bell, profile.png | shared Faculty shell /teacher | src/components/shell/topbar/{command-search,faculty-find-suggestions,notification-actions,account-menu}.tsx |

## Workflow — do not let this become random implementation
1. Keep one active page in the master ledger; **currently #05 Blueprint**. Earlier pages #02-#04 had passing focused acceptance and must be revisited only after shared changes or explicit regression/visual work.
2. Read its original PNG and its screen-NN-action-audit.md. Compare **every** visible section/control, text hierarchy, empty-state, navigation, and role-specific action against current main source and older LMS logic. Record confirmed vs uncertain gaps separately; screenshots with sample "students" or "counts" are not data fixtures.
3. Prioritise P0 broken behavior/security/destination and missing functional screen sections, then P1 workflow, then P2 cosmetics. Preserve existing enhanced vNext features unless they violate the new design or safety. Never enable unauthorized College Admin syllabus changes for Faculty.
4. Implement genuine code and tests on main; no text-only checkboxes. Refresh current main HEAD and each blob SHA immediately before commits because other chats concurrently push main. Never force-push or revert their work.
5. Check source-specific tests, real seeded PostgreSQL + Chromium desktop 1440px/mobile 390px, navigation targets, authorization, failed/conflicting/unknown mutations, keyboard, and responsive overflow. No false green if a run happened before latest changes. Capture rendered screenshot for **separate** pixel-level visual acceptance. Each screen status is independent of pixel-level sign-off.
6. Update screen-NN-action-audit.md checkboxes with commit/run evidence, then master ledger; do not mark completion based on a source-only inspection.
7. Move #05 → #06 → #07 → #08 → #09 → #10 → #11 → #12 → #13. Finally re-run #02-#04 regression and adversarial all-Faculty audit, and later do the separately approved full visual pass.

## Precise current work packet: #05 Blueprint (DO THIS FIRST)
The screenshot has a lesson list, selected lesson, mixed sequence of videos/resources/quiz/assignment/live class, inline Edit / Remove, + Add content menu, drag/order controls, completion/engagement footer, and status pills.

Most of the UI exists, but **DO NOT mark it closed**:
- Menu target helper: src/modules/courses/faculty-blueprint-add-target.ts maps six types to different URLs. Its Video path references anchor faculty-video-upload-{lessonId}, but repository search for faculty-video-upload only returned the helper, **not an existing DOM anchor**. The content paths add create=RESOURCE / YOUTUBE / LIVE_CLASS, but a search for searchParams.get("create") found no consuming source. Therefore distinct URLs do **not** prove relevant creation forms actually open. Fix actual destinations and preselect correct type in real authoring UI.
- Quiz and Assignment paths go to /teacher/courses/:deliveryId/{quizzes|assignments}/manage?lesson=:lessonId. The editor components currently initialise lessonId to lessons[0], so verify/implement query consumption to preselect requested lesson and prevent wrong destination lesson.
- Advanced Blueprint authoring is nested inside a details disclosure. Hash navigation to a nested closed details does not necessarily open the form; keep the correct lesson expanded and scroll/focus correctly on desktop/mobile.
- Screenshot Add Content Playwright test tests/e2e/faculty-blueprint-prototype.spec.ts has **historical URL expectation** for advanced=1#faculty-lesson-add-; the new helper includes &create=RESOURCE before the hash, so update test to validate both type and actual opened form, not just to match a stale URL.
- Persisted cross-type lesson item order and stable ties: src/modules/courses/faculty-blueprint-sort-model.ts and its unit test exist. Ensure content-only reorders keep assessments in their authoritative slots.
- Archive exact receipt and idempotence: src/modules/courses/faculty-blueprint-archive-receipt-model.ts and row actions exist. Verify non-owned/archived row safety, dialog cancellation and unknown-outcome reload.
- DB05_CONTENT_ORDER_READY === DB05_VERIFIED is a genuine deployment-readiness gate. Do not mark drag/reorder "live" if not verified.
- Faculty cannot Rename or + Lesson on College Admin-owned shared syllabus. They intentionally remain disabled pending policy authorization. Do not bypass RBAC merely to imitate screenshot.
- Engagement footer currently links to student progress rather than providing screenshot example percentages; derive real metrics if safe/available, otherwise track as unresolved rather than fabricating numbers.
- **CI caveat**: [Faculty Blueprint acceptance run 40327245362](https://github.com/42Students/lms-vnext/actions/runs/40327245362) failed at Type-check Blueprint due to unrelated TPO TypeScript error in src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/page.tsx(76,8), TS2322. This is NOT a Blueprint browser failure; do not "fix" TPO in the Faculty lane or claim Blueprint page green. Verify latest main before retrying; use focused work if another lane owns a global failure.

## Other known evidence and gaps
- #02 Today: [run 40282276117](https://github.com/42Students/lms-vnext/actions/runs/40282276117) previously green; sidebar task category parity, weekly counts and responsive rail implemented; visual still pending.
- #03 Courses: [prototype run 40283586626](https://github.com/42Students/lms-vnext/actions/runs/40283586626) passed; expanded old-Courses run 40284030101 had failure that still needs root-cause and regression closure.
- #04 Overview: [run 40284557334](https://github.com/42Students/lms-vnext/actions/runs/40284557334) passed.
- #06 Students: four KPI cards, Behind filter, CSV export and phone/email links implemented; prior acceptance [run 40293289182](https://github.com/42Students/lms-vnext/actions/runs/40293289182) blocked by cross-lane TS; code not signed off.
- #07 Attendance: [run 40295364519](https://github.com/42Students/lms-vnext/actions/runs/40295364519) previously passed; verify latest selection/mark/scheduling after edits.
- #08 Discussions: [run 40295982638](https://github.com/42Students/lms-vnext/actions/runs/40295982638) previously passed; later modifications need retest.
- #09 unified Assignments & quizzes: [run 40295538156](https://github.com/42Students/lms-vnext/actions/runs/40295538156) previously passed; both creator buttons now open native workflows, but verify all report/deep links and privacy.
- #10 Grade: no dedicated post-change green acceptance confirmed; implemented Grade and next must navigate **only after verified grade publication**, keep private drafts and concurrency protections.
- #11 Report: [run 40298015791](https://github.com/42Students/lms-vnext/actions/runs/40298015791) previously passed, later edits require revalidation; screenshot Remind currently View student, needs product/policy decision.
- #12 Schedule: [run 40296450235](https://github.com/42Students/lms-vnext/actions/runs/40296450235) previously passed; verify bounded calendar and section-specific attendance links.
- #13 Find/Bell/Profile: [run 40296795155](https://github.com/42Students/lms-vnext/actions/runs/40296795155) had Ctrl+K focus failure. Check shortcut, Enter suggestions, bell read counts, accessibility and profile menu.
- Latest GitHub main HEAD seen while preparing handoff: 091874ff5447fc45dd588c93571c32727b72f11e; current CI run 40330106820 was in progress; concurrent commits are frequent, so refresh HEAD and CI first.

## What the next chat must DO rather than SAY
Read the authoritative ledger, action audit #05 and original PNG. Inspect current main (fetch HEAD), reconfirm high-priority items against source, fix real authoring deep links and tests, create a post-change browser acceptance run, and update checkbox evidence in #05. Work through the remaining twelve-screen audit/closure list strictly in order, and keep the visual audit package and original references discoverable. Do not return to vague planning, random page selection, unsupported completion percentages, or repeatedly ask the user for files already in Library.

**Do not conflate** screen audit created, JSX implemented, functional browser accepted, shared CI green, and visual pixel-level signed off. They are FIVE DIFFERENT milestones.
