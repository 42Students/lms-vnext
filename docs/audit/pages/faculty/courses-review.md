# Faculty / Courses: Round R review (adversarial re-audit)

Reviewer: Round R agent (Sonnet 5.5), 2026-10-16. Round A file reviewed: `docs/audit/pages/faculty/courses.md` (gap IDs `FAC-courses-NN`, 35 gaps). Compared against current origin/main (vNext) and legacy `_hr-tpo-fe` @ lms-dev-2026 63fea105.

**Summary:** Round A gaps 35 -> CONFIRMED 31, WRONG 2, SEVERITY-CHANGE 2. MISSED 8 (`FAC-courses-R01` to `R08`). Discrepancy rate = (8 + 2 + 2) / (35 + 8) = 12 / 43 = **27.9%**.

Method note (honest disclosure). I audited independently first (list page, workspace shell, Blueprint authoring, video manager, Students, Discussions, Home signals, announcements) before opening Round A. My first legacy pass read the sibling worktree `42lms/lms-dev-2026-frontend` (HEAD 83347e29), which turned out to be an OLDER commit than lms-dev-2026 (63fea105 contains it; 54 files differ under course, syllabus, drawers, Home, classroom). I therefore re-verified every claim that decided a verdict against `_hr-tpo-fe` @ 63fea105 (CoursesContent L242-L540, liveclass.js L31-L36 and L159, youtube.js L261, AddNewLessonContentDrawer.js L43-L121, classroom.js, Home.js L196-L216 and L400-L408, new Home cards `AtRiskStudentsCard.jsx` and `PerformanceCard.jsx`, `LessonActivityCards.jsx`, `InThisCourseSection.jsx`). My independent first pass reached 17 of Round A's themes on its own (list card fields, N+1 workspace queries, no accordion or filter chips, no content preview or resource file upload, video publish chain, no Section notices backend, admin-only shared visibility). It did not reach Round A's per-string validation messages, and it missed the newer-legacy Home cards listed below until the diff step.

## 1. Round A gap verdicts

| Round A gap ID | Verdict | Note |
|---|---|---|
| FAC-courses-01 | CONFIRMED | `faculty-course-tab-navigation.tsx` L47 and workspace eyebrow `Faculty · Course` still present on main. |
| FAC-courses-02 | CONFIRMED | `faculty-course-list.tsx` has no image; `learner-course-card-image.tsx` exists and could be reused. |
| FAC-courses-03 | CONFIRMED | Batch and semester number absent; vNext adds period name. |
| FAC-courses-04 | CONFIRMED | Role chip always shown with `replaceAll("_"," ")`. |
| FAC-courses-05 | CONFIRMED | No header metric pills. |
| FAC-courses-06 | CONFIRMED | Search matches Section name and code, which softens it; S4 fine. |
| FAC-courses-07 | CONFIRMED | GET form with `Apply filters`; intentional server filtering, copy still differs. |
| FAC-courses-08 | CONFIRMED | Empty copy is `No active teaching Courses` vs legacy `No teaching assignments found. Please contact your administrator.` |
| FAC-courses-09 | CONFIRMED | `teacher/courses/page.tsx` L25-L33 calls `getFacultyCourseWorkspace` per card (up to 48), and `[deliveryId]/layout.tsx` calls `listFacultyCourseDeliveries` again on every tab. |
| FAC-courses-10 | CONFIRMED | `faculty-course-workspace.tsx` maps all lessons expanded, no accordion. |
| FAC-courses-11 | CONFIRMED | No filter chips, no `?filter=` handling, Home cards link to other pages instead. |
| FAC-courses-12 | CONFIRMED | No per-lesson page, no Previous/Next lesson. |
| FAC-courses-13 | CONFIRMED | `ContentItem` renders type, status, title, notes only; `externalUrl` (YouTube, resource link, live meeting URL) is never shown on the card. Quiz preview (legacy `QuizLessonCard` shows `Preview quiz` to faculty) absent. |
| FAC-courses-14 | SEVERITY-CHANGE (S2 to S1) | See section 3. |
| FAC-courses-15 | CONFIRMED | Manual duration default 300 (`faculty-lesson-authoring.tsx`), legacy youtube.js L261 message confirmed. |
| FAC-courses-16 | CONFIRMED | Allow-list, 12 h cap and future-start rule absent; vNext checks only HTTPS plus end after start (`faculty-live-mutation-model.ts` L34-L36). vNext also adds an overlap check and a period-window check not in legacy (see R08). |
| FAC-courses-17 | WRONG (mostly) | See section 3: vNext states IST on every live-time label. |
| FAC-courses-18 | CONFIRMED | Upload, processing, Add to lesson, Publish lesson content, Publish, Show to learners chain verified in `faculty-lesson-video-manager.tsx`. |
| FAC-courses-19 | CONFIRMED | No Points on video. |
| FAC-courses-20 | CONFIRMED | Title not editable in the manager (only duration draft). |
| FAC-courses-21 | CONFIRMED | Visibility toggle exists only for video. |
| FAC-courses-22 | CONFIRMED | `window.confirm("Delete this video?")`, `Replace this video?`. |
| FAC-courses-23 | CONFIRMED | Only the three draft-created strings plus video info strings exist. |
| FAC-courses-24 | CONFIRMED | No `beforeunload` or discard guard in `faculty-lesson-authoring.tsx`. |
| FAC-courses-25 | CONFIRMED | Intentional lifecycle, flow friction real. |
| FAC-courses-26 | CONFIRMED | Legacy strings confirmed at Home.js L204 and L216. |
| FAC-courses-27 | CONFIRMED | Legacy `Retry signals` plus the `Unknown metrics are shown as unavailable, not zero.` banner (Home.js L406-L408) have no vNext counterpart. |
| FAC-courses-28 | WRONG (partly) | See section 3: vNext has a contacts count. |
| FAC-courses-29 | CONFIRMED | |
| FAC-courses-30 | CONFIRMED (resolved the UNCONFIRMED) | Per-string check: `Write a message...`, `Enter to send · Shift+Enter for a new line`, `Start the conversation`, `Post a welcome message`, `Share this week's focus`, quick-fill drafts and delete confirm text match. Still absent: the persistent hint `Students can post questions here anytime...` and the pin confirm in legacy is absent, vNext adds `Pin this Section message?`. Residual severity S4 stands. |
| FAC-courses-31 | CONFIRMED | `discussions/page.tsx` shows `Section notices (unavailable)`. |
| FAC-courses-32 | CONFIRMED | Legacy faculty workspace has no announcements: `Home.js` gates the activity list to learners, and `AnnouncementController` create/update/delete is only called from admin screens. Not a legacy page. |
| FAC-courses-33 | SEVERITY-CHANGE (S3 to S4) | See section 3. |
| FAC-courses-34 | CONFIRMED (UNCONFIRMED at 375px) | Needs live check. |
| FAC-courses-35 | CONFIRMED (UNCONFIRMED) | vNext lessons do use `<h2>`/`<h3>`; the claim about heading structure of item actions needs an a11y pass. Keep S4. |

## 2. MISSED gaps (not in Round A)

| ID | Gap | Type | Severity | Legacy evidence | vNext evidence |
|---|---|---|---|---|---|
| FAC-courses-R01 | At-risk Students on Overview is a flat list (name plus reasons). Legacy card has a `N critical` / `N moderate` breakdown, a per-student snapshot popover (Attendance bar %, `Submissions missing`, `Average grade` bar, critical pill, `View students`), and an empty state `No major learner risk signals`. | MISSING-FIELD | S3 | FE:components/Course/Home/AtRiskStudentsCard.jsx L56-L182 (new in 63fea105) | faculty-course-home-signals.tsx L146-L170 (name, reasons, top 5 only); model has `attendancePercent` (faculty-course-home-model.ts L148) but it is not rendered |
| FAC-courses-R02 | Performance card lacks the insight lines (`{content} is the weakest spot right now, averaging N% across K graded submissions` and strongest, gated at 3 graded), per-bucket student drill-down (`ScoreDistributionBars studentsByLabel`), `Grade a few submissions to see the class's score spread here.` and the `View all assessments` CTA. vNext renders non-interactive bars only. | MISSING-FIELD | S3 | FE:components/Course/Home/PerformanceCard.jsx L7-L96 | faculty-course-home-signals.tsx L172-L214 |
| FAC-courses-R03 | Overview intro card omits `N Credits` and instructor name (legacy `InThisCourseSection` shows credits and instructor as real content, even with no body text). | MISSING-FIELD | S3 | FE:components/Course/Home/InThisCourseSection.jsx L25-L26, L44-L47, L80-L87; Home.js passes `credits`, `instructor` | course-display-read-only.tsx (no credit or instructor); `listFacultyCourseDeliveries` already selects `credits` (faculty-course-service.ts L73) |
| FAC-courses-R04 | User-visible internal or migration jargon on faculty screens: Overview line `N students currently match the legacy risk rules.`, card `Exact teaching assignment` with `grants teaching access only to this Section delivery` and `remain structurally admin-owned`, `Shared Offering`, `This Section`. Legacy faculty never sees these terms. Conflicts with the exact-wording rule. | COPY | S3 | FE:Home.js (no such text) | faculty-course-home-signals.tsx L150; faculty-course-workspace.tsx L400-L430, `audienceLabel` L46-L50 |
| FAC-courses-R05 | No unsent-draft guard in Discussions: legacy blocks reload and route change while a message is drafted (`Discard your unsent discussion message?`). | STATE | S4 | FE:pages/Dashboard/course/Classroom/classroom.js (beforeUnload plus `routeChangeStart` effect, new in 63fea105) | learner-course-discussion.tsx (no beforeunload; only delete and pin confirms) |
| FAC-courses-R06 | Discussions refresh failure handling: legacy keeps the last loaded messages and shows `Could not refresh the discussion. Showing the last messages we loaded.` (and `Discussion refresh failed`), and polls with a `since` cursor (delta merge, deleted ids dropped). vNext only has a full `loadError` state and no stale-data banner. | STATE | S4 | FE:classroom.js (`refreshError`, `cursorRef`, `mergeChanges`, `changesOnly`) | learner-course-discussion.tsx L61-L146 |
| FAC-courses-R07 | Lesson-form live class: any validation failure surfaces as one generic message `Check the meeting title, secure HTTPS link, start/end times and selected live class.`; legacy names the failing rule (provider list, 12 h, past start, `Must be after the start`). | VALIDATION | S3 | FE:liveclass.js L31-L36, L147, L158-L159 | faculty-live-editor-command.ts L18-L21; faculty-live-mutation-model.ts L34-L36 (`End must follow start` only) |
| FAC-courses-R08 | vNext rejects live sessions outside the academic-period window (`facultyLiveWindow`), a rule legacy never had, so sessions legacy allowed (for example before period start, or when period dates are unset or wrong) will fail on the `/teacher/live-classes` command path with the same generic message. Needs a deliberate decision (intentional guard or bug). | VALIDATION | S3 | FE:liveclass.js (no period rule) | faculty-live-mutation-service.ts L37; faculty-live-mutation-model.ts L40-L47 |

## 3. WRONG and SEVERITY-CHANGE details

- **FAC-courses-14 (S2 to S1).** Not only is the file/material UI missing: nothing in vNext uses it. `resourceMaterialsRuntimeEnabled()` (`resource-material-readiness.ts`, env `DB05_RESOURCE_MATERIALS_READY`) is referenced by no component, route or service (repo grep finds only the file itself), and `/api/courses/lesson-contents` has no upload or material endpoint. Faculty cannot hand learners a PDF, deck or spreadsheet at all; the HTTPS-link workaround needs external hosting and learners lose the per-file Open flow. This blocks the most common faculty authoring workflow, hence S1. Fix needs the DB05 schema, the upload grant, the learner `Open` route and the faculty composer (legacy max 20 materials, 50 MB each, 13 extensions, duplicate-link rejection).
- **FAC-courses-17 (WRONG, mostly).** Round A listed this as copy to verify. vNext does state IST: `Starts (IST)`, `Ends (IST)`, `Due date (IST, optional)` (`faculty-lesson-authoring.tsx` L746, L761, L781) and `Enter meeting times in IST (Asia/Kolkata), regardless of your device time zone.` (`faculty-live-class-editor.tsx` L92). Only the exact legacy sentence `Times are in India Standard Time (IST).`, the 15-minute step and 12-hour clock differ. Keep as S4 COPY, not an open question.
- **FAC-courses-28 (WRONG, partly).** The claim `no ... contacts metric` is false: `faculty-course-roster.tsx` L97-L100 and L132-L135 render tiles `Students`, `Roll missing`, `Contact available`. The remaining differences are wording (legacy `N contacts`, `N without a roll number` / `All have roll numbers`) and the avatar photo preview modal (S4, legacy has no photos in vNext). Class selector is covered by the layout Section select.
- **FAC-courses-33 (S3 to S4).** The vNext layout calls `notFound()` for a non-delivery id, so old slug or `?cls=` bookmarks 404. This only affects pre-cutover bookmarks; the vNext deployment uses new URLs anyway and a redirect map can be added at cutover. No workflow is degraded.

## 4. Checked and found NOT to be gaps (false-gap guard)

- Legacy `Visibility` (This class only / Shared to all sections) on video, YouTube and live is admin-only in 63fea105 (Round A already says so); the Resource composer gates `SHARED` on `isAdmin`. Faculty not having a shared option is parity, not a gap.
- Course content creation sends no learner notification in legacy; vNext also sends none on create. Not a gap (publish emits nothing either; UNCONFIRMED for learner-side notification on publish, see below).
- Faculty-visible announcements in the course workspace do not exist in legacy (see FAC-courses-32). The `Section notices (unavailable)` page is a vNext-only dead end.
- Student roster: sort by roll number then name, 25 per page, search over name, roll, phone, email, tel and mailto links, `Roll not assigned`, `No number`, `No email` all match vNext (`faculty-course-roster.tsx` L19, L53-L91, L245-L277).
- Discussions: pin and unpin any message, delete any (faculty) or own (learner), 15 s visibility-gated polling, `N new message(s)` jump chip, max length constant, day and sender grouping are all present.
- Tab set and order (Overview, Blueprint, Attendance, Discussions, Students) matches; unknown tabs redirect to Overview.
- Permission and scope: delivery and college scope is stricter in vNext (`requireDeliveryContentMutation`, `hasFacultyDeliveryAccess`, active membership join); no regression found.

## 5. UNCONFIRMED items and how to confirm on the deployed dev site

1. TA and CO_TEACHER authoring rights: legacy gates nothing visible by role beyond a tag; vNext `hasFacultyDeliveryAccess` is not role-specific (read of `requireDeliveryContentMutation`). Confirm with a TA test account: can they create, publish and archive content, and is that intended? Legacy behaviour also UNCONFIRMED (backend `FacultyLessonContentController`).
2. 375px layout of the course shell, Blueprint action clusters, Students table (FAC-courses-34): open `/teacher/courses/{deliveryId}/blueprint` at 375 wide.
3. Heading and landmark structure of per-item actions (FAC-courses-35): run an accessibility tree read of Blueprint.
4. Whether the lesson-form LIVE_CLASS create path also applies the academic-period window and overlap checks (R08): create a live class dated outside the period via both the lesson form and `/teacher/live-classes`.
5. Whole-page failure behaviour when lesson or workspace load partially fails: legacy shows `Could not load course lessons` and `Some course state could not be loaded ... completion/counts may be incomplete until you retry` while keeping visible content; vNext uses the route error boundary (`[deliveryId]/error.tsx`). Force a failing sub-query and compare.
6. Learner-side effect of publishing content (notification or activity feed entry) in legacy: no `notif` in `LessonContentController` lesson path, but the activity feed may derive items; confirm on the legacy dev stack by adding a resource as faculty and checking the learner Overview activity list.
7. Prod-2026 versus dev drift for the files above (Round A's own UNCONFIRMED): `git -C 42lms/_hr-tpo-fe diff origin/prod-2026 63fea105 -- src/pages/Dashboard/course src/components/Course src/components/Global/Offcanvas/Syallabus`.
8. Course list ordering: legacy order comes from `GET /api/v1/teaching-assignment/byFaculty/{id}/active` (unspecified in Round A); vNext has no explicit `orderBy` visible in the list query above. Compare ordering for a faculty with 5+ Sections.
