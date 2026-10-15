# vNext vs legacy wording gap report (read-only audit)

Repo: C:\Users\LENOVO\Desktop\lms-vnext, main HEAD 7a55a556e. Legacy source of truth: docs/audit/legacy-copy-A.md, legacy-copy-B.md, legacy-inventory-A.md, legacy-inventory-B.md (lms-dev-2026 branch). Where the catalogue was ambiguous I confirmed against the legacy worktree C:\Users\LENOVO\Desktop\42LMS\_hr-tpo-fe\src (read only). Nothing was run.

Severity: S2 = nav labels, headings, buttons, tab names. S3 = helper text, descriptions, eyebrows, aria text.
Status codes: MATCH, LABEL-DIFF, MISSING-IN-VNEXT, EXTRA-IN-VNEXT, ORDER-DIFF.
All vNext paths below are relative to src/.

---------------------------------------------------------------------------------------------------

## PART 1. NAVIGATION

### 1.0 Browser title format

| Item | Legacy | vNext | Status |
|---|---|---|---|
| Dev format | `<title> · 42LMS` (utils/pageTitle.js L33; AdminLayout L45; SuperAdminLayout "Superadmin · 42LMS"); fallback `42LMS` | not used | n/a |
| Prod format | `42 LMS - <title>` (AdminLayout L42; SuperAdminLayout "42 LMS - Superadmin"); fallback `42 LMS` | not used | n/a |
| vNext actual | | One static `title: "42 LMS vNext"` in app/layout.tsx:5 for every page (only app/company-share/[token]/page.tsx sets its own, "Shared applicants · 42Students"). No per-page `metadata`/`generateMetadata` anywhere in src/app. | **FLAG: matches neither dev nor prod format; no per-page title at all (S2)** |

Target (owner rule says match the old LMS; docs say dev branch is the copy source): `<page title> · 42LMS`. Needs a `titleTemplate`-style `metadata.title = { template: "%s · 42LMS", default: "42LMS" }` in app/layout.tsx plus per-page `metadata.title` (or a shared helper that maps pathname to the heading) using the Part 2 strings. Legacy route title map (constant.js L11-L59) has quirks to copy only if exact titles are wanted: learner calendar route is "Calendar" (not "Class Schedule"), "All Assignment" (singular, typo) for allAssignments, "Mentor" for /mentor.

### 1.1 Learner sidebar (legacy lists.js L55-L123; vNext shell-model.ts L58-L125, used when membership has exactly one role = LEARNER, L379-386)

| # | Legacy label | vNext label (file:line) | Status |
|---|---|---|---|
| 1 | Courses | Courses (L60) | MATCH |
| 2 | Quizzes | Quizzes (L68) | MATCH |
| 3 | Assignments | Assignments (L76) | MATCH |
| 4 | Class Schedule | Class Schedule (L84) | MATCH |
| 5 | Attendance | Attendance (L91) | MATCH |
| 6 | My Placements (hidden if module off) | My Placements (L98), filter L311-316 | MATCH |
| 7 | Projects (hidden if module off) | Projects (L105), filter L306-310 | MATCH |
| 8 | Notifications | Notifications (L112) | MATCH |
| 9 | Profile | Profile (L119) | MATCH |
| x | (none in dev; prod-only "Drive day" injected by Sidebar.js) | "Drive Day" /tpo/drive-day appended when `driveDayEnabled` (L320-330) | EXTRA-IN-VNEXT (also case differs from prod "Drive day"); decide: drop or lower-case |

Order and group tags (learning/tracking/career/account) are identical. Learner: 9 MATCH, 1 EXTRA.

### 1.2 Faculty sidebar (legacy lists.js L1-L53; vNext L127-L179, single-role FACULTY branch L388-397)

| # | Legacy | vNext | Status |
|---|---|---|---|
| 1 | Courses | Courses (L129) | MATCH |
| 2 | Contacts | Contacts (L137) | MATCH |
| 3 | Notifications | Notifications (L143) | MATCH |
| 4 | Class Schedule | Class Schedule (L150) | MATCH |
| 5 | All Quizzes | All Quizzes (L157) | MATCH |
| 6 | `All assignments` | `All Assignments` (L165) | **LABEL-DIFF** |
| 7 | Profile | Profile (L173) | MATCH |
| x | "Placement cell" (href /tpo/home, group account) injected by legacy Sidebar.js L300-310 for faculty who are also TPO admins | absent | MISSING-IN-VNEXT (conditional) |

Group tags: legacy has all rows in group "teaching" except Profile in "account" (so one divider before Profile). vNext tags rows learning/account/account/tracking/learning/learning/account, which renders 4 dividers (sidebar-nav.tsx L30-49). Visual only (S3). Faculty: 6 MATCH, 1 LABEL-DIFF, 1 MISSING.

Faculty course tabs (legacy lists.js courseTabList filtered, L271-L309): Overview, Blueprint, Attendance, Discussions, Students. vNext modules/courses/faculty-course-navigation.ts L2-L8: Overview, Blueprint, **Students**, Attendance, Discussions -> **ORDER-DIFF** (Students must be last). Learner course tabs (components/courses/learner-course-tabs.tsx L4-L9): Overview, Learning Path, Attendance, Discussions: MATCH.

Faculty contacts tabs (legacy L390-L406): All Contacts, Teachers, Students. vNext app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx L16/L20/L24: same labels: MATCH.

### 1.3 Mentor sidebar (legacy lists.js L311-L333; vNext L181-185, single-role MENTOR branch L399-407)

Projects, Meetings (/calendar), Notifications, all group "learning": vNext identical (L182-184). 3 of 3 MATCH.

### 1.4 College admin sidebar (legacy adminNavigationMenuFlat L192-L212; vNext collegeAdminItems L275-286, branch L409-418)

| # | Legacy label (legacy path) | vNext label -> href (file:line) | Status |
|---|---|---|---|
| 1 | Dashboard (dashboard) | Dashboard -> /college (L276) | MATCH |
| 2 | Activity Log (audit) | Activity Log -> /college/activity (L277) | MATCH |
| 3 | Academic Setup (departments) | Academic Setup -> /college/departments (L278) | MATCH |
| 4 | Courses & Content (courses) | Courses & Content -> /college/courses (L279) | MATCH |
| 5 | People (teachers = Faculty tab) | People -> /college/people (L280) | MATCH label; **landing differs**: legacy lands on first tab Faculty, vNext on People Directory (last tab). Use /college/faculty. |
| 6 | Profile verification | Profile verification -> /college/verification (L281) | MATCH |
| 7 | Placements (jobs = Drives tab) | Placements -> /college/placements (L282) | MATCH |
| 8 | Placement cell (href /tpo/home) | Placement cell -> /tpo/home (L283) | MATCH |
| 9 | Projects (projects/workspaces) | Projects -> /college/projects/workspaces (L284) | MATCH label, **BROKEN LINK** (see Part 3, P0) |
| 10 | Profile | Profile -> /college/profile (L285) | MATCH |

Dividers: legacy inventory-A says dividers after Activity Log, People and Projects (the third divider is after projects/workspaces). vNext has no `group` on these rows, so no separators (S3). Active highlight: legacy `getSidebarActiveKey` keeps the section row highlighted on every tab of its group; vNext sidebar-nav.tsx L36-39 highlights only when pathname equals or starts with the row href, so on /college/semesters or /college/lessons or /college/students no sidebar row is active, and on /college/projects/at-risk "Projects" is not active (href is /college/projects/workspaces). Needs a `matchPrefixes` list per row (S3, behaviour).
College: 10 of 10 labels MATCH; 1 broken link, 1 landing diff, dividers/active-state missing.

College nested tab groups (legacy navGroupDefinitions.js + adminNavGroups.js; vNext modules/people/college-legacy-tabs-model.ts L8-49):

| Group | Legacy tabs (in order) | vNext tabs | Status |
|---|---|---|---|
| Academic Setup | Departments, Programs, Semesters, Semester–Course Mapping, Batches, Classes, Batch Promotion, Lecture Halls, Electives, Attendance | identical, same order (L9-20) | MATCH (10/10) |
| Courses & Content | Courses, Lessons, Video, Resources, Live Classes, Assignments, Quizzes, Progress | identical (L21-30) | MATCH (8/8) |
| People | Faculty, Faculty Assignment, Students, People Directory | identical (L31-36) | MATCH (4/4) |
| Placements | Drives, **Companies**, Interviews, **Analytics** | Drives, Interviews only (L37-40) | MISSING-IN-VNEXT: Companies (/college-admin/companies), Analytics (/hiring-dashboard). File header says deliberately gated. |
| Projects | Workspaces, At Risk, Readiness, Submissions, Templates, Audit | identical labels (L41-48); Workspaces href /college/projects/workspaces is a dead route | MATCH labels, broken href |
| Group heading | PageShell title = group title ("Academic Setup" etc.) rendered above the tabs (AdminGroupShell.jsx) | tab bar only carries `aria-label={group.title}` (components/college/college-legacy-group-tabs.tsx L13); no visible group heading | **MISSING-IN-VNEXT (S2)** |

Duplicate strip: pages under /college/projects/* render CollegeLegacyGroupTabs AND the older ProjectAdminNav (components/projects/project-admin-nav.tsx L3-10) so two tab strips with the same six labels appear (legacy: one). Hrefs differ: legacy-tabs "Workspaces" -> /college/projects/workspaces (dead), ProjectAdminNav "Workspaces" -> /college/projects (works).

### 1.5 TPO sidebar (legacy tpoNavigationMenu lists.js L349-L366 + TPO_GROUP_LABELS L371-L376; vNext tpoItems L187-240; TPO-only account falls through to the generic path so Dashboard is also shown, L420-433)

Legacy order and sections: **Operate**: Home, Placement eligibility, Engage, Drives, Team. **Coordinate**: Students, Requests, Verification, Calendar, Announcements. **Insights**: Reports. **Administration**: Messages, Settings, Audit log, Notifications.

| # | Legacy | vNext (file:line) | Status |
|---|---|---|---|
| 1 | Home (/tpo/home) | not in nav (only a "Home" link in tpo/layout.tsx L15); `Dashboard` -> /dashboard shown instead (L22-27, L421) | MISSING-IN-VNEXT + EXTRA "Dashboard" |
| 2 | Placement eligibility (batches) | absent (route /tpo/batches exists) | MISSING-IN-VNEXT |
| 3 | `Engage` (recruiters) | `Recruiter Leads` -> /tpo/recruiters (L188) | **LABEL-DIFF** |
| 4 | `Drives` (drives) | `Placement Operations` -> /tpo/placements (L195) | **LABEL-DIFF** |
| 5 | Team | absent (route /tpo/team exists) | MISSING-IN-VNEXT |
| 6 | Students | Students (L201) | MATCH |
| 7 | Requests | absent (route /tpo/requests exists) | MISSING-IN-VNEXT |
| 8 | Verification | absent (route /tpo/verification exists) | MISSING-IN-VNEXT |
| 9 | Calendar | Calendar (L206) | MATCH |
| 10 | Announcements | absent (route /tpo/announcements exists) | MISSING-IN-VNEXT |
| 11 | Reports | Reports (L211) | MATCH |
| 12 | Messages | Messages (L217) | MATCH |
| 13 | Settings | Settings (L223) | MATCH |
| 14 | `Audit log` | `Audit Log` (L230) | **LABEL-DIFF** (case) |
| 15 | Notifications | absent (route /tpo/notifications exists) | MISSING-IN-VNEXT |
| - | section headers Operate / Coordinate / Insights / Administration | none (vNext tags rows "tracking"/"account" with only a hairline divider) | MISSING-IN-VNEXT |
| x | (none) | `Companies` -> /tpo/companies (L190) | EXTRA-IN-VNEXT |
| x | (none) | `More` -> /tpo/more (L235) | EXTRA-IN-VNEXT |

ORDER-DIFF: vNext order (Recruiter Leads, Companies, Placement Operations, Students, Calendar, Reports, Messages, Settings, Audit Log, More) differs from legacy. TPO: 5 MATCH, 3 LABEL-DIFF, 7 MISSING (+4 headers), 2 EXTRA (+ generic Dashboard).

TPO top bar (legacy components/tpo/TpoTopBar.js L91-L106): search box "Find a student, recruiter or company" with "Ctrl K" hint, "+ New" menu (Follow-up / Recruiter lead / Drive), Messages icon, Notifications bell. vNext (app/(authenticated)/tpo/layout.tsx L15-17): "Home" link, "Find a record" link, bell. -> LABEL-DIFF "Find a record" vs "Find a student, recruiter or company" (S2); MISSING "New" menu, Messages icon, command palette (Ctrl K).

TPO bell drawer (legacy TpoBellPanel.jsx L55-L111 vs vNext components/tpo/tpo-bell-panel.tsx L24-L35):

| Legacy | vNext | Status |
|---|---|---|
| title "Notifications"; button "Mark all read" | h2 "Notifications"; "Mark all read" (L35) | MATCH |
| empty: "Nothing yet" + "Things that happen on your drives and recruiters show up here." | `No notifications yet.` (L27) | LABEL-DIFF |
| link "See all notifications" | `All notifications` (L34) | LABEL-DIFF |
| (none) | `Close` (L25), sub-line "Most recent notifications from your own college." (L26), `Open record` (L32), aria "TPO notifications" (L20), `Saving…` | EXTRA |
| error "Couldn't load notifications" with Retry; "Refreshing notifications…" | "Read state was not confirmed. Refresh before retrying." (L16) | LABEL-DIFF |

### 1.6 Recruiter sidebar (legacy recruiterNavigationMenu L337-L343; vNext recruiterItems L242-272)

| # | Legacy | vNext | Status |
|---|---|---|---|
| 1 | Today (/recruiter/home) | Today -> /hr/home (L244) | MATCH |
| 2 | `Drives` | `Hiring Workspace` -> /hr/placements (L250) | **LABEL-DIFF** (route /hr/drives already exists and is titled "Drives") |
| 3 | Calendar | Calendar (L255) | MATCH |
| 4 | Messages | absent (route /hr/messages exists) | MISSING-IN-VNEXT |
| 5 | Company & Team | Company & Team (L261) | MATCH |
| x | (none; legacy has /recruiter/profile page but no sidebar row) | `Profile` -> /hr/profile (L267) | EXTRA-IN-VNEXT |

Order: vNext puts Calendar before Company & Team (OK) but Messages missing; Dashboard also prepended (L421). Recruiter: 3 MATCH, 1 LABEL-DIFF, 1 MISSING, 1 EXTRA.
Recruiter top bar (RecruiterTopBar.jsx L16): primary button "Request a drive" + bell. vNext: no top-bar button (MISSING); page heading/buttons use "Request a Drive" (hr/drives/new/page.tsx L71, hr/drives/page.tsx L58, hr/home/page.tsx L97) -> LABEL-DIFF case.
Role label: legacy roles.js L31 `Recruiter`; vNext shell-model.ts L494 and L514 `Employer Recruiter`; app-shell.tsx L127 "Employer access" -> LABEL-DIFF.

### 1.7 Super Admin sidebar (legacy superAdminNavigationMenuFlat L234-L256 + dividers after features, inbound-mail, teachers; vNext superAdminItems L29-56, 21 rows)

| # | Legacy | vNext | Status |
|---|---|---|---|
| 1 | `Overview` (dashboard) | `Dashboard` -> /dashboard (L23-27, L30) | LABEL-DIFF |
| 2 | `Tenant Setup` (tenants) | `Organizations` -> /admin/organizations, `Colleges` -> /admin/colleges (L31-32); page /admin/tenants exists but is not in nav | LABEL-DIFF (one legacy row became two) |
| 3 | Feature Controls | Feature Controls (L34) | MATCH |
| - | (divider) | none | S3 |
| 4 | Module Access | absent as a row (module access lives under /admin/features/[collegeId]) | MISSING-IN-VNEXT |
| 5 | `Tenant Settings` | `Settings` -> /admin/settings (L53) | LABEL-DIFF |
| 6 | `Activity Log` | `Activity` -> /activity (L54) | LABEL-DIFF |
| 7 | `Inbound mail` | `Inbound Mail` (L50) | LABEL-DIFF (case) |
| - | (divider) | none | S3 |
| 8 | Academic Setup (departments, grouped tabs) | flat rows `Departments`, `Academics`, `Lecture Halls`, `Attendance` (L35-38) | MISSING-IN-VNEXT (as grouped row) + 4 EXTRA |
| 9 | `Courses & Content` | `Courses` (L39) | LABEL-DIFF |
| 10 | People (teachers) | People -> /admin/people (L51) | MATCH label |
| - | (divider) | none | S3 |
| 11 | `Profile verification` | `Profile Verification` (L33) | LABEL-DIFF (case) |
| 12 | Placements (jobs; tabs Drives/Companies/Interviews/Analytics/Recruiter accounts/Announcements) | Placements (L41) | MATCH label |
| 13 | Projects (projects/templates landing) | Projects -> /admin/projects (L40) | MATCH label (landing differs, see Part 2) |
| x | none | `Placement Interview Calendar` (L42-47), `Recruiter Accounts` (L48), `Announcements` (L49), `Domains` (L52), `Audit Findings` (L55), `Projects`/`Courses` duplicates | EXTRA-IN-VNEXT |

ORDER-DIFF: legacy order Overview, Tenant Setup, Feature Controls, Module Access, Tenant Settings, Activity Log, Inbound mail, Academic Setup, Courses & Content, People, Profile verification, Placements, Projects.
Super Admin: 4 MATCH, 7 LABEL-DIFF, 2 MISSING, 10 EXTRA, 3 dividers missing.
Legacy SA tab strips (superAdminNavGroups.js): Placements = Drives, Companies, Interviews, Analytics, **Recruiter accounts**, **Announcements**; Projects = **Templates**, Workspaces, At Risk, Readiness, Submissions, Audit. vNext has no SA group strips, and the shared ProjectAdminNav (project-admin-nav.tsx L3-10) always starts with Workspaces (ORDER-DIFF for SA).

### 1.8 Generic multi-role and other shell strings

| Item | Legacy | vNext (file:line) | Status |
|---|---|---|---|
| Dashboard row for multi-role / TPO-only / recruiter-only / SA | none (each role lands on its own first item) | `Dashboard` (shell-model.ts L23-27, L420-422) | EXTRA-IN-VNEXT |
| Duplicate-label qualifiers | none (one role per session; workspace switcher) | `Courses · Teaching`, `· Learning`, `· College`, `· Admin`, `· Placements`, `· Recruiting`, `· Mentoring` (L443-485) | EXTRA-IN-VNEXT (multi-role only) |
| Sidebar nav aria-label | "Main navigation" (Sidebar.js L370) | "Primary navigation" (sidebar-nav.tsx L23) | LABEL-DIFF (S3) |
| Role labels | Super Admin, College Admin, TPO, Mentor, Faculty, Learner, Recruiter | same except Recruiter -> `Employer Recruiter` (shell-model.ts L494, L514) | 1 LABEL-DIFF |

### 1.9 Top navbar / header / profile menu / drawers / switchers / mobile

| # | Element | Legacy (source) | vNext (file:line) | Status |
|---|---|---|---|---|
| H1 | Logo | image /assets/images/logo.svg alt "42LMS logo" (Sidebar.js L384); admin/SA: /assets/images/login/logoo.png alt "42 LMS", link aria "42 LMS Home" (AdminSidebar L78-79, SuperAdminSidebar L65-66) | text "42Students" + "LMS" (components/shell/app-shell.tsx L66-71; mobile-navigation.tsx L91-96). No logo asset exists in public/ (only assets/images/common). | LABEL-DIFF (S2) |
| H2 | Header left text | none (page name is page heading) | role label + college name; fallbacks `Platform administration` (app-shell L106), `Choose an active college` (L109) | EXTRA (S3) |
| H3 | Sidebar footer | none | role label + college name (app-shell L77-90) | EXTRA (S3) |
| H4 | Learner course search | placeholder "Search Courses (e.g., Java, Data Structures, CS...)"; aria "Search courses"; group labels "Recent", "Popular", "Search Results"; empty "No courses found. Try a different search."; "Searching courses" (Header.js L602-L800) | placeholder `Search Courses`, label `Search Courses`, empty text same, no groups (learner-topbar-tools.tsx L66, L81, L112) | LABEL-DIFF placeholder (S2); MISSING groups |
| H5 | Notification bell + drawer | drawer title "Notifications", "View all notifications", empty "No notifications yet", "Open notifications, N total", "Couldn't load notifications", "Refreshing notifications…" (NotifivationDropdown.js L44-L535) | Learner: bell link `Notifications, N unread` to /learn/notifications, no drawer (learner-topbar-tools.tsx L119-133). Others: text link `Notifications` -> /notifications (account-actions.tsx L45). | MISSING-IN-VNEXT drawer; LABEL-DIFF aria |
| H6 | Profile menu | avatar dropdown: [`Complete profile`], section "Manage Account", `My Account`, `Logout` (profiledropdown.js L123-L187); Super Admin: "Manage Account", `Logout` only (SuperAdminProfileDropdown.js) | text links `Security` -> /account/security and button `Sign out` / `Signing out…` for every role except College Admin (account-actions.tsx L48-60; college-account-copy.ts L5); College Admin uses `My Account` -> /college/profile and `Logout` (college-account-copy.ts L4) | LABEL-DIFF for Learner, Faculty, Mentor, TPO, Recruiter, SA; `Complete profile` and "Manage Account" heading MISSING |
| H7 | Workspace / role switcher | Select aria "Switch workspace", placeholders "Switch" / "Switch workspace"; row badges "Last used", "Unverified", "No domain"; labels "Account", "Workspace"; confirm "This college domain is not verified" / "Switching may fail if the domain is not ready. Continue anyway?" / "Continue" / "Cancel"; toasts "Switching workspace…", "Please wait. Don’t close this tab.", "Switch failed" (Header.js L280-L505) | `<option value="">Select college</option>` (membership-switcher.tsx L65), sr-only label `Active college membership` (L56), `No active college membership` (L48), error `Could not switch college. Refresh and try again.` (L37) | LABEL-DIFF (S2) |
| H8 | Super Admin scope select | placeholder "All colleges" (error: "Load failed" / "Load failed - refresh") (SuperAdminHeader.js L83-L109) | `All platform` (admin-scope-switcher.tsx L77), optgroups `Organizations`, `Colleges` (L79, L91), error `Could not change admin scope.` (L57), sr label `Super Admin scope` (L68) | LABEL-DIFF |
| H9 | Mobile menu | button aria "Open navigation menu", drawer aria "Navigation menu", nav aria "Main navigation", logo link "42 LMS Home" | "Open navigation menu" (mobile-navigation.tsx L65), "Navigation menu" (L86), extra "Close navigation" (L78, L100) | MATCH (first two), EXTRA close |
| H10 | **Mobile footer** (MobileFooter.jsx) | Learner: Courses, Alerts, Schedule, Placements, Projects, Profile. Faculty: Courses, Quizzes, Assignments, Profile. Mentor: Projects, Meetings, Alerts, Profile. College admin: Dashboard, Academic, Courses, Placements, Profile. TPO: Home, Engage, Drives, Students, More. Recruiter: Today, Drives, Calendar, Messages, Company. aria "Mobile navigation" | none (hamburger drawer only) | MISSING-IN-VNEXT (all 6 footers) |
| H11 | Impersonation banner | "Acting as", "— this is an impersonated support session.", "Exit impersonation", "Failed to exit impersonation:" (ImpersonationBanner.jsx L40-L69) | not found in shell | MISSING-IN-VNEXT (verify if feature exists) |
| H12 | Skip link | "Skip to main content" (layout.js L317) | none | MISSING (S3) |

---------------------------------------------------------------------------------------------------

## PART 2. PAGE TITLES AND TABS (only routes with a vNext mapping; matches omitted unless noted)

Systemic EXTRA: vNext `PageHeader` renders an uppercase **eyebrow** (components/ui/page-header.tsx L19-23) and a **description** sentence under almost every H1: 469 eyebrow uses in src (learn 44, teacher 33, mentor 30, college 72, tpo 95, hr 38, admin 102). Legacy Learner/Faculty/Mentor/College list pages render title + metric pills only (ListingPageHeader.jsx L16-L40), no eyebrow and no description. Policy decision required: remove eyebrows and descriptions where legacy has none (S3). Legacy subtitles that DO exist are listed under S3 in Part 4.

### Learner

| ID | Route | Legacy | vNext | file:line | Sev |
|---|---|---|---|---|---|
| L1 | /learn/my-placements tab 1 | `Home` (lists.js L381) | `Dashboard` | components/placements/learner-placements-tabs.tsx L7 | S2 |
| L2 | tab 4 | `Schedule` (/schedule) | missing; instead `Assessments`, `Interviews`, `Career Calendar` (L11-13) which legacy dev removed (MovedPage) | same L11-13 | S2 |
| L3 | tab 6 | `Notices` | `Announcements` | same L15 | S2 |
| L4 | tab order | Home, Drives, Applications, Schedule, Offers, Notices, Placement cell | Dashboard, Drives, Applications, Offers, Assessments, Interviews, Career Calendar, Placement cell, Announcements | same L6-16 | S2 |
| L5 | /learn/my-placements/offers | `Your offers` (+ `Needs your reply`, `Earlier offers`) | `My offers` | app/(authenticated)/learn/my-placements/offers/page.tsx L105 | S2 |
| L6 | /learn/my-placements | title `My Placements`, subtitle "Drives, your applications, tests and interviews, and offers in one place." (PlacementsTabsLayout L97-98) | title match; description "Your placement dashboard, applications, assessments, interviews and career activity." | learn/my-placements/page.tsx L221-223 | S3 |
| L7 | course workspace | button `Back to courses`; title "Course", subtitle "Course workspace" | `Back to Courses` | learn/courses/[deliveryId]/[...courseTab]/page.tsx L159 (also learn/courses/error.tsx L26, allQuizzes/error.tsx L21, allAssignments/error.tsx L21) | S2 |
| L8 | learner top search | see H4 | | learner-topbar-tools.tsx L81 | S2 |

Other learner headings MATCH: Courses, All Quizzes, All Assignments (legacy learner = "All" via ternary `isTeacherRole ? "My ..." : "All ..."`), Attendance, Class Schedule, Notifications, Profile, Projects, Drives, Applications, Placement cell. vNext extra learner pages with no legacy twin: placement preparation, rules, support, notification-preferences, attendance calendar, completeness, history (EXTRA, S3 review).

### Faculty

| ID | Route | Legacy | vNext | file:line | Sev |
|---|---|---|---|---|---|
| F1 | /teacher/courses | `My Courses` (CoursesContent L325) | `Courses` | app/(authenticated)/teacher/courses/page.tsx L16, L42 | S2 |
| F2 | /teacher/allQuizzes | `My Quizzes` (QuizzesContent L271) | `All Quizzes` | teacher/allQuizzes/page.tsx L21 | S2 |
| F3 | /teacher/allAssignments | `My Assignments` (AssignmentsContent L575) | `All Assignments` | teacher/allAssignments/page.tsx L21 | S2 |
| F4 | /teacher/contacts/[tab] | H1 equals tab: `All Contacts` / `Teachers` / `Students` | `Contacts` for all tabs | teacher/contacts/[contactsTab]/page.tsx L75 | S2 |
| F5 | course tabs | Overview, Blueprint, Attendance, Discussions, Students | Students 3rd | modules/courses/faculty-course-navigation.ts L3-7 | S2 |
| F6 | /teach/courses | no legacy route | `My Teaching Courses` | app/(authenticated)/teach/courses/page.tsx L30 | EXTRA |

Faculty Class Schedule, Notifications, Profile MATCH.

### Mentor

Projects, Meetings, Notifications MATCH. S3: Meetings subtitle legacy "Every scheduled meeting across your assigned projects, in one place." vs vNext "Registered meetings across your current assigned Projects. Times shown in IST." (mentor/calendar/page.tsx L34-35). Notifications subtitle legacy "Announcements, submissions waiting for review, stalled projects, and meetings coming up soon." vs vNext description in mentor/notifications/page.tsx L77. 30 vNext-only mentor pages (activity, reports, review-history, sprint-progress, task-reviews, team-coverage, reviews ...) and the "Review queue", "Sprint progress" buttons on /mentor/projects (page.tsx L216-226) are EXTRA vs legacy.

### College admin

| ID | Route | Legacy | vNext | file:line | Sev |
|---|---|---|---|---|---|
| C1 | /college/profile | `Profile` (ListingPageHeader) | `My profile` | college/profile/page.tsx L17 | S2 |
| C2 | all grouped pages | visible H1 = group title (`Academic Setup`, `Courses & Content`, `People`, `Placements`, `Projects`) above the tab strip | no visible group heading; per-page H1 (e.g. `Departments`) | components/college/college-legacy-group-tabs.tsx L13; each page's PageHeader | S2 |
| C3 | /college/videos | tab `Video` | H1 `Video Content` | college/videos/page.tsx L23 | S2 |
| C4 | /college/lecture-halls | tab `Lecture Halls` | `Lecture halls` | college/lecture-halls/page.tsx L52, L93 | S2 |
| C5 | /college/batch-promotion | tab `Batch Promotion` | `Batch Promotion Preview` | college/batch-promotion/page.tsx L36, L46 | S2 |
| C6 | /college/course-progress | tab `Progress` | `Course Progress` | college/course-progress/page.tsx L52 | S2 |
| C7 | /college/semester-courses | route title `Semester-Course Mapping` (hyphen, constant.js L41), tab `Semester–Course Mapping` (en dash) | `Semester–Course Mapping` en dash | college/semester-courses/page.tsx L37, L52 | MATCH tab |
| C8 | /college/placements tabs | Drives, Companies, Interviews, Analytics | Drives, Interviews | modules/people/college-legacy-tabs-model.ts L37-40 | S2 MISSING |
| C9 | /college/placements/calendar | tab `Interviews` | H1 `Placement Interview Calendar` | components/placements/placement-calendar-workspace.tsx L524-526 | S2 (verify legacy page H1 in group shell) |
| C10 | /college/projects/* | single Projects tab strip | two strips (CollegeLegacyGroupTabs + ProjectAdminNav) | college/layout.tsx L18 and components/projects/project-admin-nav.tsx | S2 |
| C11 | /college/projects/at-risk, readiness, submissions, audit, templates | in-page heads "At-risk projects", "Project audit"; tabs At Risk, Readiness, Submissions, Templates, Audit | At-risk page `At-risk projects` MATCH, audit `Project audit` MATCH; readiness `Submission readiness` (project-admin-readiness-page.tsx L84), submissions `Project submissions` (project-admin-submissions-page.tsx L90), templates `Template catalogue` (college/projects/templates/page.tsx L28) | verify legacy in-page text per page | S3 |
| C12 | /college/attendance/departments, /college/placements/readiness-by-department, /college/domains, /college/groups, /college/announcements, /college/contacts, /college/branding, /college/college-profile, /college/academics | no legacy page | vNext-only titles ("Attendance by Department", "Placement Evidence by Department", "Tenant domains", "Student groups", ...) | respective page.tsx | EXTRA |
| C13 | /college/people | `People Directory` | `People Directory` | college/people/page.tsx L55,71 | MATCH |
| C14 | /college dashboard, /college/activity, /college/verification, /college/placements (Drives) | Dashboard, Activity Log, Profile verification, Drives | same | college/page.tsx L35; activity/page.tsx L27; verification/page.tsx L21; placements/page.tsx L24 | MATCH |

### TPO (legacy page title = sidebar name, utils/pageTitle.js L10-L17)

| ID | Route | Legacy | vNext | file:line | Sev |
|---|---|---|---|---|---|
| T1 | /tpo/batches | `Placement eligibility` | `Placement batches` | tpo/batches/page.tsx L38 | S2 |
| T2 | /tpo/recruiters | `Engage` | `Engage · Recruiters` | components/tpo/recruiter-leads-workspace.tsx L272 | S2 |
| T3 | /tpo/placements | `Drives` | `Placement Operations` | tpo/placements/page.tsx L20 | S2 |
| T4 | /tpo/team | `Team` | `Placement Team` | tpo/team/page.tsx L24 | S2 |
| T5 | /tpo/students | `Students` | `Students intelligence` | tpo/students/page.tsx L140, L226 | S2 |
| T6 | /tpo/calendar | `Calendar` | `Placement Calendar` | placement-calendar-workspace.tsx L524-525 | S2 |
| T7 | /tpo/audit | `Audit log` | `Audit Log` | tpo/audit/page.tsx L81, L136 | S2 |
| T8 | /tpo/settings | `Settings` | `Placement Settings` | tpo/settings/layout.tsx L5 | S2 |
| T9 | /tpo/more, /tpo/find, /tpo/follow-ups, /tpo/profile ("My profile"), /tpo/home | none / Home | `More`, `Find a record`, `Follow-ups due`, `My profile` | respective files | EXTRA |

TPO Home, Requests, Verification, Announcements, Messages, Reports, Notifications headings MATCH.

### Recruiter

| ID | Route | Legacy | vNext | file:line | Sev |
|---|---|---|---|---|---|
| R1 | /hr/placements | `Drives` (/recruiter/drives, title "Drives") | `Hiring Workspace` | hr/placements/page.tsx L24 | S2 |
| R2 | /hr/calendar | `Calendar` | `Recruiter Calendar` | hr/calendar/page.tsx L297 | S2 |
| R3 | /hr/messages | `Messages` | `Messages & Notifications` | hr/messages/page.tsx L21, L30 | S2 |
| R4 | /hr/profile | `Profile` | `Your Profile` | hr/profile/page.tsx L21 | S2 |
| R5 | request button | `Request a drive` | `Request a Drive` | hr/drives/new/page.tsx L71, L94; hr/drives/page.tsx L58; hr/home/page.tsx L97 | S2 |
| R6 | /hr/home | legacy page head `Today` | `Today` | hr/home/page.tsx L45 | MATCH |
| R7 | /hr/company | `Company & Team` | same | hr/company/page.tsx L62 | MATCH |

### Super Admin

| ID | Route | Legacy | vNext | file:line | Sev |
|---|---|---|---|---|---|
| S1 | /dashboard (SA) | `Overview` | `Platform overview` | dashboard/page.tsx L110 | S2 |
| S2 | /admin/tenants | `Tenant Setup` | `Tenant directory` | admin/tenants/page.tsx L17, L25 | S2 |
| S3 | /admin/settings | `Tenant Settings` | `Platform settings` | admin/settings/page.tsx L33 | S2 |
| S4 | /admin/inbound-mail | `Inbound mail` | `Inbound Mail` | admin/inbound-mail/page.tsx L14 | S2 |
| S5 | /admin/verification | `Profile verification` | `Profile Verification` | admin/verification/page.tsx L24 | S2 |
| S6 | /activity (SA) | `Activity Log` | `Super Admin Activity Log` | activity/page.tsx L177 | S2 |
| S7 | /admin/hr | tab `Recruiter accounts` | `Recruiter Accounts` | admin/hr/page.tsx L46; components/admin/super-admin-hr-accounts.tsx L613 | S2 |
| S8 | /admin/projects tab order | Templates, Workspaces, At Risk, Readiness, Submissions, Audit | Workspaces first | components/projects/project-admin-nav.tsx L3-10 | S2 |
| S9 | /admin/placements tabs | Drives, Companies, Interviews, Analytics, Recruiter accounts, Announcements | no tab strip | admin/placements/* | S2 MISSING |
| S10 | scope select | `All colleges` | `All platform` | admin-scope-switcher.tsx L77 | S2 |
| S11 | Module Access | standalone sidebar page | inside /admin/features/[collegeId] | | S2 MISSING |
| S12 | /admin/features `Feature Controls` | | same | admin/features/page.tsx L73, L114 | MATCH |

### Public / login (sample; the full login copy is a separate lane)

Legacy Login.js (dev) vs vNext components/auth/login-form.tsx: heading `Sign in` MATCH (L180). `Email address` (L236) vs legacy `Email`; button `Send code` (L258) vs `Continue`; `Verification code` (L291) vs `One-time code`; `Verify and continue` (L341) vs `Verify and sign in`; `Email me the code instead` (L360) vs `Get the code by email`; `Resend code in Ns` (L351) vs `Resend code in 0:NN`; code placeholder `123456` (L301) vs `Enter the code`; legacy footer "By continuing, you agree to the Terms of Use / Privacy Policy", "Powered by 42LMS" absent. app/login/page.tsx redirects to "/" (legacy /login exists). Landing app/page.tsx L119, L123: `42Students`, `LMS vNext` (legacy title "42 LMS"). S2.

---------------------------------------------------------------------------------------------------

## PART 3. REACHABILITY OF REMOVED COLLEGE ADMIN SIDEBAR ITEMS (commit b183b1ce8, plus tabs in 024e3e5f8)

| Removed item | Page | Reachable from new nav? | Exact path from UI | Verdict |
|---|---|---|---|---|
| Placement Calendar | /college/placements/calendar (app/(authenticated)/college/placements/calendar/page.tsx) | Yes | Sidebar `Placements` (/college/placements) -> Placements tab strip -> tab `Interviews` (college-legacy-tabs-model.ts L39) | OK |
| Students | /college/students | Yes | Sidebar `People` (/college/people) -> People tab strip -> tab `Students` (L34) | OK |
| Lecture Halls | /college/lecture-halls | Yes | Sidebar `Academic Setup` (/college/departments) -> tab `Lecture Halls` (L17) | OK |
| Courses · College | /college/courses | Yes | Sidebar `Courses & Content` -> /college/courses (L279) and tab `Courses` | OK |
| Projects · College | /college/projects (workspace list), /college/projects/[id]/... | **NO (from sidebar and from the Projects tab strip)** | Sidebar `Projects` -> /college/projects/workspaces. There is **no page.tsx** at college/projects/workspaces (only workspaces/new). The dynamic `[projectId]` route catches "workspaces", whose page redirects to /college/projects/workspaces/summary (college/projects/[projectId]/page.tsx L9-14), which then renders `[projectId]/[section]` with projectId = "workspaces" and fails. Same dead href is the first tab `Workspaces` (college-legacy-tabs-model.ts L42). The working list is /college/projects, reachable only through the second strip (ProjectAdminNav "Workspaces" -> /college/projects) once a user is already on another projects page, and via no sidebar link. | **P0 BROKEN: workspace list/detail unreachable from UI** |

Fix (S2/behaviour): either add app/(authenticated)/college/projects/workspaces/page.tsx that re-exports college/projects/page.tsx, or change the two hrefs (shell-model.ts L284 and college-legacy-tabs-model.ts L42) to /college/projects and add `/college/projects` to the Projects row's active prefixes. Legacy has /college-admin/projects/workspaces as the list, so keeping the URL and adding the page is the closest match.

Other pages that lost their only UI link in the same change (not listed in the task, found while checking):

| Page | Linked from anywhere else? | Verdict |
|---|---|---|
| /college/domains | no | ORPHAN (legacy College Admin has no domains page; likely intentional, confirm) |
| /college/announcements | no | ORPHAN (legacy has none; confirm) |
| /college/groups (+ /[groupId]) | no | ORPHAN (legacy hid Student Groups on dev: "Student Groups removed from nav on dev"; acceptable) |
| /college/projects/reassign-mentor | only via its own page nav; no link from list | ORPHAN (legacy exposes it as a button on the workspace list) |
| /college/attendance/departments | only self-links (college-department-insights.tsx L24) | ORPHAN (vNext-only page) |
| /college/placements/readiness-by-department | only self-links (L25) | ORPHAN (vNext-only page) |
| /college/academics | dashboard setup checklist (modules/admin-ui/college-setup-checklist-model.ts L22) | reachable |
| /college/college-profile | from /college/profile (college/profile/page.tsx L36) | reachable |
| /college/branding | dashboard button (college/page.tsx L57) and college-profile | reachable |
| /college/contacts | dashboard (L48) and People page "Browse contacts" (people/page.tsx L73) | reachable |
| /college/placements/drives, /new | placements page | reachable |
| /college/attendance/corrections, /settings | attendance page | reachable |
| /college/students/import | role directory workspace | reachable |

Unreachable-from-UI count: 1 P0 (projects list), 6 orphans (2 to review: reassign-mentor and domains).

---------------------------------------------------------------------------------------------------

## PART 4. FIX LIST (exact replacement strings, grouped by file)

### S2 (nav labels, headings, buttons, tab names)

**src/components/shell/shell-model.ts**
- L165 `label: "All Assignments"` -> `label: "All assignments"`
- L188 `"Recruiter Leads"` -> `"Engage"`; L195 `"Placement Operations"` -> `"Drives"`; L230 `"Audit Log"` -> `"Audit log"`
- Replace tpoItems (L187-240) with, in order, hrefs on the right and `group` = operate/coordinate/insights/administration: `Home` /tpo/home; `Placement eligibility` /tpo/batches; `Engage` /tpo/recruiters; `Drives` /tpo/placements; `Team` /tpo/team | `Students` /tpo/students; `Requests` /tpo/requests; `Verification` /tpo/verification; `Calendar` /tpo/calendar; `Announcements` /tpo/announcements | `Reports` /tpo/reports | `Messages` /tpo/messages; `Settings` /tpo/settings; `Audit log` /tpo/audit; `Notifications` /tpo/notifications. Add section header text `Operate`, `Coordinate`, `Insights`, `Administration` (needs a `groupLabel` option in sidebar-nav.tsx). Remove `Companies` and `More` rows ONLY after adding links to /tpo/companies and /tpo/more from Drives/Engage/Home so those pages stay reachable. Skip the generic `Dashboard` for TPO-only (branch like the Mentor one, L399-407).
- Recruiter (L242-272): `Hiring Workspace` -> `Drives` and href `/hr/drives` (page already titled "Drives"; keep /hr/placements reachable from Drives); insert `Messages` -> /hr/messages after Calendar; remove `Profile` row (move link into the profile menu); legacy order: Today, Drives, Calendar, Messages, Company & Team; groups: first four `learning`, Company & Team `account`; skip the generic Dashboard for recruiter-only.
- L494, L514 `"Employer Recruiter"` -> `"Recruiter"`.
- Super Admin (L29-56): replace with `Overview` /dashboard; `Tenant Setup` /admin/tenants; `Feature Controls` /admin/features; | `Module Access` (needs route, e.g. /admin/features module tab); `Tenant Settings` /admin/settings; `Activity Log` /activity; `Inbound mail` /admin/inbound-mail; | `Academic Setup` /admin/departments; `Courses & Content` /admin/courses; `People` /admin/people; | `Profile verification` /admin/verification; `Placements` /admin/placements; `Projects` /admin/projects/templates. Dividers (`|`) after Feature Controls, Inbound mail, People. Do this only after SA tab strips exist (reuse COLLEGE_LEGACY_GROUPS with basePath /admin plus SA extras `Recruiter accounts`, `Announcements`, and Projects order Templates, Workspaces, At Risk, Readiness, Submissions, Audit), otherwise Departments, Academics, Lecture Halls, Attendance, Courses, Recruiter Accounts, Announcements, Domains, Audit Findings, Placement Interview Calendar, Colleges, Organizations become orphans.
- L284 `"/college/projects/workspaces"` stays only if the page is added (Part 3); else `"/college/projects"`.
- L280 People href `/college/people` -> `/college/faculty` (legacy lands on Faculty tab).
- College rows: add `group` so separators follow Activity Log, People, Projects (legacy), and add active-prefix matching per row (sidebar-nav.tsx L36-39).
- L320-330 `Drive Day`: remove (dev legacy has no row) or `Drive day` if prod parity is wanted.

**src/components/shell/app-shell.tsx** L66-71 and **mobile-navigation.tsx** L91-96: replace text `42Students` / `LMS` with `<Image src="/assets/images/logo.svg" alt="42LMS logo">` (admin/SA: `/assets/images/login/logoo.png`, alt `42 LMS`, link aria-label `42 LMS Home`). Copy both files from the legacy repo public/assets/images into vNext public/assets/images; they do not exist today.
- L127 `Employer access` -> remove (legacy shows college once in account area) or keep as S3.
- L106 `Platform administration`, L109 `Choose an active college`: S3 helper text.

**src/components/shell/account-actions.tsx** L45-60 and **college-account-copy.ts** L2-6: for every role use `accountLabel: "My Account"`, `signOutLabel: "Logout"`, drop `Signing out…`. Hrefs: Learner /learn/profile, Faculty /teacher/profile, Mentor /mentor/profile (verify route), College /college/profile, TPO /tpo/profile, Recruiter /hr/profile. Super Admin: no `My Account`, only `Logout`. Replace the standalone text link `Notifications` (L45) with a bell drawer titled `Notifications` containing `View all notifications` / empty `No notifications yet` / errors `Couldn't load notifications` and `Refreshing notifications…` (legacy NotifivationDropdown.js L44-L535). Move `Security` (/account/security) into the account menu below `My Account` only if the owner wants it kept.

**src/components/shell/membership-switcher.tsx** L56 `Active college membership` -> `Switch workspace`; L65 `Select college` -> `Switch workspace` (placeholder `Switch` on narrow); L37 error -> `Switch failed`; L48 `No active college membership` -> keep S3.
**src/components/shell/admin-scope-switcher.tsx** L77 `All platform` -> `All colleges`.
**src/components/shell/learner-topbar-tools.tsx** L81 placeholder `Search Courses` -> `Search Courses (e.g., Java, Data Structures, CS...)`; add group labels `Recent`, `Popular`, `Search Results`.
**src/components/shell/mobile-navigation.tsx**: add MobileFooter equivalents per role (labels in 1.9 H10).
**src/app/layout.tsx** L5: `title: "42 LMS vNext"` -> `title: { default: "42LMS", template: "%s · 42LMS" }`; add per-page `metadata.title` with the Part 2 heading strings.

**src/components/placements/learner-placements-tabs.tsx** L6-16 -> exactly: `Home` /learn/my-placements, `Drives` /jobs, `Applications` /applications, `Schedule` /schedule (new page merging assessments, interviews, calendar), `Offers` /offers, `Notices` /announcements, `Placement cell` /placement. Remove `Dashboard`, `Assessments`, `Interviews`, `Career Calendar`, `Announcements` from the strip (keep routes reachable via Schedule).
**src/app/(authenticated)/learn/my-placements/offers/page.tsx** L105 `My offers` -> `Your offers`.
**src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx** L159 and **learn/courses/error.tsx** L26, **learn/allQuizzes/error.tsx** L21, **learn/allAssignments/error.tsx** L21, **teacher/calendar/error.tsx** L19, **teacher/courses/[deliveryId]/assessment-health/page.tsx** L29: `Back to Courses` -> `Back to courses`.

**src/app/(authenticated)/teacher/courses/page.tsx** L16, L42: `Courses` -> `My Courses`.
**src/app/(authenticated)/teacher/allQuizzes/page.tsx** L21: `All Quizzes` -> `My Quizzes`.
**src/app/(authenticated)/teacher/allAssignments/page.tsx** L21: `All Assignments` -> `My Assignments`.
**src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx** L75: `Contacts` -> `All Contacts` | `Teachers` | `Students` by tab (use the `tabs[...].label`).
**src/modules/courses/faculty-course-navigation.ts** L3-7: order -> Overview, Blueprint, Attendance, Discussions, Students.

**src/modules/people/college-legacy-tabs-model.ts**: L42 Workspaces href -> `/college/projects` (or add the page); L37-40 add `Companies` and `Analytics` once routes exist (legacy order Drives, Companies, Interviews, Analytics).
**src/components/college/college-legacy-group-tabs.tsx** L13: render visible `<h1>{group.title}</h1>` (Academic Setup / Courses & Content / People / Placements / Projects) above the tabs and lower each page's own PageHeader to a subheading.
**src/components/projects/project-admin-nav.tsx**: do not render under /college/projects (single strip); for /admin keep order Templates, Workspaces, At Risk, Readiness, Submissions, Audit.
**src/app/(authenticated)/college/profile/page.tsx** L17: `My profile` -> `Profile`.
**src/app/(authenticated)/college/videos/page.tsx** L23: `Video Content` -> `Video`.
**src/app/(authenticated)/college/lecture-halls/page.tsx** L52, L93: `Lecture halls` -> `Lecture Halls`.
**src/app/(authenticated)/college/batch-promotion/page.tsx** L36, L46: `Batch Promotion Preview` -> `Batch Promotion`.
**src/app/(authenticated)/college/course-progress/page.tsx** L52: `Course Progress` -> `Progress`.

**src/app/(authenticated)/tpo/batches/page.tsx** L38 `Placement batches` -> `Placement eligibility`.
**src/components/tpo/recruiter-leads-workspace.tsx** L272 `Engage · Recruiters` -> `Engage`.
**src/app/(authenticated)/tpo/placements/page.tsx** L20 `Placement Operations` -> `Drives`.
**src/app/(authenticated)/tpo/team/page.tsx** L24 `Placement Team` -> `Team`.
**src/app/(authenticated)/tpo/students/page.tsx** L140, L226 `Students intelligence` -> `Students`.
**src/components/placements/placement-calendar-workspace.tsx** L524-526: TPO `Placement Calendar` -> `Calendar`.
**src/app/(authenticated)/tpo/audit/page.tsx** L81, L136 `Audit Log` -> `Audit log`.
**src/app/(authenticated)/tpo/settings/layout.tsx** L5 `Placement Settings` -> `Settings`.
**src/app/(authenticated)/tpo/layout.tsx** L15-16: `Find a record` -> search field with placeholder `Find a student, recruiter, company or drive` (hint `Ctrl K`), add `New` menu (`Follow-up`, `Recruiter lead`, `Drive`) and Messages icon; drop `Home` text link.
**src/components/tpo/tpo-bell-panel.tsx** L27 `No notifications yet.` -> `Nothing yet` + `Things that happen on your drives and recruiters show up here.`; L34 `All notifications` -> `See all notifications`; remove `Close` (L25) and sub-line (L26) or move to S3.

**src/app/(authenticated)/hr/placements/page.tsx** L24 `Hiring Workspace` -> `Drives` (or retarget nav to /hr/drives).
**src/app/(authenticated)/hr/calendar/page.tsx** L297 `Recruiter Calendar` -> `Calendar`.
**src/app/(authenticated)/hr/messages/page.tsx** L21, L30 `Messages & Notifications` -> `Messages`.
**src/app/(authenticated)/hr/profile/page.tsx** L21 `Your Profile` -> `Profile`.
**src/app/(authenticated)/hr/drives/new/page.tsx** L71, L94; **hr/drives/page.tsx** L58; **hr/home/page.tsx** L97: `Request a Drive` -> `Request a drive`; add header button `Request a drive` (-> /hr/drives/new) next to the bell.

**src/app/(authenticated)/dashboard/page.tsx** L110 `Platform overview` -> `Overview`.
**src/app/(authenticated)/admin/tenants/page.tsx** L17, L25 `Tenant directory` -> `Tenant Setup`.
**src/app/(authenticated)/admin/settings/page.tsx** L33 `Platform settings` -> `Tenant Settings`.
**src/app/(authenticated)/admin/inbound-mail/page.tsx** L14 `Inbound Mail` -> `Inbound mail`.
**src/app/(authenticated)/admin/verification/page.tsx** L24 `Profile Verification` -> `Profile verification`.
**src/app/(authenticated)/activity/page.tsx** L177 `Super Admin Activity Log` -> `Activity Log`; `Activity Center` (non-SA) -> `Activity Log`.
**src/app/(authenticated)/admin/hr/page.tsx** L46 and **components/admin/super-admin-hr-accounts.tsx** L613 `Recruiter Accounts` -> `Recruiter accounts`.

**src/components/auth/login-form.tsx**: L236 `Email address` -> `Email`; L258 `Send code` -> `Continue`; L291 `Verification code` -> `One-time code`; L341 `Verify and continue` -> `Verify and sign in`; L360 `Email me the code instead` -> `Get the code by email`; L301/L324 placeholder `123456` -> `Enter the code`.

### S3 (helper text, eyebrows, descriptions, aria)

- Remove or reduce `eyebrow` on every page where legacy has none (components/ui/page-header.tsx L19-23; 469 call sites). If kept, never show the vNext-only prefixes "Learner", "Faculty", "Mentor · Projects", "College Admin · People", "TPO · ...", "Employer Recruiter", "Super Admin".
- Remove vNext descriptions on legacy list pages without subtitles: learn/allAssignments L68, allQuizzes L50, courses L93, attendance L25, calendar L45, notifications L67, profile L37, projects L127; teacher/calendar, notifications, contacts L76, courses L16.
- Learner My Placements description (learn/my-placements/page.tsx L222-223) -> `Drives, your applications, tests and interviews, and offers in one place.`
- Mentor Meetings description (mentor/calendar/page.tsx L35) -> `Every scheduled meeting across your assigned projects, in one place.`; Mentor Notifications description -> `Announcements, submissions waiting for review, stalled projects, and meetings coming up soon.`
- Mentor Projects: keep `Choose a project to open its workspace.` (MATCH).
- College Profile verification subtitle already matched (commit 9788481bb).
- sidebar-nav.tsx L23 aria-label `Primary navigation` -> `Main navigation`.
- Add "Skip to main content" link at top of the shell.
- Faculty sidebar group tags (shell-model.ts L127-179): set all rows `teaching` except Profile `account` to restore the single divider.
- app-shell.tsx L99-110 header sub-text and L77-90 sidebar footer (role + college name): not in legacy; hide or keep as accessibility-only.
- tpo-bell-panel.tsx aria `TPO notifications` / `Notification bell panel` -> `Notifications` / `Notifications`.

---------------------------------------------------------------------------------------------------

## COUNTS

Part 1 navigation items (legacy rows):
- Learner 9 MATCH / 0 diff / 1 EXTRA
- Faculty 6 MATCH / 1 LABEL-DIFF / 1 MISSING (conditional Placement cell)
- Mentor 3 MATCH
- College admin 10 MATCH label (1 broken href, 1 landing diff, dividers + active state missing); tab groups: 3 of 5 identical, Placements missing 2 tabs, Projects broken href, group heading missing
- TPO 5 MATCH / 3 LABEL-DIFF / 7 MISSING / 2 EXTRA / 4 section headers missing / ORDER-DIFF
- Recruiter 3 MATCH / 1 LABEL-DIFF / 1 MISSING / 1 EXTRA
- Super Admin 4 MATCH / 7 LABEL-DIFF / 2 MISSING / 10 EXTRA / 3 dividers missing / ORDER-DIFF
- Shell and top navbar rows (1.8 + 1.9): 16 rows checked: 2 MATCH-ish (mobile menu labels), 12 LABEL-DIFF or MISSING, 4 EXTRA
- Browser title: 1 FLAG (matches neither format)

Part 2 page-title/tab mismatches listed: Learner 8, Faculty 6, Mentor 0 S2 (2 S3), College 12, TPO 9, Recruiter 5, Super Admin 11, Public/login 7 = 58 items (about 46 S2, 12 S3), plus systemic eyebrow/description EXTRA (469 call sites).
Part 3: 5 removed items checked: 4 reachable, 1 UNREACHABLE (Projects list/detail via sidebar+tab, P0); 6 additional orphan pages.
Part 4: about 70 S2 replacement instructions across 52 files, 12 S3 groups.

## TOP 10 PROBLEMS

1. P0: College Admin sidebar `Projects` and Projects tab `Workspaces` point to /college/projects/workspaces, which has no page; the workspace list and detail are unreachable from the UI (shell-model.ts L284, college-legacy-tabs-model.ts L42).
2. TPO sidebar is not the legacy one: 7 of 15 rows missing (Home, Placement eligibility, Team, Requests, Verification, Announcements, Notifications), 3 renamed (Engage, Drives, Audit log), 2 extras (Companies, More), no Operate/Coordinate/Insights/Administration headers, plus generic Dashboard.
3. Super Admin sidebar has 21 flat rows vs legacy 13 (no Tenant Setup, Module Access, grouped Academic Setup; 10 extras; 7 case/label diffs); the grouped tab strips (Placements with Recruiter accounts/Announcements, Projects starting at Templates) do not exist, so a straight swap would orphan pages.
4. Browser title is one static `42 LMS vNext` on every page; legacy is `<title> · 42LMS` (dev) or `42 LMS - <title>` (prod).
5. Account menu: every role except College Admin shows `Security` / `Sign out` / `Signing out…`; legacy is `My Account` / `Logout` (Super Admin: `Logout` only); no notification drawer; no `Complete profile`; no mobile footer for any role.
6. Logo and header: vNext prints text `42Students LMS` (and no logo asset in public/) where legacy shows the 42LMS logo image; workspace switcher says `Select college` / `Active college membership` vs `Switch workspace`; SA scope `All platform` vs `All colleges`.
7. Learner My Placements tab strip mixes prod and dev: `Dashboard`, `Assessments`, `Interviews`, `Career Calendar`, `Announcements` vs dev `Home`, `Schedule`, `Notices`; `Schedule` page missing; `My offers` vs `Your offers`.
8. Faculty headings: `Courses`, `All Quizzes`, `All Assignments` should be `My Courses`, `My Quizzes`, `My Assignments`; sidebar `All Assignments` should be `All assignments`; Contacts H1 should follow tab (`All Contacts` / `Teachers` / `Students`); course tabs should end with Students.
9. Recruiter: sidebar `Hiring Workspace` vs `Drives`, Messages row missing, extra Profile row; headings `Recruiter Calendar`, `Messages & Notifications`, `Your Profile` vs `Calendar`, `Messages`, `Profile`; `Request a Drive` vs `Request a drive`; top-bar Request button missing; role label `Employer Recruiter` vs `Recruiter`.
10. College grouped pages have no visible group heading (legacy shows Academic Setup / Courses & Content / People / Placements / Projects), Placements tabs lack Companies and Analytics, Projects pages show two tab strips, and 6 pages (domains, announcements, groups, reassign-mentor, attendance/departments, readiness-by-department) lost their only link. Behind all of it, 469 vNext-only eyebrows and descriptions add words legacy never had.

---------------------------------------------------------------------------------------------------

## Shell-level wording pass (status after implementation)

Done (unit-test evidence in tests/unit/shell-page-titles, chat9-phase2-college-topbar-copy, shell-switcher-wording, faculty-legacy-wording, super-admin-legacy-wording):
- Browser titles: root metadata `{ default: "42LMS", template: "%s · 42LMS" }`; `PageTitle` (components/shell/page-title.tsx) sets `<title> · 42LMS` from the route map in components/shell/page-titles.ts for Learner, Faculty, Mentor, College Admin (legacy constant.js routeTitles/adminRouteTitles, including the legacy quirk "All Assignment"); Super Admin pages use the constant `Superadmin · 42LMS`. Pages with no known legacy title fall back to `42LMS`. TPO, Recruiter and project pages are not mapped (other lanes).
- Account menu: `My Account` + `Logout` for every role (hrefs: College /college/profile, TPO /tpo/profile, Faculty /teacher/profile, Learner /learn/profile, Recruiter /hr/profile; Mentor and multi-role fallbacks keep /account/security because no mentor profile page exists); Super Admin shows `Logout` only; `Signing out…` removed. /account/security still works but is no longer linked from the menu for non-college roles (College profile still links "Signed-in devices"); decide where it should be linked.
- Switchers: `Switch workspace` (label and placeholder), Super Admin `All colleges`.
- Faculty: headings `My Courses`, `My Quizzes`, `My Assignments`; sidebar `All assignments`; Contacts heading follows the tab; `Students` is the last course tab. The sidebar rows `Courses` and `All Quizzes` stay as in legacy lists.js (only the headings are "My ...").
- Super Admin label-only fixes: sidebar `Overview`, `Profile verification`, `Inbound mail`, `Tenant Settings`, `Activity Log`, `Courses & Content`, `Recruiter accounts`; headings `Overview`, `Tenant Setup`, `Tenant Settings`, `Inbound mail`, `Profile verification`, `Activity Log`, `Recruiter accounts`. No row added or removed, so no page was orphaned.

Skipped: faculty conditional `Placement cell` row (needs a per-user TPO-access lookup in the single-role faculty branch, not cheap); faculty group dividers (S3).

## Super Admin follow-up

Do NOT restructure the Super Admin sidebar to the 13-row legacy list until these tab strips exist (otherwise the pages listed become unreachable). Build in this order:
1. **Tenant Setup strip** (legacy row `Tenant Setup`, /admin/tenants): tabs for `Organizations` (/admin/organizations) and `Colleges` (/admin/colleges), plus the tenant directory itself. Only then drop the two flat rows `Organizations` and `Colleges`.
2. **Academic Setup strip** (reuse COLLEGE_LEGACY_GROUPS with basePath /admin: Departments, Programs, Semesters, Semester–Course Mapping, Batches, Classes, Batch Promotion, Lecture Halls, Electives, Attendance). Only then drop the flat rows `Departments`, `Academics`, `Lecture Halls`, `Attendance`.
3. **Courses & Content strip** (Courses, Lessons, Video, Resources, Live Classes, Assignments, Quizzes, Progress) so the single `Courses & Content` row reaches all of them.
4. **People strip** (Faculty, Faculty Assignment, Students, People Directory).
5. **Placements strip** with SA extras: Drives, Companies, Interviews, Analytics, `Recruiter accounts` (/admin/recruiters), `Announcements` (/admin/announcements). Only then drop the flat rows `Recruiter accounts`, `Announcements` and `Placement Interview Calendar` (the calendar becomes the `Interviews` tab).
6. **Projects strip** with Super Admin order Templates, Workspaces, At Risk, Readiness, Submissions, Audit (ProjectAdminNav currently starts with Workspaces), landing on /admin/projects/templates.
7. **Module Access** page/route (currently inside /admin/features/[collegeId]) so the legacy `Module Access` row has a target.
8. Decide separately where `Domains` (/admin/domains) and `Audit Findings` (/tracker/audit-findings), which have no legacy row, are linked (e.g. from Tenant Setup / Activity Log), then add the three legacy dividers (after Feature Controls, Inbound mail, People).

## Deferred decision: eyebrows and descriptions

Removing the vNext-only eyebrow and description under page headings touches about 469 call sites and changes visual hierarchy. Not done in the shell pass. Options for the owner: (a) delete both globally by making `PageHeader` ignore them (one-file change, hides intent), (b) remove per role lane as each lane audits its pages, (c) keep descriptions only where legacy has a subtitle (list in Part 4 S3). Needs an owner decision before any change.
