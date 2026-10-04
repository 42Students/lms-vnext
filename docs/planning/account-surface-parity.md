# LMS vNext — Account Surface Parity Program

**Started:** 2026-10-04  
**Legacy UI oracle:** `42Students/lms2-fe@prod-2026`  
**Legacy baseline inspected:** `38cdd38e592a6f416c8e8e99ce36438f548ed577`  
**vNext baseline inspected:** `42Students/lms-vnext@main` @ `ce564b60dac0c2db6a7bb7698257285e1664c0d1`

This is the detailed source of truth for the **clone-first, redesign-later** completion program.

## Status vocabulary

- **DONE** — equivalent user-facing surface/workflow exists.
- **PARTIAL** — core capability exists but the legacy page/sections/actions are not fully represented.
- **MISSING** — required parity work remains.
- **VERIFY** — legacy route exists; reachability/product intent must be checked before recreate/retire.
- **REDESIGNED** — intentionally different implementation with the same user job covered and documented.
- **RETIRED** — intentionally removed with a written reason.
- **BLOCKED** — external dependency such as Identity Platform or Cloud Storage blocks completion.

**Parity gate:** zero MISSING and zero VERIFY rows; no PARTIAL row may hide an unfinished user job.

## Implementation rule

Clone the **product surface**, not the legacy code. Rebuild using vNext App Router, domain services, centralized authorization, PostgreSQL and LMS design tokens. Do not import legacy Redux/Ant Design/auth/service architecture.

Do not perform broad navigation consolidation until parity is closed.

A surface is DONE only after route/destination, visible sections/tabs/cards, actions, dialogs, loading/empty/error/permission states, workflow result, tenant boundaries and important responsive behavior are accounted for.

---

# Learner

Legacy navigation: Courses, Quizzes, Assignments, Class Schedule, Attendance, My Placements, Projects, Notifications, Profile.

| Surface | Legacy route/section | vNext | Status |
| --- | --- | --- | --- |
| Courses list | `/learn/courses` | `/learn/courses` | DONE |
| Course detail | `/learn/courses/[courseId]` | `/learn/courses/[deliveryId]` | PARTIAL |
| Course Overview | course tab `home` | embedded workspace | PARTIAL |
| Learning Path | course tab `roadmap` | embedded workspace | DONE |
| Course Attendance | course tab `attendanceDetail` | none | MISSING |
| Course Discussions | course tab `discussions` | none | MISSING |
| Global Assignments | `/learn/allAssignments` | `/learn/assignments` | DONE |
| Global Quizzes | `/learn/allQuizzes` | `/learn/quizzes` | DONE |
| Class Schedule | `/learn/calendar` | no learner page | MISSING |
| Attendance summary | `/learn/attendance` | none | MISSING |
| Placements dashboard | `/learn/my-placements` | `/learn/placements` | PARTIAL |
| Applications | `/learn/my-placements/applications` | journey data only | MISSING |
| Assessments | `/learn/my-placements/assessments` | round data only | MISSING |
| Interviews | `/learn/my-placements/interviews` | round data only | MISSING |
| Career Calendar | `/learn/my-placements/calendar` | none | MISSING |
| Jobs list | `/learn/my-placements/jobs` | placements section | PARTIAL |
| Job detail | `/learn/my-placements/jobs/[jobId]` | none | MISSING |
| Placement Cell | `/learn/my-placements/placement` | none | MISSING |
| Placement Rules | `/learn/my-placements/rules` | none | MISSING |
| Projects list | `/learn/projects` | `/learn/projects` | DONE |
| Project detail | `/learn/projects/[projectId]` | vNext project workspace | PARTIAL |
| Notifications | `/learn/notifications` | `/notifications` | DONE |
| Profile | `/learn/profile` | admin-only profile tooling | MISSING |
| Quiz-taking/result behavior | `/quiz` + course flow | inline controls | PARTIAL |

Project detail parity must explicitly check legacy Overview, Team, Sprints/Board, Resources, Delivery and Activity behavior.

**Learner closure note — 2026-10-04:** Global Assignments and Global Quizzes now have dedicated vNext pages with course filtering, summary metrics, learner state labels and deep links to the actionable Course item. Assignment behavior was also corrected to match the legacy LMS: a published overdue assignment remains submittable; the due date marks lateness/urgency rather than hard-closing learner submission.

---

# Faculty

Legacy navigation: Courses, Contacts, Notifications, Class Schedule, All Quizzes, All Assignments, Profile.

| Surface | Legacy route/section | vNext | Status |
| --- | --- | --- | --- |
| Courses list | `/teacher/courses` | `/teach/courses` | DONE |
| Course detail | `/teacher/courses/[courseId]` | `/teach/courses/[deliveryId]` | PARTIAL |
| Overview | course tab `home` | workspace | PARTIAL |
| Blueprint | course tab `blueprint` | learning-path authoring | PARTIAL |
| Attendance | course tab `attendanceDetail` | none | MISSING |
| Discussions | course tab `discussions` | none | MISSING |
| Students | course tab `students` | no dedicated roster surface | MISSING |
| Contacts | `/teacher/contacts/*` | none | MISSING |
| Notifications | `/teacher/notifications` | `/notifications` | DONE |
| Class Schedule | `/teacher/calendar` | none | MISSING |
| All Quizzes | `/teacher/allQuizzes` | per-course only | MISSING |
| All Assignments | `/teacher/allAssignments` | per-course only | MISSING |
| Assignment report | `/teacher/report/assignment/[contentId]` | inline review | MISSING |
| Quiz report | `/teacher/report/quiz/[quizId]` | inline review | MISSING |
| File Explorer | `/teacher/fileExplorer` | none | MISSING |
| Profile | `/teacher/profile` | admin-only profile tooling | MISSING |

Contacts must reproduce All Contacts, Teachers and Students tabs before later redesign.

---

# Mentor

Legacy primary navigation: Projects, Meetings, Notifications.

| Surface | Legacy route | vNext | Status |
| --- | --- | --- | --- |
| Projects list | `/mentor/projects` | same | DONE |
| Project detail | `/mentor/projects/[projectId]` | vNext workspace | PARTIAL |
| Meetings calendar | `/mentor/calendar` | per-project meetings only | MISSING |
| Notifications | `/mentor/notifications` | shared notifications | DONE |
| Legacy Courses | `/mentor/courses/*` | none | VERIFY |
| Legacy Contacts | `/mentor/contacts/*` | none | VERIFY |
| Legacy All Quizzes | `/mentor/allQuizzes` | none | VERIFY |
| Legacy File Explorer | `/mentor/fileExplorer` | none | VERIFY |
| Legacy Profile | `/mentor/profile` | none | VERIFY |

Project detail parity must check Overview, Team, Sprints, Tasks/Board, Resources, Meetings, Delivery and Activity.

---

# College Admin

Legacy sidebar: Dashboard, Activity Log, Academic Setup, Courses & Content, People, Placements, Placement Cell, Projects, Profile.

## Operations
| Surface | Legacy route | Status |
| --- | --- | --- |
| Dashboard | `/college-admin/dashboard` | PARTIAL |
| Activity Log | `/college-admin/audit` | PARTIAL |
| Profile | `/college-admin/profile` | MISSING |
| Calendar | `/college-admin/calendar` | MISSING |

## Academic Setup
| Surface | Legacy route | Status |
| --- | --- | --- |
| Departments | `/college-admin/departments` | DONE |
| Programs | `/college-admin/programs` | PARTIAL |
| Semesters | `/college-admin/semesters` | PARTIAL |
| Semester–Course Mapping | `/college-admin/semester-courses` | PARTIAL |
| Batches | `/college-admin/batches` | PARTIAL |
| Classes | `/college-admin/classes` | PARTIAL |
| Batch Promotion | `/college-admin/batch-promotion` | PARTIAL |
| Lecture Halls | `/college-admin/lecture-halls` | MISSING |
| Electives | `/college-admin/electives` | PARTIAL |
| Attendance | `/college-admin/attendance` | MISSING |

Programs/semesters/batches/classes/electives already have underlying vNext concepts, but clone-first requires the expected dedicated operational surfaces before later consolidation. Batch Promotion still lacks the legacy bulk workflow.

## Courses & Content
| Surface | Legacy route | Status |
| --- | --- | --- |
| Courses | `/college-admin/courses` | DONE |
| Course detail | `/college-admin/courses/[id]` | PARTIAL |
| Lessons | `/college-admin/lessons` | PARTIAL |
| Video | `/college-admin/lesson-content?type=video` | PARTIAL |
| Resources | `/college-admin/lesson-content?type=resources` | PARTIAL |
| Live Classes | `/college-admin/lesson-content?type=live-classes` | PARTIAL |
| Assignments | `/college-admin/assignments` | PARTIAL |
| Quizzes | `/college-admin/quizzes` | PARTIAL |
| Course Progress | `/college-admin/course-progress` | PARTIAL |

Signed VIDEO playback and assignment file uploads remain BLOCKED by Cloud Storage, but the rest of these surfaces can proceed.

## People
| Surface | Legacy route | Status |
| --- | --- | --- |
| Faculty | `/college-admin/teachers` | PARTIAL |
| Faculty Assignment | `/college-admin/faculty-assignment` | PARTIAL |
| Students | `/college-admin/students` | PARTIAL |
| People Directory | `/college-admin/people` | DONE |
| Student Groups | `/college-admin/student-groups`, `/[id]` | MISSING |

## Placements
| Surface | Legacy route | Status |
| --- | --- | --- |
| Drives | `/college-admin/jobs`, `/jobs/all` | PARTIAL |
| Drive detail | `/college-admin/jobs/[jobId]` | DONE |
| Applications | `.../applications` | PARTIAL |
| Interviews | `.../interviews` | PARTIAL |
| Shortlisted | `.../shortlisted` | PARTIAL |
| Job Settings | `.../settings` | PARTIAL |
| Companies | `/college-admin/companies` | PARTIAL |
| Hiring Dashboard | `/college-admin/hiring-dashboard` | PARTIAL |
| Placement Cell | shared TPO workspace | PARTIAL |

## Projects

Legacy list tabs: Workspaces, At Risk, Readiness, Submissions, Templates, Audit.  
Legacy workspace sections: Summary, Overview, Team, Sprints, Tasks, Resources, Meetings, Readiness, Delivery, Audit.

| Surface | Legacy route | Status |
| --- | --- | --- |
| Workspaces | `/college-admin/projects/workspaces` | PARTIAL |
| At Risk | `/college-admin/projects/at-risk` | MISSING |
| Readiness | `/college-admin/projects/readiness` | MISSING |
| Submissions | `/college-admin/projects/submissions` | MISSING |
| Templates catalogue/detail | `/college-admin/projects/templates/*` | PARTIAL |
| Project Audit | `/college-admin/projects/audit` | MISSING |
| Workspace Create | `/workspaces/new` | DONE |
| Workspace detail sections | `/workspaces/[id]/*` | PARTIAL |
| Reassign Mentor | `/workspaces/reassign-mentor` | PARTIAL |
| Deleted Workspaces | `/workspaces/deleted` | VERIFY |

Deleted Workspaces must not be silently copied or dropped; it requires the explicit product decision already raised in legacy hardening work.

---

# Super Admin

Super Admin owns all College Admin shared groups under global/scoped safety plus platform-only controls.

## Platform
| Surface | Legacy route | Status |
| --- | --- | --- |
| Overview | `/superadmin/dashboard` | PARTIAL |
| Tenant Setup | `/superadmin/tenants` | PARTIAL |
| College Branding | Tenant Setup section | MISSING |
| College bulk import | Tenant Setup section | MISSING |
| Domains | Tenant Setup / domain section | DONE |
| Readiness Gate | Tenant Setup section | MISSING |
| Feature Controls | `/superadmin/features` | MISSING |
| Module Access | `/superadmin/module-access` | MISSING |
| Tenant Settings | `/superadmin/settings` | MISSING |
| Activity Log | `/superadmin/audit` | PARTIAL |
| HR Accounts | `/superadmin/hr` | MISSING |

The shared Academic Setup, Courses & Content, People and Placement rows from College Admin must also be completed for scoped Super Admin. Specific missing legacy surfaces include Attendance, Lecture Halls, Calendar and the dedicated academic/content/people pages currently consolidated in vNext.

## Projects

Legacy list tabs: Templates, Workspaces, At Risk, Readiness, Submissions, Audit.  
Template sections: Overview, Sprints, Tasks, Resources, Colleges, Versions.  
Workspace sections: Summary, Overview, Team, Sprints, Tasks, Resources, Meetings, Readiness, Delivery, Audit.

| Surface | Legacy route | Status |
| --- | --- | --- |
| Templates list | `/superadmin/projects/templates` | MISSING |
| New Template | `/superadmin/projects/templates/new` | MISSING |
| Template Overview | template detail | MISSING |
| Template Sprints | template detail | MISSING |
| Template Tasks | template detail | MISSING |
| Template Resources | template detail | MISSING |
| Template Colleges | `.../[templateId]/colleges` | MISSING |
| Template Versions | `.../[templateId]/versions` | MISSING |
| Workspaces | `/superadmin/projects/workspaces` | PARTIAL |
| At Risk | `/superadmin/projects/at-risk` | MISSING |
| Readiness | `/superadmin/projects/readiness` | MISSING |
| Submissions | `/superadmin/projects/submissions` | MISSING |
| Project Audit | `/superadmin/projects/audit` | MISSING |
| Workspace detail sections | `/workspaces/[id]/*` | PARTIAL |
| Reassign Mentor | `/workspaces/reassign-mentor` | PARTIAL |
| Deleted Workspaces | `/workspaces/deleted` | VERIFY |

The Project Template backend/version/college-assignment domain already exists; the missing work is primarily user-facing administration.

---

# TPO

Legacy navigation: Home, Leads, Drives, Students, Requests, Calendar, Reports, Messages, Settings, Audit Log, Notifications.

| Surface | Legacy route | Status |
| --- | --- | --- |
| Home command center | `/tpo/home` | PARTIAL |
| Leads CRM | `/tpo/leads`, `/leads/[leadId]` | MISSING |
| Drives | `/tpo/drives`, `/[jobId]` | PARTIAL |
| New Drive | `/tpo/drives/new` | DONE |
| Edit Drive | `/tpo/drives/[jobId]/edit` | PARTIAL |
| Drive Day | `/tpo/drive-day`, `/[roundId]` | PARTIAL |
| Students | `/tpo/students` | MISSING |
| Requests | `/tpo/requests` | PARTIAL |
| Calendar | `/tpo/calendar` | MISSING |
| Reports | `/tpo/reports`, `/[name]` | MISSING |
| Messages | `/tpo/messages` | MISSING |
| Settings | `/tpo/settings` | MISSING |
| Audit Log | `/tpo/audit` | MISSING |
| Notifications | `/tpo/notifications` | DONE |
| More/mobile utility | `/tpo/more` | VERIFY |

Leads parity includes Table, Board, Companies, owner/stage changes, import, invite, bulk actions and next-step workflow.

---

# HR / Recruiter

Legacy navigation: Today, Drives, Calendar, Messages, Company & Team.

| Surface | Legacy route | Status |
| --- | --- | --- |
| Today | `/hr/home` | PARTIAL |
| Drives | `/hr/drives` | PARTIAL |
| Drive detail | `/hr/drives/[jobId]` | PARTIAL |
| New Drive | `/hr/drives/new` | MISSING |
| Calendar | `/hr/calendar` | MISSING |
| Messages | `/hr/messages` | MISSING |
| Company & Team | `/hr/company` | MISSING |
| Company tab | `/hr/company?tab=company` | MISSING |
| Team tab | `/hr/company?tab=team` | MISSING |
| Reports tab | `/hr/company?tab=reports` | MISSING |
| Profile | `/hr/profile` | MISSING |
| College chooser | `/hr/colleges` | PARTIAL |
| Invite acceptance | `/hr-invite/[token]` | VERIFY |

---

# Shared blockers / account infrastructure

| Surface | Status | Notes |
| --- | --- | --- |
| Login UI/provider | BLOCKED | Browser Identity Platform config/provider is not provisioned. |
| Live session restore validation | BLOCKED | Deterministic harness exists; live provider is pending. |
| Notifications | DONE | Role-specific event coverage still checked per account. |
| Additive multi-role Dashboard | DONE | Role-specific legacy home parity is tracked above. |
| Assignment file upload | BLOCKED | Cloud Storage upload receipt/signing required. |
| Signed VIDEO playback | BLOCKED | Cloud Storage signed delivery required. |

---

# Execution order

Default order: **Learner → Faculty → Mentor → College Admin → Super Admin → TPO → HR/Recruiter → shared blockers → final fresh diff**.

Within each account:
1. inspect the exact legacy page before coding;
2. inventory its sections/actions/modals/states;
3. implement missing domain primitives if required;
4. build the vNext page;
5. expose navigation when legacy exposes it;
6. add regression tests;
7. update this exact row in the same commit;
8. continue to the next unresolved row.

# Continuation protocol

Every future chat must:
1. fetch latest `lms-vnext/main`;
2. fetch latest `lms2-fe/prod-2026`;
3. read `AGENTS.md`, the execution checklist and this matrix;
4. preserve parallel work and never force-push;
5. start from the first unresolved row in the active account;
6. update the matrix in the same commit as implementation;
7. keep CI truth explicit: tests are not “green” when Actions did not acquire a runner.

# Definition of perfect parity

- all seven accounts fully classified;
- zero MISSING;
- zero VERIFY;
- no PARTIAL hiding unfinished behavior;
- explicit rationale for every REDESIGNED/RETIRED surface;
- final fresh route/navigation/section audit against latest `prod-2026`;
- critical role/tenant/browser regression coverage complete.

Only after this milestone should broad UI consolidation/beautification begin.
