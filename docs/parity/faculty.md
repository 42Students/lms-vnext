# Faculty — Detailed Page Parity Spec

Legacy navigation: Courses, Contacts, Notifications, Class Schedule, All Quizzes, All Assignments, Profile.

## Page: Courses list
- [ ] Teaching assignments determine visible courses.
- [ ] Course/class context is visible.
- [ ] Course cards/list metadata matches legacy.
- [ ] Loading/empty/error states are verified.
- [ ] Navigation preserves correct class context.

## Page family: Course detail
**Legacy tabs:** Overview, Blueprint, Students, Attendance, Discussions.

### Course bootstrap / class chooser behavior
Legacy route resolves slug/numeric identifiers, validates active Faculty assignment, resolves class context, canonicalizes URL and periodically revalidates assignment.

- [ ] Course identifier/canonical URL behavior is defined.
- [ ] Active teaching assignment is authoritative.
- [ ] Faculty with multiple class assignments can select/resolve correct class.
- [ ] Revoked/remapped assignment invalidates stale page state.
- [ ] Access error and retry states match.

### Overview
- [ ] Course/class/faculty summary matches.
- [ ] Teaching progress/quick actions match.
- [ ] Relevant learner/content counts match.
- [ ] Loading/empty/error states match.

### Blueprint
- [ ] Lesson create/edit/delete.
- [ ] Lesson ordering/reordering.
- [ ] Resource/video/live-class content create/edit/delete.
- [ ] Assignment create/edit/delete.
- [ ] Quiz create/edit/delete.
- [ ] Scheduling/visibility controls.
- [ ] Content validation and destructive confirmations.
- [ ] Empty and partial-content states.
- [ ] File/video storage-dependent actions remain explicit BLOCKED items until live.

### Students
- [ ] Class roster fields match.
- [ ] Search/filter behavior matches.
- [ ] Learner detail/profile drill-in behavior is accounted for.
- [ ] Empty/loading/error states.
- [ ] Roster cannot expose another class.

### Attendance
- [ ] Calendar/grid and session selection match.
- [ ] Present/absent marking flow matches.
- [ ] Retroactive correction policy is enforced.
- [ ] Student/session detail overlay is represented where legacy exposes it.
- [ ] Eligibility/percentage summary matches.
- [ ] Loading/no-session/error states.
- [ ] Audit metadata for corrections is preserved.

### Discussions
- [ ] Feed/read behavior matches.
- [ ] Faculty post/reply/moderation actions match.
- [ ] Empty/loading/error states.
- [ ] Course/class isolation.

## Page: Contacts
**Legacy:** `/teacher/contacts/[contactsTab]`  
Tabs: All Contacts, Teachers, Students.

- [ ] All Contacts tab fields/columns match.
- [ ] Teachers tab fields/columns match.
- [ ] Students tab fields/columns match.
- [ ] Search/filter/pagination behavior from ContactsGrid is matched.
- [ ] Contact actions/deep links are matched.
- [ ] Empty/loading/error states are verified.
- [ ] College scoping is enforced.

## Page: All Assignments
Legacy `AssignmentsContent` runs in Faculty mode.

Legacy contract:
- course filter;
- pagination;
- create assignment;
- view;
- View Submissions modal;
- Report link;
- Edit drawer;
- Delete confirmation/action;
- metrics;
- load/error/empty states.

- [ ] Aggregate assignment list scope is correct.
- [ ] Course filter/pagination match.
- [ ] Create Assignment drawer/form matches fields and validation.
- [ ] View assignment Faculty mode matches.
- [ ] View Submissions modal matches.
- [ ] Report deep link works.
- [ ] Edit assignment flow matches.
- [ ] Delete action has equivalent confirmation/consequence behavior.
- [ ] Metrics are accurate.
- [ ] Loading/error/empty states are verified.

## Page: All Quizzes
Legacy `QuizzesContent` runs in Faculty mode.

- [ ] Aggregate quiz list and course filter match.
- [ ] Pagination matches.
- [ ] Create quiz workflow matches.
- [ ] Edit quiz workflow matches.
- [ ] Delete/close lifecycle actions match.
- [ ] View submissions/attempts action matches.
- [ ] Quiz Report deep link works.
- [ ] Schedule/attempt/result-publication controls match.
- [ ] Loading/error/empty states are verified.

## Page: Class Schedule
- [ ] Faculty schedule is derived from assigned classes/courses.
- [ ] Calendar navigation matches.
- [ ] Class/course filters match.
- [ ] Session time/location/course/class context matches.
- [ ] Empty/loading/error states.
- [ ] Timezone behavior.
- [ ] Mobile list/calendar behavior.

## Page: Assignment Report
**Legacy:** `/teacher/report/assignment/[contentId]`

- [ ] Assignment title/course/class summary matches.
- [ ] Submission counts match.
- [ ] Learner submission table/list matches.
- [ ] On-time vs late breakdown matches.
- [ ] Score distribution matches.
- [ ] Not-submitted learners are visible.
- [ ] Submission detail/grading drill-in matches.
- [ ] Empty/loading/error states.
- [ ] Wrong-course/wrong-faculty access is fenced.

## Page: Quiz Report
**Legacy:** `/teacher/report/quiz/[quizId]`

- [ ] Quiz summary and attempt counts match.
- [ ] Learner attempt/result table matches.
- [ ] Score/response analytics present in legacy are accounted for.
- [ ] Result publication state is visible.
- [ ] Attempt detail drill-in matches.
- [ ] Empty/loading/error states.
- [ ] Access is class/faculty scoped.

## Page: Notifications
- [ ] Faculty announcements/personal notifications match legacy feed.
- [ ] Read/unread/deep-link behavior is verified.
- [ ] Empty/loading/error/stale states.
- [ ] College and role scoping.

## Page: Faculty Profile
Audited shared Faculty-profile sections:
- user summary/profile image/completeness;
- resume;
- contacts, social, address, personal details, identity;
- Aadhaar/PAN;
- experience;
- education;
- skills;
- certifications;
- languages;
- publications;
- awards;
- metadata;
- deep-link section scrolling;
- partial-section failure tolerance.

- [ ] User summary/profile image edit behavior matches.
- [ ] Profile completeness refresh matches.
- [ ] Resume upload/import/remove matches.
- [ ] Contacts edit.
- [ ] Social edit.
- [ ] Address edit.
- [ ] Personal details edit.
- [ ] Identity edit + Aadhaar/PAN storage flow.
- [ ] Experience add/edit/delete.
- [ ] Education add/edit/delete.
- [ ] Skills add/edit/delete/proficiency.
- [ ] Certifications add/edit/delete.
- [ ] Languages add/edit/delete.
- [ ] Publications add/edit/delete.
- [ ] Awards add/edit/delete.
- [ ] Metadata edit.
- [ ] Partial endpoint failures do not blank unrelated sections.
- [ ] Loading/hard-error/retry/visibility-refresh behavior matches.
- [ ] Learner/Admin/Mentor/TPO role misroutes are safely redirected/fenced.

## Retired route: File Explorer
Legacy `/teacher/fileExplorer` only redirects to Courses.

- [x] Classified RETIRED in master matrix; do not recreate as a product page.
