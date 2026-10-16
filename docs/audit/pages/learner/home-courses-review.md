# Round R review: Learner / home-courses + course-detail

Reviewer: Claude Sonnet 5.5 (Round R, read-only). Covers both Round A files: `docs/audit/pages/learner/home-courses.md` (23 gaps, `LEARNER-home-courses-01..23`) and `docs/audit/pages/learner/course-detail.md` (20 gaps, `LEARNER-course-detail-01..20`).

**Summary: Round A gaps 43 | CONFIRMED 41 | WRONG 1 | SEVERITY-CHANGE 1 | MISSED 5 | discrepancy rate = (5 + 1 + 1) / (43 + 5) = 14.6 %.**

Method and baseline. I audited independently first (legacy `lms2-fe` and `lms` at `lms-dev-2026`, read with `git show lms-dev-2026:<path>`; vNext at origin/main 9fed47ec4) and only then opened the two Round A files. Since the Round A baseline (2df619fd6) no commit has touched `src/components/courses`, `src/modules/courses`, `src/app/(authenticated)/learn`, `src/app/api/courses` or learner navigation except recruiter-only shell edits, so Round A gaps are still judged against current main. The chat-7 learner work is already reflected in Round A.

Legacy abbreviations: `LFE/` = `lms2-fe/src/`, `LBE/` = `lms/src/main/java/com/_42students/lms/`. vNext paths are repo-relative.

Independent findings that matched Round A (so the Round A audit is trustworthy on these): landing on `/dashboard` instead of Courses; semester list; academic-setup messages; list error copy; N+1 workspace loads; 404 for unknown tab/course; static browser title; announcements source; discussion draft guard and own-pinned delete; late assignment submission; single-material resources; live session card; missing authored duration; row detail; lesson page; empty-state copy.

## 1. Round A gap verdicts

| Round A gap ID | Verdict | Note |
|---|---|---|
| LEARNER-home-courses-01 | CONFIRMED | Login `next` is `/dashboard` (`src/app/api/auth/login/verify/route.ts:88`, `login-form.tsx:141`); pure learner nav has no dashboard item (`shell-model.ts:304-312`) and `dashboard/page.tsx` has no learner redirect. Legacy home is `/learn/courses` (`LFE/config/roles.js`). |
| LEARNER-home-courses-02 | CONFIRMED | Periods derive from rows (`learner-course-list.tsx:77-94`). Legacy lists all program semesters (`CoursesContent.jsx:296-300`). Arguably S4 because past enrolled semesters are an intentional improvement; leave S3. |
| LEARNER-home-courses-03 | CONFIRMED | `courseListingUtils.js:61-72` messages vs one generic empty state (`learner-course-list.tsx:137-144`). |
| LEARNER-home-courses-04 | CONFIRMED | Static chips only (`learner-course-list.tsx:276-300`); no popovers. |
| LEARNER-home-courses-05 | CONFIRMED | Generic `Elective` badge, invented description fallback (`learner-course-list.tsx:350-364`). |
| LEARNER-home-courses-06 | CONFIRMED | Copy only. |
| LEARNER-home-courses-07 | CONFIRMED | `learner-course-card-search-model.ts` has no batch or academic year. |
| LEARNER-home-courses-08 | CONFIRMED | `page.tsx:24-41` runs a full workspace per delivery inside `Promise.all`. See also MISSED `LEARNER-home-courses-R01`. |
| LEARNER-home-courses-09 | CONFIRMED | `learn/courses/error.tsx` title `Could not load course` serves the list too. |
| LEARNER-home-courses-10 | SEVERITY-CHANGE S3 -> S4 | The 404 versus in-shell `Course unavailable` panel is real, but it only appears for a course the learner cannot open (forged or stale URL). The "locked/unavailable reason on cards" half is dead legacy code: the backend never emits lock flags for courses or lesson content (`git grep lockReason|isLocked|prerequisite` on `lms-dev-2026` finds only group-member locks), and unpublished courses are filtered out of the legacy list. Detail in section 4. |
| LEARNER-home-courses-11 | CONFIRMED | `learnerCourseTabPath` returns null -> `notFound()`; legacy redirects to `/home` keeping the query (`[...courseTab].js:101-108`). |
| LEARNER-home-courses-12 | CONFIRMED | `page-titles.ts:81-82` returns `Courses` for every `/learn/*` path; legacy `{course} · {tab}` (`CourseTabsLayout.js:39-47`). Tab links also drop all query params (legacy drops only `lesson|content|filter`). |
| LEARNER-home-courses-13 | CONFIRMED | Eyebrow is extra copy. |
| LEARNER-home-courses-14 | CONFIRMED | Source differs (non-learner discussion posts versus GENERAL notifications by class and course: `useCourseHomeWidgets.js:92-124`, `NotificationController.getNotifications`). Severity depends on whether vNext has another course-announcement path, see UNCONFIRMED U1. |
| LEARNER-home-courses-15 | CONFIRMED | Copy only. |
| LEARNER-home-courses-16 | CONFIRMED | Copy and layout. |
| LEARNER-home-courses-17 | WRONG (largely) | vNext does have the states: `LearnerCourseAttendanceState` includes `SCHEDULED` and `NOT_MARKED` (`src/modules/attendance/learner-course-attendance-summary-model.ts:2`), the learner service emits `SCHEDULED` (`src/modules/attendance/learner-service.ts:159`) and the table renders `label(status)` -> `Scheduled` / `Not marked` (`learner-course-attendance.tsx:59-66,466-472`). Only the separate `Day` column (S4) is genuinely absent. |
| LEARNER-home-courses-18 | CONFIRMED | `page.tsx` loads the whole historical attendance workspace then filters by month in the browser. |
| LEARNER-home-courses-19 | CONFIRMED | Copy, native `window.confirm` (`learner-course-discussion.tsx:276`) versus legacy modal. |
| LEARNER-home-courses-20 | CONFIRMED | Delete hidden for own pinned message: `(moderate \|\| !row.item.pinned)`; legacy `ClassroomServiceImpl.deleteMessage` allows own always. |
| LEARNER-home-courses-21 | CONFIRMED | No `beforeunload` or route guard anywhere in the discussion component (legacy `classroom.js:281-302`). |
| LEARNER-home-courses-22 | CONFIRMED | Fixed 15 s poll (`learner-course-discussion.tsx:153-165`); legacy tunable `ui.chatPollIntervalMs` via `ClientSettingsController`. |
| LEARNER-home-courses-23 | CONFIRMED | Placeholder text versus hidden card. |
| LEARNER-course-detail-01 | CONFIRMED | Independently found. Legacy dev and prod both throw `Submission deadline has passed` and require a deadline (`LBE/service/impl/AssignmentServiceImpl.java:511-516`; prod-2026 same file L487-499). vNext `assignment-submission-service.ts:209-211` claims "legacy parity" and the card says `late submission is still allowed` (`learner-course-workspace.tsx:446-451`). Keep S2; it is a faculty-visible rule change, not cosmetic. |
| LEARNER-course-detail-02 | CONFIRMED | `learner-course-workspace.tsx:410-417` renders `No deadline`; legacy blocks. |
| LEARNER-course-detail-03 | CONFIRMED | `AssignmentCard` renders `description` only (L404-408). |
| LEARNER-course-detail-04 | CONFIRMED (legacy side re-read; vNext submission control not re-read) | Legacy `ViewAssignmentModal.jsx:135-138` + allowed-types chips. |
| LEARNER-course-detail-05 | CONFIRMED (legacy side only) | |
| LEARNER-course-detail-06 | CONFIRMED | `AssignmentCard` shows submitted date, grade and file list but never `submissionText`/`submissionUrl` (L418-450). |
| LEARNER-course-detail-07 | CONFIRMED | Independently found (my R-12). `ContentItem` has one `externalUrl` or `storageKey` plus plain `notes` (`learner-course-service.ts:625-634`, `learner-course-workspace.tsx:294-333`) versus legacy `resource_materials[]` (`resource.js:62-64`). |
| LEARNER-course-detail-08 | CONFIRMED | Mark complete only when `interaction.canMarkComplete` and, for live, after end (`learner-course-workspace.tsx:335-343`, `progress-service.ts:406-415`). |
| LEARNER-course-detail-09 | CONFIRMED | See also MISSED `LEARNER-course-detail-R03` (link withheld before start). |
| LEARNER-course-detail-10 | CONFIRMED | Legacy plays `file_dto.cloud_storage_object` or `link` directly (`video.js:28-32`); vNext requires a registered learner video (`learner-video-player.tsx:121-130`). Keep S2 with the S1 escalation condition. |
| LEARNER-course-detail-11 | CONFIRMED | `progress-service.ts:367-374` throws `CONTENT_DURATION_REQUIRED`. Made worse by MISSED `LEARNER-course-detail-R02` (the authoring default). |
| LEARNER-course-detail-12 | CONFIRMED | The finished-YouTube sub-claim is right (vNext seeks `initialPositionSeconds` regardless of completion). The broader resume semantics are MISSED `LEARNER-course-detail-R01`. |
| LEARNER-course-detail-13 | CONFIRMED | |
| LEARNER-course-detail-14 | CONFIRMED | `learner-roadmap-item-dialog.tsx:33` row shows `{kind} · {progress}` only. |
| LEARNER-course-detail-15 | CONFIRMED | First lesson opens by default (`learner-course-workspace.tsx:807-810`); legacy marks the first unfinished lesson `Continue here`. |
| LEARNER-course-detail-16 | CONFIRMED | Worth knowing: in legacy `setLesson()` is defined but never called, so the lesson page opens only through a `?lesson=` deep link; but every Overview CTA (`Next up`, `Open task`, recent updates) is such a link (`Home.js:146-166`, `syllabus.js:769-808`), so the lesson page is the normal landing for "Continue". S3 stays. |
| LEARNER-course-detail-17 | CONFIRMED | Quiz attempt internals belong to the learner quizzes slug. |
| LEARNER-course-detail-18 | CONFIRMED (S4) | The locked half is dormant (backend never sets lock flags, see home-courses-10). The deep-link toasts (`Lesson not found`, `Content unavailable`) are the real, small gap. |
| LEARNER-course-detail-19 | CONFIRMED | |
| LEARNER-course-detail-20 | CONFIRMED | |

Totals: CONFIRMED 41, WRONG 1, SEVERITY-CHANGE 1.

## 2. MISSED gaps

| ID | Gap | Type | Severity | Legacy evidence | vNext evidence |
|---|---|---|---|---|---|
| LEARNER-course-detail-R01 | **Resume point is a high-water mark, not where the learner stopped.** vNext stores `greatest(existing, new)`, so rewatching an earlier part never moves the saved position back, and a completed video re-opens at its last second (seek is clamped to `duration - 1`) with saves disabled once completed. Legacy saves the actual current position every save and the YouTube player restarts from 0 when finished (`resumeAt = !finished && position > 5 ? position : 0`). Net effect: a learner who rewinds to revise a section is always dropped back at their furthest point. | STATE / VALIDATION | S3 | `LFE/pages/Dashboard/course/syllabus/video.js:22-26,82,206`; `youtube.js:63-70`; `LBE/service/impl/LearnerContentProgressServiceImpl.java:166-188` (overwrites `lastPositionSeconds`) | `src/modules/courses/progress-service.ts:230-238` (`greatest(...)`); `learner-video-player.tsx:46,150-157`; `learner-youtube-player.tsx:203-221,276-283` |
| LEARNER-course-detail-R02 | **Faculty authoring pre-fills a 300 s duration for VIDEO and YOUTUBE.** Completion is computed at 90 % of the authored duration (`progress-service.ts:33,386-391`), so any video longer than 5 minutes whose author left the default completes after about 270 s of position, and the player label reads `Saved at m:ss / 5:00`. Legacy took the authored duration only when present and otherwise used the real player duration, so completion was always against the true length. Together with Round A `-11` the duration is either missing (cannot complete) or silently wrong (completes early). | VALIDATION | S2 | `LBE/.../LearnerContentProgressServiceImpl.java:99-125,283-305`; `video.js:80-94`; `youtube.js:93-99` | `src/components/courses/faculty-lesson-authoring.tsx:87,111`; `faculty-content-editor.tsx:32,40,50`; `learner-course-workspace.tsx:262-268,281-287` |
| LEARNER-course-detail-R03 | **Live session link is withheld from learners until the start time.** vNext nulls `externalUrl` and `storageKey` while `availability === "SCHEDULED"`, so a learner sees only `Available {time}` and cannot open or copy the meeting link early. Legacy shows `Join Meeting` and `Copy meeting link` from the moment the session exists (only `ended` disables it for learners). Also affects any content with `startsAt`. | STATE / MISSING-ACTION | S3 | `LFE/pages/Dashboard/course/syllabus/liveclass.js:110-112,185-214` | `src/modules/courses/learner-course-service.ts:734-755`; `learner-course-workspace.tsx:245-250` |
| LEARNER-course-detail-R04 | **Opening a resource file runs the whole learner workspace query.** The file route calls `getLearnerCourseWorkspace` (lessons, assignments, quizzes, progress) to find one content row, for every Open, Download and Range request, and streams bytes through the app server. Legacy resolved one material and returned a 15-minute signed R2 URL. | PERFORMANCE | S3 | `LBE/controller/ResourceFileController.java:41-127` | `src/app/api/courses/deliveries/[deliveryId]/contents/[contentId]/file/route.ts:55-80` |
| LEARNER-home-courses-R01 | **One bad course takes down the whole Courses list; no per-card degradation.** The list is a single `Promise.all` over per-delivery workspace loads, so one delivery whose workspace throws sends the learner to the segment error page. Legacy normalises each record and keeps the page: malformed rows render as `Invalid course record N` / `Duplicate course mapping N` / `Course name unavailable` unavailable cards with a banner `Some course records have incomplete or duplicate information. Unavailable cards cannot be opened.` and `Retry` per semester switch. Distinct from Round A `-08` (cost) and `-09` (copy). | STATE | S3 | `LFE/utils/courseListingUtils.js:75-123`; `CoursesContent.jsx:155-176,483-488` | `src/app/(authenticated)/learn/courses/page.tsx:23-93` |

## 3. Intentional differences confirmed (not gaps)
- Server-side integrity of progress: vNext refuses client-asserted completion for timed content and recomputes on the server (`progress-service.ts:361-374`); legacy only partially closed this (`LearnerContentProgressServiceImpl.java:88-116`). Keep.
- Same-origin check on the progress PUT (`api/courses/progress/[contentId]/route.ts:41-49`), tenant-scoped reads, HTTPS-only external links.
- Past-semester delivery is browseable read-only; extra filters (progress, term access, sort), overview metrics and learning-path preview; reply and paged discussion history; IST-fixed attendance months.

## 4. Detail for WRONG and SEVERITY-CHANGE
- **home-courses-17 (WRONG).** Round A wrote that vNext "has no `Scheduled` row state for future sessions" and that `Not marked` was UNCONFIRMED. The summary model (`learner-course-attendance-summary-model.ts:2-9`) defines both states, `learner-service.ts:159` produces `SCHEDULED`, and `label()` in `learner-course-attendance.tsx:59-66` turns them into `Scheduled` and `Not marked`; `held` correctly excludes `SCHEDULED` and the percentage excludes `NOT_MARKED`. Remaining difference: legacy shows a `Day` column; severity S4.
- **home-courses-10 (S3 -> S4).** Reachable only for a URL the learner is not entitled to or that is stale; normal navigation never produces it. The "locked/unavailable card" part describes a feature the legacy backend never drives. Keep the 404-versus-panel difference at S4 and drop the lock/unavailable-card wording from the fix scope.

## 5. UNCONFIRMED and how to confirm (batch for the live check on the dev site)

| # | Item | How to confirm |
|---|---|---|
| U1 | Whether vNext has any course-scoped announcement path that reaches the Overview (Round A `home-courses-14`, S2 depends on it). | On the dev site, as faculty post a course/section announcement via the announcements module and via Discussions; as a learner of that section open Overview > Recent updates and `learn/notifications`. In legacy (or in the dump of `notifications` rows with `course_id` + `class_id`, `notification_type` null/`GENERAL`) identify which faculty action creates them. |
| U2 | Whether migrated NSRIT videos and YouTube items carry `lesson_contents.duration_seconds` and registered video assets (gates `course-detail-10`, `-11`, `-R02`; S1 if not). | Query the dev DB: `select content_type, count(*), count(duration_seconds), count(storage_key) from lesson_contents where content_type in ('VIDEO','YOUTUBE') group by 1;` then open one migrated lecture as the NSRIT learner and watch past 90 %. |
| U3 | Native `<video controls>` playback-speed menu on the target browsers (Round A `-12`, S4). | Chrome, Edge, Safari and Android Chrome on the dev site: open the overflow menu of a lesson video. |
| U4 | Real behaviour of `-R01`: after rewinding and pausing at 2:00 on a video previously watched to 20:00, reload and read the resume point. | Dev site, any VIDEO item, check `learner_content_progress.last_position_seconds` before and after. |
| U5 | Multi-material legacy resources in the migrated data (gates `course-detail-07` severity). | Count legacy `lesson_contents` of type `resource` whose `content_data_dto.resource_materials` has more than one element on the old LMS dev DB; compare with what the migration wrote to `lesson_content_materials`. |
| U6 | Whether the owner wants late assignment submission (`course-detail-01`): vNext comments say "legacy parity" but both legacy branches reject. | Owner decision; evidence is in section 1. |
