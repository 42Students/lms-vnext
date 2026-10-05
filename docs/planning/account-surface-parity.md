# LMS vNext — Account Surface Parity Matrix v2

**Audit date:** 2026-10-04  
**Legacy UI oracle:** `42Students/lms2-fe@prod-2026`  
**Legacy audited SHA:** `38cdd38e592a6f416c8e8e99ce36438f548ed577`  
**vNext audit baseline:** `d972ebdf4563d34a059d59c4268e1f37911925fa`  
**Mechanical route inventory:** `docs/planning/legacy-ui-route-manifest.md`  
**Detailed page/workflow specs:** `docs/parity/README.md`

This matrix is the **surface-level behavioral source of truth** for clone-first / redesign-later. The route manifest is the mechanical backstop. The account files under `docs/parity/` are the second-level closure contracts for every page's sections, tabs, actions, forms, filters, modals, drawers, states, permissions, responsive behavior and regression coverage.

A row may be marked DONE only when its user job is implemented **and** the required detailed page contract is closed.

## Audit result

The first matrix was not exhaustive enough. The deep route/navigation/section audit found:
- TPO Companies, TPO Profile and the real TPO More utility surface were absent or under-classified.
- Mentor Courses/Contacts/Quizzes/File Explorer/Profile and Faculty File Explorer are redirect stubs, not missing product pages.
- HR `/hr/colleges` is a retired redirect; the actual college chooser behavior lives on HR Home.
- TPO, Mentor and other role-specific Notifications had been overclaimed as DONE merely because a shared vNext Notifications route exists.
- TPO Settings, TPO Reports, TPO Students, TPO Drive detail, HR Drive detail, Super Admin Tenant Setup/Settings/Module Access/HR Accounts and Admin Project workspaces were represented by umbrella rows that could hide unfinished sections.
- public/shared flows — recruiter invite, company applicant share, auth handoff, AI grading, tracker/ops, marketing/legal and error surfaces — were absent from the account-only matrix.

## Status vocabulary

- **DONE** — user job and relevant route/sections/actions/states are implemented and audited.
- **PARTIAL** — meaningful vNext implementation exists, but parity is not complete.
- **MISSING** — legacy user job has no adequate vNext equivalent.
- **VERIFY** — product ownership/reachability/intent still needs an explicit decision.
- **REDESIGNED** — intentionally different vNext surface covers the full legacy user job; rationale recorded.
- **RETIRED** — intentionally not carried forward; reason recorded.
- **BLOCKED** — implementation/verification requires an external dependency.

Resolved statuses: DONE, REDESIGNED, RETIRED.  
Release-blocking statuses: PARTIAL, MISSING, VERIFY, BLOCKED.

A route existing is not enough. Closure includes sections/tabs/cards, primary and secondary actions, dialogs/drawers, loading/empty/error/permission states, workflow result, role/tenant boundaries and important responsive behavior.

---

# 1. Learner

Detailed page contract: `docs/parity/learner.md`.

| Surface | Legacy route/section | vNext mapping | Audit note | Status |
| --- | --- | --- | --- | --- |
| Courses list | `/learn/courses` | `/learn/courses` | Active Section deliveries and progress cards exist. | DONE |
| Course Overview | course `home` tab | same legacy tab route | About/takeaways, faculty/class context, next action, progress and recent course updates are implemented; authoring-side parity is tracked with Faculty. | DONE |
| Learning Path | course `roadmap` tab | course workspace | Ordered lessons/content/assessments + continue learning. | DONE |
| Course Attendance | course `attendanceDetail` | same legacy tab route | Dedicated read-only summary, threshold, session detail, responsive states and exact learner delivery scope are implemented. | DONE |
| Course Discussions | course `discussions` | same legacy tab route | Delivery-scoped feed, post/delete-own, pinned display, polling and explicit loading/empty/error states are implemented. | DONE |
| All Assignments | `/learn/allAssignments` | `/learn/allAssignments` | Dedicated aggregate page, filtering/status/deep links; late submissions aligned with legacy. | DONE |
| All Quizzes | `/learn/allQuizzes` | `/learn/allQuizzes` | Dedicated aggregate page, filtering/status/deep links. | DONE |
| Standalone quiz attempt UX | `/quiz` | inline course quiz control | Question navigation/error/result parity still needs comparison. | PARTIAL |
| Class Schedule | `/learn/calendar` | `/learn/calendar` | Course-aware Section schedule, Week/Month/Day navigation, filtering, today/next-three cues, learner-safe scope and mobile list fallback implemented; final browser/CI verification remains. | PARTIAL |
| Attendance summary | `/learn/attendance` | `/learn/attendance` | Overall + per-Course attendance, policy threshold, held/marked/unmarked semantics, month/course navigation, desktop/mobile records and tenant-safe learner scope are implemented; final executed CI/browser verification remains. | PARTIAL |
| Placements dashboard | `/learn/my-placements` | `/learn/my-placements` | Core journey exists; legacy subnavigation and sections incomplete. | PARTIAL |
| Applications | `/learn/my-placements/applications` | same legacy route shell + journey data | Dedicated applications worklist missing. | MISSING |
| Assessments | `/learn/my-placements/assessments` | same legacy route shell | Dedicated assessment queue/status missing. | MISSING |
| Interviews | `/learn/my-placements/interviews` | same legacy route shell | Dedicated interview queue/status missing. | MISSING |
| Career Calendar | `/learn/my-placements/calendar` | same legacy route shell | Placement events calendar missing. | MISSING |
| Jobs list | `/learn/my-placements/jobs` | same legacy route + placements feed | Exact browse/filter surface incomplete. | PARTIAL |
| Job detail | `/learn/my-placements/jobs/[jobId]` | same legacy route shell | Dedicated opportunity/eligibility/detail surface missing. | MISSING |
| Placement Cell | `/learn/my-placements/placement` | same legacy route shell | Placement-cell information/support surface missing. | MISSING |
| Placement Rules | `/learn/my-placements/rules` | same legacy route shell | Learner-facing rules/policy surface missing. | MISSING |
| Projects list | `/learn/projects` | same semantic route | Core list exists. | DONE |
| Project Overview | project detail | vNext project workspace | Explicit section parity needed. | PARTIAL |
| Project Team | project detail | vNext project workspace | Explicit section parity needed. | PARTIAL |
| Project Sprints / Board | project detail | vNext project workspace | Explicit section parity needed. | PARTIAL |
| Project Tasks | project detail | vNext project workspace | Explicit section parity needed. | PARTIAL |
| Project Resources | project detail | vNext project workspace | Storage-backed files remain dependency-bound. | PARTIAL |
| Project Meetings | project detail | vNext project workspace | Request/read behavior exists; exact parity pending. | PARTIAL |
| Project Delivery | project detail | vNext project workspace | Submission workflow exists; exact parity pending. | PARTIAL |
| Project Activity | project detail | vNext project workspace | Verify history/activity equivalence. | PARTIAL |
| Notifications feed | `/learn/notifications` | `/learn/notifications` | Shared route exists; legacy announcement/personal feed behavior must be audited, not assumed. | PARTIAL |
| Self Profile | `/learn/profile` | `/learn/profile` | Rich self-service profile, validated identity/contact/social/address sections, repeatable career/education sections, placement preferences and authoritative academic evidence are implemented; profile image/resume/identity-file storage and final browser/CI verification remain. | PARTIAL |
| `/learn` redirect | `/learn` | not required for greenfield bookmarks | Legacy redirect-only route; no user job lost. | RETIRED |

---

# 2. Faculty

Detailed page contract: `docs/parity/faculty.md`.

| Surface | Legacy route/section | vNext mapping | Audit note | Status |
| --- | --- | --- | --- | --- |
| Courses list | `/teacher/courses` | `/teach/courses` | Teaching list exists. | DONE |
| Course Overview | course `home` | faculty workspace | Exact overview parity pending. | PARTIAL |
| Blueprint | course `blueprint` | learning-path authoring | Core authoring exists; exact controls/states pending. | PARTIAL |
| Course Attendance | course `attendanceDetail` | none | Take/view/report attendance missing. | MISSING |
| Course Discussions | course `discussions` | none | Missing. | MISSING |
| Course Students | course `students` | no dedicated roster | Missing roster/action surface. | MISSING |
| Contacts — All | `/teacher/contacts/allContacts` | none | Missing. | MISSING |
| Contacts — Teachers | `/teacher/contacts/teachers` | none | Missing. | MISSING |
| Contacts — Students | `/teacher/contacts/students` | none | Missing. | MISSING |
| Notifications | `/teacher/notifications` | `/notifications` | Shared route exists; exact role feed behavior unverified. | PARTIAL |
| Class Schedule | `/teacher/calendar` | none | Faculty schedule + course filters missing. | MISSING |
| All Quizzes | `/teacher/allQuizzes` | per-course only | Aggregate daily-use page missing. | MISSING |
| All Assignments | `/teacher/allAssignments` | per-course only | Aggregate daily-use page missing. | MISSING |
| Assignment report | `/teacher/report/assignment/[contentId]` | inline grading | Dedicated report/analytics/submission review parity missing. | MISSING |
| Quiz report | `/teacher/report/quiz/[quizId]` | inline review | Dedicated report parity missing. | MISSING |
| Self Profile | `/teacher/profile` | admin profile tooling only | Missing self-service profile. | MISSING |
| File Explorer | `/teacher/fileExplorer` | n/a | Legacy is only a redirect to Courses; not a real product surface. | RETIRED |
| `/teacher` redirect | `/teacher` | n/a | Redirect-only legacy route. | RETIRED |

---

# 3. Mentor

Detailed page contract: `docs/parity/mentor.md`.

| Surface | Legacy route/section | vNext mapping | Audit note | Status |
| --- | --- | --- | --- | --- |
| Mentor landing / Projects-disabled state | `/mentor` | no equivalent landing | Legacy conditionally opens Projects or explains Projects is unavailable and links Notifications. | MISSING |
| Projects list | `/mentor/projects` | same | Exists. | DONE |
| Project Overview | project detail | vNext project workspace | Exact role behavior pending. | PARTIAL |
| Project Team | project detail | vNext project workspace | Exact role behavior pending. | PARTIAL |
| Project Sprints | project detail | vNext project workspace | Exact role behavior pending. | PARTIAL |
| Project Tasks / Board | project detail | vNext project workspace | Exact role behavior pending. | PARTIAL |
| Project Resources | project detail | vNext project workspace | Storage-backed files dependency remains. | PARTIAL |
| Project Meetings | project detail | vNext project workspace | Project-level lifecycle exists; exact parity pending. | PARTIAL |
| Project Delivery / review | project detail | vNext project workspace | Core review exists; exact parity pending. | PARTIAL |
| Project Activity | project detail | vNext project workspace | Verify activity/history parity. | PARTIAL |
| Global Meetings calendar | `/mentor/calendar` | none | Missing global meeting/calendar surface. | MISSING |
| Mentor Notifications | `/mentor/notifications` | shared notifications | Legacy includes pending reviews, stalled projects, upcoming/requested meetings plus broad announcements; not yet proven by shared vNext feed. | PARTIAL |
| Mentor Courses routes | `/mentor/courses/*` | n/a | Legacy redirect stubs to mentor Projects. | RETIRED |
| Mentor Contacts routes | `/mentor/contacts/*` | n/a | Legacy redirect stubs. | RETIRED |
| Mentor All Quizzes | `/mentor/allQuizzes` | n/a | Legacy redirect stub. | RETIRED |
| Mentor File Explorer | `/mentor/fileExplorer` | n/a | Legacy redirect stub. | RETIRED |
| Mentor Profile | `/mentor/profile` | n/a | Legacy redirect stub by explicit product design. | RETIRED |

---

# 4. College Admin

Detailed page contract: `docs/parity/college-admin.md`.

## 4.1 Operations

| Surface | Legacy | vNext | Audit note | Status |
| --- | --- | --- | --- | --- |
| Dashboard | `/college-admin/dashboard` | dashboard workspace | Exact command-center cards/actions parity pending. | PARTIAL |
| Activity Log | `/college-admin/audit` | `/activity` | Activity Center exists; exact filtering/detail/noise-reduction parity pending. | PARTIAL |
| Self Profile | `/college-admin/profile` | none | Missing. | MISSING |
| Placement Interview Calendar | `/college-admin/calendar` | none | This is placement/interview calendar, not academic class schedule. | MISSING |

## 4.2 Academic Setup

| Surface | Legacy | vNext | Audit note | Status |
| --- | --- | --- | --- | --- |
| Departments | `/college-admin/departments` | `/college/departments` | Core CRUD exists. | DONE |
| Programs | `/college-admin/programs` | Academics workspace | Dedicated parity surface/actions still needed under clone-first rule. | PARTIAL |
| Semesters | `/college-admin/semesters` | Academic Periods | Dedicated parity surface pending. | PARTIAL |
| Semester–Course Mapping | `/college-admin/semester-courses` | Course offerings | Dedicated mapping workflow pending. | PARTIAL |
| Batches | `/college-admin/batches` | Cohorts | Dedicated operational surface pending. | PARTIAL |
| Classes | `/college-admin/classes` | Sections | Dedicated operational surface pending. | PARTIAL |
| Batch Promotion | `/college-admin/batch-promotion` | individual progression | Bulk promotion workflow missing. | PARTIAL |
| Lecture Halls | `/college-admin/lecture-halls` | none | Missing. | MISSING |
| Electives | `/college-admin/electives` | ELECTIVE offerings | Dedicated lifecycle surface pending. | PARTIAL |
| Attendance | `/college-admin/attendance` | none | Missing admin attendance center. | MISSING |
| Section operations / schedules | class/section flows | Academics section workspace | Core vNext structure exists; exact legacy actions need audit. | PARTIAL |

## 4.3 Courses & Content

| Surface | Legacy | vNext | Audit note | Status |
| --- | --- | --- | --- | --- |
| Courses | `/college-admin/courses` | `/college/courses` | Core list exists. | DONE |
| Course detail | `/college-admin/courses/[id]` | offering workspace | Exact section/action parity pending. | PARTIAL |
| Lessons aggregate | `/college-admin/lessons` | offering workspace | Dedicated aggregate surface missing. | PARTIAL |
| Video aggregate | `/college-admin/lesson-content?type=video` | offering workspace | Dedicated surface incomplete; signed storage blocked. | PARTIAL |
| Resources aggregate | `/college-admin/lesson-content?type=resources` | offering workspace | Dedicated surface parity pending. | PARTIAL |
| Live Classes aggregate | `/college-admin/lesson-content?type=live-classes` | offering workspace | Dedicated surface parity pending. | PARTIAL |
| Assignments aggregate | `/college-admin/assignments` | offering workspace | Dedicated aggregate missing; file upload BLOCKED. | PARTIAL |
| Quizzes aggregate | `/college-admin/quizzes` | offering workspace | Dedicated aggregate missing. | PARTIAL |
| Course Progress | `/college-admin/course-progress` | course progress data | Monitoring surface missing. | PARTIAL |

## 4.4 People

| Surface | Legacy | vNext | Audit note | Status |
| --- | --- | --- | --- | --- |
| Faculty | `/college-admin/teachers` | People | Dedicated faculty surface parity pending. | PARTIAL |
| Faculty Assignment | `/college-admin/faculty-assignment` | section/course assignments | Dedicated assignment workflow parity pending. | PARTIAL |
| Students | `/college-admin/students` | People | Dedicated learner surface parity pending. | PARTIAL |
| People Directory | `/college-admin/people` | `/college/people` | Core directory exists. | DONE |
| Student Groups list | `/college-admin/student-groups` | none | Missing. | MISSING |
| Student Group detail | `/college-admin/student-groups/[id]` | none | Missing. | MISSING |

## 4.5 Placements

| Surface | Legacy | vNext | Audit note | Status |
| --- | --- | --- | --- | --- |
| Drives landing | `/college-admin/jobs` + `/college-admin/jobs/all` | placements operations | Exact tabs/filters parity pending. | PARTIAL |
| Drive Overview | job detail | vNext job workspace | Core exists; exact overview pending. | PARTIAL |
| Applications | `/college-admin/jobs/[jobId]/applications` | embedded job workspace | Dedicated workflow parity pending. | PARTIAL |
| Interviews | `/college-admin/jobs/[jobId]/interviews` | rounds | Dedicated interview surface pending. | PARTIAL |
| Shortlisted | `/college-admin/jobs/[jobId]/shortlisted` | screening state | Dedicated shortlist surface pending. | PARTIAL |
| Job Settings | `/college-admin/jobs/[jobId]/settings` | lifecycle/edit controls | Exact settings surface pending. | PARTIAL |
| Companies | `/college-admin/companies` | employer relationships | Dedicated company surface pending. | PARTIAL |
| Hiring Analytics | `/college-admin/hiring-dashboard` | funnel analytics | Exact analytics page pending. | PARTIAL |
| Placement Cell / TPO workspace | sidebar link to `/tpo/home` | admin placement operations | Must inherit TPO parity relevant to acting-as-TPO behavior. | PARTIAL |

## 4.6 Projects — list/aggregate

Legacy group landing: `/college-admin/projects`.

| Surface | Legacy | vNext | Audit note | Status |
| --- | --- | --- | --- | --- |
| Workspaces list | `/college-admin/projects/workspaces` | `/college/projects` | Core list exists; exact list actions pending. | PARTIAL |
| At Risk | `/college-admin/projects/at-risk` | none | Missing cross-project operational aggregate. | MISSING |
| Readiness | `/college-admin/projects/readiness` | none | Missing aggregate. | MISSING |
| Submissions | `/college-admin/projects/submissions` | none | Missing aggregate. | MISSING |
| Templates catalogue | `/college-admin/projects/templates` | templates available during create | Dedicated catalogue missing. | PARTIAL |
| Template detail | `/college-admin/projects/templates/[templateId]` | no dedicated detail | Missing/partial read-only detail. | PARTIAL |
| Project Audit | `/college-admin/projects/audit` | none | Missing cross-project audit. | MISSING |
| Create Workspace | `/college-admin/projects/workspaces/new` | creation control/dialog | User job exists; route form may later be REDESIGNED after exact action audit. | PARTIAL |
| Reassign Mentor | `/college-admin/projects/workspaces/reassign-mentor` | team controls | Bulk reassign workflow missing. | PARTIAL |
| Deleted Workspaces | `/college-admin/projects/workspaces/deleted` | none | Explicit product decision required; previous legacy audit questioned this UX. | VERIFY |

## 4.7 Projects — workspace sections

Parent detail route: `/college-admin/projects/workspaces/[workspaceId]`.

| Surface | Legacy section route | vNext | Audit note | Status |
| --- | --- | --- | --- | --- |
| Summary | `summary` | unified workspace | Exact metadata/status/archive/delete controls pending. | PARTIAL |
| Overview | `overview` | unified workspace | Narrative goal/deliverables/definition-of-done parity pending. | PARTIAL |
| Team | `team` | unified workspace | Member/mentor/team actions pending exact audit. | PARTIAL |
| Sprints | `sprints` | unified workspace | Lifecycle/edit behavior pending exact audit. | PARTIAL |
| Tasks | `tasks` | unified workspace | Board/task actions pending exact audit. | PARTIAL |
| Resources | `resources` | unified workspace | URL/text exists; storage upload blocked. | PARTIAL |
| Meetings | `meetings` | unified workspace | Schedule/complete/cancel exists; exact admin behavior pending. | PARTIAL |
| Readiness | `readiness` | unified workspace | Derived readiness exists; exact admin controls pending. | PARTIAL |
| Delivery | `delivery` | unified workspace | Final submission/review exists; exact admin behavior pending. | PARTIAL |
| Audit | `audit` | unified workspace/activity | Exact project history/audit parity pending. | PARTIAL |

---

# 5. Super Admin

Detailed page contract: `docs/parity/super-admin.md`.

Super Admin must not inherit College Admin parity only by prose. Shared surfaces are explicit below and are global/scoped as appropriate.

## 5.1 Platform / Tenant onboarding

| Surface | Legacy | vNext | Audit note | Status |
| --- | --- | --- | --- | --- |
| Overview | `/superadmin/dashboard` | dashboard | Exact platform KPIs/actions pending. | PARTIAL |
| Tenant Setup — Create stage | `/superadmin/tenants` tab 1 | Organizations + Colleges pages | User jobs exist separately; onboarding sequence/auto-select parity pending. | PARTIAL |
| Organizations onboarding CRUD | Tenant Setup Create | `/admin/organizations` | Core CRUD exists; exact onboarding behavior pending. | PARTIAL |
| Colleges onboarding CRUD | Tenant Setup Create | `/admin/colleges` | Core CRUD exists; exact onboarding behavior pending. | PARTIAL |
| Tenant Setup — Set up stage | Tenant Setup tab 2 | fragmented | Combined go-live setup flow missing. | MISSING |
| Readiness Gate | Tenant Setup | none | Missing go-live checklist/gate. | MISSING |
| Tenant Domains | Tenant Setup | `/admin/domains` | Core domain management exists; DNS verify/primary/redirect behavior parity pending. | PARTIAL |
| College Branding | Tenant Setup | none | Logo/background/color + desktop/mobile preview workflow missing. | MISSING |
| Feature Controls | `/superadmin/features` | none | College-wide module feature controls missing. | MISSING |
| Module Access hierarchy | `/superadmin/module-access` | none | Department/program/batch/class/student inheritance matrix missing. | MISSING |
| Module Access student overrides/locks | drawers | none | Missing. | MISSING |
| Module Access access trace | “Why this student sees…” | none | Missing explainability surface. | MISSING |
| Activity Log | `/superadmin/audit` | `/activity` | Global/scoped exact parity pending. | PARTIAL |
| HR Accounts list/create/edit | `/superadmin/hr` | recruiter backend/grants | Admin UI missing. | MISSING |
| HR college-access grants/revoke | HR Accounts detail | backend grants | Admin UI missing. | MISSING |
| HR terminate sessions | HR Accounts action | none | Missing. | MISSING |

## 5.2 Tenant Settings groups

Parent route: `/superadmin/settings`.

| Surface | Legacy group | vNext | Audit note | Status |
| --- | --- | --- | --- | --- |
| Platform & auth settings | base/global host, cookie, IP allowlist, OTP | deployment/auth config only | No equivalent admin settings surface. | MISSING |
| SMS settings | sender + attendance/placement templates | none | Missing. | MISSING |
| Course & progress settings | watched/in-progress/poll/save thresholds | source config | Missing admin controls. | MISSING |
| Attendance settings | eligibility/correction/schedule grace | none | Missing. | MISSING |
| Placement settings | interview windows + placement thresholds/rate limits | source config | Missing admin controls. | MISSING |
| Operational caps | bulk/progress/identity/announcement limits | source config | Missing admin controls. | MISSING |
| Other stored keys | add/remove custom key | none | Explicit decision needed whether free-form config remains supported. | VERIFY |

## 5.3 Shared Academics / Courses / People / Placements

Every row below is Super-Admin scoped, even if College Admin has the same user job.

| Surface | Legacy | Status |
| --- | --- | --- |
| Departments | `/superadmin/departments` | PARTIAL |
| Programs | `/superadmin/programs` | PARTIAL |
| Semesters | `/superadmin/semesters` | PARTIAL |
| Semester–Course Mapping | `/superadmin/semester-courses` | PARTIAL |
| Batches | `/superadmin/batches` | PARTIAL |
| Classes | `/superadmin/classes` | PARTIAL |
| Batch Promotion | `/superadmin/batch-promotion` | PARTIAL |
| Lecture Halls | `/superadmin/lecture-halls` | MISSING |
| Electives | `/superadmin/electives` | PARTIAL |
| Attendance | `/superadmin/attendance` | MISSING |
| Courses | `/superadmin/courses` | PARTIAL |
| Lessons | `/superadmin/lessons` | PARTIAL |
| Video / Resources / Live Classes | `/superadmin/lesson-content` | PARTIAL |
| Assignments | `/superadmin/assignments` | PARTIAL |
| Quizzes | `/superadmin/quizzes` | PARTIAL |
| Course Progress | `/superadmin/course-progress` | PARTIAL |
| Faculty | `/superadmin/teachers` | PARTIAL |
| Faculty Assignment | `/superadmin/faculty-assignment` | PARTIAL |
| Students | `/superadmin/students` | PARTIAL |
| People Directory | `/superadmin/people` | PARTIAL |
| Drives / all drives | `/superadmin/jobs` + `/superadmin/jobs/all` + `/superadmin/jobs/[jobId]` | PARTIAL |
| Drive Applications | `/superadmin/jobs/[jobId]/applications` | PARTIAL |
| Drive Interviews | `/superadmin/jobs/[jobId]/interviews` | PARTIAL |
| Drive Shortlisted | `/superadmin/jobs/[jobId]/shortlisted` | PARTIAL |
| Drive Settings | `/superadmin/jobs/[jobId]/settings` | PARTIAL |
| Companies | `/superadmin/companies` | PARTIAL |
| Placement Interview Calendar | `/superadmin/calendar` | MISSING |
| Hiring Analytics | `/superadmin/hiring-dashboard` | PARTIAL |

## 5.4 Projects — aggregate/template

Projects landing route: `/superadmin/projects`.

| Surface | Legacy | Status |
| --- | --- | --- |
| Templates list | `/superadmin/projects/templates` | MISSING |
| New Template | `/superadmin/projects/templates/new` | MISSING |
| Template Overview | `/superadmin/projects/templates/[templateId]` + `/overview` | MISSING |
| Template Sprints | `/superadmin/projects/templates/[templateId]/sprints` | MISSING |
| Template Tasks | `/superadmin/projects/templates/[templateId]/tasks` | MISSING |
| Template Resources | `/superadmin/projects/templates/[templateId]/resources` | MISSING |
| Template Colleges | `/superadmin/projects/templates/[templateId]/colleges` | MISSING |
| Template Versions | `/superadmin/projects/templates/[templateId]/versions` | MISSING |
| Workspaces list | `/superadmin/projects/workspaces` | PARTIAL |
| At Risk | `/superadmin/projects/at-risk` | MISSING |
| Readiness | `/superadmin/projects/readiness` | MISSING |
| Submissions | `/superadmin/projects/submissions` | MISSING |
| Project Audit | `/superadmin/projects/audit` | MISSING |
| Create Workspace | `/superadmin/projects/workspaces/new` | PARTIAL |
| Reassign Mentor | `/superadmin/projects/workspaces/reassign-mentor` | PARTIAL |
| Deleted Workspaces | `/superadmin/projects/workspaces/deleted` | VERIFY |

## 5.5 Projects — workspace sections

Parent detail route: `/superadmin/projects/workspaces/[workspaceId]`.

| Surface | Legacy section | Status |
| --- | --- | --- |
| Summary | `summary` | PARTIAL |
| Overview | `overview` | PARTIAL |
| Team | `team` | PARTIAL |
| Sprints | `sprints` | PARTIAL |
| Tasks | `tasks` | PARTIAL |
| Resources | `resources` | PARTIAL |
| Meetings | `meetings` | PARTIAL |
| Readiness | `readiness` | PARTIAL |
| Delivery | `delivery` | PARTIAL |
| Audit | `audit` | PARTIAL |

---

# 6. TPO

Detailed page contract: `docs/parity/tpo.md`.

## 6.1 Home / CRM / Students

| Surface | Legacy | vNext | Audit note | Status |
| --- | --- | --- | --- | --- |
| Home command center | `/tpo/home` | dashboard + placement operations | Needs-you queue, setup checklist, follow-ups, weekly agenda, season numbers, branch performance, season/company funnels and compensation intelligence not fully cloned. | PARTIAL |
| Leads — Table | `/tpo/leads?view=table` | none | Missing. | MISSING |
| Leads — Board | `?view=board` | none | Missing. | MISSING |
| Leads — Companies view | `?view=companies` | none | Missing. | MISSING |
| Leads add/import/invite/bulk ownership/stage | Leads actions | none | Missing CRM workflows. | MISSING |
| Lead detail | `/tpo/leads/[leadId]` | none | Contact/company/timeline/follow-ups/log interaction/invite/not-now workflows missing. | MISSING |
| Company detail | `/tpo/companies?name=...` | none | People, drives, hiring history, documents, timeline + create-drive/add-contact actions. | MISSING |
| Students intelligence summary | `/tpo/students` | none | Ready-not-applying/readiness/not-registered/applying/placed + branch intelligence. | MISSING |
| Students roster + journey filters | Students tab | none | Missing. | MISSING |
| Students Requests tab | Students tab | per-job requests only | Global student-request view missing. | MISSING |
| Student bulk Add to Drive | Students action | none | Missing. | MISSING |
| Student bulk Nudge / WhatsApp prep | Students action | none | Missing. | MISSING |
| Assign preparation | Students action | none | Missing. | MISSING |
| Higher-studies / participation state | Students action | none | Missing. | MISSING |
| Debar | Students action | none | Missing. | MISSING |
| Academic-details import | Students action | none | Missing. | MISSING |

## 6.2 Drives

| Surface | Legacy drive workspace | vNext | Status |
| --- | --- | --- | --- |
| Drives list | `/tpo/drives` | placement operations | PARTIAL |
| New Drive | `/tpo/drives/new` | `/tpo/placements/new` | DONE |
| Edit Drive | `/tpo/drives/[jobId]/edit` | embedded controls | PARTIAL |
| Overview tab | drive detail | vNext job workspace | PARTIAL |
| Applicants tab | drive detail | vNext job workspace | PARTIAL |
| Rounds tab | drive detail | vNext job workspace | PARTIAL |
| Offers tab | drive detail | vNext job workspace | PARTIAL |
| Drive Day tab | drive detail | vNext job workspace | PARTIAL |
| Global Drive Day | `/tpo/drive-day` | embedded per job | PARTIAL |
| Round-focused Drive Day | `/tpo/drive-day/[roundId]` | none | MISSING |
| Approve + publish preflight | drive action | vNext lifecycle | PARTIAL |
| Reject / send back request | drive action | vNext lifecycle | PARTIAL |
| Export applicants | drive action | none/verify | MISSING |
| Share with company | drive action + `/company-share/[token]` | none | Critical external-sharing workflow missing. | MISSING |
| Extend deadline | drive action | vNext requests/lifecycle | PARTIAL |
| Cancel drive + consequence preview | drive action | vNext lifecycle | PARTIAL |
| Close drive + consequence preview | drive action | vNext lifecycle | PARTIAL |
| Recruiter Messages drawer | drive action | none | Missing. | MISSING |
| Student detail drawer | drive action | manager data | Exact UX missing. | PARTIAL |

## 6.3 Requests / Calendar / Reports / Messages

| Surface | Legacy | Audit note | Status |
| --- | --- | --- | --- |
| Global Requests inbox | `/tpo/requests` | Per-job request handling exists; global decision inbox missing. | PARTIAL |
| Calendar — Week | `/tpo/calendar` | Missing. | MISSING |
| Calendar — Month | same | Missing. | MISSING |
| Calendar — Agenda | same | Missing. | MISSING |
| Calendar filters/summary | same | Rounds/deadlines/follow-ups/company filters missing. | MISSING |
| Calendar create/move follow-up | same | Missing. | MISSING |
| Reports gallery | `/tpo/reports` | Missing. | MISSING |
| Placement summary | `/tpo/reports/placement-summary` | Missing. | MISSING |
| By branch | `.../by-branch` | Missing. | MISSING |
| By company | `.../by-company` | Missing. | MISSING |
| CTC | `.../ctc` | Missing. | MISSING |
| Unplaced students | `.../unplaced` | Missing. | MISSING |
| Offers & acceptance | `.../offers-acceptance` | Missing. | MISSING |
| Joining status | `.../joining-status` | Missing. | MISSING |
| Failure reasons | `.../failure-reasons` | Missing. | MISSING |
| Leads report | `.../leads` | Missing. | MISSING |
| Accreditation export | `.../accreditation` | Missing. | MISSING |
| Report filters/saved views/export/presentation | report detail | Missing. | MISSING |
| Messages inbox | `/tpo/messages` | Missing. | MISSING |

## 6.4 Settings — explicit ten sections

| Surface | Legacy `/tpo/settings?tab=` | Status |
| --- | --- | --- |
| Placement Season | `season` | MISSING |
| Placement Rules | `rules` | MISSING |
| Placement Team + student coordinators | `team` | MISSING |
| Recruiter access | `recruiters` | MISSING |
| Trusted Companies/domains | `trusted` | MISSING |
| Communication Templates | `templates` | MISSING |
| Student Notices + prep/readiness | `notices` | MISSING |
| My Notifications preferences | `notifications` | MISSING |
| What Companies See | `see` | MISSING |
| Placement Branding | `branding` | MISSING |

Settings parity includes unsaved-change protection and all create/edit/remove/reassign/revoke flows represented by these sections.

## 6.5 Audit / Notifications / Account

| Surface | Legacy | Audit note | Status |
| --- | --- | --- | --- |
| TPO Audit Log | `/tpo/audit` | Decision/change/share/settings history + filters/summary missing. | MISSING |
| TPO Notifications | `/tpo/notifications` | Shared vNext Notifications exists, but legacy has All/Unread, mark-all-read, time grouping and linked notifications; exact event coverage unproven. | PARTIAL |
| TPO Profile | `/tpo/profile` | Faculty-backed TPO self profile missing. | MISSING |
| More utility | `/tpo/more` | Real secondary/mobile navigation for Requests, Calendar, Messages, Reports, Notifications, Settings, Audit and Profile; not a stub. | MISSING |
| `/tpo` redirect | `/tpo` | Redirect-only to Home. | RETIRED |

---

# 7. HR / Recruiter

Detailed page contract: `docs/parity/hr.md`.

## 7.1 Home / Drives

| Surface | Legacy | vNext | Audit note | Status |
| --- | --- | --- | --- | --- |
| College-less chooser on Home | `/hr/home` | recruiter grants + dashboard | Exact chooser/pending-invite behavior incomplete. | PARTIAL |
| College-scoped Today | `/hr/home` | recruiter dashboard | Exact Today queue/metrics/actions pending. | PARTIAL |
| Drives list | `/hr/drives` | `/hr/placements` | Portfolio exists; exact filter/action parity pending. | PARTIAL |
| New Drive / request | `/hr/drives/new` | none | Employer-side request/create flow missing. | MISSING |
| “Fix” existing drive request | `/hr/drives/new?fix=` | none | Missing. | MISSING |
| “Hire again” from prior drive | `/hr/drives/new?from=` | none | Missing. | MISSING |
| Drive Overview tab | drive detail | vNext recruiter job | PARTIAL |
| Applicants tab | drive detail | vNext recruiter job | PARTIAL |
| Rounds & Interviews tab | drive detail | vNext recruiter job | PARTIAL |
| Offers tab | drive detail | vNext recruiter job | PARTIAL |
| Messages tab | drive detail | none | MISSING |
| Applicant review drawer/notes | drive detail | result staging | PARTIAL |
| Add/change/remove rounds | drive detail | limited manager model | MISSING |
| Interview slots | nested rounds tab | none | MISSING |
| Send results table | nested rounds tab | staged results | PARTIAL |
| Selection list / Offer / LOI workflow | offers | result/offer model | PARTIAL |

## 7.2 Calendar / Messages / Company / Account

| Surface | Legacy | Status |
| --- | --- | --- |
| Recruiter Calendar | `/hr/calendar` | MISSING |
| Recruiter Messages inbox | `/hr/messages` | MISSING |
| Company tab | `/hr/company?tab=company` | MISSING |
| Team tab | `/hr/company?tab=team` | MISSING |
| Reports tab | `/hr/company?tab=reports` | MISSING |
| Recruiter self Profile | `/hr/profile` | MISSING |
| Leave college access | Profile action | MISSING |
| `/hr/colleges` | retired redirect to Home | Legacy explicitly retired this route; chooser belongs on Home. | RETIRED |
| `/hr` | redirect to Home | Redirect-only route. | RETIRED |
| Public invite acceptance | `/hr-invite/[token]` | Join/pending/decline/not-hiring/unsubscribe flow missing. | MISSING |

---

# 8. Shared / public / cross-account product surfaces

Detailed page contract: `docs/parity/shared-public-ops.md`.

These were absent from matrix v1 and are now explicit.

| Surface | Legacy | vNext | Audit note | Status |
| --- | --- | --- | --- | --- |
| Tenant-aware login entry | `/` | auth shell/provider prep | Actual Identity Platform browser login not configured. | BLOCKED |
| Login | `/login` | no complete browser provider UI | Identity Platform dependency. | BLOCKED |
| Separate Super Admin login | `/superadmin-login` | no separate route | Decide whether unified Identity Platform login intentionally replaces it. | VERIFY |
| Cross-domain/account auth handoff | `/auth/handoff` | membership chooser/switcher only | Same-origin membership switching exists; token handoff across hosts is not equivalent. | PARTIAL |
| Company applicant share | `/company-share/[token]` | none | Code-gated external applicant list, expiry/revocation, CSV/resume ZIP/download audit is missing. | MISSING |
| Standalone AI Grading | `/ai-grading` | AI tools only | Legacy has exam/rubric form+JSON, PDF grading, extraction evidence, confidence/review queue and report generation. | MISSING |
| Standalone learner quiz | `/quiz` | inline quiz UI | Tracked under Learner; exact full-screen behavior pending. | PARTIAL |
| Privacy Policy | `/privacy-policy` | none | Decide whether vNext owns legal/public site or separate deployment retains it. | VERIFY |
| Custom 404 | `/404` | framework default | Explicit product/error UX decision needed. | VERIFY |
| Custom 500 | `/500` | framework error handling | Explicit product/error UX decision needed. | VERIFY |

---

# 9. Operational / QA surfaces

Detailed page contract: `docs/parity/shared-public-ops.md`.

| Surface | Legacy | Audit note | Status |
| --- | --- | --- | --- |
| Issue Report | `/tracker` | No vNext equivalent. Decide whether 42 Tracker remains separate/legacy or is migrated. | VERIFY |
| Issues list | `/tracker/issues` | Same ownership decision. | VERIFY |
| Issue detail | `/tracker/issues/[issueId]` | Same ownership decision. | VERIFY |
| Logs | `/tracker/logs` | Legacy Super Admin Cloud Logging workflow, known-errors/digest/test alert/log→issue handoff. | VERIFY |
| Legacy E2E superadmin login | `/e2e/superadmin-login` | Test-only helper; vNext uses deterministic/E2E auth infrastructure instead. | RETIRED |

---

# 10. Public marketing surfaces

Detailed page contract: `docs/parity/shared-public-ops.md`.

These are outside the seven authenticated accounts but cannot remain unclassified.

| Surface | Legacy route | Status |
| --- | --- | --- |
| Marketing Home | `/home` | VERIFY |
| Platform | `/platform` | VERIFY |
| Universities | `/universities` | VERIFY |
| Enterprises | `/enterprises` | VERIFY |
| Request Demo | `/request-demo` | VERIFY |

Before parity launch closure, explicitly decide whether these remain served by the legacy/public site or migrate into vNext. Do not accidentally delete them during app replacement.

---

# 11. Legacy route artifacts / redirects

The full list lives in `docs/planning/legacy-ui-route-manifest.md`.

Important rules:
- files under `src/pages/Dashboard/course/**` and `src/pages/superadmin/sections/**` are reusable implementation components that accidentally live under Pages Router; do not recreate their URL-shaped paths;
- redirect-only routes are not “missing pages” unless bookmark compatibility is explicitly required;
- framework and E2E-only files are not product surfaces.

---

# 12. Shared dependency blockers

| Capability | Note | Status |
| --- | --- | --- |
| Identity Platform browser login | GCP project/provider configuration required. | BLOCKED |
| Live session restoration | Harness exists; live provider validation pending. | BLOCKED |
| Assignment file upload | Cloud Storage upload receipt/signing required. | BLOCKED |
| Signed VIDEO playback | Cloud Storage signed delivery required. | BLOCKED |
| Project file resource uploads | Same Cloud Storage dependency. | BLOCKED |
| Vertex AI-backed quality runs | Provider/config dependency; does not block non-AI parity work. | BLOCKED |

---

# 13. Audit invariants

Parity cannot close until all are true:

1. `npm run parity:status` reports zero PARTIAL, MISSING, VERIFY and BLOCKED rows.
2. `npm run parity:pages` reports zero open detailed page checks.
3. Every master DONE/REDESIGNED row has its required `docs/parity/*.md` contract closed or an explicit documented reason why a detailed item is not applicable.
4. Every account product route in `legacy-ui-route-manifest.md` is represented here.
5. Every legacy navigation destination is represented here.
6. Every composite page with tabs/sections has explicit subrows; umbrella rows alone are insufficient.
7. Every meaningful deep-link/modal/drawer action is implemented or explicitly REDESIGNED/RETIRED.
8. Redirect stubs/artifact routes are classified and not mistaken for product requirements.
9. The legacy baseline SHA is refreshed and diffed immediately before final parity sign-off.
10. Critical role/tenant/browser regression coverage executes successfully; authored-but-unrun tests are not “green”.

# 14. Execution order after this audit

Continue:
**Learner → Faculty → Mentor → College Admin → Super Admin → TPO → HR → shared/public decisions → blockers → final fresh diff.**

Within a page:
1. inspect exact legacy page and supporting components;
2. enumerate sections/actions/states in this matrix before coding;
3. implement cleanly in vNext;
4. add authorization/regression coverage;
5. update only the exact rows actually closed;
6. continue without broad redesign until parity is complete.
