# Learner — Detailed Page Parity Spec

Legacy navigation: Courses, Quizzes, Assignments, Class Schedule, Attendance, My Placements, Projects, Notifications, Profile.

## Clone-first learner naming and route lock

The legacy learner information architecture is canonical in vNext. Use the exact legacy sidebar labels and canonical routes before deeper page reconstruction. Do not rename learner surfaces to vNext alternatives such as "My Courses", "/learn/quizzes", "/learn/assignments", "/learn/placements", or a shared "/notifications" entry. Those older vNext routes may exist only as compatibility redirects.

Layer-0/Layer-1 shell parity materializes the sidebar, legacy route tree and nested Course/Placement/Project navigation. It does **not** close the deeper checklists below; each page still needs section/action/modal/state/backend verification.

## Page: Courses list
**Legacy route:** `/learn/courses`  
**vNext:** `/learn/courses`

Legacy contract:
- course cards for the learner's enrolled/active courses;
- course name/code/context and progress/continue-learning signal;
- navigation into course detail;
- shape-matched loading, empty and request-failure states.

Closure checklist:
- [x] Course list membership/enrollment scope exactly matches legacy expectations.
- [x] Course card metadata and progress/continue-learning information are present.
- [x] Course click/deep-link behavior lands on the correct delivery/course context.
- [x] Loading, empty and error states are explicitly implemented.
- [x] Unauthorized/non-learner access is fenced server-side.
- [ ] Mobile card/list behavior is browser-verified.
- [x] Historical semester courses remain browseable and are explicitly read-only.
- [ ] Regression coverage executes successfully.

## Page family: Course detail
**Legacy routes:** `/learn/courses/[courseId]`, `/learn/courses/[courseId]/[...courseTab]`  
**Legacy tabs:** Overview, Learning Path, Attendance, Discussions.

### Overview
Legacy contract:
- course identity/teacher/class context;
- course summary and learner progress;
- obvious route into the next learning item;
- correct not-found/access-error behavior.

- [x] Overview content is compared section-by-section: About/learning takeaways, faculty/class context, next action, progress, upcoming assessments/live sessions, and course-team updates are represented. Exact faculty-side announcement authoring UI is tracked in the Faculty parity pass.
- [x] Class/course context cannot leak another section's data.
- [x] Continue/next-learning action matches the learner's real progress.
- [x] Loading/not-found/access-error states are implemented.

### Learning Path
Legacy contract:
- ordered lessons;
- lesson expand/collapse;
- content rows for video/resource/live class/assignment/quiz;
- locked/scheduled/available/completed state;
- content open/play/read actions;
- assignment/quiz interaction and progress refresh.

- [x] Lesson ordering and grouping match.
- [x] Expand/collapse state and deep links work.
- [x] Every legacy content type has a vNext representation.
- [x] Availability/schedule/locked/completed states are represented and future live-class URLs are withheld.
- [ ] Video/resource/live-class actions are implemented end-to-end: YouTube progress, authenticated range-capable Cloud Storage video streaming, protected resource open/download and scheduled live-class links are wired. Final browser verification still requires a configured GCS bucket.
- [x] Assignment submit/view state is verified including late submission.
- [x] Quiz attempt/result state is implemented with attempt/deadline/result policy.
- [x] Progress updates without stale cross-lesson state are protected by monotonic progress writes.
- [x] Empty and partial-content states are implemented.

### Attendance tab
Legacy contract:
- course/class attendance summary;
- session/day detail;
- present/absent/percentage presentation;
- no-data and error states.

- [x] Course-level attendance domain exists.
- [x] Attendance summary and percentage are implemented.
- [x] Session/day detail is implemented.
- [x] No-data/error/loading states are implemented.
- [x] Learner cannot mutate attendance.

### Discussions tab
Legacy contract:
- classroom discussion feed;
- post/reply interaction where allowed;
- author/time context;
- empty/loading/error states;
- class/course isolation.

- [x] Discussion read model exists.
- [x] Create/delete-own actions match the learner permissions of the legacy flat discussion feed.
- [x] Author/time/Faculty context is preserved.
- [x] Empty/loading/error states are implemented.
- [x] Cross-class isolation is covered by integration regression tests.

## Page: All Assignments
**Legacy:** `/learn/allAssignments`  
**vNext:** `/learn/allAssignments`

Legacy contract audited from `AssignmentsContent`:
- page header;
- aggregate assignment list across courses;
- course filter;
- pagination;
- course/created/due metadata;
- learner states: Not submitted, Due soon, Overdue + late submission allowed, Submitted, Submitted late, Graded;
- primary card action to view/submit;
- assignment submission/view drawer;
- metrics/summary pills;
- loading skeleton, request error, zero-assignments and filtered-empty states.

- [ ] Aggregate list includes every published assignment in learner scope.
- [ ] Course filter behaves like legacy and resets pagination appropriately.
- [ ] Pagination/large-list behavior is verified.
- [ ] Due-date and all learner state labels are equivalent.
- [x] Published overdue assignments remain submittable.
- [ ] Submission/view interaction has full legacy field/validation parity.
- [ ] Grade visibility is masked until published.
- [ ] Metrics are semantically equivalent, not misleading page-only counts.
- [ ] Loading/error/first-run/filtered-empty states are verified.
- [ ] Deep link from aggregate list to actionable assignment is verified.
- [ ] Mobile behavior is verified.

## Page: All Quizzes
**Legacy:** `/learn/allQuizzes`  
**vNext:** `/learn/allQuizzes`

Legacy contract:
- aggregate published quizzes across courses;
- course filter + pagination;
- attempt/result state;
- due/close timing;
- primary open/take/view-result action;
- loading/error/empty states.

- [ ] Aggregate list scope matches legacy.
- [ ] Course filter and pagination match.
- [ ] Not attempted / attempted / missed / result-published states are verified.
- [ ] Attempt limit and close/deadline behavior match.
- [ ] Deep link opens the correct quiz.
- [ ] Loading/error/empty/filtered-empty states are verified.
- [ ] Mobile behavior is verified.

## Page: Standalone Quiz Attempt
**Legacy:** `/quiz`

Legacy contract:
- full-screen/no-layout attempt experience;
- question navigation;
- answer state;
- submit/confirm;
- result/error handling;
- inline error boundary with retry.

- [ ] Question rendering supports all legacy question types actually used.
- [ ] Previous/next/question navigation is preserved.
- [ ] Answer state survives expected navigation.
- [ ] Attempt/submission confirmation and one-shot protections match.
- [ ] Result visibility follows publish policy.
- [ ] Fatal render/request error gives a recoverable retry state.
- [ ] Browser refresh/back behavior is defined and tested.

## Page: Class Schedule
**Legacy:** `/learn/calendar`

Legacy contract:
- learner class schedule;
- course/class filtering where exposed;
- calendar navigation/current period;
- session details;
- loading/empty/error.

- [x] Derive schedule only from learner's active section(s); no arbitrary section-id access.
- [x] Calendar/date navigation is implemented.
- [x] Course/class filters match legacy.
- [x] Session title/time/course/faculty/location details are represented.
- [x] Today/upcoming cues are equivalent.
- [x] Loading/no-sessions/error states are implemented.
- [x] Timezone/date handling is implemented with browser-local calendar grouping and offset-aware persisted timestamps.
- [ ] Mobile calendar/list fallback is browser-verified.
- [ ] Regression coverage executes successfully.

## Page: Attendance Summary
**Legacy:** `/learn/attendance`

- [x] Overall attendance summary exists.
- [x] Per-course attendance breakdown exists.
- [x] Eligibility/threshold messaging matches configured policy where legacy shows it.
- [x] Present/absent/session totals are correct.
- [ ] Empty/loading/error states are implemented.
- [x] Learner view is read-only and tenant scoped.
- [ ] Attendance regression coverage is authored but must actually execute successfully in CI/browser verification.

# My Placements

## Page: Placements Home
**Legacy:** `/learn/my-placements`

Legacy contract includes:
- hero/next action;
- placement funnel/status breakdown;
- applications/offers metrics;
- "needs attention" assessments/interviews;
- rolling career-calendar preview;
- first-run vs failure distinction;
- navigation into jobs/applications/assessments/interviews/calendar.

- [ ] Hero/next-action logic is recreated without false urgency.
- [ ] Funnel/stage breakdown matches source states.
- [ ] Application/offer metrics use the correct denominator/time window.
- [ ] Needs-attention prioritization is reproduced.
- [ ] Calendar preview and upcoming counts are reproduced.
- [ ] First-run, partial-load and hard-error states are distinct.
- [ ] Every dashboard CTA lands on the intended filtered subpage.

## Page: Applications
**Legacy:** `/learn/my-placements/applications`

Legacy contract audited from `ApplicationsContent`:
- search with URL state/back-forward hydration;
- stage filter chips and All/In Progress/Completed views;
- sort: recent activity/stage/company;
- attention banner and offered-list CTA;
- application cards + journey visualization;
- contextual actions: assessment/interview/offer/similar roles/details;
- Application Detail modal;
- Application History modal;
- Company Preview modal;
- withdrawal-request modal with reason;
- offer accept/decline confirmation flows;
- empty/filtered-empty/loading/error states.

- [ ] Search, URL-state and browser Back/Forward behavior match.
- [ ] Stage chips and In Progress/Completed views match.
- [ ] Sort options match.
- [ ] Attention banner opens the complete relevant filtered list.
- [ ] Journey/status timeline is reproduced.
- [ ] Detail modal contains every legacy section/action.
- [ ] History modal is implemented.
- [ ] Company-data preview modal is implemented with retry/empty states.
- [ ] Withdrawal request modal/validation is implemented.
- [ ] Offer accept/decline confirmation and consequences are implemented.
- [ ] Assessment/interview/job deep links work.
- [ ] Loading/error/first-run/filtered-empty states are verified.

## Page: Assessments
**Legacy:** `/learn/my-placements/assessments`

Legacy contract:
- Pending / Completed views;
- search;
- urgency filter;
- buckets: Due today, Due this week, Later, Waiting on employer link, No deadline, Overdue;
- open external assessment;
- local "mark submitted" reminder + undo/dismiss-change behavior;
- safety notice that local marker is not employer submission;
- time-critical confirmation before leaving for provider;
- job/application navigation;
- loading/error/empty/filter-empty states.

- [ ] Pending/Completed views match.
- [ ] Search and urgency filters match.
- [ ] All urgency buckets are represented correctly.
- [ ] Employer-link unavailable state is explicit.
- [ ] External-provider launch confirmation is implemented.
- [ ] Any local reminder state is clearly non-authoritative.
- [ ] Undo/dismiss/change behavior is accounted for or intentionally redesigned.
- [ ] Job/application deep links work.
- [ ] Loading/error/empty states match.

## Page: Interviews
**Legacy:** `/learn/my-placements/interviews`

Legacy contract audited from `InterviewsContent`:
- Upcoming / Past;
- search;
- join-state countdown/live/past badges;
- Confirm;
- Join now;
- Details;
- .ics download;
- Google Calendar link;
- Request new slot;
- Cancel reschedule request;
- Decline interview;
- Interview Detail modal;
- designed confirmation modal for destructive/final actions;
- Reschedule Request modal: reason, preferred date/daypart/details;
- Reschedule Summary modal + copy;
- withdrawal-request modal;
- empty/loading/inline-error states.

- [ ] Upcoming/Past partition and countdown logic match.
- [ ] Search and highlight deep link work.
- [ ] Confirm/Join/Details actions match status gating.
- [ ] .ics and Google Calendar actions are supported or explicitly redesigned.
- [ ] Reschedule request form fields/validation match.
- [ ] Cancel-reschedule behavior is implemented.
- [ ] Decline confirmation makes consequences explicit.
- [ ] Detail modal is complete.
- [ ] Reschedule summary/copy behavior is accounted for.
- [ ] Withdrawal request is implemented.
- [ ] Loading/error/empty states are verified.

## Page: Career Calendar
**Legacy:** `/learn/my-placements/calendar`

Legacy contract:
- Agenda / Month / Week / Day modes;
- previous/today/next navigation;
- date picker;
- event-type filters;
- event chips;
- selected-event detail drawer;
- partial source failure alert + retry;
- empty calendar state.

- [ ] All four calendar modes are implemented.
- [ ] Previous/Today/Next and date picker behavior match.
- [ ] Event-type filters match.
- [ ] Event detail drawer is implemented.
- [ ] Event deep links/actions work.
- [ ] Partial-data errors do not masquerade as empty.
- [ ] Timezone handling is verified.
- [ ] Mobile agenda fallback is verified.

## Page: Jobs
**Legacy:** `/learn/my-placements/jobs`

Legacy contract:
- All drives / Saved tabs;
- search with URL state/back-forward;
- sort: deadline/newest/highest CTC;
- job-type filter;
- location filter;
- eligible-only and closing-soon toggles;
- save/unsave;
- pagination;
- not-open/closed grouping;
- deadline urgency labels;
- saved-jobs load failure distinct from all-jobs failure;
- first-run/filtered-empty states.

- [ ] Tabs, search, URL state and Back/Forward match.
- [ ] All sorts and filters match.
- [ ] Eligibility filter is based on authoritative eligibility.
- [ ] Closing-soon semantics match legacy.
- [ ] Save/unsave behavior and failure state are implemented.
- [ ] Pagination and closed/not-open grouping match.
- [ ] Deadline labels match.
- [ ] Loading/partial-failure/empty states are verified.

## Page: Job Detail
**Legacy:** `/learn/my-placements/jobs/[jobId]`

Legacy contract:
- eligibility panel;
- verified job/company details;
- apply/application-state CTA;
- navigation to Applications/Jobs;
- retry/not-found/access handling.

- [ ] Eligibility checklist/reasons match.
- [ ] Job/company/role/compensation/location/deadline details match.
- [ ] Apply/current-application state is authoritative.
- [ ] Registration/external-action requirements are represented.
- [ ] Retry/not-found/closed/not-eligible states are explicit.
- [ ] Back/navigation behavior matches.

## Page: Placement Cell
**Legacy:** `/learn/my-placements/placement`

Legacy contract audited from `PlacementCellContent`:
- debar alerts;
- registration card with choice Placements/Higher Studies/Not Interested + consent;
- Placement Rules link;
- Offers card with Accept and Decline confirmation;
- "Your rounds" with Confirm and Ask to reschedule;
- Requests list + New Request;
- request types: registration change, correction, external offer, absence dispute, offer extension;
- offer-letter/file flow where applicable;
- Notices from placement cell + dispute action;
- New Request modal;
- Reschedule modal;
- Offer acceptance preview modal;
- page-level retry/error/loading/empty.

- [ ] Registration/choice/consent workflow matches.
- [ ] Debar state is explicit and correctly scoped.
- [ ] Offers actions and confirmation consequences match.
- [ ] Round confirm/reschedule workflow matches.
- [ ] Request list and all request types are implemented.
- [ ] New Request modal dynamically shows correct fields.
- [ ] Notice dispute flow is implemented.
- [ ] Offer acceptance preview is implemented.
- [ ] Loading/error/empty states are verified.

## Page: Placement Rules
**Legacy:** `/learn/my-placements/rules`

- [ ] Back action works.
- [ ] Personal "Where you stand" note is supported.
- [ ] College placement rules summary uses authoritative current policy.
- [ ] Rule-change applicability wording is preserved.
- [ ] Loading/error/retry states are implemented.

# Projects

## Page: Projects list
- [ ] Project cards/rows expose title/status/team/mentor/progress signals present in legacy.
- [ ] Active/archived/attention states match.
- [ ] Empty/loading/error states match.
- [ ] Navigation opens the correct learner project.

## Page family: Project detail
Legacy areas include Overview, Team, Sprints/Board, Tasks, Resources, Meetings, Delivery and Activity.

- [ ] Overview narrative, goals and project status are complete.
- [ ] Team members/roles/mentor information is complete.
- [ ] Sprint list/current sprint/state matches.
- [ ] Task board/list, task detail, status changes and submissions match learner permissions.
- [ ] Resource links/files/pinned/required state match.
- [ ] Meeting list/request workflow/status/timezone handling match.
- [ ] Delivery/final submission/status/review feedback match.
- [ ] Activity/history feed matches meaningful legacy events.
- [ ] Archived/read-only behavior is enforced.
- [ ] Loading/not-found/access/error states are verified.
- [ ] Mobile task/project interaction is verified.

# Notifications

## Page: Notifications
- [ ] Announcement feed behavior matches legacy.
- [ ] Personal notification feed behavior matches legacy.
- [ ] Unread/read semantics are defined and verified.
- [ ] Deep links land on the intended learner context.
- [ ] Loading/empty/error/stale states are explicit.
- [ ] No cross-role or cross-college notifications leak.

# Profile

## Page: Learner Profile
**Legacy:** `/learn/profile`

Audited legacy sections:
- user summary;
- profile completeness;
- profile image;
- resume upload/import/remove;
- contacts;
- social profiles;
- address;
- personal details;
- identity;
- Aadhaar/PAN upload/import/replace cleanup;
- experience;
- education/qualifications;
- skills;
- learner projects;
- certifications;
- achievements;
- languages;
- extracurricular activities;
- hobbies;
- metadata;
- job preferences;
- placement academic record;
- deep-link scroll targets for contact/connect-account sections;
- partial-section failure behavior using all-settled loading.

Closure checklist:
- [ ] User summary is implemented; profile-image self-service remains BLOCKED on Cloud Storage.
- [x] Profile completeness is calculated and refreshed after edits.
- [ ] Resume upload/import/remove, validation and old-file cleanup remain BLOCKED on Cloud Storage.
- [x] Contacts edit flow is implemented.
- [x] Social profiles edit flow is implemented.
- [x] Address edit flow is implemented.
- [x] Personal details edit flow is implemented.
- [x] Identity edit flow is implemented.
- [ ] Aadhaar/PAN file upload/import/replace remains BLOCKED on secure Cloud Storage; validated masked identity-number editing is implemented.
- [x] Experience add/edit/delete is implemented.
- [x] Education add/edit/delete is implemented.
- [x] Skills add/edit/delete/proficiency is implemented.
- [x] Projects add/edit/delete is implemented.
- [x] Certifications add/edit/delete is implemented.
- [x] Achievements add/edit/delete is implemented.
- [x] Languages add/edit/delete is implemented.
- [x] Extracurricular add/edit/delete is implemented.
- [x] Hobbies edit behavior is implemented.
- [x] Metadata edit behavior is implemented.
- [x] Job Preferences edit behavior is implemented.
- [x] Placement Academic Record is shown and authoritative.
- [x] A failure in one optional profile section does not blank the entire page.
- [ ] Loading skeleton, hard-error retry and visibility-refresh behavior are verified.
- [x] Role redirect/fence behavior is server-safe.
- [x] Storage-backed items are marked BLOCKED until Cloud Storage is live rather than silently omitted.
