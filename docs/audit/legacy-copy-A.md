# Legacy copy catalogue A: LEARNER, FACULTY, MENTOR, COLLEGE (exact strings)

Generated 2026-10-15, read-only. Legacy app has NO i18n/locale files (no i18n dependency in package.json); every string lives in component source (`src/pages`, `src/components`, `src/common`, `src/utils`). Source branch for all text: **lms-dev-2026** (63fea105, worktree `C:\Users\LENOVO\Desktop\42LMS\_hr-tpo-fe`). Comparison branch: **prod-2026** (6dfc3f35, extracted from git into scratchpad).

## How to read this file

- Each file block lists strings as `L<line> <kind>: <text>` where line is the line in the file on lms-dev-2026 and text is the exact string value (whitespace runs inside JSX text collapsed to one space; template literals show `${expr}` placeholders with the source expression; JSON-escaped quotes appear as plain quotes).
- `kind`: `text(<Element>)` = JSX text inside that element; `attr:<name>(<Element>)` = JSX prop (title, label, placeholder, description, message, okText, cancelText, aria-label, alt, tooltip ...); `child(<Element>)` = string/template/ternary branch inside a JSX expression child; `prop:<key>` = object property (Table column `title`, form rule `message`, menu `label`/`modulename`, etc.); `call:<fn>` = toast/notification/setError/Modal.confirm style call; `new Error`; `return`; `const:<NAME>`; `str` = any other multi-word string literal (validation messages, fallback copy, date format strings are filtered).
- Branch marking: file header states whether the file exists on both branches ("both (identical)", "both (differs)") or "lms-dev-2026 only". Inside a "both (differs)" file, strings prefixed `[DEV]` do not exist (same text) in the prod-2026 version of that file; strings under "present only on prod-2026 version" exist on prod only. Unmarked strings exist in both.
- **Limitations (confirm per page audit):** extraction is syntactic (AST). It cannot see strings built at runtime from API data, strings assembled by helper functions with non-literal arguments, strings in CSS `content:`, or backend-supplied messages. Single-word strings are captured only in text-bearing contexts (JSX text, label/title/placeholder-type props, toast calls). A string appearing in a component is listed once under the component; pages are cross-referenced by the "Page closure" lists. Role-conditional strings are not separated by role; the "used by" list shows which routes import the file.
- Section 3 per-page headings, tabs, columns etc. are identifiable by kind (`text(h1|h2|h3)`, `prop:title` in columns, `attr:label(Form.Item)`...). Browser tab titles come from `src/utils/pageTitle.js` (section 2).


## 1. Sidebar / menu items (verbatim source lines, lms-dev-2026 `src/common/lists.js`, in rendered order; `modulename`/`label` is the visible text, `icon` the icon asset or Ant icon name, `group` the sidebar section)

### LEARNER sidebar (lists.js L55-L123)
```text
L55: export const studentNavigationMenu = (props) => [
L56:   // ── Learning (daily workflow) ───────────────────────────
L57:   {
L58:     modulename: "Courses",
L59:     path: "courses",
L60:     group: "learning",
L61:     icon:
L62:       props?.id === "courses"
L63:         ? "/assets/images/common/course.svg"
L64:         : "/assets/images/common/courses.svg",
L65:   },
L66:   {
L67:     modulename: "Quizzes",
L68:     path: "allQuizzes",
L69:     group: "learning",
L70:     icon:
L71:       props?.id === "allQuizzes"
L72:         ? "/assets/images/common/quiz-active.svg"
L73:         : "/assets/images/common/quiz.svg",
L74:   },
L75:   {
L76:     modulename: "Assignments",
L77:     path: "allAssignments",
L78:     group: "learning",
L79:     icon:
L80:       props?.id === "allAssignments"
L81:         ? "/assets/images/common/assignment-active.svg"
L82:         : "/assets/images/common/assignment.svg",
L83:   },
L84:   // ── Tracking (periodic check-ins) ──────────────────────
L85:   {
L86:     modulename: "Class Schedule",
L87:     path: "calendar",
L88:     group: "tracking",
L89:     icon: "/assets/images/common/calender.svg",
L90:   },
L91:   {
L92:     modulename: "Attendance",
L93:     path: "attendance",
L94:     group: "tracking",
L95:     icon: "/assets/images/common/attendance.svg",
L96:   },
L97:   // ── Career (placement) ──────────────────────────────────
L98:   {
L99:     modulename: "My Placements",
L100:     path: "my-placements",
L101:     group: "career",
L102:     icon: "/assets/images/common/book-open.svg",
L103:   },
L104:   {
L105:     modulename: "Projects",
L106:     path: "projects",
L107:     group: "learning",
L108:     icon: "/assets/images/common/folder.svg",
L109:   },
L110:   // ── Utility & Account ──────────────────────────────────
L111:   {
L112:     modulename: "Notifications",
L113:     path: "notifications",
L114:     group: "account",
L115:     icon: "/assets/images/common/notification.svg",
L116:   },
L117:   {
L118:     modulename: "Profile",
L119:     path: "profile",
L120:     group: "account",
L121:     icon: "/assets/images/common/myAccount.svg",
L122:   },
L123: ];
```

### FACULTY sidebar (lists.js L1-L53)
```text
L1: export const teacherNavigationMenu = (props) => [
L2:   {
L3:     modulename: "Courses",
L4:     path: "courses",
L5:     group: "teaching",
L6:     icon:
L7:       props?.id === "courses"
L8:         ? "/assets/images/common/course.svg"
L9:         : "/assets/images/common/courses.svg",
L10:   },
L11:   {
L12:     modulename: "Contacts",
L13:     path: "contacts",
L14:     group: "teaching",
L15:     icon: "/assets/images/common/contact.svg",
L16:   },
L17:   {
L18:     modulename: "Notifications",
L19:     path: "notifications",
L20:     group: "teaching",
L21:     icon: "/assets/images/common/notification.svg",
L22:   },
L23:   {
L24:     modulename: "Class Schedule",
L25:     path: "calendar",
L26:     group: "teaching",
L27:     icon: "/assets/images/common/calender.svg",
L28:   },
L29:   {
L30:     modulename: "All Quizzes",
L31:     path: "allQuizzes",
L32:     group: "teaching",
L33:     icon:
L34:       props?.id === "allQuizzes"
L35:         ? "/assets/images/common/quiz-active.svg"
L36:         : "/assets/images/common/quiz.svg",
L37:   },
L38:   {
L39:     modulename: "All assignments",
L40:     path: "allAssignments",
L41:     group: "teaching",
L42:     icon:
L43:       props?.id === "allAssignments"
L44:         ? "/assets/images/common/assignment-active.svg"
L45:         : "/assets/images/common/assignment.svg",
L46:   },
L47:   {
L48:     modulename: "Profile",
L49:     path: "profile",
L50:     group: "account",
L51:     icon: "/assets/images/common/myAccount.svg",
L52:   },
L53: ];
```

### MENTOR sidebar (lists.js L311-L333)
```text
L311: export const mentorNavigationMenu = (props) => [
L312:   {
L313:     modulename: "Projects",
L314:     path: "projects",
L315:     group: "learning",
L316:     icon:
L317:       props?.id === "projects"
L318:         ? "/assets/images/common/folder.svg"
L319:         : "/assets/images/common/folder.svg",
L320:   },
L321:   {
L322:     modulename: "Meetings",
L323:     path: "calendar",
L324:     group: "learning",
L325:     icon: "/assets/images/common/calender.svg",
L326:   },
L327:   {
L328:     modulename: "Notifications",
L329:     path: "notifications",
L330:     group: "learning",
L331:     icon: "/assets/images/common/notification.svg",
L332:   },
L333: ];
```

### COLLEGE ADMIN sidebar (flat list; nested group tabs below) (lists.js L192-L212)
```text
L192: export const adminNavigationMenuFlat = () => [
L193:   { modulename: "Dashboard", path: "dashboard", icon: "DashboardOutlined" },
L194:   { modulename: "Activity Log", path: "audit", icon: "HistoryOutlined" },
L195:   { modulename: "Academic Setup", path: "departments", icon: "ApartmentOutlined" },
L196:   { modulename: "Courses & Content", path: "courses", icon: "BookOutlined" },
L197:   { modulename: "People", path: "teachers", icon: "UsergroupAddOutlined" },
L198:   { modulename: "Profile verification", path: "verification", icon: "SafetyCertificateOutlined" },
L199:   // Single entry for the whole Placements module (Jobs, Hiring Dashboard, Interview Calendar) —
L200:   // those used to be three separate sidebar items; they're now one section reached via a
L201:   // horizontal sub-nav (see PlacementsSubNav) so the sidebar doesn't fragment one module into
L202:   // three unrelated-looking rows. getSidebarActiveKey maps all three routes back to "jobs" so
L203:   // this entry stays highlighted no matter which placements page is open.
L204:   { modulename: "Placements", path: "jobs", icon: "SolutionOutlined" },
L205:   // The placement cell workspace (TPO V1). Where a college has no TPO account the college admin acts as TPO admin, so it is always here.
L206:   { modulename: "Placement cell", path: "placement-cell", href: "/tpo/home", icon: "TeamOutlined" },
L207:   // Points at the group's landing tab rather than a bare "projects" route: the Projects group no
L208:   // longer has an overview page, and college-admin's day starts at the live workspaces. The path
L209:   // must equal groupDefaultPath("projects") or getSidebarActiveKey stops highlighting this row.
L210:   { modulename: "Projects", path: "projects/workspaces", icon: "FolderOutlined" },
L211:   { modulename: "Profile", path: "profile", icon: "IdcardOutlined" },
L212: ];
```

### Course tab list (role-filtered: LEARNER sees tabs without roles or with LEARNER; FACULTY/ADMIN see roles FACULTY/ADMIN) (lists.js L271-L309)
```text
L271: export const courseTabList = [
L272:   {
L273:     key: "1",
L274:     label: "Overview",
L275:     path: "home",
L276:   },
L277:   {
L278:     key: "2",
L279:     label: "Blueprint",
L280:     path: "blueprint",
L281:     roles: ["FACULTY", "ADMIN"],
L282:   },
L283:   {
L284:     key: "2a",
L285:     label: "Learning Path",
L286:     path: "roadmap",
L287:     roles: ["LEARNER"],
L288:   },
L289:   {
L290:     key: "6",
L291:     label: "Attendance",
L292:     path: "attendanceDetail",
L293:   },
L294:   {
L295:     key: "8",
L296:     // Was "Chat" — the page itself (Classroom.js), its own heading, subtitle, and the URL
L297:     // segment all call this "Discussions". A tab labeled differently from the page it opens
L298:     // reads as a broken link, and CourseTabsLayout composes the browser tab title from this
L299:     // label too ("{course} · Chat"), disagreeing with what the page shows.
L300:     label: "Discussions",
L301:     path: "discussions",
L302:   },
L303:   {
L304:     key: "9",
L305:     label: "Students",
L306:     path: "students",
L307:     roles: ["FACULTY", "ADMIN"],
L308:   },
L309: ];
```

### Learner placements tab strip (dev) (lists.js L378-L388)
```text
L378: export const placementsTabList = [
L379:   // Student redesign (14 Oct 2026): 8 tabs became 7, each with one job. Assessments, Interviews and Career Calendar read an older
L380:   // source and disagreed with each other; Schedule is all three on the placement cell's own rounds. Offers left Placement cell.
L381:   { key: "1", label: "Home", path: "" },
L382:   { key: "2", label: "Drives", path: "jobs" },
L383:   { key: "3", label: "Applications", path: "applications" },
L384:   { key: "4", label: "Schedule", path: "schedule" },
L385:   { key: "5", label: "Offers", path: "offers" },
L386:   { key: "6", label: "Notices", path: "announcements" },
L387:   { key: "7", label: "Placement cell", path: "placement" },
L388: ];
```

### Contacts tabs (faculty) (lists.js L390-L406)
```text
L390: export const contactsTabList = [
L391:   {
L392:     key: "1",
L393:     label: "All Contacts",
L394:     path: "allContacts",
L395:   },
L396:   {
L397:     key: "2",
L398:     label: "Teachers",
L399:     path: "teachers",
L400:   },
L401:   {
L402:     key: "3",
L403:     label: "Students",
L404:     path: "students",
L405:   },
L406: ];
```

### Learner placements tab strip on prod-2026 (differs) `src/common/lists.js`
```text
L393: export const placementsTabList = [
L394:   { key: "1", label: "Dashboard", path: "" },
L395:   { key: "2", label: "Jobs", path: "jobs" },
L396:   { key: "3", label: "Applications", path: "applications" },
L397:   { key: "4", label: "Assessments", path: "assessments" },
L398:   { key: "5", label: "Interviews", path: "interviews" },
L399:   // Matches the page's own heading ("Career Calendar") — was "Calendar", disagreeing with
L400:   // what a learner saw immediately after clicking it.
L401:   { key: "6", label: "Career Calendar", path: "calendar" },
L402: ];
```

### College admin nested tab groups (verbatim) `src/common/navGroupDefinitions.js` and `src/common/adminNavGroups.js`
```text
L1: // Shared college-admin / superadmin navigation taxonomy. Paths remain role-relative.
L2: export const SHARED_GROUP_DEFINITIONS = {
L3:   academic: {
L4:     title: "Academic Setup",
L5:     items: [
L6:       { path: "departments", label: "Departments" },
L7:       { path: "programs", label: "Programs" },
L8:       { path: "semesters", label: "Semesters" },
L9:       { path: "semester-courses", label: "Semester–Course Mapping" },
L10:       { path: "batches", label: "Batches" },
L11:       { path: "classes", label: "Classes" },
L12:       { path: "batch-promotion", label: "Batch Promotion" },
L13:       { path: "lecture-halls", label: "Lecture Halls" },
L14:       { path: "electives", label: "Electives" },
L15:       { path: "attendance", label: "Attendance" },
L16:     ],
L17:   },
L18:   content: {
L19:     title: "Courses & Content",
L20:     items: [
L21:       { path: "courses", label: "Courses" },
L22:       { path: "lessons", label: "Lessons" },
L23:       { path: "lesson-content", label: "Video", query: { type: "video" } },
L24:       { path: "lesson-content", label: "Resources", query: { type: "resources" } },
L25:       { path: "lesson-content", label: "Live Classes", query: { type: "live-classes" } },
L26:       { path: "assignments", label: "Assignments" },
L27:       { path: "quizzes", label: "Quizzes" },
L28:       { path: "course-progress", label: "Progress" },
L29:     ],
L30:   },
L31:   people: {
L32:     title: "People",
L33:     items: [
L34:       { path: "teachers", label: "Faculty" },
L35:       { path: "faculty-assignment", label: "Faculty Assignment" },
L36:       { path: "students", label: "Students" },
L37:       { path: "people", label: "People Directory" },
L38:     ],
L39:   },
L40:   placements: {
L41:     title: "Placements",
L42:     items: [
L43:       { path: "jobs", label: "Drives" },
L44:       { path: "companies", label: "Companies" },
L45:       { path: "calendar", label: "Interviews" },
```
```text
L17: /**
L18:  * Projects is defined here rather than shared with superadmin, deliberately — see the matching
L19:  * note in superAdminNavGroups.js. College-admin's day is running this college's live projects, so
L20:  * Workspaces is the first tab and the whole landing point; Templates is a catalogue they consult
L21:  * before creating a workspace, not something they author, so it sits late in the strip and has no
L22:  * authoring routes behind it at all.
L23:  *
L24:  * Only things you *monitor* are tabs. Things you *do* — creating a workspace, bulk-reassigning a
L25:  * mentor, opening the deleted bin — are buttons on the list they belong to, each with its own
L26:  * page.
L27:  */
L28: export const ADMIN_PROJECTS_GROUP = {
L29:   title: "Projects",
L30:   items: [
L31:     { path: "projects/workspaces", label: "Workspaces" },
L32:     { path: "projects/at-risk", label: "At Risk" },
L33:     { path: "projects/readiness", label: "Readiness" },
L34:     { path: "projects/submissions", label: "Submissions" },
L35:     { path: "projects/templates", label: "Templates" },
L36:     { path: "projects/audit", label: "Audit" },
L37:   ],
L38: };
L39: 
L40: /**
L41:  * The tab strip shown *inside* one workspace, replacing the list-level strip so only one set of
L42:  * tabs is ever on screen. Each section owns one concern and both shows and edits it.
L43:  *
L44:  * Same nine sections superadmin sees: running a workspace is the same job whoever does it. They
L45:  * are listed separately from superadmin's copy so the two can diverge later without one panel
L46:  * silently changing the other.
L47:  *
L48:  * Archive and delete are buttons on Summary, not tabs.
L49:  */
L50: export const ADMIN_WORKSPACE_SECTIONS = [
L51:   { path: "summary", label: "Summary" },
L52:   // The project's narrative content (goal, deliverables, definition of done, personas).
L53:   // It lived on Summary only because no tab covered it, which left that page carrying
L54:   // metadata and content at once and made its required-deliverables validator block an
L55:   // unrelated title edit on any workspace that had none.
L56:   { path: "overview", label: "Overview" },
L57:   { path: "team", label: "Team" },
L58:   { path: "sprints", label: "Sprints" },
L59:   { path: "tasks", label: "Tasks" },
L60:   { path: "resources", label: "Resources" },
L61:   { path: "meetings", label: "Meetings" },
L62:   { path: "readiness", label: "Readiness" },
L63:   { path: "delivery", label: "Delivery" },
L64:   { path: "audit", label: "Audit" },
L65: ];
L66: 
L67: export const ADMIN_NAV_GROUPS = {
L68:   academic: { key: "academic", ...SHARED_GROUP_DEFINITIONS.academic },
L69:   content: { key: "content", ...SHARED_GROUP_DEFINITIONS.content },
L70:   // Student Groups is college-admin only for now (no superadmin page yet), so it is appended here
L71:   // rather than in the shared definition the superadmin tab strip also renders.
L72:   people: {
L73:     key: "people",
L74:     ...SHARED_GROUP_DEFINITIONS.people,
L75:     // Student Groups hidden until a feature uses generic groups (see pages/college-admin/student-groups.js).
L76:     items: [...SHARED_GROUP_DEFINITIONS.people.items],
L77:   },
L78:   // Placements and Projects both used to have their own college-admin sidebar entries backed by a
L79:   // dedicated antd-Tabs sub-nav rather than this AdminGroupShell/PageShell system — folded in
L80:   // here so every grouped page shares one tab-strip visual language. (Those sub-nav components
```

### Page/browser-title maps (verbatim) `src/common/constant.js` L11-L52 (used by `src/utils/pageTitle.js`: browser title = "<title> · 42LMS" on dev, "42 LMS - <title>" on prod; unknown keys fall back to the title-cased last URL segment)
```text
L11: export const routeTitles = {
L12:   courses: "Courses",
L13:   mentor: "Mentor",
L14:   contacts: "Contacts",
L15:   notifications: "Notifications",
L16:   calendar: "Calendar",
L17:   allQuizzes: "All Quizzes",
L18:   allAssignments: "All Assignment",
L19:   fileExplorer: "File Explorer",
L20:   attendance: "Attendance",
L21:   assessments: "Assessments",
L22:   "my-placements": "My Placements",
L23:   interviews: "Interviews",
L24:   "career-calendar": "Career Calendar",
L25:   "my-applications": "My Applications",
L26:   profile: "Profile",
L27:   jobs: "Jobs",
L28:   "saved-jobs": "Saved Jobs",
L29: };
L30: 
L31: export const adminRouteTitles = {
L32:   dashboard: "Dashboard",
L33:   audit: "Activity Log",
L34:   departments: "Departments",
L35:   courses: "Courses",
L36:   lessons: "Lessons",
L37:   "lesson-content": "Lesson Content",
L38:   quizzes: "Quizzes",
L39:   programs: "Programs",
L40:   semesters: "Semesters",
L41:   "semester-courses": "Semester-Course Mapping",
L42:   batches: "Batches",
L43:   classes: "Classes",
L44:   "batch-promotion": "Batch Promotion",
L45:   "lecture-halls": "Lecture Halls",
L46:   electives: "Electives",
L47:   teachers: "Faculty",
L48:   "faculty-assignment": "Faculty Assignment",
L49:   students: "Students",
L50:   people: "People Directory",
L51:   "student-groups": "Student Groups",
L52:   jobs: "Jobs",
```
Prod-2026 difference in constant.js: the dev file adds `electives: "Electives"` and `"student-groups": "Student Groups"` to adminRouteTitles.

### Role labels (verbatim) `src/config/roles.js`
```text
L20:   LEARNER: "LEARNER",
L21:   RECRUITER: "RECRUITER",
L22: });
L23: 
L24: export const ROLE_CONFIG = Object.freeze({
L25:   [ROLE.SUPER_ADMIN]: { portal: "/superadmin", home: "/superadmin/dashboard", label: "Super Admin", strictPortal: false },
L26:   [ROLE.ADMIN]: { portal: "/college-admin", home: "/college-admin/dashboard", label: "College Admin", strictPortal: false },
L27:   [ROLE.TPO]: { portal: "/tpo", home: "/tpo/home", label: "TPO", strictPortal: true },
L28:   [ROLE.MENTOR]: { portal: "/mentor", home: "/mentor/projects", label: "Mentor", strictPortal: false },
L29:   [ROLE.FACULTY]: { portal: "/teacher", home: "/teacher/courses", label: "Faculty", strictPortal: false },
L30:   [ROLE.LEARNER]: { portal: "/learn", home: "/learn/courses", label: "Learner", strictPortal: false },
```

PROD-2026 differences in navigation: no "Profile verification" and no "Placement cell" sidebar rows; no "Electives" tab in Academic Setup (`navGroupDefinitions.js`); learner placements tab strip as shown above. Faculty gets an injected sidebar row "Placement cell" (href /tpo/home, group account) from `src/components/Sidebar/Sidebar.js` when `getMyAccess()` returns a role (L300-L310).

## 2. Shell: sidebar rendering, top navbar, profile menu, notifications drawer, role/college switcher, mobile footer/menu, browser titles

Shared by all four accounts (TPO/recruiter/tracker-only components excluded).

#### `src/components/Course/Common/CourseSectionHeader.jsx` (branch: both (differs); 0 strings)
(no user-facing strings)

#### `src/components/Dropdowns/Notification/NotifivationDropdown.js` (branch: both (differs); 20 strings)
```text
[DEV] L25 const:DIALOG_FOCUSABLE: a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])
L44 str: Notifications will appear here when available.
L51 text(div): Notifications
[DEV] L57 attr:label(ListSkeleton): Loading notifications
[DEV] L60 attr:title(PanelError): Couldn't load notifications
[DEV] L61 attr:description(PanelError): Your notification feed could not be loaded.
L63 attr:retryAriaLabel(PanelError): Retry loading notifications
[DEV] L68 attr:label(RefreshStatus): Refreshing notifications…
[DEV] L72 attr:title(PanelPartial): Notifications may be out of date
[DEV] L73 attr:description(PanelPartial): The last loaded notifications are still shown. Retry to get the latest updates.
[DEV] L118 attr:title(PanelEmpty): No notifications yet
L129 text(div): View all notifications
L412 attr:primaryButtonTitle(ModalContainer): Take Assessment
L414 attr:primaryButtonTitle(ModalContainer): View Interview
L416 attr:primaryButtonTitle(ModalContainer): View in My Applications
L454 attr:secondaryButtonTitle(ModalContainer): View in My Applications
L458 attr:secondaryButtonTitle(ModalContainer): View in My Applications
L510 attr:aria-label(button): Open notifications, ${badgeCount} total
L510 attr:aria-label(button): Open notifications
L535 attr:title(Drawer): Notifications
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L50 text(div): Loading notifications…
[PROD-ONLY] L54 text(div): Failed to load notifications.
[PROD-ONLY] L55 text(div): Try again
[PROD-ONLY] L100 text(div): No notifications
[PROD-ONLY] L436 attr:aria-label(div): Notifications panel
```

#### `src/components/Dropdowns/Profile/profiledropdown.js` (branch: both (differs); 13 strings)
```text
L70 prop:message: recently left a comment on
L74 str: Jones Ferdinand
L75 prop:message: Hello Stephen!
L80 prop:message: recently left a comment on
L84 str: Jones Ferdinand
L85 prop:message: Hello Stephen!
L123 text(Dropdown): Complete profile
L129 text(Dropdown): Manage Account
L149 text(Dropdown): My Account
L187 text(Dropdown): Logout
[DEV] L196 attr:aria-label(button): Open account menu
L215 attr:name(ResilientAvatar): Profile
L216 attr:alt(ResilientAvatar): Profile
```

#### `src/components/Global/Header/Header.js` (branch: both (differs); 40 strings)
```text
L280 child(span): Account
L287 text(span): Last used
L288 text(span): Unverified
L289 text(span): No domain
L354 prop:title: This college domain is not verified
L356 prop:content: Switching may fail if the domain is not ready. Continue anyway?
L357 prop:okText: Continue
L358 prop:cancelText: Cancel
L372 prop:message: Switching workspace…
L373 prop:description: Please wait. Don’t close this tab.
L398 prop:message: Switch failed
L399 prop:description: Target organization domain is not configured.
L409 prop:message: Switch failed
L410 prop:description: Cross-domain handoff is unavailable. Please contact support.
L478 prop:message: Switch failed
L479 prop:description: Handoff token missing; cannot switch domains safely.
L489 prop:message: Switch failed
L490 prop:description: Target organization domain is not configured.
L499 prop:message: Switch failed
L499 prop:description: Target organization domain is not configured.
L501 prop:message: Switch failed
L501 prop:description: Cross-domain handoff is unavailable. Please contact support.
L504 prop:message: Switch failed
L505 prop:description: You don't have access to that organization.
L602 prop:label: Recent
L622 prop:label: Popular
L684 prop:label: Search Results
[DEV] L734 str: ${getFacultyCoursesPath(router.pathname, loginUser?.facultyType)}/${courseIdentifier}/home
[DEV] L751 attr:aria-label(LinearProgress): Loading page
L764 attr:aria-label(button): Open navigation menu
[DEV] L791 text(AutoComplete): Searching courses
L794 attr:notFoundContent(AutoComplete): No courses found. Try a different search.
L798 str: min(400px, calc(100vh - 80px))
[DEV] L800 attr:aria-label(Input): Search courses
L800 attr:placeholder(Input): Search Courses (e.g., Java, Data Structures, CS...)
L814 attr:aria-label(Select): Switch workspace
L816 str: min(420px, 92vw)
L824 attr:placeholder(Select): Switch
L849 str: min(460px, 92vw)
L857 attr:placeholder(Select): Switch workspace
```

#### `src/components/Global/ImpersonationBanner/ImpersonationBanner.jsx` (branch: both (identical); 4 strings)
```text
L40 call:message.error: Failed to exit impersonation:
L68 text(div): Acting as
L68 text(div): — this is an impersonated support session.
L69 text(div): Exit impersonation
```

#### `src/components/Global/MobileMenuDrawer/MobileMenuDrawer.js` (branch: both (differs); 5 strings)
```text
L12 const:FOCUSABLE_SELECTORS: a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])
L79 attr:aria-label(Link): 42 LMS Home
L81 attr:alt(img): 42 LMS
L97 attr:aria-label(DrawerWidget): Navigation menu
L100 attr:aria-label(nav): Main navigation
```

#### `src/components/Header/LoginHeader.js` (branch: both (identical); 1 strings)
```text
L9 attr:alt(img): 42LMS logo
```

#### `src/components/LearnPageHeader/LearnPageHeader.jsx` (branch: both (identical); 1 strings)
```text
L8 str: Back to Jobs
```

#### `src/components/MobileFooter/MobileFooter.jsx` (branch: both (differs); 39 strings)
```text
L31 attr:aria-label(nav): Mobile navigation
L37 attr:aria-label(Link): Dashboard
L39 text(footer): Dashboard
[DEV] L43 attr:aria-label(Link): Academic setup
[DEV] L45 text(footer): Academic
L49 attr:aria-label(Link): Courses
L51 text(footer): Courses
L55 attr:aria-label(Link): Placements
L57 text(footer): Placements
L61 attr:aria-label(Link): Profile
L63 text(footer): Profile
L73 attr:aria-label(Link): Courses
L78 text(footer): Courses
L82 attr:aria-label(Link): Notifications
L86 text(footer): Alerts
L90 attr:aria-label(Link): Class Schedule
L92 text(footer): Schedule
L96 attr:aria-label(Link): My Placements
L98 text(footer): Placements
L102 attr:aria-label(Link): Projects
L104 text(footer): Projects
L108 attr:aria-label(Link): Profile
L110 text(footer): Profile
L121 attr:aria-label(Link): Courses
L126 text(footer): Courses
L130 attr:aria-label(Link): Quizzes
L132 text(footer): Quizzes
L136 attr:aria-label(Link): Assignments
L141 text(footer): Assignments
L145 attr:aria-label(Link): Profile
L147 text(footer): Profile
L196 attr:aria-label(Link): Projects
L198 text(footer): Projects
[DEV] L203 attr:aria-label(Link): Meetings
[DEV] L205 text(footer): Meetings
L209 attr:aria-label(Link): Notifications
L211 text(footer): Alerts
L215 attr:aria-label(Link): Profile
L217 text(footer): Profile
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L40 attr:aria-label(Link): Departments
[PROD-ONLY] L42 text(footer): Departments
[PROD-ONLY] L52 attr:aria-label(Link): Jobs
[PROD-ONLY] L54 text(footer): Jobs
[PROD-ONLY] L152 attr:aria-label(Link): Home
[PROD-ONLY] L154 text(footer): Home
```

#### `src/components/Sidebar/AdminSidebar.js` (branch: both (differs); 5 strings)
```text
L78 attr:aria-label(Link): 42 LMS Home
L79 attr:alt(img): 42 LMS
L97 attr:aria-label(Link): ${item.modulename}${isActive ? " (current page)" : ""}
L97 attr:aria-label(Link): (current page)
L114 child(div): .admin-sidebar-panel .ln-hov__visible::-webkit-scrollbar { display: block; width: 8px; } .admin-sidebar-panel .ln-hov__visible::-webkit-scrollbar-thumb { background: rgba(90, 100, 115, 0.35); border-radius: 8px; }
```

#### `src/components/Sidebar/Sidebar.js` (branch: both (differs); 7 strings)
```text
[DEV] L307 prop:modulename: Placement cell
L370 attr:aria-label(nav): Main navigation
L384 attr:alt(img): 42LMS logo
[DEV] L426 attr:aria-label(Link): ${modulelist?.modulename || "Menu"}${isActive ? " (current page)" : ""}
L426 attr:aria-label(Link): Menu
[DEV] L426 attr:aria-label(Link): (current page)
[DEV] L448 attr:aria-label(span): ${SIDEBAR_BADGE_COUNT[modulelist.path]} pending
```

#### `src/components/Sidebar/index.js` (branch: both (identical); 0 strings)
(no user-facing strings)

#### `src/config/roles.js` (branch: both (differs); 6 strings)
```text
L25 prop:label: Super Admin
L26 prop:label: College Admin
L28 prop:label: Mentor
L29 prop:label: Faculty
L30 prop:label: Learner
[DEV] L31 prop:label: Recruiter
```

#### `src/hooks/useNotificationFeed.js` (branch: both (differs); 0 strings)
(no user-facing strings)

#### `src/layouts/AdminLayout.js` (branch: both (differs); 13 strings)
```text
[DEV] L45 return: ${title} · 42LMS
[DEV] L45 return: Admin · 42LMS
L86 str: Admin session restore failed:
L193 attr:name(meta): description
L193 attr:content(meta): 42 LMS Admin Dashboard
L194 attr:name(meta): viewport
L194 attr:content(meta): width=device-width, initial-scale=1, viewport-fit=cover
L210 attr:name(meta): description
L210 attr:content(meta): 42 LMS Admin Dashboard
L211 attr:name(meta): viewport
L211 attr:content(meta): width=device-width, initial-scale=1, viewport-fit=cover
L214 child(style): /* The shared .dashboard-container class hides its vertical scrollbar entirely (scrollbar-width: none). On short admin pages that's invisible, but on a long form (e.g. Create project template) the visible area can end right at the viewport edge with no cue that more content follows below — it just looks cut off / broken. Restore a normal, visible scrollbar for admin content only. */ .dashboard-container.admin-layout-main { scrollbar-width: thin; -ms-overflow-style: auto; } .dashboard-container.admin-layout-main::-webkit-scrollbar { display: block; width: 10px; } .dashboard-container.admin-layout-main::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.2); border-radius: 6px; } .dashboard-container.admin-layout-main::-webkit-scrollbar-track { background: transparent; } /* Hide horizontal scrollbars in college admin (scroll still works) */ .admin-layout-main .ant-table-wrapper .ant-table-body, .admin-layout-main .ant-table-wrapper .ant-table-content { scrollbar-width: none; -ms-overflow-style: none; } .admin-layout-main .ant-table-wrapper .ant-table-body::-webkit-scrollbar, .admin-layout-main .ant-table-wrapper .ant-table-content::-webkit-scrollbar { height: 0; display: none; } /* Admin: align buttons and cards */ .admin-layout-main .ant-btn { display: inline-flex !important; align-items: center !important; justify-content: center !important; text-align: center !important; } .admin-layout-main .ant-btn > span { display: inline-flex !important; align-items: center !important; justify-content: center !important; } .admin-layout-main .ant-btn .anticon + span { margin-inline-start: 6px; } .admin-layout-main .ant-card { border-radius: 8px; } .admin-layout-main .ant-card-head { min-height: 48px; align-items: center; } .admin-layout-main .ant-card-head-title { padding: 12px 0; font-weight: 600; } .admin-layout-main .ant-card-extra { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; } .admin-layout-main .ant-card-body { padding: 20px 24px; } .admin-layout-main .ant-space { display: inline-flex; align-items: center; } .admin-layout-main .ant-alert { border-radius: 8px; } .admin-layout-main .ant-alert-content { display: flex; flex-direction: column; justify-content: center; } .admin-layout-main .ant-modal-footer .ant-btn { min-width: 80px; } .admin-layout-main .ant-tag { display: inline-flex !important; align-items: center !important; justify-content: center !important; margin: 0; padding: 2px 8px; line-height: 1.5; } .admin-layout-main .ant-tag .anticon { margin-inline-end: 4px; vertical-align: middle; line-height: 1; } /* Hide vertical scrollbar in interview calendar (scroll still works) */ .admin-layout-main .scroll-container--interview-calendar, .admin-layout-main .scroll-container--interview-calendar .rbc-time-content, .admin-layout-main .calendar-wrapper .rbc-time-content { scrollbar-width: none !important; -ms-overflow-style: none !important; } .admin-layout-main .scroll-container--interview-calendar::-webkit-scrollbar, .admin-layout-main .scroll-container--interview-calendar .rbc-time-content::-webkit-scrollbar, .admin-layout-main .calendar-wrapper .rbc-time-content::-webkit-scrollbar { width: 0 !important; display: none !important; } /* Reserve scrollbar width so top days row and scrollable time grid stay aligned */ .admin-layout-main .scroll-container--interview-calendar .rbc-time-content, .admin-layout-main .calendar-wrapper .rbc-time-content { padding-right: 16px !important; box-sizing: border-box !important; } .admin-layout-main .scroll-container--interview-calendar .rbc-time-header-content, .admin-layout-main .calendar-wrapper .rbc-time-header-content { padding-right: 16px !important; box-sizing: border-box !important; }
[DEV] L336 text(a): Skip to main content
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L42 return: 42 LMS - ${title}
[PROD-ONLY] L42 return: 42 LMS - Admin
```

#### `src/layouts/CourseTabsLayout.js` (branch: both (identical); 8 strings)
```text
L46 return: ${basePath}/${tab.path}${sanitizedQuery ? `?${sanitizedQuery}` : ""}
L46 return: ?${sanitizedQuery}
L57 child(div): ${courseName} · ${activeTabLabel}
L60 attr:title(PageShell): Course
L61 attr:subtitle(PageShell): Course workspace
L62 attr:ariaLabel(PageShell): Course workspace
L63 text(PageShell): Back to courses
L65 attr:tabsAriaLabel(PageShell): Course sections
```

#### `src/layouts/PlacementsTabsLayout.js` (branch: both (differs); 5 strings)
```text
[DEV] L84 prop:label: ${tab.label} (${announcementsNew})
L97 attr:title(PageShell): My Placements
[DEV] L98 attr:subtitle(PageShell): Drives, your applications, tests and interviews, and offers in one place.
L99 attr:ariaLabel(PageShell): Placements workspace
L101 attr:tabsAriaLabel(PageShell): Placements sections
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L85 attr:subtitle(PageShell): Jobs, applications, assessments, and interviews in one place.
```

#### `src/layouts/layout.js` (branch: both (differs); 3 strings)
```text
L143 str: Session restore failed:
L314 attr:name(meta): description
[DEV] L317 text(a): Skip to main content
```

#### `src/layouts/placementsTheme.js` (branch: both (identical); 6 strings)
```text
L24 const:ELEV_3: 0 4px 8px rgba(16, 24, 40, 0.04), 0 12px 24px rgba(16, 24, 40, 0.08)
L27 const:ELEV_2: 0 2px 4px rgba(16, 24, 40, 0.04), 0 4px 12px rgba(16, 24, 40, 0.06)
L30 const:FONT_FAMILY: "Lato-Regular", Lato, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
L93 str: rgba(14, 124, 135, 0.08)
L100 str: 0 0 0 3px rgba(14, 124, 135, 0.10)
L101 str: rgba(14, 124, 135, 0.45)
```

#### `src/layouts/tpoRecruiterTheme.js` (branch: lms-dev-2026 only; 0 strings)
(no user-facing strings)

#### `src/utils/notificationDateUtils.js` (branch: both (identical); 2 strings)
```text
L20 return: ${day} ${monthLabel}, ${year}
L26 return: ${d.getDate()} ${monthNames[d.getMonth() + 1] ?? "—"}, ${d.getFullYear()}
```

#### `src/utils/notificationTypeUtils.js` (branch: both (identical); 12 strings)
```text
L13 prop:label: Job
L14 prop:label: Course
L15 prop:label: Project
L16 prop:label: Announcement
L17 prop:label: System
L18 prop:label: College
L19 prop:label: Department
L20 prop:label: Faculty
L21 prop:label: Program
L22 prop:label: Class
L23 prop:label: Student
L32 prop:label: General
```

#### `src/utils/pageTitle.js` (branch: both (differs); 2 strings)
```text
[DEV] L33 return: ${pageTitle} · 42LMS
[DEV] L33 return: 42LMS
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L27 return: 42 LMS - ${pageTitle}
[PROD-ONLY] L27 return: 42 LMS
```

#### `src/utils/profileUtils.js` (branch: both (identical); 47 strings)
```text
L11 prop:label: Personal Details
L12 prop:label: Contact Information
L13 prop:label: Address
L14 prop:label: Identity Documents
L15 prop:label: Education
L16 prop:label: Skills
L17 prop:label: Experience
L18 prop:label: Projects
L19 prop:label: Certifications
L20 prop:label: Achievements
L21 prop:label: Languages
L22 prop:label: Extracurricular
L23 prop:label: Hobbies
L24 prop:label: Social Profiles
L28 prop:label: Personal Details
L29 prop:label: Contact Information
L30 prop:label: Address
L31 prop:label: Identity Documents
L32 prop:label: Education
L33 prop:label: Skills
L34 prop:label: Experience
L35 prop:label: Publications
L36 prop:label: Awards
L37 prop:label: Certifications
L38 prop:label: Languages
L39 prop:label: Social Profiles
L100 return: Welcome! Let's build your profile together.
L101 return: Excellent! Your profile is complete!
L102 return: Great job! Almost there!
L103 return: Good progress! Keep going!
L104 return: You are on your way! Add more details.
L105 return: Good start! Complete your profile to stand out.
L106 return: Welcome! Let's build your profile together.
L111 prop:title: Complete your profile
L111 prop:sub: Add your details now to complete your profile
L112 prop:title: Profile complete!
L112 prop:sub: Your profile looks great
L113 prop:title: Almost there!
L113 prop:sub: Add a few more details to complete your profile
L114 prop:title: Good progress!
L114 prop:sub: Add remaining details to complete your profile
L115 prop:title: Halfway there!
L115 prop:sub: Add more details to complete your profile
L116 prop:title: Complete your profile
L116 prop:sub: Add your details to complete your profile
L117 prop:title: Complete your profile
L117 prop:sub: Add your details now to complete your profile
```

## 3. Pages

### LEARNER

#### Page `/learn/allAssignments`  (file src/pages/learn/allAssignments.js)

##### `src/pages/learn/allAssignments.js` (branch: both (identical); 0 strings)
(no user-facing strings)

Page closure (21 files; strings in section 4 or above): `src/components/Assignments/AssignmentsContent.jsx`, `src/components/Common/Skeletons.jsx`, `src/components/Global/ListingPageHeader/ListingPageHeader.jsx`, `src/components/Common/PageShell.jsx`, `src/components/Global/MetricPill/MetricPill.jsx`, `src/utils/dateUtils.js`, `src/utils/learnerApiUtils.js`, `src/components/Global/Offcanvas/Assignment/newAssignment.js`, `src/components/Assignments/ViewAssignmentModal.jsx`, `src/components/Assignments/ActionAssignment.js`, `src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx`, `src/common/lists.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/components/Global/Editor/editor.js`, `src/components/Global/RightDrawer/DrawerWidget.js`, `src/utils/uploadToR2.js`, `src/components/Global/Upload/UploadFromLinkButton.jsx`, `src/utils/assignmentSchema.js`, `src/components/Assignments/SubmitAssignmentModal.jsx`, `src/components/Global/Button/button.jsx`, `src/utils/clientErrorReporting.js`

#### Page `/learn/allQuizzes`  (file src/pages/learn/allQuizzes.js)

##### `src/pages/learn/allQuizzes.js` (branch: both (identical); 0 strings)
(no user-facing strings)

Page closure (15 files; strings in section 4 or above): `src/components/Quizzes/QuizzesContent.jsx`, `src/components/Global/ListingPageHeader/ListingPageHeader.jsx`, `src/components/Common/PageShell.jsx`, `src/components/Global/MetricPill/MetricPill.jsx`, `src/components/Quiz/QuizBuilderModal.jsx`, `src/components/Common/Skeletons.jsx`, `src/components/Quiz/Table/table.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/dateUtils.js`, `src/utils/formErrors.js`, `src/components/admin/projects/adminProjectUtils.js`, `src/components/Quiz/Table/quizeTitle.js`, `src/components/Quiz/Table/action.js`, `src/components/Quiz/Table/submission.js`, `src/hooks/useLearnerClassScope.js`

#### Page `/learn/attendance`  (file src/pages/learn/attendance.js)

##### `src/pages/learn/attendance.js` (branch: both (identical); 0 strings)
(no user-facing strings)

Page closure (10 files; strings in section 4 or above): `src/components/Attendance/AttendanceContent.jsx`, `src/components/Global/ListingPageHeader/ListingPageHeader.jsx`, `src/components/Common/PageShell.jsx`, `src/components/Common/Skeletons.jsx`, `src/components/Global/MetricPill/MetricPill.jsx`, `src/utils/attendanceConstants.js`, `src/components/Attendance/StudentAttendance/StatusCol.js`, `src/utils/facultyRouteUtils.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/components/Common/PanelStates.jsx`

#### Page `/learn/calendar`  (file src/pages/learn/calendar.js)

##### `src/pages/learn/calendar.js` (branch: both (identical); 0 strings)
(no user-facing strings)

Page closure (18 files; strings in section 4 or above): `src/components/CalendarComp/ClassScheduleContent.jsx`, `src/components/Global/ListingPageHeader/ListingPageHeader.jsx`, `src/components/Common/PageShell.jsx`, `src/components/Global/MetricPill/MetricPill.jsx`, `src/contexts/calendar-context.js`, `src/hooks/useCourses.js`, `src/utils/helper.js`, `src/components/CalendarComp/CalendarEvents/CalendarEvents.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/learnerApiUtils.js`, `src/components/CalendarComp/StandardCalendar/index.js`, `src/components/CalendarComp/CalendarMobileList/CalendarMobileList.js`, `src/components/ErrorBoundary/CalendarErrorBoundary.js`, `src/hooks/useLearnerClassScope.js`, `src/components/CalendarComp/StandardCalendar/StandardCalendar.js`, `src/components/CalendarComp/CalendarMobileList/MiniCalendar.js`, `src/utils/clientErrorReporting.js`, `src/components/CalendarComp/MyWeekHeader/MyWeekHeader.js`

#### Page `/learn/courses/[courseId]/[...courseTab]`  (file src/pages/learn/courses/[courseId]/[...courseTab].js)

##### `src/pages/learn/courses/[courseId]/[...courseTab].js` (branch: both (differs); 8 strings)
```text
[DEV] L68 str: This course is not currently available to learners.
L76 new Error: Unable to redirect to the course
L86 prop:name: Unnamed Course
[DEV] L124 attr:message(Alert): Course unavailable
L124 attr:message(Alert): Could not load course
L125 attr:description(Alert): This course may not exist or you may not have access. Please try again or return to your courses.
L129 text(div): Try again
L130 text(div): Back to Courses
```

Page closure (86 files; strings in section 4 or above): `src/components/Course/Common/CourseTabSkeleton.jsx`, `src/pages/Dashboard/course/syllabus/syllabus.js`, `src/pages/Dashboard/course/Attendance/attendance.js`, `src/pages/Dashboard/course/Home/Home.js`, `src/pages/Dashboard/course/Classroom/classroom.js`, `src/utils/learnerCourseDetail.js`, `src/utils/courseUtils/contentAvailability.js`, `src/hooks/useLearnerClassScope.js`, `src/utils/dateUtils.js`, `src/utils/courseUtils/contentOrder.js`, `src/utils/courseUtils/contentCompletion.js`, `src/components/Global/Offcanvas/Syallabus/AddNewLessonContentDrawer.js`, `src/components/Global/Offcanvas/Assignment/newAssignment.js`, `src/components/Quiz/QuizBuilderModal.jsx`, `src/pages/Dashboard/course/syllabus/video.js`, `src/pages/Dashboard/course/syllabus/youtube.js`, `src/pages/Dashboard/course/syllabus/resource.js`, `src/pages/Dashboard/course/syllabus/liveclass.js`, `src/pages/Dashboard/course/syllabus/syllabusDetail.js`, `src/components/Assignments/ViewAssignmentModal.jsx`, `src/pages/Dashboard/course/Attendance/AttendanceReport.js`, `src/components/Course/Home/index.js`, `src/hooks/useCourseHomeWidgets.js`, `src/hooks/useLearnerHomeStats.js`, `src/hooks/useFacultyCourseStats.js`, `src/utils/facultyRouteUtils.js`, `src/utils/courseClassAssignment.js`, `src/utils/clientSettings.js`, `src/utils/placementDateTime.js`, `src/components/Global/Offcanvas/Syallabus/videoform.js`, `src/components/Global/Offcanvas/Syallabus/youtube.js`, `src/components/Global/Offcanvas/Syallabus/liveclass.js`, `src/components/Global/Offcanvas/Syallabus/ResourceComposer.js`, `src/components/Global/RightDrawer/DrawerWidget.js`, `src/components/Global/Editor/editor.js`, `src/utils/uploadToR2.js`, `src/components/Global/Upload/UploadFromLinkButton.jsx`, `src/utils/assignmentSchema.js`, `src/utils/formErrors.js`, `src/components/Global/video/video.jsx`, `src/utils/courseUtils/syllabusUtils.js`, `src/components/Course/Syllabus/VideoDrawer.jsx`, `src/components/Course/Syllabus/ContentTitle.jsx`, `src/components/Course/Syllabus/ContentProgressBadge.jsx`, `src/config/appConfig.js`, `src/utils/authUtils.js`, `src/components/Course/Syllabus/YoutubeDrawer.jsx`, `src/components/Course/Syllabus/MarkCompleteButton.jsx`, `src/components/Global/SortableLessonContentList/SortableLessonContentList.jsx`, `src/components/Course/Syllabus/LessonProgressBar.jsx`, `src/components/Course/Syllabus/ContentCompletionCheck.jsx`, `src/utils/courseUtils/quizContent.js`, `src/components/Course/Syllabus/LessonActivityCards.jsx`, `src/components/Assignments/SubmitAssignmentModal.jsx`, `src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx`, `src/utils/facultyCourseDetail.js`, `src/components/Attendance/TakeAttendanceHeaderFilters/TakeAttendanceHeaderFilters.js`, `src/components/Attendance/CourseAttendeeHeaderFilters/CourseAttendeeHeaderFilters.js`, `src/pages/Dashboard/course/Attendance/StudentAttendanceView.jsx`, `src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx`, `src/components/Course/Home/InThisCourseSection.jsx`, `src/components/Course/Home/UnifiedActivityList.jsx`, `src/components/Course/Home/AtRiskStudentsCard.jsx`, `src/components/Course/Home/PerformanceCard.jsx`, `src/components/Global/Offcanvas/Syallabus/preview.js`, `src/utils/helper.js`, `src/components/Global/Button/uploadButton.jsx`, `src/utils/youtubeLink.js`, `src/utils/resourceUploadToR2.js`, `src/components/Global/Button/button.jsx`, `src/utils/clientErrorReporting.js`, `src/components/Common/PanelStates.jsx`, `src/utils/tenantUtils.js`, `src/utils/navigationContext.js`, `src/components/Attendance/StudentAttendance/StatusCol.js`, `src/utils/attendanceConstants.js`, `src/pages/Dashboard/course/Attendance/TakeAttendance.js`, `src/components/Global/Tooltips/CustomToolTipTable.jsx`, `src/utils/monthlyAttendanceReport.js`, `src/utils/downloadMonthlyAttendancePdf.js`, `src/utils/notificationDateUtils.js`, `src/components/Report/ScoreDistributionBars.jsx`, `src/pages/Dashboard/course/Attendance/NameWithDp.js`, `src/pages/Dashboard/course/Attendance/AbsentPresntBtnCol.js`, `src/components/Global/Offcanvas/Attendance/SheduleClassDrawer.js`, `src/common/lists.js`

#### Page `/learn/courses/[courseId]/index`  (file src/pages/learn/courses/[courseId]/index.js)

##### `src/pages/learn/courses/[courseId]/index.js` (branch: both (identical); 1 strings)
```text
L28 attr:tab(CourseTabSkeleton): home
```

Page closure (1 files; strings in section 4 or above): `src/components/Course/Common/CourseTabSkeleton.jsx`

#### Page `/learn/courses/index`  (file src/pages/learn/courses/index.js)

##### `src/pages/learn/courses/index.js` (branch: both (identical); 0 strings)
(no user-facing strings)

Page closure (8 files; strings in section 4 or above): `src/components/Course/CoursesContent.jsx`, `src/components/Global/ListingPageHeader/ListingPageHeader.jsx`, `src/components/Common/PageShell.jsx`, `src/components/Common/Skeletons.jsx`, `src/components/Global/MetricPill/MetricPill.jsx`, `src/utils/courseListingUtils.js`, `src/utils/courseUtils/contentAvailability.js`, `src/components/Course/Common/CourseSectionHeader.jsx`

#### Page `/learn/index`  (file src/pages/learn/index.js)

##### `src/pages/learn/index.js` (branch: both (identical); 0 strings)
(no user-facing strings)

Page closure (0 files; strings in section 4 or above): 

#### Page `/learn/my-placements/announcements`  (file src/pages/learn/my-placements/announcements.js)

##### `src/pages/learn/my-placements/announcements.js` (branch: lms-dev-2026 only; 9 strings)
```text
L47 attr:aria-label(div): Show
L48 text(div): Announcements
L49 text(div): Updates about you
L49 child(div): (${updates.length})
L51 attr:message(Alert): Couldn't load everything
L51 text(Alert): Retry
L55 attr:emptyText(AnnouncementList): No announcements from your placement cell yet.
L58 attr:aria-label(section): Updates about you
L60 text(div): No updates yet. When a round is booked, an offer comes in or your application moves, it shows here.
```

Page closure (2 files; strings in section 4 or above): `src/components/Placements/student/words.js`, `src/utils/placementDateTime.js`

#### Page `/learn/my-placements/applications`  (file src/pages/learn/my-placements/applications.js)

##### `src/pages/learn/my-placements/applications.js` (branch: both (differs); 48 strings)
```text
[DEV] L18 str: In progress
[DEV] L21 prop:name: Name
[DEV] L21 str: Roll number
[DEV] L22 str: Skill match
[DEV] L85 str: Application withdrawn
[DEV] L85 str: Could not withdraw
[DEV] L87 str: Sent. The placement cell will reply.
[DEV] L87 str: Could not send the request
[DEV] L99 attr:message(Alert): We could not load your applications
[DEV] L99 text(Alert): Retry
[DEV] L105 attr:aria-label(div): Show
[DEV] L110 attr:placeholder(Input.Search): Search company or role
[DEV] L114 text(div): You haven't applied to a drive yet.
[DEV] L114 text(div): Browse drives open to you
[DEV] L116 attr:description(Empty): No application matches your search
[DEV] L116 attr:description(Empty): No application is in progress right now
[DEV] L116 attr:description(Empty): Nothing here yet
[DEV] L133 child(div): Applied by the placement cell
[DEV] L133 child(div): Applied
[DEV] L145 attr:message(Alert): The placement cell applied for you
[DEV] L146 attr:description(Alert): If you don't want this one, withdraw before ${at(a.optOutUntil).format("ddd D MMM, h:mm A")}.
[DEV] L149 attr:message(Alert): This drive was cancelled
[DEV] L150 attr:description(Alert): The placement cell said: ${a.cancelReason}
[DEV] L150 attr:description(Alert): The placement cell cancelled this drive. Your other applications are not affected.
[DEV] L152 str: Offer declined by candidate
[DEV] L153 attr:message(Alert): From the company
[DEV] L157 text(div): Selection process
[DEV] L161 text(div): View drive
[DEV] L163 text(div): See in schedule
[DEV] L165 text(div): What the company sees
[DEV] L168 child(div): Withdraw
[DEV] L168 child(div): Ask to withdraw
[DEV] L178 attr:title(Modal): ${withdrawing.withdraw === "SELF" ? "Withdraw from" : "Ask to withdraw from"} ${withdrawing.company}?
[DEV] L178 attr:title(Modal): Withdraw from
[DEV] L178 attr:title(Modal): Ask to withdraw from
[DEV] L179 attr:okText(Modal): Withdraw
[DEV] L179 attr:okText(Modal): Send to the placement cell
[DEV] L182 text(div): You leave
[DEV] L182 text(div): for good. The company and the placement cell are told. This cannot be undone.
[DEV] L185 text(div): You are booked into a round of this drive, so the placement cell decides. Tell them why.
[DEV] L186 text(div): Why do you want to withdraw?
[DEV] L192 attr:title(Modal): What ${preview.app.company} sees about you
[DEV] L192 text(Modal): Close
[DEV] L195 attr:message(Alert): Couldn't load this
[DEV] L195 text(Alert): Retry
[DEV] L197 text(div): Nothing about you is shared with this company yet.
[DEV] L203 text(div): View
[DEV] L208 text(div): Your college decides what companies see. Your readiness scores, absences and any debarment are never shared.
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L54 call:message.error: Could not open the offers list. Please try again.
```

Page closure (6 files; strings in section 4 or above): `src/components/Placements/student/useJourney.js`, `src/components/Placements/student/RoundTrack.jsx`, `src/components/Placements/student/OfferCard.jsx`, `src/components/Placements/PlacementsCompanyAvatar.jsx`, `src/components/Placements/student/words.js`, `src/utils/placementDateTime.js`

#### Page `/learn/my-placements/assessments`  (file src/pages/learn/my-placements/assessments.js)

##### `src/pages/learn/my-placements/assessments.js` (branch: both (differs); 0 strings)
```text
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L13 attr:message(Alert): Submission markers are saved on this device only
[PROD-ONLY] L14 attr:description(Alert): Mark as submitted is a personal reminder, not a submission to the employer or proof of receipt. Complete your work on the assessment provider's platform; the recruiter controls official attempt and result status.
[PROD-ONLY] L20 child(div): .learn-my-assessments-route .learn-assessments-row-card__badge--awaiting-result { display: none; }
```

Page closure (1 files; strings in section 4 or above): `src/components/Placements/student/MovedPage.jsx`

#### Page `/learn/my-placements/calendar`  (file src/pages/learn/my-placements/calendar.js)

##### `src/pages/learn/my-placements/calendar.js` (branch: both (differs); 0 strings)
(no user-facing strings)

Page closure (1 files; strings in section 4 or above): `src/components/Placements/student/MovedPage.jsx`

#### Page `/learn/my-placements/index`  (file src/pages/learn/my-placements/index.js)

##### `src/pages/learn/my-placements/index.js` (branch: both (differs); 68 strings)
```text
L21 return: Good morning
L21 return: Good afternoon
L21 return: Good evening
[DEV] L74 prop:title: Reply to ${o.company}'s offer
[DEV] L74 prop:sub: ${o.role} · ${timeLeft(o.respondBy) || "reply soon"}
[DEV] L74 prop:sub: reply soon
[DEV] L74 prop:cta: Reply
[DEV] L75 prop:title: Register for placements
[DEV] L75 prop:sub: Closes ${dayTime(reg.deadline)}
[DEV] L75 prop:sub: Takes a minute; you need it to apply
[DEV] L75 prop:cta: Register
[DEV] L76 prop:title: Confirm your ${s.name.toLowerCase()} with ${s.company}
[DEV] L76 prop:sub: ${relativeDay(s.startsAt)} · ${dayTime(s.startsAt)}
[DEV] L76 prop:cta: Confirm
[DEV] L77 prop:title: Apply to ${d.companyName}
[DEV] L77 prop:sub: ${d.jobTitle} · applications close ${relativeDay(d.applicationDeadline).toLowerCase()}, ${at(d.applicationDeadline).format("h:mm A")}
[DEV] L77 prop:cta: View drive
[DEV] L78 prop:cta: Fix profile
[DEV] L85 str: You have an offer
[DEV] L85 prop:title: ${o.company} · ${o.role}
[DEV] L85 prop:line: ${o.ctcLpa != null ? `₹${Number(o.ctcLpa)} LPA · ` : ""}Reply by ${dayTime(o.respondBy)} (${timeLeft(o.respondBy)})
[DEV] L85 prop:line: ₹${Number(o.ctcLpa)} LPA ·
[DEV] L85 prop:cta: Accept or decline
[DEV] L87 str: First step
[DEV] L87 prop:title: Register for placements
[DEV] L87 prop:line: You need to register before you can apply to drives.${reg.deadline ? ` Registration closes ${dayTime(reg.deadline)}.` : ""}
[DEV] L87 prop:line: Registration closes ${dayTime(reg.deadline)}.
[DEV] L87 prop:cta: Register now
[DEV] L89 str: · expected
[DEV] L89 prop:title: ${soonest.name} · ${soonest.company}
[DEV] L89 prop:cta: Confirm I'll attend
[DEV] L89 prop:cta: See details
[DEV] L91 prop:title: You're placed with ${placedWith}
[DEV] L91 prop:line: Your placement cell has it on record. You can still apply where your college's rules allow.
[DEV] L91 prop:cta: See your rules
[DEV] L93 str: Open to you
[DEV] L93 prop:title: ${canApply.length === 1 ? "A drive is" : `${canApply.length} drives are`} open to you
[DEV] L93 prop:title: A drive is
[DEV] L93 prop:title: ${canApply.length} drives are
[DEV] L93 prop:line: Apply before the deadlines. Each drive shows its rounds and pay.
[DEV] L93 prop:cta: See drives
[DEV] L95 str: Your choice
[DEV] L95 prop:title: You chose higher studies
[DEV] L95 prop:title: You are not taking part in placements
[DEV] L95 prop:line: Changed your mind? Ask the placement cell to change your registration.
[DEV] L95 prop:cta: Placement cell
[DEV] L97 str: All caught up
[DEV] L97 prop:title: Nothing needs you right now
[DEV] L97 prop:line: New drives open to you will show up here. Keep your profile and resume up to date so you are ready.
[DEV] L97 prop:cta: Update profile
[DEV] L107 attr:message(Alert): We could not load your placements
[DEV] L107 attr:description(Alert): Your data is safe. Check your connection and try again.
L108 text(Alert): Retry
[DEV] L117 attr:message(Alert): You are barred from drives for now
[DEV] L127 text(div): Bring:
[DEV] L134 text(div): Waiting on you
[DEV] L136 text(div): Nothing to do right now. We'll list it here the moment something needs you.
L153 text(div): Next 7 days
[DEV] L153 text(div): Full schedule
[DEV] L155 text(div): No tests or interviews in the next 7 days. When the placement cell books you, it shows here and you get a notice.
[DEV] L163 text(div): Where your applications stand
[DEV] L163 text(div): All applications
[DEV] L165 child(div): You haven't applied to a drive yet.
[DEV] L165 child(div): No application is in progress right now.
[DEV] L165 text(div): Browse drives open to you
[DEV] L186 text(div): Latest from the placement cell
[DEV] L186 text(div): All notices
[DEV] L187 text(div): No notices yet.
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L35 prop:label: Applied
[PROD-ONLY] L36 prop:label: Assessment
[PROD-ONLY] L37 prop:label: Shortlisted
[PROD-ONLY] L38 prop:label: Interview
[PROD-ONLY] L39 prop:label: Scheduled
[PROD-ONLY] L43 prop:label: Waitlisted
[PROD-ONLY] L44 prop:label: Confirmed
[PROD-ONLY] L45 prop:label: Reschedule requested
[PROD-ONLY] L46 prop:label: Offered
[PROD-ONLY] L47 prop:label: Hired
[PROD-ONLY] L50 prop:label: Withdrawn
[PROD-ONLY] L51 prop:label: Rejected
[PROD-ONLY] L148 text(div): This is a loading problem, not an empty list. Retry to see your data.
[PROD-ONLY] L347 call:message.warning: Please login to view placements
[PROD-ONLY] L419 prop:text: ${applicationsLast7Days} applications in the last 7 days
[PROD-ONLY] L442 str: In ${days} days
[PROD-ONLY] L476 return: ${basePath}/assessments
[PROD-ONLY] L477 return: ${basePath}/interviews
[PROD-ONLY] L478 return: ${basePath}/assessments
[PROD-ONLY] L478 return: ${basePath}/interviews
[PROD-ONLY] L495 str: dddd, MMMM D
[PROD-ONLY] L524 return: Next: today
[PROD-ONLY] L525 return: Next: tomorrow
[PROD-ONLY] L526 return: Next: ${m.format("MMM D")}
[PROD-ONLY] L545 str: Data unavailable
[PROD-ONLY] L546 prop:title: We could not load your placement data
[PROD-ONLY] L548 prop:description: Nothing here is a real zero — the request failed. Retry before you make any decisions.
[PROD-ONLY] L558 str: Assessment pending
[PROD-ONLY] L558 str: Interview action
[PROD-ONLY] L559 prop:title: Complete your pending assessment
[PROD-ONLY] L559 prop:title: Prepare for your upcoming interview
[PROD-ONLY] L561 prop:description: ${urgent.companyName || "A company"} is waiting on this step. Finish it before moving deeper in the process.
[PROD-ONLY] L561 prop:description: A company
[PROD-ONLY] L562 prop:description: ${urgent.companyName || "A company"} has an interview lined up${urgent.timeToDue ? ` — ${urgent.timeToDue.toLowerCase()}` : ""}. Review the details and be ready.
[PROD-ONLY] L562 prop:description: A company
[PROD-ONLY] L562 prop:description: — ${urgent.timeToDue.toLowerCase()}
[PROD-ONLY] L563 prop:cta: Open assessment
[PROD-ONLY] L563 prop:cta: View interview
[PROD-ONLY] L573 str: Next scheduled event
[PROD-ONLY] L574 prop:title: Upcoming interview
[PROD-ONLY] L575 prop:description: ${next.job?.companyName || "Company"}${m ? ` • ${m.format("MMM D, h:mm A")}` : ""}
[PROD-ONLY] L575 prop:description: Company
[PROD-ONLY] L575 prop:description: • ${m.format("MMM D, h:mm A")}
[PROD-ONLY] L576 prop:cta: Open interviews
[PROD-ONLY] L584 str: Recommended next step
[PROD-ONLY] L585 prop:title: Apply to your next role
[PROD-ONLY] L586 prop:description: ${jobCount} open position${jobCount !== 1 ? "s" : ""} available. Keep the pipeline warm instead of waiting on one result.
[PROD-ONLY] L587 prop:cta: Browse jobs
[PROD-ONLY] L594 str: Placement hub
[PROD-ONLY] L595 prop:title: You are all caught up
[PROD-ONLY] L596 prop:description: No urgent placement actions right now. Check back when new roles, assessments, or interviews appear.
[PROD-ONLY] L597 prop:cta: Open calendar
[PROD-ONLY] L616 prop:label: Open jobs
[PROD-ONLY] L618 str: Could not load
[PROD-ONLY] L618 str: Available to apply
[PROD-ONLY] L624 prop:label: Applications
[PROD-ONLY] L627 str: Could not load
[PROD-ONLY] L630 str: Total submitted
[PROD-ONLY] L637 prop:label: Interviews
[PROD-ONLY] L640 str: Could not load
[PROD-ONLY] L643 str: None upcoming
[PROD-ONLY] L649 prop:label: Assessments
[PROD-ONLY] L652 str: Could not load
[PROD-ONLY] L654 str: Needs attention
[PROD-ONLY] L655 str: None pending
[PROD-ONLY] L677 prop:title: Application
[PROD-ONLY] L686 prop:title: Interview
[PROD-ONLY] L714 text(div): Your placement journey starts with one application
[PROD-ONLY] L715 text(div): Apply once and this page turns into your live tracker — every assessment, interview and offer, in the order you need to act on them.
[PROD-ONLY] L724 text(div): Browse jobs
[PROD-ONLY] L738 text(div): Some placement data could not be loaded.
[PROD-ONLY] L746 text(div): failed to load. Those numbers are unknown, not zero.
[PROD-ONLY] L780 child(div): 1 item needs attention
[PROD-ONLY] L781 child(div): ${needsAttention.length} items need attention
[PROD-ONLY] L805 text(div): View all
[PROD-ONLY] L814 text(div): Placement snapshot
[PROD-ONLY] L825 text(div): Loading
[PROD-ONLY] L847 text(div): Application pipeline
[PROD-ONLY] L848 text(div): View all
[PROD-ONLY] L855 attr:title(PanelError): Your applications did not load
[PROD-ONLY] L862 attr:aria-label(div): Pipeline: ${funnel.active .map((s) => `${s.count} ${s.label}`) .join(", ")}
[PROD-ONLY] L890 str: ${funnel.max ? Math.max(6, (item.count / funnel.max) * 100) : 0}%
[PROD-ONLY] L903 text(div): Closed
[PROD-ONLY] L922 attr:title(EmptyState): No application journey yet
[PROD-ONLY] L923 attr:subtitle(EmptyState): Once you apply, your progress from assessment to offer will appear here.
[PROD-ONLY] L924 attr:ctaLabel(EmptyState): Browse jobs
[PROD-ONLY] L934 text(div): Calendar
[PROD-ONLY] L941 attr:title(PanelError): Your schedule did not load
[PROD-ONLY] L945 attr:title(EmptyState): Nothing scheduled in the next 7 days
[PROD-ONLY] L946 attr:subtitle(EmptyState): Interviews land here as soon as a company books one with you.
[PROD-ONLY] L947 attr:ctaLabel(EmptyState): Open calendar
[PROD-ONLY] L960 attr:aria-label(button): ${d.fullLabel}${isToday ? " (today)" : ""} — ${d.interviews} interview${d.interviews === 1 ? "" : "s"}
[PROD-ONLY] L960 attr:aria-label(button): (today)
[PROD-ONLY] L976 text(div): Recent activity
[PROD-ONLY] L981 attr:title(PanelError): Your recent activity did not load
[PROD-ONLY] L1001 attr:title(EmptyState): No placement activity yet
[PROD-ONLY] L1002 attr:subtitle(EmptyState): Apply to roles and your most important updates will be summarized here.
[PROD-ONLY] L1003 attr:ctaLabel(EmptyState): Browse jobs
```

Page closure (6 files; strings in section 4 or above): `src/components/Placements/student/useJourney.js`, `src/components/Placements/student/ScheduleCard.jsx`, `src/components/Placements/student/RoundTrack.jsx`, `src/components/Placements/PlacementsCompanyAvatar.jsx`, `src/components/Placements/student/words.js`, `src/utils/placementDateTime.js`

#### Page `/learn/my-placements/interviews`  (file src/pages/learn/my-placements/interviews.js)

##### `src/pages/learn/my-placements/interviews.js` (branch: both (differs); 0 strings)
(no user-facing strings)

Page closure (1 files; strings in section 4 or above): `src/components/Placements/student/MovedPage.jsx`

#### Page `/learn/my-placements/jobs/[jobId]`  (file src/pages/learn/my-placements/jobs/[jobId].js)

##### `src/pages/learn/my-placements/jobs/[jobId].js` (branch: both (differs); 0 strings)
(no user-facing strings)

Page closure (21 files; strings in section 4 or above): `src/components/Placements/VerifiedJobDetailContent.jsx`, `src/utils/learnerValidation.js`, `src/utils/placementsAppliedLookup.js`, `src/utils/navigationContext.js`, `src/components/Placements/JobDetailContent.jsx`, `src/components/Placements/DriveEligibilityPanel.js`, `src/components/Placements/student/DriveJourney.jsx`, `src/utils/safeHref.js`, `src/utils/jobTagUtils.js`, `src/utils/placementApplicationIdentity.js`, `src/utils/resumeUploadUtils.js`, `src/utils/placementsStudentActionPolicy.js`, `src/components/Global/RichTextEditor/RichTextDisplay.jsx`, `src/components/Placements/PlacementsCompanyAvatar.jsx`, `src/components/Placements/student/RoundTrack.jsx`, `src/components/Placements/student/words.js`, `src/components/Common/PanelStates.jsx`, `src/config/appConfig.js`, `src/utils/driveDescription.js`, `src/utils/placementDateTime.js`, `src/utils/tenantUtils.js`

#### Page `/learn/my-placements/jobs/index`  (file src/pages/learn/my-placements/jobs/index.js)

##### `src/pages/learn/my-placements/jobs/index.js` (branch: both (identical); 0 strings)
(no user-facing strings)

Page closure (8 files; strings in section 4 or above): `src/components/Placements/JobsListContent.jsx`, `src/utils/jobTagUtils.js`, `src/utils/learnerApiUtils.js`, `src/utils/driveDescription.js`, `src/components/Placements/PlacementsCompanyAvatar.jsx`, `src/components/Common/Skeletons.jsx`, `src/utils/navigationContext.js`, `src/components/Common/PanelStates.jsx`

#### Page `/learn/my-placements/offers`  (file src/pages/learn/my-placements/offers.js)

##### `src/pages/learn/my-placements/offers.js` (branch: lms-dev-2026 only; 11 strings)
```text
L22 attr:message(Alert): We could not load your offers
L22 text(Alert): Retry
L32 text(div): No offers yet
L33 text(div): When a company selects you and the placement cell releases the offer, it shows here and you get a notice. You'll have time to read it and decide.
L33 text(div): See where your applications stand
L39 text(div): Needs your reply
L45 child(div): Earlier offers
L45 child(div): Your offers
L49 text(div): Need more time on an offer, or got an offer outside campus?
L49 text(div): Send a request to the placement cell
L54 text(div): How offers work at your college
```

Page closure (6 files; strings in section 4 or above): `src/components/Placements/student/useJourney.js`, `src/components/Placements/student/OfferCard.jsx`, `src/components/Placements/student/PlacementRules.jsx`, `src/components/Placements/PlacementsCompanyAvatar.jsx`, `src/components/Placements/student/words.js`, `src/utils/placementDateTime.js`

#### Page `/learn/my-placements/placement`  (file src/pages/learn/my-placements/placement.js)

##### `src/pages/learn/my-placements/placement.js` (branch: lms-dev-2026 only; 0 strings)
(no user-facing strings)

Page closure (6 files; strings in section 4 or above): `src/components/Placements/PlacementCellContent.js`, `src/utils/uploadToR2.js`, `src/components/Placements/student/PlacementRules.jsx`, `src/components/Placements/student/words.js`, `src/utils/clientErrorReporting.js`, `src/utils/placementDateTime.js`

#### Page `/learn/my-placements/rules`  (file src/pages/learn/my-placements/rules.js)

##### `src/pages/learn/my-placements/rules.js` (branch: lms-dev-2026 only; 0 strings)
(no user-facing strings)

Page closure (1 files; strings in section 4 or above): `src/components/Placements/student/MovedPage.jsx`

#### Page `/learn/my-placements/schedule`  (file src/pages/learn/my-placements/schedule.js)

##### `src/pages/learn/my-placements/schedule.js` (branch: lms-dev-2026 only; 35 strings)
```text
L16 str: Coming up
L25 prop:name: ${String(iv.interviewType).charAt(0)}${String(iv.interviewType).slice(1).toLowerCase()} interview
L25 prop:name: Interview
L41 str: Date to be told
L41 str: ddd D MMM
L42 str: ddd D MMM
L42 str: dddd D MMMM
L85 prop:title: Apply: ${j.companyName}
L108 prop:name: Online assessment
L118 attr:message(Alert): We could not load your schedule
L118 text(Alert): Retry
L128 text(div): Your tests, talks and interviews. When the placement cell books you, it shows here and you get a notice
L128 child(div): ; please confirm each one so they know you'll be there
L129 attr:aria-label(div): Show
L132 child(div): (${ahead.length})
L138 attr:message(Alert): ${toConfirm === 1 ? "One round needs" : `${toConfirm} rounds need`} your confirmation
L138 attr:message(Alert): One round needs
L138 attr:message(Alert): ${toConfirm} rounds need
L139 attr:description(Alert): Tap Confirm I'll attend on each. If you can't make it, ask to reschedule before the day.
L143 text(div): Nothing coming up. When a company's round is planned and the placement cell books you, it shows here.
L143 text(div): See where your applications stand
L152 text(div): No past rounds yet.
L168 attr:description(Alert): The college has blocked this day. No drives run on it.
L170 text(div): Applications close
L171 text(div): Nothing on this day.
L186 attr:aria-label(section): Calendar
L188 attr:aria-label(Button): Previous month
L191 text(section): Today
L192 attr:aria-label(Button): Next month
L209 attr:title(button): ${s.name} · ${s.company} · ${dayTime(s.startsAt)}
L214 attr:title(button): ${x.title} ${dayTime(x.at)}
L223 text(section): Your tests and interviews
L224 text(section): Talks
L225 text(section): Application deadlines
L226 text(section): No drives (exams)
```

Page closure (4 files; strings in section 4 or above): `src/components/Placements/student/useJourney.js`, `src/components/Placements/student/ScheduleCard.jsx`, `src/components/Placements/student/words.js`, `src/utils/placementDateTime.js`

#### Page `/learn/notifications`  (file src/pages/learn/notifications.js)

##### `src/pages/learn/notifications.js` (branch: both (identical); 0 strings)
(no user-facing strings)

Page closure (14 files; strings in section 4 or above): `src/components/Notifications/NotificationsContent.jsx`, `src/hooks/useLearnerClassScope.js`, `src/components/Global/ListingPageHeader/ListingPageHeader.jsx`, `src/components/Common/PageShell.jsx`, `src/components/Common/Skeletons.jsx`, `src/components/Common/PanelStates.jsx`, `src/utils/roleUtils.js`, `src/utils/learnerApiUtils.js`, `src/utils/notificationDateUtils.js`, `src/utils/facultyRouteUtils.js`, `src/utils/notificationTypeUtils.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/config/roles.js`, `src/common/lists.js`

#### Page `/learn/profile`  (file src/pages/learn/profile.js)

##### `src/pages/learn/profile.js` (branch: both (differs); 13 strings)
```text
[DEV] L88 str: Program couldn't load
L124 attr:title(ListingPageHeader): Profile
L124 attr:ariaLabel(ListingPageHeader): Profile overview
L137 attr:title(ListingPageHeader): Profile
L137 attr:ariaLabel(ListingPageHeader): Profile overview
L139 text(div): We couldn't load your profile. Please try again.
L140 text(div): Retry
L150 attr:title(ListingPageHeader): Profile
L150 attr:ariaLabel(ListingPageHeader): Profile overview
[DEV] L152 attr:label(RefreshStatus): Refreshing profile…
[DEV] L157 attr:message(Alert): Couldn't refresh profile
[DEV] L158 attr:description(Alert): Showing the last profile we loaded.
L159 text(Alert): Retry
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L51 call:message.error: Failed to load profile. Please try again.
```

Page closure (51 files; strings in section 4 or above): `src/components/Global/ListingPageHeader/ListingPageHeader.jsx`, `src/components/Common/PageShell.jsx`, `src/components/profile/about.js`, `src/components/profile/ProfileSkeleton.js`, `src/components/profile/ProfileVerificationCard.jsx`, `src/components/Common/Skeletons.jsx`, `src/utils/roleUtils.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/components/profile/about/contacts.js`, `src/components/profile/about/experiences.js`, `src/components/profile/about/skills.js`, `src/components/profile/userInfo.js`, `src/components/profile/about/qualifications.js`, `src/components/profile/about/projects.js`, `src/components/profile/about/certifications.js`, `src/components/profile/about/achievements.js`, `src/components/profile/about/languages.js`, `src/components/profile/about/identity.js`, `src/components/profile/about/extracurricular.js`, `src/components/profile/about/socialProfiles.js`, `src/components/profile/about/address.js`, `src/components/profile/about/personalDetails.js`, `src/components/profile/about/hobbies.js`, `src/components/profile/about/publications.js`, `src/components/profile/about/awards.js`, `src/components/profile/about/metadata.js`, `src/components/Global/CardHeader/cardHeader.js`, `src/components/Global/Upload/UploadFromLinkButton.jsx`, `src/components/profile/ProfileCompleteness.js`, `src/utils/uploadToR2.js`, `src/utils/errorHandlers.js`, `src/utils/resumeUploadUtils.js`, `src/config/roles.js`, `src/components/Global/Button/button.jsx`, `src/components/Global/RichTextEditor/RichTextEditor.jsx`, `src/components/Global/RichTextEditor/RichTextDisplay.jsx`, `src/components/Global/SkillsAutocomplete.jsx`, `src/components/Global/Button/PencilUploadButton.jsx`, `src/utils/profileUtils.js`, `src/components/Common/ResilientAvatar.jsx`, `src/components/profile/VideoIntroModal.jsx`, `src/components/profile/PrivateDocLink.jsx`, `src/components/profile/about/MarksheetUpload.jsx`, `src/utils/urlValidation.js`, `src/hooks/useChoices.js`, `src/utils/clientErrorReporting.js`, `src/config/appConfig.js`, `src/utils/driveDescription.js`, `src/components/Global/ModalContainer/ModalContainer.jsx`, `src/config/choices.js`, `src/utils/tenantUtils.js`

#### Page `/learn/projects/[projectId]`  (file src/pages/learn/projects/[projectId].js)

##### `src/pages/learn/projects/[projectId].js` (branch: both (identical); 0 strings)
(no user-facing strings)

Page closure (18 files; strings in section 4 or above): `src/utils/accountScopeKey.js`, `src/components/Projects/ProjectDetailContent.jsx`, `src/components/Projects/ProjectsShell.jsx`, `src/components/Projects/ProjectModalShell.jsx`, `src/components/Common/Skeletons.jsx`, `src/components/Projects/modals/TaskDetailsModal.jsx`, `src/data/projectsData.js`, `src/utils/uploadToR2.js`, `src/utils/projectErrorModal.jsx`, `src/utils/projectMeetingTime.js`, `src/utils/projectBoardUndo.js`, `src/utils/projectEditorVersion.js`, `src/config/appConfig.js`, `src/components/Common/PageShell.jsx`, `src/utils/clientErrorReporting.js`, `src/utils/apiError.js`, `src/utils/tenantUtils.js`, `src/components/Course/Common/CourseSectionHeader.jsx`

#### Page `/learn/projects/index`  (file src/pages/learn/projects/index.js)

##### `src/pages/learn/projects/index.js` (branch: both (identical); 0 strings)
(no user-facing strings)

Page closure (8 files; strings in section 4 or above): `src/utils/accountScopeKey.js`, `src/components/Projects/ProjectsContent.jsx`, `src/components/Projects/ProjectsShell.jsx`, `src/utils/projectListOrdering.js`, `src/components/Common/Skeletons.jsx`, `src/components/Common/PageShell.jsx`, `src/data/projectsData.js`, `src/components/Course/Common/CourseSectionHeader.jsx`

### FACULTY

#### Page `/teacher/allAssignments`  (file src/pages/teacher/allAssignments.js)

##### `src/pages/teacher/allAssignments.js` (branch: both (identical); 0 strings)
(no user-facing strings)

Page closure (21 files; strings in section 4 or above): `src/components/Assignments/AssignmentsContent.jsx`, `src/components/Common/Skeletons.jsx`, `src/components/Global/ListingPageHeader/ListingPageHeader.jsx`, `src/components/Common/PageShell.jsx`, `src/components/Global/MetricPill/MetricPill.jsx`, `src/utils/dateUtils.js`, `src/utils/learnerApiUtils.js`, `src/components/Global/Offcanvas/Assignment/newAssignment.js`, `src/components/Assignments/ViewAssignmentModal.jsx`, `src/components/Assignments/ActionAssignment.js`, `src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx`, `src/common/lists.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/components/Global/Editor/editor.js`, `src/components/Global/RightDrawer/DrawerWidget.js`, `src/utils/uploadToR2.js`, `src/components/Global/Upload/UploadFromLinkButton.jsx`, `src/utils/assignmentSchema.js`, `src/components/Assignments/SubmitAssignmentModal.jsx`, `src/components/Global/Button/button.jsx`, `src/utils/clientErrorReporting.js`

#### Page `/teacher/allQuizzes`  (file src/pages/teacher/allQuizzes.js)

##### `src/pages/teacher/allQuizzes.js` (branch: both (identical); 0 strings)
(no user-facing strings)

Page closure (15 files; strings in section 4 or above): `src/components/Quizzes/QuizzesContent.jsx`, `src/components/Global/ListingPageHeader/ListingPageHeader.jsx`, `src/components/Common/PageShell.jsx`, `src/components/Global/MetricPill/MetricPill.jsx`, `src/components/Quiz/QuizBuilderModal.jsx`, `src/components/Common/Skeletons.jsx`, `src/components/Quiz/Table/table.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/dateUtils.js`, `src/utils/formErrors.js`, `src/components/admin/projects/adminProjectUtils.js`, `src/components/Quiz/Table/quizeTitle.js`, `src/components/Quiz/Table/action.js`, `src/components/Quiz/Table/submission.js`, `src/hooks/useLearnerClassScope.js`

#### Page `/teacher/calendar`  (file src/pages/teacher/calendar.js)

##### `src/pages/teacher/calendar.js` (branch: both (identical); 0 strings)
(no user-facing strings)

Page closure (18 files; strings in section 4 or above): `src/components/CalendarComp/ClassScheduleContent.jsx`, `src/components/Global/ListingPageHeader/ListingPageHeader.jsx`, `src/components/Common/PageShell.jsx`, `src/components/Global/MetricPill/MetricPill.jsx`, `src/contexts/calendar-context.js`, `src/hooks/useCourses.js`, `src/utils/helper.js`, `src/components/CalendarComp/CalendarEvents/CalendarEvents.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/learnerApiUtils.js`, `src/components/CalendarComp/StandardCalendar/index.js`, `src/components/CalendarComp/CalendarMobileList/CalendarMobileList.js`, `src/components/ErrorBoundary/CalendarErrorBoundary.js`, `src/hooks/useLearnerClassScope.js`, `src/components/CalendarComp/StandardCalendar/StandardCalendar.js`, `src/components/CalendarComp/CalendarMobileList/MiniCalendar.js`, `src/utils/clientErrorReporting.js`, `src/components/CalendarComp/MyWeekHeader/MyWeekHeader.js`

#### Page `/teacher/contacts/[contactsTab]`  (file src/pages/teacher/contacts/[contactsTab].js)

##### `src/pages/teacher/contacts/[contactsTab].js` (branch: both (differs); 4 strings)
```text
L23 attr:title(ContactsGrid): All Contacts
L32 attr:title(ContactsGrid): Teachers
L41 attr:title(ContactsGrid): Students
L50 attr:title(ContactsGrid): All Contacts
```

Page closure (4 files; strings in section 4 or above): `src/components/contacts/index.js`, `src/components/contacts/ContactsGrid.js`, `src/components/contacts/contactColumns.js`, `src/hooks/useContacts.js`

#### Page `/teacher/contacts/index`  (file src/pages/teacher/contacts/index.js)

##### `src/pages/teacher/contacts/index.js` (branch: both (identical); 0 strings)
(no user-facing strings)

Page closure (0 files; strings in section 4 or above): 

#### Page `/teacher/courses/[courseId]/[...courseTab]`  (file src/pages/teacher/courses/[courseId]/[...courseTab].js)

##### `src/pages/teacher/courses/[courseId]/[...courseTab].js` (branch: both (differs); 10 strings)
```text
L61 new Error: Course context missing
L66 new Error: Faculty assignments unavailable
L115 new Error: Course not found
L123 prop:name: Unnamed Course
L157 new Error: Faculty assignment response invalid
L220 attr:message(Alert): Faculty access required
L220 attr:message(Alert): Could not load teacher course context
L221 attr:description(Alert): Sign in with a Faculty account to open this course.
L222 attr:description(Alert): Please retry. If this continues, your course assignment may be missing or unavailable.
L225 text(div): Try again
```

Page closure (85 files; strings in section 4 or above): `src/components/Course/Common/CourseTabSkeleton.jsx`, `src/pages/Dashboard/course/syllabus/syllabus.js`, `src/pages/Dashboard/course/Sudent/student.js`, `src/pages/Dashboard/course/Attendance/attendance.js`, `src/pages/Dashboard/course/Home/Home.js`, `src/pages/Dashboard/course/Classroom/classroom.js`, `src/utils/facultyCourseDetail.js`, `src/utils/dateUtils.js`, `src/utils/courseUtils/contentOrder.js`, `src/utils/courseUtils/contentCompletion.js`, `src/components/Global/Offcanvas/Syallabus/AddNewLessonContentDrawer.js`, `src/components/Global/Offcanvas/Assignment/newAssignment.js`, `src/components/Quiz/QuizBuilderModal.jsx`, `src/pages/Dashboard/course/syllabus/video.js`, `src/pages/Dashboard/course/syllabus/youtube.js`, `src/pages/Dashboard/course/syllabus/resource.js`, `src/pages/Dashboard/course/syllabus/liveclass.js`, `src/pages/Dashboard/course/syllabus/syllabusDetail.js`, `src/utils/courseUtils/contentAvailability.js`, `src/components/Assignments/ViewAssignmentModal.jsx`, `src/pages/Dashboard/course/Attendance/AttendanceReport.js`, `src/components/Course/Home/index.js`, `src/hooks/useCourseHomeWidgets.js`, `src/hooks/useLearnerHomeStats.js`, `src/hooks/useFacultyCourseStats.js`, `src/utils/facultyRouteUtils.js`, `src/utils/courseClassAssignment.js`, `src/utils/clientSettings.js`, `src/utils/placementDateTime.js`, `src/components/Global/Offcanvas/Syallabus/videoform.js`, `src/components/Global/Offcanvas/Syallabus/youtube.js`, `src/components/Global/Offcanvas/Syallabus/liveclass.js`, `src/components/Global/Offcanvas/Syallabus/ResourceComposer.js`, `src/components/Global/RightDrawer/DrawerWidget.js`, `src/components/Global/Editor/editor.js`, `src/utils/uploadToR2.js`, `src/components/Global/Upload/UploadFromLinkButton.jsx`, `src/utils/assignmentSchema.js`, `src/utils/formErrors.js`, `src/components/Global/video/video.jsx`, `src/utils/courseUtils/syllabusUtils.js`, `src/components/Course/Syllabus/VideoDrawer.jsx`, `src/components/Course/Syllabus/ContentTitle.jsx`, `src/components/Course/Syllabus/ContentProgressBadge.jsx`, `src/config/appConfig.js`, `src/utils/authUtils.js`, `src/components/Course/Syllabus/YoutubeDrawer.jsx`, `src/components/Course/Syllabus/MarkCompleteButton.jsx`, `src/components/Global/SortableLessonContentList/SortableLessonContentList.jsx`, `src/components/Course/Syllabus/LessonProgressBar.jsx`, `src/components/Course/Syllabus/ContentCompletionCheck.jsx`, `src/utils/courseUtils/quizContent.js`, `src/components/Course/Syllabus/LessonActivityCards.jsx`, `src/components/Assignments/SubmitAssignmentModal.jsx`, `src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx`, `src/components/Attendance/TakeAttendanceHeaderFilters/TakeAttendanceHeaderFilters.js`, `src/components/Attendance/CourseAttendeeHeaderFilters/CourseAttendeeHeaderFilters.js`, `src/pages/Dashboard/course/Attendance/StudentAttendanceView.jsx`, `src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx`, `src/components/Course/Home/InThisCourseSection.jsx`, `src/components/Course/Home/UnifiedActivityList.jsx`, `src/components/Course/Home/AtRiskStudentsCard.jsx`, `src/components/Course/Home/PerformanceCard.jsx`, `src/components/Global/Offcanvas/Syallabus/preview.js`, `src/utils/helper.js`, `src/components/Global/Button/uploadButton.jsx`, `src/utils/youtubeLink.js`, `src/utils/resourceUploadToR2.js`, `src/components/Global/Button/button.jsx`, `src/utils/clientErrorReporting.js`, `src/components/Common/PanelStates.jsx`, `src/utils/tenantUtils.js`, `src/utils/navigationContext.js`, `src/components/Attendance/StudentAttendance/StatusCol.js`, `src/utils/attendanceConstants.js`, `src/pages/Dashboard/course/Attendance/TakeAttendance.js`, `src/components/Global/Tooltips/CustomToolTipTable.jsx`, `src/utils/monthlyAttendanceReport.js`, `src/utils/downloadMonthlyAttendancePdf.js`, `src/utils/notificationDateUtils.js`, `src/components/Report/ScoreDistributionBars.jsx`, `src/pages/Dashboard/course/Attendance/NameWithDp.js`, `src/pages/Dashboard/course/Attendance/AbsentPresntBtnCol.js`, `src/components/Global/Offcanvas/Attendance/SheduleClassDrawer.js`, `src/common/lists.js`

#### Page `/teacher/courses/[courseId]/index`  (file src/pages/teacher/courses/[courseId]/index.js)

##### `src/pages/teacher/courses/[courseId]/index.js` (branch: both (differs); 1 strings)
```text
L21 attr:tab(CourseTabSkeleton): home
```

Page closure (1 files; strings in section 4 or above): `src/components/Course/Common/CourseTabSkeleton.jsx`

#### Page `/teacher/courses/index`  (file src/pages/teacher/courses/index.js)

##### `src/pages/teacher/courses/index.js` (branch: both (identical); 0 strings)
(no user-facing strings)

Page closure (8 files; strings in section 4 or above): `src/components/Course/CoursesContent.jsx`, `src/components/Global/ListingPageHeader/ListingPageHeader.jsx`, `src/components/Common/PageShell.jsx`, `src/components/Common/Skeletons.jsx`, `src/components/Global/MetricPill/MetricPill.jsx`, `src/utils/courseListingUtils.js`, `src/utils/courseUtils/contentAvailability.js`, `src/components/Course/Common/CourseSectionHeader.jsx`

#### Page `/teacher/fileExplorer`  (file src/pages/teacher/fileExplorer.js)

##### `src/pages/teacher/fileExplorer.js` (branch: both (identical); 0 strings)
(no user-facing strings)

Page closure (0 files; strings in section 4 or above): 

#### Page `/teacher/index`  (file src/pages/teacher/index.js)

##### `src/pages/teacher/index.js` (branch: both (identical); 0 strings)
(no user-facing strings)

Page closure (0 files; strings in section 4 or above): 

#### Page `/teacher/notifications`  (file src/pages/teacher/notifications.js)

##### `src/pages/teacher/notifications.js` (branch: both (identical); 0 strings)
(no user-facing strings)

Page closure (14 files; strings in section 4 or above): `src/components/Notifications/NotificationsContent.jsx`, `src/hooks/useLearnerClassScope.js`, `src/components/Global/ListingPageHeader/ListingPageHeader.jsx`, `src/components/Common/PageShell.jsx`, `src/components/Common/Skeletons.jsx`, `src/components/Common/PanelStates.jsx`, `src/utils/roleUtils.js`, `src/utils/learnerApiUtils.js`, `src/utils/notificationDateUtils.js`, `src/utils/facultyRouteUtils.js`, `src/utils/notificationTypeUtils.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/config/roles.js`, `src/common/lists.js`

#### Page `/teacher/profile`  (file src/pages/teacher/profile.js)

##### `src/pages/teacher/profile.js` (branch: both (differs); 12 strings)
```text
L121 attr:title(ListingPageHeader): Profile
L121 attr:ariaLabel(ListingPageHeader): Profile overview
L134 attr:title(ListingPageHeader): Profile
L134 attr:ariaLabel(ListingPageHeader): Profile overview
L136 text(div): We couldn't load your profile. Please try again.
L137 text(div): Retry
L147 attr:title(ListingPageHeader): Profile
L147 attr:ariaLabel(ListingPageHeader): Profile overview
[DEV] L149 attr:label(RefreshStatus): Refreshing profile…
[DEV] L154 attr:message(Alert): Couldn't refresh profile
[DEV] L155 attr:description(Alert): Showing the last profile we loaded.
L156 text(Alert): Retry
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L62 call:message.error: Failed to load profile. Please try again.
```

Page closure (50 files; strings in section 4 or above): `src/components/profile/about.js`, `src/components/profile/ProfileSkeleton.js`, `src/utils/roleUtils.js`, `src/components/Global/ListingPageHeader/ListingPageHeader.jsx`, `src/components/Common/PageShell.jsx`, `src/components/Common/Skeletons.jsx`, `src/components/profile/about/contacts.js`, `src/components/profile/about/experiences.js`, `src/components/profile/about/skills.js`, `src/components/profile/userInfo.js`, `src/components/profile/about/qualifications.js`, `src/components/profile/about/projects.js`, `src/components/profile/about/certifications.js`, `src/components/profile/about/achievements.js`, `src/components/profile/about/languages.js`, `src/components/profile/about/identity.js`, `src/components/profile/about/extracurricular.js`, `src/components/profile/about/socialProfiles.js`, `src/components/profile/about/address.js`, `src/components/profile/about/personalDetails.js`, `src/components/profile/about/hobbies.js`, `src/components/profile/about/publications.js`, `src/components/profile/about/awards.js`, `src/components/profile/about/metadata.js`, `src/components/Global/CardHeader/cardHeader.js`, `src/components/Global/Upload/UploadFromLinkButton.jsx`, `src/components/profile/ProfileCompleteness.js`, `src/utils/uploadToR2.js`, `src/utils/errorHandlers.js`, `src/utils/resumeUploadUtils.js`, `src/config/roles.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/components/Global/Button/button.jsx`, `src/components/Global/RichTextEditor/RichTextEditor.jsx`, `src/components/Global/RichTextEditor/RichTextDisplay.jsx`, `src/components/Global/SkillsAutocomplete.jsx`, `src/components/Global/Button/PencilUploadButton.jsx`, `src/utils/profileUtils.js`, `src/components/Common/ResilientAvatar.jsx`, `src/components/profile/VideoIntroModal.jsx`, `src/components/profile/PrivateDocLink.jsx`, `src/components/profile/about/MarksheetUpload.jsx`, `src/utils/urlValidation.js`, `src/hooks/useChoices.js`, `src/utils/clientErrorReporting.js`, `src/config/appConfig.js`, `src/utils/driveDescription.js`, `src/components/Global/ModalContainer/ModalContainer.jsx`, `src/config/choices.js`, `src/utils/tenantUtils.js`

#### Page `/teacher/report/assignment/[contentId]`  (file src/pages/teacher/report/assignment/[contentId].js)

##### `src/pages/teacher/report/assignment/[contentId].js` (branch: lms-dev-2026 only; 0 strings)
(no user-facing strings)

Page closure (9 files; strings in section 4 or above): `src/components/Report/AssignmentReportContent.jsx`, `src/utils/assignmentReport.js`, `src/utils/downloadAssignmentReportPdf.js`, `src/components/Report/ReportSummaryHeader.jsx`, `src/components/Report/ScoreDistributionBars.jsx`, `src/components/Report/SubmissionTimingCard.jsx`, `src/components/Report/ReportStudentTable.jsx`, `src/components/Common/Skeletons.jsx`, `src/utils/scoreDistribution.js`

#### Page `/teacher/report/quiz/[quizId]`  (file src/pages/teacher/report/quiz/[quizId].js)

##### `src/pages/teacher/report/quiz/[quizId].js` (branch: lms-dev-2026 only; 0 strings)
(no user-facing strings)

Page closure (9 files; strings in section 4 or above): `src/components/Report/QuizReportContent.jsx`, `src/utils/quizReport.js`, `src/utils/downloadQuizReportPdf.js`, `src/components/Report/ReportSummaryHeader.jsx`, `src/components/Report/ScoreDistributionBars.jsx`, `src/components/Report/QuestionAccuracyList.jsx`, `src/components/Report/ReportStudentTable.jsx`, `src/components/Common/Skeletons.jsx`, `src/utils/scoreDistribution.js`

### MENTOR

#### Page `/mentor/allQuizzes`  (file src/pages/mentor/allQuizzes.js)

##### `src/pages/mentor/allQuizzes.js` (branch: both (identical); 0 strings)
(no user-facing strings)

Page closure (0 files; strings in section 4 or above): 

#### Page `/mentor/calendar`  (file src/pages/mentor/calendar.js)

##### `src/pages/mentor/calendar.js` (branch: both (differs); 19 strings)
```text
L80 str: ${when.format("hh:mm A")}${whenEnd ? ` – ${whenEnd.format("hh:mm A")}` : ""} (GMT${when.format("Z")})
L92 str: var(--text-secondary, #6b7280)
L115 str: var(--text-secondary, #6b7280)
L116 child(div): Date TBD
L116 str: ddd, MMM D YYYY
L118 text(div): Sprint:
L123 text(div): Join link
L126 text(div): Open project
L175 call:setError: We couldn't load your meetings.
L237 attr:title(CourseSectionHeader): Meetings
L238 attr:subtitle(CourseSectionHeader): Every scheduled meeting across your assigned projects, in one place.
L239 attr:ariaLabel(CourseSectionHeader): Mentor meetings calendar
L254 text(Alert): Retry
L260 text(div): Upcoming (
L263 attr:description(Empty): No upcoming meetings.
L273 text(div): Past & Cancelled (
L275 attr:description(Empty): No past meetings yet.
L294 child(div): Show fewer
L294 child(div): Show all ${past.length} past meetings
```

Page closure (1 files; strings in section 4 or above): `src/components/Course/Common/CourseSectionHeader.jsx`

#### Page `/mentor/contacts/[contactsTab]`  (file src/pages/mentor/contacts/[contactsTab].js)

##### `src/pages/mentor/contacts/[contactsTab].js` (branch: both (identical); 0 strings)
(no user-facing strings)

Page closure (0 files; strings in section 4 or above): 

#### Page `/mentor/contacts/index`  (file src/pages/mentor/contacts/index.js)

##### `src/pages/mentor/contacts/index.js` (branch: both (identical); 0 strings)
(no user-facing strings)

Page closure (0 files; strings in section 4 or above): 

#### Page `/mentor/courses/[courseId]/[...courseTab]`  (file src/pages/mentor/courses/[courseId]/[...courseTab].js)

##### `src/pages/mentor/courses/[courseId]/[...courseTab].js` (branch: both (identical); 0 strings)
(no user-facing strings)

Page closure (0 files; strings in section 4 or above): 

#### Page `/mentor/courses/[courseId]/index`  (file src/pages/mentor/courses/[courseId]/index.js)

##### `src/pages/mentor/courses/[courseId]/index.js` (branch: both (identical); 0 strings)
(no user-facing strings)

Page closure (0 files; strings in section 4 or above): 

#### Page `/mentor/courses/index`  (file src/pages/mentor/courses/index.js)

##### `src/pages/mentor/courses/index.js` (branch: both (identical); 0 strings)
(no user-facing strings)

Page closure (0 files; strings in section 4 or above): 

#### Page `/mentor/fileExplorer`  (file src/pages/mentor/fileExplorer.js)

##### `src/pages/mentor/fileExplorer.js` (branch: both (identical); 0 strings)
(no user-facing strings)

Page closure (0 files; strings in section 4 or above): 

#### Page `/mentor/index`  (file src/pages/mentor/index.js)

##### `src/pages/mentor/index.js` (branch: both (differs); 5 strings)
```text
L19 attr:title(Result): Opening your mentor workspace
[DEV] L26 attr:title(Result): Could not verify Projects access
[DEV] L27 attr:subTitle(Result): The LMS could not check your college module settings. This does not mean Projects is disabled.
L36 attr:title(Result): Projects is currently unavailable
L37 attr:subTitle(Result): Projects is disabled for this account. You can still check notifications.
```

Page closure (5 files; strings in section 4 or above): `src/utils/useCollegeFeatureFlags.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/mentor/notifications`  (file src/pages/mentor/notifications.js)

##### `src/pages/mentor/notifications.js` (branch: both (differs); 26 strings)
```text
L114 str: var(--text-secondary, #667085)
L171 prop:title: Announcement
L172 prop:description: A new notification was sent to you.
L272 call:setError: We couldn't load your notifications.
L292 str: Needs review
L293 prop:title: ${project.title} — submission waiting for your review
L295 prop:description: Submitted by ${project.resolvedDelivery.submittedByName}
L296 prop:description: A team member submitted work for this project.
L305 prop:title: ${project.title} — no activity in ${STALE_AFTER_DAYS}+ days
L306 prop:description: This project hasn't had any recorded activity recently.
L321 str: Meeting requested
L322 prop:title: ${meeting.title} — ${project.title}
L323 prop:description: A team member requested this meeting — review and confirm the time.
L333 str: Upcoming meeting
L334 prop:title: ${meeting.title} — ${project.title}
L335 prop:description: ${when.format("ddd, MMM D")} at ${meeting.startTime || "TBD"}
L335 str: ddd, MMM D
L352 attr:title(CourseSectionHeader): Notifications
L353 attr:subtitle(CourseSectionHeader): Announcements, submissions waiting for review, stalled projects, and meetings coming up soon.
L354 attr:ariaLabel(CourseSectionHeader): Mentor notifications
L369 text(Alert): Retry
[DEV] L378 attr:message(Alert): Some notification sources are unavailable
[DEV] L379 attr:description(Alert): Could not load: ${broadSourceErrors.join(", ")}. Everything else below is current, but this page may be incomplete.
[DEV] L380 text(Alert): Retry sources
[DEV] L387 attr:description(Empty): No project alerts are visible, but some notification sources could not be checked.
L388 attr:description(Empty): Nothing needs your attention right now.
```

Page closure (6 files; strings in section 4 or above): `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/mentor/profile`  (file src/pages/mentor/profile.js)

##### `src/pages/mentor/profile.js` (branch: both (identical); 0 strings)
(no user-facing strings)

Page closure (0 files; strings in section 4 or above): 

#### Page `/mentor/projects/[projectId]`  (file src/pages/mentor/projects/[projectId].js)

##### `src/pages/mentor/projects/[projectId].js` (branch: both (identical); 0 strings)
(no user-facing strings)

Page closure (18 files; strings in section 4 or above): `src/utils/accountScopeKey.js`, `src/components/Projects/ProjectDetailContent.jsx`, `src/components/Projects/ProjectsShell.jsx`, `src/components/Projects/ProjectModalShell.jsx`, `src/components/Common/Skeletons.jsx`, `src/components/Projects/modals/TaskDetailsModal.jsx`, `src/data/projectsData.js`, `src/utils/uploadToR2.js`, `src/utils/projectErrorModal.jsx`, `src/utils/projectMeetingTime.js`, `src/utils/projectBoardUndo.js`, `src/utils/projectEditorVersion.js`, `src/config/appConfig.js`, `src/components/Common/PageShell.jsx`, `src/utils/clientErrorReporting.js`, `src/utils/apiError.js`, `src/utils/tenantUtils.js`, `src/components/Course/Common/CourseSectionHeader.jsx`

#### Page `/mentor/projects/index`  (file src/pages/mentor/projects/index.js)

##### `src/pages/mentor/projects/index.js` (branch: both (differs); 6 strings)
```text
[DEV] L16 attr:title(Result): Checking Projects access
[DEV] L16 attr:subTitle(Result): Verifying your college module settings…
[DEV] L23 attr:title(Result): Could not verify Projects access
[DEV] L24 attr:subTitle(Result): The LMS could not check your college module settings. This does not mean Projects is disabled.
L34 attr:title(Result): Projects is turned off for your college
L35 attr:subTitle(Result): Projects is currently unavailable for your account. Contact your administrator if you need access.
```

Page closure (13 files; strings in section 4 or above): `src/utils/accountScopeKey.js`, `src/components/Projects/ProjectsContent.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/components/Projects/ProjectsShell.jsx`, `src/utils/projectListOrdering.js`, `src/components/Common/Skeletons.jsx`, `src/utils/authUtils.js`, `src/components/Common/PageShell.jsx`, `src/data/projectsData.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/tenantUtils.js`

### COLLEGE

#### Page `/college-admin/assignments`  (file src/pages/college-admin/assignments.js)

##### `src/pages/college-admin/assignments.js` (branch: both (identical); 2 strings)
```text
L16 attr:message(Alert): Admin not assigned to a college
L17 attr:description(Alert): You must be assigned to a college to view assignments. Contact your administrator.
```

Page closure (13 files; strings in section 4 or above): `src/components/admin/AdminGroupShell.jsx`, `src/components/Common/PageShell.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/components/admin/AdminWorkflowGuide.jsx`, `src/common/adminNavGroups.js`, `src/common/navTabMatching.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/attendance`  (file src/pages/college-admin/attendance.js)

##### `src/pages/college-admin/attendance.js` (branch: both (identical); 2 strings)
```text
L25 attr:message(Alert): Admin not assigned to a college
L26 attr:description(Alert): You must be assigned to a college to view attendance. Contact your administrator.
```

Page closure (13 files; strings in section 4 or above): `src/components/admin/AdminGroupShell.jsx`, `src/components/Common/PageShell.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/components/admin/AdminWorkflowGuide.jsx`, `src/common/adminNavGroups.js`, `src/common/navTabMatching.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/audit`  (file src/pages/college-admin/audit.js)

##### `src/pages/college-admin/audit.js` (branch: both (differs); 4 strings)
```text
L23 attr:message(Alert): Admin not assigned to a college
L24 attr:description(Alert): You must be assigned to a college to view the audit trail. Contact your administrator.
L34 attr:title(PageShell): Activity Log
L37 text(PageShell): View project activity
```

Page closure (7 files; strings in section 4 or above): `src/components/admin/activity/ActivityCenter.jsx`, `src/components/Common/PageShell.jsx`, `src/utils/csvExport.js`, `src/components/admin/activity/activityText.js`, `src/components/Common/Skeletons.jsx`, `src/components/admin/projects/adminProjectUtils.js`, `src/components/Course/Common/CourseSectionHeader.jsx`

#### Page `/college-admin/batch-promotion`  (file src/pages/college-admin/batch-promotion.js)

##### `src/pages/college-admin/batch-promotion.js` (branch: both (identical); 2 strings)
```text
L23 attr:message(Alert): Admin not assigned to a college
L24 attr:description(Alert): You must be assigned to a college to view and manage batch promotion. Contact your administrator.
```

Page closure (13 files; strings in section 4 or above): `src/components/admin/AdminGroupShell.jsx`, `src/components/Common/PageShell.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/components/admin/AdminWorkflowGuide.jsx`, `src/common/adminNavGroups.js`, `src/common/navTabMatching.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/batches`  (file src/pages/college-admin/batches.js)

##### `src/pages/college-admin/batches.js` (branch: both (identical); 2 strings)
```text
L23 attr:message(Alert): Admin not assigned to a college
L24 attr:description(Alert): You must be assigned to a college to view and manage batches. Contact your administrator.
```

Page closure (13 files; strings in section 4 or above): `src/components/admin/AdminGroupShell.jsx`, `src/components/Common/PageShell.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/components/admin/AdminWorkflowGuide.jsx`, `src/common/adminNavGroups.js`, `src/common/navTabMatching.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/calendar`  (file src/pages/college-admin/calendar.js)

##### `src/pages/college-admin/calendar.js` (branch: both (differs); 4 strings)
```text
[DEV] L35 attr:message(Alert): Admin not assigned to a college
[DEV] L36 attr:description(Alert): You must be assigned to a college to view interviews. Contact your administrator.
L51 attr:emptyMessage(InterviewCalendarContent): Assign this admin to an organization or college to view interviews.
L52 attr:scopeLabel(InterviewCalendarContent): All companies
```

Page closure (19 files; strings in section 4 or above): `src/components/InterviewCalendar/InterviewCalendarContent.js`, `src/components/admin/AdminGroupShell.jsx`, `src/utils/csvExport.js`, `src/utils/constants.js`, `src/utils/icsExport.js`, `src/utils/interviewConflicts.js`, `src/utils/placementDateTime.js`, `src/components/Common/PageShell.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/components/admin/AdminWorkflowGuide.jsx`, `src/common/adminNavGroups.js`, `src/common/navTabMatching.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/classes`  (file src/pages/college-admin/classes.js)

##### `src/pages/college-admin/classes.js` (branch: both (identical); 2 strings)
```text
L23 attr:message(Alert): Admin not assigned to a college
L24 attr:description(Alert): You must be assigned to a college to view and manage classes. Contact your administrator.
```

Page closure (13 files; strings in section 4 or above): `src/components/admin/AdminGroupShell.jsx`, `src/components/Common/PageShell.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/components/admin/AdminWorkflowGuide.jsx`, `src/common/adminNavGroups.js`, `src/common/navTabMatching.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/companies/index`  (file src/pages/college-admin/companies/index.js)

##### `src/pages/college-admin/companies/index.js` (branch: both (differs); 2 strings)
```text
L24 attr:message(Alert): Admin not assigned to a college
L25 attr:description(Alert): You must be assigned to a college to manage companies. Contact your administrator.
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L38 text(div): Companies
[PROD-ONLY] L39 text(div): Manage recruiting companies once, reuse them across every job posting.
```

Page closure (13 files; strings in section 4 or above): `src/components/admin/AdminGroupShell.jsx`, `src/components/Common/PageShell.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/components/admin/AdminWorkflowGuide.jsx`, `src/common/adminNavGroups.js`, `src/common/navTabMatching.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/course-progress`  (file src/pages/college-admin/course-progress.js)

##### `src/pages/college-admin/course-progress.js` (branch: both (identical); 2 strings)
```text
L26 attr:message(Alert): Admin not assigned to a college
L27 attr:description(Alert): You must be assigned to a college to view course progress. Contact your administrator.
```

Page closure (13 files; strings in section 4 or above): `src/components/admin/AdminGroupShell.jsx`, `src/components/Common/PageShell.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/components/admin/AdminWorkflowGuide.jsx`, `src/common/adminNavGroups.js`, `src/common/navTabMatching.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/courses`  (file src/pages/college-admin/courses.js)

##### `src/pages/college-admin/courses.js` (branch: both (identical); 2 strings)
```text
L23 attr:message(Alert): Admin not assigned to a college
L24 attr:description(Alert): You must be assigned to a college to view and manage courses. Contact your administrator.
```

Page closure (13 files; strings in section 4 or above): `src/components/admin/AdminGroupShell.jsx`, `src/components/Common/PageShell.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/components/admin/AdminWorkflowGuide.jsx`, `src/common/adminNavGroups.js`, `src/common/navTabMatching.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/courses/[id]`  (file src/pages/college-admin/courses/[id].js)

##### `src/pages/college-admin/courses/[id].js` (branch: both (differs); 5 strings)
```text
L32 prop:label: Home
L38 prop:label: Syllabus
L150 attr:title(Result): Course not found
L151 attr:subTitle(Result): This course doesn't exist, was removed, or isn't available to your college.
[DEV] L164 attr:label(PageSkeleton): Loading course details
```

Page closure (58 files; strings in section 4 or above): `src/components/admin/courses/AdminCourseHome.jsx`, `src/components/admin/courses/AdminCourseSyllabus.jsx`, `src/components/Common/Skeletons.jsx`, `src/components/Course/Home/InThisCourseSection.jsx`, `src/components/admin/courses/CourseTeachersPanel.jsx`, `src/pages/Dashboard/course/Home/HomeEditDrawer.js`, `src/pages/Dashboard/course/syllabus/syllabusDetail.js`, `src/components/Global/Offcanvas/Syallabus/AddLessonDrawer.jsx`, `src/components/Global/RightDrawer/DrawerWidget.js`, `src/pages/Dashboard/course/syllabus/resource.js`, `src/pages/Dashboard/course/syllabus/video.js`, `src/pages/Dashboard/course/syllabus/liveclass.js`, `src/pages/Dashboard/course/syllabus/youtube.js`, `src/components/Global/Offcanvas/Syallabus/AddNewLessonContentDrawer.js`, `src/components/Global/SortableLessonContentList/SortableLessonContentList.jsx`, `src/components/Course/Syllabus/LessonProgressBar.jsx`, `src/components/Course/Syllabus/ContentCompletionCheck.jsx`, `src/utils/courseClassAssignment.js`, `src/utils/courseUtils/contentOrder.js`, `src/utils/courseUtils/quizContent.js`, `src/utils/courseUtils/contentCompletion.js`, `src/components/Course/Syllabus/LessonActivityCards.jsx`, `src/utils/courseUtils/contentAvailability.js`, `src/components/Global/Button/button.jsx`, `src/utils/courseUtils/syllabusUtils.js`, `src/components/Course/Syllabus/ContentTitle.jsx`, `src/components/Course/Syllabus/MarkCompleteButton.jsx`, `src/components/Global/Offcanvas/Syallabus/ResourceComposer.js`, `src/components/Global/video/video.jsx`, `src/components/Course/Syllabus/VideoDrawer.jsx`, `src/components/Course/Syllabus/ContentProgressBadge.jsx`, `src/utils/clientSettings.js`, `src/config/appConfig.js`, `src/utils/authUtils.js`, `src/components/Course/Syllabus/YoutubeDrawer.jsx`, `src/components/Global/Offcanvas/Syallabus/videoform.js`, `src/components/Global/Offcanvas/Syallabus/youtube.js`, `src/components/Global/Offcanvas/Syallabus/liveclass.js`, `src/components/Quiz/QuizBuilderModal.jsx`, `src/components/Global/Offcanvas/Assignment/newAssignment.js`, `src/utils/dateUtils.js`, `src/components/Assignments/ViewAssignmentModal.jsx`, `src/utils/resourceUploadToR2.js`, `src/utils/clientErrorReporting.js`, `src/components/Global/Editor/editor.js`, `src/utils/uploadToR2.js`, `src/utils/helper.js`, `src/components/Common/PanelStates.jsx`, `src/utils/tenantUtils.js`, `src/utils/navigationContext.js`, `src/utils/youtubeLink.js`, `src/components/Global/Offcanvas/Syallabus/preview.js`, `src/components/Global/Button/uploadButton.jsx`, `src/utils/formErrors.js`, `src/components/Global/Upload/UploadFromLinkButton.jsx`, `src/utils/assignmentSchema.js`, `src/components/Assignments/SubmitAssignmentModal.jsx`, `src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx`

#### Page `/college-admin/dashboard`  (file src/pages/college-admin/dashboard.js)

##### `src/pages/college-admin/dashboard.js` (branch: both (identical); 3 strings)
```text
L52 attr:title(PageShell): Dashboard
L56 attr:message(Alert): Admin not assigned to a college
L57 attr:description(Alert): Some features are limited. Contact your administrator to assign this account to a college.
```

Page closure (11 files; strings in section 4 or above): `src/components/admin/dashboard/index.js`, `src/components/Common/PageShell.jsx`, `src/components/admin/dashboard/AdminDashboardView.js`, `src/components/admin/dashboard/QuickActionsGrid.js`, `src/components/admin/dashboard/SetupGuide.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/components/admin/dashboard/config.js`, `src/components/admin/dashboard/AtAGlance.js`, `src/components/admin/dashboard/AttentionBoard.js`, `src/components/Common/Skeletons.jsx`, `src/components/admin/projects/adminProjectUtils.js`

#### Page `/college-admin/departments`  (file src/pages/college-admin/departments.js)

##### `src/pages/college-admin/departments.js` (branch: both (identical); 2 strings)
```text
L24 attr:message(Alert): Admin not assigned to a college
L25 attr:description(Alert): You must be assigned to a college to view and manage departments. Contact your administrator.
```

Page closure (13 files; strings in section 4 or above): `src/components/admin/AdminGroupShell.jsx`, `src/components/Common/PageShell.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/components/admin/AdminWorkflowGuide.jsx`, `src/common/adminNavGroups.js`, `src/common/navTabMatching.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/electives`  (file src/pages/college-admin/electives.js)

##### `src/pages/college-admin/electives.js` (branch: lms-dev-2026 only; 4 strings)
```text
L25 attr:message(Alert): Admin not assigned to a college
L26 attr:description(Alert): You must be assigned to a college to manage electives. Contact your administrator.
L34 attr:title(Result): Electives is turned off for this college
L35 attr:subTitle(Result): Elective slots and student allocation are unavailable. ${moduleOffRecoveryHint(loginUser)}
```

Page closure (20 files; strings in section 4 or above): `src/components/admin/AdminGroupShell.jsx`, `src/components/admin/electives/ElectivesConsole.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/components/admin/ModuleGroupGuard.jsx`, `src/components/Common/PageShell.jsx`, `src/components/admin/AdminWorkflowGuide.jsx`, `src/common/adminNavGroups.js`, `src/common/navTabMatching.js`, `src/components/admin/AdminTableToolbar.js`, `src/components/admin/electives/ElectiveSlotPanel.jsx`, `src/utils/authUtils.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/common/navGroupDefinitions.js`, `src/utils/csvExport.js`, `src/components/admin/electives/AllocateModal.jsx`, `src/components/admin/electives/OfferingRosterDrawer.jsx`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/components/admin/studentGroups/groupUi.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/faculty-assignment`  (file src/pages/college-admin/faculty-assignment.js)

##### `src/pages/college-admin/faculty-assignment.js` (branch: both (identical); 2 strings)
```text
L24 attr:message(Alert): Admin not assigned to a college
L25 attr:description(Alert): You must be assigned to a college to view and manage faculty assignment. Contact your administrator.
```

Page closure (13 files; strings in section 4 or above): `src/components/admin/AdminGroupShell.jsx`, `src/components/Common/PageShell.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/components/admin/AdminWorkflowGuide.jsx`, `src/common/adminNavGroups.js`, `src/common/navTabMatching.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/hiring-dashboard`  (file src/pages/college-admin/hiring-dashboard.js)

##### `src/pages/college-admin/hiring-dashboard.js` (branch: both (identical); 2 strings)
```text
L28 attr:message(Alert): Admin not assigned to a college
L29 attr:description(Alert): You must be assigned to a college to view hiring metrics. Contact your administrator.
```

Page closure (13 files; strings in section 4 or above): `src/components/admin/AdminGroupShell.jsx`, `src/components/Common/PageShell.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/components/admin/AdminWorkflowGuide.jsx`, `src/common/adminNavGroups.js`, `src/common/navTabMatching.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/index`  (file src/pages/college-admin/index.js)

##### `src/pages/college-admin/index.js` (branch: both (identical); 0 strings)
(no user-facing strings)

Page closure (0 files; strings in section 4 or above): 

#### Page `/college-admin/jobs/[jobId]/applications`  (file src/pages/college-admin/jobs/[jobId]/applications.js)

##### `src/pages/college-admin/jobs/[jobId]/applications.js` (branch: both (identical); 2 strings)
```text
L26 attr:message(Alert): Admin not assigned to a college
L27 attr:description(Alert): You must be assigned to a college to view and manage job applications. Contact your administrator.
```

Page closure (9 files; strings in section 4 or above): `src/components/ErrorBoundary/JobsErrorBoundary.js`, `src/components/admin/placements/DriveSubNav.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/utils/clientErrorReporting.js`, `src/utils/navigationContext.js`, `src/utils/useCollegeFeatureFlags.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/jobs/[jobId]/index`  (file src/pages/college-admin/jobs/[jobId]/index.js)

##### `src/pages/college-admin/jobs/[jobId]/index.js` (branch: both (differs); 27 strings)
```text
L18 prop:label: No action in a week
L19 prop:label: Marked Interview, nothing scheduled
L20 prop:label: Offered, no offer letter attached
L59 call:setError: Could not load this drive.
L65 call:setMetricsError: Could not load pipeline metrics.
L89 str: Closing soon
L89 str: Low conversion so far
L106 attr:message(Alert): Admin not assigned to a college
L130 attr:title(Card): Pipeline
L156 attr:message(Alert): Needs attention (${thisDriveAttention.length})
[DEV] L199 attr:label(Fact): Status
L201 text(JobsErrorBoundary): Draft
L202 text(JobsErrorBoundary): Closed
[DEV] L203 text(JobsErrorBoundary): Open · Expired
[DEV] L204 text(JobsErrorBoundary): Open
[DEV] L206 attr:label(Fact): Job type
L211 text(JobsErrorBoundary): Edit drive
L214 text(JobsErrorBoundary): View applications
L222 str: Show more
L229 attr:title(Card): Pipeline
L234 attr:message(Alert): Could not load pipeline metrics
L245 prop:label: Applied
L246 prop:label: Shortlisted
L247 prop:label: Assessment
L248 prop:label: Interview
L249 prop:label: Offered
L250 prop:label: Hired
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L196 child(JobsErrorBoundary): Active
```

Page closure (12 files; strings in section 4 or above): `src/utils/placementDateTime.js`, `src/components/Common/Facts.jsx`, `src/components/ErrorBoundary/JobsErrorBoundary.js`, `src/components/admin/placements/DriveSubNav.jsx`, `src/components/Placements/PlacementsCompanyAvatar.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/utils/clientErrorReporting.js`, `src/utils/navigationContext.js`, `src/utils/useCollegeFeatureFlags.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/jobs/[jobId]/interviews`  (file src/pages/college-admin/jobs/[jobId]/interviews.js)

##### `src/pages/college-admin/jobs/[jobId]/interviews.js` (branch: both (identical); 3 strings)
```text
L29 attr:message(Alert): Admin not assigned to a college
L44 attr:noResultsMessage(InterviewCalendarContent): No interviews scheduled for this drive yet.
L45 attr:scopeLabel(InterviewCalendarContent): This drive only
```

Page closure (15 files; strings in section 4 or above): `src/components/ErrorBoundary/JobsErrorBoundary.js`, `src/components/admin/placements/DriveSubNav.jsx`, `src/components/InterviewCalendar/InterviewCalendarContent.js`, `src/components/admin/ModuleGroupGuard.jsx`, `src/utils/clientErrorReporting.js`, `src/utils/navigationContext.js`, `src/utils/csvExport.js`, `src/utils/constants.js`, `src/utils/icsExport.js`, `src/utils/interviewConflicts.js`, `src/utils/placementDateTime.js`, `src/utils/useCollegeFeatureFlags.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/jobs/[jobId]/settings`  (file src/pages/college-admin/jobs/[jobId]/settings.js)

##### `src/pages/college-admin/jobs/[jobId]/settings.js` (branch: both (differs); 31 strings)
```text
[DEV] L56 call:setLoadError: Drive details could not be loaded.
[DEV] L61 call:setLoadError: Drive details could not be loaded.
[DEV] L69 call:setMetricsError: Applicant impact could not be verified.
[DEV] L73 call:setMetricsError: Applicant impact could not be verified.
L89 call:message.success: Drive ${!job.isActive ? "opened" : "closed"}
L92 call:message.error: Failed to update drive status
L95 call:message.error: Failed to update drive status
L109 call:message.success: Drive deleted
L112 call:message.error: Failed to delete drive
L115 call:message.error: Failed to delete drive
L125 attr:message(Alert): Admin not assigned to a college
[DEV] L144 attr:label(DetailSkeleton): Loading drive settings
[DEV] L149 attr:label(RefreshStatus): Refreshing drive settings…
[DEV] L151 attr:message(Alert): Couldn't refresh drive settings
[DEV] L153 text(Alert): Retry
[DEV] L165 attr:message(Alert): Drive impact is unavailable
[DEV] L166 text(Alert): Retry impact
L170 attr:title(Card): Drive status
L172 attr:title(Popconfirm): Are you sure you want to ${job.isActive ? "close" : "open"} this drive?
L174 attr:okText(Popconfirm): Yes
L175 attr:cancelText(Popconfirm): No
L178 child(JobsErrorBoundary): Close drive
L178 child(JobsErrorBoundary): Open drive
L195 text(JobsErrorBoundary): learner(s) have applied to this drive. Deleting it will not notify them, and their applications remain.
L199 attr:title(Popconfirm): Delete "${job.jobTitle || "this drive"}"?
L199 attr:title(Popconfirm): this drive
L202 attr:description(Popconfirm): ${applicantCount} learner(s) have applied to this drive. Deleting it removes the listing but their applications remain — they will not be notified. This action cannot be undone.
L203 attr:description(Popconfirm): This will permanently remove the drive. This action cannot be undone.
L206 attr:okText(Popconfirm): Delete
L208 attr:cancelText(Popconfirm): Cancel
L210 text(JobsErrorBoundary): Delete drive
```

Page closure (11 files; strings in section 4 or above): `src/components/ErrorBoundary/JobsErrorBoundary.js`, `src/components/admin/placements/DriveSubNav.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/components/Common/PanelStates.jsx`, `src/components/Common/Skeletons.jsx`, `src/utils/clientErrorReporting.js`, `src/utils/navigationContext.js`, `src/utils/useCollegeFeatureFlags.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/jobs/[jobId]/shortlisted`  (file src/pages/college-admin/jobs/[jobId]/shortlisted.js)

##### `src/pages/college-admin/jobs/[jobId]/shortlisted.js` (branch: both (identical); 2 strings)
```text
L26 attr:message(Alert): Admin not assigned to a college
L27 attr:description(Alert): You must be assigned to a college to view and manage the shortlisted pipeline. Contact your administrator.
```

Page closure (9 files; strings in section 4 or above): `src/components/ErrorBoundary/JobsErrorBoundary.js`, `src/components/admin/placements/DriveSubNav.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/utils/clientErrorReporting.js`, `src/utils/navigationContext.js`, `src/utils/useCollegeFeatureFlags.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/jobs/all`  (file src/pages/college-admin/jobs/all.js)

##### `src/pages/college-admin/jobs/all.js` (branch: both (identical); 2 strings)
```text
L29 attr:message(Alert): Admin not assigned to a college
L30 attr:description(Alert): You must be assigned to a college to view and manage jobs. Contact your administrator.
```

Page closure (15 files; strings in section 4 or above): `src/components/ErrorBoundary/JobsErrorBoundary.js`, `src/components/admin/AdminGroupShell.jsx`, `src/utils/clientErrorReporting.js`, `src/components/Common/PageShell.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/components/admin/AdminWorkflowGuide.jsx`, `src/common/adminNavGroups.js`, `src/common/navTabMatching.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/jobs/index`  (file src/pages/college-admin/jobs/index.js)

##### `src/pages/college-admin/jobs/index.js` (branch: both (identical); 2 strings)
```text
L24 attr:message(Alert): Admin not assigned to a college
L25 attr:description(Alert): You must be assigned to a college to view and manage jobs. Contact your administrator.
```

Page closure (15 files; strings in section 4 or above): `src/components/ErrorBoundary/JobsErrorBoundary.js`, `src/components/admin/AdminGroupShell.jsx`, `src/utils/clientErrorReporting.js`, `src/components/Common/PageShell.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/components/admin/AdminWorkflowGuide.jsx`, `src/common/adminNavGroups.js`, `src/common/navTabMatching.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/lecture-halls`  (file src/pages/college-admin/lecture-halls.js)

##### `src/pages/college-admin/lecture-halls.js` (branch: both (identical); 2 strings)
```text
L23 attr:message(Alert): Admin not assigned to a college
L24 attr:description(Alert): You must be assigned to a college to view and manage lecture halls. Contact your administrator.
```

Page closure (13 files; strings in section 4 or above): `src/components/admin/AdminGroupShell.jsx`, `src/components/Common/PageShell.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/components/admin/AdminWorkflowGuide.jsx`, `src/common/adminNavGroups.js`, `src/common/navTabMatching.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/lesson-content`  (file src/pages/college-admin/lesson-content.js)

##### `src/pages/college-admin/lesson-content.js` (branch: both (differs); 2 strings)
```text
L26 attr:message(Alert): Admin not assigned to a college
L27 attr:description(Alert): You must be assigned to a college to view and manage lesson content. Contact your administrator.
```

Page closure (13 files; strings in section 4 or above): `src/components/admin/AdminGroupShell.jsx`, `src/components/Common/PageShell.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/components/admin/AdminWorkflowGuide.jsx`, `src/common/adminNavGroups.js`, `src/common/navTabMatching.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/lessons`  (file src/pages/college-admin/lessons.js)

##### `src/pages/college-admin/lessons.js` (branch: both (identical); 2 strings)
```text
L23 attr:message(Alert): Admin not assigned to a college
L24 attr:description(Alert): You must be assigned to a college to view and manage lessons. Contact your administrator.
```

Page closure (13 files; strings in section 4 or above): `src/components/admin/AdminGroupShell.jsx`, `src/components/Common/PageShell.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/components/admin/AdminWorkflowGuide.jsx`, `src/common/adminNavGroups.js`, `src/common/navTabMatching.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/people`  (file src/pages/college-admin/people.js)

##### `src/pages/college-admin/people.js` (branch: both (identical); 2 strings)
```text
L16 attr:message(Alert): Admin not assigned to a college
L17 attr:description(Alert): You must be assigned to a college to browse the directory. Contact your administrator.
```

Page closure (13 files; strings in section 4 or above): `src/components/admin/AdminGroupShell.jsx`, `src/components/Common/PageShell.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/components/admin/AdminWorkflowGuide.jsx`, `src/common/adminNavGroups.js`, `src/common/navTabMatching.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/profile`  (file src/pages/college-admin/profile.js)

##### `src/pages/college-admin/profile.js` (branch: both (differs); 14 strings)
```text
L96 attr:title(ListingPageHeader): Profile
L96 attr:ariaLabel(ListingPageHeader): Profile overview
L111 attr:title(ListingPageHeader): Profile
L111 attr:ariaLabel(ListingPageHeader): Profile overview
L126 attr:title(ListingPageHeader): Profile
L126 attr:ariaLabel(ListingPageHeader): Profile overview
L128 text(div): Failed to load profile.
L129 text(div): Retry
L141 attr:title(ListingPageHeader): Profile
L141 attr:ariaLabel(ListingPageHeader): Profile overview
[DEV] L142 attr:label(RefreshStatus): Refreshing profile…
[DEV] L147 attr:message(Alert): Couldn't refresh profile
[DEV] L148 attr:description(Alert): Showing the last profile we loaded.
L149 text(Alert): Retry
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L56 call:message.error: Failed to load profile. Please try again.
```

Page closure (48 files; strings in section 4 or above): `src/components/profile/about.js`, `src/components/profile/ProfileSkeleton.js`, `src/utils/roleUtils.js`, `src/components/Global/ListingPageHeader/ListingPageHeader.jsx`, `src/components/Common/Skeletons.jsx`, `src/components/profile/about/contacts.js`, `src/components/profile/about/experiences.js`, `src/components/profile/about/skills.js`, `src/components/profile/userInfo.js`, `src/components/profile/about/qualifications.js`, `src/components/profile/about/projects.js`, `src/components/profile/about/certifications.js`, `src/components/profile/about/achievements.js`, `src/components/profile/about/languages.js`, `src/components/profile/about/identity.js`, `src/components/profile/about/extracurricular.js`, `src/components/profile/about/socialProfiles.js`, `src/components/profile/about/address.js`, `src/components/profile/about/personalDetails.js`, `src/components/profile/about/hobbies.js`, `src/components/profile/about/publications.js`, `src/components/profile/about/awards.js`, `src/components/profile/about/metadata.js`, `src/components/Global/CardHeader/cardHeader.js`, `src/components/Global/Upload/UploadFromLinkButton.jsx`, `src/components/profile/ProfileCompleteness.js`, `src/utils/uploadToR2.js`, `src/utils/errorHandlers.js`, `src/utils/resumeUploadUtils.js`, `src/config/roles.js`, `src/components/Global/Button/button.jsx`, `src/components/Global/RichTextEditor/RichTextEditor.jsx`, `src/components/Global/RichTextEditor/RichTextDisplay.jsx`, `src/components/Global/SkillsAutocomplete.jsx`, `src/components/Global/Button/PencilUploadButton.jsx`, `src/utils/profileUtils.js`, `src/components/Common/ResilientAvatar.jsx`, `src/components/profile/VideoIntroModal.jsx`, `src/components/profile/PrivateDocLink.jsx`, `src/components/profile/about/MarksheetUpload.jsx`, `src/utils/urlValidation.js`, `src/hooks/useChoices.js`, `src/utils/clientErrorReporting.js`, `src/config/appConfig.js`, `src/utils/driveDescription.js`, `src/components/Global/ModalContainer/ModalContainer.jsx`, `src/config/choices.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/programs`  (file src/pages/college-admin/programs.js)

##### `src/pages/college-admin/programs.js` (branch: both (identical); 2 strings)
```text
L23 attr:message(Alert): Admin not assigned to a college
L24 attr:description(Alert): You must be assigned to a college to view and manage programs. Contact your administrator.
```

Page closure (13 files; strings in section 4 or above): `src/components/admin/AdminGroupShell.jsx`, `src/components/Common/PageShell.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/components/admin/AdminWorkflowGuide.jsx`, `src/common/adminNavGroups.js`, `src/common/navTabMatching.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/projects/at-risk/index`  (file src/pages/college-admin/projects/at-risk/index.js)

##### `src/pages/college-admin/projects/at-risk/index.js` (branch: both (differs); 28 strings)
```text
L38 prop:label: Stalled
L39 prop:label: Active blocker
L40 prop:label: Pending review
L112 call:setError: Failed to load project workspaces.
L118 call:setError: Failed to load project workspaces.
L187 text(Space): Open
L191 attr:title(Button): This row has no workspace id
L191 text(Space): Open
L196 text(Space): Reassign mentor
L205 text(Space): Assign mentor
L210 text(Space): Review submission
L220 prop:title: Workspace
L226 prop:title: Mentor
L231 prop:title: Status
[DEV] L236 prop:title: Severity
L246 prop:title: Risk reasons
L259 prop:title: Inactive
L269 prop:title: Blocker
L274 prop:title: Actions
L285 attr:message(Alert): Select a college to continue
[DEV] L286 attr:description(Alert): Choose a college in the header above to see its at-risk projects.
L298 text(div): At-risk projects
[DEV] L300 child(div): ${totalCandidates} workspace${totalCandidates === 1 ? "" : "s"} need attention (stalled, blocked, or waiting for review). Reason counts cover the whole college.
L300 child(div): Workspaces with activity, blocker, or pending-review signals.
L310 attr:message(Alert): Report could not be loaded
[DEV] L352 attr:title(Card): At-risk workspaces (CSV covers the displayed page)
[DEV] L415 attr:description(Empty): No workspace on this page matches the search; clear it or browse another page.
L415 attr:description(Empty): No workspace matches these server-side attention signals.
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L231 prop:title: Signals detected
[PROD-ONLY] L281 attr:description(Alert): At-risk projects is college-scoped. Pick an Organization + College in the header above.
[PROD-ONLY] L295 child(div): ${totalCandidates} workspace${totalCandidates === 1 ? "" : "s"} match at least one server-side attention signal; detailed reason counts below describe the displayed page only.
[PROD-ONLY] L347 attr:title(Card): At-risk workspaces (CSV and signal filters apply to displayed page)
[PROD-ONLY] L410 attr:description(Empty): No workspaces on this page match the selected signal; clear the signal filter or browse another page.
```

Page closure (15 files; strings in section 4 or above): `src/utils/csvExport.js`, `src/components/admin/AdminGroupShell.jsx`, `src/components/admin/projects/adminProjectUtils.js`, `src/components/Common/PageShell.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/components/admin/AdminWorkflowGuide.jsx`, `src/common/adminNavGroups.js`, `src/common/navTabMatching.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/projects/audit/index`  (file src/pages/college-admin/projects/audit/index.js)

##### `src/pages/college-admin/projects/audit/index.js` (branch: both (differs); 35 strings)
```text
L102 prop:label: Today
L103 prop:label: 7 days
L104 prop:label: 30 days
L105 prop:label: All time
L263 call:setError: Failed to load audit log.
L315 prop:title: Action
L320 str: dddd, DD MMM YYYY
L325 attr:title(Tooltip): Irreversible or access-changing action
L335 prop:title: Entity
L365 attr:aria-label(Text): Filter audit log to ${displayId}
L388 text(div): Open
L398 prop:title: Actor
L405 child(div): User #${textOrDash(record?.actorUserId)}
L412 prop:title: When
L437 text(Text): No additional details
L444 text(Text): No additional details
L462 attr:message(Alert): Select a college to continue
[DEV] L463 attr:description(Alert): Choose a college in the header above to see its project audit.
L475 text(div): Project audit
L476 text(div): Who changed what, and when — check daily for anything unexpected.
L479 text(div): Refresh
L482 text(div): View activity log
L488 attr:message(Alert): Audit log could not be loaded
L498 text(div): Filtered to:
L509 attr:title(Statistic): Actions today (first ${WIDE_RANGE_SIZE})
L509 attr:title(Statistic): Actions today
L509 attr:title(Statistic): Actions shown
[DEV] L522 attr:title(Statistic): People who made changes
[DEV] L522 attr:title(Statistic): People who made changes (this page)
L532 attr:title(Statistic): Destructive actions
L532 attr:title(Statistic): Destructive actions (this page)
L543 attr:title(Card): Change log
L607 text(div): Showing the most recent
L608 text(div): of
L608 text(div): actions in this range. Switch to a narrower filter or "All time" (paginated) to see the rest.
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L462 attr:description(Alert): Project audit is college-scoped. Pick an Organization + College in the header above.
[PROD-ONLY] L521 attr:title(Statistic): Distinct admins/mentors
[PROD-ONLY] L521 attr:title(Statistic): Distinct admins/mentors (this page)
```

Page closure (16 files; strings in section 4 or above): `src/utils/csvExport.js`, `src/components/admin/AdminGroupShell.jsx`, `src/components/admin/projects/adminProjectUtils.js`, `src/components/admin/projects/renderStructuredValue.jsx`, `src/components/Common/PageShell.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/components/admin/AdminWorkflowGuide.jsx`, `src/common/adminNavGroups.js`, `src/common/navTabMatching.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/projects/index`  (file src/pages/college-admin/projects/index.js)

##### `src/pages/college-admin/projects/index.js` (branch: both (differs); 1 strings)
```text
[DEV] L27 attr:label(PageSkeleton): Opening projects
```

Page closure (3 files; strings in section 4 or above): `src/components/Common/Skeletons.jsx`, `src/common/adminNavGroups.js`, `src/common/navGroupDefinitions.js`

#### Page `/college-admin/projects/readiness/index`  (file src/pages/college-admin/projects/readiness/index.js)

##### `src/pages/college-admin/projects/readiness/index.js` (branch: both (differs); 90 strings)
```text
L133 call:setProjectsError: Failed to load project workspaces.
L202 call:setError: Failed to load readiness.
L224 call:setReleasesError: Failed to load releases.
L275 call:message.success: Readiness updated
L294 call:showProjectErrorMessage: Failed to update readiness
L331 text(Text): None
L333 text(Tag): Force unlocked
L337 text(Tag): Force blocked
L345 prop:title: Workspace
L350 text(Space): Archived
L355 prop:title: Override
L360 prop:title: Note
L366 prop:title: By
L371 prop:title: At
L387 text(Button): Manage
L399 attr:message(Alert): Select a college to continue
[DEV] L400 attr:description(Alert): Choose a college in the header above to see its submission readiness.
L412 text(div): Submission readiness
[DEV] L413 text(div): See whether each team is ready to submit, and override the gate when you need to.
L422 attr:title(Card): Active overrides
L470 attr:message(Alert): Active overrides could not be loaded
L485 attr:description(Empty): No workspace currently has a manual override — every gate is running on its own completion state.
L491 attr:title(Card): Select workspace
L496 attr:message(Alert): Couldn't load workspaces
L501 attr:aria-label(Input.Search): Search workspaces by title or ID
L506 attr:placeholder(Select): Select a project workspace
L515 text(div): Previous workspaces
L515 child(div): ${workspacePage * 25 + 1}–${Math.min((workspacePage + 1) * 25, workspaceTotal)} of ${workspaceTotal}
L515 child(div): 0 workspaces
L515 text(div): Next workspaces
L518 attr:message(Alert): Readiness could not be loaded
L523 attr:title(Card): Current readiness
L547 text(div): Task completion
L548 str: ${completedTasks}/${totalTasks} tasks
L549 text(div): Sprint completion
L550 str: ${completedSprints}/${totalSprints} sprints
L553 child(div): Task and sprint completion are separate measures; the manual override is independent of both.
L554 child(div): Task and sprint completion are separate measures; the readiness verdict above is decided server-side.
L559 attr:label(Descriptions.Item): Tasks completed
L560 child(div): ${completedTasks}/${totalTasks}
L560 child(div): No tasks defined
L562 attr:label(Descriptions.Item): Sprints completed
L563 child(div): ${completedSprints}/${totalSprints}
L563 child(div): No sprints defined
L567 attr:label(Descriptions.Item): Releases shipped
L569 child(div): ${readiness.shippedReleases ?? 0}/${readiness.totalReleases}
L570 child(div): No releases defined
L572 attr:label(Descriptions.Item): Submission status
L573 child(div): Not submitted
L575 attr:label(Descriptions.Item): State
L581 attr:label(Descriptions.Item): Reason
L583 attr:label(Descriptions.Item): Override active
L586 attr:label(Descriptions.Item): Override note
L587 attr:label(Descriptions.Item): Overridden by
L588 attr:label(Descriptions.Item): Overridden at
L605 attr:title(Card): Releases
L609 attr:message(Alert): Couldn't load releases
L611 attr:description(Empty): No releases defined on this project.
L619 prop:title(Table): Release
L621 prop:title(Table): Status
L626 child(Table): Shipped
L626 child(Table): In progress
L626 child(Table): Planned
L631 prop:title(Table): Sprints
L636 prop:title(Table): Points
L641 prop:title(Table): Target date
L651 attr:title(Card): Manual override
L657 attr:message(Alert): Force Unlock/Block will have no effect here
L670 attr:name(Form.Item): override
L670 attr:label(Form.Item): Override state
L670 prop:message(Form.Item): Choose an override state
L686 text(div): Force unlock (ready)
L687 text(div): Force block (not ready)
L688 text(div): Clear override
L702 attr:name(Form.Item): note
L703 attr:label(Form.Item): Note
L704 prop:message(Form.Item): A note is required — it's shown to mentors and learners
L705 attr:extra(Form.Item): Not saved — clearing an override doesn't keep a note.
L705 attr:extra(Form.Item): Shown to the workspace's mentor and learners as the readiness reason.
L712 attr:placeholder(Input.TextArea): Reason for this override (visible to mentors and learners)
L723 attr:title(Popconfirm): Clear this readiness override?
L723 attr:title(Popconfirm): Apply this readiness override?
L726 attr:description(Popconfirm): This workspace already has a submission, so this override will have no visible effect until that delivery is reopened.
L728 attr:description(Popconfirm): This removes the existing override and returns to the normal tasks/sprints gate. It takes effect right away.
L729 attr:description(Popconfirm): This immediately changes whether the student can submit. It takes effect right away.
L731 attr:okText(Popconfirm): Clear override
L731 attr:okText(Popconfirm): Apply override
L738 text(div): Save override
L749 attr:message(Alert): Select a workspace
L749 attr:description(Alert): Pick a project workspace above, or click Manage on an active override, to view and control its readiness state.
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L400 attr:description(Alert): Submission readiness is college-scoped. Pick an Organization + College in the header above.
[PROD-ONLY] L413 text(div): Control the final project submission gate and unlock state.
```

Page closure (17 files; strings in section 4 or above): `src/utils/csvExport.js`, `src/utils/projectErrorModal.jsx`, `src/components/admin/AdminGroupShell.jsx`, `src/components/admin/projects/adminProjectUtils.js`, `src/utils/apiError.js`, `src/components/Common/PageShell.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/components/admin/AdminWorkflowGuide.jsx`, `src/common/adminNavGroups.js`, `src/common/navTabMatching.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/projects/submissions/index`  (file src/pages/college-admin/projects/submissions/index.js)

##### `src/pages/college-admin/projects/submissions/index.js` (branch: both (differs); 83 strings)
```text
L42 prop:label: Submitted
L43 str: Under Review
L44 str: Changes Requested
L45 prop:label: Draft (revising)
L46 prop:label: Accepted
L47 prop:label: Locked
L75 prop:label: Pending review
[DEV] L76 prop:label: Needs student action
L77 prop:label: Reviewed
L153 prop:tab: notSubmitted
L187 new Error: Could not load the submissions queue.
L204 call:setError: Failed to load submissions.
L298 call:message.error: Could not resolve this submission's file.
L310 return: Not submitted
L311 return: Pending review
L312 return: Changes requested
L351 call:message.success: Submission accepted.
L351 call:message.success: Changes requested.
L351 call:message.success: Submission locked.
L356 call:message.error: Failed to update this submission.
L386 text(Space): Open
L391 child(Space): View review status
L391 child(Space): Review
L395 text(Space): Reassign mentor
L405 prop:title: Workspace
L419 prop:title: Submission type
L424 prop:title: Review status
L432 prop:title: Pending
L445 prop:title: Submitted
L460 prop:title: Revisions
L471 prop:title: Reviewed by
L478 text(Text): Not reviewed
L487 text(div): Admin review
L498 prop:title: Submission
L516 text(Text): No file/link
L521 child(Space): Open ${delivery.fileName}
L521 child(Space): Open file
L525 text(Space): Open link
[DEV] L531 text(Space): more
L539 prop:title: Actions
L548 prop:title: Workspace
L562 prop:title: Status
L567 prop:title: Progress
L575 text(Text): Not started
L578 text(div): Draft saved
L587 prop:title: Inactive
L598 prop:title: Actions
L614 attr:message(Alert): Admin not assigned to a college
L615 attr:description(Alert): You must be assigned to a college before viewing submissions.
L628 text(div): Submissions dashboard
[DEV] L629 text(div): Final project deliverables to review. Search and the quick filters cover the whole queue; the status filter and CSV cover the page you are viewing.
L635 attr:message(Alert): Submissions could not be loaded
L656 attr:title(Statistic): Active workspaces
L664 attr:title(Statistic): Pending review
[DEV] L673 attr:title(Statistic): Needs student action
L712 attr:title(Card): Submissions
L819 prop:label(Tabs): Submitted (${summary.submitted})
L823 text(Tabs): Showing workspace
L823 text(Tabs): · clear to view all
L843 text(Table): Mentor feedback:
L852 attr:description(Empty): No submissions match this search
L852 attr:description(Empty): No submissions yet
L861 prop:label(Tabs): Not submitted (${summary.notSubmitted})
L874 attr:description(Empty): No workspaces match this search
L875 attr:description(Empty): No matching workspaces on this page
L875 attr:description(Empty): No matching workspace has an outstanding submission
L883 text(div): Retry loading submissions
L886 attr:title(Modal): Review — ${normaliseCollegeScopedName(reviewTarget, "Workspace")}
L886 attr:title(Modal): Review
L894 text(div): Current status:
L895 str: Not reviewed
L909 attr:message(Alert): No review action is currently available
L911 attr:description(Alert): This submission is marked Under Review. The current review workflow does not allow decisions in this state; contact the assigned mentor to resolve its status.
L912 attr:description(Alert): This delivery is not awaiting a decision now. Draft or Changes Requested is with the learner; Locked is final. Actions become available after a valid resubmission.
L916 text(div): Feedback for the learner
L921 attr:placeholder(Input.TextArea): Optional — shown to the learner alongside your decision
L926 text(div): Cancel
L932 text(div): Request changes
L940 text(div): Accept submission
L948 attr:title(Popconfirm): Lock this submission?
L949 attr:description(Popconfirm): The learner will no longer be able to edit or resubmit it.
L950 attr:okText(Popconfirm): Lock
L958 text(div): Lock submission
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L74 prop:label: Needs learner action
[PROD-ONLY] L612 text(div): Final project deliverables. Server counts span matching workspaces; review-status filters, signal cards and CSV apply to the displayed page.
[PROD-ONLY] L656 attr:title(Statistic): Needs learner action
```

Page closure (16 files; strings in section 4 or above): `src/utils/csvExport.js`, `src/components/admin/AdminGroupShell.jsx`, `src/hooks/useDebounceHook.js`, `src/components/admin/projects/adminProjectUtils.js`, `src/components/Common/PageShell.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/components/admin/AdminWorkflowGuide.jsx`, `src/common/adminNavGroups.js`, `src/common/navTabMatching.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/projects/templates/[templateId]`  (file src/pages/college-admin/projects/templates/[templateId].js)

##### `src/pages/college-admin/projects/templates/[templateId].js` (branch: both (differs); 22 strings)
```text
L52 attr:description(Empty): No ${label.toLowerCase()} configured
L63 text(Card): No
L63 text(Card): provided.
L106 call:setError: Failed to load template.
L111 call:setError: Failed to load template.
L139 attr:message(Alert): Admin not assigned to a college
L139 attr:description(Alert): You must be assigned to a college to view project templates.
L150 text(div): Project template
L151 text(div): Maintained by 42Students — use this template to start a workspace.
L154 text(div): Back to templates
L165 text(div): Use this template
L174 attr:message(Alert): Template could not be loaded
L179 text(Alert): Retry
[DEV] L187 attr:label(DetailSkeleton): Loading project template
L197 text(div): Version
L208 text(div): Published at:
L212 attr:title(Card): Section counts
L214 text(div): Overview
L215 text(div): Sprints
L216 text(div): Tasks
L217 text(div): Resources
L229 attr:description(Empty): Template not found
```

Page closure (16 files; strings in section 4 or above): `src/components/admin/AdminGroupShell.jsx`, `src/components/Common/Skeletons.jsx`, `src/components/admin/projects/adminProjectUtils.js`, `src/components/admin/projects/renderStructuredValue.jsx`, `src/components/Common/PageShell.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/components/admin/AdminWorkflowGuide.jsx`, `src/common/adminNavGroups.js`, `src/common/navTabMatching.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/projects/templates/index`  (file src/pages/college-admin/projects/templates/index.js)

##### `src/pages/college-admin/projects/templates/index.js` (branch: both (differs); 20 strings)
```text
L79 call:setError: Failed to load project templates.
L84 call:setError: Failed to load project templates.
L99 prop:title: Template
L109 prop:title: Version
L117 prop:title: Sections
L121 text(Space): Overview
L122 text(Space): Sprints
L123 text(Space): Tasks
L124 text(Space): Resources
L129 prop:title: Action
L132 text(Button): View & use
L150 attr:message(Alert): Admin not assigned to a college
L151 attr:description(Alert): You must be assigned to a college before using project templates.
L164 text(div): Project templates
L165 text(div): Pick a template to start a new project workspace.
L172 attr:message(Alert): Templates could not be loaded
L177 text(Alert): Retry
L185 attr:title(Card): Templates
L238 attr:description(Empty): No templates match this search
L239 attr:description(Empty): No templates are available to this college yet. Templates are published by 42Students and then assigned to your college — ask them to assign one.
```

Page closure (15 files; strings in section 4 or above): `src/utils/csvExport.js`, `src/components/admin/AdminGroupShell.jsx`, `src/components/admin/projects/adminProjectUtils.js`, `src/components/Common/PageShell.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/components/admin/AdminWorkflowGuide.jsx`, `src/common/adminNavGroups.js`, `src/common/navTabMatching.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/projects/workspaces/[workspaceId]/audit`  (file src/pages/college-admin/projects/workspaces/[workspaceId]/audit.js)

##### `src/pages/college-admin/projects/workspaces/[workspaceId]/audit.js` (branch: both (differs); 10 strings)
```text
L43 call:setResourceAuditError: Failed to load resource audit history.
L59 attr:title(AdminWorkspaceShell): Project workspace
L62 attr:message(Alert): Admin not assigned to a college
L63 attr:description(Alert): You must be assigned to a college to view project workspaces.
L75 attr:title(AdminWorkspaceShell): Project workspace
[DEV] L76 attr:subtitle(AdminWorkspaceShell): Trace resource changes here, or open the full project audit trail for broader events.
L84 text(AdminWorkspaceShell): View audit trail
[DEV] L94 attr:message(Alert): Workspace summary could not be loaded
[DEV] L95 attr:description(Alert): Audit history is still available below, but the workspace title/status may be stale or unavailable.
[DEV] L97 text(Alert): Retry workspace
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L21 prop:title: Resource
[PROD-ONLY] L23 prop:title: Action
[PROD-ONLY] L29 prop:title: Actor
[PROD-ONLY] L38 prop:title: When
[PROD-ONLY] L131 attr:title(Card): Resource audit
[PROD-ONLY] L131 attr:title(Card): Resource audit (${resourceAudit.length})
[PROD-ONLY] L134 attr:message(Alert): Resource audit could not be loaded
[PROD-ONLY] L143 attr:description(Empty): No resource changes yet
```

Page closure (17 files; strings in section 4 or above): `src/components/admin/AdminWorkspaceShell.jsx`, `src/components/admin/projects/adminProjectUtils.js`, `src/components/admin/projects/WorkspaceResourceAudit.jsx`, `src/components/admin/projects/adminWorkspaceSection.js`, `src/components/Common/PageShell.jsx`, `src/components/admin/entitySectionTabs.js`, `src/components/admin/AdminWorkspaceBreadcrumb.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/common/adminNavGroups.js`, `src/components/admin/workspaceBackTarget.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/projects/workspaces/[workspaceId]/delivery`  (file src/pages/college-admin/projects/workspaces/[workspaceId]/delivery.js)

##### `src/pages/college-admin/projects/workspaces/[workspaceId]/delivery.js` (branch: both (differs); 8 strings)
```text
L31 attr:title(AdminWorkspaceShell): Project workspace
L34 attr:message(Alert): Admin not assigned to a college
L35 attr:description(Alert): You must be assigned to a college to view project workspaces.
L47 attr:title(AdminWorkspaceShell): Project workspace
[DEV] L48 attr:subtitle(AdminWorkspaceShell): Review the final submission package, evidence, revisions and mentor feedback.
L51 attr:message(Alert): Workspace could not be loaded
[DEV] L51 text(Alert): Retry
L58 attr:message(Alert): Workspace not found
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L60 call:setError: Failed to load workspace.
[PROD-ONLY] L65 call:setError: Failed to load workspace.
[PROD-ONLY] L121 attr:title(Card): Delivery
[PROD-ONLY] L124 attr:label(Descriptions.Item): Review status
[PROD-ONLY] L127 attr:label(Descriptions.Item): Submission type
[PROD-ONLY] L128 attr:label(Descriptions.Item): Submitted by
[PROD-ONLY] L129 attr:label(Descriptions.Item): Submitted at
[PROD-ONLY] L130 attr:label(Descriptions.Item): Reviewed by
[PROD-ONLY] L131 attr:label(Descriptions.Item): Reviewed at
[PROD-ONLY] L132 attr:label(Descriptions.Item): Revisions
[PROD-ONLY] L133 attr:label(Descriptions.Item): Submission
[PROD-ONLY] L144 child(div): Download file
[PROD-ONLY] L149 text(div): Open link
[PROD-ONLY] L154 text(div): No file/link
[PROD-ONLY] L158 attr:label(Descriptions.Item): Mentor feedback
[PROD-ONLY] L164 attr:description(Empty): No delivery yet
```

Page closure (17 files; strings in section 4 or above): `src/components/admin/AdminWorkspaceShell.jsx`, `src/components/admin/projects/adminProjectUtils.js`, `src/components/admin/projects/WorkspaceDeliveryOverview.jsx`, `src/components/admin/projects/adminWorkspaceSection.js`, `src/components/Common/PageShell.jsx`, `src/components/admin/entitySectionTabs.js`, `src/components/admin/AdminWorkspaceBreadcrumb.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/common/adminNavGroups.js`, `src/components/admin/workspaceBackTarget.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/projects/workspaces/[workspaceId]/index`  (file src/pages/college-admin/projects/workspaces/[workspaceId]/index.js)

##### `src/pages/college-admin/projects/workspaces/[workspaceId]/index.js` (branch: both (identical); 0 strings)
(no user-facing strings)

Page closure (0 files; strings in section 4 or above): 

#### Page `/college-admin/projects/workspaces/[workspaceId]/meetings`  (file src/pages/college-admin/projects/workspaces/[workspaceId]/meetings.js)

##### `src/pages/college-admin/projects/workspaces/[workspaceId]/meetings.js` (branch: both (differs); 11 strings)
```text
L56 call:message.info: No changes to save
L80 call:message.success: Meetings updated
L88 str: Failed to update meetings
L100 attr:title(AdminWorkspaceShell): Project workspace
L103 attr:message(Alert): Admin not assigned to a college
L104 attr:description(Alert): You must be assigned to a college to view project workspaces.
L116 attr:title(AdminWorkspaceShell): Project workspace
[DEV] L117 attr:subtitle(AdminWorkspaceShell): Plan project touchpoints and connect conversations to the work they support.
L120 attr:message(Alert): Workspace could not be loaded
[DEV] L120 text(Alert): Retry
L134 attr:message(Alert): Workspace not found
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L125 attr:name(Form.Item): meetingsList
[PROD-ONLY] L125 attr:label(Form.Item): Meetings
[PROD-ONLY] L129 attr:addLabel(RepeatingItemEditor): Add meeting
[PROD-ONLY] L130 attr:emptyText(RepeatingItemEditor): No meetings yet.
[PROD-ONLY] L135 text(div): Save changes
```

Page closure (22 files; strings in section 4 or above): `src/components/admin/AdminWorkspaceShell.jsx`, `src/utils/projectErrorModal.jsx`, `src/components/admin/projects/adminProjectUtils.js`, `src/components/admin/projects/WorkspaceMeetingsEditor.jsx`, `src/components/admin/projects/useUnsavedFormGuard.js`, `src/components/admin/projects/adminWorkspaceSection.js`, `src/components/admin/projects/projectSectionFieldConfigs.js`, `src/components/Common/PageShell.jsx`, `src/components/admin/entitySectionTabs.js`, `src/components/admin/AdminWorkspaceBreadcrumb.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/common/adminNavGroups.js`, `src/components/admin/workspaceBackTarget.js`, `src/utils/apiError.js`, `src/components/admin/projects/RepeatingItemEditor.jsx`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/projects/workspaces/[workspaceId]/overview`  (file src/pages/college-admin/projects/workspaces/[workspaceId]/overview.js)

##### `src/pages/college-admin/projects/workspaces/[workspaceId]/overview.js` (branch: both (differs); 11 strings)
```text
L80 call:message.info: No changes to save
L105 call:message.success: Overview updated
L108 str: Failed to update overview
L120 attr:title(AdminWorkspaceShell): Project workspace
L123 attr:message(Alert): Admin not assigned to a college
L124 attr:description(Alert): You must be assigned to a college to view project workspaces.
L136 attr:title(AdminWorkspaceShell): Workspace
[DEV] L137 attr:subtitle(AdminWorkspaceShell): Shape the project brief mentors and students use to understand the work.
L140 attr:message(Alert): Workspace could not be loaded
[DEV] L141 text(Alert): Retry
L148 attr:message(Alert): Workspace not found
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L145 text(div): What mentors and students see as “About this project” on their own Overview tab.
[PROD-ONLY] L150 attr:name(Form.Item): overviewGoal
[PROD-ONLY] L151 attr:label(Form.Item): Project goal / description
[PROD-ONLY] L152 attr:extra(Form.Item): Shown to mentors and students as “About this project” on the Overview tab.
[PROD-ONLY] L154 attr:placeholder(TextArea): What this project is about and what success looks like
[PROD-ONLY] L158 attr:name(Form.Item): overviewDeliverablesText
[PROD-ONLY] L159 attr:label(Form.Item): Deliverables
[PROD-ONLY] L160 attr:extra(Form.Item): One per line — shown as a checklist on the Overview tab.
[PROD-ONLY] L166 new Error: Add at least one deliverable.
[PROD-ONLY] L170 attr:placeholder(TextArea): e.g. Wireframes for all core screens Working prototype Final presentation deck
[PROD-ONLY] L174 attr:name(Form.Item): overviewDoDText
[PROD-ONLY] L175 attr:label(Form.Item): Definition of done
[PROD-ONLY] L176 attr:extra(Form.Item): One condition per line — what makes the whole project done, not a single task.
[PROD-ONLY] L178 attr:placeholder(TextArea): e.g. All acceptance criteria across sprints pass Deployed to a public URL Mentor sign-off recorded
[PROD-ONLY] L182 attr:name(Form.Item): overviewPersonasText
[PROD-ONLY] L183 attr:label(Form.Item): Personas
[PROD-ONLY] L184 attr:extra(Form.Item): One per line, e.g. Frontend lead — owns the board UI and component structure.
[PROD-ONLY] L186 attr:placeholder(TextArea): e.g. Frontend lead — owns the board UI and component structure Backend lead — owns the API and data model
[PROD-ONLY] L190 text(div): Save changes
```

Page closure (20 files; strings in section 4 or above): `src/utils/projectErrorModal.jsx`, `src/components/admin/AdminWorkspaceShell.jsx`, `src/components/admin/projects/adminProjectUtils.js`, `src/components/admin/projects/useUnsavedFormGuard.js`, `src/components/admin/projects/WorkspaceOverviewEditor.jsx`, `src/components/admin/projects/adminWorkspaceSection.js`, `src/utils/apiError.js`, `src/components/Common/PageShell.jsx`, `src/components/admin/entitySectionTabs.js`, `src/components/admin/AdminWorkspaceBreadcrumb.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/common/adminNavGroups.js`, `src/components/admin/workspaceBackTarget.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/projects/workspaces/[workspaceId]/readiness`  (file src/pages/college-admin/projects/workspaces/[workspaceId]/readiness.js)

##### `src/pages/college-admin/projects/workspaces/[workspaceId]/readiness.js` (branch: both (differs); 9 strings)
```text
L43 attr:title(AdminWorkspaceShell): Project workspace
L46 attr:message(Alert): Admin not assigned to a college
L47 attr:description(Alert): You must be assigned to a college to view project workspaces.
L64 attr:title(AdminWorkspaceShell): Project workspace
[DEV] L65 attr:subtitle(AdminWorkspaceShell): Understand submission readiness, proof coverage and any manual override at a glance.
L67 text(AdminWorkspaceShell): Manage override
L73 attr:message(Alert): Workspace could not be loaded
[DEV] L73 text(Alert): Retry
L80 attr:message(Alert): Workspace not found
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L25 text(Tag): Force unlocked
[PROD-ONLY] L29 text(Tag): Force blocked
[PROD-ONLY] L67 call:setError: Failed to load workspace.
[PROD-ONLY] L72 call:setError: Failed to load workspace.
[PROD-ONLY] L122 attr:title(Card): Readiness
[PROD-ONLY] L128 str: ${percent}% · ${readiness.completedTasks ?? 0}/${readiness.totalTasks ?? 0} tasks
[PROD-ONLY] L132 attr:label(Descriptions.Item): Sprints completed
[PROD-ONLY] L133 child(div): ${readiness.completedSprints ?? 0}/${readiness.totalSprints ?? 0}
[PROD-ONLY] L135 attr:label(Descriptions.Item): Submission status
[PROD-ONLY] L136 child(div): Not submitted
[PROD-ONLY] L138 attr:label(Descriptions.Item): Ready for submission
[PROD-ONLY] L141 child(div): Ready
[PROD-ONLY] L141 child(div): Not ready
[PROD-ONLY] L147 attr:label(Descriptions.Item): Override
[PROD-ONLY] L148 text(div): None
[PROD-ONLY] L152 attr:label(Descriptions.Item): Override note
[PROD-ONLY] L155 attr:label(Descriptions.Item): Overridden by
[PROD-ONLY] L156 attr:label(Descriptions.Item): Overridden at
```

Page closure (17 files; strings in section 4 or above): `src/components/admin/AdminWorkspaceShell.jsx`, `src/components/admin/projects/adminProjectUtils.js`, `src/components/admin/projects/WorkspaceReadinessOverview.jsx`, `src/components/admin/projects/adminWorkspaceSection.js`, `src/components/Common/PageShell.jsx`, `src/components/admin/entitySectionTabs.js`, `src/components/admin/AdminWorkspaceBreadcrumb.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/common/adminNavGroups.js`, `src/components/admin/workspaceBackTarget.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/projects/workspaces/[workspaceId]/resources`  (file src/pages/college-admin/projects/workspaces/[workspaceId]/resources.js)

##### `src/pages/college-admin/projects/workspaces/[workspaceId]/resources.js` (branch: both (differs); 11 strings)
```text
L44 call:message.info: No changes to save
L64 call:message.success: Resources updated
L72 str: Failed to update resources
L84 attr:title(AdminWorkspaceShell): Project workspace
L87 attr:message(Alert): Admin not assigned to a college
L88 attr:description(Alert): You must be assigned to a college to view project workspaces.
L100 attr:title(AdminWorkspaceShell): Project workspace
[DEV] L101 attr:subtitle(AdminWorkspaceShell): Curate the references, files and access guidance this workspace team needs.
L104 attr:message(Alert): Workspace could not be loaded
[DEV] L105 text(Alert): Retry
L117 attr:message(Alert): Workspace not found
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L108 attr:name(Form.Item): resources
[PROD-ONLY] L108 attr:label(Form.Item): Resources
[PROD-ONLY] L112 attr:addLabel(RepeatingItemEditor): Add resource
[PROD-ONLY] L113 attr:emptyText(RepeatingItemEditor): No resources yet.
[PROD-ONLY] L117 text(div): Save changes
```

Page closure (22 files; strings in section 4 or above): `src/components/admin/AdminWorkspaceShell.jsx`, `src/utils/projectErrorModal.jsx`, `src/components/admin/projects/adminProjectUtils.js`, `src/components/admin/projects/WorkspaceResourcesEditor.jsx`, `src/components/admin/projects/useUnsavedFormGuard.js`, `src/components/admin/projects/adminWorkspaceSection.js`, `src/components/admin/projects/projectSectionFieldConfigs.js`, `src/components/Common/PageShell.jsx`, `src/components/admin/entitySectionTabs.js`, `src/components/admin/AdminWorkspaceBreadcrumb.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/common/adminNavGroups.js`, `src/components/admin/workspaceBackTarget.js`, `src/utils/apiError.js`, `src/components/admin/projects/RepeatingItemEditor.jsx`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/projects/workspaces/[workspaceId]/sprints`  (file src/pages/college-admin/projects/workspaces/[workspaceId]/sprints.js)

##### `src/pages/college-admin/projects/workspaces/[workspaceId]/sprints.js` (branch: both (differs); 13 strings)
```text
[DEV] L59 call:setReleasesError: Could not load project releases.
[DEV] L65 call:setReleasesError: Could not load project releases.
L91 call:message.info: No changes to save
L111 call:message.success: Sprints updated
L119 str: Failed to update sprints
L131 attr:title(AdminWorkspaceShell): Project workspace
L134 attr:message(Alert): Admin not assigned to a college
L135 attr:description(Alert): You must be assigned to a college to view project workspaces.
L147 attr:title(AdminWorkspaceShell): Project workspace
[DEV] L148 attr:subtitle(AdminWorkspaceShell): Plan sprint outcomes, release alignment and delivery cadence for this workspace.
L151 attr:message(Alert): Workspace could not be loaded
[DEV] L151 text(Alert): Retry
L169 attr:message(Alert): Workspace not found
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L121 attr:name(Form.Item): sprints
[PROD-ONLY] L121 attr:label(Form.Item): Sprints
[PROD-ONLY] L125 attr:addLabel(RepeatingItemEditor): Add sprint
[PROD-ONLY] L126 attr:emptyText(RepeatingItemEditor): No sprints yet.
[PROD-ONLY] L130 text(div): Save changes
```

Page closure (23 files; strings in section 4 or above): `src/components/admin/AdminWorkspaceShell.jsx`, `src/utils/projectErrorModal.jsx`, `src/components/admin/projects/adminProjectUtils.js`, `src/components/admin/projects/WorkspaceSprintsEditor.jsx`, `src/components/admin/projects/useUnsavedFormGuard.js`, `src/components/admin/projects/adminWorkspaceSection.js`, `src/components/admin/projects/projectSectionFieldConfigs.js`, `src/components/Common/PageShell.jsx`, `src/components/admin/entitySectionTabs.js`, `src/components/admin/AdminWorkspaceBreadcrumb.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/common/adminNavGroups.js`, `src/components/admin/workspaceBackTarget.js`, `src/utils/apiError.js`, `src/components/admin/projects/RepeatingItemEditor.jsx`, `src/components/admin/projects/workspaceRowMeta.jsx`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/projects/workspaces/[workspaceId]/summary`  (file src/pages/college-admin/projects/workspaces/[workspaceId]/summary.js)

##### `src/pages/college-admin/projects/workspaces/[workspaceId]/summary.js` (branch: both (differs); 117 strings)
```text
L67 prop:label: Active
L68 prop:label: In progress
L69 prop:label: Ready
L70 prop:label: Blocked
L76 prop:label: Archived
L145 new Error: Failed to load templates
L153 prop:label: ${item.title || item.slug || `Template ${item.id}`}${item.templateVersion ? ` (v${item.templateVersion})` : ""}
L153 prop:label: Template ${item.id}
L153 prop:label: (v${item.templateVersion})
L182 call:message.error: Failed to search templates
L195 call:message.error: Failed to load template options
L235 prop:label: Class ${c.id}
L259 prop:label: ${normalizedStatus} (unrecognized)
L283 call:setError: Failed to load workspace.
L287 call:setError: Failed to load workspace.
L350 call:message.error: Cannot change estimation unit: ${estimatedCount} task${estimatedCount === 1 ? " has" : "s have"} existing estimates. Retain the current unit to preserve velocity history.
L350 call:message.error: s have
L356 call:message.success: Workspace updated
L367 str: Failed to update workspace
L381 call:message.success: Template attached
L386 str: Failed to attach template
L396 call:message.success: Workspace archived
L399 str: Failed to archive workspace
L409 call:message.success: Workspace deleted — it can be restored from Deleted workspaces.
L412 str: Failed to delete workspace
L424 attr:title(AdminWorkspaceShell): Project workspace
L427 attr:message(Alert): Admin not assigned to a college
L428 attr:description(Alert): You must be assigned to a college to view project workspaces.
L459 attr:title(AdminWorkspaceShell): Project workspace
[DEV] L460 attr:subtitle(AdminWorkspaceShell): Health, setup and operating details for this workspace.
L468 text(AdminWorkspaceShell): Change template…
L472 attr:title(Popconfirm): Archive this workspace?
L473 attr:description(Popconfirm): The workspace will be marked archived but remains accessible for review.
L474 attr:okText(Popconfirm): Archive
L480 text(AdminWorkspaceShell): Archive
L485 attr:title(Popconfirm): Delete this workspace?
L486 attr:description(Popconfirm): The workspace is soft-deleted (moved to Deleted workspaces) and can be restored from there — it is not permanently erased immediately.
L487 attr:okText(Popconfirm): Delete
L493 text(AdminWorkspaceShell): Delete
L501 attr:title(Modal): Change template
L509 attr:okText(Modal): Attach
[DEV] L516 attr:message(Alert): Changing the template replaces this workspace's tasks, sprints and resources with the new template's. Edits made to the current ones are not kept. This happens regardless of the checkbox below, which only controls whether blank title/summary/overview fields get refilled from the new template.
L518 attr:name(Form.Item): templateId
L518 attr:label(Form.Item): Template
L518 prop:message(Form.Item): Template is required
L527 attr:placeholder(Select): Search by template title
L530 attr:name(Form.Item): reapplyDefaults
L531 text(div): Refill blank title/summary/overview from the new template
L537 attr:message(Alert): Workspace could not be loaded
L537 text(Alert): Retry
L551 attr:message(Alert): Flagged as at-risk (${risk.severity.label})
L561 attr:message(Alert): Opened via a filtered view
L564 attr:description(Alert): Flagged there for: ${linkedReason}. This page's own recomputation ${risk?.atRisk ? "shows a different reason" : "no longer shows this workspace as at-risk"} — activity data may have updated since.
L565 attr:description(Alert): shows a different reason
L565 attr:description(Alert): no longer shows this workspace as at-risk
L567 attr:description(Alert): Reason: ${linkedReason}
[DEV] L572 attr:title(Card): Workspace settings
L574 text(div): Basic info
L576 attr:name(Form.Item): title
L576 attr:label(Form.Item): Workspace title
L576 prop:message(Form.Item): Title is required
L577 attr:placeholder(Input): Campus Event Coordination
L580 attr:name(Form.Item): summary
L580 attr:label(Form.Item): Summary
L581 attr:placeholder(TextArea): Short live workspace summary
L584 text(div): Status
L589 attr:name(Form.Item): status
L589 attr:label(Form.Item): Status
[DEV] L590 attr:extra(Form.Item): Archived. To reopen it, choose another status and save.
[DEV] L590 attr:extra(Form.Item): To archive it, use Archive at the top of the page.
L596 attr:name(Form.Item): progress
L597 attr:label(Form.Item): Progress %
[DEV] L599 attr:extra(Form.Item): Calculated from completed tasks and sprints, the same figure students and mentors see. It updates as the board moves.
[DEV] L600 attr:extra(Form.Item): No tasks or sprints yet, so this hand-set figure is shown until the board has work on it.
L616 attr:message(Alert): This workspace has no mentor
L617 attr:description(Alert): Saving with Active will be rejected until a mentor is assigned — use Reassign mentor on the Team tab first.
L623 attr:name(Form.Item): phase
L623 attr:label(Form.Item): Phase
L624 attr:placeholder(Input): e.g. Discovery
L628 attr:name(Form.Item): dueLabel
L628 attr:label(Form.Item): Due label
L629 attr:placeholder(Input): e.g. Week 6
L633 attr:name(Form.Item): courseLabel
L633 attr:label(Form.Item): Course label
L634 attr:placeholder(Input): e.g. Data Structures
L639 attr:name(Form.Item): classId
L640 attr:label(Form.Item): Class
L641 attr:tooltip(Form.Item): Which class this project belongs to. Clear it to detach the project from any class — it stays visible to its assigned members either way.
L643 attr:placeholder(Select): No class
L648 attr:name(Form.Item): blocker
L648 attr:label(Form.Item): Blocker
L649 attr:placeholder(TextArea): Any active blocker
L652 attr:name(Form.Item): nextAction
L652 attr:label(Form.Item): Next action
L653 attr:placeholder(TextArea): Immediate next step
L656 text(div): Schedule & setup
L660 attr:name(Form.Item): startDate
L660 attr:label(Form.Item): Start date
L666 attr:name(Form.Item): endDate
L667 attr:label(Form.Item): End date
L668 attr:dependencies(Form.Item): startDate
L676 new Error: End date must be on or after the start date
L689 attr:name(Form.Item): sprintLengthWeeks
L690 attr:label(Form.Item): Sprint length (weeks)
[DEV] L691 attr:extra(Form.Item): Used for sprints created from now on; existing sprints keep their dates.
L698 attr:name(Form.Item): estimationUnit
L699 attr:label(Form.Item): Estimation unit
[DEV] L700 attr:extra(Form.Item): Changing this does not convert estimates already on tasks; they keep their numbers under the new unit.
L704 attr:placeholder(Select): POINTS
L706 prop:label(Select): Points
L707 prop:label(Select): Hours
L714 text(div): Overview
[DEV] L715 text(div): Goal, deliverables, definition of done and personas are edited on the
L717 text(div): Overview
[DEV] L717 text(div): tab.
L721 text(div): Save changes
L729 attr:message(Alert): Workspace not found
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L464 attr:subtitle(AdminWorkspaceShell): Live instance data for an assigned team.
[PROD-ONLY] L518 attr:message(Alert): Switching to a different template always resets all materialized tasks, sprints, and resources on this workspace — mixing content from two templates isn't supported. This happens regardless of the checkbox below, which only controls whether blank title/summary/overview fields get refilled from the new template.
[PROD-ONLY] L581 attr:title(Card): Workspace summary
[PROD-ONLY] L597 attr:extra(Form.Item): To archive this workspace, use the Archive action above instead.
[PROD-ONLY] L605 attr:extra(Form.Item): A headline figure you maintain by hand. Nothing recomputes it — it is not derived from task completion, and it is what the project lists and the Overview donut show, whether or not the board agrees with it.
[PROD-ONLY] L692 attr:extra(Form.Item): Default length new sprints are generated at. Sprints already created keep their own dates.
[PROD-ONLY] L701 attr:extra(Form.Item): Points and hours are not convertible — changing this on a project that already has estimated tasks leaves those numbers as-is under the new label, making velocity history meaningless.
[PROD-ONLY] L716 text(div): The project goal, deliverables, definition of done and personas now live on their own
[PROD-ONLY] L718 text(div): tab. Splitting them out means the Save on this page no longer has to satisfy the deliverables validator, which used to block an unrelated title or status edit on any workspace that had none.
```

Page closure (19 files; strings in section 4 or above): `src/components/admin/AdminWorkspaceShell.jsx`, `src/utils/projectErrorModal.jsx`, `src/components/admin/projects/adminProjectUtils.js`, `src/components/admin/projects/useUnsavedFormGuard.js`, `src/components/admin/projects/WorkspaceSummarySnapshot.jsx`, `src/components/Common/PageShell.jsx`, `src/components/admin/entitySectionTabs.js`, `src/components/admin/AdminWorkspaceBreadcrumb.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/common/adminNavGroups.js`, `src/components/admin/workspaceBackTarget.js`, `src/utils/apiError.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/projects/workspaces/[workspaceId]/tasks`  (file src/pages/college-admin/projects/workspaces/[workspaceId]/tasks.js)

##### `src/pages/college-admin/projects/workspaces/[workspaceId]/tasks.js` (branch: both (differs); 11 strings)
```text
L58 call:message.info: No changes to save
L80 call:message.success: Tasks updated
L88 str: Failed to update tasks
L100 attr:title(AdminWorkspaceShell): Project workspace
L103 attr:message(Alert): Admin not assigned to a college
L104 attr:description(Alert): You must be assigned to a college to view project workspaces.
L116 attr:title(AdminWorkspaceShell): Project workspace
[DEV] L117 attr:subtitle(AdminWorkspaceShell): Shape the work breakdown and review learner submission activity for this workspace.
L120 attr:message(Alert): Workspace could not be loaded
[DEV] L121 text(Alert): Retry
L138 attr:message(Alert): Workspace not found
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L122 attr:name(Form.Item): tasks
[PROD-ONLY] L123 attr:label(Form.Item): Tasks
[PROD-ONLY] L137 attr:addLabel(RepeatingItemEditor): Add task
[PROD-ONLY] L138 attr:emptyText(RepeatingItemEditor): No tasks yet.
[PROD-ONLY] L143 text(div): Save changes
```

Page closure (23 files; strings in section 4 or above): `src/components/admin/AdminWorkspaceShell.jsx`, `src/utils/projectErrorModal.jsx`, `src/components/admin/projects/adminProjectUtils.js`, `src/components/admin/projects/WorkspaceTasksEditor.jsx`, `src/components/admin/projects/useUnsavedFormGuard.js`, `src/components/admin/projects/adminWorkspaceSection.js`, `src/components/admin/projects/projectSectionFieldConfigs.js`, `src/components/Common/PageShell.jsx`, `src/components/admin/entitySectionTabs.js`, `src/components/admin/AdminWorkspaceBreadcrumb.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/common/adminNavGroups.js`, `src/components/admin/workspaceBackTarget.js`, `src/utils/apiError.js`, `src/components/admin/projects/RepeatingItemEditor.jsx`, `src/components/admin/projects/workspaceRowMeta.jsx`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/projects/workspaces/[workspaceId]/team`  (file src/pages/college-admin/projects/workspaces/[workspaceId]/team.js)

##### `src/pages/college-admin/projects/workspaces/[workspaceId]/team.js` (branch: both (differs); 61 strings)
```text
L54 prop:label: Mentor
L56 prop:label: Faculty
L58 prop:label: Learner
L59 prop:label: Member
L129 new Error: Failed to load faculty
L133 prop:label: ${`${item.firstName ?? item.first_name ?? ""} ${item.lastName ?? item.last_name ?? ""}`.trim() || "Faculty"} · ID ${item.id}
L133 prop:label: Faculty
L139 new Error: Failed to load learners
L143 prop:label: ${`${item.firstName ?? item.first_name ?? ""} ${item.lastName ?? item.last_name ?? ""}`.trim() || "Learner"} · ${item.rollNumber ? `Roll ${item.rollNumber}` : `ID ${item.id}`}
L143 prop:label: Learner
L143 prop:label: Roll ${item.rollNumber}
L143 prop:label: ID ${item.id}
L172 call:message.error: Failed to search faculty
L184 call:message.error: Failed to search learners
L199 call:message.error: Failed to load mentor/learner options
L232 call:message.success: Mentor assigned
L237 str: Failed to assign mentor
L250 prop:title: Remove ${removed.length} learner${removed.length === 1 ? "" : "s"} from this workspace?
L251 prop:content: Access will be removed for: ${removed.map((m) => m.name || m.displayName || `Learner ${m.userId}`).join(", ")}. Prior work is retained, but they cannot access it until re-added.
L252 prop:okText: Replace roster
L265 call:message.success: Learners updated
L270 str: Failed to update learners
L282 attr:title(AdminWorkspaceShell): Project workspace
L285 attr:message(Alert): Admin not assigned to a college
L286 attr:description(Alert): You must be assigned to a college to view project workspaces.
L300 attr:title(AdminWorkspaceShell): Project workspace
[DEV] L301 attr:subtitle(AdminWorkspaceShell): Manage mentor ownership, student membership and workload across this workspace.
L308 text(AdminWorkspaceShell): Reassign mentor…
[DEV] L311 text(AdminWorkspaceShell): Manage students…
L318 attr:title(Modal): Reassign mentor
L326 attr:okText(Modal): Assign
L333 attr:message(Alert): Reassigning replaces the current mentor${primaryMentor?.name ? ` (${primaryMentor.name})` : ""}: their meetings on this workspace are cancelled, their task assignments are cleared, and both the outgoing and incoming mentor are notified.
L334 attr:message(Alert): (${primaryMentor.name})
L337 attr:name(Form.Item): mentorId
L337 attr:label(Form.Item): Mentor
L337 prop:message(Form.Item): Mentor is required
L346 attr:placeholder(Select): Search by faculty name
L350 attr:name(Form.Item): roleLabel
L351 attr:label(Form.Item): Role label (optional)
L352 attr:tooltip(Form.Item): Shown on the workspace's team roster in place of 'Project Mentor'. Leave blank unless you have a specific reason to relabel this role.
L354 attr:placeholder(Input): Project Mentor
L356 text(div): Reassigning several workspaces at once, or want to see mentor workload first?
L358 text(div): Use the bulk Reassign Mentor page
[DEV] L364 attr:title(Modal): Manage students
L372 attr:okText(Modal): Save
L380 attr:message(Alert): Replacing existing learners will remove ${currentLearnerCount} current learner${currentLearnerCount === 1 ? "" : "s"} from this workspace, along with their access to it. Their prior task/delivery history is retained but they will no longer be able to view or edit it.
L390 attr:message(Alert): ${alreadyMemberLearnerCount} of the selected learner${alreadyMemberLearnerCount === 1 ? "" : "s"} already on this workspace.
L396 attr:name(Form.Item): learnerIds
[DEV] L397 attr:label(Form.Item): Students
L399 prop:message(Form.Item): At least one learner is required
L413 new Error: This would exceed the 500-learner limit for this workspace — currently ${learnersReplaceExisting === false ? currentLearnerCount : 0}, adding ${learnersReplaceExisting === false ? selected.length - alreadyMemberLearnerCount : selected.length}.
[DEV] L435 attr:placeholder(Select): Search by student name
L438 attr:name(Form.Item): roleLabel
L438 attr:label(Form.Item): Role label (optional)
L439 attr:placeholder(Input): Project Contributor
L441 attr:name(Form.Item): replaceExisting
L448 prop:label: Learner ${m.userId}
L451 text(div): Replace existing learners (unchecked appends instead)
L457 attr:message(Alert): Workspace could not be loaded
[DEV] L457 text(Alert): Retry
L474 attr:message(Alert): Workspace not found
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L330 text(AdminWorkspaceShell): Manage learners…
[PROD-ONLY] L383 attr:title(Modal): Manage learners
[PROD-ONLY] L416 attr:label(Form.Item): Learners
[PROD-ONLY] L454 attr:placeholder(Select): Search by learner name
[PROD-ONLY] L484 attr:label(Descriptions.Item): Learners
[PROD-ONLY] L487 attr:title(Card): Members (${members.length})
[PROD-ONLY] L494 attr:placeholder(Input.Search): Search member name or ID
[PROD-ONLY] L495 attr:aria-label(Input.Search): Search project members
[PROD-ONLY] L501 attr:aria-label(Select): Filter project members by type
[PROD-ONLY] L503 prop:label(Select): All members
[PROD-ONLY] L503 prop:label(Select): Learners
[PROD-ONLY] L527 attr:showTotal(Pagination): ${range[0]}–${range[1]} of ${total} matching members
[PROD-ONLY] L531 attr:description(Empty): No members match these filters
[PROD-ONLY] L534 attr:description(Empty): No members yet
```

Page closure (20 files; strings in section 4 or above): `src/components/admin/projects/WorkspaceTeamOverview.jsx`, `src/components/admin/AdminWorkspaceShell.jsx`, `src/utils/projectErrorModal.jsx`, `src/components/admin/projects/adminWorkspaceSection.js`, `src/components/admin/projects/adminProjectUtils.js`, `src/components/admin/projects/workspaceRowMeta.jsx`, `src/components/Common/PageShell.jsx`, `src/components/admin/entitySectionTabs.js`, `src/components/admin/AdminWorkspaceBreadcrumb.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/common/adminNavGroups.js`, `src/components/admin/workspaceBackTarget.js`, `src/utils/apiError.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/projects/workspaces/deleted`  (file src/pages/college-admin/projects/workspaces/deleted.js)

##### `src/pages/college-admin/projects/workspaces/deleted.js` (branch: both (differs); 24 strings)
```text
L64 call:setError: Failed to load deleted workspaces.
L70 call:setError: Failed to load deleted workspaces.
L94 call:message.warning: Workspace restored, but its mentor could not be recovered — assign one to reactivate it.
L96 call:message.success: Workspace restored
L100 str: Failed to restore workspace
L108 prop:title: Workspace
L113 prop:title: Mentor
L120 prop:title: Action
L126 attr:title(Popconfirm): Restore this workspace?
L127 attr:description(Popconfirm): Restore workspace, members, meetings, tasks, sprints and resources with their edits.
L127 attr:description(Popconfirm): This workspace was deleted before content-preserving restore was enabled. Only the workspace shell, eligible members and meetings can be recovered; prior task, sprint and resource edits are unavailable.
L128 attr:okText(Popconfirm): Restore
L131 text(Popconfirm): Restore
L149 attr:message(Alert): Admin not assigned to a college
L150 attr:description(Alert): You must be assigned to a college before managing project workspaces.
L163 text(div): Deleted workspaces
[DEV] L164 text(div): Deleted workspaces you can still restore.
L167 text(div): Back to workspaces
L172 attr:message(Alert): Deleted workspaces could not be loaded
L175 attr:title(Card): Deleted workspaces
L181 attr:description(Empty): Deleted workspaces could not be loaded
L182 text(div): Retry
L196 str: ${range[0]}-${range[1]} of ${total} deleted workspaces
L204 attr:description(Empty): No deleted workspaces for this college
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L164 text(div): Soft-deleted project workspaces that can still be restored.
```

Page closure (16 files; strings in section 4 or above): `src/utils/projectErrorModal.jsx`, `src/components/admin/AdminGroupShell.jsx`, `src/components/admin/projects/adminProjectUtils.js`, `src/utils/apiError.js`, `src/components/Common/PageShell.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/components/admin/AdminWorkflowGuide.jsx`, `src/common/adminNavGroups.js`, `src/common/navTabMatching.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/projects/workspaces/index`  (file src/pages/college-admin/projects/workspaces/index.js)

##### `src/pages/college-admin/projects/workspaces/index.js` (branch: both (differs); 30 strings)
```text
L158 call:setError: Failed to load project workspaces.
L164 call:setError: Failed to load project workspaces.
L188 call:message.success: Workspace archived
L193 str: Failed to archive workspace
L202 prop:title: Workspace
L224 attr:aria-label(Tag): No template attached — open this workspace to attach one
L233 text(Space): No template — attach one
L242 prop:title: Mentor
L252 prop:title: Status
L257 prop:title: Progress
L266 prop:title: Members
L271 prop:title: Action
L290 text(Space): Open
L294 attr:title(Popconfirm): Archive this workspace?
L295 attr:description(Popconfirm): The workspace will be marked archived but remains accessible for review.
L296 attr:okText(Popconfirm): Archive
L309 text(Space): Archive
L330 attr:message(Alert): Admin not assigned to a college
L331 attr:description(Alert): You must be assigned to a college before managing project workspaces.
L344 text(div): Project workspaces
[DEV] L345 text(div): Live projects, each run by a mentor with a team of students.
L348 text(div): Create workspace
L349 text(div): Bulk reassign mentor
L350 text(div): Deleted workspaces
L359 attr:message(Alert): Workspaces could not be loaded
L359 text(Alert): Retry
L363 attr:title(Card): Workspaces
L442 str: ${range[0]}-${range[1]} of ${total} workspaces
L450 attr:description(Empty): No workspaces match your search/filter
L450 attr:description(Empty): No workspaces available for this college
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L338 text(div): Live project instances assigned to mentors and learners.
```

Page closure (17 files; strings in section 4 or above): `src/utils/projectErrorModal.jsx`, `src/utils/csvExport.js`, `src/components/admin/AdminGroupShell.jsx`, `src/components/admin/projects/adminProjectUtils.js`, `src/utils/apiError.js`, `src/components/Common/PageShell.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/components/admin/AdminWorkflowGuide.jsx`, `src/common/adminNavGroups.js`, `src/common/navTabMatching.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/projects/workspaces/new`  (file src/pages/college-admin/projects/workspaces/new.js)

##### `src/pages/college-admin/projects/workspaces/new.js` (branch: both (differs); 107 strings)
```text
L118 call:setTemplatesError: Templates could not be loaded.
L119 new Error: Templates could not be loaded.
L128 prop:label: ${item.title || item.slug || `Template ${item.id}`}${item.templateVersion ? ` (v${item.templateVersion})` : ""}
L128 prop:label: Template ${item.id}
L128 prop:label: (v${item.templateVersion})
L134 new Error: Faculty could not be loaded.
L137 prop:label: ${`${item.firstName ?? item.first_name ?? ""} ${item.lastName ?? item.last_name ?? ""}`.trim() || "Faculty"} · ID ${item.id}
L137 prop:label: Faculty
L143 new Error: Classes could not be loaded.
L146 prop:label: Class ${item.id}
L152 new Error: Learners could not be loaded.
L155 prop:label: ${`${item.firstName ?? item.first_name ?? ""} ${item.lastName ?? item.last_name ?? ""}`.trim() || "Learner"} · ${item.rollNumber ? `Roll ${item.rollNumber}` : `ID ${item.id}`}
L155 prop:label: Learner
L155 prop:label: Roll ${item.rollNumber}
L155 prop:label: ID ${item.id}
L175 call:message.error: Could not load the workspace setup options. Try again.
L207 call:message.error: Template search failed.
L217 call:message.error: Faculty search failed.
L227 call:message.error: Class search failed.
L240 call:message.error: Learner search failed.
[DEV] L267 call:message.error: Pick a section to create one workspace per student in it.
L288 new Error: The server did not return a valid cohort preflight. Nothing was created.
[DEV] L292 call:message.info: Every eligible student already has a workspace from this template. Nothing was created.
[DEV] L297 prop:title: Create ${preview.toCreateCount} student workspace${preview.toCreateCount === 1 ? "" : "s"}?
L301 text(div): Class roster:
[DEV] L301 text(div): ; eligible students:
L301 text(div): ; already covered:
L301 text(div): ; duplicate roster entries:
[DEV] L302 text(div): The full list is below this form. The roster is checked again before anything is created.
L304 prop:title(Table): Learner
L307 text(div): Showing the first 10 of
[DEV] L307 text(div): students to create; review the full list below.
L310 prop:okText: Create ${preview.toCreateCount} workspaces
L333 call:message.warning: The outcome report could not be saved in this browser. Download the CSV before leaving.
[DEV] L336 call:message.warning: ${createdCount} workspace(s) created; ${failures.length} student${failures.length === 1 ? "" : "s"} failed. Review or export the report below before retrying.
L341 call:message.warning: No workspaces were created. Review the outcome report below.
L344 call:message.success: Created ${createdCount} workspace(s) for the class roster.
L361 call:message.success: Workspace created
L370 call:message.warning: Workspace created, but the server did not return its id — find it in the workspaces list.
L374 str: Failed to create workspace
L387 attr:message(Alert): Admin not assigned to a college
L387 attr:description(Alert): You must be assigned to a college before creating project workspaces.
L398 text(div): Create project workspace
L399 text(div): Every workspace starts from a template — pick one below.
L406 text(div): Back to workspaces
[DEV] L440 attr:message(Alert): Split a class into teams
L449 attr:message(Alert): Cohort mode
[DEV] L450 attr:description(Alert): Every active student in the section gets their own workspace with the same template, mentor, and title (suffixed with their name).
L456 attr:name(Form.Item): title
L457 attr:label(Form.Item): Workspace title
L459 prop:message(Form.Item): Title is required
L460 prop:message(Form.Item): Title must be 160 characters or fewer
L463 attr:placeholder(Input): Campus Event Coordination
L466 attr:name(Form.Item): summary
L466 attr:label(Form.Item): Summary
L467 attr:placeholder(TextArea): Short live workspace summary
L471 attr:name(Form.Item): status
L472 attr:label(Form.Item): Status
L478 prop:label(Select): Active
L479 prop:label(Select): In progress
L480 prop:label(Select): Ready
L481 prop:label(Select): Blocked
L486 prop:label(Select): Archived
L492 attr:name(Form.Item): templateId
L493 attr:label(Form.Item): Template
L494 prop:message(Form.Item): A template is required — every workspace needs a sprint/task baseline to start from
L497 attr:extra(Form.Item): Templates could not be loaded: ${templatesError}
L499 attr:extra(Form.Item): No templates are available to this college yet — a 42Students admin assigns them.
L511 attr:placeholder(Select): Search by template title
L516 attr:name(Form.Item): mentorId
L517 attr:label(Form.Item): Mentor
L518 prop:message(Form.Item): A mentor is required before a workspace can be Active
[DEV] L519 attr:extra(Form.Item): Every workspace needs a mentor.
L529 attr:placeholder(Select): Required — search by faculty name
L529 attr:placeholder(Select): Optional — search by faculty name
L540 attr:name(Form.Item): classId
L541 attr:label(Form.Item): Class
[DEV] L542 prop:message(Form.Item): Pick the class to split into teams
L542 prop:message(Form.Item): Class is required in cohort mode
L552 attr:placeholder(Select): Required in cohort mode — search by class name
L561 attr:name(Form.Item): learnerIds
[DEV] L562 attr:label(Form.Item): Students
[DEV] L563 prop:message(Form.Item): A workspace can have at most 500 students
[DEV] L573 attr:placeholder(Select): Search by student name
[DEV] L578 attr:label(Form.Item): Or add a whole class
[DEV] L578 attr:extra(Form.Item): Adds every student in the section to the list above; remove anyone who isn't on this team.
[DEV] L590 attr:placeholder(Select): Pick a section to add its students
L598 child(div): Create workspaces for class
L598 child(div): Create workspace
[DEV] L598 str: Create ${teamPreview?.length || ""} team workspaces
[DEV] L606 attr:title(Card): Before creating: one workspace per student
L607 attr:message(Alert): ${cohortPreflight.toCreateCount} to create · ${cohortPreflight.alreadyCoveredCount} already covered · ${cohortPreflight.duplicateRosterEntries} duplicate roster entries
L607 attr:description(Alert): This preview is advisory; the creation request rechecks eligibility and duplicates.
L609 prop:title(Table): Learner
L610 prop:title(Table): Learner ID
L611 prop:title(Table): Decision
L611 text(Table): Already has workspace
L611 text(Table): Create
L616 attr:title(Card): Latest cohort creation outcome
L624 text(div): Saved in this browser for seven days for this admin and college. Created:
L624 text(div): ; failed:
L624 text(div): . Completed
[DEV] L625 attr:message(Alert): Some workspaces were not created
L625 attr:description(Alert): Successful workspaces remain created. Recheck this class and template with the preflight before retrying; already-covered learners will be skipped.
L630 prop:title(Table): Result
L631 prop:title(Table): Workspace ID
L632 prop:title(Table): Workspace / failure
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L249 call:message.error: Class is required to create one workspace per learner in the class.
[PROD-ONLY] L274 call:message.info: Every eligible learner already has this class/template workspace. Nothing was created.
[PROD-ONLY] L279 prop:title: Create ${preview.toCreateCount} learner workspace${preview.toCreateCount === 1 ? "" : "s"}?
[PROD-ONLY] L283 text(div): ; unique eligible learners:
[PROD-ONLY] L284 text(div): The learner-by-learner preview is visible below this form. The server will recheck the roster before writing.
[PROD-ONLY] L289 text(div): learners to create; review the full list below.
[PROD-ONLY] L318 call:message.warning: ${createdCount} workspace(s) created; ${failures.length} learner(s) failed. Review or export the report below before retrying.
[PROD-ONLY] L395 text(div): Workspaces are live instances. Members, meetings, activity, and submission state belong here.
[PROD-ONLY] L414 text(div): Create one workspace per learner in a class (cohort mode)
[PROD-ONLY] L422 attr:description(Alert): Every active learner in the given class gets their own workspace with the same template, mentor, and title (suffixed with their name).
[PROD-ONLY] L446 attr:extra(Form.Item): To create an already-archived workspace, create it Active and use the Archive action on its detail page instead.
[PROD-ONLY] L491 attr:extra(Form.Item): Required — this workspace starts Active.
[PROD-ONLY] L532 attr:label(Form.Item): Learners
[PROD-ONLY] L533 prop:message(Form.Item): A workspace can have at most 500 learners
[PROD-ONLY] L544 attr:placeholder(Select): Search by learner name
[PROD-ONLY] L557 attr:title(Card): Cohort preflight — learner-by-learner
[PROD-ONLY] L576 attr:message(Alert): Partial or complete batch failure
```

Page closure (20 files; strings in section 4 or above): `src/components/admin/projects/useProjectTeamSplit.jsx`, `src/utils/projectErrorModal.jsx`, `src/utils/csvExport.js`, `src/components/admin/AdminGroupShell.jsx`, `src/components/admin/projects/useUnsavedFormGuard.js`, `src/hooks/useDebounceHook.js`, `src/utils/projectTeams.js`, `src/utils/apiError.js`, `src/components/Common/PageShell.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/components/admin/AdminWorkflowGuide.jsx`, `src/common/adminNavGroups.js`, `src/common/navTabMatching.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/projects/workspaces/reassign-mentor`  (file src/pages/college-admin/projects/workspaces/reassign-mentor.js)

##### `src/pages/college-admin/projects/workspaces/reassign-mentor.js` (branch: both (differs); 70 strings)
```text
[DEV] L53 new Error: Faculty options could not be loaded.
L57 prop:label: Faculty ${item.id}
[DEV] L78 call:setFacultyOptionsError: Faculty options could not be loaded.
L112 call:setError: Failed to load project workspaces.
L116 call:setError: Failed to load project workspaces.
L166 prop:title: Mentor
L180 attr:title(Tooltip): Flagged when a mentor's active workspace count is 50% or more above the college average.
L181 text(Tooltip): Active workspaces
L195 text(Space): Overloaded
L202 prop:title: At-risk
L205 text(Tag): at risk
L225 str: Project Mentor
L232 str: Project Mentor
L247 return: ${label}: ${message}
L253 call:message.warning: Select at least one workspace to reassign.
L276 call:message.success: Reassigned ${reassignedCount} workspace(s) to ${mentorName || `mentor ${values.toMentorId}`}.
L276 call:message.success: mentor ${values.toMentorId}
L278 call:message.info: No workspaces needed changes — they already have this mentor.
L282 call:showProjectErrorMessage: These workspaces were NOT reassigned: ${failures.map(describeFailure).join(", ")}
L283 prop:title: ${failures.length} reassignment(s) failed
L291 call:showProjectErrorMessage: Failed to reassign mentor.
L291 prop:title: Reassignment failed
L294 call:showProjectErrorMessage: Failed to reassign mentor.
L294 prop:title: Reassignment failed
L303 prop:title: Workspace
L308 prop:title: Current mentor
L315 str: Project Mentor
L324 text(Space): Already this mentor — will skip
L330 prop:title: Status
L350 attr:message(Alert): Admin not assigned to a college
L351 attr:description(Alert): You must be assigned to a college before reassigning mentors.
L364 text(div): Bulk mentor reassignment
L365 text(div): Move multiple active workspaces to a new mentor at once.
L368 text(div): Back to workspaces
L375 attr:message(Alert): Workspaces could not be loaded
[DEV] L375 text(Alert): Retry
L378 attr:title(Card): Mentor workload
L389 attr:description(Empty): No project workspaces available for this college
L394 attr:title(Card): Filter by current mentor
L396 attr:label(Form.Item): Current mentor
L406 attr:placeholder(Select): Any mentor — search by name
L415 attr:title(Card): Select workspaces
L429 attr:description(Empty): No active workspaces match this filter
[DEV] L434 attr:message(Alert): Mentor options could not be loaded
[DEV] L434 text(Alert): Retry mentors
L435 attr:title(Card): Reassign to new mentor
L436 text(div): The selected workspaces will get this mentor as their
L437 text(div): primary Project Mentor
L437 text(div): . Their previous primary mentor is removed from each workspace (but keeps every other workspace they manage); any Co-Mentors or Reviewers already on these workspaces are left untouched. This also cancels the outgoing mentor's meetings and clears their task assignments on each workspace — both the outgoing and incoming mentor are notified. Workspaces that already have this exact mentor are skipped automatically — nothing changes for them.
L446 attr:name(Form.Item): toMentorId
L446 attr:label(Form.Item): New mentor
L446 prop:message(Form.Item): Select a mentor
L455 attr:placeholder(Select): Search by mentor name
L459 attr:name(Form.Item): roleLabel
L460 attr:label(Form.Item): Role label
[DEV] L461 prop:message(Form.Item): Keep the role label to 80 characters
L462 attr:tooltip(Form.Item): Shown on the workspace's team roster in place of 'Project Mentor'. Leave blank unless you have a specific reason to relabel this role.
L465 str: Project Mentor
L469 attr:placeholder(Input): Project Mentor
L476 child(div): ${alreadyAssignedCount} of ${selectedIds.length} selected workspace(s) already have this mentor and will be skipped.
L477 child(div): ${selectedIds.length} workspace(s) selected.
L484 attr:title(Popconfirm): Reassign ${selectedIds.length - alreadyAssignedCount} of ${selectedIds.length} selected workspace(s) to ${facultyOptions.find((o) => String(o.value) === String(selectedMentorId))?.label || "this mentor"}?
L484 attr:title(Popconfirm): this mentor
L485 attr:title(Popconfirm): Reassign ${selectedIds.length} workspace(s)?
L487 attr:okText(Popconfirm): Reassign
L491 text(div): Reassign selected
L503 attr:message(Alert): Reassigned ${lastResult.reassignedCount} to ${lastResult.mentorName}${lastResult.skippedCount ? `, skipped ${lastResult.skippedCount} (already assigned)` : ""}${lastResult.failures.length ? `, ${lastResult.failures.length} failed` : ""}.
L503 attr:message(Alert): , skipped ${lastResult.skippedCount} (already assigned)
L503 attr:message(Alert): , ${lastResult.failures.length} failed
L504 attr:description(Alert): Failed: ${lastResult.failures.map(describeFailure).join(", ")}
```

Page closure (16 files; strings in section 4 or above): `src/utils/projectErrorModal.jsx`, `src/components/admin/AdminGroupShell.jsx`, `src/components/admin/projects/adminProjectUtils.js`, `src/utils/apiError.js`, `src/components/Common/PageShell.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/components/admin/AdminWorkflowGuide.jsx`, `src/common/adminNavGroups.js`, `src/common/navTabMatching.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/quizzes`  (file src/pages/college-admin/quizzes.js)

##### `src/pages/college-admin/quizzes.js` (branch: both (identical); 2 strings)
```text
L16 attr:message(Alert): Admin not assigned to a college
L17 attr:description(Alert): You must be assigned to a college to manage quizzes. Contact your administrator.
```

Page closure (13 files; strings in section 4 or above): `src/components/admin/AdminGroupShell.jsx`, `src/components/Common/PageShell.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/components/admin/AdminWorkflowGuide.jsx`, `src/common/adminNavGroups.js`, `src/common/navTabMatching.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/semester-courses`  (file src/pages/college-admin/semester-courses.js)

##### `src/pages/college-admin/semester-courses.js` (branch: both (identical); 2 strings)
```text
L23 attr:message(Alert): Admin not assigned to a college
L24 attr:description(Alert): You must be assigned to a college to view and manage semester-course mapping. Contact your administrator.
```

Page closure (13 files; strings in section 4 or above): `src/components/admin/AdminGroupShell.jsx`, `src/components/Common/PageShell.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/components/admin/AdminWorkflowGuide.jsx`, `src/common/adminNavGroups.js`, `src/common/navTabMatching.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/semesters`  (file src/pages/college-admin/semesters.js)

##### `src/pages/college-admin/semesters.js` (branch: both (identical); 2 strings)
```text
L23 attr:message(Alert): Admin not assigned to a college
L24 attr:description(Alert): You must be assigned to a college to view and manage semesters. Contact your administrator.
```

Page closure (13 files; strings in section 4 or above): `src/components/admin/AdminGroupShell.jsx`, `src/components/Common/PageShell.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/components/admin/AdminWorkflowGuide.jsx`, `src/common/adminNavGroups.js`, `src/common/navTabMatching.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/student-groups`  (file src/pages/college-admin/student-groups.js)

##### `src/pages/college-admin/student-groups.js` (branch: lms-dev-2026 only; 0 strings)
(no user-facing strings)

Page closure (0 files; strings in section 4 or above): 

#### Page `/college-admin/student-groups/[id]`  (file src/pages/college-admin/student-groups/[id].js)

##### `src/pages/college-admin/student-groups/[id].js` (branch: lms-dev-2026 only; 0 strings)
(no user-facing strings)

Page closure (0 files; strings in section 4 or above): 

#### Page `/college-admin/students`  (file src/pages/college-admin/students.js)

##### `src/pages/college-admin/students.js` (branch: both (identical); 2 strings)
```text
L23 attr:message(Alert): Admin not assigned to a college
L24 attr:description(Alert): You must be assigned to a college to view and manage students. Contact your administrator.
```

Page closure (13 files; strings in section 4 or above): `src/components/admin/AdminGroupShell.jsx`, `src/components/Common/PageShell.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/components/admin/AdminWorkflowGuide.jsx`, `src/common/adminNavGroups.js`, `src/common/navTabMatching.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/teachers`  (file src/pages/college-admin/teachers.js)

##### `src/pages/college-admin/teachers.js` (branch: both (identical); 2 strings)
```text
L23 attr:message(Alert): Admin not assigned to a college
L24 attr:description(Alert): You must be assigned to a college to view and manage faculty. Contact your administrator.
```

Page closure (13 files; strings in section 4 or above): `src/components/admin/AdminGroupShell.jsx`, `src/components/Common/PageShell.jsx`, `src/components/admin/ModuleGroupGuard.jsx`, `src/components/admin/AdminWorkflowGuide.jsx`, `src/common/adminNavGroups.js`, `src/common/navTabMatching.js`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/utils/useCollegeFeatureFlags.js`, `src/common/navGroupDefinitions.js`, `src/utils/authUtils.js`, `src/config/appConfig.js`, `src/utils/navigationContext.js`, `src/utils/tenantUtils.js`

#### Page `/college-admin/verification`  (file src/pages/college-admin/verification.js)

##### `src/pages/college-admin/verification.js` (branch: lms-dev-2026 only; 2 strings)
```text
L9 attr:title(PageShell): Profile verification
L9 attr:subtitle(PageShell): Check each student's education and identity against their documents. Verified profiles are what companies and the placement cell rely on.
```

Page closure (4 files; strings in section 4 or above): `src/components/Common/PageShell.jsx`, `src/components/verification/VerificationWorkspace.jsx`, `src/components/Course/Common/CourseSectionHeader.jsx`, `src/components/Common/PanelStates.jsx`

## 4. Component / utility string catalogue (each file once; "used by" = routes importing it, depth<=9 from the page)

#### `src/common/navTabMatching.js` (branch: both (identical); 0 strings)
(no user-facing strings)

#### `src/components/Assignments/ActionAssignment.js` (branch: both (differs); 8 strings)
used by: LEARNER: learn/allAssignments.js | FACULTY: teacher/allAssignments.js
```text
L23 attr:aria-label(button): Edit assignment
L24 attr:title(button): Edit assignment
L29 attr:title(Popconfirm): Delete this assignment?
L30 attr:description(Popconfirm): Learners will no longer be able to view or submit to it. This can't be undone.
L33 attr:okText(Popconfirm): Delete
L36 attr:cancelText(Popconfirm): Cancel
L44 attr:aria-label(button): Delete assignment
L45 attr:title(button): Delete assignment
```

#### `src/components/Assignments/AssignmentsContent.jsx` (branch: both (differs); 78 strings)
used by: LEARNER: learn/allAssignments.js | FACULTY: teacher/allAssignments.js
```text
[DEV] L35 return: ${d} ${monthLabel.slice(0, 3)} ${y}
[DEV] L72 prop:label: Checking submission status…
[DEV] L72 prop:action: View
[DEV] L74 prop:label: Submission status unavailable · retry above
[DEV] L74 prop:action: View
[DEV] L82 prop:label: Graded · ${submission?.pointsObtained ?? 0}/${max}
[DEV] L82 prop:label: Graded
[DEV] L82 prop:action: View
[DEV] L84 prop:label: Submitted late · awaiting grade
[DEV] L84 prop:label: Submitted · awaiting grade
[DEV] L84 prop:action: View
[DEV] L86 prop:label: Submission unavailable · deadline missing
[DEV] L86 prop:action: View
[DEV] L87 prop:label: Closed · not submitted
[DEV] L87 prop:action: View
[DEV] L88 prop:label: Due soon
[DEV] L88 prop:action: Submit
[DEV] L89 prop:label: Not submitted
[DEV] L89 prop:action: Submit
[DEV] L122 prop:label: Submission status unavailable
[DEV] L122 prop:action: View
[DEV] L123 prop:label: Checking submission status…
[DEV] L123 prop:action: View
L133 attr:aria-label(button): View assignment: ${record?.contentTitle || "Untitled"}
L133 attr:aria-label(button): Untitled
L140 child(article): Untitled
[DEV] L146 text(article): Due
L149 text(article): Created:
L167 attr:aria-label(button): View submissions for this assignment
L168 text(article): View Submissions
[DEV] L180 attr:aria-label(button): View report for this assignment
[DEV] L182 text(article): Report
[DEV] L189 child(article): View
L415 child(ul): Untitled
[DEV] L457 prop:content: This assignment has learner submissions and must be kept for assessment history.
[DEV] L466 prop:content: Could not verify submissions, so delete is disabled right now. Retry after the submission check succeeds.
L497 prop:content: Assignment deleted.
L504 prop:message: Failed to delete assignment. Please try again.
L523 attr:placeholder(Select): All courses
L528 prop:label(Select): All courses
[DEV] L533 text(Button): Couldn't load your courses · Retry
L575 attr:title(ListingPageHeader): My Assignments
L575 attr:title(ListingPageHeader): All Assignments
L575 attr:ariaLabel(ListingPageHeader): Assignments overview
[DEV] L578 text(div): Assignments could not be loaded
[DEV] L579 text(div): This is a loading problem, not an empty list. Check your connection and try again.
[DEV] L580 text(div): Retry
L598 attr:title(ListingPageHeader): My Assignments
L598 attr:title(ListingPageHeader): All Assignments
L599 attr:ariaLabel(ListingPageHeader): Assignments overview
L605 text(ListingPageHeader): Create Assignment
L615 text(div): No assignments yet
L617 child(div): Create your first assignment to get started.
L617 child(div): Your assignments will appear here once your teachers add them.
L620 text(div): Create your first assignment
L652 attr:title(ListingPageHeader): My Assignments
L652 attr:title(ListingPageHeader): All Assignments
L653 attr:ariaLabel(ListingPageHeader): Assignments overview
L658 attr:label(MetricPill): ${totalElements} ${totalElements === 1 ? "Assignment" : "Assignments"}
L658 attr:label(MetricPill): Assignment
L658 attr:label(MetricPill): Assignments
L664 attr:label(MetricPill): ${uniqueCoursesCount} ${uniqueCoursesCount === 1 ? "Course" : "Courses"}
L664 attr:label(MetricPill): Course
L664 attr:label(MetricPill): Courses
L666 attr:popoverTitle(MetricPill): Assignments by Course
L673 attr:label(MetricPill): ${thisMonthCount} this month
L675 attr:popoverTitle(MetricPill): This Month's Assignments
L686 text(ListingPageHeader): Create Assignment
[DEV] L696 attr:message(Alert): Assignment was not deleted
[DEV] L699 text(Alert): Retry delete
[DEV] L708 attr:label(RefreshStatus): Refreshing assignments…
[DEV] L713 attr:message(Alert): Couldn't refresh assignments
[DEV] L714 attr:description(Alert): Showing the last assignments we loaded.
[DEV] L715 text(Alert): Retry
L719 attr:aria-label(section): Assignment list
[DEV] L725 attr:message(Alert): Submission status is temporarily unavailable
[DEV] L726 attr:description(Alert): We couldn't verify which assignments you have already submitted. Open an assignment to retry before submitting anything.
[DEV] L727 text(Alert): Retry
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L32 return: ${d ?? "N/A"} / ${monthLabel} / ${y ?? "N/A"}
[PROD-ONLY] L197 call:message.error: Failed to load assignments. Please try again.
```

#### `src/components/Assignments/SubmitAssignmentModal.jsx` (branch: both (differs); 57 strings)
used by: LEARNER: learn/allAssignments.js, learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/allAssignments.js, teacher/courses/[courseId]/[...courseTab].js | COLLEGE: college-admin/courses/[id].js
```text
[DEV] L128 prop:content: Your submission is being sent. Keep this window open until it finishes.
[DEV] L137 prop:content: Wait for the upload to finish before closing this submission.
L158 attr:okText(Modal): Discard
L159 attr:cancelText(Modal): Keep editing
L163 text(Modal): Discard this submission?
L164 text(Modal): You have unsaved work here (a written response, an upload, or a link). Closing now will discard it — it hasn't been submitted yet.
L171 attr:title(DrawerWidget): Submit Your Work
[DEV] L175 attr:secondaryButtonTitle(DrawerWidget): Submission unavailable
[DEV] L175 attr:secondaryButtonTitle(DrawerWidget): Submission closed
[DEV] L175 attr:secondaryButtonTitle(DrawerWidget): Submit
[DEV] L193 attr:message(Alert): Assignment was not submitted
[DEV] L195 text(Alert): Retry
[DEV] L200 text(DrawerWidget): Submitting for
[DEV] L201 child(DrawerWidget): This assignment
[DEV] L202 text(DrawerWidget): Add your work using
[DEV] L203 child(DrawerWidget): any of the methods below — you can combine them
[DEV] L203 child(DrawerWidget): the method below
[DEV] L212 text(DrawerWidget): Written response
L221 prop:title: PDF Uploads
L222 str: Add another PDF
L230 prop:title: File Uploads
L231 str: Add another file
L238 prop:title: Repository Links
L239 str: Add another repository link
L243 prop:placeholder: Paste the repository URL
L247 prop:title: Website / External Links
L248 str: Add another link
L252 prop:placeholder: Paste the link
L278 child(section): ${getSubmissionTypeLabel(type)} ${index + 1}
L280 text(section): Remove
L288 child(section): Uploaded file
[DEV] L294 attr:aria-label(Button): Remove this file
[DEV] L314 child(section): Uploading…
[DEV] L314 child(section): Choose a PDF to upload
[DEV] L314 child(section): Choose a file to upload
[DEV] L315 child(section): Any file
[DEV] L315 text(section): · up to
[DEV] L315 text(section): MB
[DEV] L345 child(section): Or import a PDF from Google Drive
[DEV] L345 child(section): Or import a file from Google Drive
[DEV] L373 attr:placeholder(Input): ${placeholder} (${index + 1})
L374 attr:aria-label(Input): ${getSubmissionTypeLabel(type)} ${index + 1}
[DEV] L383 attr:aria-label(Button): Remove this link
L398 prop:title: Written Response
L408 prop:title: PDF Upload
L420 prop:title: File Upload
L432 prop:title: Repository Link
L443 prop:title: External Link
[DEV] L481 prop:content: This assignment does not have a valid deadline. Submission is unavailable.
[DEV] L490 prop:content: This assignment's deadline has passed. Submissions are closed.
L496 prop:content: Wait for the upload to finish.
L502 prop:content: Add at least one submission before submitting.
L512 prop:content: Assignment submitted successfully.
L525 str: Failed to submit assignment.
L538 call:messageApi.error: File size exceeds ${MAX_FILE_SIZE_MB}MB limit.
L542 call:messageApi.error: Only PDF files are allowed.
L576 prop:content: Upload failed. Try again.
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L152 text(DrawerWidget): Submit your work
[PROD-ONLY] L153 text(DrawerWidget): Use any of the submission methods allowed for this assignment.
[PROD-ONLY] L236 child(div): Upload PDF
[PROD-ONLY] L236 child(div): Upload File
[PROD-ONLY] L266 child(div): Upload PDF from Drive
[PROD-ONLY] L266 child(div): Upload File from Drive
[PROD-ONLY] L281 text(div): Clear
```

#### `src/components/Assignments/ViewAssignmentModal.jsx` (branch: both (differs); 49 strings)
used by: LEARNER: learn/allAssignments.js, learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/allAssignments.js, teacher/courses/[courseId]/[...courseTab].js | COLLEGE: college-admin/courses/[id].js
```text
[DEV] L41 prop:label: Instructions
[DEV] L43 prop:label: File
[DEV] L44 prop:label: Link
[DEV] L48 prop:label: Resource
[DEV] L61 text(div): Open link
L68 child(div): Open PDF
[DEV] L68 child(div): Open file
[DEV] L74 attr:aria-label(Button): Download ${resource?.title || "file"}
L90 text(div): File preview is unavailable right now.
[DEV] L104 return: ${day}, ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
L148 prop:title: Assignment PDF
L262 attr:primaryButtonTitle(DrawerWidget): Close
[DEV] L265 attr:secondaryButtonTitle(DrawerWidget): View Submissions
[DEV] L269 attr:secondaryButtonTitle(DrawerWidget): Checking submission…
[DEV] L271 attr:secondaryButtonTitle(DrawerWidget): Submission status unavailable
L273 attr:secondaryButtonTitle(DrawerWidget): View Submission
[DEV] L275 attr:secondaryButtonTitle(DrawerWidget): Submission unavailable
[DEV] L277 attr:secondaryButtonTitle(DrawerWidget): Submission closed
L278 attr:secondaryButtonTitle(DrawerWidget): Submit Your Work
[DEV] L313 text(DrawerWidget): Your submission
L314 text(DrawerWidget): This is what you submitted for this assignment.
L316 text(DrawerWidget): Back to assignment
L324 attr:description(Empty): We couldn't load your submission. Try closing and reopening this assignment.
[DEV] L333 prop:label: Checking submission status…
[DEV] L335 prop:label: Submission status unavailable
[DEV] L337 prop:label: Submitted
[DEV] L339 prop:label: Submission unavailable · deadline missing
[DEV] L341 prop:label: Closed · not submitted
[DEV] L343 prop:label: Due soon · not submitted
[DEV] L344 prop:label: Not submitted
[DEV] L349 text(DrawerWidget): Due
[DEV] L351 child(DrawerWidget): Deadline unavailable
[DEV] L356 text(DrawerWidget): Status
[DEV] L362 text(DrawerWidget): Submit as
[DEV] L382 text(DrawerWidget): View submissions
[DEV] L383 text(DrawerWidget): See who submitted and grade their work.
[DEV] L393 text(DrawerWidget): View report
[DEV] L394 text(DrawerWidget): Scores, on-time vs. late, and who hasn't submitted.
[DEV] L404 attr:message(Alert): We couldn't verify your submission status
[DEV] L405 attr:description(Alert): Submitting is disabled until we can confirm whether you already submitted this assignment.
[DEV] L407 text(Alert): Retry
[DEV] L418 attr:message(Alert): Submission unavailable
[DEV] L419 attr:description(Alert): This assignment does not have a valid deadline. Submitting is disabled until faculty corrects it.
[DEV] L427 attr:message(Alert): Submissions are closed
[DEV] L428 attr:description(Alert): This assignment's deadline has passed, so new submissions are no longer accepted.
[DEV] L433 text(DrawerWidget): Instructions & resources
[DEV] L439 child(DrawerWidget): Materials shared with students for this assignment.
[DEV] L440 child(DrawerWidget): Read these before you submit your work.
L448 attr:description(Empty): Your faculty hasn't added any resources to this assignment yet.
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L26 child(div): Assignment Resource
[PROD-ONLY] L44 child(div): Open File
[PROD-ONLY] L50 text(div): Download
[PROD-ONLY] L190 text(DrawerWidget): Your Submission
[PROD-ONLY] L206 text(DrawerWidget): Assignment Resources
[PROD-ONLY] L207 text(DrawerWidget): Review the materials your faculty shared before submitting your work.
```

#### `src/components/Attendance/AttendanceContent.jsx` (branch: both (differs); 44 strings)
used by: LEARNER: learn/attendance.js
```text
L62 str: dddd, MMM D
L133 prop:message: Could not load courses
L134 prop:description: You don't have access to courses.
[DEV] L134 prop:description: Something went wrong on our end. Retry to load your courses.
L198 str: ddd, MMM D
L205 text(ul): more
L220 str: ddd, MMM D
L239 prop:label: Course ${c.id ?? c.value}
L279 text(div): Select a course
L280 text(div): Choose a course from the dropdown above to view your attendance records.
L291 text(div): Couldn't load attendance
L292 text(div): Something went wrong loading attendance for this month.
L295 text(div): Retry
L304 text(div): No attendance records
L305 text(div): No classes scheduled for this month. Try selecting a different period.
L313 prop:title: Date
L318 prop:title: Day
L323 prop:title: Class Start Time
L328 prop:title: Status
L346 attr:title(ListingPageHeader): Attendance
L347 attr:ariaLabel(ListingPageHeader): Attendance overview
L352 attr:label(MetricPill): ${classes.length} Total
L357 attr:label(MetricPill): ${presentCount} Present
L359 attr:popoverTitle(MetricPill): Recent Present Dates
L364 attr:label(MetricPill): ${absentCount} Absent
L366 attr:popoverTitle(MetricPill): Absent Dates
L374 attr:aria-label(section): Attendance records
[DEV] L380 attr:message(Alert): Course list unavailable
[DEV] L382 attr:description(Alert): Showing the last course list we loaded. Retry to make sure it is up to date.
[DEV] L383 attr:description(Alert): We couldn't verify your enrolled courses. This is a loading problem, not an empty course list.
L384 text(Alert): Retry
L390 text(div): Course
[DEV] L395 attr:placeholder(Select): Courses unavailable
L395 attr:placeholder(Select): Select course
[DEV] L398 attr:notFoundContent(Select): Couldn't load your courses
L398 attr:notFoundContent(Select): You're not enrolled in any courses yet
L405 attr:aria-label(button): Previous month
L418 attr:aria-label(DatePicker): Jump to month
L420 attr:aria-label(button): Next month
[DEV] L429 text(div): Couldn't load your courses
[DEV] L430 text(div): This is a loading problem, not missing enrolment.
L431 text(div): Retry
[DEV] L438 attr:label(TableSkeleton): Loading attendance for ${date.format("MMMM YYYY")}
[DEV] L447 attr:label(RefreshStatus): Updating attendance for ${date.format("MMMM YYYY")}…
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L121 prop:description: Something went wrong on our end. Please refresh the page to try again.
```

#### `src/components/Attendance/CourseAttendeeHeaderFilters/CourseAttendeeHeaderFilters.js` (branch: both (identical); 3 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js
```text
L64 attr:aria-label(button): Previous month
L78 attr:aria-label(DatePicker): Jump to month
L84 attr:aria-label(button): Next month
```

#### `src/components/Attendance/StudentAttendance/StatusCol.js` (branch: both (differs); 1 strings)
used by: LEARNER: learn/attendance.js, learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js
```text
[DEV] L19 attr:label(StatusBadge): Unknown
```

#### `src/components/Attendance/TakeAttendanceHeaderFilters/TakeAttendanceHeaderFilters.js` (branch: both (differs); 13 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js
```text
[DEV] L24 str: Discard your unsaved attendance changes?
[DEV] L107 call:setScheduleError: Could not load class schedules for this date.
[DEV] L134 attr:message(Alert): Class schedules unavailable
[DEV] L136 text(Alert): Retry
[DEV] L142 attr:aria-label(Select): Class schedules unavailable
L142 attr:aria-label(Select): Select class schedule
[DEV] L142 attr:aria-label(Select): No classes scheduled for this date
[DEV] L148 attr:placeholder(Select): Loading schedules…
[DEV] L148 attr:placeholder(Select): Schedules unavailable
L148 attr:placeholder(Select): Select Schedule
[DEV] L148 attr:placeholder(Select): No classes scheduled
L164 attr:aria-label(DatePicker): Select attendance date
L168 attr:placeholder(DatePicker): Select Date
```

#### `src/components/CalendarComp/CalendarEvents/CalendarEvents.js` (branch: both (differs); 10 strings)
used by: LEARNER: learn/calendar.js | FACULTY: teacher/calendar.js
```text
[DEV] L107 new Error: Invalid class schedule payload
L123 str: Scheduled Class
L154 call:setFetchError: Unable to load class schedule. Please try again.
[DEV] L208 attr:message(Alert): Couldn't load your class, so the schedule can't be shown
L209 text(Alert): Retry
L214 str: Your faculty ID is not set. Contact your administrator.
L215 str: You are not assigned to a class yet. Your schedule will appear here once your class assignment is complete.
L227 text(div): Loading schedule...
L247 text(Alert): Retry
L297 attr:emptyMessage(CalendarMobileList): No scheduled classes this ${activeCalendarState?.view === "day" ? "day" : activeCalendarState?.view || "week"}.
```

#### `src/components/CalendarComp/CalendarMobileList/CalendarMobileList.js` (branch: both (differs); 12 strings)
used by: LEARNER: learn/calendar.js | FACULTY: teacher/calendar.js
```text
L87 return: Today
L88 return: Tomorrow
L89 str: ddd, MMM D
L101 str: No events in this period.
L182 attr:aria-label(button): Previous period
L191 attr:aria-label(button): Next period
L202 attr:aria-label(Button): Go to today
L203 text(div): Today
[DEV] L214 attr:description(Empty): Loading…
L241 attr:aria-label(button): Scheduled event
L250 child(div): – ${formatTime(event.end)}
L256 child(div): · ${event.interviewType}
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L211 attr:description(Empty): Loading...
```

#### `src/components/CalendarComp/CalendarMobileList/MiniCalendar.js` (branch: both (differs); 2 strings)
used by: LEARNER: learn/calendar.js | FACULTY: teacher/calendar.js
```text
L67 attr:aria-label(button): Previous month
L76 attr:aria-label(button): Next month
```

#### `src/components/CalendarComp/ClassScheduleContent.jsx` (branch: both (differs); 42 strings)
used by: LEARNER: learn/calendar.js | FACULTY: teacher/calendar.js
```text
[DEV] L145 new Error: Invalid upcoming class schedule payload
L155 str: Scheduled Class
L211 prop:label: All done for today
L211 prop:label: No classes in view
L215 str: ${courseName.slice(0, 16)}…
L225 str: ddd h:mm A
L255 text(div): Course:
L256 text(div): Time:
L257 text(div): Date:
L257 str: ddd, MMM D, YYYY
L258 text(div): Faculty:
L259 text(div): Room:
L273 attr:aria-label(button): Previous period
L281 child(div): ${moment(date).startOf("week").format("MMM D")} – ${moment(date).endOf("week").format("MMM D, YYYY")}
L282 str: ddd, MMM D, YYYY
L289 attr:aria-label(button): Next period
[DEV] L301 attr:placeholder(Select): All courses
[DEV] L304 attr:aria-label(Select): Filter calendar by course
L308 text(div): Today
L315 prop:label(Select): Month
L316 prop:label(Select): Week
L317 prop:label(Select): Day
[DEV] L320 attr:aria-label(Select): Calendar view
[DEV] L330 attr:title(ListingPageHeader): Class Schedule
[DEV] L330 attr:ariaLabel(ListingPageHeader): Class schedule overview
[DEV] L337 text(div): Loading class schedule
[DEV] L362 attr:title(ListingPageHeader): Class Schedule
[DEV] L363 attr:ariaLabel(ListingPageHeader): Class schedule overview
L368 attr:label(MetricPill): ${eventsToday.length} today
L370 attr:popoverTitle(MetricPill): Today's Classes
L376 attr:label(MetricPill): Next: ${nextUpDisplay.value}
L387 attr:aria-label(section): Calendar
L391 attr:message(Alert): Failed to load course data
L392 attr:description(Alert): Calendar events may be incomplete. Please try refreshing the page.
[DEV] L401 attr:message(Alert): Couldn't load your next classes
[DEV] L402 attr:description(Alert): The calendar below may still show them. Refresh the page to try again.
L409 attr:aria-label(div): Next upcoming classes
L411 text(div): Next classes
L412 text(div): Next 3 upcoming
L422 str: ddd, MMM D
L423 child(div): Class
L424 child(div): · ${item.facultyName}
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L287 attr:ariaLabel(ListingPageHeader): Calendar overview
[PROD-ONLY] L314 attr:ariaLabel(ListingPageHeader): Calendar overview
```

#### `src/components/CalendarComp/MyWeekHeader/MyWeekHeader.js` (branch: both (identical); 0 strings)
(no user-facing strings)

#### `src/components/CalendarComp/StandardCalendar/StandardCalendar.js` (branch: both (differs); 6 strings)
used by: LEARNER: learn/calendar.js | FACULTY: teacher/calendar.js
```text
L119 str: D dddd
L153 str: Duration: ${event.durationMinutes} min
L173 text(div): ALL DAY
L191 attr:aria-label(div): Calendar
L192 child(div): .calendar-wrapper .rbc-time-header-gutter, .calendar-wrapper .rbc-time-gutter { width: 90px !important; min-width: 90px !important; max-width: 90px !important; flex: 0 0 90px !important; } .calendar-wrapper .all-day-text { margin-left: 0 !important; text-align: center !important; width: 100% !important; } @media only screen and (max-width: 768px) { .calendar-wrapper .rbc-time-header-gutter, .calendar-wrapper .rbc-time-gutter { width: 70px !important; min-width: 70px !important; max-width: 70px !important; flex: 0 0 70px !important; } } @media only screen and (max-width: 480px) { .calendar-wrapper .rbc-time-header-gutter, .calendar-wrapper .rbc-time-gutter { width: 55px !important; min-width: 55px !important; max-width: 55px !important; flex: 0 0 55px !important; } }
L230 str: var(--cal-height, calc(100vh - 200px))
```

#### `src/components/CalendarComp/StandardCalendar/index.js` (branch: both (identical); 0 strings)
(no user-facing strings)

#### `src/components/Common/Facts.jsx` (branch: lms-dev-2026 only; 0 strings)
(no user-facing strings)

#### `src/components/Course/Common/CourseTabSkeleton.jsx` (branch: both (differs); 1 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js, learn/courses/[courseId]/index.js | FACULTY: teacher/courses/[courseId]/[...courseTab].js, teacher/courses/[courseId]/index.js
```text
L175 attr:aria-label(div): Loading course
```

#### `src/components/Course/CoursesContent.jsx` (branch: both (differs); 96 strings)
used by: LEARNER: learn/courses/index.js | FACULTY: teacher/courses/index.js
```text
L106 call:setFetchError: Please sign in to view your courses.
L112 call:setFetchError: Faculty access is required to view teaching assignments.
L124 new Error: Invalid Faculty course response
L129 new Error: Invalid Learner course response
L158 str: Your session has expired. Please sign in again.
L159 str: You do not have permission to view these courses.
L160 str: Failed to load courses. Please try again.
[DEV] L166 call:setRefreshError: Could not load the selected semester. Your previous courses are still shown.
L200 new Error: Invalid semesters response
L206 call:setSemestersError: Session expired. Please sign in again.
L206 call:setSemestersError: Could not load semesters.
[DEV] L245 const:OFF_SEMESTER_TEXT: Not your current semester: shown for reference
L298 prop:label: Semester ${semester.semester_number}
L312 prop:name: Unknown section
[DEV] L319 prop:label: All sections (${validCourses.length})
[DEV] L322 prop:label: ${section.name}${section.batch ? ` (${section.batch})` : ""} · ${section.count}
L322 prop:label: (${section.batch})
L325 str: My Courses
L329 text(div): Program:
L330 text(div): Batch:
L331 text(div): Academic Year:
L332 text(div): Semester:
L338 text(div): Semester
L340 attr:placeholder(Select): Select semester
L341 attr:notFoundContent(Select): No semesters found
L342 attr:aria-label(Select): Select semester
[DEV] L355 attr:title(span): Course unavailable
[DEV] L356 child(ul): Reference only
[DEV] L356 child(ul): Locked
[DEV] L356 child(ul): Unavailable
L360 text(ul): Showing first 100; search the full list below.
L368 text(ul): cr
L370 text(div): Total
L370 text(div): Credits
L376 child(ul): (${section.batch})
L382 attr:ariaLabel(ListingPageHeader): Courses overview
L388 attr:popoverTitle(MetricPill): Semester Details
L390 attr:label(MetricPill): ${validCourses.length} Teaching ${validCourses.length === 1 ? "assignment" : "assignments"}
L391 attr:label(MetricPill): ${validCourses.length} ${validCourses.length === 1 ? "Course" : "Courses"}
L391 attr:label(MetricPill): Course
L391 attr:label(MetricPill): Courses
L392 attr:popoverTitle(MetricPill): Teaching Assignments
L392 attr:popoverTitle(MetricPill): All Courses
L393 attr:label(MetricPill): ${totalCredits} Credits
L394 attr:popoverTitle(MetricPill): Credits Breakdown
L396 attr:label(MetricPill): ${sections.length} ${sections.length === 1 ? "Section" : "Sections"}
L396 attr:label(MetricPill): Section
L396 attr:label(MetricPill): Sections
[DEV] L402 attr:aria-label(Select): Filter by section
[DEV] L404 attr:aria-label(Segmented): Filter by course type
[DEV] L407 text(Segmented): All
[DEV] L408 text(Segmented): Regular
[DEV] L409 text(Segmented): Electives
L411 attr:title(Popover): Filters
L416 text(ListingPageHeader): Retry semesters
L417 attr:placeholder(Input): Search courses…
L420 attr:aria-label(Input): Search courses
L427 attr:aria-label(section): Course list
[DEV] L428 text(div): Loading courses
L447 text(div): Try again
L455 attr:description(Empty): No teaching assignments found. Please contact your administrator.
L457 attr:description(Empty): Your class is not configured. Please contact your administrator.
L458 attr:description(Empty): Your batch is not configured. Please contact your administrator.
L459 attr:description(Empty): Your program is not configured. Please contact your administrator.
L460 attr:description(Empty): No courses found for ${semesterLabel || "the selected semester"}.
L460 attr:description(Empty): the selected semester
L461 text(div): The requested semester was unavailable; showing your current semester instead.
[DEV] L471 text(div): Updating courses for the selected semester…
[DEV] L477 text(div): Retry
L480 text(div): The requested semester was unavailable; showing your current semester instead.
L483 text(div): Some course records have incomplete or duplicate information. Unavailable cards cannot be opened. Please contact your administrator.
L486 text(div): Some course credit values are invalid and have been excluded from the total.
L489 attr:aria-label(section): Course list
L492 child(div): Showing ${displayedCourses.length} of ${currentCourses.length} records
L493 child(div): · ${visibleLimit} currently displayed
L497 text(div): No courses match “
[DEV] L502 child(div): No electives to show right now.
[DEV] L502 child(div): No regular courses to show — everything this semester is an elective.
[DEV] L505 text(div): No teaching assignments in this section.
L514 attr:alt(CourseImage): ${course.name} course thumbnail
[DEV] L519 text(div): Your role:
[DEV] L520 child(div): Co-teacher
L522 text(div): Incomplete assignment data
L524 child(div): Unknown section
L524 child(div): (${course.batchName})
[DEV] L528 child(div): Elective
L529 text(div): Instructor:
L530 child(div): Not assigned
L536 child(div): ${safeCredits(course.credits)} Credits
L536 child(div): Credits unavailable
L539 text(div): Semester
[DEV] L548 text(div): Electives
[DEV] L557 str: Course locked
L557 str: Course link unavailable
L567 text(div): Show more courses (
L568 text(div): remaining)
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L258 text(ul): — Unavailable
[PROD-ONLY] L391 child(div): Co-Teacher
```

#### `src/components/Course/Home/AtRiskStudentsCard.jsx` (branch: lms-dev-2026 only; 16 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js
```text
L59 attr:aria-label(section): At-risk students
L66 text(section): At-risk Students
L69 child(section): Checking attendance and submissions…
L71 child(section): No major learner risk signals
L72 child(section): Needs attendance or submission follow-up
L79 text(section): critical
L82 text(section): moderate
L93 text(section): Every student is tracking well on attendance and submissions.
L116 text(section): % risk
L122 text(section): Attendance
L126 str: ${Math.max(4, student.attendancePercent)}%
L134 text(section): Submissions missing
L140 text(section): Average grade
L144 str: ${Math.max(4, average.avgPercent)}%
L182 child(section): View all ${students.length} students
L182 child(section): View students
```

#### `src/components/Course/Home/InThisCourseSection.jsx` (branch: both (differs); 7 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js | COLLEGE: college-admin/courses/[id].js
```text
L52 attr:aria-label(section): Course overview
[DEV] L53 text(section): Loading course overview
L74 attr:aria-label(section): Course overview
L77 text(section): About this course
L82 text(section): Credits
L136 text(section): Show less
L138 text(section): Read more
```

#### `src/components/Course/Home/PerformanceCard.jsx` (branch: lms-dev-2026 only; 14 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js
```text
L34 str: Below 60%
L45 attr:aria-label(section): Performance
L50 text(section): Performance
L53 child(section): Averaging graded work…
L55 child(section): No graded submissions yet
L56 child(section): Average across graded work
L70 text(section): Grade a few submissions to see the class's score spread here.
L77 text(section): is the weakest spot right now, averaging
L77 text(section): % across
L78 text(section): graded
L83 text(section): is the strongest spot, averaging
L83 text(section): % across
L84 text(section): graded
L88 text(section): View all assessments
```

#### `src/components/Course/Home/UnifiedActivityList.jsx` (branch: both (differs); 20 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js
```text
L21 return: ${isTeacherRoute ? "/teacher" : "/learn"}/courses/${courseIdentifier}
L31 return: ${getCourseBasePath(router, courseIdentifier)}/${tab}?filter=${filterKey}
L109 attr:aria-label(section): Recent updates
L110 text(section): Recent updates
[DEV] L111 text(section): Loading recent updates
L122 attr:aria-label(section): Recent updates
L123 text(section): Recent updates
L144 child(section): Quiz
L144 child(section): Assignment
L144 text(section): due
L146 child(section): Untitled
L158 str: ${msg.slice(0, 100)}…
L167 child(section): Course update
L183 child(section): Show less
L183 child(section): Read more
L199 child(section): Scheduled class
L217 text(section): Assessments
L225 str: ${getCourseBasePath(router, courseIdentifier)}/discussions
L226 text(section): Discussions
L231 text(section): Live Sessions
```

#### `src/components/Course/Home/index.js` (branch: both (differs); 0 strings)
(no user-facing strings)

#### `src/components/Course/Syllabus/ContentCompletionCheck.jsx` (branch: both (identical); 2 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js | COLLEGE: college-admin/courses/[id].js
```text
L24 attr:aria-label(span): Completed
L25 attr:title(span): Completed
```

#### `src/components/Course/Syllabus/ContentProgressBadge.jsx` (branch: both (differs); 7 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js | COLLEGE: college-admin/courses/[id].js
```text
L6 prop:label: Completed
L7 prop:label: Completed
L8 prop:label: Submitted
L9 prop:label: Graded
L10 prop:label: In progress
L11 prop:label: Not started
L54 text(div): % watched
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L10 str: rgba(5, 150, 105, 0.25)
[PROD-ONLY] L17 str: rgba(5, 150, 105, 0.25)
[PROD-ONLY] L24 str: rgba(5, 150, 105, 0.25)
[PROD-ONLY] L31 str: rgba(5, 150, 105, 0.25)
[PROD-ONLY] L38 str: rgba(38, 186, 199, 0.3)
```

#### `src/components/Course/Syllabus/ContentTitle.jsx` (branch: both (differs); 15 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js | COLLEGE: college-admin/courses/[id].js
```text
L34 prop:label: Live Class
L39 prop:label: Video
L40 str: YouTube Video
L40 prop:label: YouTube
L41 prop:label: Resource
[DEV] L42 prop:label: Quiz
[DEV] L43 prop:label: Assignment
L44 str: Live Class
L45 str: Live session
L48 prop:label: Content
[DEV] L91 child(div): | ${!content?.classId || content?.classId < 1 ? "All sections" : (classNames[content?.classId] || "One section")}
[DEV] L91 child(div): All sections
[DEV] L91 child(div): One section
L108 child(div): Shared with your class
L108 child(div): For your class
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L86 child(div): | ${!content?.classId || content?.classId < 1 ? "Admin" : "Teacher"}${content?.classId > 0 ? ` | ${classNames[content?.classId] || ""}` : ""}
[PROD-ONLY] L86 child(div): Admin
[PROD-ONLY] L86 child(div): Teacher
[PROD-ONLY] L87 child(div): | ${classNames[content?.classId] || ""}
```

#### `src/components/Course/Syllabus/LessonActivityCards.jsx` (branch: lms-dev-2026 only; 31 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js | COLLEGE: college-admin/courses/[id].js
```text
L35 child(div): ${due.getTime() < Date.now() ? "Was due" : "Due"} ${formatDue(due)}
L35 child(div): Was due
L35 child(div): Due
L35 child(div): No due date
L59 prop:label: Submission status unavailable
L61 prop:label: Submitted
L63 prop:label: Submission unavailable · deadline missing
L65 prop:label: Closed · not submitted
L66 prop:label: Not submitted
L75 attr:actionLabel(ActivityCard): Open assignment
L75 attr:actionLabel(ActivityCard): View submission
L75 attr:actionLabel(ActivityCard): View assignment
L75 attr:actionLabel(ActivityCard): Open & submit
L104 prop:label: Draft · hidden from students
L106 prop:label: Submitted · retake available
L106 prop:label: Submitted
L108 prop:label: Unavailable · deadline missing
L110 prop:label: Missed · not attempted
L111 prop:label: Not attempted
L113 str: Preview quiz
L117 str: View answers
L117 str: Review quiz
L119 str: Retake quiz
L119 str: Review attempt
L120 str: Start quiz
L149 str: Start quiz
L149 str: Retake quiz
L160 attr:title(Modal): Quiz
L166 attr:title(iframe): Quiz
L169 str: min(calc(100dvh - 180px), 720px)
L169 str: min(680px, calc(100dvh - 180px))
```

#### `src/components/Course/Syllabus/LessonProgressBar.jsx` (branch: both (identical); 11 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js | COLLEGE: college-admin/courses/[id].js
```text
L16 return: Lesson complete!
L17 return: Almost there!
L18 return: Keep going!
L19 return: Great progress!
L20 return: You're in motion!
L21 return: Your first step awaits
L28 text(div): of
L28 text(div): complete
L35 text(div): Continue from here →
L43 str: scaleX(${percent / 100})
L48 attr:aria-label(div): ${completedCount} of ${total} items complete
```

#### `src/components/Course/Syllabus/MarkCompleteButton.jsx` (branch: both (differs); 4 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js | COLLEGE: college-admin/courses/[id].js
```text
L23 text(div): Marked as complete
L37 call:message.error: Could not mark this as complete. Please try again.
[DEV] L46 attr:title(Button): Completion state is unavailable. Retry the lesson state first.
L46 text(div): Mark as complete
```

#### `src/components/Course/Syllabus/VideoDrawer.jsx` (branch: both (differs); 20 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js | COLLEGE: college-admin/courses/[id].js
```text
L35 attr:title(DrawerWidget): Update Video
L35 attr:title(DrawerWidget): Upload New Video
L40 attr:primaryButtonTitle(DrawerWidget): Cancel
L41 attr:secondaryButtonTitle(DrawerWidget): Submit
L62 attr:name(Form): basic
L76 attr:name(Form.Item): contentTitle
L80 prop:message(Form.Item): Enter Video Title
L85 attr:placeholder(Input): Enter Video Title
L92 attr:name(Form.Item): points
L103 attr:placeholder(Input): Enter Points
L112 attr:name(Form.Item): video
L116 prop:message(Form.Item): Upload Video
L124 new Error: Upload Video
L144 text(DrawerWidget): Choose File
L223 prop:content: Video Updated Successfully
L224 prop:content: Video Created Successfully
L236 prop:content: Failed To Update
L236 prop:content: Failed To Create
L267 prop:content: Server error. Please try uploading again. (Max file size: 200MB)
L282 call:message.error: ${file.name} is not a video file
```

#### `src/components/Course/Syllabus/YoutubeDrawer.jsx` (branch: both (differs); 20 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js | COLLEGE: college-admin/courses/[id].js
```text
L31 attr:title(DrawerWidget): Update Youtube Video
L31 attr:title(DrawerWidget): New Youtube Video
L37 attr:primaryButtonTitle(DrawerWidget): Cancel
L38 attr:secondaryButtonTitle(DrawerWidget): Submit
L58 attr:name(Form): basic
L74 attr:name(Form.Item): contentTitle
L78 prop:message(Form.Item): Enter Content Title
L84 attr:placeholder(Input): Enter Youtube Video Title
L93 attr:name(Form.Item): points
L99 prop:message(Form.Item): Points must be between 0 and 1000
L106 attr:placeholder(Input): Enter Points
L117 attr:name(Form.Item): youtubeLink
L121 prop:message(Form.Item): Enter youtube link
[DEV] L128 new Error: Paste a YouTube video link (watch, youtu.be or Shorts)
L146 prop:name: youtubeLink
L146 str: Invalid YouTube URL
L208 prop:content: YouTube Video Updated Successfully
L209 prop:content: YouTube Video Created Successfully
L222 prop:content: Failed To Update
L223 prop:content: Failed To Create
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L125 prop:message(Form.Item): Please provide a valid Youtube URL
```

#### `src/components/ErrorBoundary/CalendarErrorBoundary.js` (branch: both (differs); 3 strings)
used by: LEARNER: learn/calendar.js | FACULTY: teacher/calendar.js
```text
L34 attr:message(Alert): Calendar failed to render
L35 attr:description(Alert): An error occurred while displaying the calendar. This may be caused by malformed event data. Try refreshing.
L38 text(Alert): Try Again
```

#### `src/components/ErrorBoundary/JobsErrorBoundary.js` (branch: both (differs); 4 strings)
used by: COLLEGE: college-admin/jobs/[jobId]/applications.js, college-admin/jobs/[jobId]/index.js, college-admin/jobs/[jobId]/interviews.js, college-admin/jobs/[jobId]/settings.js (+3 more)
```text
L33 attr:message(Alert): Something went wrong
L34 attr:description(Alert): An error occurred while loading this page. This may be caused by unexpected data. Try refreshing or go back.
L38 text(Alert): Try Again
L42 text(Alert): Go Back
```

#### `src/components/Global/Button/PencilUploadButton.jsx` (branch: both (differs); 3 strings)
used by: LEARNER: learn/profile.js | FACULTY: teacher/profile.js | COLLEGE: college-admin/profile.js
```text
L170 attr:modalTitle(ImgCrop): Crop Profile Picture
L201 attr:aria-label(button): Upload profile picture
L228 text(div): Drive image
```

#### `src/components/Global/Button/uploadButton.jsx` (branch: both (differs); 0 strings)
(no user-facing strings)

#### `src/components/Global/CardHeader/cardHeader.js` (branch: both (differs); 1 strings)
used by: LEARNER: learn/profile.js | FACULTY: teacher/profile.js | COLLEGE: college-admin/profile.js
```text
L15 str: ln-lto-reg clrB517
```

#### `src/components/Global/Editor/editor.js` (branch: both (identical); 1 strings)
used by: LEARNER: learn/allAssignments.js, learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/allAssignments.js, teacher/courses/[courseId]/[...courseTab].js | COLLEGE: college-admin/courses/[id].js
```text
L43 prop:placeholder: Start Typing...
```

#### `src/components/Global/ListingPageHeader/ListingPageHeader.jsx` (branch: both (differs); 0 strings)
(no user-facing strings)

#### `src/components/Global/MetricPill/MetricPill.jsx` (branch: both (differs); 0 strings)
(no user-facing strings)

#### `src/components/Global/Offcanvas/Assignment/newAssignment.js` (branch: both (differs); 82 strings)
used by: LEARNER: learn/allAssignments.js, learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/allAssignments.js, teacher/courses/[courseId]/[...courseTab].js | COLLEGE: college-admin/courses/[id].js
```text
L23 prop:label: This class only
L24 prop:label: Shared to all sections
L53 return: Course ${course?.course_id ?? course?.courseId}
L71 return: Instructions title
L73 return: PDF title
L75 return: File title
L77 return: Link title
L79 return: Resource title
[DEV] L183 call:setCoursesError: Could not load your assigned courses.
[DEV] L207 call:setLessonsError: Could not load lessons for this course.
L333 prop:content: File upload failed. Try again.
L367 prop:content: Add at least one assignment resource.
L373 prop:content: Give each assignment resource a title.
[DEV] L383 prop:content: Wait for resource uploads to finish before closing.
[DEV] L391 prop:title: Discard assignment changes?
[DEV] L391 prop:title: Discard this assignment draft?
[DEV] L392 prop:content: Your unsaved assignment details and resources will be lost.
[DEV] L393 prop:okText: Discard
[DEV] L395 prop:cancelText: Keep editing
L409 prop:content: Wait for resource uploads to finish.
L414 prop:content: Choose at least one learner submission method.
L495 prop:content: Assignment updated successfully
L495 prop:content: Assignment created successfully
L509 str: Failed to update assignment
L509 str: Failed to create assignment
L531 attr:title(DrawerWidget): Edit Assignment
L533 attr:title(DrawerWidget): Create Assignment · ${lesson.lessonName}
L534 attr:title(DrawerWidget): Create New Assignment
[DEV] L539 attr:secondaryButtonTitle(DrawerWidget): Updating…
[DEV] L539 attr:secondaryButtonTitle(DrawerWidget): Creating…
L539 attr:secondaryButtonTitle(DrawerWidget): Update Assignment
L539 attr:secondaryButtonTitle(DrawerWidget): Create Assignment
[DEV] L557 attr:message(Alert): Could not verify learner submissions
[DEV] L559 attr:message(Alert): Checking learner submissions…
[DEV] L560 attr:message(Alert): Learner submissions exist
[DEV] L562 attr:description(Alert): Assessment-defining fields are locked for safety. You can still correct the assignment title.
[DEV] L564 attr:description(Alert): Deadline, points, audience, resources and submission methods stay locked until this check finishes.
[DEV] L565 attr:description(Alert): Deadline, points, audience, resources and submission methods are locked so submitted work is graded against the rules learners actually received. You can still correct the title.
L570 text(DrawerWidget): Assignment Details
L572 attr:name(Form.Item): contentTitle
L574 prop:message(Form.Item): Enter assignment title
L576 attr:placeholder(Input): Assignment title
L580 text(DrawerWidget): Visibility
L581 attr:name(Form.Item): contentScope
[DEV] L590 text(DrawerWidget): Only a college admin can change an assignment's visibility after it's created.
[DEV] L603 attr:message(Alert): Could not load courses
[DEV] L605 text(Alert): Retry
L609 attr:name(Form.Item): course
L611 prop:message(Form.Item): Select course
[DEV] L619 attr:placeholder(Select): Loading courses…
[DEV] L619 attr:placeholder(Select): Courses unavailable
L619 attr:placeholder(Select): Select course
[DEV] L641 attr:message(Alert): Could not load lessons
[DEV] L644 text(Alert): Retry
L649 attr:name(Form.Item): lesson
L651 prop:message(Form.Item): Select lesson
[DEV] L659 attr:placeholder(Select): Loading lessons…
[DEV] L659 attr:placeholder(Select): Lessons unavailable
L659 attr:placeholder(Select): Select lesson
[DEV] L670 text(DrawerWidget): Course and lesson can't be changed once an assignment exists — create a new one instead.
L680 attr:name(Form.Item): points
[DEV] L689 new Error: Enter a whole number from 1 to 1000
L693 attr:placeholder(Input): Enter points
L699 attr:name(Form.Item): due_date
L701 prop:message(Form.Item): Select due date
[DEV] L717 new Error: Due date can't be before today
L738 text(DrawerWidget): Assignment Resources
L739 text(DrawerWidget): Add the instructions, files, or links learners need to complete this assignment.
L740 text(DrawerWidget): Instructions can be added once. PDF, file, and link resources can be added multiple times.
L757 text(DrawerWidget): Add resource
L768 child(DrawerWidget): Resource
L770 text(DrawerWidget): Remove
L796 attr:placeholder(Input): Paste the reference link
[DEV] L815 attr:aria-label(Button): Remove attached file
L830 prop:content: Only PDF files are allowed here.
L849 child(DrawerWidget): Upload PDF
L849 child(DrawerWidget): Upload File
[DEV] L856 text(DrawerWidget): or
L875 child(DrawerWidget): Upload PDF from Drive
L875 child(DrawerWidget): Upload File from Drive
L886 text(DrawerWidget): How Learners Can Submit
L887 text(DrawerWidget): Choose how learners are allowed to submit their work.
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L571 text(DrawerWidget): Attached:
```

#### `src/components/Global/Offcanvas/Attendance/SheduleClassDrawer.js` (branch: both (differs); 20 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js
```text
[DEV] L35 call:message.info: Wait for the class schedule to finish saving.
[DEV] L43 prop:title: Discard class schedule changes?
[DEV] L44 prop:content: The date, time and class details in this drawer have not been scheduled yet.
[DEV] L45 prop:okText: Discard changes
[DEV] L47 prop:cancelText: Keep editing
L72 attr:title(DrawerWidget): Schedule Class
L73 attr:primaryButtonTitle(DrawerWidget): Cancel
L74 attr:secondaryButtonTitle(DrawerWidget): Scheduling…
L74 attr:secondaryButtonTitle(DrawerWidget): Schedule
L102 attr:name(Form): basic
L118 attr:name(Form.Item): date
L122 prop:message(Form.Item): Select Date
L133 attr:name(Form.Item): startTime
L139 prop:message(Form.Item): Select Start Time
L150 attr:name(Form.Item): endTime
L151 attr:dependencies(Form.Item): startTime
L156 prop:message(Form.Item): Select End Time
L166 new Error: End time must be after start time
[DEV] L171 new Error: A class can be at most 12 hours. Check AM/PM.
L180 text(DrawerWidget): Course
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L116 new Error: Start time cannot be in the past
```

#### `src/components/Global/Offcanvas/Syallabus/AddLessonDrawer.jsx` (branch: both (differs); 19 strings)
used by: COLLEGE: college-admin/courses/[id].js
```text
L9 prop:label: This class only
L10 prop:label: Shared to all sections
L26 return: A lesson with this name already exists in this course.
L28 return: Failed to create lesson. Please try again.
[DEV] L48 str: Discard this unsaved lesson draft?
[DEV] L52 str: Route change aborted to preserve unsaved lesson draft.
[DEV] L76 prop:title: Discard this lesson draft?
[DEV] L77 prop:content: Your unsaved lesson name and visibility choice will be lost.
[DEV] L78 prop:okText: Discard
[DEV] L80 prop:cancelText: Keep editing
L115 call:message.success: Lesson created successfully!
L130 attr:title(DrawerWidget): Add Lesson
L137 attr:secondaryButtonTitle(DrawerWidget): Saving...
L137 attr:secondaryButtonTitle(DrawerWidget): Save
L161 attr:name(Form.Item): Content_Name
L166 prop:message(Form.Item): Enter lesson name
L173 attr:placeholder(Input): Enter lesson name
L179 text(DrawerWidget): Visibility
L180 attr:name(Form.Item): contentScope
```

#### `src/components/Global/Offcanvas/Syallabus/AddNewLessonContentDrawer.js` (branch: both (differs); 25 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js | COLLEGE: college-admin/courses/[id].js
```text
L14 str: Live Sessions
L20 str: Add Video
L21 str: Add Resource
L22 str: Add Live Session
[DEV] L43 str: Discard this unsaved content draft?
[DEV] L47 str: Route change aborted to preserve unsaved lesson content.
L63 str: AddNewLessonContentDrawer: unknown contentMode "${contentMode}"
[DEV] L85 prop:title: Discard this content draft?
[DEV] L86 prop:content: Your unsaved content will be lost.
[DEV] L87 prop:okText: Discard
[DEV] L89 prop:cancelText: Keep editing
[DEV] L119 prop:title: Discard this content draft?
[DEV] L120 prop:content: Your unsaved content will be lost.
[DEV] L121 prop:okText: Discard
[DEV] L123 prop:cancelText: Keep editing
L131 attr:title(DrawerWidget): Add New Content
L137 attr:primaryButtonTitle(DrawerWidget): Cancel
L149 text(DrawerWidget): Upload Video
L152 text(DrawerWidget): YouTube Video
L190 attr:title(DrawerWidget): Add Video
L190 attr:title(DrawerWidget): Add Resource
L190 attr:title(DrawerWidget): Add Live Session
L199 text(DrawerWidget): Upload Video
L202 text(DrawerWidget): YouTube Video
L214 str: Live Sessions
```

#### `src/components/Global/Offcanvas/Syallabus/ResourceComposer.js` (branch: both (differs); 44 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js | COLLEGE: college-admin/courses/[id].js
```text
L35 prop:title: Link
L40 prop:title: File
L96 call:setError: Select a course or class before uploading a Resource.
L100 call:setError: Supported files: PDF, Word, text, PowerPoint, Excel, CSV and images, up to 50 MB each.
L104 call:setError: A Resource can contain at most ${MAX_MATERIALS} materials.
L118 new Error: Upload completed without a storage key
L130 call:messageApi.success: Resource files uploaded
L132 call:setError: Resource upload failed
L142 call:setError: Enter a valid HTTPS URL without credentials or spaces.
L146 call:setError: A Resource can contain at most ${MAX_MATERIALS} materials.
L150 call:setError: This link has already been added.
L161 call:setError: Enter a Resource title (up to 255 characters).
L164 call:setError: Select a lesson before adding a Resource.
L167 call:setError: A class assignment is required to add Resources.
L170 call:setError: Add a file, HTTPS link, or notes before saving.
L195 call:message.success: Resource updated
L215 call:message.success: Resource saved
L219 call:setError: Could not save Resource
L227 attr:aria-label(div): Resource composer
L230 text(div): Resource title
L231 attr:placeholder(Input): e.g. Week 2 reading pack
L235 text(div): Visibility
L237 prop:label(Select): This class only
L238 prop:label: Shared across sections
L240 text(div): Remove uploaded files before changing visibility.
L243 text(div): Notes (optional)
L244 attr:placeholder(Input.TextArea): Context for learners
L245 text(div): This Resource also has formatted text, which is kept when you save.
L246 text(div): Files
L248 attr:aria-label(input): Upload Resource files
L251 text(div): Add files
L252 text(div): External links
L253 attr:placeholder(Input): Link title (optional)
L253 attr:aria-label(Input): Resource link title
L254 attr:placeholder(Input): https://example.org/reading
L254 attr:aria-label(Input): Resource link URL
L255 text(div): Add link
L257 attr:aria-label(ul): Resource materials
L260 child(div): File
L260 child(div): Link
L261 attr:aria-label(Button): Remove ${material.title}
L268 text(div): Cancel
L269 child(div): Save changes
L269 child(div): Save Resource
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L222 text(div): Only an administrator can publish a Resource across sections.
```

#### `src/components/Global/Offcanvas/Syallabus/liveclass.js` (branch: both (differs); 54 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js | COLLEGE: college-admin/courses/[id].js
```text
L27 prop:label: This class only
L28 prop:label: Shared to all sections
[DEV] L119 call:message.warning: Live class saved, but it was not added to the calendar${reason ? `: ${reason}` : "."}
[DEV] L119 call:message.warning: : ${reason}
L129 call:message.warning: Please enter a meeting link!
L134 call:message.error: Please use a valid meeting link (Zoom, Teams, Meet, Webex, or Whereby). Only HTTPS links are allowed.
L139 call:message.error: Lesson not found. Please select a lesson first.
[DEV] L147 str: The selected start time has already passed in India Standard Time. Pick a future time before saving.
L148 prop:name: startTime
[DEV] L153 str: The end time must be after the start time.
L154 prop:name: endTime
[DEV] L159 str: A live class can be at most 12 hours. Check the end date and AM/PM.
L160 prop:name: endTime
L211 prop:message: Server Notification
L212 prop:description: Live class created successfully
[DEV] L225 str: The live class could not be saved. Your draft is still here.
[DEV] L240 attr:message(Alert): Live class was not saved
[DEV] L242 text(Alert): Retry
L264 attr:name(Form.Item): title
L265 attr:label(Form.Item): Live Class Title
L266 prop:message(Form.Item): Please enter a title
L269 attr:placeholder(Input): e.g., Introduction to Data Structures
L274 attr:name(Form.Item): description
L274 attr:label(Form.Item): Description
L275 attr:placeholder(TextArea): Brief description of the live class
L280 attr:name(Form.Item): contentScope
L280 attr:label(Form.Item): Visibility
L287 text(div): Choose whether this live session is only for the current class or shared across all sections.
L294 attr:name(Form.Item): meetingLink
L295 attr:label(Form.Item): Meeting Link
L297 prop:message(Form.Item): Please enter a meeting link
L298 prop:message(Form.Item): Please enter a valid URL
L302 attr:placeholder(Input): e.g., https://zoom.us/j/... or https://teams.microsoft.com/...
L309 attr:name(Form.Item): startDate
L310 attr:label(Form.Item): Start Date
L311 prop:message(Form.Item): Required
L322 attr:name(Form.Item): startTime
L323 attr:label(Form.Item): Start Time
L324 prop:message(Form.Item): Required
L347 attr:name(Form.Item): endDate
L348 attr:label(Form.Item): End Date
L349 prop:message(Form.Item): Required
L360 attr:name(Form.Item): endTime
L361 attr:label(Form.Item): End Time
L362 attr:dependencies(Form.Item): startDate
L362 attr:dependencies(Form.Item): startTime
L362 attr:dependencies(Form.Item): endDate
L364 prop:message(Form.Item): Required
[DEV] L375 new Error: Must be after the start
[DEV] L379 new Error: A live class can be at most 12 hours. Check the end date and AM/PM.
[DEV] L397 text(div): Times are in India Standard Time (IST).
L399 attr:name(Form.Item): points
L399 attr:label(Form.Item): Points
L404 text(div): Save Live Class
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L174 prop:description: Internal Server Error
[PROD-ONLY] L308 attr:name(Form.Item): timeZone
[PROD-ONLY] L308 attr:label(Form.Item): Time Zone
[PROD-ONLY] L310 text(div): Asia/Kolkata (IST)
[PROD-ONLY] L311 text(div): UTC
[PROD-ONLY] L312 text(div): America/New_York (EST)
[PROD-ONLY] L313 text(div): America/Los_Angeles (PST)
[PROD-ONLY] L316 text(div): Europe/London (GMT)
```

#### `src/components/Global/Offcanvas/Syallabus/preview.js` (branch: both (identical); 0 strings)
(no user-facing strings)

#### `src/components/Global/Offcanvas/Syallabus/videoform.js` (branch: both (differs); 31 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js | COLLEGE: college-admin/courses/[id].js
```text
L39 prop:label: This class only
L40 prop:label: Shared to all sections
L128 prop:content: Server Error Please upload once
L181 text(div): Title
L185 text(div): Total Points
L189 text(div): Video
L205 prop:content: Please fill required data
L219 call:message.error: ${file.name} is not a video file
L272 prop:message: Server Notification
L273 prop:description: Successfully Saved
L287 prop:message: Server Notification
L288 prop:description: Internal Server Error
L308 attr:name(Form): VideoForm
L330 text(Form): Content Name
L332 attr:name(Form.Item): Content_Name
L336 prop:message(Form.Item): Enter Content name
L348 text(Form): Visibility
L349 attr:name(Form.Item): contentScope
L356 text(Form): Choose whether this content is only for the current class or shared across all sections.
L364 text(Form): File
L366 attr:name(Form.Item): Assignment_file
L371 prop:message(Form.Item): Upload file
L397 text(Form): Choose File
L407 text(Form): Points
L409 attr:name(Form.Item): Pdf_Points
L413 prop:message(Form.Item): Enter key point
L440 text(Form): Cancel
L452 text(Form): Next
L464 text(Form): Previous
L474 child(Form): Submitting...
L474 child(Form): Submit
```

#### `src/components/Global/Offcanvas/Syallabus/youtube.js` (branch: both (differs); 27 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js | COLLEGE: college-admin/courses/[id].js
```text
L20 prop:label: This class only
L21 prop:label: Shared to all sections
L86 text(div): Title
L91 text(div): Video
L95 attr:title(iframe): YouTube video preview
L99 attr:allow(iframe): autoplay; encrypted-media; picture-in-picture; fullscreen
L115 prop:content: Please fill required data
L174 prop:message: Server Notification
L175 prop:description: Successfully Saved
L189 prop:message: Server Notification
L190 prop:description: Internal Server Error
L210 attr:name(Form): PDFForm
L232 text(Form): Content Name
L234 attr:name(Form.Item): Content_Name
L238 prop:message(Form.Item): Enter Content name
L248 text(Form): Youtube link
L250 attr:name(Form.Item): Youtube_link
L254 prop:message(Form.Item): Enter youtube link
[DEV] L261 new Error: Paste a YouTube video link (watch, youtu.be or Shorts)
L271 text(Form): Visibility
L272 attr:name(Form.Item): contentScope
L279 text(Form): Choose whether this content is only for the current class or shared across all sections.
L301 text(Form): Cancel
L312 text(Form): Next
L324 text(Form): Previous
L334 child(Form): Submitting...
L334 child(Form): Submit
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L259 prop:message(Form.Item): Please provide a valid Youtube URL
```

#### `src/components/Global/RichTextEditor/RichTextDisplay.jsx` (branch: both (differs); 1 strings)
used by: LEARNER: learn/my-placements/jobs/[jobId].js, learn/profile.js | FACULTY: teacher/profile.js | COLLEGE: college-admin/profile.js
```text
[DEV] L54 child(div): .rich-text-display ul, .rich-text-display ol { margin: 8px 0; padding-left: 24px; } .rich-text-display li { margin: 4px 0; } .rich-text-display p { margin: 8px 0; } .rich-text-display p:first-child { margin-top: 0; } .rich-text-display p:last-child { margin-bottom: 0; } .rich-text-display strong, .rich-text-display b { font-weight: 600; } .rich-text-display em, .rich-text-display i { font-style: italic; } .rich-text-display u { text-decoration: underline; } .rich-text-display a { color: #0a7c88; text-decoration: none; } .rich-text-display a:hover { text-decoration: underline; }
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L51 child(div): .rich-text-display ul, .rich-text-display ol { margin: 8px 0; padding-left: 24px; } .rich-text-display li { margin: 4px 0; } .rich-text-display p { margin: 8px 0; } .rich-text-display p:first-child { margin-top: 0; } .rich-text-display p:last-child { margin-bottom: 0; } .rich-text-display strong, .rich-text-display b { font-weight: 600; } .rich-text-display em, .rich-text-display i { font-style: italic; } .rich-text-display u { text-decoration: underline; } .rich-text-display a { color: #1890ff; text-decoration: none; } .rich-text-display a:hover { text-decoration: underline; }
```

#### `src/components/Global/RichTextEditor/RichTextEditor.jsx` (branch: both (identical); 2 strings)
used by: LEARNER: learn/profile.js | FACULTY: teacher/profile.js | COLLEGE: college-admin/profile.js
```text
L10 str: Enter text...
L86 child(div): .rich-text-editor-wrapper .jodit-container { border: 1px solid #d9d9d9; border-radius: 4px; } .rich-text-editor-wrapper .jodit-container:focus-within { border-color: #4096ff; box-shadow: 0 0 0 2px rgba(5, 145, 255, 0.1); } .rich-text-editor-wrapper .jodit-toolbar-editor-collection { border-bottom: 1px solid #f0f0f0; } .rich-text-editor-wrapper .jodit-wysiwyg { min-height: ${height - 50}px; padding: 12px; font-family: inherit; font-size: 14px; line-height: 1.5; } .rich-text-editor-wrapper .jodit-wysiwyg ul, .rich-text-editor-wrapper .jodit-wysiwyg ol { margin: 8px 0; padding-left: 24px; } .rich-text-editor-wrapper .jodit-wysiwyg li { margin: 4px 0; } .rich-text-editor-wrapper .jodit-wysiwyg p { margin: 8px 0; }
```

#### `src/components/Global/SkillsAutocomplete.jsx` (branch: both (differs); 20 strings)
used by: LEARNER: learn/profile.js | FACULTY: teacher/profile.js | COLLEGE: college-admin/profile.js
```text
L37 str: Type to search skills (e.g., Java, Python, React)...
L55 prop:label: Beginner
L56 prop:label: Intermediate
L57 prop:label: Advanced
L58 prop:label: Expert
L63 str: Technical Skills
L64 str: Soft Skills
L66 str: Domain Skills
L157 text(div): Added
L163 text(div): Hot
L168 text(div): Recent
L242 str: No Results
L249 attr:description(Empty): No skills matching "${query}". Try a different search.
L268 str: Search Error
L275 attr:description(Empty): Failed to search. Please try again.
L415 text(AutoComplete): Searching...
L423 str: 0 3px 6px -4px rgba(0,0,0,.12), 0 6px 16px 0 rgba(0,0,0,.08)
L436 text(AutoComplete): Tip: Try typing abbreviations like "js" or "py"
L447 text(div): Selected Skills (
L504 child(div): .skills-autocomplete-container :global(.ant-select-dropdown-menu-item-group-title) { padding: 0 !important; }
```

#### `src/components/Global/SortableLessonContentList/SortableLessonContentList.jsx` (branch: both (differs); 5 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js | COLLEGE: college-admin/courses/[id].js
```text
L62 attr:aria-label(div): Drag to reorder
L132 prop:message: Order updated
L133 prop:description: Content order has been saved for this class.
L139 prop:message: Failed to save order
L140 prop:description: Please try again.
```

#### `src/components/Global/Tooltips/CustomToolTipTable.jsx` (branch: both (identical); 0 strings)
(no user-facing strings)

#### `src/components/Global/Upload/UploadFromLinkButton.jsx` (branch: both (differs); 11 strings)
used by: LEARNER: learn/allAssignments.js, learn/courses/[courseId]/[...courseTab].js, learn/profile.js | FACULTY: teacher/allAssignments.js, teacher/courses/[courseId]/[...courseTab].js, teacher/profile.js | COLLEGE: college-admin/courses/[id].js, college-admin/profile.js
```text
L7 str: Upload from Drive link
L31 call:message.error: Paste a Google Drive file link
L42 call:message.success: Imported and uploaded successfully
L46 str: Could not import this link
L62 attr:title(Modal): Add from Google Drive
L65 attr:okText(Modal): Import
[DEV] L82 attr:message(Alert): Import failed
[DEV] L87 text(Modal): Google Drive file link
L94 attr:placeholder(Input): Paste a Google Drive share link
[DEV] L97 attr:aria-describedby(Input): ${urlErrorId} ${urlHintId}
L99 text(Modal): Paste a Google Drive link to add the file to your submission.
```

#### `src/components/Global/video/video.jsx` (branch: both (identical); 0 strings)
(no user-facing strings)

#### `src/components/InterviewCalendar/InterviewCalendarContent.js` (branch: both (differs); 90 strings)
used by: COLLEGE: college-admin/calendar.js, college-admin/jobs/[jobId]/interviews.js
```text
L52 prop:label: Screening
L53 prop:label: Technical
L55 prop:label: Managerial
L56 prop:label: Final
L58 prop:label: Interview
L72 prop:label: All statuses
L73 prop:label: Active
L74 prop:label: Completed
L75 prop:label: Cancelled
L79 prop:label: All types
L84 prop:label: All modes
L85 prop:label: Online
L86 prop:label: In-person
L90 prop:label: Date ↑ Earliest
L91 prop:label: Date ↓ Latest
L92 prop:label: Job title
L93 prop:label: Status
L97 prop:label: Scheduled
L98 prop:label: Confirmed
L99 prop:label: Reschedule
L100 prop:label: Completed
L101 prop:label: Cancelled
L102 prop:label: No Show
L114 str: Assign this admin to an organization or college to view interviews.
L119 str: No interviews scheduled yet.
L163 str: Unable to load interviews. Please try again.
L165 call:setFetchError: ${msg} Data below may be outdated.
L173 str: Unable to load interviews. Please try again.
L175 call:setFetchError: ${msg} Data below may be outdated.
L321 prop:label: All departments
L334 prop:label: All companies
L369 return: Job #${jobIdFilter}
L398 prop:title: Interview
L402 prop:description: Interviewer: ${record.interviewerName}
L411 text(span): Job
L413 attr:placeholder(Input): Search...
L444 text(span): Candidate
L450 attr:aria-label(select): Filter by department
L485 text(span): Type
L490 attr:aria-label(select): Filter by type
L515 text(span): Status
L520 attr:aria-label(select): Filter by status
L539 prop:title: Date & Time
L555 prop:title: Duration
L560 str: ${record.durationMinutes} min
L564 prop:title: Interviewer
L572 prop:title: Location
L582 text(span): Mode
L587 attr:aria-label(select): Filter by mode
L602 text(Tag): Online
L604 text(Tag): In-person
L618 attr:title(Button): Download .ics
L631 text(span): View
[DEV] L675 attr:aria-label(Button): View application for ${learnerName || "learner"} — ${record.job?.jobTitle || "job"}
L679 text(Card): View
[DEV] L695 child(Card): ${typeCfg.label} interview
L707 text(Card): Interviewer:
L713 text(Card): Online
L717 text(Card): In-person
L729 text(Card): .ics
L741 text(div): Interviews
L756 text(div): Interviews
[DEV] L757 text(div): Review the interview schedule, conflicts and candidate context without leaving the placements workspace.
L767 text(div): Refresh
[DEV] L771 attr:aria-label(div): Interview summary
L772 text(div): Scheduled
[DEV] L773 text(div): Today
[DEV] L774 text(div): Companies
[DEV] L775 text(div): Conflicts
L794 text(div): Loading interviews...
L826 text(div): interview
L827 child(div): · ${summaryStats.companies} companies
L828 child(div): · ${summaryStats.today} today
L832 text(div): Company:
L837 attr:aria-label(select): Filter by company
L851 text(div): Job:
L863 text(div): Sort by:
L870 attr:aria-label(Select): Sort interviews
L894 text(div): Export CSV
L909 text(div): conflict
L919 text(div): Clear filters
L928 attr:placeholder(Input): Search...
L943 attr:placeholder(Select): Type
L956 attr:placeholder(Select): Status
L969 attr:placeholder(Select): Mode
L983 attr:placeholder(Select): Department
L998 attr:placeholder(Select): Company
L1013 text(div): Clear all
L1033 str: ${total} interviews
L1046 prop:emptyText: No interviews
```

#### `src/components/Notifications/NotificationsContent.jsx` (branch: both (differs); 44 strings)
used by: LEARNER: learn/notifications.js | FACULTY: teacher/notifications.js
```text
L78 prop:label: Take Assessment
L86 prop:label: View Interview
L94 prop:label: View in My Applications
L102 prop:label: View Course
L104 str: ${getFacultyBasePath(pathname, facultyType)}/courses
L218 prop:title: Announcement
L239 return: ${getSourceTag(record)}-${record?.id ?? "unknown"}
L300 attr:aria-label(button): ${record?.title || "Notification"} from ${getContextDisplay(record)}
L300 attr:aria-label(button): Notification
L310 child(button): Notification
L374 str: ${getFacultyBasePath(router.pathname, loginUser?.facultyType)}/notifications
[DEV] L472 str: Personal notifications could not be loaded. College and faculty announcements are still shown.
L521 prop:label: Course
L522 prop:label: Projects
L523 prop:label: Announcements
L524 prop:label: Job
L527 prop:label: College
L528 prop:label: Department
L529 prop:label: Faculty
L530 prop:label: Personal
L582 text(div): No notifications yet
L585 child(div): You'll see course updates and announcements here when available.
L586 child(div): Announcements across college, department, and faculty will appear here.
L597 attr:title(ListingPageHeader): Notifications
L597 attr:ariaLabel(ListingPageHeader): Notifications overview
[DEV] L601 attr:title(PanelError): Couldn't load notifications
[DEV] L602 attr:description(PanelError): Notifications could not be loaded. Retry without leaving this page.
L617 attr:title(ListingPageHeader): Notifications
L618 attr:ariaLabel(ListingPageHeader): Notifications overview
L627 text(ListingPageHeader): All
[DEV] L653 attr:message(Alert): Couldn't load ${partialFailure}
[DEV] L654 attr:description(Alert): Everything else below loaded normally.
L655 text(Alert): Retry
L659 attr:aria-label(section): Notification list
[DEV] L662 attr:label(RefreshStatus): Refreshing notifications…
[DEV] L667 attr:title(PanelPartial): Couldn't refresh notifications
[DEV] L668 attr:description(PanelPartial): Showing the last notifications we loaded.
[DEV] L678 attr:message(Alert): Some notifications could not be loaded
L680 text(Alert): Retry
[DEV] L697 attr:title(PanelEmpty): No ${tabLabels[activeTab] || ""} notifications yet
[DEV] L698 attr:description(PanelEmpty): Try another category or return to the complete notification feed.
L699 attr:ctaLabel(PanelEmpty): View all
L716 attr:title(Modal): Notification
L739 text(Modal): Got it
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L604 text(div): No
[PROD-ONLY] L604 text(div): notifications yet.
```

#### `src/components/Placements/DriveEligibilityPanel.js` (branch: lms-dev-2026 only; 5 strings)
used by: LEARNER: learn/my-placements/jobs/[jobId].js
```text
L12 return: yours is included
L34 text(p): We couldn't check this drive's rules just now. Refresh the page to see whether you meet them.
L38 attr:aria-label(ul): This drive's rules
L41 attr:aria-label(CheckCircleFilled): Met
L41 attr:aria-label(CloseCircleFilled): Not met
```

#### `src/components/Placements/JobDetailContent.jsx` (branch: both (differs); 177 strings)
used by: LEARNER: learn/my-placements/jobs/[jobId].js
```text
L45 prop:text: Applications closed
L48 prop:text: Closed
L52 prop:text: Closes today
L53 prop:text: 1 day left
L54 prop:text: ${days} days left
L55 prop:text: ${days} days left
L56 prop:text: ${days} days left
L57 prop:sub: ${days} days left
L67 return: ${base.slice(0, 45)}…
L75 return: ${bytes} B
L76 return: ${Math.round(bytes / 1024)} KB
L77 return: ${(bytes / (1024 * 1024)).toFixed(1)} MB
L120 text(div): Dismiss
[DEV] L243 prop:reason: You can't apply to this drive.
[DEV] L248 prop:reason: We couldn't check this drive's rules just now. Refresh the page to try again.
[DEV] L252 str: This drive is no longer open.
[DEV] L285 str: This drive is no longer open.
L296 call:message.warning: Please log in to view this job
L414 call:message.success: Removed from saved jobs
L418 call:message.success: Saved for later
L421 call:message.error: Failed to update saved job
[DEV] L450 call:setWithdrawError: We couldn't find your application for this drive. Refresh the page and try again.
L459 call:message.success: Application withdrawn successfully
L469 call:setWithdrawError: The withdrawal did not go through. Your application is still active.
[DEV] L473 call:setWithdrawError: This application cannot be withdrawn from its current stage.
[DEV] L475 call:setWithdrawError: We couldn't confirm whether the withdrawal succeeded. Check your applications before trying again.
[DEV] L489 call:setApplyError: Wait for your resume to finish uploading before applying.
[DEV] L490 call:setApplyError: We couldn't check your existing application. Check the status before applying.
L495 call:setApplyError: You are not eligible for this job, so the application can't be submitted.
[DEV] L500 call:setApplyError: Applications for this role are closed.
L505 call:setApplyError: This job link isn't valid. Open the job from the jobs list and try again.
[DEV] L521 call:setApplyError: Wait for the resume upload and verify your application status first.
[DEV] L527 call:setApplyError: Applications for this role are closed.
[DEV] L546 call:setApplyError: We couldn't verify whether you already applied. Check status before submitting.
L559 call:setApplyError: No profile resume was found. Upload a resume, or choose to apply without one.
L565 call:setApplyError: The attached resume address isn't a valid http or https link. Upload the file again.
[DEV] L594 new Error: The application response was not successful.
[DEV] L611 call:setApplyError: The application was not accepted. Please review and try again.
[DEV] L615 call:setApplyError: We couldn't verify whether your application was submitted. Check its status before trying again.
[DEV] L620 call:setApplyError: We couldn't verify whether your application was submitted. Check its status before trying again.
[DEV] L625 call:setApplyError: We couldn't check your existing application. Check status before submitting.
L647 prop:label: Preferred degree
L648 prop:label: Preferred specialization
L649 prop:label: Graduation year
L650 prop:label: Preferred GPA
L651 prop:label: Preferred city
L656 prop:label: Additional requirement
[DEV] L681 prop:name: Package ${i + 1}
L721 str: ${job.jobTitle}${job.companyName ? ` at ${job.companyName}` : ""} – Jobs
L722 str: Job – Jobs
L725 str: ${job.jobTitle} at ${job.companyName}.
L726 str: Location: ${job.location}.
L729 str: View this job opening and apply through your placements dashboard.
L734 attr:name(meta): description
L735 attr:content(meta): website
L739 attr:name(meta): twitter:card
L739 attr:content(meta): summary
L740 attr:name(meta): twitter:title
L741 attr:name(meta): twitter:description
L747 attr:aria-label(nav): Breadcrumb
[DEV] L750 text(nav): Back to drives
L754 text(nav): Placements
[DEV] L758 text(nav): Drives
L780 text(main): Loading job details
L827 text(main): This job link isn't valid
L828 text(main): The job ID in the address doesn't look right. Open the job from the jobs list and it will load correctly.
[DEV] L832 text(main): Browse drives
[DEV] L847 str: This drive can't be shown
[DEV] L847 str: We couldn't load this drive
[DEV] L847 str: Drive not found
[DEV] L850 str: We could not load this drive. It may have been removed, or it may not be open to you.
[DEV] L851 str: This drive does not exist or is no longer open.
L862 text(main): Retry
[DEV] L866 text(main): Browse drives
[DEV] L890 str: Uploading resume…
L892 str: Can't confirm application status
L894 str: Applications closed
L896 str: Apply now
L897 str: Not eligible to apply
L900 str: Resume on your profile
L901 str: Uploaded resume
L919 child(section): You're in — application sent
L919 child(section): Application submitted
L930 text(section): Reference
L931 text(section): APP-
L935 text(section): Submitted
L939 text(section): Timestamp unavailable
L943 text(section): Resume sent
L948 child(section): View resume
L951 text(section): No resume attached
L957 text(section): Status
[DEV] L964 text(section): When you are booked for a round or your application moves, you get a notice here. Interview bookings are also emailed.
L976 text(section): View your interview
L988 text(section): View applications
[DEV] L991 text(section): Browse more drives
L997 attr:title(InlineError): Your application was not withdrawn
L1010 child(section): Withdrawing…
L1010 child(section): Withdraw this application
L1017 text(section): Apply to this role
L1026 text(section): Resume
[DEV] L1034 text(section): Your profile resume is sent with this application
L1036 text(section): Preview
[DEV] L1039 text(section): You have no resume on your profile. Recruiters shortlist from it, so add one first; you can still apply without it.
[DEV] L1043 child(section): Update the resume on your profile
[DEV] L1043 child(section): Add a resume on your profile
L1049 text(section): The deadline for this role has passed, so applications are no longer accepted.
L1056 attr:title(InlineError): We couldn't confirm whether you've already applied
L1057 attr:detail(InlineError): Applying is blocked until we can check — this avoids submitting a duplicate application. Try again, or come back in a moment.
[DEV] L1063 text(section): Your previous application was withdrawn. Applying again may be allowed for an early-stage withdrawal, but is not guaranteed. If a new application is rejected, contact the placement team.
L1070 attr:title(InlineError): Your application was not submitted
[DEV] L1089 text(section): Ask your placement cell if you think this is wrong.
L1121 attr:title(Tooltip): Saved
L1121 attr:title(Tooltip): Save for later
L1127 attr:aria-label(button): Remove from saved jobs
L1127 attr:aria-label(button): Save for later
L1137 attr:aria-label(dl): Job summary
[DEV] L1140 text(div): Where
[DEV] L1142 child(div): Pool drive at ${job.hostCollegeName || "another college"}
[DEV] L1142 child(div): another college
[DEV] L1143 child(div): Off campus
[DEV] L1143 child(div): On campus
[DEV] L1145 text(div): Report by
[DEV] L1149 text(div): Apply on the company's site:
[DEV] L1150 text(div): open the application
[DEV] L1151 text(div): Then apply here too, so the placement cell can follow up.
L1159 text(div): Job type
L1166 text(div): Compensation
[DEV] L1172 text(div): Pay
[DEV] L1178 text(div): LPA
[DEV] L1181 child(div): ${p.fixedLpa} fixed
[DEV] L1183 child(div): ${p.variableLpa} variable
[DEV] L1187 text(div): · Joining bonus
[DEV] L1187 text(div): LPA
[DEV] L1190 text(div): Stipend
[DEV] L1190 text(div): /month
L1200 text(div): Posted
L1206 text(div): Applications close
[DEV] L1233 child(div): You can apply
[DEV] L1233 child(div): You can't apply to this drive
[DEV] L1237 child(div): You meet this drive's rules.
[DEV] L1238 child(div): This drive isn't open to your branch or batch.
[DEV] L1241 text(div): Register in Placement cell
[DEV] L1247 text(div): Your college's placement rules
L1258 text(div): About this role
[DEV] L1262 text(div): Download the full job description
[DEV] L1265 text(div): Download the full job description
L1267 text(div): No description has been added for this role yet. You can still apply and ask the recruiter for details.
L1275 text(div): Requirements & preferences
L1302 text(div): Key dates
L1321 attr:aria-label(aside): Application
L1327 attr:aria-label(div): Apply to this job
L1351 attr:title(Modal): Withdraw Application
L1353 attr:okText(Modal): Withdrawing…
L1353 attr:okText(Modal): Withdraw
L1355 attr:cancelText(Modal): Cancel
[DEV] L1366 text(div): Withdrawing closes this application. Whether you can apply again depends on how far your application progressed. Contact your placement team if you need help.
L1383 attr:okText(Modal): Submitting…
L1383 attr:okText(Modal): Confirm & apply
L1384 attr:cancelText(Modal): Not yet
L1399 text(div): Ready to apply?
L1400 text(div): We'll send your profile to the recruiter. You can withdraw later from Applications.
[DEV] L1410 child(div): Hide what gets shared
[DEV] L1410 child(div): What exactly gets shared?
[DEV] L1414 text(div): Your resume and contact details go to this company once you apply.
[DEV] L1415 text(div): Your academic record (CGPA and percentages) is checked to confirm eligibility, not sent to the company.
[DEV] L1416 text(div): Your placement cell can see this application and its status at any time.
L1421 text(div): Role
L1422 child(div): This job
L1425 text(div): Company
L1426 child(div): This company
L1429 text(div): Resume
L1430 child(div): No resume attached
[DEV] L1434 attr:title(InlineError): Application status needs attention
L1447 attr:title(Modal): Resume preview
L1452 attr:title(iframe): Resume preview
L1455 text(div): Word documents can't be previewed in the browser. Open the file to check it.
L1461 text(div): Open in a new tab
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L226 str: This job is no longer available.
[PROD-ONLY] L257 str: Failed to load job details
[PROD-ONLY] L414 call:setResumeError: That file can't be used. Choose a .pdf, .doc or .docx under 10 MB.
[PROD-ONLY] L429 call:setResumeError: The upload finished but returned an address we can't accept. Please try uploading again.
[PROD-ONLY] L443 call:setResumeError: Upload failed: ${err.message}. You can retry, or apply without a resume.
[PROD-ONLY] L444 call:setResumeError: We couldn't upload that file. You can retry, or apply without a resume.
[PROD-ONLY] L456 call:setResumeError: That link didn't return a resume we can accept. Try uploading the file instead.
[PROD-ONLY] L475 prop:content: Are you sure you want to withdraw your application? This is final — you cannot undo a withdrawal yourself, and you would need to contact the placement team to be reinstated.
[PROD-ONLY] L494 call:setWithdrawError: Only applications with APPLIED status can be withdrawn.
[PROD-ONLY] L496 call:setWithdrawError: We couldn't withdraw your application. It is still active — please try again or contact the placement team.
[PROD-ONLY] L580 call:setApplyError: The application was not submitted. Nothing has been sent to the recruiter — please try again.
[PROD-ONLY] L599 call:setApplyError: You've submitted a lot of applications recently. Wait a little while, then try again.
[PROD-ONLY] L601 call:setApplyError: The application was not submitted. Nothing has been sent to the recruiter — please try again.
[PROD-ONLY] L691 text(nav): Back to jobs
[PROD-ONLY] L699 text(nav): Jobs
[PROD-ONLY] L772 text(main): Browse jobs
[PROD-ONLY] L787 str: This job is unavailable
[PROD-ONLY] L787 str: We couldn't load this job
[PROD-ONLY] L787 str: Job not found
[PROD-ONLY] L790 str: We could not load this job. It may have been removed, or you may not have access to it.
[PROD-ONLY] L791 str: The job you are looking for does not exist or is no longer available.
[PROD-ONLY] L806 text(main): Browse jobs
[PROD-ONLY] L904 text(section): The placement team reviews your profile against this role.
[PROD-ONLY] L908 text(section): Shortlisted candidates are invited to an assessment or interview.
[PROD-ONLY] L912 text(section): You'll be notified here and by email at every status change.
[PROD-ONLY] L939 text(section): Browse more jobs
[PROD-ONLY] L966 text(section): A resume is recommended — recruiters shortlist from it.
[PROD-ONLY] L977 text(section): Recommended
[PROD-ONLY] L985 attr:name(input): ljd-resume-choice
[PROD-ONLY] L993 text(section): Use my profile resume
[PROD-ONLY] L1002 attr:name(input): ljd-resume-choice
[PROD-ONLY] L1010 child(section): Use the resume I just uploaded
[PROD-ONLY] L1010 child(section): Upload a different resume
[PROD-ONLY] L1014 child(section): PDF or Word, up to 10 MB
[PROD-ONLY] L1022 attr:name(input): ljd-resume-choice
[PROD-ONLY] L1030 text(section): Apply without a resume
[PROD-ONLY] L1031 text(section): Your profile details are still sent
[PROD-ONLY] L1051 child(section): Replace file
[PROD-ONLY] L1051 child(section): Choose file
[PROD-ONLY] L1064 text(section): From Drive
[PROD-ONLY] L1080 attr:title(InlineError): Resume not attached
[PROD-ONLY] L1093 child(section): Ready to send
[PROD-ONLY] L1094 child(section): Saved on your profile
[PROD-ONLY] L1138 text(section): Reach out to your placement coordinator if you believe your profile has changed.
[PROD-ONLY] L1232 child(div): This role is open to you
[PROD-ONLY] L1232 child(div): This role isn't open to you
[PROD-ONLY] L1236 child(div): This posting is targeted at your college/department/batch. Any degree, GPA or specialization shown below is a preference the recruiter listed, not a requirement checked automatically.
[PROD-ONLY] L1237 child(div): This posting isn't targeted at your college/department/batch.
```

#### `src/components/Placements/JobsListContent.jsx` (branch: both (differs); 87 strings)
used by: LEARNER: learn/my-placements/jobs/index.js
```text
L55 prop:label: Deadline soonest
L56 prop:label: Newest first
L57 prop:label: Highest CTC
L73 prop:label: No deadline set
L73 str: No deadline
[DEV] L75 prop:label: Closed ${m.format("D MMM YYYY")}
L78 prop:label: Closes today
L79 prop:label: Closes tomorrow
L80 prop:label: Closes in ${daysLeft} days
L80 str: ${daysLeft} days left
L81 prop:label: Closes in ${daysLeft} days
L81 str: ${daysLeft} days left
[DEV] L82 prop:label: Apply by ${m.format("D MMM YYYY")}
[DEV] L170 text(article): Not open to you
L173 text(article): Applications closed
[DEV] L199 child(article): This drive is for a different branch, program or batch.
[DEV] L199 text(article): Open it to see its rules, or ask your placement cell if you think this is wrong.
L208 text(article): Applications closed
[DEV] L209 child(article): on ${deadline.date.format("D MMM YYYY")}
L209 text(article): . You can still read the role description.
L215 text(article): Posted
L223 text(article): CTC
L226 child(article): Not disclosed
L231 text(article): Deadline
L241 text(article): Location
L244 child(article): Not specified
[DEV] L254 attr:title(button): Saved drives are temporarily unavailable; retry loading.
[DEV] L258 attr:aria-label(button): Remove ${job.jobTitle} from saved drives
L258 attr:aria-label(button): Save ${job.jobTitle} for later
L328 str: ${basePath.replace(/\/$/, "")}/jobs
[DEV] L452 call:setFetchError: Failed to fetch drives
[DEV] L459 call:setFetchError: Failed to load drives. Please try again.
[DEV] L467 call:message.warning: Please log in to view drives
L510 str: Couldn't remove — try again
L510 str: Couldn't save — try again
L602 prop:label: All types (${baseJobs.length})
L603 prop:label: ${t} (${typeCounts[t]})
L610 prop:label: All locations
L611 prop:label: ${n} (${locationCounts[n]})
L734 attr:placeholder(Input): Search by title, company, location…
[DEV] L739 attr:aria-label(Input): Search drives by title, company, or location
L742 text(div): Sort
[DEV] L748 attr:aria-label(Select): Sort drives
L752 text(div): Type
[DEV] L758 attr:aria-label(Select): Filter by drive type
L762 text(div): Location
L768 attr:aria-label(Select): Filter by location
L778 text(div): Eligible only
L786 text(div): Closing in 7 days
L790 text(div): Clear filters
[DEV] L801 text(p): No drive is open to you right now. The drives below show why each one isn't.
L825 attr:aria-label(nav): Job list pages
L842 attr:aria-label(section): Expired saved jobs
L843 text(section): Expired
L846 text(section): These saved roles have closed. They stay here until you unsave them.
[DEV] L871 attr:aria-label(section): Not open to you
[DEV] L880 text(section): Not open to you
L926 text(div): No open jobs right now
L927 text(div): New opportunities are added regularly. Check back soon or contact your placement cell.
[DEV] L937 text(div): Your saved jobs could not be fully loaded. This is not an empty saved list.
[DEV] L938 text(div): Retry saved jobs
[DEV] L949 text(div): No saved drives yet
[DEV] L950 text(div): Save drives from All Drives by tapping the heart. They will appear here.
L953 text(div): Browse all jobs
L966 text(div): No jobs match
L966 child(div): these filters
L967 text(div): Nothing in the
L968 text(div): on this tab matches. Try a broader search, or clear the filters to start again.
L972 text(div): Clear filters
L988 text(div): Show all
L989 text(div): jobs
[DEV] L1008 text(div): Drives
L1015 text(div): Retry
[DEV] L1025 attr:aria-label(section): Drives overview
[DEV] L1028 text(div): Drives
L1039 text(div): saved
L1047 attr:aria-label(section): Job listings
[DEV] L1054 prop:label(Tabs): All drives
L1058 text(Tabs): Saved
[DEV] L1073 attr:label(RefreshStatus): Refreshing drive listings…
[DEV] L1078 child(div): Showing ${filteredJobs.length} of ${baseJobs.length} drives
[DEV] L1079 child(div): ${baseJobs.length} ${baseJobs.length === 1 ? "drive" : "drives"}
[DEV] L1087 attr:message(Alert): Some drive details could not be loaded
L1092 text(Alert): Retry
[DEV] L1101 attr:message(Alert): Couldn't refresh drive listings
L1102 attr:description(Alert): Showing the last results we loaded.
L1104 text(Alert): Retry
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L76 prop:label: Closed ${m.format("MMM D, YYYY")}
[PROD-ONLY] L83 prop:label: Apply by ${m.format("MMM D, YYYY")}
[PROD-ONLY] L170 text(article): Not eligible
[PROD-ONLY] L199 text(article): Not open to your profile.
[PROD-ONLY] L200 child(article): This role targets a different department, program or batch.
[PROD-ONLY] L200 text(article): Open the role to see the full requirements, or talk to your placement cell if you think this is wrong.
[PROD-ONLY] L210 child(article): on ${deadline.date.format("MMM D, YYYY")}
[PROD-ONLY] L257 attr:aria-label(button): Remove ${job.jobTitle} from saved jobs
[PROD-ONLY] L426 call:setFetchError: Failed to fetch jobs
[PROD-ONLY] L431 call:setFetchError: Failed to load jobs. Please try again.
[PROD-ONLY] L439 call:message.warning: Please log in to view jobs
[PROD-ONLY] L696 attr:aria-label(Input): Search jobs by title, company, or location
[PROD-ONLY] L705 attr:aria-label(Select): Sort jobs
[PROD-ONLY] L715 attr:aria-label(Select): Filter by job type
[PROD-ONLY] L853 text(div): No saved jobs yet
[PROD-ONLY] L854 text(div): Save jobs from All Jobs by tapping the heart. They will appear here.
[PROD-ONLY] L912 text(div): Jobs
[PROD-ONLY] L929 attr:aria-label(section): Jobs overview
[PROD-ONLY] L932 text(div): Jobs
[PROD-ONLY] L957 prop:label(Tabs): All jobs
[PROD-ONLY] L977 child(div): Showing ${filteredJobs.length} of ${baseJobs.length} jobs
[PROD-ONLY] L978 child(div): ${baseJobs.length} ${baseJobs.length === 1 ? "job" : "jobs"}
[PROD-ONLY] L986 attr:message(Alert): Couldn't refresh job listings
```

#### `src/components/Placements/PlacementCellContent.js` (branch: lms-dev-2026 only; 73 strings)
used by: LEARNER: learn/my-placements/placement.js
```text
L11 prop:label: Placements
L11 prop:hint: I want a job through campus drives
L12 prop:label: Higher studies
L12 prop:hint: I'm going for a master's or similar
L13 prop:label: Not interested
L13 prop:hint: I'm not taking part this year
L16 str: Entrepreneurship / self-employed
L16 str: Competitive exams
L18 str: Change my registration
L18 str: Correct my details (with proof)
L18 str: Report an off-campus offer
L19 str: Ask for more time on an offer
L19 str: Withdraw from a drive
L19 str: Absence dispute
L19 str: Apply again after placement
L21 str: Waiting for the placement cell
L21 str: Not approved
L68 attr:message(Alert): We could not load this page
L68 text(Alert): Retry
L99 call:message.success: Letter attached
L101 call:message.error: Could not upload the letter. You can still submit and share it separately.
L116 prop:reason: Disputing: "${notice.body}"
L130 prop:title: Discard this request?
L131 prop:content: Your unsent request details will be lost.
L132 prop:okText: Discard
L153 str: Sent to the placement cell
L153 str: Could not send the request
L157 str: You are registered for ${CHOICE_LABEL[reg.choice] || reg.choice}.
L158 str: Choose one to register. You need to register before you can apply to drives.
L158 str: You have not registered yet.
L163 attr:message(Alert): You are barred from drives for now
L172 text(Alert): Wrong? Tell the placement cell
L176 text(div): Registration
L176 child(div): · ${reg.batchName}
L180 attr:aria-label(div): Your choice
L183 attr:name(input): sp-choice
L190 text(div): I agree to share my academic details, resume and contact details with the companies I apply to.
L195 str: Registration saved
L195 str: Could not save
L195 child(div): Save my new choice
L195 child(div): Register
L196 text(div): You can change your choice until
L201 child(div): Registration opens when the placement cell invites your batch. You'll get a notice.
L202 child(div): Registration is closed. To change your choice, send a request below.
L209 text(div): Your requests
L210 text(div): New request
L213 text(div): Need more time on an offer, a correction to your details, or to report an off-campus offer? Send a request and the placement cell will reply here.
L223 text(div): Reply:
L224 text(div): Sent
L235 text(div): Placement rules
L239 attr:title(Modal): New request
L239 attr:okText(Modal): Send
L243 attr:name(Form.Item): type
L243 attr:label(Form.Item): What do you need?
L248 attr:name(Form.Item): jobId
L248 attr:label(Form.Item): Which offer?
L248 prop:label: ${o.company} · ${o.role}
L250 attr:name(Form.Item): choice
L250 attr:label(Form.Item): Change to
L253 attr:name(Form.Item): companyName
L253 attr:label(Form.Item): Company
L253 prop:message(Form.Item): Which company?
L254 attr:placeholder(Input): e.g. Acme Corp
L256 attr:name(Form.Item): ctcLpa
L256 attr:label(Form.Item): CTC (LPA)
L257 attr:placeholder(Input): e.g. 8.5
L259 attr:label(Form.Item): Offer letter
L262 child(div): Uploading…
L262 child(div): Attached: ${offerLetter.name}
L262 child(div): Click or drag your offer letter here
L268 attr:name(Form.Item): reason
L268 attr:label(Form.Item): Tell the placement cell why
L268 prop:message(Form.Item): Please explain
```

#### `src/components/Placements/PlacementsCompanyAvatar.jsx` (branch: both (identical); 0 strings)
(no user-facing strings)

#### `src/components/Placements/VerifiedJobDetailContent.jsx` (branch: both (differs); 10 strings)
used by: LEARNER: learn/my-placements/jobs/[jobId].js
```text
L66 child(div): Checking your application status
L66 child(div): Application status unavailable
L70 child(div): Checking whether you have already applied before enabling the application form.
L71 child(div): We couldn't confirm whether you already applied. Applying is blocked until the status can be checked.
L75 text(div): Check status again
L79 text(div): View applications
L82 text(div): Back to jobs
L96 text(div): An existing application was confirmed. You can review it under
L98 text(div): Applications
L102 child(div): .placements-verified-applied .ljd-apply { display: none !important; } .placements-verified-applied:has(.ljd-applied) > .placements-verified-applied__notice { display: none; }
```

#### `src/components/Placements/student/DriveJourney.jsx` (branch: lms-dev-2026 only; 6 strings)
used by: LEARNER: learn/my-placements/jobs/[jobId].js
```text
L42 attr:message(Alert): ${app.company} · ${app.role} was cancelled
L42 attr:message(Alert): ${app.company} · ${app.role} has closed
L54 child(section): Your progress
L54 child(section): Selection process
L55 text(section): Where you are:
L58 text(section): Confirm or reschedule in your schedule
```

#### `src/components/Placements/student/MovedPage.jsx` (branch: lms-dev-2026 only; 0 strings)
(no user-facing strings)

#### `src/components/Placements/student/OfferCard.jsx` (branch: lms-dev-2026 only; 37 strings)
used by: LEARNER: learn/my-placements/applications.js, learn/my-placements/offers.js
```text
L12 str: Waiting for your reply
L12 str: Expired: no reply in time
L13 str: Withdrawn by the company
L37 call:message.success: Congratulations! You accepted ${offer.company}'s offer.
L37 call:message.success: Offer declined
L41 str: Could not accept
L41 str: Could not decline
L57 str: These applications end.
L58 str: Other offers declined
L58 str: These offers are turned down for you.
L59 str: You stay in
L59 str: These carry on as before.
L68 child(article): · ${offer.roleOption}
L73 child(article): Stipend / CTC
L73 text(article): LPA
L74 text(article): Joining
L75 text(article): Reply by
L76 child(article): Accepted
L76 child(article): Answered
L77 text(article): Counts as placed
L77 text(article): No (internship)
L80 attr:message(Alert): The company told us you accepted this offer
L81 attr:description(Alert): If that is wrong, tell the placement cell before ${dayTime(offer.disputableUntil)}.
L84 text(article): Accept offer
L85 text(article): Decline
L86 text(article): Offer letter
L89 attr:title(Modal): Accept ${offer.company}'s offer?
L89 attr:okText(Modal): Yes, accept
L95 attr:message(Alert): We couldn't check what accepting will change
L96 attr:description(Alert): Accepting can end your other applications and offers. Check again before you accept.
L97 text(Alert): Check again
L101 text(article): The company and the placement cell are told at once.
L102 text(article): Nothing else changes: you have no other active applications or offers.
L110 text(article): How your college's rules decide this
L115 attr:title(Modal): Decline ${offer.company}'s offer?
L115 attr:okText(Modal): Decline offer
L118 text(article): This cannot be undone. The company and the placement cell are told.
```

#### `src/components/Placements/student/PlacementRules.jsx` (branch: lms-dev-2026 only; 4 strings)
used by: LEARNER: learn/my-placements/offers.js, learn/my-placements/placement.js
```text
L24 attr:message(Alert): We couldn't load the rules
L24 text(Alert): Retry
L28 text(div): Where you stand:
L34 text(div): Your placement cell sets these rules. If they change, the new rules apply to applications made after the change.
```

#### `src/components/Placements/student/RoundTrack.jsx` (branch: lms-dev-2026 only; 9 strings)
used by: LEARNER: learn/my-placements/applications.js, learn/my-placements/index.js, learn/my-placements/jobs/[jobId].js
```text
L10 text(p): The company has not shared its selection rounds yet.
L14 attr:aria-label(ol): Selection rounds
L18 attr:title(li): ${r.name}: ${st.label || ""}
L29 attr:aria-label(ol): Selection rounds
L43 child(ol): Online
L43 child(ol): On campus
L44 text(ol): Date to be announced
L46 text(ol): min
L48 text(ol): You asked to reschedule. The placement cell will reply.
```

#### `src/components/Placements/student/ScheduleCard.jsx` (branch: lms-dev-2026 only; 35 strings)
used by: LEARNER: learn/my-placements/index.js, learn/my-placements/schedule.js
```text
L46 str: Sent. The placement cell will reply.
L46 str: Could not send
L50 str: Not cleared
L50 str: Marked absent
L64 child(article): Take it by ${dayTime(item.startsAt)}
L64 child(article): Take it when you can
L65 child(article): · ${m.format("h:mm A")}
L65 child(article): · time to be told
L65 child(article): –${at(item.endsAt).format("h:mm A")}
L68 text(article): Expected
L70 text(article): Confirmed
L71 text(article): Please confirm
L72 text(article): Reschedule asked
L78 text(article): Online
L78 text(article): Venue to be told
L80 text(article): min
L82 text(article): Bring:
L84 text(article): This is the round's planned date. The placement cell will book your slot and tell you.
L87 text(article): Your reschedule request:
L87 child(article): moved to the time shown
L87 child(article): kept as it was
L87 child(article): · "${answeredAsk.reply}"
L92 str: Confirmed. See you there.
L92 str: Could not confirm
L92 text(article): Confirm I'll attend
L97 text(article): Join link
L100 text(article): Open test
L103 text(article): Can't make it?
L109 attr:title(Modal): Ask to reschedule
L109 attr:okText(Modal): Send to the placement cell
L113 text(article): Why can't you make it?
L115 attr:placeholder(Input.TextArea): e.g. I have my semester exam at that time
L116 text(article): Times that work for you (optional)
L117 attr:placeholder(Input): e.g. Any time after 2 PM on 16 Oct
L118 text(article): Until they reply, your current slot stays as it is.
```

#### `src/components/Placements/student/useJourney.js` (branch: lms-dev-2026 only; 0 strings)
(no user-facing strings)

#### `src/components/Placements/student/words.js` (branch: lms-dev-2026 only; 42 strings)
used by: LEARNER: learn/my-placements/announcements.js, learn/my-placements/applications.js, learn/my-placements/index.js, learn/my-placements/jobs/[jobId].js (+3 more)
```text
L15 return: ${m.format(withDay ? "ddd D MMM" : "D MMM")}${time}
L15 str: ddd D MMM
L28 return: Today
L29 return: Tomorrow
L30 return: Yesterday
L31 return: In ${days} days
L31 return: ${m.format("D MMM")}
L32 return: ${-days} days ago
L40 return: Time is up
L41 return: ${mins} min left
L43 return: ${hours} hour${hours === 1 ? "" : "s"} left
L44 return: ${Math.floor(hours / 24)} days left
L66 str: Pre-placement talk
L68 str: Online test
L69 str: Group discussion
L76 prop:label: Cleared
L77 prop:label: Not cleared
L78 prop:label: Marked absent
L79 prop:label: Waitlisted
L80 prop:label: Done
L81 prop:label: Scheduled
L82 prop:label: Up next
L83 prop:label: Later
L84 prop:label: Talk
L85 prop:label: Not reached
L92 prop:label: Drive cancelled
L93 prop:label: Placed
L96 prop:label: Offer: reply needed
L97 prop:label: Offer accepted
L98 prop:label: Offered
L102 str: Offer declined by candidate
L102 prop:label: Offer declined
L103 prop:label: Not cleared: ${failed.name}
L103 prop:label: Not selected
L105 prop:label: Withdrawn
L106 prop:label: Waitlisted
L108 prop:label: Drive closed
L109 prop:label: ${current.state === "SCHEDULED" ? "Booked" : "Next"}: ${current.name}
L109 prop:label: Booked
L109 prop:label: Next
L110 prop:label: Shortlisted
L111 prop:label: Applied · waiting for the company
```

#### `src/components/Projects/ProjectDetailContent.jsx` (branch: both (differs); 1209 strings)
used by: LEARNER: learn/projects/[projectId].js | MENTOR: mentor/projects/[projectId].js
```text
L117 str: In Progress
L117 str: In Review
L130 str: cubic-bezier(0.2, 0, 0, 1)
L153 str: In Progress
L153 str: In Review
L155 str: To Do
L156 str: To Do
L157 str: In Progress
L158 str: In Review
L175 str: To Do
L176 str: In Progress
L177 str: In Review
L190 prop:label: ${value} hr${value === 1 ? "" : "s"}
L190 prop:label: ${value} pt${value === 1 ? "" : "s"}
L195 prop:label: Story
L196 prop:label: Bug
L197 prop:label: Chore
L198 prop:label: Spike
L294 str: ${allAssigneeNames.join(", ")} (${allAssigneeNames.length} assignees)
L316 child(div): Medium
L316 text(div): priority
L326 attr:alt(Avatar): Assignee
L339 attr:title(Tooltip): Unassigned
[DEV] L357 attr:title(span): Submission link attached
L358 text(div): Submitted
L364 child(div): ${estimatePoints} hr${estimatePoints === 1 ? "" : "s"}
L365 child(div): ${estimatePoints} pt${estimatePoints === 1 ? "" : "s"}
L378 child(div): Overdue · ${dueLabel}
L380 child(div): Due soon · ${dueLabel}
L512 attr:aria-label(div): ${cardProps.title || "Task"} — in ${laneName || "this lane"}. Press Space to pick up and move, Enter to open.
L512 attr:aria-label(div): Task
L512 attr:aria-label(div): this lane
L513 attr:aria-label(div): ${cardProps.title || "Task"} — in ${laneName || "this lane"}. Press Enter to open.
L513 attr:aria-label(div): Task
L513 attr:aria-label(div): this lane
L520 attr:aria-label(Button): Open details for ${cardProps.title || "task"}
L526 text(div): Open details
L582 new Error: Protected resource did not return file data
L592 str: Failed to open protected resource.
L597 call:message.warning: This resource has no link or file attached yet.
L610 call:message.error: This resource's link is not a valid web address, so it can't be opened.
L615 call:message.warning: Your browser blocked the new tab. Allow pop-ups for this site to open resources.
L635 child(div): Open file
L635 child(div): Open link
L640 text(div): Edit
L644 attr:title(Popconfirm): Delete "${resource.title}"?
L647 attr:description(Popconfirm): This permanently removes the resource for everyone on the project. It cannot be undone.
L649 attr:okText(Popconfirm): Delete
L652 text(div): Delete
L695 attr:aria-label(Button): Reorder ${resource.title}. Press Space to pick up, arrow keys to move, Space to drop.
L714 text(div): Mentors only
L715 text(div): Pinned
L716 text(div): Required
L736 text(div): Sprint:
L738 text(div): Task:
[DEV] L857 const:ARCHIVED_READ_ONLY_MESSAGE: This workspace is archived, so it is read-only.
L1149 str: You have unsaved project changes. Leave this page and discard them?
L1152 str: Route change aborted by Projects unsaved-changes guard.
L1169 str: Current status, scope, and project summary.
L1170 str: People, roles, and scheduled meetings.
L1171 str: Sprints, goals, and what ships when.
L1172 str: Active work, task movement, and ownership.
[DEV] L1173 str: Assign work and rebalance the team's load.
L1174 str: Files, links, and shared reference material.
L1175 str: Recent updates and history.
L1176 str: Project workspace.
L1258 call:setError: Failed to load project.
L1336 str: To Do
L1580 call:message.success: Project overview updated.
L1583 str: Failed to update project.
L1600 call:message.success: Member role updated.
L1606 str: Failed to update team.
L1650 call:message.success: Member removed.
L1657 str: Failed to remove member.
L1703 str: Search failed — try again.
L1722 call:message.success: Member added to the project.
L1726 str: Failed to add member.
L1788 return: Backlog
L1789 return: In Progress
L1790 return: In Review
L1791 return: Blocked
L1796 return: Completed
L1797 return: Backlog
L1810 return: Backlog
L1810 return: Unscheduled
L1824 str: In Progress
L1825 str: In Review
L1844 return: noDue
L1848 return: noDue
L1852 return: noDue
L1860 return: dueSoon
L1867 return: No due date
L1909 prop:note: Note
L1911 prop:text: Note
L1919 return: File
L1930 return: Active
L1935 return: Active
L1936 return: Draft
L1937 return: Archived
L1970 new Error: Resource URL must start with http:// or https://
L1974 new Error: Enter a valid resource URL.
L2065 return: Date not recorded
L2080 str: Unknown contributor
L2091 str: Unknown contributor
L2216 str: To Do
L2231 call:message.warning: Only your mentor can move a task into Completed.
L2240 call:message.warning: Only your mentor can move a task out of Completed.
L2267 str: In Review
L2268 str: In Review
L2281 call:message.warning: Start a sprint before moving backlog tasks onto the board.
L2363 new Error: This task is missing an identifier and cannot be moved.
L2399 str: In Review
L2409 prop:message: Moved to ${BOARD_LANE_LABEL[targetLane] || targetLane}.
L2434 call:message.warning: Task moved, but its position within the lane may not have saved. Refreshing…
L2443 call:message.warning: Task moved, but its position within the lane may not have saved. Refreshing…
L2466 text(span): Task moved to
L2475 call:message.warning: Undo needs a fresh task version. Refresh the board and move the task back manually.
L2482 call:message.warning: Someone changed this task after your move. Refresh the board before moving it back.
L2486 new Error: Task identifier unavailable for Undo
L2490 call:message.success: Task move undone.
L2492 str: Failed to undo this task move.
L2496 text(span): Undo
L2515 call:message.warning: Someone else changed this task while you were moving it. Reload the board to see the current state.
L2518 str: Failed to update board order.
L2524 call:message.warning: Task moved, but the board may show stale numbers until you refresh.
L2592 str: To Do
L2637 str: You have unsaved changes to this task. Close and discard them?
L2676 str: To Do
L2682 call:message.success: Task update saved.
[DEV] L2688 call:setTaskDetailLoadError: Task update saved, but the history could not be refreshed.
L2691 str: Failed to save task comment.
[DEV] L2742 call:setTaskDetailLoadError: The task was updated, but its history could not be refreshed.
L2745 str: Failed to log task action.
[DEV] L2759 call:message.error: This task is missing an identifier and can't be updated.
[DEV] L2776 prop:message: Flagged task as blocked.
[DEV] L2777 prop:message: Blocker resolved; resumed work.
[DEV] L2777 prop:message: Started work.
[DEV] L2789 call:setTaskDetailLoadError: The task was updated, but its history could not be refreshed.
[DEV] L2792 call:message.success: Blocker reported.
[DEV] L2792 call:message.success: Task moved to In Progress.
[DEV] L2794 str: Couldn't update this task.
[DEV] L2811 call:message.error: This task is missing an identifier and can't be submitted.
L2818 str: In Review
[DEV] L2822 prop:message: Submitted for review.
L2825 str: In Review
[DEV] L2832 call:setTaskDetailLoadError: The submission was saved, but task history could not be refreshed.
[DEV] L2835 call:message.success: Submitted for review.
[DEV] L2837 str: Couldn't submit this task for review.
L2857 return: ${prefix}-${Date.now()}
L2875 new Error: Cannot verify the latest task version. Retry when the project reloads.
L2895 str: To Do
L2916 new Error: Task id is missing for update
L2933 call:message.success: Task updated.
L2933 call:message.success: Task added.
L2937 str: Failed to save task.
[DEV] L2966 call:setReleasesError: Couldn't load releases.
L3034 new Error: Release version is unavailable — refresh before editing.
L3043 call:message.success: Release updated.
L3043 call:message.success: Release created.
L3046 str: Failed to save release.
[DEV] L3059 call:message.success: Release removed.
L3061 str: Failed to remove release.
L3069 call:message.success: Release marked shipped.
L3071 str: Failed to ship this release.
L3081 call:message.success: Release un-shipped.
L3083 str: Failed to un-ship this release.
L3118 call:message.error: This sprint no longer exists — it may have been removed. Refresh and try again.
L3178 call:message.success: Sprint updated.
L3178 call:message.success: Sprint added.
L3184 str: Failed to save sprint.
L3234 call:message.success: Sprint removed.
L3239 str: Failed to remove sprint.
L3253 call:message.success: Sprint started.
L3255 str: Couldn't start this sprint.
L3271 call:message.success: ${sprintTitle || "Sprint"} completed. Anything not done went back to the backlog.
L3271 call:message.success: Sprint
L3273 str: Couldn't complete this sprint.
[DEV] L3288 call:message.success: ${sprintTitle || "Sprint"} reopened.
L3288 call:message.success: Sprint
[DEV] L3290 str: Couldn't reopen this sprint.
L3322 new Error: Project college is required for file upload
L3357 call:message.error: This resource no longer exists — it may have been removed. Refresh and try again.
L3378 return: File
L3418 call:message.success: Resource updated.
L3418 call:message.success: Resource added.
L3421 str: Failed to save resource.
L3467 call:message.error: File size exceeds ${MAX_PROJECT_FILE_SIZE_MB}MB limit.
L3492 call:message.success: Resource file uploaded.
L3498 str: Failed to upload resource file.
L3516 call:message.success: Resource removed.
L3521 str: Failed to remove resource.
L3553 call:message.success: Resource order updated.
L3555 str: Failed to reorder resources.
L3600 call:message.error: This meeting no longer exists — it may have been removed. Refresh and try again.
L3686 call:message.success: Meeting updated.
L3686 call:message.success: Meeting added.
L3689 str: Failed to save meeting.
L3758 call:message.success: Meeting request sent to your mentor.
L3762 str: Failed to request meeting.
L3787 call:message.success: Meeting removed.
L3792 str: Failed to remove meeting.
L3827 return: id:${explicit}
L3867 return: Just now
L3868 return: ${diffMinutes}m ago
L3870 return: ${diffHours}h ago
L3872 return: ${diffDays}d ago
L3874 return: ${diffWeeks}w ago
L3876 return: ${diffMonths}mo ago
L3877 return: ${now.diff(instant, "year")}y ago
L3909 return: Date not set
L3914 return: Date not set
L3920 return: ${viewerInstant.format("hh:mm A")} (GMT${viewerInstant.format("Z")})
L3981 prop:label: Overview
L3982 prop:label: Meeting
L3983 prop:label: Resource
L3984 prop:label: Sprint
L3985 prop:label: Submission
L3986 prop:label: Team
L3987 prop:label: Task
L4004 prop:label: Update
L4039 str: To Do
L4098 str: Draft saved.
L4099 str: Submission sent for review.
L4100 str: Submission accepted.
L4101 str: Changes requested.
L4102 str: Submission locked.
L4103 str: Submission reopened for revision.
L4105 call:message.success: Delivery updated.
L4112 str: Failed to save delivery.
L4143 call:message.error: Add at least one attachment and a summary before submitting.
L4152 str: Failed to update delivery.
L4160 call:message.error: File size exceeds ${MAX_PROJECT_FILE_SIZE_MB}MB limit.
L4170 call:message.success: File uploaded. Saving the submission draft…
L4172 str: Failed to upload delivery file.
[DEV] L4213 call:message.error: Up to ${MAX_DELIVERY_ATTACHMENTS} additional files & links are allowed.
L4228 call:message.error: That doesn't look like a valid link.
L4232 call:message.error: Links must start with http:// or https://
L4244 call:message.error: File size exceeds ${MAX_PROJECT_FILE_SIZE_MB}MB limit.
[DEV] L4248 call:message.error: Up to ${MAX_DELIVERY_ATTACHMENTS} additional files & links are allowed.
L4259 str: Failed to upload attachment.
L4296 new Error: Cannot verify the latest task version. Retry when the project reloads.
L4302 new Error: Task id is missing for update
L4304 str: Task details
L4324 str: To Do
L4351 call:message.success: Task updated.
L4354 str: Failed to update task.
L4372 new Error: Task id is missing for delete
L4376 call:message.success: Task removed.
L4381 str: Failed to remove task.
L4388 str: No project description has been added yet.
L4392 str: Open the board to continue the project flow.
L4414 prop:label: Backlog
L4415 prop:label: To Do
L4416 str: In Progress
L4417 str: In Review
L4418 prop:label: Blocked
L4419 prop:label: Completed
L4432 return: ${segment.color} ${start}% ${cumulative}%
L4444 text(div): About this project
L4458 child(div): No due date
L4460 child(div): Overdue · was due ${projectDueLabel}
L4462 child(div): Due soon · ${projectDueLabel}
L4463 child(div): Due ${projectDueLabel || "scheduled"}
L4477 text(div): Edit details
L4489 text(div): Deliverables
L4509 text(div): No deliverables have been added yet.
L4511 text(div): Add deliverables
L4519 attr:label(AboutListBlock): Definition of done
L4521 attr:emptyText(AboutListBlock): No definition of done has been added yet.
L4522 attr:addLabel(AboutListBlock): Add definition of done
L4527 attr:label(AboutListBlock): Who's who
L4529 attr:emptyText(AboutListBlock): No personas have been added yet.
L4530 attr:addLabel(AboutListBlock): Add personas
L4550 attr:aria-label(div): ${donutCompletePercent}% of ${donutTotal} tasks complete
L4563 text(div): of tasks done
L4579 text(div): task
L4593 child(div): Submission also needs all ${sprintRollup.total} sprint${sprintRollup.total === 1 ? "" : "s"} signed off (${sprintRollup.done} so far).
L4594 child(div): Tasks only — this project has no sprints.
L4606 child(div): No tasks on the board yet — task progress will appear here once work is added.
L4607 child(div): No tasks on the board yet. Add your first task to start tracking progress.
L4634 text(div): Next step
L4639 text(div): Open board
L4656 text(div): Requires attention
L4665 text(div): Final submission
L4668 child(div): Ready for review
L4668 child(div): Submitted
L4668 child(div): Waiting for completion
L4682 child(div): Review the submitted work and record the outcome from here.
L4684 child(div): All required work is complete. Nothing has been submitted for review yet.
L4685 child(div): Not submitted yet. ${readinessReason}
L4687 child(div): Your work has been submitted — open Final submission to check its status.
L4692 text(div): Mentor left feedback (
L4693 text(div): ) — open Final submission to read it.
L4698 text(div): Sprints signed off
L4714 text(div): Tasks complete
L4720 text(div): Status
L4734 child(div): Mentor review and outcome are handled here.
L4736 child(div): View your submitted work and any mentor feedback here.
L4737 child(div): Complete the required work to make submission available.
L4747 str: Edit sprint
L4747 str: Add sprint
L4770 str: Update sprint
L4770 str: Add sprint
L4775 prop:text: Upcoming
L4776 prop:text: In progress
L4777 prop:text: Blocked
L4778 prop:text: At risk
L4779 prop:text: Done
L4794 prop:label: Done
L4797 prop:label: At risk
L4800 prop:label: Blocked
L4803 prop:label: In progress
L4805 prop:label: Upcoming
L4820 prop:label: Not started
L4825 str: Marked done, but progress is recorded at ${progressValue}%.
L4831 prop:label: In progress
L4834 str: Marked upcoming, but ${progressValue}% of the work is already recorded.
L4840 str: All work is recorded as complete, but this sprint is still flagged ${statusMeta.label.toLowerCase()}.
L4891 return: dueSoon
L5229 str: To Do
L5242 call:message.success: Pulled "${task.title}" into ${activeSprint.title || "the active sprint"}.
L5242 call:message.success: the active sprint
L5244 str: Couldn't pull this task into the sprint.
L5254 str: To Do
L5255 str: In Progress
L5256 str: In Review
L5257 prop:label: Blocked
L5258 prop:label: Completed
L5262 prop:label: All priorities
L5263 prop:label: High
L5264 prop:label: Medium
L5265 prop:label: Low
L5272 str: To Do
L5285 str: In Progress
L5285 str: In Review
L5447 prop:title: Resource
L5499 prop:label: Sprint ${index + 1}
L5519 prop:label: Task ${index + 1}
L5630 str: Date not recorded
L5668 prop:label: Member
L5709 prop:label: Sprint
[DEV] L5750 call:setTaskDetailLoadError: Failed to load task history.
L5790 str: To Do
L5842 str: rgba(38, 186, 199, 0.16)
L5843 str: rgba(124, 146, 255, 0.16)
L5844 str: rgba(236, 72, 153, 0.16)
L5845 str: rgba(245, 158, 11, 0.18)
L5846 str: rgba(34, 197, 94, 0.16)
L5847 str: rgba(139, 92, 246, 0.16)
[DEV] L6001 call:message.error: This task is missing an identifier and can't be reassigned.
L6023 str: To Do
[DEV] L6035 str: Failed to reassign this task.
[DEV] L6064 call:message.warning: Add team members to this project before auto-assigning.
[DEV] L6069 call:message.info: Nothing unassigned to auto-assign.
[DEV] L6094 call:message.success: Assigned ${assignedCount} task${assignedCount === 1 ? "" : "s"}.
[DEV] L6098 str: Auto-assign stopped after ${assignedCount} task${assignedCount === 1 ? "" : "s"} — the rest are still unassigned.
[DEV] L6099 str: Auto-assign failed before assigning anything.
L6131 attr:description(Empty): No team members yet. Add the learners working on this project so tasks can be assigned to them.
L6132 attr:description(Empty): No team members have been added to this project yet. Your mentor manages the roster.
[DEV] L6148 str: This is the only Project Mentor. Assign another Project Mentor first.
L6161 text(div): Edit
L6166 text(div): Remove
L6172 attr:title(Popconfirm): Remove ${getMemberDisplayName(member)}?
L6182 attr:okText(Popconfirm): Remove
L6186 text(div): Remove
[DEV] L6206 text(div): Mentor
[DEV] L6232 text(div): View LinkedIn profile
[DEV] L6258 text(div): Add your bio, current role and LinkedIn to your profile — students see it highlighted here once you do.
L6351 return: ${organizer} · with ${attendees.slice(0, 3).join(", ")}${attendees.length > 3 ? ` +${attendees.length - 3}` : ""}
L6351 return: +${attendees.length - 3}
[DEV] L6385 call:message.success: Meeting request withdrawn.
[DEV] L6387 str: Failed to withdraw the meeting request.
L6431 child(div): · ${formatMeetingTimeLabel(meeting)}
L6446 text(div): Join
L6452 text(div): Edit
L6456 attr:title(Popconfirm): Cancel this meeting?
L6457 attr:description(Popconfirm): This removes the meeting from the schedule for everyone on the team.
L6459 attr:okText(Popconfirm): Cancel meeting
L6462 text(div): Cancel
L6471 attr:title(Popconfirm): Withdraw this meeting request?
L6472 attr:description(Popconfirm): Your mentor will no longer see this request.
L6474 attr:okText(Popconfirm): Withdraw request
L6477 text(div): Withdraw
L6491 child(div): View notes
L6491 child(div): Add notes
L6513 prop:title: Untitled task
L6516 prop:title: Untitled sprint
L6525 str: Add at least one sprint or task to define submission readiness.
L6527 str: The workspace is ready for final submission.
L6528 str: Complete the required tasks and sprints to unlock final submission.
L6545 str: Review submission
L6547 str: Submit final work
L6549 str: View submission
L6550 str: Submission available after completion
L6650 call:message.warning: Complete the required work first.
L6715 attr:label(Form.Item): Title
L6715 attr:name(Form.Item): title
L6715 prop:message(Form.Item): Release title is required
L6716 attr:placeholder(Input): e.g. Release 3.0 — Rules Engine
L6718 attr:label(Form.Item): Target date
L6718 attr:name(Form.Item): targetDate
L6722 attr:label(Form.Item): Notes
L6722 attr:name(Form.Item): notes
L6723 attr:placeholder(Input.TextArea): What ships in this release?
L6726 text(Form): Cancel
L6728 child(Form): Update release
L6728 child(Form): Create release
L6735 prop:label: Shipped
L6736 prop:label: In progress
L6737 prop:label: Planned
L6746 attr:label(Form.Item): Title
L6747 attr:name(Form.Item): title
L6749 prop:message(Form.Item): Sprint title is required
L6750 prop:message(Form.Item): Sprint title must be 220 characters or fewer
L6753 attr:placeholder(Input): Sprint title
L6756 attr:label(Form.Item): What does done look like?
L6757 attr:name(Form.Item): description
L6758 attr:tooltip(Form.Item): The acceptance criteria for this sprint. Students see this on the card.
L6760 attr:placeholder(Input.TextArea): e.g. API returns paginated results and the integration test suite passes
L6763 attr:label(Form.Item): Sprint goal
L6764 attr:name(Form.Item): goal
L6765 attr:tooltip(Form.Item): One sentence: what this sprint is trying to achieve, not the list of tasks in it.
L6767 attr:placeholder(Input): e.g. Get the loan application form working end to end
L6771 attr:label(Form.Item): Sprint dates
L6772 attr:name(Form.Item): sprintDates
L6775 attr:tooltip(Form.Item): This sprint is active — dates are locked until it's completed.
L6776 attr:tooltip(Form.Item): A fixed time box is what makes velocity across sprints comparable.
L6789 attr:label(Form.Item): Due
L6789 attr:name(Form.Item): due
L6790 attr:placeholder(DatePicker): Pick a due date
L6792 attr:label(Form.Item): Status
L6792 attr:name(Form.Item): status
L6796 attr:label(Form.Item): Ships in release
L6797 attr:name(Form.Item): releaseKey
[DEV] L6800 attr:tooltip(Form.Item): Create a release first — a sprint can't be added until one exists.
[DEV] L6801 attr:tooltip(Form.Item): Every sprint ships in exactly one release.
[DEV] L6803 prop:message(Form.Item): Pick the release this sprint ships in
[DEV] L6812 attr:placeholder(Select): No releases yet — add one first
[DEV] L6812 attr:placeholder(Select): Pick a release
L6831 text(Form): Cancel
[DEV] L6854 text(ProjectModalShell): Release
L6858 attr:label(Descriptions.Item): Status
L6859 attr:label(Descriptions.Item): Target date
[DEV] L6860 child(ProjectModalShell): Not set
L6862 attr:label(Descriptions.Item): Sprints
L6862 text(ProjectModalShell): of
L6862 text(ProjectModalShell): complete
[DEV] L6863 attr:label(Descriptions.Item): Points
L6863 text(ProjectModalShell): of
[DEV] L6874 text(ProjectModalShell): What ships in this release
[DEV] L6879 attr:message(Alert): A sprint in this release needs attention
L6883 text(ProjectModalShell): Edit
L6886 attr:title(Popconfirm): Ship this release?
[DEV] L6887 attr:description(Popconfirm): This marks it as delivered. It can be un-shipped later if needed.
L6891 text(ProjectModalShell): Ship
L6897 attr:title(Popconfirm): Un-ship this release?
L6898 attr:description(Popconfirm): Reverts it to Planned/In progress. Use this to correct a mistake, not to casually toggle shipped status.
L6901 text(ProjectModalShell): Un-ship
L6909 attr:title(Popconfirm): Remove this release?
[DEV] L6910 attr:description(Popconfirm): This cannot be undone.
L6914 text(ProjectModalShell): Remove
[DEV] L6928 text(ProjectModalShell): Complete every linked sprint before shipping this release.
[DEV] L6933 text(ProjectModalShell): Move or remove
[DEV] L6934 text(ProjectModalShell): linked sprint
[DEV] L6934 text(ProjectModalShell): before this release can be removed.
L6954 child(ProjectModalShell): Sprint ${sprint.sprintNumber}
L6954 child(ProjectModalShell): Sprint
[DEV] L6955 child(ProjectModalShell): · Ships ${sprint.releaseTitle || sprint.releaseLabel}
[DEV] L6961 attr:label(Descriptions.Item): State
L6963 child(ProjectModalShell): Active
L6963 child(ProjectModalShell): Completed
L6963 child(ProjectModalShell): Planned
L6966 attr:label(Descriptions.Item): Status
[DEV] L6969 attr:label(Descriptions.Item): Dates
[DEV] L6969 child(ProjectModalShell): Not set
L6970 attr:label(Descriptions.Item): Due
L6972 child(ProjectModalShell): Overdue · was due ${dueLabel}
L6972 child(ProjectModalShell): Due soon · ${dueLabel}
L6972 child(ProjectModalShell): Due ${dueLabel}
L6980 attr:aria-label(Progress): ${sprint.title}: ${progressValue}% complete
L6984 text(ProjectModalShell): of
[DEV] L6984 text(ProjectModalShell): complete — open on the board
L6987 text(ProjectModalShell): No tasks linked yet
L6991 text(ProjectModalShell): What does done look like?
L7030 attr:title(Popconfirm): Start this sprint?
L7031 attr:description(Popconfirm): Dates lock once it's active — you won't be able to change start/end until you complete it.
L7033 attr:okText(Popconfirm): Start sprint
L7035 text(ProjectModalShell): Start sprint
L7040 attr:title(Popconfirm): Complete this sprint?
L7041 attr:description(Popconfirm): Anything not done goes back to the backlog to be re-planned — nothing carries forward automatically.
L7043 attr:okText(Popconfirm): Complete sprint
L7045 text(ProjectModalShell): Complete sprint
[DEV] L7057 attr:title(Popconfirm): Reopen this sprint?
[DEV] L7058 attr:description(Popconfirm): Sets it back to active. Tasks already carried over to the backlog on completion stay there -- re-sprint anything that belongs back in.
[DEV] L7060 attr:okText(Popconfirm): Reopen sprint
[DEV] L7063 text(ProjectModalShell): Reopen sprint
L7068 text(ProjectModalShell): Edit
L7070 attr:title(Popconfirm): Remove "${sprint.title}"?
L7080 attr:okText(Popconfirm): Remove
L7083 text(ProjectModalShell): Remove
[DEV] L7088 text(ProjectModalShell): Complete the currently active sprint before reopening this one.
L7113 text(div): Project team
L7114 text(div): See who is assigned, what role they play, and how the project is staffed.
L7141 text(div): Add member
L7154 text(div): Meetings
L7155 text(div): Upcoming meetings and recent history.
L7162 text(div): Schedule meeting
L7166 text(div): Request a meeting
L7176 text(div): Next meeting
L7189 child(div): · ${formatMeetingTimeLabel(upcomingTeamMeeting)}
L7214 child(div): Scheduled
L7220 text(div): Join
L7226 text(div): Edit
L7230 attr:title(Popconfirm): Cancel this meeting?
L7231 attr:description(Popconfirm): This removes the meeting from the schedule for everyone on the team.
L7233 attr:okText(Popconfirm): Cancel meeting
L7236 text(div): Cancel
L7252 attr:title(Popconfirm): Withdraw this meeting request?
L7253 attr:description(Popconfirm): Your mentor will no longer see this request. You can raise a new one at any time.
L7255 attr:okText(Popconfirm): Withdraw request
L7258 text(div): Withdraw request
L7275 attr:description(Empty): No upcoming meeting scheduled. Schedule one to give the team a checkpoint.
L7277 attr:description(Empty): No upcoming meeting scheduled. You can request a slot with ${projectMentorName}.
L7278 attr:description(Empty): No upcoming meeting scheduled. A mentor has not been assigned to this project yet, so meeting requests are unavailable.
L7289 text(div): Also scheduled
L7293 text(div): more upcoming
L7313 child(div): Past meetings
L7313 child(div): Meeting history
L7318 child(div): Show fewer
L7319 child(div): View all ${pastTeamMeetings.length}
[DEV] L7354 text(div): Roadmap
[DEV] L7357 text(div): Release
L7358 text(div): of
L7369 text(div): All
[DEV] L7369 text(div): releases shipped
[DEV] L7374 text(div): shipped
[DEV] L7377 attr:aria-label(div): Releases in order
[DEV] L7382 str: · needs attention
L7396 text(div): Shipped
L7397 text(div): In progress
L7398 text(div): Planned
[DEV] L7399 text(div): Needs attention
[DEV] L7418 child(div): Active now
[DEV] L7418 child(div): Up next
[DEV] L7430 child(div): ${pinnedSprintViewModel.counts.done} of ${pinnedSprintViewModel.counts.total} tasks complete
L7431 child(div): No tasks linked yet
L7450 attr:message(Alert): Sprints are signed off by your mentor
L7453 attr:description(Alert): All the work on ${sprintRollup.total === 1 ? "this sprint" : "these sprints"} is recorded as complete. Your mentor still needs to mark ${sprintRollup.total - sprintRollup.done} of them as done before the project can be submitted.
L7453 attr:description(Alert): this sprint
L7453 attr:description(Alert): these sprints
L7454 attr:description(Alert): Filling a progress bar does not complete a sprint — your mentor marks each one as done. ${sprintRollup.done} of ${sprintRollup.total} are signed off so far, and all of them must be before the project can be submitted.
[DEV] L7473 text(div): No tasks linked yet.
L7478 str: To Do
[DEV] L7486 attr:aria-label(li): ${task.title || "Untitled task"}, ${laneLabel}
L7486 attr:aria-label(li): Untitled task
L7491 child(div): Untitled task
L7493 child(div): Unassigned
[DEV] L7496 child(div): ${points} pt${points === 1 ? "" : "s"}
[DEV] L7512 str: No dates set
[DEV] L7521 attr:aria-label(div): ${vm.sprint.title}: ${expanded ? "collapse" : "expand"} tasks
L7543 text(div): Active
[DEV] L7557 attr:aria-label(span): ${vm.counts.done} of ${vm.counts.total} tasks done
[DEV] L7557 attr:aria-label(span): ${vm.progressValue}% complete
[DEV] L7563 child(div): ${vm.counts.done}/${vm.counts.total} tasks
[DEV] L7563 child(div): ${vm.progressValue}%
[DEV] L7566 attr:title(Tooltip): This sprint needs attention
[DEV] L7566 attr:aria-label(Badge): Needs attention
L7572 text(div): Tasks
[DEV] L7573 child(div): · ${vm.counts.done} of ${vm.counts.total} done
L7596 return: dueSoon
[DEV] L7630 child(div): ${targetTone === "overdue" ? "Overdue · was due " : targetTone === "dueSoon" ? "Due soon · " : isShipped ? "Target was " : "Target "}${dayjs(release.targetDate).format("DD MMM YYYY")}
[DEV] L7630 child(div): Overdue · was due
[DEV] L7630 child(div): Due soon ·
[DEV] L7630 child(div): Target was
[DEV] L7630 child(div): Target
[DEV] L7631 child(div): No target date
[DEV] L7637 attr:aria-label(span): ${sprintDone} of ${sprintTotal} sprints done
[DEV] L7641 text(div): sprints
[DEV] L7644 text(div): No sprints yet
[DEV] L7646 attr:title(Tooltip): A sprint in this release needs attention
[DEV] L7646 attr:aria-label(Badge): Needs attention
L7658 text(div): Sprint
[DEV] L7667 text(div): No sprints in this release yet.
[DEV] L7702 attr:placeholder(Input): Search releases, sprints, or tasks…
[DEV] L7706 attr:aria-label(Input): Search releases, sprints, or tasks
[DEV] L7711 child(div): Collapse all
[DEV] L7711 child(div): Expand all
L7719 text(div): Add release
[DEV] L7726 text(div): Nothing matches “
[DEV] L7735 attr:label(ListSkeleton): Loading project releases
[DEV] L7742 attr:message(Alert): Couldn't load releases
[DEV] L7744 text(Alert): Retry
[DEV] L7753 attr:description(Empty): No releases yet. Every sprint ships in a release, so start there — students cannot submit until every sprint is signed off.
[DEV] L7754 attr:description(Empty): Your mentor has not set up any releases for this project yet. They will appear here once they do.
L7758 text(div): Add release
[DEV] L7769 text(div): Every release has shipped.
[DEV] L7783 text(div): Shipped releases
[DEV] L7785 child(div): Hide
[DEV] L7785 child(div): Show
L7803 text(div): Product backlog
L7805 text(div): not in any sprint
L7816 text(div): pt
[DEV] L7820 attr:title(Tooltip): Didn't finish in ${sprintTitleByKey.get(task.carriedOverFromSprintKey) || task.carriedOverFromSprintKey} — back in the backlog to be re-planned.
L7821 text(div): Carried over
L7831 text(div): Pull into
L7832 child(div): active sprint
L7840 text(div): Start a sprint above to pull work into it.
L7851 text(div): Velocity
L7854 text(div): % of sprint work has ever carried over
L7858 text(div): Points committed vs. completed for every sprint that's closed out — the number a mentor watches to tell whether the team's pace is realistic, improving, or slipping. A task that didn't finish carries over to the backlog instead of counting as done.
L7864 child(div): Sprint ${m.sprintNumber}
L7867 text(div): pts
L7870 text(div): carried over
L7888 attr:description(Empty): Tasks have moved to the board.
[DEV] L7939 text(div): Filters
L7949 text(div): Saving your change…
L7953 child(div): Create task
L7953 child(div): Add my task
[DEV] L7975 attr:title(Drawer): Filters
L8004 text(div): Lane
L8040 text(div): Priority
L8046 attr:aria-label(Select): Filter board by priority
L8050 prop:label(Select): All priorities
L8051 prop:label(Select): High
L8052 prop:label(Select): Medium
L8053 prop:label(Select): Low
L8058 text(div): Sprint scope
L8063 attr:aria-label(Select): Board sprint scope
L8067 prop:label(Select): Current sprint + backlog
L8068 prop:label(Select): All sprints (full history)
L8073 text(div): Assignee
L8077 attr:aria-label(Select): Filter board by assignee
L8083 prop:label(Select): All assignees
L8084 prop:label(Select): Mine
L8085 prop:label(Select): Unassigned
L8093 text(div): Showing
L8094 text(div): task
L8094 text(div): from the current sprint and backlog ·
L8094 text(div): total in this project's full history. Switch “Sprint scope” to see everything.
L8098 text(div): Rendering
L8099 text(div): of
L8099 text(div): matching historical tasks to keep the board responsive.
L8100 text(div): Show 150 more
L8119 attr:description(Empty): No tasks on this board yet. Create the first one to give the team somewhere to start.
L8120 attr:description(Empty): No tasks on this board yet. Add your first task to start tracking your work.
L8124 child(div): Create task
L8124 child(div): Add my task
L8130 attr:description(Empty): None of the ${totalBoardTaskCount} ${totalBoardTaskCount === 1 ? "task" : "tasks"} on this board match your current filters.
L8140 text(div): Clear filters
L8198 attr:aria-label(Tag): ${laneShown} of ${laneTotal} tasks shown
L8199 attr:aria-label(Tag): ${laneShown} ${laneShown === 1 ? "task" : "tasks"}
L8202 child(div): ${laneShown} / ${laneTotal}
L8215 attr:aria-label(div): ${BOARD_LANE_LABEL[lane] || lane} tasks
L8222 child(div): None match your filters
L8223 child(div): No tasks
L8241 attr:dueLabel(BoardTaskCard): No due date
L8303 attr:dueLabel(BoardCardBody): No due date
[DEV] L8329 prop:label: All releases
L8339 prop:label: Current sprint + backlog
L8340 prop:label: All sprints (full history)
[DEV] L8342 prop:label: All sprints in this release
L8370 prop:label: Unassigned
[DEV] L8394 attr:title(Tooltip): This sprint is active and this task still has nobody on it
[DEV] L8395 text(div): Needs assigning
L8409 attr:dueLabel(BoardTaskCard): No due date
[DEV] L8430 attr:aria-label(Select): Reassign "${task.title}"
[DEV] L8460 text(div): Filters
L8465 text(div): Showing
L8466 text(div): of
L8466 text(div): task
[DEV] L8471 attr:title(Drawer): Filters
[DEV] L8490 text(div): Release
[DEV] L8494 attr:aria-label(Select): Filter Task Allocation by release
L8501 text(div): Sprint
[DEV] L8505 attr:aria-label(Select): Filter Task Allocation by sprint
[DEV] L8516 text(div): Drag a task between columns to reassign it, or use the menu on any card.
L8520 text(div): Saving…
[DEV] L8524 attr:title(Popconfirm): Auto-assign unassigned tasks?
[DEV] L8525 attr:description(Popconfirm): Distributes ${performanceBuckets.unassigned.length} unassigned task${performanceBuckets.unassigned.length === 1 ? "" : "s"} across the team, fewest-tasks-first. Work already assigned is never touched.
[DEV] L8529 text(div): Auto-assign
L8554 attr:label(PerformanceBucketDropZone): Unassigned
L8556 text(div): Unassigned
[DEV] L8560 attr:aria-label(div): Unassigned tasks
[DEV] L8562 text(div): Nothing unassigned.
[DEV] L8594 text(div): done
[DEV] L8595 child(div): · ${blockedCount} blocked
[DEV] L8596 child(div): · ${points} pts
[DEV] L8597 child(div): · ${unsizedCount} unsized
[DEV] L8600 attr:aria-label(div): ${getMemberDisplayName(member)}'s tasks
[DEV] L8602 text(div): No tasks yet.
L8625 attr:dueLabel(BoardCardBody): No due date
[DEV] L8642 text(div): My tasks
L8647 text(div): of
L8647 text(div): complete
[DEV] L8656 attr:description(Empty): No tasks assigned to you yet.
[DEV] L8659 str: Your tasks
[DEV] L8686 text(Collapse): Team tasks
[DEV] L8688 text(Collapse): teammate
[DEV] L8695 text(Collapse): No teammates on this project yet.
[DEV] L8705 text(Collapse): No tasks assigned.
L8740 child(div): Add resource
L8740 child(div): Share a resource
L8743 text(div): Last updated
L8756 child(div): Showing
L8756 child(div): Total
L8761 text(div): of
L8768 text(div): Files
L8772 text(div): Links
L8776 text(div): Other
L8783 attr:label(Form.Item): Search
L8786 attr:placeholder(Input.Search): Search title, description, file name, or link
L8791 attr:label(Form.Item): Type
L8798 attr:label(Form.Item): Status
L8807 prop:label(Select): Active
L8808 prop:label(Select): Draft
L8809 prop:label(Select): Archived
L8810 prop:label(Select): All
L8815 attr:label(Form.Item): Sprint
L8823 attr:label(Form.Item): Task
L8843 text(div): Clear filters
L8847 text(div): Filters narrow the list while preserving the resource order.
L8855 child(div): Edit resource
L8855 child(div): Add resource
L8857 child(div): Cancel edit
L8857 child(div): Close
L8861 attr:label(Form.Item): Title
L8861 attr:name(Form.Item): title
L8861 prop:message(Form.Item): Resource title is required
L8862 attr:placeholder(Input): Resource title
L8864 attr:label(Form.Item): Description
L8864 attr:name(Form.Item): description
L8865 attr:placeholder(Input.TextArea): Short note about how this resource should be used
L8868 attr:label(Form.Item): Type
L8868 attr:name(Form.Item): type
L8868 prop:message(Form.Item): Resource type is required
L8871 prop:label(Select): File
L8872 prop:label(Select): Link
L8873 prop:label(Select): Document
L8874 prop:label(Select): Code
L8875 prop:label(Select): Note
L8876 prop:label(Select): Environment
L8882 attr:label(Form.Item): Status
L8882 attr:name(Form.Item): status
L8885 prop:label(Select): Active
L8886 prop:label(Select): Draft
L8887 prop:label(Select): Archived
L8891 attr:label(Form.Item): Related sprint
L8891 attr:name(Form.Item): sprintId
L8892 attr:placeholder(Select): Optional sprint
L8894 attr:label(Form.Item): Related task
L8894 attr:name(Form.Item): taskId
L8895 attr:placeholder(Select): Optional task
L8911 attr:label(Form.Item): Visible to
L8912 attr:name(Form.Item): visibility
L8913 attr:tooltip(Form.Item): Mentor-only resources stay hidden from learners on this project.
L8917 prop:label(Select): Everyone on the project
L8918 prop:label(Select): Mentors only
L8923 attr:name(Form.Item): isPinned
L8924 text(div): Pinned
L8926 attr:name(Form.Item): isRequired
L8927 text(div): Required
L8934 attr:label(Form.Item): Access notes
L8935 attr:name(Form.Item): accessNotes
L8936 attr:tooltip(Form.Item): How to get in — credentials location, request process, or who to ask.
L8938 attr:placeholder(Input.TextArea): e.g. Request access from the mentor before the sprint review
L8943 attr:name(Form.Item): fileUrl
L8946 attr:name(Form.Item): fileName
L8950 attr:label(Form.Item): Resource URL
L8951 attr:name(Form.Item): resourceUrl
L8952 prop:message(Form.Item): Add a link or upload a file before saving
L8954 attr:placeholder(Input): URL or uploaded file link
L8966 attr:label(Form.Item): Or upload a file
L8967 attr:extra(Form.Item): PDF, Word, PowerPoint, text, ZIP or image · up to ${MAX_PROJECT_FILE_SIZE_MB}MB
L8976 child(div): Uploading…
L8976 child(div): Upload file
L8981 text(div): Attached
L8989 child(div): Update resource
L8989 child(div): Add resource
L8991 text(div): Cancel
L8998 child(div): Edit resource
L8998 child(div): Share a resource
L9000 child(div): Cancel edit
L9000 child(div): Close
L9007 text(div): Share a link or file with your team. You can edit or remove anything you add.
L9011 attr:label(Form.Item): Title
L9011 attr:name(Form.Item): title
L9011 prop:message(Form.Item): Resource title is required
L9012 attr:placeholder(Input): Resource title
L9014 attr:label(Form.Item): Description
L9014 attr:name(Form.Item): description
L9015 attr:placeholder(Input.TextArea): Short note about this resource
L9017 attr:name(Form.Item): type
L9020 attr:name(Form.Item): status
L9025 attr:name(Form.Item): fileUrl
L9028 attr:name(Form.Item): fileName
L9032 attr:label(Form.Item): Resource URL
L9033 attr:name(Form.Item): resourceUrl
L9034 prop:message(Form.Item): Add a link or upload a file before saving
L9036 attr:placeholder(Input): Paste a link
L9039 attr:label(Form.Item): Or upload a file
L9040 attr:extra(Form.Item): PDF, Word, PowerPoint, text, ZIP or image · up to ${MAX_PROJECT_FILE_SIZE_MB}MB
L9049 child(div): Uploading…
L9049 child(div): Upload file
L9054 text(div): Attached
L9060 child(div): Update resource
L9060 child(div): Add resource
L9062 text(div): Cancel
L9080 attr:description(Empty): No resources yet. Add the briefs, templates and reference links your team will need.
L9081 attr:description(Empty): No resources yet. Share the first link or file with your team.
L9086 child(div): Add resource
L9086 child(div): Share a resource
L9093 attr:description(Empty): None of the ${normalizedResources.length} ${normalizedResources.length === 1 ? "resource" : "resources"} on this project match your current filters.
L9105 text(div): Clear filters
L9122 text(div): Drag resources to change priority. Filters disable drag reordering.
L9187 text(div): Type
L9193 attr:aria-label(Select): Filter activity by type
L9195 attr:placeholder(Select): All activity
L9207 prop:label(Select): Sprint changes
L9208 prop:label(Select): Task changes
L9209 prop:label(Select): Team & meetings
L9210 prop:label(Select): Resources shared
L9211 prop:label(Select): Submission updates
L9212 prop:label(Select): Project details
[DEV] L9218 text(div): Date range
[DEV] L9224 attr:aria-label(DatePicker.RangePicker): Filter activity by date range
L9232 text(div): Times shown in
L9244 attr:aria-label(div): Project activity
L9269 attr:description(Empty): We couldn't load this project's activity. The history is still there — this is a connection problem, not an empty log.
L9279 text(div): Try again
[DEV] L9293 attr:description(Empty): No activity matches this source and date range.
[DEV] L9295 attr:description(Empty): No activity in this date range.
L9296 attr:description(Empty): No activity recorded from this source yet.
L9304 text(div): Clear filters
L9311 attr:description(Empty): No project activity yet. Task moves, sprint updates and resource changes will appear here.
L9322 str: Project activity
L9382 text(div): Load more activity
L9391 attr:description(Empty): No project content available for this section.
L9405 attr:title(ProjectsShell): Project
L9406 attr:subtitle(ProjectsShell): Loading project workspace...
L9409 text(ProjectsShell): Back to projects
L9415 attr:title(Result): Couldn't load this project
[DEV] L9427 attr:label(DetailSkeleton): Loading project workspace
L9435 attr:title(ProjectsShell): Project
L9444 attr:subtitle(ProjectsShell): Project workspace
L9448 text(ProjectsShell): Back to projects
[DEV] L9480 attr:message(Alert): Archived workspace
[DEV] L9481 attr:description(Alert): This workspace is archived. You can read everything here, but tasks, resources, meetings and the submission can no longer be changed.
L9489 attr:message(Alert): Read-only project access
L9490 attr:description(Alert): Your ${viewerFacultyMembership?.role || viewerFacultyMembership?.roleLabel || "faculty"} role can review this workspace, but only the Project Mentor or Co-Mentor can change mentor-managed project content.
L9512 text(ProjectsShell): Project overview
L9513 text(ProjectsShell): Edit about this project
L9514 text(ProjectsShell): Keep the project description clear, current, and useful for students and mentor review.
L9522 attr:label(Form.Item): About this project
L9522 attr:name(Form.Item): goal
L9523 attr:placeholder(Input.TextArea): Project description shown to both student and mentor
L9526 attr:label(Form.Item): Deliverables
L9527 attr:name(Form.Item): deliverables
L9533 new Error: Add at least one deliverable.
L9537 attr:placeholder(Input.TextArea): One deliverable per line. Use lines or bullets.
L9539 attr:label(Form.Item): Definition of done
L9539 attr:name(Form.Item): definitionOfDone
L9540 attr:placeholder(Input.TextArea): One condition per line — what makes the whole project done, not a single task.
L9542 attr:label(Form.Item): Personas
L9542 attr:name(Form.Item): personas
L9543 attr:placeholder(Input.TextArea): One per line, e.g. Frontend lead — owns the board UI and component structure
L9547 attr:label(Form.Item): Next step
L9547 attr:name(Form.Item): nextAction
L9547 attr:extra(Form.Item): Shown as the 'Next step' strip on the Overview tab. Leave blank to clear.
L9548 attr:placeholder(Input.TextArea): What should this project's team do next?
L9550 attr:label(Form.Item): Blocker / requires attention
L9550 attr:name(Form.Item): blocker
L9550 attr:extra(Form.Item): Shown as a 'Requires attention' banner on the Overview tab. Leave blank to clear once resolved.
L9551 attr:placeholder(Input.TextArea): What's blocking this project right now?
L9557 text(ProjectsShell): Cancel
L9560 text(ProjectsShell): Save overview
L9582 text(ProjectsShell): Releases
[DEV] L9583 child(ProjectsShell): Edit release
L9583 child(ProjectsShell): Add release
[DEV] L9584 text(ProjectsShell): Group sprints into a shippable release. It can only be marked shipped once every linked sprint is completed.
L9602 text(ProjectsShell): Sprints
L9604 text(ProjectsShell): Students see this timeline read-only, and you sign each sprint off.
L9626 text(ProjectsShell): Project people
L9629 child(ProjectsShell): Edit ${editingMemberName}'s role
L9629 child(ProjectsShell): Edit member role
L9630 text(ProjectsShell): Update only the role label for this project member.
L9633 attr:label(Form.Item): Role label
L9633 attr:name(Form.Item): roleLabel
L9633 prop:message(Form.Item): Role is required
L9634 attr:placeholder(Input): Project lead, reviewer, contributor...
L9644 text(ProjectsShell): Cancel
L9647 text(ProjectsShell): Update member
L9667 text(ProjectsShell): Project people
L9668 text(ProjectsShell): Add a team member
L9669 text(ProjectsShell): Add a learner or faculty member from this college onto the project team.
L9684 attr:label(Form.Item): Member type
L9684 attr:name(Form.Item): userType
L9684 prop:message(Form.Item): Select a member type
L9687 prop:label(Select): Learner (student)
L9688 prop:label(Select): Faculty (mentor)
L9693 attr:label(Form.Item): Person
L9694 attr:name(Form.Item): userId
L9695 prop:message(Form.Item): Select a person to add
L9696 attr:extra(Form.Item): Search by name — results are limited to this project's college.
L9701 attr:placeholder(Select): Type a name to search
L9706 attr:notFoundContent(Select): Can't search — this project has no college on record
L9707 attr:notFoundContent(Select): No matches
L9713 attr:label(Form.Item): Display name (optional)
L9713 attr:name(Form.Item): displayName
L9714 attr:placeholder(Input): Shown on the team list if provided
L9716 attr:label(Form.Item): Role label (optional)
L9716 attr:name(Form.Item): roleLabel
L9717 attr:placeholder(Input): Contributor, reviewer, co-mentor...
L9725 text(ProjectsShell): Cancel
L9728 text(ProjectsShell): Add member
L9747 child(ProjectsShell): Review submission
L9747 child(ProjectsShell): Final submission
L9748 child(ProjectsShell): Final submission
L9751 child(ProjectsShell): Review the learner submission, update the outcome, and capture feedback in one place.
L9752 child(ProjectsShell): Add the final notes and attachment once the project is ready for submission.
L9760 child(ProjectsShell): Ready for review
L9760 child(ProjectsShell): Submitted
L9760 child(ProjectsShell): Waiting for completion
L9764 child(ProjectsShell): The submission gate is open.
L9766 child(ProjectsShell): Your work has been submitted and is awaiting mentor review.
L9767 child(ProjectsShell): Complete the required sprints and tasks to unlock final submission.
L9776 attr:message(Alert): This submission may have changed since you opened this review
L9777 attr:description(Alert): Refresh the page to load the latest version before accepting, requesting changes, or locking.
L9784 text(ProjectsShell): Sprints
L9790 text(ProjectsShell): Tasks
L9796 text(ProjectsShell): Submission
L9806 text(ProjectsShell): Learner submission
L9807 text(ProjectsShell): Review the submission and decide the outcome.
L9810 child(ProjectsShell): Submitted
L9810 child(ProjectsShell): Not submitted
L9815 text(ProjectsShell): Submitted by
L9816 child(ProjectsShell): Unknown
L9816 child(ProjectsShell): Not yet submitted
L9819 text(ProjectsShell): Submitted at
L9820 child(ProjectsShell): Not yet submitted
L9823 text(ProjectsShell): Attachment
L9831 text(ProjectsShell): None
L9839 text(ProjectsShell): Open attachment
L9846 text(ProjectsShell): Review status
L9847 child(ProjectsShell): Pending
L9850 text(ProjectsShell): Submission type
L9851 child(ProjectsShell): Unknown
L9854 text(ProjectsShell): A draft attachment has been saved, but the learner hasn't formally submitted it yet.
L9865 text(ProjectsShell): Additional files & links
L9886 text(ProjectsShell): Added by
L9895 text(ProjectsShell): Summary
L9896 child(ProjectsShell): No summary submitted yet.
L9899 text(ProjectsShell): Learner notes
L9900 child(ProjectsShell): No student notes provided.
L9904 text(ProjectsShell): Review notes
L9914 text(ProjectsShell): Submit final work
L9915 text(ProjectsShell): Add a concise summary, notes, and the final attachment.
L9917 text(ProjectsShell): Revision
L9923 attr:message(Alert): This is your team's shared submission
L9924 attr:description(Alert): Any active team member can view and edit it — there's no single designated submitter. Changes save automatically as you type.
L9927 text(ProjectsShell): Last edited by
[DEV] L9929 child(ProjectsShell): · ${backendTimeLabel(deliveryRecord.lastUpdatedAt)}
L9937 text(ProjectsShell): What’s left before you can submit
L9941 child(ProjectsShell): Sprint:
L9946 text(ProjectsShell): more
L9958 str: Changes Requested
L9959 str: Changes Requested
L9962 text(ProjectsShell): Mentor review:
L9962 child(ProjectsShell): Pending
L9964 child(ProjectsShell): No written feedback was left with this review.
L9973 attr:message(Alert): This submission is locked
L9973 attr:message(Alert): This submission has been accepted
L9974 attr:description(Alert): It can no longer be edited from here. Ask your mentor to reopen it if changes are needed.
L9990 attr:label(Form.Item): Primary link (optional)
L9990 attr:name(Form.Item): attachmentUrl
L9992 attr:placeholder(Input): Paste a link, or upload a file below
L10009 attr:label(Form.Item): Summary
L10009 attr:name(Form.Item): summary
L10010 attr:placeholder(Input): Short summary of what was submitted
L10012 attr:label(Form.Item): Notes
L10012 attr:name(Form.Item): notes
L10013 attr:placeholder(Input.TextArea): Add any final notes
[DEV] L10016 attr:label(Form.Item): Additional files & links (${deliveryAttachments.length} of ${MAX_DELIVERY_ATTACHMENTS})
L10039 child(ProjectsShell): Added by ${item.addedByName}
[DEV] L10050 text(ProjectsShell): Limit reached — remove one above to add another.
L10056 attr:placeholder(Input): Paste another link and press Add
L10064 text(ProjectsShell): Add link
L10071 text(ProjectsShell): Upload
L10081 child(ProjectsShell): Unsaved changes…
L10082 child(ProjectsShell): Saving…
L10083 child(ProjectsShell): All changes saved
L10084 child(ProjectsShell): Couldn't autosave — use Save draft
L10086 text(ProjectsShell): Close
L10087 text(ProjectsShell): Save draft
L10091 attr:title(Popconfirm): Submit on behalf of your team?
L10092 attr:description(Popconfirm): This is a shared submission — once submitted, your mentor will be notified it's ready for review.
L10094 attr:okText(Popconfirm): Submit
L10097 text(ProjectsShell): Submit project
L10110 text(ProjectsShell): Review outcome
L10111 text(ProjectsShell): Set the review result and leave feedback for the learner.
L10142 attr:label(Form.Item): Review feedback
L10142 attr:name(Form.Item): feedback
L10143 attr:placeholder(Input.TextArea): Feedback for the learner
L10146 text(ProjectsShell): Close
L10155 attr:title(Popconfirm): Reopen this submission for revision?
L10156 attr:description(Popconfirm): The learner will be able to edit and resubmit it.
L10158 attr:okText(Popconfirm): Reopen
L10160 text(ProjectsShell): Reopen for revision
L10164 attr:title(Popconfirm): Request changes on this submission?
L10165 attr:description(Popconfirm): The learner will see your feedback and be able to edit and resubmit it.
L10167 attr:okText(Popconfirm): Request changes
L10175 attr:title(Button): This delivery isn't currently awaiting review
L10176 text(ProjectsShell): Request changes
L10182 attr:title(Popconfirm): Accept this submission?
L10183 attr:description(Popconfirm): The learner will be notified their submission was accepted.
L10185 attr:okText(Popconfirm): Accept
L10192 attr:title(Button): This delivery isn't currently awaiting review
L10193 text(ProjectsShell): Accept submission
L10199 attr:title(Popconfirm): Lock this submission?
L10200 attr:description(Popconfirm): The learner will no longer be able to edit or resubmit it.
L10202 attr:okText(Popconfirm): Lock
L10205 attr:title(Button): Lock this submission so it can no longer be edited
L10205 text(ProjectsShell): Lock submission
L10218 text(ProjectsShell): Submission history
L10219 text(ProjectsShell): Every save, submit, and review action on this delivery — visible to the whole team.
L10232 child(ProjectsShell): Someone
L10240 child(ProjectsShell): updated the delivery
L10262 attr:title(ProjectModalShell): Request a meeting
L10265 attr:label(Form.Item): Title
L10265 attr:name(Form.Item): title
L10265 prop:message(Form.Item): Meeting title is required
L10266 attr:placeholder(Input): What do you want to discuss?
L10276 attr:label(Form.Item): Preferred date
L10276 attr:name(Form.Item): meetingDate
L10276 prop:message(Form.Item): Preferred date is required
L10289 attr:label(Form.Item): Preferred start time
L10289 attr:name(Form.Item): startTime
L10289 prop:message(Form.Item): Preferred start time is required
L10307 attr:label(Form.Item): Preferred end time
L10308 attr:name(Form.Item): endTime
L10309 attr:dependencies(Form.Item): startTime
L10311 prop:message(Form.Item): Preferred end time is required
L10319 new Error: End time must be after the start time.
L10328 attr:label(Form.Item): Agenda / reason
L10328 attr:name(Form.Item): agenda
L10329 attr:placeholder(Input.TextArea): Briefly describe what you'd like to cover
L10337 text(ProjectsShell): Cancel
L10340 text(ProjectsShell): Send request
L10372 attr:label(Form.Item): Title
L10372 attr:name(Form.Item): title
L10372 prop:message(Form.Item): Meeting title is required
L10373 attr:placeholder(Input): Meeting title
L10375 attr:label(Form.Item): Status
L10375 attr:name(Form.Item): meetingStatus
L10375 prop:message(Form.Item): Meeting status is required
L10378 prop:label(Select): Requested
L10379 prop:label(Select): Scheduled
L10380 prop:label(Select): Rescheduled
L10381 prop:label(Select): Completed
L10382 prop:label(Select): Cancelled
L10383 prop:label(Select): Draft
L10390 attr:label(Form.Item): Ceremony
L10390 attr:name(Form.Item): meetingType
L10393 prop:label(Select): General
L10394 prop:label(Select): Sprint planning
L10395 prop:label(Select): Standup
L10396 prop:label(Select): Sprint review
L10397 prop:label(Select): Retrospective
L10417 attr:label(Form.Item): Meeting date
L10418 attr:name(Form.Item): meetingDate
L10419 prop:message(Form.Item): Meeting date is required
L10421 attr:extra(Form.Item): Times are in ${viewerTimezoneLabel}
L10430 attr:label(Form.Item): Start time
L10430 attr:name(Form.Item): startTime
L10430 prop:message(Form.Item): Start time is required
L10434 attr:label(Form.Item): End time
L10435 attr:name(Form.Item): endTime
L10436 attr:dependencies(Form.Item): startTime
L10447 new Error: End time must be after the start time.
L10467 text(ProjectsShell): People & links
L10468 text(ProjectsShell): Organised by
L10469 text(ProjectsShell): · visible to everyone on the project
L10474 attr:label(Form.Item): Meeting link
L10475 attr:name(Form.Item): meetingUrl
L10477 prop:message(Form.Item): Meeting link is required.
L10481 new Error: Meeting link is required.
L10489 new Error: Meeting link must start with http:// or https://
L10493 new Error: Enter a valid meeting link.
L10499 attr:placeholder(Input): https://meet.google.com/...
L10501 attr:label(Form.Item): Linked sprint
L10501 attr:name(Form.Item): linkedSprintKey
L10504 attr:placeholder(Select): Optional sprint
L10507 prop:label: Sprint
L10511 attr:label(Form.Item): Linked task
L10511 attr:name(Form.Item): linkedTaskKey
L10514 attr:placeholder(Select): Optional task
L10517 prop:label: Task
L10525 text(ProjectsShell): Agenda and follow-up
L10527 attr:label(Form.Item): Agenda
L10527 attr:name(Form.Item): agenda
L10528 attr:placeholder(Input.TextArea): Agenda
L10530 attr:label(Form.Item): Notes
L10530 attr:name(Form.Item): notes
L10531 attr:placeholder(Input.TextArea): Meeting notes
L10533 attr:label(Form.Item): Action items
L10533 attr:name(Form.Item): actionItemsText
L10534 attr:placeholder(Input.TextArea): One action item per line
L10536 attr:label(Form.Item): Outcome
L10536 attr:name(Form.Item): outcome
L10537 attr:placeholder(Input.TextArea): What changed after the meeting
L10547 attr:label(Form.Item): What went well?
L10548 attr:name(Form.Item): retroWentWell
L10549 attr:tooltip(Form.Item): One per line — kept as free text since a retro's value is in the discussion, not a structured form.
L10551 attr:placeholder(Input.TextArea): e.g. Standups stayed under 10 minutes
L10553 attr:label(Form.Item): What didn't go well?
L10553 attr:name(Form.Item): retroDidntGoWell
L10554 attr:placeholder(Input.TextArea): e.g. Two stories were carried over because they weren't broken down small enough
L10557 attr:label(Form.Item): Actions for next sprint
L10558 attr:name(Form.Item): retroActions
L10559 attr:tooltip(Form.Item): Concrete commitments, not general intentions — e.g. 'split any story over 5 points before planning' rather than 'communicate better'.
L10561 attr:placeholder(Input.TextArea): One action per line
L10566 attr:label(Form.Item): Follow-up at
L10566 attr:name(Form.Item): followUpAt
L10569 attr:label(Form.Item): Follow-up status
L10569 attr:name(Form.Item): followUpStatus
L10572 prop:label(Select): Open
L10573 prop:label(Select): In progress
L10574 prop:label(Select): Done
L10575 prop:label(Select): Blocked
L10580 attr:label(Form.Item): Follow-up notes
L10580 attr:name(Form.Item): followUpNotes
L10581 attr:placeholder(Input.TextArea): Follow-up details or action owner notes
L10589 text(ProjectsShell): Cancel
L10593 child(ProjectsShell): Update meeting
L10593 child(ProjectsShell): Add meeting
L10652 text(ProjectsShell): Board action
L10653 text(ProjectsShell): Task create
L10655 text(ProjectsShell): Create task
L10656 text(ProjectsShell): Add a new work item directly from the board.
L10668 attr:label(Form.Item): Task title
L10669 attr:name(Form.Item): title
L10671 prop:message(Form.Item): Task title is required
L10672 prop:message(Form.Item): Task title must be 200 characters or fewer
L10675 attr:placeholder(Input): Define the task
L10677 attr:label(Form.Item): Description
L10677 attr:name(Form.Item): description
L10678 attr:placeholder(Input.TextArea): Short task summary, acceptance note, or context
L10680 attr:label(Form.Item): Status
L10680 attr:name(Form.Item): status
L10680 prop:message(Form.Item): Status is required
L10689 attr:label(Form.Item): Priority
L10689 attr:name(Form.Item): priority
L10689 prop:message(Form.Item): Priority is required
L10692 prop:label(Select): Low
L10693 prop:label(Select): Medium
L10694 prop:label(Select): High
L10698 attr:label(Form.Item): Sprint
L10698 attr:name(Form.Item): sprintKey
L10699 attr:placeholder(Select): Leave blank for the backlog
L10701 attr:label(Form.Item): Due
L10701 attr:name(Form.Item): due
L10707 attr:label(Form.Item): Estimate
L10707 attr:name(Form.Item): estimatePoints
L10707 attr:tooltip(Form.Item): Relative size, not a time guess.
L10708 attr:placeholder(Select): Not yet estimated
L10710 attr:label(Form.Item): Type
L10710 attr:name(Form.Item): taskType
L10714 attr:label(Form.Item): Assignee
L10714 attr:name(Form.Item): assigneeId
L10717 attr:placeholder(Select): Assign to a team member
L10719 attr:notFoundContent(Select): Add team members first
L10725 attr:label(Form.Item): Done when (optional)
L10726 attr:name(Form.Item): acceptanceCriteria
L10727 attr:tooltip(Form.Item): The concrete condition that makes this task finished — not a restatement of the description.
L10729 attr:placeholder(Input.TextArea): e.g. Form submits and shows a confirmation screen
L10732 attr:label(Form.Item): Approach (optional)
L10733 attr:name(Form.Item): approach
L10734 attr:tooltip(Form.Item): The worked, how-to-do-this guidance for this task.
L10736 attr:placeholder(Input.TextArea): How to actually go about this task
L10744 attr:label(Form.Item): Blocked reason
L10745 attr:name(Form.Item): blockerReason
L10746 prop:message(Form.Item): A reason is required when creating a task as Blocked
L10748 attr:placeholder(Input.TextArea): Explain what is blocking this task
L10752 text(ProjectsShell): Cancel
L10753 text(ProjectsShell): Create task
L10770 text(ProjectsShell): Task action
L10771 text(ProjectsShell): What’s blocking this task?
L10773 child(ProjectsShell): "${blockerDropPrompt.taskTitle}" needs
L10773 child(ProjectsShell): Moving a task to Blocked needs
L10773 text(ProjectsShell): a reason so anyone looking at the board knows what needs to be resolved.
L10779 attr:label(Form.Item): Blocker reason
L10780 attr:name(Form.Item): blockerReason
L10781 prop:message(Form.Item): Tell us what's blocking this task
L10783 attr:placeholder(Input.TextArea): e.g. Waiting on API access from IT
L10786 text(ProjectsShell): Cancel
L10787 text(ProjectsShell): Move to Blocked
L10804 text(ProjectsShell): Task action
[DEV] L10805 text(ProjectsShell): What are you submitting?
[DEV] L10807 child(ProjectsShell): Moving "${submissionDropPrompt.taskTitle}"
[DEV] L10807 child(ProjectsShell): Moving this task
[DEV] L10807 text(ProjectsShell): to In Review needs a link so your mentor can check the work — a commit/PR, a deployed URL, a Drive file, whatever fits.
[DEV] L10814 attr:label(Form.Item): Submission link
[DEV] L10815 attr:name(Form.Item): submissionUrl
[DEV] L10817 prop:message(Form.Item): Add a link to what you're submitting
L10824 new Error: Links must start with http:// or https://
[DEV] L10828 new Error: That doesn't look like a valid link
[DEV] L10833 attr:extra(Form.Item): Make sure it's shared as “Anyone with the link can view” so your mentor can actually open it.
[DEV] L10835 attr:placeholder(Input): https://github.com/your-org/repo/pull/12
L10838 text(ProjectsShell): Cancel
[DEV] L10839 text(ProjectsShell): Move to In Review
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L2552 str: Failed to load releases:
[PROD-ONLY] L2622 call:message.success: Release removed. Its sprints are back in the unassigned group.
[PROD-ONLY] L4931 str: Failed to load task details.
[PROD-ONLY] L5881 text(div): Sprints completed
[PROD-ONLY] L5889 text(div): Overdue
[PROD-ONLY] L6008 attr:tooltip(Form.Item): Groups this sprint under a release for reporting — create releases below first.
[PROD-ONLY] L6012 attr:placeholder(Select): No release
[PROD-ONLY] L6047 text(div): Group sprints into shippable releases. A release can only be marked shipped once every sprint linked to it is completed.
[PROD-ONLY] L6088 text(div): No releases yet — sprints ship independently until you group some into a release.
[PROD-ONLY] L6099 text(div): sprints complete
[PROD-ONLY] L6100 child(div): · ${release.completedPoints || 0}/${release.committedPoints || 0} pts
[PROD-ONLY] L6101 child(div): · target ${dayjs(release.targetDate).format("DD MMM YYYY")}
[PROD-ONLY] L6119 attr:description(Popconfirm): This marks it as delivered. It can be un-shipped later if needed, but treat this as a real sign-off.
[PROD-ONLY] L6127 attr:title(Button): Mark this release shipped
[PROD-ONLY] L6127 attr:title(Button): Every linked sprint must be completed first
[PROD-ONLY] L6147 attr:title(Popconfirm): Remove this SHIPPED release?
[PROD-ONLY] L6150 attr:description(Popconfirm): This release already shipped — removing it deletes that record permanently. Its sprints go back to unassigned.
[PROD-ONLY] L6151 attr:description(Popconfirm): Its sprints go back to unassigned.
[PROD-ONLY] L6176 attr:description(Empty): No sprints yet. Add the sprints this project should be measured against — students cannot submit until every sprint is signed off.
[PROD-ONLY] L6177 attr:description(Empty): Your mentor has not set any sprints for this project yet. They will appear here once they do.
[PROD-ONLY] L6218 child(div): · Active
[PROD-ONLY] L6218 child(div): · Completed
[PROD-ONLY] L6218 child(div): · Planned
[PROD-ONLY] L6225 text(div): Ships
[PROD-ONLY] L6233 child(div): Started
[PROD-ONLY] L6233 text(div): by
[PROD-ONLY] L6283 text(div): Progress
[PROD-ONLY] L6405 attr:title(Tooltip): Didn't finish in ${task.carriedOverFromSprintKey} — back in the backlog to be re-planned.
[PROD-ONLY] L7421 text(div): Show all sources
[PROD-ONLY] L7988 child(ProjectsShell): · ${new Date(deliveryRecord.lastUpdatedAt).toLocaleString()}
```

#### `src/components/Projects/ProjectModalShell.jsx` (branch: both (identical); 0 strings)
(no user-facing strings)

#### `src/components/Projects/ProjectsContent.jsx` (branch: both (differs); 55 strings)
used by: LEARNER: learn/projects/index.js | MENTOR: mentor/projects/index.js
```text
L209 new Error: The projects page did not return a valid records array.
L222 call:setError: Failed to load projects.
L239 attr:title(ProjectsShell): Projects
L240 attr:subtitle(ProjectsShell): Choose a project to open its workspace.
[DEV] L244 attr:label(RefreshStatus): Refreshing projects…
[DEV] L249 attr:message(Alert): Couldn't refresh projects
L249 attr:message(Alert): Projects could not be loaded
[DEV] L251 attr:description(Alert): Showing the last projects loaded for this view.
L252 attr:description(Alert): Check your connection, then try again. Your project data has not been changed.
L253 text(Alert): Retry
L263 attr:aria-label(Input.Search): Search my projects
L264 attr:placeholder(Input.Search): Search project title, course or slug
L272 attr:aria-label(Select): Filter projects by status
L273 attr:placeholder(Select): All statuses
L277 prop:label(Select): Current only
L278 prop:label(Select): Active
L279 prop:label(Select): In progress
L280 prop:label(Select): Ready
L281 prop:label(Select): Blocked
L282 prop:label(Select): Archived
L288 attr:aria-label(Select): Filter projects needing attention
L289 attr:placeholder(Select): All attention states
L293 prop:label: Needs my review
L293 prop:label: Needs my action
L294 prop:label(Select): Blocked
L298 text(ProjectsShell): Clear filters
[DEV] L307 attr:label(SkeletonRegion): Loading projects
L313 attr:description(Empty): No projects match these filters.
L313 attr:description(Empty): No projects assigned yet.
L332 str: No due date
L357 child(ProjectsShell): Archived
L357 child(ProjectsShell): Blocked
L357 child(ProjectsShell): Active
L359 text(ProjectsShell): Needs review
L360 text(ProjectsShell): Changes requested
[DEV] L361 text(ProjectsShell): Draft submission
L362 text(ProjectsShell): Stalled
L365 child(ProjectsShell): Project
L367 child(ProjectsShell): Mentor
L375 child(ProjectsShell): In progress
L384 child(ProjectsShell): Task completion
L384 child(ProjectsShell): Admin-reported progress
L384 child(ProjectsShell): ${project.readiness.completedTasks || 0}/${project.readiness.totalTasks} tasks
L384 child(ProjectsShell): Manual estimate
L403 text(ProjectsShell): Review submission
L403 text(ProjectsShell): Open review
L405 text(ProjectsShell): Update your submission
L405 text(ProjectsShell): Open submission
[DEV] L407 text(ProjectsShell): Finish your draft submission
L407 text(ProjectsShell): Open submission
L409 text(ProjectsShell): Open blocked work
L410 str: Open workspace
L415 text(ProjectsShell): Open workspace
L417 text(ProjectsShell): Open workspace
L433 attr:showTotal(Pagination): ${range[0]}–${range[1]} of ${total} projects
```

#### `src/components/Projects/ProjectsShell.jsx` (branch: both (differs); 2 strings)
used by: LEARNER: learn/projects/[projectId].js, learn/projects/index.js | MENTOR: mentor/projects/[projectId].js, mentor/projects/index.js
```text
L48 attr:ariaLabel(PageShell): Projects workspace
L50 attr:tabsAriaLabel(PageShell): Project sections
```

#### `src/components/Projects/modals/TaskDetailsModal.jsx` (branch: both (differs); 149 strings)
used by: LEARNER: learn/projects/[projectId].js | MENTOR: mentor/projects/[projectId].js
```text
L16 prop:label: Status changed
L17 prop:label: Sent for review
L18 prop:label: Flagged blocked
L25 prop:label: Note
L26 prop:label: Progress update
L27 prop:label: Flag for mentor
L32 prop:label: Review
L33 prop:label: Blocker
L34 prop:label: Status update
L57 return: To Do
L58 return: In Progress
L59 return: In Review
L60 return: Blocked
L61 return: Completed
L62 return: To Do
L81 prop:label: ${value} hr${value === 1 ? "" : "s"}
L81 prop:label: ${value} pt${value === 1 ? "" : "s"}
L85 prop:label: Story
L86 prop:label: Bug
L87 prop:label: Chore
L88 prop:label: Spike
L184 str: To Do
L206 str: Not set
L216 text(div): Task details
L219 child(div): Untitled task
L220 child(div): No description available.
L222 child(div): Medium
L222 text(div): priority
L223 text(div): Due
[DEV] L226 child(div): Assigned to ${selectedTask.assigneeName}
L226 child(div): Unassigned
L227 text(div): Sprint:
[DEV] L234 text(div): Type:
L237 text(div): Carried over
[DEV] L245 attr:title(Tag): This task isn't in the template's current task list -- either added directly here, or removed from the template since this workspace was created.
[DEV] L245 text(div): Not in template
[DEV] L258 text(div): Created by
[DEV] L260 child(div): · ${formatCommentTimestamp(selectedTask.createdAt)}
[DEV] L273 text(div): Last edited by
[DEV] L275 child(div): · ${formatCommentTimestamp(selectedTask.updatedAt)}
L282 text(div): Done when
L288 text(div): Approach
L296 attr:message(Alert): Blocked
[DEV] L305 text(div): Submission
[DEV] L311 text(div): · submitted by
L322 text(div): Task actions
L323 text(div): Change task state or remove it from the board.
L331 str: In Progress
L331 str: Moved task to In Progress.
L332 text(div): Move to in progress
L339 str: In Review
L339 str: Moved task to review.
L340 text(div): Move to review
L347 str: Task has been flagged for attention.
L348 text(div): Flag as blocked
L355 str: Marked task as done.
L356 text(div): Mark complete
L360 attr:title(Popconfirm): Delete this task?
L361 attr:description(Popconfirm): This permanently removes the task from the project board. It cannot be undone.
L373 attr:okText(Popconfirm): Delete
L376 text(div): Delete
L385 text(div): Edit task
L386 text(div): Update title, assignment, sprint, and status.
L395 attr:label(Form.Item): Title
L396 attr:name(Form.Item): title
L398 prop:message(Form.Item): Task title is required
L399 prop:message(Form.Item): Task title must be 200 characters or fewer
L402 attr:placeholder(Input): Task title
L404 attr:label(Form.Item): Status
L404 attr:name(Form.Item): status
L404 prop:message(Form.Item): Status is required
L407 attr:label(Form.Item): Priority
L407 attr:name(Form.Item): priority
L407 prop:message(Form.Item): Priority is required
L410 prop:label(Select): Low
L411 prop:label(Select): Medium
L412 prop:label(Select): High
L416 attr:label(Form.Item): Assignee
L416 attr:name(Form.Item): assigneeId
L417 attr:placeholder(Select): Assign to a team member
L419 attr:label(Form.Item): Sprint
L419 attr:name(Form.Item): sprintKey
L420 attr:placeholder(Select): Leave blank for the backlog
L422 attr:label(Form.Item): Due
L422 attr:name(Form.Item): due
L425 attr:label(Form.Item): Estimate
L425 attr:name(Form.Item): estimatePoints
L425 attr:tooltip(Form.Item): Relative size, not a time guess.
L426 attr:placeholder(Select): Not yet estimated
L428 attr:label(Form.Item): Type
L428 attr:name(Form.Item): taskType
L432 attr:label(Form.Item): Description
L432 attr:name(Form.Item): description
L433 attr:placeholder(Input.TextArea): Task description
L436 attr:label(Form.Item): Done when (optional)
L437 attr:name(Form.Item): acceptanceCriteria
L438 attr:tooltip(Form.Item): The concrete condition that makes this task finished — not a restatement of the description.
L440 attr:placeholder(Input.TextArea): e.g. Form submits and shows a confirmation screen
L443 attr:label(Form.Item): Approach (optional)
L444 attr:name(Form.Item): approach
L445 attr:tooltip(Form.Item): The worked, how-to-do-this guidance for this task.
L447 attr:placeholder(Input.TextArea): How to actually go about this task
L458 attr:label(Form.Item): Blocker note
L459 attr:name(Form.Item): blockerReason
L460 prop:message(Form.Item): A reason is required while this task is marked Blocked
L462 attr:placeholder(Input.TextArea): Describe what is blocking progress
L465 text(div): Save changes
[DEV] L475 child(div): Your work
[DEV] L475 child(div): Task access
[DEV] L479 child(div): Your work is with the mentor for review. You can still update the submission if needed.
[DEV] L481 child(div): This task is blocked. Resume it when the blocker is cleared, or keep the team updated in comments.
[DEV] L482 child(div): This task is assigned to you. Keep its status current and submit your work when it is ready.
[DEV] L484 child(div): You created this task, so you can remove it if it is no longer needed.
[DEV] L485 child(div): You can follow this team task and contribute comments, but only its assignee can change progress.
[DEV] L488 child(div): Assigned to you
[DEV] L488 child(div): Created by you
[DEV] L488 child(div): Team task
[DEV] L490 text(div): Everyone on the project can add notes, progress updates, or requests for help in Comments below.
[DEV] L492 child(div): As the assignee, you can also update this task's working state here.
L497 str: In Progress
[DEV] L497 text(div): Start work
L502 str: In Progress
[DEV] L502 text(div): Blocker resolved
[DEV] L507 text(div): I’m blocked
[DEV] L518 child(div): Resubmit for review
[DEV] L518 child(div): Submit for review
L523 attr:title(Popconfirm): Delete this task?
L524 attr:description(Popconfirm): This permanently removes the task from the project board. It cannot be undone.
L534 attr:okText(Popconfirm): Delete
L537 text(div): Delete task
[DEV] L551 attr:message(Alert): Task history unavailable
[DEV] L553 text(Alert): Retry history
L560 text(div): Activity
L561 text(div): Automatic record of status changes on this task — logged by the buttons above, not something anyone writes.
L568 attr:description(Empty): No status changes yet.
L577 child(div): Someone
L591 text(div): Comments
L592 text(div): Notes and progress updates people on this task have written.
L599 prop:label(Select): All comments
L605 attr:description(Empty): No comments yet.
L612 child(div): Unknown
L614 child(div): Note
L630 attr:label(Form.Item): Type
L630 attr:name(Form.Item): commentType
L633 attr:label(Form.Item): Message
L633 attr:name(Form.Item): message
L633 prop:message(Form.Item): Add a note before posting
L634 attr:placeholder(Input.TextArea): Share a progress update or note...
L636 text(div): Post comment
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L373 text(div): Student view
[PROD-ONLY] L376 child(div): You created this task, so you can remove it if it's no longer needed.
[PROD-ONLY] L377 child(div): Read-only task summary for learners.
[PROD-ONLY] L380 child(div): Your task
[PROD-ONLY] L380 child(div): View only
[PROD-ONLY] L382 text(div): Students can review the task status, due date, blocker notes, and assignment without editing anything.
```

#### `src/components/Quiz/QuizBuilderModal.jsx` (branch: both (differs); 88 strings)
used by: LEARNER: learn/allQuizzes.js, learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/allQuizzes.js, teacher/courses/[courseId]/[...courseTab].js | COLLEGE: college-admin/courses/[id].js
```text
[DEV] L66 str: All currently eligible sections for this course
[DEV] L80 str: Discard your unsaved quiz changes?
[DEV] L84 str: Route change aborted to preserve unsaved quiz changes.
L102 return: ${trimmed}:00
[DEV] L134 new Error: Quiz detail response was empty
L162 call:setLoadError: Unable to load quiz for editing
[DEV] L191 prop:label: Class ${id}
[DEV] L199 call:setClassesError: Could not load eligible sections for this course.
[DEV] L213 prop:title: Discard quiz changes?
[DEV] L213 prop:title: Discard this quiz draft?
[DEV] L214 prop:content: Your unsaved changes will be lost.
[DEV] L215 prop:okText: Discard
[DEV] L217 prop:cancelText: Keep editing
[DEV] L228 call:message.error: Reload the quiz before saving changes.
L232 call:message.error: Lesson and course are required to create a quiz.
[DEV] L236 call:message.error: Select a specific eligible section or choose all eligible sections.
[DEV] L263 call:message.success: Quiz updated and published. Learners can attempt it until the due date.
[DEV] L264 call:message.success: Quiz updated as a draft. Publish it when it is ready for learners.
[DEV] L268 call:message.success: Quiz created and published. Learners can attempt it until the due date.
[DEV] L269 call:message.success: Quiz created as a draft. Publish it when it is ready for learners.
L278 str: Unable to ${isEditMode ? "update" : "create"} quiz
L296 attr:title(Modal): Edit quiz
L296 attr:title(Modal): Create quiz
[DEV] L312 attr:message(Alert): Quiz changes were not saved
[DEV] L312 attr:message(Alert): Quiz was not created
[DEV] L324 attr:message(Alert): Could not load this quiz for editing
[DEV] L326 text(Alert): Retry
L341 attr:message(Alert): This quiz will be added to
L342 attr:description(Alert): No lesson selected
L345 attr:name(Form.Item): title
L345 attr:label(Form.Item): Quiz title
L345 prop:message(Form.Item): Enter a quiz title
L346 attr:placeholder(Input): Example: Java basics checkpoint
L350 attr:name(Form.Item): dueAt
L351 attr:label(Form.Item): Due date
[DEV] L353 attr:extra(Form.Item): Locked after learner submissions so assessment conditions cannot change retroactively.
[DEV] L355 attr:extra(Form.Item): This quiz is already closed. Its deadline cannot be moved forward.
L358 prop:message(Form.Item): Set a due date
[DEV] L368 new Error: Pick a due date and time in the future
L379 attr:placeholder(DatePicker): Select due date
L383 attr:name(Form.Item): maxAttempts
L384 attr:label(Form.Item): Attempts
[DEV] L386 attr:extra(Form.Item): Locked after learner submissions so a new attempt cannot be granted after answers may have been revealed.
L387 prop:message(Form.Item): Set allowed attempts
L392 attr:name(Form.Item): shuffleQuestions
L393 attr:label(Form.Item): Shuffle question order per learner
[DEV] L396 attr:extra(Form.Item): Locked after learner submissions so the assessment presentation cannot change mid-run.
L397 attr:extra(Form.Item): Every learner otherwise sees the same order, so one learner's answer sequence works for the whole room. Each learner keeps a stable order across refreshes.
L403 attr:name(Form.Item): shuffleOptions
L404 attr:label(Form.Item): Shuffle answer options per learner
[DEV] L407 attr:extra(Form.Item): Locked after learner submissions so the assessment presentation cannot change mid-run.
L408 attr:extra(Form.Item): Answers are matched by option, not position, so shuffling never affects grading.
L413 attr:name(Form.Item): publish
L413 attr:label(Form.Item): Publish now
[DEV] L417 attr:label(Form.Item): Audience
[DEV] L422 attr:label(Form.Item): Audience
[DEV] L432 text(Modal): All currently eligible sections for this course
[DEV] L433 text(Modal): One specific section
[DEV] L441 attr:message(Alert): Eligible sections unavailable
[DEV] L443 text(Alert): Retry sections
[DEV] L448 attr:label(Form.Item): Specific section
[DEV] L450 attr:extra(Form.Item): Section eligibility could not be verified.
[DEV] L452 attr:extra(Form.Item): Loading sections…
[DEV] L454 attr:extra(Form.Item): ${classOptions.length} current section${classOptions.length === 1 ? "" : "s"} available.
[DEV] L455 attr:extra(Form.Item): No current section is eligible for this course.
[DEV] L464 attr:placeholder(Select): Sections unavailable
[DEV] L464 attr:placeholder(Select): Select an eligible section
[DEV] L470 text(Modal): Shared quizzes are visible only to sections currently entitled to this course.
L479 attr:name(Form.List): questions
L485 text(Modal): Question
L487 text(Modal): Remove
L492 attr:label(Form.Item): Question
L492 prop:message(Form.Item): Enter the question
L496 attr:label(Form.Item): Type
[DEV] L496 prop:message(Form.Item): Choose a question type
L498 text(Modal): Single choice
L499 text(Modal): Multiple choice
L502 attr:label(Form.Item): Points
[DEV] L502 prop:message(Form.Item): Set question points
L541 prop:message(Form.Item): Enter option text
L543 attr:placeholder(Input): Option ${optionIndex + 1}
[DEV] L550 attr:aria-label(Button): Remove option ${optionIndex + 1} from question ${index + 1}
L560 text(Modal): Add option
L570 text(Modal): Add question
[DEV] L577 attr:message(Alert): Questions, deadline, attempt limit and randomization are locked after learner submissions. Title and description can still be corrected.
L581 text(Modal): Cancel
L583 child(Modal): Save changes
L583 child(Modal): Create quiz
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L56 str: This class only (class ${preservedClassId})
[PROD-ONLY] L57 str: Shared to all sections
[PROD-ONLY] L60 prop:label: This class only
[PROD-ONLY] L61 prop:label: Shared to all sections
[PROD-ONLY] L145 call:message.success: Quiz updated
[PROD-ONLY] L148 call:message.success: Quiz created
[PROD-ONLY] L227 attr:label(Form.Item): Visibility
[PROD-ONLY] L231 attr:name(Form.Item): contentScope
[PROD-ONLY] L231 attr:label(Form.Item): Visibility
[PROD-ONLY] L239 attr:label(Form.Item): Visibility
[PROD-ONLY] L240 text(Modal): Shared to all sections (no class selected)
[PROD-ONLY] L337 attr:message(Alert): Questions are locked after learner submissions. Metadata can still be saved.
```

#### `src/components/Quiz/Table/action.js` (branch: both (differs); 0 strings)
(no user-facing strings)

#### `src/components/Quiz/Table/quizeTitle.js` (branch: both (differs); 1 strings)
used by: LEARNER: learn/allQuizzes.js | FACULTY: teacher/allQuizzes.js
```text
L27 attr:alt(Image): New
```

#### `src/components/Quiz/Table/submission.js` (branch: both (differs); 3 strings)
used by: LEARNER: learn/allQuizzes.js | FACULTY: teacher/allQuizzes.js
```text
L12 attr:aria-label(button): View quiz submissions
L13 attr:title(button): View submissions
L14 text(div): View
```

#### `src/components/Quiz/Table/table.js` (branch: both (differs); 100 strings)
used by: LEARNER: learn/allQuizzes.js | FACULTY: teacher/allQuizzes.js
```text
L128 return: ${score}/${maxScore}
L128 return: ${score}
[DEV] L215 prop:content: Withholding results…
[DEV] L215 prop:content: Releasing results…
[DEV] L219 prop:content: Results withheld
[DEV] L219 prop:content: Results released to students
[DEV] L222 prop:content: Couldn't update results visibility
L260 str: Not released
L264 str: Not graded yet
[DEV] L276 prop:label: Draft
[DEV] L278 prop:label: Needs due date
[DEV] L280 prop:label: Closed
[DEV] L281 prop:label: Open
[DEV] L294 attr:title(Popconfirm): Withhold results?
[DEV] L294 attr:title(Popconfirm): Release results?
[DEV] L296 attr:description(Popconfirm): Students will stop seeing their scores and the correct answers.
[DEV] L297 attr:description(Popconfirm): Students will see scores and the answer key now that the quiz is closed.
[DEV] L298 attr:okText(Popconfirm): Withhold
[DEV] L298 attr:okText(Popconfirm): Release
[DEV] L306 attr:title(Button): Results can be released after the quiz deadline
[DEV] L309 child(Popconfirm): Released · Withhold
[DEV] L309 child(Popconfirm): Release results
[DEV] L309 child(Popconfirm): Release after deadline
L315 str: Untitled quiz
L319 attr:name(Name): Untitled quiz
L329 text(div): Submitted
[DEV] L333 text(div): Unavailable
[DEV] L337 text(div): Missed
L341 text(div): Pending
L347 text(div): Submitted
[DEV] L351 child(div): Not available
[DEV] L351 child(div): Not attempted
L351 child(div): Not Submitted
L373 attr:text(ActionQuiz): Preview Quiz
[DEV] L373 attr:text(ActionQuiz): Unavailable
[DEV] L373 attr:text(ActionQuiz): View answers
[DEV] L373 attr:text(ActionQuiz): Review quiz
L373 attr:text(ActionQuiz): Retake Quiz
[DEV] L373 attr:text(ActionQuiz): Review attempt
L373 attr:text(ActionQuiz): Start Quiz
[DEV] L384 attr:aria-label(Button): View quiz report
[DEV] L385 attr:title(Button): View report
L392 attr:aria-label(Button): Edit quiz
L393 attr:title(Button): Edit quiz
L397 attr:title(Popconfirm): Delete this quiz?
L398 attr:description(Popconfirm): Learners will no longer be able to open it. This cannot be undone.
L399 attr:okText(Popconfirm): Delete
L403 attr:aria-label(Button): Delete quiz
L482 call:setError: Failed to load quizzes. Please try again.
L500 call:message.error: Failed to load quiz submissions
[DEV] L517 prop:content: Checking quiz submissions…
L525 prop:title: This quiz already has learner submissions
[DEV] L526 prop:content: Questions, deadline, attempt limit and randomization are locked after ${count} submitted attempt${count === 1 ? "" : "s"}. You can still correct the title or description.
L527 prop:okText: Edit metadata
L528 prop:cancelText: Cancel
[DEV] L540 prop:content: Could not verify submissions. Only title/description editing is available right now.
[DEV] L552 prop:content: Deleting quiz…
L555 prop:content: Quiz deleted successfully
L558 prop:content: Failed to delete quiz
L565 prop:title: Overview
L566 prop:title: Course
L567 prop:title: Lesson
L568 prop:title: Due Date
L569 prop:title: Status
[DEV] L570 prop:title: Results
L571 prop:title: Submissions
L572 prop:title: Actions
L578 prop:title: Overview
L579 prop:title: Course
L580 prop:title: Lesson
L581 prop:title: Due Date
L582 prop:title: Status
L583 prop:title: Grade
L584 prop:title: Actions
L588 prop:title: No quizzes yet
L588 str: Create your first quiz to get started.
L589 prop:title: No quizzes yet
L589 str: Quizzes assigned to you by your teachers will appear here.
[DEV] L594 attr:label(RefreshStatus): Refreshing quizzes…
[DEV] L598 attr:message(Alert): Couldn't refresh quizzes
[DEV] L599 attr:description(Alert): Showing the last quizzes loaded for this view.
L602 text(Alert): Retry
L609 attr:title(Modal): Quiz submissions
L664 attr:description(Empty): No submissions yet
[DEV] L675 attr:message(Alert): You haven't been added to a class yet
[DEV] L676 attr:description(Alert): Quizzes appear once your college puts you in a class or section.
[DEV] L679 attr:message(Alert): Couldn't load your class, so quizzes can't be shown
L680 text(Alert): Retry
L687 attr:placeholder(Select): All courses
L691 prop:label(Select): All courses
[DEV] L696 text(div): Couldn't load your courses · Retry
[DEV] L701 attr:label(SkeletonRegion): Loading quizzes
L757 text(div): Due date
L761 text(div): Status
[DEV] L765 text(div): Results
L769 text(div): Submissions
L776 text(div): Due date
L780 text(div): Status
L784 text(div): Grade
L788 text(div): Submission
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L330 prop:content: You can update metadata such as title, due date, status, and attempt limits. Question changes are blocked after ${count} submitted attempt${count === 1 ? "" : "s"} so learner answers stay intact.
[PROD-ONLY] L344 call:message.warning: Could not verify submissions. Only quiz metadata can be edited right now.
```

#### `src/components/Quizzes/QuizzesContent.jsx` (branch: both (differs); 35 strings)
used by: LEARNER: learn/allQuizzes.js | FACULTY: teacher/allQuizzes.js
```text
[DEV] L70 call:setContextError: Unable to load your assigned courses. Please try again.
L125 str: Untitled lesson
[DEV] L137 call:setLessonsError: Unable to load lessons for this course. Please try again.
L144 call:message.warning: Select a course and lesson first.
L203 attr:title(Modal): Create quiz
L204 attr:okText(Modal): Continue
[DEV] L213 attr:label(ListSkeleton): Loading assigned courses
[DEV] L215 attr:message(Alert): Assigned courses could not be loaded
[DEV] L216 text(Alert): Retry
L218 attr:message(Alert): No assigned courses found
L218 attr:description(Alert): Assign yourself to a course before creating a quiz.
L224 attr:placeholder(Select): Select course and class
L227 prop:label: ${item.courseName} · ${item.className}
[DEV] L234 attr:placeholder(Select): Lessons unavailable — retry below
L234 attr:placeholder(Select): Select lesson
[DEV] L244 attr:message(Alert): Lessons could not be loaded
[DEV] L245 text(Alert): Retry lessons
[DEV] L247 attr:message(Alert): No lessons in this course yet
[DEV] L247 attr:description(Alert): Create a lesson before attaching a quiz to this course.
L252 attr:message(Alert): Quizzes are attached to lessons
L253 attr:description(Alert): This keeps faculty creation and learner attempts under the same course structure.
L271 attr:title(ListingPageHeader): My Quizzes
L271 attr:title(ListingPageHeader): All Quizzes
L272 attr:ariaLabel(ListingPageHeader): Quizzes overview
L277 attr:label(MetricPill): ${stats.total} ${stats.total === 1 ? "Quiz" : "Quizzes"}
L277 attr:label(MetricPill): Quiz
L277 attr:label(MetricPill): Quizzes
L283 attr:label(MetricPill): ${stats.uniqueCourses} ${stats.uniqueCourses === 1 ? "Course" : "Courses"}
L283 attr:label(MetricPill): Course
L283 attr:label(MetricPill): Courses
L285 attr:popoverTitle(MetricPill): Quizzes by Course
L292 attr:label(MetricPill): ${stats.submittedCount} Submitted
L294 attr:popoverTitle(MetricPill): Submitted Quizzes
L302 text(ListingPageHeader): Create Quiz
L307 attr:aria-label(section): Quiz list
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L63 call:message.error: Unable to load your courses
[PROD-ONLY] L113 call:message.error: Unable to load lessons for this course
```

#### `src/components/Report/AssignmentReportContent.jsx` (branch: lms-dev-2026 only; 25 strings)
used by: FACULTY: teacher/report/assignment/[contentId].js
```text
L49 call:setError: Report not found.
L64 new Error: Assignment not found
L79 new Error: Could not load assignment submissions
L84 str: Submission data loaded, but the class roster did not. Completion and missing-student counts may be unavailable.
L93 call:setError: Couldn't load this assignment's report: ${serverMessage}
L93 call:setError: Couldn't load this assignment's report. Please try again.
L109 call:message.error: Couldn't generate the PDF. Please try again.
L117 prop:title: This report is incomplete
L118 prop:content: ${partialWarning} The PDF will be marked as incomplete. Download anyway?
L119 prop:okText: Download marked incomplete
L120 prop:cancelText: Cancel
L131 attr:label(DashboardSkeleton): Loading assignment report
L140 attr:description(Empty): Report not found.
L143 text(div): Retry
L161 prop:label(ReportSummaryHeader): Submitted
L162 prop:label(ReportSummaryHeader): Average score
L163 prop:label(ReportSummaryHeader): Graded
L164 prop:label(ReportSummaryHeader): Due date
L171 attr:message(Alert): Report is partially loaded
L173 text(Alert): Retry roster
L179 text(div): Score distribution
L184 text(div): Submission timing
L193 text(div): Student scores
L201 text(ReportStudentTable): Late
L205 attr:emptyMessage(ReportStudentTable): No one has submitted this assignment yet.
```

#### `src/components/Report/QuestionAccuracyList.jsx` (branch: lms-dev-2026 only; 6 strings)
used by: FACULTY: teacher/report/quiz/[quizId].js
```text
L36 text(p): This quiz has no questions yet.
L52 attr:aria-label(div): ${q.prompt}: ${q.accuracyPercent}% correct, ${q.correctCount} of ${q.answeredCount}
L53 attr:aria-label(div): ${q.prompt}: not answered yet
L57 str: ${q.accuracyPercent ?? 0}%
L65 text(ol): correct
L68 text(ol): Not answered yet
```

#### `src/components/Report/QuizReportContent.jsx` (branch: lms-dev-2026 only; 23 strings)
used by: FACULTY: teacher/report/quiz/[quizId].js
```text
L40 call:setError: Report not found.
L65 str: Quiz and submission data loaded, but the class roster did not. Completion and missing-student counts may be unavailable.
L76 call:setError: Couldn't load this quiz's report: ${serverMessage}
L76 call:setError: Couldn't load this quiz's report. Please try again.
L92 call:message.error: Couldn't generate the PDF. Please try again.
L100 prop:title: This report is incomplete
L101 prop:content: ${partialWarning} The PDF will be marked as incomplete. Download anyway?
L102 prop:okText: Download marked incomplete
L103 prop:cancelText: Cancel
L114 attr:label(DashboardSkeleton): Loading quiz report
L122 attr:description(Empty): Report not found.
L124 text(div): Retry
L142 prop:label(ReportSummaryHeader): Submitted
L143 prop:label(ReportSummaryHeader): Average score
L144 prop:label(ReportSummaryHeader): Questions
L145 prop:label(ReportSummaryHeader): Due date
L152 attr:message(Alert): Report is partially loaded
L154 text(Alert): Retry roster
L160 text(div): Score distribution
L165 text(div): Question accuracy
L166 text(div): Worst-answered first.
L171 text(div): Student scores
L178 attr:emptyMessage(ReportStudentTable): No one has submitted this quiz yet.
```

#### `src/components/Report/ReportStudentTable.jsx` (branch: lms-dev-2026 only; 6 strings)
used by: FACULTY: teacher/report/assignment/[contentId].js, teacher/report/quiz/[quizId].js
```text
L36 str: No students yet.
L59 attr:placeholder(Input): Search students…
L66 text(div): Student
L67 text(div): Score
L79 child(div): Unnamed student
L99 text(div): No students match “
```

#### `src/components/Report/ReportSummaryHeader.jsx` (branch: lms-dev-2026 only; 2 strings)
used by: FACULTY: teacher/report/assignment/[contentId].js, teacher/report/quiz/[quizId].js
```text
L13 text(div): Back
L19 text(div): Download PDF
```

#### `src/components/Report/ScoreDistributionBars.jsx` (branch: lms-dev-2026 only; 4 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js, teacher/report/assignment/[contentId].js, teacher/report/quiz/[quizId].js
```text
L12 str: Below 60%
L32 text(p): No graded scores to chart yet.
L36 attr:aria-label(div): Score distribution across ${total} students
L73 attr:title(Popover): ${bucket.label} (${names.length})
```

#### `src/components/Report/SubmissionTimingCard.jsx` (branch: lms-dev-2026 only; 8 strings)
used by: FACULTY: teacher/report/assignment/[contentId].js
```text
L25 text(div): On time
L32 text(div): Late
L37 text(div): No submitted assignments to chart yet.
L39 attr:aria-label(div): ${safeOnTime} on time, ${safeLate} late
L40 str: ${Math.round((safeOnTime / total) * 100)}%
L41 str: ${Math.round((safeLate / total) * 100)}%
L47 text(div): Hasn't submitted (
L50 child(div): Unnamed student
```

#### `src/components/admin/AdminGroupShell.jsx` (branch: both (identical); 0 strings)
(no user-facing strings)

#### `src/components/admin/AdminTableToolbar.js` (branch: both (differs); 5 strings)
used by: COLLEGE: college-admin/electives.js
```text
L70 text(Space): Clear search
L72 text(Space): of
L72 text(Space): results
L77 text(Space): Export CSV
L79 text(Space): Refresh
```

#### `src/components/admin/AdminWorkflowGuide.jsx` (branch: both (differs); 6 strings)
used by: COLLEGE: college-admin/assignments.js, college-admin/attendance.js, college-admin/batch-promotion.js, college-admin/batches.js (+31 more)
```text
L18 attr:aria-label(nav): Academic setup steps
L21 text(nav): Academic setup
L21 text(nav): · Step
L21 text(nav): of
L24 text(nav): Previous:
L25 text(nav): Next:
```

#### `src/components/admin/AdminWorkspaceBreadcrumb.jsx` (branch: both (identical); 2 strings)
used by: COLLEGE: college-admin/projects/workspaces/[workspaceId]/audit.js, college-admin/projects/workspaces/[workspaceId]/delivery.js, college-admin/projects/workspaces/[workspaceId]/meetings.js, college-admin/projects/workspaces/[workspaceId]/overview.js (+6 more)
```text
L8 attr:aria-label(nav): Workspace location
L10 text(nav): Projects / Workspaces
```

#### `src/components/admin/AdminWorkspaceShell.jsx` (branch: both (identical); 2 strings)
used by: COLLEGE: college-admin/projects/workspaces/[workspaceId]/audit.js, college-admin/projects/workspaces/[workspaceId]/delivery.js, college-admin/projects/workspaces/[workspaceId]/meetings.js, college-admin/projects/workspaces/[workspaceId]/overview.js (+6 more)
```text
L25 attr:title(PageShell): Workspace
L25 attr:tabsAriaLabel(PageShell): Workspace sections
```

#### `src/components/admin/ModuleGroupGuard.jsx` (branch: both (differs); 7 strings)
used by: COLLEGE: college-admin/assignments.js, college-admin/attendance.js, college-admin/batch-promotion.js, college-admin/batches.js (+46 more)
```text
L30 prop:title: Placements is turned off for this college
[DEV] L32 prop:subTitle: The Placements module has been switched off, so drives, companies, interviews and hiring analytics are unavailable here.
L36 prop:title: Projects is turned off for this college
[DEV] L38 prop:subTitle: The Projects module has been switched off, so workspaces, templates, submissions and mentor assignment are unavailable here.
[DEV] L49 return: Turn it back on from Module Access if this looks wrong.
[DEV] L50 return: Modules are managed by your 42Students super admin. Ask them to turn it on if your college needs it.
[DEV] L73 attr:subTitle(Result): ${config.subTitle} ${moduleOffRecoveryHint(loginUser)}
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L31 prop:subTitle: The Placements module has been switched off in Module Access, so drives, companies, interviews and hiring analytics are unavailable here. Turn it back on from Module Access if this looks wrong.
[PROD-ONLY] L37 prop:subTitle: The Projects module has been switched off in Module Access, so workspaces, templates, submissions and mentor assignment are unavailable here. Turn it back on from Module Access if this looks wrong.
```

#### `src/components/admin/activity/ActivityCenter.jsx` (branch: lms-dev-2026 only; 39 strings)
used by: COLLEGE: college-admin/audit.js
```text
L24 prop:label: Important
L25 prop:label: Academic setup
L26 prop:label: People & access
L27 prop:label: Teaching
L28 prop:label: Projects
L29 prop:label: Everything
L33 prop:label: Today
L34 prop:label: 7 days
L35 prop:label: 30 days
L36 prop:label: All time
L47 return: Today
L48 return: Yesterday
L49 str: dddd, D MMM YYYY
L122 call:setError: Couldn't load activity.
L140 return: System
L141 return: Student #${r.actorUserId}
L141 return: Staff #${r.actorUserId}
L148 str: Unknown date
L160 prop:label: Time
L161 prop:label: Who
L162 prop:label: What
L163 prop:label: Item
L164 prop:label: Action key
L185 text(div): Refresh
L186 text(div): Export
L190 text(div): Deletions and restores, promotions, suspensions, impersonation, module access and feature changes, and identity views.
L196 attr:label(RefreshStatus): Refreshing activity…
L199 attr:message(Alert): Couldn't load activity
L200 text(Alert): Retry
L205 attr:label(ListSkeleton): Loading activity
L209 attr:description(Empty): Nothing important happened in this period.
L209 attr:description(Empty): No activity in this period.
L226 text(div): several at once
L229 child(div): Hide details
L229 child(div): Details
L237 text(div): IP
L238 text(div): When
L252 text(div): Load more (
L253 text(div): older)
```

#### `src/components/admin/activity/activityText.js` (branch: lms-dev-2026 only; 2 strings)
used by: COLLEGE: college-admin/audit.js
```text
L94 return: ${text.slice(0, 160)}…
L97 return: ${text.slice(0, 160)}…
```

#### `src/components/admin/courses/AdminCourseHome.jsx` (branch: both (differs); 3 strings)
used by: COLLEGE: college-admin/courses/[id].js
```text
L35 str: rgba(0, 0, 0, 0.88)
L38 text(div): Back
L296 text(div): In this Course
```

#### `src/components/admin/courses/AdminCourseSyllabus.jsx` (branch: both (differs); 17 strings)
used by: COLLEGE: college-admin/courses/[id].js
```text
[DEV] L92 prop:label: All content in this course (every section)
[DEV] L95 prop:label: ${name || `Class ${id}`}: what its students see
L95 prop:label: Class ${id}
L357 str: rgba(0, 0, 0, 0.88)
L360 text(div): Back
L377 text(div): Lessons
[DEV] L380 text(div): Lessons couldn't be loaded.
[DEV] L382 text(div): Retry
[DEV] L386 text(div): Sections couldn't be loaded, so you're seeing shared content only.
[DEV] L388 text(div): Retry
L399 attr:placeholder(Select): Select class to view
[DEV] L408 text(div): Showing every section's content together. Pick a section above to see exactly what its students see.
L429 text(div): Create New
L482 text(div): Created on
L597 prop:title: Lesson
L610 prop:message: Server Notification
L611 prop:description: Internal Server Error
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L72 prop:label: Generic (shared content only)
```

#### `src/components/admin/courses/CourseTeachersPanel.jsx` (branch: lms-dev-2026 only; 8 strings)
used by: COLLEGE: college-admin/courses/[id].js
```text
L6 str: Teaching assistant
L31 attr:aria-label(section): Who teaches this course
L32 text(section): Who teaches it
L34 text(section): Couldn't load teachers. Refresh to try again.
L42 child(section): All sections
L43 child(section): · Semester ${a.semester_number ?? a.semesterNumber}
L44 child(section): Unknown teacher
L45 child(section): Primary
```

#### `src/components/admin/dashboard/AdminDashboardView.js` (branch: both (differs); 4 strings)
used by: COLLEGE: college-admin/dashboard.js
```text
[DEV] L54 child(div): Your college
[DEV] L54 child(div): No college assigned
[DEV] L55 str: dddd, D MMMM YYYY
[DEV] L68 prop:label(Collapse): Setting up a new college? Step-by-step setup guide
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L40 str: Failed to fetch college details:
```

#### `src/components/admin/dashboard/AtAGlance.js` (branch: both (differs); 13 strings)
used by: COLLEGE: college-admin/dashboard.js
```text
[DEV] L39 new Error: Summary response was empty
[DEV] L44 call:setError: Could not load college summary
L55 prop:label: Students
L56 prop:label: Faculty
L57 prop:label: Courses
L58 prop:label: Active drives
L64 text(section): At a glance
[DEV] L65 text(section): Retry
[DEV] L68 attr:message(Alert): Couldn't load college summary
[DEV] L68 attr:description(Alert): The rest of the dashboard is still available.
[DEV] L69 text(Alert): Retry
[DEV] L72 attr:message(Alert): Summary refresh failed
[DEV] L73 attr:description(Alert): Showing the last successful college totals.
```

#### `src/components/admin/dashboard/AttentionBoard.js` (branch: lms-dev-2026 only; 54 strings)
used by: COLLEGE: college-admin/dashboard.js
```text
L21 str: ddd D MMM, h:mm A
L40 text(Card): Couldn't load this. Refresh to try again.
L61 text(ul): and
L61 text(ul): more
L106 attr:description(Empty): Couldn't load today's overview.
L107 text(section): Retry
L126 attr:aria-label(section): Needs attention
L128 text(section): Today
L129 text(section): Refresh
L132 text(section): Refresh failed. Showing the last overview loaded for this college.
L137 attr:aria-label(div): Today's classes
L140 text(section): scheduled today
L141 text(section): held so far
L143 text(section): with attendance taken
L146 text(section): Today's classes couldn't be loaded.
L151 attr:title(AttentionCard): Attendance not taken
L153 attr:empty(AttentionCard): Every class held in the last 7 days has attendance.
L154 text(AttentionCard): Open attendance
L157 child(Rows): Class session
L158 child(Rows): · ${r.facultyName}
L158 child(Rows): · no faculty set
L165 attr:title(AttentionCard): Under ${threshold}% attendance
L167 attr:empty(AttentionCard): No student is under ${threshold}% in the last 30 days.
L168 text(AttentionCard): Last 30 days, marked sessions only ·
L168 text(AttentionCard): Attendance
L171 child(Rows): Student ${r.learnerId}
L171 child(Rows): · ${r.rollNumber}
L173 text(Rows): of
L181 attr:title(AttentionCard): Waiting to be graded
L183 attr:empty(AttentionCard): No assignment submission is waiting for a grade.
L184 child(AttentionCard): Oldest from ${asDate(grading.oldestSubmittedAt).format("D MMM YYYY")} ·
L184 text(AttentionCard): Assignments
L187 child(Rows): Course ${r.courseId}
L188 text(Rows): · oldest
L195 attr:title(AttentionCard): Courses with no teacher
L197 attr:empty(AttentionCard): Every current-semester course has a teacher for every section.
L198 text(AttentionCard): Students see these with nobody behind them ·
L198 text(AttentionCard): Faculty assignment
L202 text(Rows): · Semester
L209 attr:title(AttentionCard): Setup gaps
L211 attr:empty(AttentionCard): Batches, sections, students and courses are all connected.
L213 prop:label: active batch with no classes
L214 prop:label: section with no students
L215 prop:label: student not in any class
L216 prop:label: course with no lessons
L224 attr:title(AttentionCard): Quizzes closing this week
L226 attr:empty(AttentionCard): No quiz closes in the next 7 days.
L227 text(AttentionCard): Quizzes
L230 child(Rows): Quiz ${r.quizId}
L232 attr:title(Tooltip): Only ${r.className}
L232 attr:title(Tooltip): All sections taking the course
L233 child(Rows): · ${r.className}
L234 text(Rows): · closes
L242 text(section): Nothing needs you right now.
```

#### `src/components/admin/dashboard/QuickActionsGrid.js` (branch: both (identical); 2 strings)
used by: COLLEGE: college-admin/dashboard.js
```text
L5 attr:aria-label(section): Quick Actions
L6 text(section): Quick Actions
```

#### `src/components/admin/dashboard/SetupGuide.js` (branch: both (identical); 4 strings)
used by: COLLEGE: college-admin/dashboard.js
```text
L6 attr:aria-label(section): Setup Guide
L7 text(section): Setup Guide (Follow in Order)
L8 text(section): If you're setting up the LMS for the first time, follow these phases in order. Each phase depends on the previous one being completed.
L37 attr:aria-label(Card): ${step.title} — ${step.desc}
```

#### `src/components/admin/dashboard/config.js` (branch: both (differs); 41 strings)
used by: COLLEGE: college-admin/dashboard.js
```text
L30 prop:label: Departments
L31 prop:label: Courses
L32 prop:label: Programs
L33 prop:label: Faculty
L34 prop:label: Students
L35 prop:label: Jobs
L36 prop:label: Hiring Dashboard
L37 prop:label: Attendance
L38 prop:label: Assignments
L39 prop:label: Quizzes
L40 prop:label: People Directory
L51 prop:title: Create Departments
L51 prop:desc: Academic departments
L59 prop:title: Create Courses
[DEV] L59 prop:desc: Add the subjects you teach (needs a department)
L60 prop:title: Add Lessons
L60 prop:desc: Create lessons for courses
L61 prop:title: Add Lesson Content
[DEV] L61 prop:desc: Videos, resources and live classes
L66 str: Academic Structure
[DEV] L69 prop:title: Set up Programs
L69 prop:desc: Degree programs (B.Tech, MBA)
L70 prop:title: Create Semesters
L70 prop:desc: Semesters within programs
[DEV] L71 prop:title: Map courses to semesters
[DEV] L71 prop:desc: Which courses each semester teaches
L72 prop:title: Create Batches
L72 prop:desc: Year batches (2024-2028)
L73 prop:title: Create Classes
[DEV] L73 prop:desc: Sections within each batch (e.g. CSE - A)
[DEV] L81 prop:title: Add Faculty
[DEV] L81 prop:desc: Teaching staff accounts
L82 prop:title: Assign Faculty
[DEV] L82 prop:desc: Who teaches which course for which section
[DEV] L83 prop:title: Add Students
[DEV] L83 prop:desc: Student accounts, placed in a section
L88 str: Lecture Halls & Jobs (Optional)
L91 prop:title: Add Lecture Halls
[DEV] L91 prop:desc: Rooms used in the timetable
L92 prop:title: Jobs & Placements
L92 prop:desc: Post and manage job openings
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L59 prop:desc: Add subjects/courses (needs Department)
[PROD-ONLY] L61 prop:desc: Upload videos, PDFs, etc.
[PROD-ONLY] L69 prop:title: Setup Programs
[PROD-ONLY] L71 prop:title: Map Semester-Courses
[PROD-ONLY] L71 prop:desc: Assign courses to semesters
[PROD-ONLY] L73 prop:desc: Sections within batches
[PROD-ONLY] L81 prop:title: Register Faculty
[PROD-ONLY] L81 prop:desc: Add instructors
[PROD-ONLY] L82 prop:desc: Map faculty to courses
[PROD-ONLY] L83 prop:title: Register Students
[PROD-ONLY] L83 prop:desc: Add learners to classes
[PROD-ONLY] L91 prop:desc: Physical/virtual rooms
```

#### `src/components/admin/dashboard/index.js` (branch: both (differs); 0 strings)
(no user-facing strings)

#### `src/components/admin/electives/AllocateModal.jsx` (branch: lms-dev-2026 only; 32 strings)
used by: COLLEGE: college-admin/electives.js
```text
L36 call:message.warning: Pick a class
L40 call:message.warning: Paste at least one roll number or learner id
L44 call:message.warning: Learner ids must all be positive numbers. Fix the invalid values and try again.
L70 call:message.info: Wait for the allocation to finish.
L78 prop:title: Discard allocation setup?
L79 prop:content: The student list, section choice and note in this dialog have not been applied.
L80 prop:okText: Discard changes
L82 prop:cancelText: Keep editing
L88 str: Capacity ${offering.capacity} (${offering.activeCount ?? 0} enrolled): students beyond it are waitlisted in the order added.
L89 str: Unlimited capacity.
L92 attr:title(Modal): Add students to ${offering.courseName || "this course"} — ${slot.name}
L92 attr:title(Modal): this course
L93 attr:okText(Modal): Add students
L97 attr:label(Form.Item): Identify students by
L99 prop:label(Radio.Group): Roll numbers
L99 prop:label(Radio.Group): Whole section
L102 attr:name(Form.Item): fromClassId
L102 attr:label(Form.Item): Section
L103 attr:extra(Form.Item): No section currently matches this slot's program, semester and academic year.
L104 prop:message(Form.Item): Pick a section
L105 attr:placeholder(Select): Every active student of this section
L109 attr:name(Form.Item): list
L109 attr:label(Form.Item): Paste one per line (or comma-separated)
L109 prop:message(Form.Item): Paste at least one
L110 attr:placeholder(Input.TextArea): 21CS001 21CS002
L113 attr:name(Form.Item): note
L113 attr:label(Form.Item): Note (optional)
L115 attr:description(Alert): Only students of this program who are in Semester ${slot.semesterNumber} right now are added. A student can take at most ${slot.maxPick} course${slot.maxPick === 1 ? "" : "s"} in ${slot.name}. Timetable clashes are shown as a warning but do not stop it.
L118 attr:message(Alert): ${result.added} added${result.waitlisted ? `, ${result.waitlisted} waitlisted` : ""}${result.unchanged ? `, ${result.unchanged} already enrolled` : ""}${result.errors?.length ? `, ${result.errors.length} skipped` : ""}
L118 attr:message(Alert): , ${result.waitlisted} waitlisted
L118 attr:message(Alert): , ${result.unchanged} already enrolled
L118 attr:message(Alert): , ${result.errors.length} skipped
```

#### `src/components/admin/electives/ElectiveSlotPanel.jsx` (branch: lms-dev-2026 only; 93 strings)
used by: COLLEGE: college-admin/electives.js
```text
L39 str: Could not load the slot
L62 prop:title: Discard these elective changes?
L63 prop:content: Your unsaved values will be lost.
L64 prop:okText: Discard
L66 prop:cancelText: Keep editing
L79 call:message.success: Offering added
L103 call:message.success: Faculty updated
L122 call:message.success: Capacity updated
L139 call:message.success: Offering archived
L150 prop:title: Course
L151 child(span): Course #${o.courseId}
L153 text(span): Section:
L155 prop:title: Faculty
L158 text(Space): Not assigned
L167 text(Space): Set faculty
L170 prop:title: Seats
L171 child(span): / ${o.capacity}
L171 child(span): · unlimited
L172 text(span): waitlisted
L173 text(span): Edit capacity
L176 prop:title: Status
L176 child(Tag): Active
L176 child(Tag): Archived
L179 text(Space): Roster
L180 text(Space): Add students
L181 attr:title(Popconfirm): Archive this offering?
L181 attr:description(Popconfirm): Enrolled students lose access; grades and attendance stay.
L182 text(Space): Archive
L198 attr:message(Alert): Could not refresh this elective slot
L199 text(Alert): Retry
L201 prop:label(Tabs): Offerings (${offerings.length})
L204 text(Tabs): credits ·
L204 text(Tabs): current student
L204 text(Tabs): seat
L204 text(Tabs): taken · each student picks
L204 child(Tabs): ${slot.minPick}–${slot.maxPick}
L205 text(Tabs): Add offering
L208 prop:emptyText: No offerings yet. Add the courses students can be allocated to.
L211 prop:label(Tabs): Eligible students
L214 attr:title(Modal): Add offering
L214 attr:okText(Modal): Add
L216 attr:name(Form.Item): courseId
L216 attr:label(Form.Item): Course
L216 prop:message(Form.Item): Pick a course
L217 attr:placeholder(Select): Search the college's courses
L220 attr:name(Form.Item): capacity
L220 attr:label(Form.Item): Capacity
L220 attr:tooltip(Form.Item): Leave empty for unlimited. Extra students are waitlisted in allocation order.
L221 attr:placeholder(InputNumber): Unlimited
L223 attr:message(Alert): This creates a dedicated class for the offering. Lessons, quizzes, timetable and attendance for the elective live on that class; the roster is whoever you allocate.
L227 attr:title(Modal): Faculty — ${facultyFor?.courseName || ""}
L227 attr:okText(Modal): Save
L229 attr:name(Form.Item): primaryFacultyId
L229 attr:label(Form.Item): Primary instructor
L230 attr:placeholder(Select): Select primary faculty
L233 attr:name(Form.Item): coTeacherIds
L233 attr:label(Form.Item): Co-teachers
L237 new Error: Choose a primary instructor before adding co-teachers
L240 new Error: Primary instructor cannot also be a co-teacher
L243 attr:placeholder(Select): Optional co-teachers
L246 text(Drawer): Primary and co-teacher roles are explicit; selection order no longer changes teaching ownership.
L250 attr:title(Modal): Capacity — ${capacityFor?.courseName || ""}
L250 attr:okText(Modal): Save
L252 attr:name(Form.Item): capacity
L252 attr:label(Form.Item): Capacity
L252 attr:tooltip(Form.Item): Cannot go below the current enrolled count
L253 attr:placeholder(InputNumber): Unlimited
L295 str: Could not load eligible students
L334 attr:message(Alert): ${belowMinimumCount} student${belowMinimumCount === 1 ? "" : "s"} still below the required minimum of ${slot.minPick} pick${slot.minPick === 1 ? "" : "s"}
L335 attr:message(Alert): All listed students have met the required minimum; they remain eligible for optional picks up to ${slot.maxPick}.
L336 attr:description(Alert): Only students of ${slot.programName || "this program"} whose batch is in Semester ${slot.semesterNumber} are listed here. Students disappear once they reach the maximum of ${slot.maxPick}.
L336 attr:description(Alert): this program
L338 attr:placeholder(Select): Allocate selected to…
L339 prop:label: ${o.courseName || `Course #${o.courseId}`}${o.capacity != null ? ` (${o.activeCount ?? 0}/${o.capacity})` : ""}
L339 prop:label: Course #${o.courseId}
L339 prop:label: (${o.activeCount ?? 0}/${o.capacity})
L340 text(div): Allocate
L341 text(div): Refresh
L342 child(div): ${rows.length} eligible
L342 child(div): ${visibleRows.length} of ${rows.length} eligible
L342 child(div): · ${selected.length} selected
L345 attr:placeholder(Input.Search): Search name, roll no. or dept
L346 attr:placeholder(Select): All classes
L349 attr:message(Alert): ${result.added} allocated${result.waitlisted ? `, ${result.waitlisted} waitlisted` : ""}${result.errors?.length ? `, ${result.errors.length} skipped` : ""}${result.warnings?.length ? ` · ${result.warnings.length} timetable warning${result.warnings.length === 1 ? "" : "s"}` : ""}
L349 attr:message(Alert): , ${result.waitlisted} waitlisted
L349 attr:message(Alert): , ${result.errors.length} skipped
L349 attr:message(Alert): · ${result.warnings.length} timetable warning${result.warnings.length === 1 ? "" : "s"}
L357 prop:title(Table): Student
L358 prop:title(Table): Dept
L359 prop:title(Table): Class
L360 prop:title(Table): Picks
L365 text(Table): required · max
L366 text(Table): minimum met · max
```

#### `src/components/admin/electives/ElectivesConsole.jsx` (branch: lms-dev-2026 only; 68 strings)
used by: COLLEGE: college-admin/electives.js
```text
L21 return: ${start}-${String((start + 1) % 100).padStart(2, "0")}
L61 new Error: Unexpected elective slot response
L67 str: Could not load electives
L148 call:message.success: Slot created
L155 call:message.success: Slot saved
L172 call:message.success: ${slot.name} archived
L195 prop:title: Discard this elective slot draft?
L195 prop:title: Discard elective slot edits?
L196 prop:content: Your unsaved changes will be lost.
L197 prop:okText: Discard
L199 prop:cancelText: Keep editing
L205 prop:title: Slot
L208 prop:title: Program
L209 prop:title: Sem
L210 prop:title: Year
L211 prop:title: Credits
L212 prop:title: Pick
L213 prop:title: Offerings
L214 prop:title: Students
L215 prop:title: Status
L215 child(Tag): Active
L215 child(Tag): Archived
L218 text(Space): Open
L219 text(Space): Edit
L220 attr:title(Popconfirm): Archive this slot?
L220 attr:description(Popconfirm): All its offerings are archived; enrolled students lose access, history is kept.
L222 text(Space): Archive
L234 attr:searchPlaceholder(AdminTableToolbar): Search slots
L244 text(div): New slot
L248 attr:message(Alert): A slot is one elective choice for a program and semester, for example “pick 1 of these 3 courses”. Only students of that program who are in that semester right now can be added. Open a slot to add its courses, faculty and students.
L250 attr:message(Alert): Some elective setup data could not be loaded
L251 attr:description(Alert): Unavailable: ${lookupErrors.join(", ")}. Retry before creating or editing elective data.
L252 text(Alert): Reload
L254 attr:message(Alert): Elective slots could not be loaded
L255 text(Alert): Retry slots
L258 prop:emptyText: Could not load elective slots; use Retry above.
L258 prop:emptyText: No elective slots yet. Create one per program × semester, e.g. “Professional Elective 1”.
L262 attr:title(Modal): New elective slot
L262 attr:title(Modal): Edit slot
L263 attr:okText(Modal): Create
L263 attr:okText(Modal): Save
L267 attr:message(Alert): Academic identity is locked
L268 attr:description(Alert): This slot already has allocation history. Program, semester, academic year, credits and pick rules are preserved for audit/history; create a new slot for a new term.
L269 attr:name(Form.Item): programId
L269 attr:label(Form.Item): Program
L269 prop:message(Form.Item): Program is required
L270 attr:placeholder(Select): Select program
L274 attr:name(Form.Item): semesterNumber
L274 attr:label(Form.Item): Semester
L276 prop:message(Form.Item): Semester is required
L282 new Error: This program has only ${Number(years) * 2} semesters
L288 attr:name(Form.Item): academicYear
L288 attr:label(Form.Item): Academic year
L290 new Error: Use consecutive YYYY-YY years, e.g. 2026-27
L294 attr:name(Form.Item): credits
L294 attr:label(Form.Item): Credits
L298 attr:name(Form.Item): name
L298 attr:label(Form.Item): Slot name
L298 prop:message(Form.Item): Name is required
L299 attr:placeholder(Input): Professional Elective 1
L301 attr:name(Form.Item): description
L301 attr:label(Form.Item): Description
L303 attr:name(Form.Item): minPick
L303 attr:label(Form.Item): Each student picks at least
L306 attr:name(Form.Item): maxPick
L306 attr:label(Form.Item): Each student picks at most
L306 attr:tooltip(Form.Item): A student can’t be added to more of this slot’s courses than this.
L310 text(div): Only students of this program who are in this semester right now can be added.
```

#### `src/components/admin/electives/OfferingRosterDrawer.jsx` (branch: lms-dev-2026 only; 28 strings)
used by: COLLEGE: college-admin/electives.js
```text
L31 new Error: Unexpected roster response
L36 str: Could not load the roster
L60 prop:reason: Removed and locked by college
L60 prop:reason: Removed by college
L61 call:message.success: Removed and locked
L61 call:message.success: Removed
L80 call:message.success: Moved (${res.data.state})
L93 prop:title: Student
L93 child(span): Learner #${m.memberId}
L94 prop:title: Dept
L95 prop:title: State
L96 prop:title: How
L97 prop:title: Since
L101 attr:placeholder(Select): Move to…
L104 prop:label: Course #${o.courseId}
L106 text(Space): Move
L110 attr:title(Popconfirm): Remove from this elective?
L110 attr:description(Popconfirm): The student loses access to this elective's class. You can allocate them again later.
L113 text(Space): Remove
L127 attr:message(Alert): Roster change was not saved
L130 attr:message(Alert): Archived roster — read only
L131 attr:description(Alert): Membership states are preserved as history. Reallocate a student from the slot's Eligible students tab instead of rewriting an archived offering.
L132 attr:message(Alert): Elective roster could not be loaded
L132 text(Alert): Retry
L134 attr:searchPlaceholder(AdminTableToolbar): Search students
L136 attr:exportFileName(AdminTableToolbar): elective-${offering.id}-roster.csv
L141 prop:emptyText: Could not load roster; use Retry above.
L141 prop:emptyText: No students in this state.
```

#### `src/components/admin/entitySectionTabs.js` (branch: both (identical); 0 strings)
(no user-facing strings)

#### `src/components/admin/placements/DriveSubNav.jsx` (branch: both (differs); 10 strings)
used by: COLLEGE: college-admin/jobs/[jobId]/applications.js, college-admin/jobs/[jobId]/index.js, college-admin/jobs/[jobId]/interviews.js, college-admin/jobs/[jobId]/settings.js (+1 more)
```text
L7 prop:label: Overview
L8 prop:label: Applications
L9 prop:label: Schedule
L10 prop:label: Settings
L37 prop:title: Discard unsaved changes?
L38 prop:content: You have unsaved changes on this form. Leaving now will discard them.
L39 prop:okText: Discard
L41 prop:cancelText: Keep editing
L54 text(Breadcrumb): Drives
L55 prop:title(Breadcrumb): Drive #${jobId}
```

#### `src/components/admin/projects/RepeatingItemEditor.jsx` (branch: both (differs); 26 strings)
used by: COLLEGE: college-admin/projects/workspaces/[workspaceId]/meetings.js, college-admin/projects/workspaces/[workspaceId]/resources.js, college-admin/projects/workspaces/[workspaceId]/sprints.js, college-admin/projects/workspaces/[workspaceId]/tasks.js
```text
L32 str: Add item
L37 str: No items yet.
L100 attr:aria-label(Input.Search): Find an item in this section
L100 attr:placeholder(Input.Search): Find an item by title or content
L101 text(div): Showing
L101 text(div): of
L101 text(div): items. Expand only the items you need to edit.
L105 text(div): Item removed from this unsaved form.
L106 text(div): Undo remove
L117 child(div): Item ${index + 1}
L117 child(div): Collapse
L117 child(div): Expand
L127 attr:aria-label(Button): Move ${titleOf?.(row, index) || `item ${index + 1}`} up
L127 attr:aria-label(Button): item ${index + 1}
L135 attr:aria-label(Button): Move ${titleOf?.(row, index) || `item ${index + 1}`} down
L135 attr:aria-label(Button): item ${index + 1}
L137 attr:aria-label(Button): Remove ${titleOf?.(row, index) || `item ${index + 1}`}
L137 attr:aria-label(Button): item ${index + 1}
[DEV] L192 attr:placeholder(DatePicker): Select date
[DEV] L203 str: 2000-01-01T${String(row[field.name]).slice(0, 5)}:00
[DEV] L204 str: 2000-01-01T${String(row[field.name]).slice(0, 5)}:00
[DEV] L207 attr:placeholder(TimePicker): Select time
L231 text(div): is required
L234 text(div): Will be saved as:
L266 new Error: This section holds ${rows.length} rows; the server accepts at most ${MAX_SECTION_ROWS}. Remove ${rows.length - MAX_SECTION_ROWS} before saving.
L274 new Error: Item ${missingAt + 1}: ${missingLabels.join(", ")} required
```

#### `src/components/admin/projects/WorkspaceDeliveryOverview.jsx` (branch: lms-dev-2026 only; 22 strings)
used by: COLLEGE: college-admin/projects/workspaces/[workspaceId]/delivery.js
```text
L22 attr:title(Card): Delivery
L42 prop:label: Submission type
L43 prop:label: Submitted by
L44 prop:label: Submitted at
L45 prop:label: Revisions
L53 text(div): Final delivery
L54 text(div): Submission package and review state
L71 text(div): Primary submission
L75 child(div): Open submitted file
L79 text(div): Open source link
L83 text(div): No valid file or source link is attached.
L89 attr:title(Card): Additional evidence
L99 child(div): Attachment ${index + 1}
L101 text(div): Added by
L104 text(div): Open
L108 text(div): Unavailable link
L114 attr:description(Empty): No additional files or links.
L118 attr:title(Card): Review
L121 text(div): Reviewed by
L125 text(div): Reviewed at
L131 text(div): Mentor feedback
L135 text(div): No mentor feedback has been recorded yet.
```

#### `src/components/admin/projects/WorkspaceMeetingsEditor.jsx` (branch: lms-dev-2026 only; 19 strings)
used by: COLLEGE: college-admin/projects/workspaces/[workspaceId]/meetings.js
```text
L8 prop:placeholder: Select meeting date
L10 prop:placeholder: Start time
L10 prop:placeholder: End time
L33 prop:label: Meetings
L34 prop:label: Upcoming / requested
L35 prop:label: Completed
L36 prop:label: Linked to work
L40 attr:title(Card): Meeting plan
L43 text(Card): Team cadence
L44 text(Card): Keep project conversations attached to the work they move forward
L46 text(Card): Use the date and time controls for scheduling, and link meetings to a sprint or task when the conversation is about specific delivery work.
L52 attr:aria-label(div): Meeting plan summary
L63 attr:name(Form.Item): meetingsList
L64 attr:label(Form.Item): Meetings
L69 attr:titleOf(RepeatingItemEditor): Meeting ${index + 1}
L70 attr:addLabel(RepeatingItemEditor): Add meeting
L71 attr:emptyText(RepeatingItemEditor): No meetings yet. Add one when the team needs a planned touchpoint.
L76 text(Card): Save meeting plan
L79 text(Card): Calendar sync and follow-up state remain system-managed.
```

#### `src/components/admin/projects/WorkspaceOverviewEditor.jsx` (branch: lms-dev-2026 only; 31 strings)
used by: COLLEGE: college-admin/projects/workspaces/[workspaceId]/overview.js
```text
L19 attr:title(Card): Project brief
L23 text(Card): Learner & mentor view
L24 text(Card): Make the project understandable before anyone opens the board.
L26 text(Card): This content becomes the shared “About this project” reference for the team. Keep it outcome-focused, concrete and easy to scan.
L34 text(Card): Goal
L35 text(Card): Why the project exists, who it serves and what success should look like.
L38 attr:name(Form.Item): overviewGoal
L39 attr:label(Form.Item): Project goal / description
L40 attr:extra(Form.Item): Shown as “About this project” on the learner and mentor Overview tab.
L44 attr:placeholder(TextArea): Describe the problem, expected outcome and what a successful project should achieve.
L53 text(Card): Deliverables
L54 text(Card): The concrete outputs the team is expected to produce.
L57 attr:name(Form.Item): overviewDeliverablesText
L58 attr:label(Form.Item): Deliverables
L59 attr:extra(Form.Item): One per line. These appear as a checklist for mentors and students.
L63 new Error: Add at least one deliverable.
L69 attr:placeholder(TextArea): Wireframes for all core screens Working prototype Final presentation deck
L78 text(Card): Definition of done
L79 text(Card): The project-level conditions that mean the work is genuinely complete.
L82 attr:name(Form.Item): overviewDoDText
L83 attr:label(Form.Item): Completion conditions
L84 attr:extra(Form.Item): One condition per line. Keep these verifiable rather than aspirational.
L88 attr:placeholder(TextArea): All acceptance criteria pass Deployed to a public URL Mentor sign-off recorded
L97 text(Card): Personas & ownership
L98 text(Card): Explain the working roles students can take and what each one owns.
L101 attr:name(Form.Item): overviewPersonasText
L102 attr:label(Form.Item): Personas
L103 attr:extra(Form.Item): One per line. Use a short role name followed by the ownership boundary.
L107 attr:placeholder(TextArea): Frontend lead — owns the board UI and component structure Backend lead — owns the API and data model
L113 text(Card): Save project brief
L116 text(Card): Changes update the Overview seen by mentors and students.
```

#### `src/components/admin/projects/WorkspaceReadinessOverview.jsx` (branch: lms-dev-2026 only; 18 strings)
used by: COLLEGE: college-admin/projects/workspaces/[workspaceId]/readiness.js
```text
L10 text(Tag): Force unlocked
L12 text(Tag): Force blocked
L22 attr:message(Alert): Readiness snapshot is unavailable
L23 attr:description(Alert): The workspace loaded, but its readiness calculation was not included. Retry before making a submission-readiness decision.
L31 prop:label: Tasks complete
L32 prop:label: Sprints complete
L34 prop:label: Proof coverage
L36 str: ${submissionCoverage.withSubmission} / ${submissionCoverage.completed} completed tasks
L37 str: No completed tasks yet
L40 prop:label: Submission
L41 str: Not submitted
L50 text(Card): Submission readiness
L52 child(Card): This workspace is ready to submit
L52 child(Card): This workspace still has readiness gaps
L55 child(Card): Ready
L55 child(Card): Not ready
L60 text(Card): Overall project progress
L101 text(Card): No manual readiness override is active. The status above is based on workspace progress and submission rules.
```

#### `src/components/admin/projects/WorkspaceResourceAudit.jsx` (branch: lms-dev-2026 only; 24 strings)
used by: COLLEGE: college-admin/projects/workspaces/[workspaceId]/audit.js
```text
L8 prop:label: Saved
L9 prop:label: Added
L10 prop:label: Edited
L11 prop:label: Removed
L64 prop:title: Resource
L66 prop:title: Action
L75 prop:title: Actor
L84 prop:title: When
L91 text(Card): Resource activity
L92 text(Card): See who changed project resources and when
L94 text(Card): This view focuses on resource changes inside the workspace. Use the full audit trail for broader project events.
L117 attr:placeholder(Input.Search): Search resource or actor
L118 attr:aria-label(Input.Search): Search resource audit
L123 attr:aria-label(Select): Filter audit actions
L126 prop:label(Select): All actions
L127 prop:label(Select): Added
L128 prop:label(Select): Edited
L129 prop:label(Select): Saved
L130 prop:label(Select): Removed
L140 attr:message(Alert): Resource audit could not be loaded
L142 text(Alert): Retry
L145 attr:description(Empty): No resource changes yet
L147 attr:description(Empty): No resource changes match these filters
L158 str: ${range[0]}–${range[1]} of ${total} matching changes
```

#### `src/components/admin/projects/WorkspaceResourcesEditor.jsx` (branch: lms-dev-2026 only; 16 strings)
used by: COLLEGE: college-admin/projects/workspaces/[workspaceId]/resources.js
```text
L14 prop:label: Resources
L15 prop:label: Links
L16 prop:label: Files & media
L17 prop:label: With access notes
L21 attr:title(Card): Resource library
L24 text(Card): Project references
L25 text(Card): Keep everything the team needs in one curated place
L27 text(Card): Add only useful project references, label them clearly, and include access notes when a link or file needs a college account, permission request, or other prerequisite.
L33 attr:aria-label(div): Resource library summary
L44 attr:name(Form.Item): resources
L45 attr:label(Form.Item): Resources
L50 attr:titleOf(RepeatingItemEditor): Resource ${index + 1}
L51 attr:addLabel(RepeatingItemEditor): Add resource
L52 attr:emptyText(RepeatingItemEditor): No resources yet. Add only the references the team will actually use.
L56 text(Card): Save resource library
L59 text(Card): Resources are shared with the workspace team.
```

#### `src/components/admin/projects/WorkspaceSprintsEditor.jsx` (branch: lms-dev-2026 only; 22 strings)
used by: COLLEGE: college-admin/projects/workspaces/[workspaceId]/sprints.js
```text
L26 prop:label: Total sprints
L27 prop:label: Active
L28 prop:label: Completed
L29 prop:label: Releases available
L33 attr:title(Card): Sprint plan
L36 text(Card): Delivery cadence
L37 text(Card): Plan work in clear, release-bound increments
L39 text(Card): Keep sprint goals outcome-focused and attach every sprint to the release it contributes to. The row summaries let you scan dates and task completion without expanding everything.
L45 attr:aria-label(div): Sprint plan summary
L59 attr:message(Alert): Loading project releases…
L60 attr:description(Alert): Release choices will appear as soon as the project release list is available.
L67 attr:message(Alert): Project releases could not be loaded
L69 text(Alert): Retry
L76 attr:message(Alert): No releases on this project yet
L77 attr:description(Alert): A sprint must belong to a release. Create or seed a project release before adding a new sprint.
L83 attr:name(Form.Item): sprints
L84 attr:label(Form.Item): Sprints
L90 attr:titleOf(RepeatingItemEditor): Sprint ${index + 1}
L92 attr:addLabel(RepeatingItemEditor): Add sprint
L93 attr:emptyText(RepeatingItemEditor): No sprints yet. Add the first sprint when a release is ready.
L97 text(Card): Save sprint plan
L100 text(Card): Only this workspace’s sprint plan is updated.
```

#### `src/components/admin/projects/WorkspaceSummarySnapshot.jsx` (branch: lms-dev-2026 only; 16 strings)
used by: COLLEGE: college-admin/projects/workspaces/[workspaceId]/summary.js
```text
L20 return: Not set
L62 child(Tag): Template · ${templateLabel}
L62 child(Tag): No template attached
L67 prop:label: Team
L68 prop:label: Tasks
L68 str: ${doneTasks} / ${totalTasks} done
L68 str: No tasks yet
L69 prop:label: Sprints
L69 str: ${doneSprints} / ${totalSprints} done
L69 str: No sprints yet
L70 prop:label: Target
L77 text(Card): Workspace health
L87 text(Card): Phase:
L91 child(Card): No workspace summary has been added yet.
L95 text(Card): Overall progress
L101 attr:aria-label(div): Workspace quick facts
```

#### `src/components/admin/projects/WorkspaceTasksEditor.jsx` (branch: lms-dev-2026 only; 26 strings)
used by: COLLEGE: college-admin/projects/workspaces/[workspaceId]/tasks.js
```text
L39 prop:label: Tasks
L40 prop:label: In progress
L41 prop:label: Done
L42 prop:label: Submissions
L47 attr:title(Card): Task plan
L50 text(Card): Work breakdown
L51 text(Card): Turn sprint goals into clear, reviewable work
L53 text(Card): Keep each task small enough to own, link it to the right sprint, and make “done” explicit. Workflow state and learner submissions stay read-only here.
L59 attr:aria-label(div): Task plan summary
L73 attr:message(Alert): No sprints are available yet
L86 attr:name(Form.Item): tasks
L87 attr:label(Form.Item): Tasks
L92 attr:titleOf(RepeatingItemEditor): Task ${index + 1}
L94 attr:addLabel(RepeatingItemEditor): Add task
L95 attr:emptyText(RepeatingItemEditor): No tasks yet. Add the first task when the work breakdown is ready.
L100 text(Card): Save task plan
L103 text(Card): Assignee, status and submission state are not changed here.
L109 attr:title(Card): Task submissions
L115 attr:description(Empty): No tasks have a submission link yet.
L129 str: ${range[0]}–${range[1]} of ${total} submissions
L134 prop:title(Table): Task
L136 prop:title(Table): Submission
L141 text(Table): Open submission
L145 text(Table): Unavailable link
L150 prop:title(Table): Submitted by
L156 prop:title(Table): Submitted at
```

#### `src/components/admin/projects/WorkspaceTeamOverview.jsx` (branch: lms-dev-2026 only; 12 strings)
used by: COLLEGE: college-admin/projects/workspaces/[workspaceId]/team.js
```text
L37 prop:label: Primary mentor
L41 prop:label: Students
L42 prop:label: Supporting faculty
L44 prop:label: Task coverage
L46 str: ${learnersWithWork} / ${learnerMembers.length} students assigned work
L47 str: No students yet
L56 text(Card): Team at a glance
L57 text(Card): Ownership and workload in one view
L59 text(Card): Use the roster below to spot students without assigned work, confirm mentor ownership, and understand who is actively carrying the project.
L83 attr:message(Alert): No primary mentor assigned
L84 attr:description(Alert): Assign a mentor before moving this workspace into an active operating state.
L96 attr:title(Card): Team roster (${asArray(members).length})
```

#### `src/components/admin/projects/adminProjectUtils.js` (branch: both (differs); 11 strings)
used by: LEARNER: learn/allQuizzes.js | FACULTY: teacher/allQuizzes.js | COLLEGE: college-admin/audit.js, college-admin/dashboard.js, college-admin/projects/at-risk/index.js, college-admin/projects/audit/index.js (+17 more)
```text
[DEV] L51 str: ${trimmed.replace(" ", "T")}Z
L274 str: No recent activity
[DEV] L279 str: ${text.slice(0, 79)}…
L281 str: Pending review
L291 prop:label: Critical
L292 prop:label: Elevated
L293 prop:label: Watch
L299 prop:label: ${count} signal${count === 1 ? "" : "s"}
L299 prop:label: No signals
L314 str: File + link
[DEV] L439 str: Super admin
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L249 str: Active blocker
```

#### `src/components/admin/projects/adminWorkspaceSection.js` (branch: both (identical); 2 strings)
used by: COLLEGE: college-admin/projects/workspaces/[workspaceId]/audit.js, college-admin/projects/workspaces/[workspaceId]/delivery.js, college-admin/projects/workspaces/[workspaceId]/meetings.js, college-admin/projects/workspaces/[workspaceId]/overview.js (+5 more)
```text
L47 call:setError: Failed to load workspace.
L52 call:setError: Failed to load workspace.
```

#### `src/components/admin/projects/projectSectionFieldConfigs.js` (branch: both (differs); 110 strings)
used by: COLLEGE: college-admin/projects/workspaces/[workspaceId]/meetings.js, college-admin/projects/workspaces/[workspaceId]/resources.js, college-admin/projects/workspaces/[workspaceId]/sprints.js, college-admin/projects/workspaces/[workspaceId]/tasks.js
```text
L27 prop:label: Key (optional)
L27 prop:placeholder: Auto-generated from title if left blank
L28 prop:name: dueLabel
L28 prop:label: Due (optional)
L28 prop:placeholder: e.g. Week 2
L29 prop:label: Title
L29 prop:placeholder: e.g. Kickoff & planning
L32 prop:label: Sprint goal (optional)
L34 prop:placeholder: One sentence: what this sprint is trying to achieve
[DEV] L45 prop:name: releaseKey
[DEV] L46 prop:label: Release key
[DEV] L50 prop:placeholder: Shared by every sprint that ships together, e.g. release-4
L53 prop:name: releaseLabel
[DEV] L54 prop:label: Release title (optional)
[DEV] L57 prop:placeholder: Set once, on the first sprint carrying this key — e.g. Release 4.0 — Automated decisions
L66 prop:label: What does done look like?
L68 prop:placeholder: Acceptance criteria — e.g. API returns paginated results and integration tests pass
[DEV] L86 prop:placeholder: Pick the release this sprint ships in
L91 prop:label: Key (optional)
L91 prop:placeholder: Auto-generated from title if left blank
L92 prop:label: Priority
L93 prop:label: Low
L94 prop:label: Medium
L95 prop:label: High
L97 prop:label: Title
L97 prop:placeholder: e.g. Draft submission checklist
L99 prop:name: sprintKey
L100 prop:label: Sprint
L103 prop:placeholder: Link to a sprint above (leave blank for the backlog)
L109 prop:name: estimatePoints
L110 prop:label: Estimate (optional)
L113 prop:placeholder: Not yet estimated
L114 prop:label: ${points} pt${points === 1 ? "" : "s"}
L117 prop:name: taskType
L118 prop:label: Type
L122 prop:label: Story
L123 prop:label: Bug
L124 prop:label: Chore
L125 prop:label: Spike
L128 prop:name: dueLabel
L128 prop:label: Due (optional)
L128 prop:placeholder: e.g. Before sprint 1
L129 prop:label: Description
L129 prop:placeholder: What this task involves
L131 prop:name: acceptanceCriteria
L132 prop:label: Done when (optional)
L134 prop:placeholder: The concrete condition that makes this task finished — not a restatement of the description
L138 prop:label: Approach (optional)
L140 prop:placeholder: The worked, how-to-do-this guidance for this task
L145 prop:label: Key (optional)
L145 prop:placeholder: Auto-generated from title if left blank
L148 prop:label: Type
L152 prop:label: Link
L154 prop:label: Document
L155 prop:label: Slides
L156 prop:label: Video
L157 prop:label: File
L160 prop:label: Title
L160 prop:placeholder: e.g. Project brief
L161 prop:label: URL (for a Link)
L162 prop:name: accessNotes
L162 prop:label: Access notes (optional)
L162 prop:placeholder: e.g. Requires college email to view
L163 prop:label: Description
L163 prop:placeholder: What this resource is for
L164 prop:name: isPinned
L164 prop:label: Pinned
L165 prop:name: isRequired
L165 prop:label: Required
L177 prop:label: Key (optional)
L177 prop:placeholder: Auto-generated from title if left blank
L179 prop:name: meetingStatus
L180 prop:label: Status
L184 prop:label: Scheduled
L185 prop:label: Rescheduled
L186 prop:label: Completed
L187 prop:label: Cancelled
L188 prop:label: Draft
L189 prop:label: Requested
L192 prop:label: Title
L192 prop:placeholder: e.g. Weekly sync
L194 prop:name: meetingType
L195 prop:label: Ceremony (optional)
L198 prop:placeholder: General
L200 prop:label: General
L201 prop:label: Sprint planning
L202 prop:label: Standup
L203 prop:label: Sprint review
L204 prop:label: Retrospective
L207 prop:name: meetingDate
L207 prop:label: Date
L208 prop:name: startTime
L208 prop:label: Start time (optional)
L208 prop:placeholder: HH:MM (24h)
L209 prop:name: endTime
L209 prop:label: End time (optional)
L209 prop:placeholder: HH:MM (24h)
L210 prop:name: meetingUrl
L210 prop:label: Meeting URL (optional)
L211 prop:name: linkedSprintKey
L211 prop:label: Linked sprint (optional)
L211 prop:placeholder: Link to a sprint above
L212 prop:name: linkedTaskKey
L212 prop:label: Linked task (optional)
L212 prop:placeholder: Link to a task above
L213 prop:label: Agenda (optional)
L213 prop:placeholder: What this meeting covers
L214 prop:label: Notes (optional)
L214 prop:placeholder: Meeting notes
L394 return: ${explicitKey} — ${title}
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L38 prop:label: Release (optional)
[PROD-ONLY] L40 prop:placeholder: Only on the sprint that ships a numbered release, e.g. Release 4.0 — Automated decisions
```

#### `src/components/admin/projects/renderStructuredValue.jsx` (branch: both (identical); 3 strings)
used by: COLLEGE: college-admin/projects/audit/index.js, college-admin/projects/templates/[templateId].js
```text
L21 text(Text): (too deeply nested to display)
L40 str: 2px solid var(--border-color-split, #f0f0f0)
L63 str: 2px solid var(--border-color-split, #f0f0f0)
```

#### `src/components/admin/projects/useProjectTeamSplit.jsx` (branch: lms-dev-2026 only; 45 strings)
used by: COLLEGE: college-admin/projects/workspaces/new.js
```text
L18 return: ${name} · ${roll ? `Roll ${roll}` : `ID ${learnerIdOf(l)}`}
L18 return: Roll ${roll}
L18 return: ID ${learnerIdOf(l)}
L29 new Error: Could not load that class's learners.
L35 call:message.error: That would make ${merged.length} learners; a workspace can have at most 500.
L45 call:message.success: Added ${added} learner${added === 1 ? "" : "s"} from the class.
L45 call:message.success: Everyone in that class is already selected.
L47 call:message.error: Could not add the class.
L76 call:message.error: Pick a class to split into teams.
L80 new Error: Could not load that class's learners.
L86 prop:name: Learner ${learnerIdOf(l)}
L88 call:message.warning: That class has no active learners.
L92 call:message.error: Could not build the teams.
L99 call:message.error: Preview the teams first.
L100 call:message.error: One of the teams is empty; move someone into it or rebuild the preview.
L112 prop:title: Create ${payload.teams.length} team workspace${payload.teams.length === 1 ? "" : "s"}?
L113 prop:content: ${payload.teams.reduce((n, t) => n + t.learnerIds.length, 0)} learners. Each team gets its own workspace and team group, created one at a time, so one failure does not undo the others.
L114 prop:okText: Create teams
L133 call:message.warning: ${created.length} team(s) created; ${failures.length} failed. The preview now holds only the failed teams, so Create retries just those.
L137 call:message.success: Created ${created.length} team workspace${created.length === 1 ? "" : "s"}.
L143 attr:name(Form.Item): teamSize
L143 attr:label(Form.Item): Learners per team
L143 prop:message(Form.Item): Team size is required
L146 attr:name(Form.Item): teamOrder
L146 attr:label(Form.Item): Fill teams
L147 prop:label(Radio.Group): By roll number
L147 prop:label(Radio.Group): Randomly
L149 text(Space): Preview teams
L151 text(Space): Shuffle again
L157 attr:title(Card): Teams preview — ${teamPreview.length} teams, ${teamPreview.reduce((n, t) => n + t.length, 0)} learners
L158 text(Card): Team sizes differ by at most one. Move a learner with the selector next to their name; nothing is created until you press Create.
L161 attr:title(Card): ${titleAt(titleValue || "Project", index)} (${team.length})
L162 text(Card): Empty team
L170 attr:aria-label(Select): Move ${learner.name} to another team
L171 prop:label: Team ${i + 1}
L183 attr:title(Card): Team creation outcome
L184 attr:message(Alert): ${teamsReport.failures.length} team(s) failed
L184 attr:description(Alert): The created teams stay. The preview above now holds only the failed teams; fix the problem and press Create to retry them.
L191 prop:title(Table): Team
L192 prop:title(Table): Result
L193 prop:title(Table): Learners / reason
L202 prop:label: One team
L203 prop:label: Split a class into teams
L204 prop:label: One workspace per student
L207 const:TEAMS_MODE_HELP: Pick a class and a team size, preview the teams, move anyone between teams, then create. Each team gets its own workspace named after the title (“Title - Team 1”, “Title - Team 2”…), with the same template and mentor.
```

#### `src/components/admin/projects/useUnsavedFormGuard.js` (branch: both (identical); 3 strings)
used by: COLLEGE: college-admin/projects/workspaces/[workspaceId]/meetings.js, college-admin/projects/workspaces/[workspaceId]/overview.js, college-admin/projects/workspaces/[workspaceId]/resources.js, college-admin/projects/workspaces/[workspaceId]/sprints.js (+3 more)
```text
L33 str: You have unsaved changes. Leave without saving them?
L47 str: Route change aborted by unsaved-changes guard.
L62 str: You have unsaved changes. Leave without saving them?
```

#### `src/components/admin/projects/workspaceRowMeta.jsx` (branch: lms-dev-2026 only; 31 strings)
used by: COLLEGE: college-admin/projects/workspaces/[workspaceId]/sprints.js, college-admin/projects/workspaces/[workspaceId]/tasks.js, college-admin/projects/workspaces/[workspaceId]/team.js
```text
L11 str: To do
L11 str: In progress
L11 str: In review
L30 child(span): ${from} – ${to}
L30 child(span): From ${from}
L30 child(span): Until ${to}
L31 text(span): tasks done
L43 child(span): Unassigned
L45 text(span): due
L87 attr:description(Empty): No members yet
L91 attr:placeholder(Input.Search): Search member name or ID
L91 attr:aria-label(Input.Search): Search project members
L93 attr:aria-label(Select): Filter project members by type
L95 prop:label(Select): All members
L95 prop:label(Select): Learners
L95 prop:label(Select): Faculty
L103 prop:emptyText: No members match these filters
L105 prop:title(Table): Member
L106 prop:title(Table): Role
L108 prop:title(Table): Tasks assigned
L113 text(Table): None
L117 prop:title(Table): Done · In review · In progress
L121 return: ${w.done} · ${w.review} · ${w.active}
L125 prop:title(Table): Last task update
L136 attr:showTotal(Pagination): ${range[0]}–${range[1]} of ${total} matching members
L156 call:message.success: Fixed ${changed} member row${changed === 1 ? "" : "s"} to match the team.
L159 call:message.success: The roster already matches the team.
L162 call:message.error: Could not check the roster.
L172 attr:message(Alert): This workspace is a team
L173 attr:description(Alert): Its learners are kept by the team it was created with. Adding or removing learners here updates the team too.
L174 text(Alert): Check roster
```

#### `src/components/admin/studentGroups/groupUi.js` (branch: lms-dev-2026 only; 4 strings)
used by: COLLEGE: college-admin/electives.js
```text
L7 str: Added by admin
L7 str: Matched rule
L13 return: ${g.activeCount ?? 0} · unlimited
L14 return: ${g.activeCount ?? 0} / ${g.capacity}
```

#### `src/components/admin/workspaceBackTarget.js` (branch: both (identical); 3 strings)
used by: COLLEGE: college-admin/projects/workspaces/[workspaceId]/audit.js, college-admin/projects/workspaces/[workspaceId]/delivery.js, college-admin/projects/workspaces/[workspaceId]/meetings.js, college-admin/projects/workspaces/[workspaceId]/overview.js (+6 more)
```text
L23 prop:label: deleted workspaces
L24 prop:label: the audit log
L32 prop:label: ← Back to ${origin.label}
```

#### `src/components/contacts/ContactsGrid.js` (branch: both (differs); 21 strings)
used by: FACULTY: teacher/contacts/[contactsTab].js
```text
L53 attr:alt(img): User avatar
L152 attr:placeholder(Input): Search contacts...
[DEV] L183 text(Table): Couldn't load contacts
[DEV] L184 text(Table): Retry
L189 child(Table): No contacts match your search
L189 child(Table): No contacts found
L190 child(Table): Try a different search term.
L190 child(Table): Your contacts will appear here once available.
[DEV] L215 text(div): Couldn't load contacts
[DEV] L216 text(div): Retry
L221 child(div): No contacts match your search
L221 child(div): No contacts found
L222 child(div): Try a different search term.
L222 child(div): Your contacts will appear here once available.
L240 text(div): Email
L244 text(div): Contact
L249 text(div): Role
L267 attr:aria-label(button): Previous page
L268 text(div): Previous
L279 attr:aria-label(button): Next page
L280 text(div): Next
```

#### `src/components/contacts/contactColumns.js` (branch: both (differs); 10 strings)
used by: FACULTY: teacher/contacts/[contactsTab].js
```text
L5 prop:title: Name
L12 prop:title: Email
L17 prop:title: Contact
L22 prop:title: Role
L31 prop:title: Name
L36 prop:title: Email
L40 prop:title: Contact
L47 prop:title: Name
L52 prop:title: Email
L56 prop:title: Contact
```

#### `src/components/contacts/index.js` (branch: both (identical); 0 strings)
(no user-facing strings)

#### `src/components/profile/PrivateDocLink.jsx` (branch: lms-dev-2026 only; 1 strings)
used by: LEARNER: learn/profile.js | FACULTY: teacher/profile.js | COLLEGE: college-admin/profile.js
```text
L37 call:message.error: Could not open the document
```

#### `src/components/profile/ProfileCompleteness.js` (branch: both (identical); 6 strings)
used by: LEARNER: learn/profile.js | FACULTY: teacher/profile.js | COLLEGE: college-admin/profile.js
```text
L37 text(div): Profile Completeness
L38 text(div): sections
L55 text(Progress): Complete
L61 text(Card): Profile Completeness
L65 text(Card): Completed
L69 text(Card): Remaining
```

#### `src/components/profile/ProfileSkeleton.js` (branch: both (identical); 0 strings)
(no user-facing strings)

#### `src/components/profile/ProfileVerificationCard.jsx` (branch: lms-dev-2026 only; 20 strings)
used by: LEARNER: learn/profile.js
```text
L10 str: 10th, 12th or Diploma, and your current degree, each with marks and a marksheet; and a resume on your profile.
L11 str: Your Aadhaar or PAN number with its document.
L15 str: Ready to send
L16 str: Waiting for the college
L17 str: Needs a change
L19 str: Verified · update waiting
L25 return: Send for verification
L26 return: Send changes for verification
L57 call:message.error: Could not send it
L58 call:message.success: ${SECTION_LABEL[section]} sent to the college for verification
L63 attr:message(Alert): We could not load your verification status
L63 text(Alert): Retry
L79 text(Card): Your college checks your education and identity once. Companies and the placement cell then see your profile as verified.
L93 text(Card): Verified by
L94 child(Card): the college
L94 text(Card): on
L97 attr:message(Alert): The college asked for a change
L98 attr:message(Alert): Your last update was not accepted
L100 text(Card): You changed this after it was verified. The verified details stay in use until you send the changes and the college verifies them.
L105 text(Card): The college will check it and you will be told.
```

#### `src/components/profile/VideoIntroModal.jsx` (branch: both (differs); 78 strings)
used by: LEARNER: learn/profile.js | FACULTY: teacher/profile.js | COLLEGE: college-admin/profile.js
```text
L144 str: We need access to your camera and microphone to record. Please allow permissions and try again.
L146 str: We couldn't find your camera or microphone. Please make sure they're connected and try again.
L147 str: We're having trouble accessing your camera. Please check that your camera and microphone are connected and try again.
L276 call:setError: Camera setup is taking a bit longer than expected. You can close this and try again when you're ready.
L277 call:message.info: Camera setup is taking longer than usual. Please try again.
L293 call:setError: Camera is still setting up. Just a moment, please wait for it to be ready.
L294 call:message.info: Camera is still setting up. Please wait a moment.
L301 call:setError: Camera setup needs a moment. Please try again.
L308 call:setError: Camera connection was interrupted. Let's try again.
L327 call:setError: We couldn't start the recording. ${error.message || "Please try again."}
L327 call:setError: Please try again.
L346 call:setError: Recording isn't available right now. Let's try recording again.
L352 call:setError: Something went wrong with the recording. Let's try again.
L361 call:setError: We couldn't capture your recording. Let's try recording again.
L367 call:setError: Your video is a bit too large (${(blob.size / 1024 / 1024).toFixed(2)}MB). The maximum size is 50MB. Could you record a slightly shorter video?
L374 call:setError: We couldn't stop the recording. ${error.message || "Please try again."}
L374 call:setError: Please try again.
L412 call:setError: No recording available to upload.
L437 call:message.success: Video intro uploaded successfully!
L442 call:setError: We couldn't upload your video. Please try again.
[DEV] L457 call:message.info: Wait for your video upload to finish.
[DEV] L466 prop:title: Stop and discard this recording?
[DEV] L466 prop:title: Discard this recorded video?
[DEV] L468 prop:content: Closing now stops the current recording and it will not be uploaded.
[DEV] L469 prop:content: This recording has not uploaded successfully yet. Closing now will discard the retry copy.
[DEV] L470 prop:okText: Discard recording
[DEV] L472 prop:cancelText: Keep recording
L480 return: ${mins}:${secs.toString().padStart(2, "0")}
L485 attr:title(Modal): Record Video Intro
L506 text(Modal): Record Your Video Introduction
L511 text(Modal): Important:
L511 text(Modal): This video introduction can be recorded
L511 text(Modal): once
L511 text(Modal): and will be visible to recruiters and potential employers. Once you upload it, it will be saved as your profile video. Take your time to prepare a professional introduction!
L517 text(Modal): Instructions for Recording
L522 text(Modal): 1. Prepare your professional introduction
L523 text(Modal): Think about highlighting: your name, educational background, key skills, career interests, and what makes you a strong candidate.
L526 text(Modal): 2. Choose a professional setting
L527 text(Modal): Select a quiet, well-lit space with a clean background. Dress appropriately as you would for a job interview.
L530 text(Modal): 3. Test your setup
L531 text(Modal): We'll help you test your camera and microphone. Position yourself in the center of the frame, maintain eye contact with the camera, and speak clearly.
L534 text(Modal): 4. Recording details
L535 text(Modal): You'll have a 45-second countdown to get ready. Your recording can be up to 2 minutes long.
L541 text(Modal): What to Include
L545 text(Modal): Start with:
L545 text(Modal): "Hello, my name is [Your Name]. I'm a [Your Program/Field] student..."
L548 text(Modal): Highlight:
L548 text(Modal): Your key skills, relevant coursework or projects, career interests, and what value you bring.
L551 text(Modal): Show enthusiasm:
L551 text(Modal): Express your passion for your field and eagerness to contribute professionally.
L554 text(Modal): End with:
L554 text(Modal): A professional closing that expresses your interest in opportunities and invites recruiters to connect.
L559 text(Modal): Take your time to prepare. When you're ready, click below to begin.
L563 text(Modal): Cancel
L564 text(Modal): I'm Ready to Record
L577 child(Modal): Take a deep breath and get ready...
L577 child(Modal): Almost there...
L577 child(Modal): Recording will start in a moment!
L589 text(Modal): Quick reminders:
L592 text(Modal): Look at camera
L593 text(Modal): Speak clearly
L594 text(Modal): Be professional
L595 text(Modal): Max 2 minutes
L599 text(Modal): Cancel
L607 attr:alt(Image): Recording
L608 text(Modal): Recording
L611 text(Modal): Max:
L622 text(Modal): Quick tip:
L622 text(Modal): Start with "Hello, my name is [Your Name]" and highlight your key skills and career interests.
L627 text(Modal): Finish Recording
L636 text(Modal): Upload Failed
L637 text(Modal): We couldn't upload your video. You can review it below and try recording again.
L646 text(Modal): Record Again
L647 text(Modal): Try Upload Again
L657 text(Modal): Uploading Your Video...
L661 text(Modal): Please wait while we upload your video. This will just take a moment.
L673 text(Modal): All Set!
L674 text(Modal): Your video introduction has been saved successfully.
```

#### `src/components/profile/about.js` (branch: both (differs); 59 strings)
used by: LEARNER: learn/profile.js | FACULTY: teacher/profile.js | COLLEGE: college-admin/profile.js
```text
L49 text(Button): Edit
L63 text(Button): Add
[DEV] L125 str: Discard your unsaved profile changes?
[DEV] L132 str: Route change aborted to preserve unsaved profile changes.
[DEV] L198 str: Social profiles
[DEV] L198 str: Personal details
[DEV] L199 str: Identity documents
[DEV] L199 str: Additional information
[DEV] L232 str: Extracurricular activities
L263 call:message.error: Failed to load profile data. Please refresh the page.
L267 str: Updated successfully!
L273 str: Error updating. Please try again.
L318 call:showSuccess: Deleted successfully!
L348 call:showSuccess: Deleted successfully!
L415 call:showSuccess: Deleted successfully!
L445 call:showSuccess: Deleted successfully!
L469 call:showSuccess: Deleted successfully!
L499 call:showSuccess: Deleted successfully!
L523 call:showSuccess: Deleted successfully!
L535 str: Social Profile
L557 str: Personal Details
L603 call:showSuccess: ${type === "aadhaar" ? "Aadhaar" : "PAN"} document uploaded!
L603 call:showSuccess: Aadhaar
L616 call:showError: Error uploading document
L624 new Error: Invalid uploaded URL returned
L632 call:showSuccess: ${type === "aadhaar" ? "Aadhaar" : "PAN"} document uploaded!
L632 call:showSuccess: Aadhaar
L638 call:showError: Error uploading document
L683 prop:content: Invalid file.
L702 prop:content: Invalid resume URL returned.
L706 call:showSuccess: Resume updated successfully! You can view it with the link above.
L710 str: Failed to upload resume. Please try again.
L723 prop:content: Invalid resume URL returned.
L731 call:showSuccess: Resume updated successfully! You can view it with the link above.
[DEV] L735 prop:content: Failed to update resume.
L749 call:showSuccess: Resume removed.
L753 prop:content: Failed to remove resume.
L767 prop:content: Could not get resume link.
L792 call:showSuccess: Deleted successfully!
L817 call:showSuccess: Deleted successfully!
L841 call:showSuccess: Profile image updated!
L858 call:showError: Error uploading image
L866 new Error: Invalid image URL returned
L870 call:showSuccess: Profile image updated!
L878 call:showError: Error uploading image
[DEV] L910 attr:message(Alert): Some profile sections could not be loaded
[DEV] L911 attr:description(Alert): We couldn't verify: ${sectionLoadErrors.join(", ")}. Last known data is kept where available; otherwise those sections may look empty until you retry.
[DEV] L912 text(Alert): Retry sections
L1428 text(div): Resume uploaded
L1429 text(div): Click to view your uploaded resume
L1439 text(div): View resume
[DEV] L1443 attr:title(Popconfirm): Remove this resume?
[DEV] L1444 attr:description(Popconfirm): The resume will no longer be available as your default for job applications.
L1445 attr:okText(Popconfirm): Remove
L1450 text(div): Remove
L1457 text(div): No resume uploaded. Upload one to use as your default when applying for jobs.
L1473 child(div): Replace resume
L1473 child(div): Upload resume
L1482 text(div): Upload resume from Drive
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L600 str: Job Preferences
```

#### `src/components/profile/about/MarksheetUpload.jsx` (branch: lms-dev-2026 only; 11 strings)
used by: LEARNER: learn/profile.js | FACULTY: teacher/profile.js | COLLEGE: college-admin/profile.js
```text
L18 call:message.error: Upload a PDF, JPG or PNG
L19 call:message.error: The file is larger than 5 MB
L24 new Error: no link
L26 call:message.success: Marksheet uploaded
L28 call:message.error: Could not upload the marksheet. Try again.
L37 text(div): Marksheet
L37 text(div): (needed for verification)
L40 child(div): Replace marksheet
L40 child(div): Upload marksheet
L44 text(div): Attached ·
L45 text(div): View
```

#### `src/components/profile/about/achievements.js` (branch: both (differs); 31 strings)
used by: LEARNER: learn/profile.js | FACULTY: teacher/profile.js | COLLEGE: college-admin/profile.js
```text
L64 text(Space): Achievement Title
L69 attr:placeholder(Input): Achievement Title
L81 prop:title: Title or description is required
L97 text(Space): Year
L101 attr:placeholder(Input): Year
L110 text(Space): Description
L121 attr:placeholder(RichTextEditor): Enter description (supports bullet points, formatting, etc.)
L145 text(Space): Achievement Title
L151 attr:placeholder(Input): Achievement Title
L164 str: Title or description is required
L180 text(Space): Year
L185 attr:placeholder(Input): Year
L197 text(Space): Description
L210 attr:placeholder(RichTextEditor): Enter description (supports bullet points, formatting, etc.)
L222 attr:title(Popconfirm): Delete this achievement?
L223 attr:description(Popconfirm): This can't be undone.
L225 attr:okText(Popconfirm): Delete
L227 attr:cancelText(Popconfirm): Cancel
L229 attr:aria-label(Button): Delete achievement ${achievement.title || index + 1}
L229 text(Space): Delete Achievement
L260 attr:title(CustomButton): Cancel
[DEV] L264 prop:title: Discard achievement changes?
[DEV] L265 prop:content: Your unsaved achievement details will be lost.
[DEV] L266 prop:okText: Discard changes
[DEV] L268 prop:cancelText: Keep editing
L279 attr:title(CustomButton): Save
L292 prop:title: Title or description is required
L293 call:message.error: Please fill in at least title or description
L305 str: Title or description is required
L306 str: Title or description is required
L312 call:message.error: Please fill in all required fields
```

#### `src/components/profile/about/address.js` (branch: both (differs); 16 strings)
used by: LEARNER: learn/profile.js | FACULTY: teacher/profile.js | COLLEGE: college-admin/profile.js
```text
[DEV] L29 prop:title: Discard address changes?
[DEV] L30 prop:content: Your unsaved address edits will be lost.
[DEV] L31 prop:okText: Discard changes
[DEV] L33 prop:cancelText: Keep editing
L49 text(div): Current Address
L51 child(div): Not specified
L54 child(div): Not specified
L63 attr:placeholder(TextArea): Current Address
L74 attr:placeholder(Input): City
L82 attr:placeholder(Input): State
L90 attr:placeholder(Input): Pincode
L104 text(div): Permanent Address
L106 child(div): Not specified
L115 attr:placeholder(TextArea): Permanent Address
L126 attr:title(CustomButton): Cancel
L133 attr:title(CustomButton): Save
```

#### `src/components/profile/about/awards.js` (branch: both (differs); 27 strings)
used by: LEARNER: learn/profile.js | FACULTY: teacher/profile.js | COLLEGE: college-admin/profile.js
```text
L58 text(Space): Award/Recognition Title
L63 attr:placeholder(Input): Award/Recognition Title
L73 prop:title: Award title is required
L89 attr:placeholder(Input): Year
L96 attr:placeholder(Input): Awarded By
L104 attr:placeholder(RichTextEditor): Enter description (supports bullet points, formatting, etc.)
L122 text(Space): Award Title
L128 attr:placeholder(Input): Award Title
L139 str: Award title is required
L156 attr:placeholder(Input): Year
L168 attr:placeholder(Input): Awarded By
L184 attr:placeholder(RichTextEditor): Enter description (supports bullet points, formatting, etc.)
L190 attr:title(Popconfirm): Delete this award?
L191 attr:description(Popconfirm): This can't be undone.
L193 attr:okText(Popconfirm): Delete
L195 attr:cancelText(Popconfirm): Cancel
L197 text(Space): Delete Award
L231 attr:title(CustomButton): Cancel
[DEV] L235 prop:title: Discard award changes?
[DEV] L236 prop:content: Your unsaved award details will be lost.
[DEV] L237 prop:okText: Discard changes
[DEV] L239 prop:cancelText: Keep editing
L250 attr:title(CustomButton): Save
L257 prop:title: Award title is required
L258 call:message.error: Please fill in all required fields
L267 str: Award title is required
L273 call:message.error: Please fill in all required fields
```

#### `src/components/profile/about/certifications.js` (branch: both (differs); 47 strings)
used by: LEARNER: learn/profile.js | FACULTY: teacher/profile.js | COLLEGE: college-admin/profile.js
```text
L86 text(Space): Certification Name
L91 attr:placeholder(Input): Certification Name
L92 attr:aria-label(Input): Certification name
L102 prop:name: Certification name is required
L118 text(Space): Issuing Authority
L122 attr:placeholder(Input): e.g., AWS, Google
L123 attr:aria-label(Input): Issuing authority
L132 attr:placeholder(DatePicker): Certification Date
L133 attr:aria-label(DatePicker): Issue date
L140 attr:placeholder(DatePicker): Validity Date
L141 attr:aria-label(DatePicker): Expiry date
L149 attr:placeholder(Input): Certificate Link (e.g., https://example.com/certificate)
L150 attr:aria-label(Input): Credential URL
L181 attr:placeholder(RichTextEditor): Enter description (supports bullet points, formatting, etc.)
L199 text(Space): Certification Name
L205 attr:placeholder(Input): Certification Name
L206 attr:aria-label(Input): Certification name
L217 str: Certification name is required
L233 text(Space): Issuing Authority
L238 attr:placeholder(Input): e.g., AWS, Google
L239 attr:aria-label(Input): Issuing authority
L252 attr:placeholder(DatePicker): Certification Date
L253 attr:aria-label(DatePicker): Issue date
L265 attr:placeholder(DatePicker): Validity Date
L266 attr:aria-label(DatePicker): Expiry date
L279 attr:placeholder(Input): Certificate Link (e.g., https://example.com/certificate)
L280 attr:aria-label(Input): Credential URL
L316 attr:placeholder(RichTextEditor): Enter description (supports bullet points, formatting, etc.)
L322 attr:title(Popconfirm): Delete this certification?
L323 attr:description(Popconfirm): This can't be undone.
L325 attr:okText(Popconfirm): Delete
L327 attr:cancelText(Popconfirm): Cancel
L329 text(Space): Delete Certification
L347 child(Space): - Valid till ${dayjs(cert.validityDate).format('MMM YYYY')}
L354 attr:aria-label(a): View credential
L355 text(Space): View Certificate
L363 text(Space): No certifications added
L370 attr:title(CustomButton): Cancel
[DEV] L374 prop:title: Discard certification changes?
[DEV] L375 prop:content: Your unsaved certification details will be lost.
[DEV] L376 prop:okText: Discard changes
[DEV] L378 prop:cancelText: Keep editing
L389 attr:title(CustomButton): Save
L400 call:message.error: Please fix URL validation errors before saving
L405 call:message.error: Expiry date must be after issue date
L418 call:message.error: Please fix URL validation errors before saving
L425 call:message.error: Expiry date must be after issue date for certification "${cert.name || i + 1}"
```

#### `src/components/profile/about/contacts.js` (branch: both (differs); 23 strings)
used by: LEARNER: learn/profile.js | FACULTY: teacher/profile.js | COLLEGE: college-admin/profile.js
```text
[DEV] L41 prop:title: Discard contact changes?
[DEV] L42 prop:content: Your unsaved contact edits will be lost.
[DEV] L43 prop:okText: Discard changes
[DEV] L45 prop:cancelText: Keep editing
L65 return: +91-${digits.slice(0, 5)}-${digits.slice(5)}
L73 return: Primary mobile number is required
L78 return: Mobile number must be exactly 10 digits
L82 return: Phone number must be 10-15 digits
L93 return: Enter a valid email address
L108 text(div): Primary Mobile
L112 child(div): Not specified
L119 text(div): Alternate Phone
L138 attr:placeholder(Input): Primary Mobile Number (10 digits)
L167 attr:placeholder(Input): Alternate Phone (Optional, 10-15 digits)
L178 str: Alternate phone cannot be same as primary mobile
L186 str: Alternate phone cannot be same as primary mobile
L209 text(div): Contact Email
L213 child(div): Not specified
L225 attr:placeholder(Input): Contact Email
L226 attr:aria-label(Input): Contact Email
L251 attr:title(CustomButton): Cancel
L258 attr:title(CustomButton): Save
L270 str: Alternate phone cannot be same as primary mobile
```

#### `src/components/profile/about/experiences.js` (branch: both (differs); 72 strings)
used by: LEARNER: learn/profile.js | FACULTY: teacher/profile.js | COLLEGE: college-admin/profile.js
```text
L73 str: Organization name is required
L74 call:message.error: Please fill in all required fields
L79 str: End date cannot be before start date
L80 call:message.error: End date cannot be before start date
L89 str: Organization name is required
L94 str: End date cannot be before start date
L100 call:message.error: Please fill in all required fields
L163 text(Space): Organization Name
L168 attr:placeholder(Input): Organization Name
L169 attr:aria-label(Input): Organization name
L182 str: Organization name is required
L199 text(Space): Designation
L203 attr:placeholder(Input): Designation
L204 attr:aria-label(Input): Job title or designation
L219 text(Space): Experience Type
L223 attr:placeholder(Select): Select Experience Type
L233 text(Space): Full-time
L234 text(Space): Part-time
L235 text(Space): Internship
L236 text(Space): Contract
L237 text(Space): Freelance
L238 text(Space): Other
L246 text(Space): Location
L250 attr:placeholder(Input): Location
L269 attr:placeholder(DatePicker): Start Date
L270 attr:aria-label(DatePicker): Start date
L284 attr:placeholder(DatePicker): End Date
L285 attr:aria-label(DatePicker): End date
L313 text(Space): Present
L330 text(Space): Is it a paid job?
L339 attr:placeholder(Input): Salary/Compensation (e.g., 5 LPA, $50k/year, ₹30k/month)
L361 attr:placeholder(RichTextEditor): Enter description (supports bullet points, formatting, etc.)
L388 text(Space): Organization Name
L394 attr:placeholder(Input): Organization Name
L395 attr:aria-label(Input): Organization name
L404 str: Organization name is required
L420 text(Space): Designation
L425 attr:placeholder(Input): Designation
L426 attr:aria-label(Input): Job title or designation
L436 text(Space): Experience Type
L440 attr:placeholder(Select): Select Experience Type
L447 text(Space): Full-time
L448 text(Space): Part-time
L449 text(Space): Internship
L450 text(Space): Contract
L451 text(Space): Freelance
L452 text(Space): Other
L459 text(Space): Location
L464 attr:placeholder(Input): Location
L479 attr:placeholder(DatePicker): Start Date
L480 attr:aria-label(DatePicker): Start date
L493 attr:placeholder(DatePicker): End Date
L494 attr:aria-label(DatePicker): End date
L515 text(Space): Present
L531 text(Space): Is it a paid job?
L540 attr:placeholder(Input): Salary/Compensation (e.g., 5 LPA, $50k/year, ₹30k/month)
L556 attr:placeholder(RichTextEditor): Enter description (supports bullet points, formatting, etc.)
L562 attr:title(Popconfirm): Delete this experience?
L563 attr:description(Popconfirm): This can't be undone.
L565 attr:okText(Popconfirm): Delete
L567 attr:cancelText(Popconfirm): Cancel
L569 text(Space): Delete Experience
L590 child(Space): · ${experience.experienceType}
L600 text(Space): Paid ·
L602 text(Space): Paid
L613 child(Space): Present
L631 attr:title(CustomButton): Cancel
[DEV] L635 prop:title: Discard experience changes?
[DEV] L636 prop:content: Your unsaved experience edits will be lost.
[DEV] L637 prop:okText: Discard changes
[DEV] L639 prop:cancelText: Keep editing
L650 attr:title(CustomButton): Save
```

#### `src/components/profile/about/extracurricular.js` (branch: both (differs); 17 strings)
used by: LEARNER: learn/profile.js | FACULTY: teacher/profile.js | COLLEGE: college-admin/profile.js
```text
L47 attr:placeholder(Input): Activity Name (e.g., Cricket Team Captain)
L54 attr:placeholder(Input): Year
L62 attr:placeholder(RichTextEditor): Enter description (supports bullet points, formatting, etc.)
L81 attr:placeholder(Input): Activity Name
L93 attr:placeholder(Input): Year
L109 attr:placeholder(RichTextEditor): Enter description (supports bullet points, formatting, etc.)
L115 attr:title(Popconfirm): Delete this activity?
L116 attr:description(Popconfirm): This can't be undone.
L118 attr:okText(Popconfirm): Delete
L120 attr:cancelText(Popconfirm): Cancel
L122 text(Space): Delete Activity
L153 attr:title(CustomButton): Cancel
[DEV] L157 prop:title: Discard activity changes?
[DEV] L158 prop:content: Your unsaved activity details will be lost.
[DEV] L159 prop:okText: Discard changes
[DEV] L161 prop:cancelText: Keep editing
L171 attr:title(CustomButton): Save
```

#### `src/components/profile/about/hobbies.js` (branch: both (differs); 9 strings)
used by: LEARNER: learn/profile.js | FACULTY: teacher/profile.js | COLLEGE: college-admin/profile.js
```text
L53 text(Space): No hobbies added
L73 attr:placeholder(Input): Add a hobby
L80 attr:title(CustomButton): Add
L92 attr:title(CustomButton): Cancel
[DEV] L96 prop:title: Discard hobby changes?
[DEV] L97 prop:content: Your unsaved hobby edits will be lost.
[DEV] L98 prop:okText: Discard changes
[DEV] L100 prop:cancelText: Keep editing
L110 attr:title(CustomButton): Save
```

#### `src/components/profile/about/identity.js` (branch: both (differs); 30 strings)
used by: LEARNER: learn/profile.js | FACULTY: teacher/profile.js | COLLEGE: college-admin/profile.js
```text
[DEV] L40 prop:title: Discard identity changes?
[DEV] L41 prop:content: Your unsaved identity-number edits will be lost.
[DEV] L42 prop:okText: Discard changes
[DEV] L44 prop:cancelText: Keep editing
L61 call:message.error: File upload not configured
L67 call:message.error: Upload a PDF, JPG, or PNG document
L71 call:message.error: Document must be 10 MB or smaller
L90 return: Document
L102 text(div): Aadhaar Number
L104 child(div): Not specified
L109 text(div): View Document
L113 text(div): No document uploaded
L123 attr:placeholder(Input): Aadhaar Number (XXXX-XXXX-XXXX)
L146 child(div): Re-upload Aadhaar
L146 child(div): Upload Aadhaar
L155 text(div): Drive link
L164 text(div): Uploaded:
L178 text(div): PAN Number
L180 child(div): Not specified
L185 text(div): View Document
L189 text(div): No document uploaded
L199 attr:placeholder(Input): PAN Number (ABCDE1234F)
L218 child(div): Re-upload PAN
L218 child(div): Upload PAN
L227 text(div): Drive link
L236 text(div): Uploaded:
L249 attr:title(CustomButton): Cancel
L256 attr:title(CustomButton): Save
L261 call:message.error: Aadhaar number must be 12 digits
L266 call:message.error: PAN must be in format ABCDE1234F
```

#### `src/components/profile/about/languages.js` (branch: both (differs); 16 strings)
used by: LEARNER: learn/profile.js | FACULTY: teacher/profile.js | COLLEGE: college-admin/profile.js
```text
L54 attr:placeholder(Input): Language (e.g., English, Hindi)
L62 attr:placeholder(Select): Proficiency Level
L75 text(Space): No languages added
L94 attr:placeholder(Input): Language
L106 attr:placeholder(Select): Proficiency
L117 attr:title(Popconfirm): Delete this language?
L118 attr:description(Popconfirm): This can't be undone.
L120 attr:okText(Popconfirm): Delete
L122 attr:cancelText(Popconfirm): Cancel
L127 attr:aria-label(Button): Delete language ${lang?.language || index + 1}
L140 attr:title(CustomButton): Cancel
[DEV] L144 prop:title: Discard language changes?
[DEV] L145 prop:content: Your unsaved language edits will be lost.
[DEV] L146 prop:okText: Discard changes
[DEV] L148 prop:cancelText: Keep editing
L158 attr:title(CustomButton): Save
```

#### `src/components/profile/about/metadata.js` (branch: both (differs); 39 strings)
used by: LEARNER: learn/profile.js | FACULTY: teacher/profile.js | COLLEGE: college-admin/profile.js
```text
L10 prop:label: Text
L11 prop:label: Number
L12 prop:label: Yes/No
L13 prop:label: Email
L14 prop:label: URL/Website
L15 prop:label: Date
L16 prop:label: Phone Number
L17 prop:label: Long Text
L136 call:message.error: Please fill in all field names
L144 call:message.error: Field names must be unique
L151 call:message.error: Please fix URL validation errors before saving
[DEV] L202 prop:title: Discard additional-information changes?
[DEV] L203 prop:content: Your unsaved custom fields will be lost.
[DEV] L204 prop:okText: Discard changes
[DEV] L206 prop:cancelText: Keep editing
L218 text(Space): Additional Information
L237 child(Space): Yes
L237 child(Space): No
L240 child(Space): Not specified
L247 text(Space): Add things like certifications, portfolio links, or other details. Click Edit, then add a label (e.g. Certification) and the value. You can add more than one.
L255 text(Space): Additional Information
L256 text(Space): Give each item a label and a value. Examples: Label = "Certification", Value = "AWS Certified"; or Label = "Portfolio", Value = your link.
L278 attr:placeholder(Input): e.g. Certification, Portfolio link
L298 text(Space): Remove
L306 attr:placeholder(TextArea): Enter long text
L316 attr:placeholder(Input): e.g. Certification, Portfolio link
L336 attr:placeholder(Select): Select
L338 prop:label(Select): Yes
L339 prop:label(Select): No
L348 attr:placeholder(DatePicker): Select date
L358 attr:placeholder(Input): Enter number
L359 attr:placeholder(Input): Enter email address
L360 attr:placeholder(Input): Enter website URL (e.g., https://example.com)
L361 attr:placeholder(Input): Enter phone number
L362 attr:placeholder(Input): Enter value
L390 attr:title(Button): Remove field
L405 text(Space): Add Field
L417 attr:title(CustomButton): Cancel
L424 attr:title(CustomButton): Save
```

#### `src/components/profile/about/personalDetails.js` (branch: both (differs); 18 strings)
used by: LEARNER: learn/profile.js | FACULTY: teacher/profile.js | COLLEGE: college-admin/profile.js
```text
[DEV] L43 prop:title: Discard personal-detail changes?
[DEV] L44 prop:content: Your unsaved personal-detail edits will be lost.
[DEV] L45 prop:okText: Discard changes
[DEV] L47 prop:cancelText: Keep editing
L70 text(div): Gender
L73 child(div): Not specified
L77 text(div): Date of Birth
L82 return: Not specified
L87 text(div): Blood Group
L90 child(div): Not specified
L97 text(Row): Gender
L101 attr:placeholder(Select): Select Gender
L107 text(Row): Date of Birth
L111 attr:placeholder(DatePicker): Select date of birth
L120 text(Row): Blood Group
L124 attr:placeholder(Select): Select Blood Group
L135 attr:title(CustomButton): Cancel
L142 attr:title(CustomButton): Save
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L10 str: Prefer not to say
```

#### `src/components/profile/about/projects.js` (branch: both (differs); 35 strings)
used by: LEARNER: learn/profile.js | FACULTY: teacher/profile.js | COLLEGE: college-admin/profile.js
```text
L87 str: Project name is required
L149 text(Space): Project Name
L154 attr:placeholder(Input): Project Name
L174 text(Space): GitHub URL
L178 attr:placeholder(Input): https://github.com/username/repo
L199 text(Space): Live URL
L203 attr:placeholder(Input): https://yourproject.com
L225 attr:placeholder(RichTextEditor): Enter project description (supports bullet points, formatting, etc.)
L230 text(Space): Skills Used:
L240 attr:placeholder(Input): Add skill
L262 text(Space): Project Name
L268 attr:placeholder(Input): Project Name
L289 text(Space): GitHub URL
L294 attr:placeholder(Input): https://github.com/username/repo
L316 text(Space): Live URL
L321 attr:placeholder(Input): https://yourproject.com
L348 attr:placeholder(RichTextEditor): Enter project description (supports bullet points, formatting, etc.)
L362 attr:placeholder(Input): Add skill
L371 attr:title(Popconfirm): Delete this project?
L372 attr:description(Popconfirm): This can't be undone.
L374 attr:okText(Popconfirm): Delete
L376 attr:cancelText(Popconfirm): Cancel
L378 attr:aria-label(Button): Delete project ${project.name || index + 1}
L378 text(Space): Delete Project
L395 text(Space): GitHub
L400 text(Space): Live Demo
L419 text(Space): No projects added
L426 attr:title(CustomButton): Cancel
[DEV] L430 prop:title: Discard project changes?
[DEV] L431 prop:content: Your unsaved project details will be lost.
[DEV] L432 prop:okText: Discard changes
[DEV] L434 prop:cancelText: Keep editing
L445 attr:title(CustomButton): Save
L456 call:message.error: Please fix all validation errors before saving
L469 call:message.error: Please fix all validation errors before saving
```

#### `src/components/profile/about/publications.js` (branch: both (differs); 30 strings)
used by: LEARNER: learn/profile.js | FACULTY: teacher/profile.js | COLLEGE: college-admin/profile.js
```text
L50 attr:placeholder(Input): Publication Title
L57 attr:placeholder(Input): Journal/Conference Name
L64 attr:placeholder(Input): Year
L71 attr:placeholder(Input): DOI
L78 attr:placeholder(Input): Authors (comma-separated)
L86 attr:placeholder(Input): Publication Link (e.g., https://example.com/publication)
L117 attr:placeholder(RichTextEditor): Enter description/abstract (supports bullet points, formatting, etc.)
L136 attr:placeholder(Input): Title
L148 attr:placeholder(Input): Journal
L160 attr:placeholder(Input): Year
L172 attr:placeholder(Input): DOI
L184 attr:placeholder(Input): Authors
L197 attr:placeholder(Input): Publication Link (e.g., https://example.com/publication)
L233 attr:placeholder(RichTextEditor): Enter description/abstract (supports bullet points, formatting, etc.)
L239 attr:title(Popconfirm): Delete this publication?
L240 attr:description(Popconfirm): This can't be undone.
L242 attr:okText(Popconfirm): Delete
L244 attr:cancelText(Popconfirm): Cancel
L246 text(Space): Delete Publication
L262 text(Space): Authors:
L275 text(Space): View Publication
L278 text(Space): DOI:
L289 attr:title(CustomButton): Cancel
[DEV] L293 prop:title: Discard publication changes?
[DEV] L294 prop:content: Your unsaved publication details will be lost.
[DEV] L295 prop:okText: Discard changes
[DEV] L297 prop:cancelText: Keep editing
L308 attr:title(CustomButton): Save
L319 call:message.error: Please fix URL validation errors before saving
L331 call:message.error: Please fix URL validation errors before saving
```

#### `src/components/profile/about/qualifications.js` (branch: both (differs); 105 strings)
used by: LEARNER: learn/profile.js | FACULTY: teacher/profile.js | COLLEGE: college-admin/profile.js
```text
L71 call:message.error: Failed to load education data. Please try again.
L94 call:message.error: College search failed
L216 str: Education type is required
L217 call:message.error: Please select education type
L221 str: Institution name is required
L222 call:message.error: Please fill in institution name
L226 str: Grading type is required
L227 call:message.error: Please select grading type
L231 str: Grade obtained is required
L232 call:message.error: Please enter grade obtained
L236 str: Max grade is required for job screening
L237 call:message.error: Please enter max grade (e.g. 10 for CGPA, 100 for Percentage)
L248 str: Education type is required
L252 str: Institution name is required
L256 str: Grading type is required
L260 str: Grade obtained is required
L264 str: Max grade is required for job screening
L270 call:message.error: Please fill in all required fields (grading type, grade obtained, and max grade)
L304 call:message.warning: Please use the new API endpoints for education
L384 text(Space): Education Type
L389 attr:placeholder(Select): Select Education Type
L390 attr:aria-label(Select): Degree type
L419 text(Space): Program
L423 attr:placeholder(Select): Select Program
L424 attr:aria-label(Select): Degree type
L444 text(Space): Specialization
L448 attr:placeholder(Select): Select Specialization
L449 attr:aria-label(Select): Specialization
L470 text(Space): Institution Name
L477 attr:placeholder(AutoComplete): Search or type institution name
L478 attr:aria-label(AutoComplete): Institution name
L493 str: Institution name is required
L505 attr:placeholder(Input): Enter institution name
L506 attr:aria-label(Input): Institution name
L516 str: Institution name is required
L537 text(Space): Start Year
L541 attr:placeholder(Input): YYYY (e.g., 2020)
L542 attr:aria-label(Input): Start year
L555 text(Space): End Year
L559 attr:placeholder(Input): YYYY (e.g., 2024)
L560 attr:aria-label(Input): End year
L586 text(Space): Currently Pursuing
L595 text(Space): Grading Type
L600 attr:placeholder(Select): Select Grading Type
L622 text(Space): Max grade
L633 attr:placeholder(Input): e.g. 4 or 5
L634 attr:placeholder(Input): e.g. 10 or 100
L650 text(Space): Grade obtained
L655 attr:placeholder(Input): Enter grade
L674 text(Space): Qualifying Exam (Optional)
L678 attr:placeholder(Select): Select Qualifying Exam
L729 attr:placeholder(InputNumber): Enter ${field.label}
L746 attr:placeholder(Input): Enter ${field.label}
L768 text(Space): No education details added yet. Add your latest qualification to complete this section.
L787 text(Space): Education Type
L792 attr:placeholder(Select): Select Education Type
L793 attr:aria-label(Select): Degree type
L822 text(Space): Program
L826 attr:placeholder(Select): Select Program
L827 attr:aria-label(Select): Degree type
L854 text(Space): Specialization
L858 attr:placeholder(Select): Select Specialization
L859 attr:aria-label(Select): Specialization
L883 text(Space): Institution Name
L890 attr:placeholder(AutoComplete): Search or type institution name
L891 attr:aria-label(AutoComplete): Institution name
L906 str: Institution name is required
L918 attr:placeholder(Input): Enter institution name
L919 attr:aria-label(Input): Institution name
L929 str: Institution name is required
L950 text(Space): Start Year
L955 attr:aria-label(Input): Start year
L968 text(Space): End Year
L973 attr:aria-label(Input): End year
L998 text(Space): Currently Pursuing
L1007 text(Space): Grading Type
L1012 attr:placeholder(Select): Select Grading Type
L1034 text(Space): Max grade
L1044 attr:placeholder(Input): e.g. 10 or 100
L1060 text(Space): Grade obtained
L1065 attr:placeholder(Input): Enter grade
L1084 text(Space): Qualifying Exam (Optional)
L1088 attr:placeholder(Select): Select Qualifying Exam
L1135 attr:placeholder(InputNumber): Enter ${field.label}
L1148 attr:placeholder(Input): Enter ${field.label}
L1165 attr:title(Popconfirm): Delete this education entry?
L1166 attr:description(Popconfirm): This can't be undone.
L1168 attr:okText(Popconfirm): Delete
L1170 attr:cancelText(Popconfirm): Cancel
L1172 text(Space): Delete Education
L1186 text(Space): Most Recent
L1191 child(Space): Education details
L1201 child(Space): ${qualification.grade} / ${qualification.maxGrade}
[DEV] L1206 text(Space): Marksheet attached ·
[DEV] L1206 text(Space): View
[DEV] L1207 child(Space): No marksheet yet
L1220 return: ${fieldLabel}: ${value}
L1233 child(Space): - ${qualification.endYear}
L1233 child(Space): - Present
L1247 attr:title(CustomButton): Cancel
[DEV] L1251 prop:title: Discard education changes?
[DEV] L1252 prop:content: Your unsaved education and exam details will be lost.
[DEV] L1253 prop:okText: Discard changes
[DEV] L1255 prop:cancelText: Keep editing
L1269 attr:title(CustomButton): Save
```

#### `src/components/profile/about/skills.js` (branch: both (differs); 9 strings)
used by: LEARNER: learn/profile.js | FACULTY: teacher/profile.js | COLLEGE: college-admin/profile.js
```text
[DEV] L48 prop:title: Discard skill changes?
[DEV] L49 prop:content: Your unsaved skill edits will be lost.
[DEV] L50 prop:okText: Discard changes
[DEV] L52 prop:cancelText: Keep editing
L70 text(Space): No skills added
L80 child(Space): ${skillName.slice(0, 20)}...
L107 attr:placeholder(SkillsAutocomplete): Search and select skills...
L114 attr:title(CustomButton): Cancel
L121 attr:title(CustomButton): Save
```

#### `src/components/profile/about/socialProfiles.js` (branch: both (differs); 18 strings)
used by: LEARNER: learn/profile.js | FACULTY: teacher/profile.js | COLLEGE: college-admin/profile.js
```text
[DEV] L42 prop:title: Discard social-profile changes?
[DEV] L43 prop:content: Your unsaved profile links will be lost.
[DEV] L44 prop:okText: Discard changes
[DEV] L46 prop:cancelText: Keep editing
L108 str: Google Scholar
L116 text(Space): No social profiles added
L126 attr:placeholder(Input): LinkedIn URL (e.g., https://linkedin.com/in/username)
L150 attr:placeholder(Input): GitHub URL (e.g., https://github.com/username)
L172 attr:placeholder(Input): Portfolio URL (e.g., https://yourportfolio.com)
L194 attr:placeholder(Input): Twitter URL (e.g., https://twitter.com/username)
[DEV] L212 text(Row): Coding profiles
[DEV] L212 text(Row): your username, or paste your profile link
[DEV] L219 attr:aria-label(Input): ${platform.label} username
[DEV] L221 attr:placeholder(Input): username
L241 attr:placeholder(Input): Google Scholar URL (e.g., https://scholar.google.com/citations?user=...)
L263 attr:placeholder(Input): ResearchGate URL (e.g., https://researchgate.net/profile/username)
L288 attr:title(CustomButton): Cancel
L295 attr:title(CustomButton): Save
```

#### `src/components/profile/userInfo.js` (branch: both (differs); 13 strings)
used by: LEARNER: learn/profile.js | FACULTY: teacher/profile.js | COLLEGE: college-admin/profile.js
```text
[DEV] L101 attr:name(ResilientAvatar): Profile
L102 attr:alt(ResilientAvatar): ${userDetails.firstName}'s profile photo
L102 attr:alt(ResilientAvatar): Profile photo
L136 child(Card): etc.
L148 text(Card): Video Introduction
L155 text(Card): Record Video Intro
L163 text(Card): Checking video intro...
[DEV] L169 attr:message(Alert): Video introduction status unavailable
[DEV] L170 attr:description(Alert): We couldn't verify whether you already have a video introduction, so recording is temporarily disabled.
[DEV] L171 text(Alert): Retry
L182 text(Card): Video intro is available. Preview is loading...
L188 text(Card): Video intro uploaded
L195 text(Card): Record a video introduction to help others get to know you better.
```

#### `src/components/verification/VerificationWorkspace.jsx` (branch: lms-dev-2026 only; 170 strings)
used by: COLLEGE: college-admin/verification.js
```text
L21 str: Sent back
L23 prop:label: Waiting
L24 prop:label: Sent back
L25 prop:label: Verified
L29 str: The marksheet is unclear or cropped
L29 str: The marks do not match the marksheet
L29 str: A marksheet is missing
L30 str: The document does not match the number
L30 str: Wrong document uploaded
L30 str: The document is unclear or cropped
L55 text(Typography.Text): Not uploaded
L63 str: You cannot open this document
L78 attr:message(Alert): An update to verified details
L78 attr:description(Alert): Changed values are highlighted. Until you verify, the earlier verified values stay in use.
L83 prop:title(Table): Level
L83 child(Table): · ${e.program}
L83 child(Table): · ${e.specialization}
L84 prop:title(Table): Institution
L85 prop:title(Table): Year
L86 prop:title(Table): Marks
L86 child(Table): / ${e.maxGrade}
L87 prop:title(Table): Marksheet
L87 text(Table): Open
L89 text(Card): Resume:
L89 text(Card): Open resume
L93 text(Card): Aadhaar
L93 child(Card): Not given
L93 text(Card): Open document
L94 text(Card): PAN
L94 child(Card): Not given
L94 text(Card): Open document
L95 text(Card): Numbers show only the last four digits; compare them with the document.
L98 text(Card): Verified by
L98 child(Card): the college
L98 text(Card): on
L101 text(Card): Verify
L102 text(Card): Send back
L114 str: Sent today
L114 str: This week
L114 str: Over a week ago
L118 str: A marksheet is missing: open it and send it back
L120 str: All uploaded
L120 str: Some missing
L120 str: Not an Education check
L123 str: What to check
L123 prop:label: Section
L123 prop:label: Education
L123 prop:label: Identity
L124 str: What to check
L124 prop:label: Kind
L125 prop:label: First check
L125 prop:label: Update to verified details
L126 str: What to check
L126 prop:label: Marksheets
L127 prop:label: Batch
L127 str: No batch
L128 prop:label: Branch
L128 str: Not set
L129 str: What to check
L129 prop:label: Waiting since
L162 str: Could not check your verification access
L176 str: Could not load the queue
L190 str: Could not load the placement-cell verification setting
L204 str: Could not open this student
L227 str: Could not verify
L228 call:message.success: ${SECTION_LABEL[sec]} verified. The student has been told.
L241 str: Could not send it back
L242 call:message.success: Sent back. The student sees your reason.
L252 call:message.warning: Every one picked has a document missing. Open them to send back with a reason.
L254 prop:title: Verify ${items.length} without opening each?
L257 text(Typography.Paragraph): Only do this when you have checked these students' documents another way (for example against the college's own records). Each one is recorded with your name.
L258 text(Typography.Paragraph): left out: a document is missing (
L258 child(Typography.Paragraph): and others
L261 prop:okText: Verify ${items.length}
L267 str: Could not verify
L269 call:message.warning: ${r.data.verified} verified. ${failed.length} could not be: ${failed[0].reason}
L270 call:message.success: ${r.data.verified} verified. The students have been told.
L285 str: Could not save
L286 call:message.success: The placement cell can now verify profiles
L286 call:message.success: Only college admins verify profiles now
L291 prop:label: A marksheet missing
L292 prop:label: Updates to verified details
L293 prop:label: Waiting over a week
L301 str: Not waiting
L303 prop:title: Review one by one
L303 prop:help: Each student's values next to their documents, with Verify and Send back. The next one opens by itself.
L304 prop:button: Start with the first of ${n}
L306 prop:title: Verify without opening
L306 prop:help: Only when you have checked their documents another way (for example the college's own records). Each one is recorded with your name.
L310 return: ${n} of them ${n === 1 ? "is an update" : "are updates"} to details already verified: the new values replace the verified ones.
L310 return: is an update
L310 return: are updates
L312 prop:title: Verify
L313 str: I have checked their documents another way (for example the college's own records).
L316 return: Their values become the verified ones that eligibility uses. Each student is told.${updates.length ? ` ${updates.length} ${updates.length === 1 ? "is an update" : "are updates"} to verified details (${updates.slice(0, 3).map(name).join(", ")}${}
L316 return: ${updates.length} ${updates.length === 1 ? "is an update" : "are updates"} to verified details (${updates.slice(0, 3).map(name).join(", ")}${updates.length > 3 ? " and others" : ""}): the new values replace the old ones.
L316 return: is an update
L316 return: are updates
L316 return: and others
L317 str: To change a verified profile, the student sends an update.
L321 prop:title: Send back
L321 prop:help: Each student sees your reason and fixes it on their profile.
L324 text(Typography.Paragraph): These are Education and Identity checks: one reason goes to all of them. For a section's own reasons, pick the section in the filter first.
L326 attr:name(Form.Item): reason
L326 prop:message(Form.Item): Say what needs to change
L326 attr:placeholder(Input.TextArea): What needs to change
L329 prop:title: Send back
L330 str: Each student sees: "${v.reason.trim()}"
L330 str: They resubmit; nothing to undo.
L333 str: Talk to them
L333 prop:title: Send a message
L333 prop:help: For example: upload the missing marksheet. They see it in the app.
L334 attr:name(Form.Item): text
L334 prop:message(Form.Item): Write the message
L334 attr:placeholder(Input.TextArea): e.g. Please upload your 12th marksheet so we can verify your profile.
L335 prop:title: Send message
L336 str: They see: "${v.text.trim()}"
L336 str: A sent message cannot be taken back.
L344 text(span): selected of
L344 text(span): in this view
L348 child(Button): Act on ${picked.length} selected
L348 child(Button): Act on all ${shown.length}
L358 prop:title: Student
L359 prop:title: Roll
L360 prop:title: Batch
L361 prop:title: Branch
L362 prop:title: Section
L363 prop:title: Status
L364 prop:title: Marksheets
L364 str: ${r.missingMarksheets} of ${r.entries} missing
L364 str: All ${r.entries} uploaded
L366 text(Tag): of
L366 text(Tag): missing
L366 text(Tag): All
L366 text(Tag): uploaded
L367 prop:title: Verified
L367 prop:title: Sent back
L367 prop:title: Sent
L374 prop:title: By
L375 prop:title: Reason sent back
L376 child(Button): Review
L376 child(Button): Open
L381 attr:message(Alert): You cannot verify profiles here
L386 attr:message(Alert): Verification setting unavailable
L387 text(Alert): Retry setting
L393 text(div): The placement cell can verify profiles
L394 text(div): Placement cell admins get this same page. Every decision is recorded with the name of who made it.
L396 attr:aria-label(Switch): The placement cell can verify profiles
L404 prop:label: ${v.label} (${v.value === "WAITING" ? waitingCount : Number(counts[v.value]) || 0})
L408 attr:aria-label(div): Needs doing
L409 text(div): Needs a closer look:
L414 text(div): Nothing unusual: no missing marksheets, updates or old ones.
L420 attr:message(Alert): Showing the first ${QUEUE_LIMIT.toLocaleString()} students in this view
L421 attr:description(Alert): Search, filters and counts below cover only these. Verify these first and the next students appear; older submissions are listed first.
L423 text(Alert): Retry
L425 attr:exportName(TpoDataTable): verification-${view.toLowerCase()}
L426 attr:filterTitle(TpoDataTable): Filter the queue
L427 attr:searchOf(TpoDataTable): ${name(r)} ${r.rollNumber || ""} ${r.branch || ""}
L430 attr:emptyTitle(TpoDataTable): Nobody is waiting
L430 attr:emptyTitle(TpoDataTable): Nothing here yet
L431 attr:emptySubtitle(TpoDataTable): Students appear here when they send their education or identity.
L437 call:message.info: Stopped at ${reviewAt + 1} of ${reviewList.length}. The other ${reviewList.length - reviewAt - 1} are still in the queue.
L440 attr:title(Drawer): ${name(detail.student)} · ${detail.student?.rollNumber || ""}
L440 attr:title(Drawer): Student
L451 attr:title(Card): History
L453 child(Timeline): : ${h.note}
L464 attr:title(Modal): Send ${SECTION_LABEL[sendingBack] || ""} back
L464 attr:okText(Modal): Send back
L468 text(div): The student sees your reason and fixes it on their profile.
L470 attr:placeholder(Input.TextArea): Or write what needs to change
```

#### `src/config/choices.js` (branch: lms-dev-2026 only; 39 strings)
used by: LEARNER: learn/profile.js | FACULTY: teacher/profile.js | COLLEGE: college-admin/profile.js
```text
L3 str: Prefer not to say
L4 str: Internship + full-time
L5 prop:label: On campus
L5 prop:label: Pool
L5 prop:label: Off campus
L6 prop:label: Placements
L6 prop:label: Higher studies
L6 prop:label: Not interested
L10 prop:label: LeetCode
L10 prop:hint: 3-30 letters, digits, _ or -
L11 prop:label: HackerRank
L11 prop:hint: 3-30 letters, digits, _ . or -
L12 prop:label: CodeChef
L12 prop:hint: starts with a letter, 3-20 letters, digits or _
L13 prop:label: Codeforces
L13 prop:hint: 3-24 letters, digits, _ . or -
L14 prop:label: GeeksforGeeks
L14 prop:hint: 3-40 letters, digits, _ . or -
L15 prop:label: HackerEarth
L15 prop:hint: 3-40 letters, digits, _ . or -
L23 str: Job portal
L23 str: Event or job fair
L24 str: Cold outreach
L24 str: Company reached out
L25 prop:label: Added by hand
L25 prop:label: Imported
L33 prop:label: Placed (on campus)
L34 prop:label: Placed (off campus)
L35 prop:label: Higher studies
L36 prop:label: Entrepreneurship / self-employed
L37 prop:label: Competitive exams
L38 prop:label: Not interested
L39 prop:label: Looking for a job
L40 prop:label: Debarred
L41 prop:label: Not decided yet
L46 str: University and course
L46 str: The business
L46 str: The exam, e.g. GATE 2027
L46 str: Reason (optional)
```

#### `src/contexts/calendar-context.js` (branch: both (identical); 0 strings)
(no user-facing strings)

#### `src/data/projectsData.js` (branch: both (differs); 7 strings)
used by: LEARNER: learn/projects/[projectId].js, learn/projects/index.js | MENTOR: mentor/projects/[projectId].js, mentor/projects/index.js
```text
L2 prop:label: Overview
L3 prop:label: People & Meetings
[DEV] L7 prop:label: Releases and Sprints
L8 prop:label: Board
[DEV] L13 prop:label: Task Allocation
L14 prop:label: Resources
L15 prop:label: Activity
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L7 prop:label: Sprints
```

#### `src/hooks/useChoices.js` (branch: lms-dev-2026 only; 2 strings)
used by: LEARNER: learn/profile.js | FACULTY: teacher/profile.js | COLLEGE: college-admin/profile.js
```text
L62 return: That link is not a ${platform.label} profile. Type your username instead.
L63 return: ${platform.label} username should be ${platform.hint}.
```

#### `src/hooks/useContacts.js` (branch: both (differs); 2 strings)
used by: FACULTY: teacher/contacts/[contactsTab].js
```text
L32 prop:message: Couldn't load contacts
L33 prop:description: Something went wrong on our end. Please refresh the page or try again shortly.
```

#### `src/hooks/useCourseHomeWidgets.js` (branch: both (differs); 5 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js
```text
L120 prop:title: Announcement
L168 str: Scheduled Class
L178 prop:title: Scheduled Class
L180 str: ddd, MMM D [at] h:mm A
L244 new Error: Some course activity data could not be loaded.
```

#### `src/hooks/useCourses.js` (branch: both (differs); 3 strings)
used by: LEARNER: learn/calendar.js | FACULTY: teacher/calendar.js
```text
L8 return: ${createdAt[2] ?? ""}/${createdAt[1] ?? ""}/${createdAt[0] ?? ""}
L76 call:setCoursesError: Failed to load courses. Please try again.
L116 call:setCoursesError: Failed to load courses. Please try again.
```

#### `src/hooks/useDebounceHook.js` (branch: both (identical); 0 strings)
(no user-facing strings)

#### `src/hooks/useFacultyCourseStats.js` (branch: both (differs); 4 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js
```text
L213 prop:title: Untitled
L487 prop:label: Below 60%
L534 str: ${la.attendancePercent}% attendance
L565 str: ${count} submissions missing
```

#### `src/hooks/useLearnerClassScope.js` (branch: lms-dev-2026 only; 0 strings)
(no user-facing strings)

#### `src/hooks/useLearnerHomeStats.js` (branch: both (differs); 0 strings)
(no user-facing strings)

#### `src/pages/Dashboard/course/Attendance/AbsentPresntBtnCol.js` (branch: both (identical); 3 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js
```text
L20 attr:aria-label(button): Mark present
L25 text(div): P
L31 attr:aria-label(button): Mark absent
```

#### `src/pages/Dashboard/course/Attendance/AttendanceReport.js` (branch: both (differs); 9 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js
```text
[DEV] L25 str: Discard your unsaved attendance changes?
L50 text(div): Attendance
L53 child(div): See attendance history and monthly trends in one place.
L54 child(div): See your attendance record and class-wise status in one place.
L69 str: min(160px, 100%)
L70 attr:placeholder(Select): Select Class
L71 attr:aria-label(Select): Select class to view attendance
L80 prop:label(Segmented): Attendance report
L81 prop:label(Segmented): Mark attendance
```

#### `src/pages/Dashboard/course/Attendance/NameWithDp.js` (branch: both (identical); 0 strings)
(no user-facing strings)

#### `src/pages/Dashboard/course/Attendance/StudentAttendanceView.jsx` (branch: both (differs); 20 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js
```text
L44 call:setError: Failed to load attendance.
L67 text(Alert): Retry
L98 attr:aria-label(section): Student attendance summary
L100 text(section): Attendance this month
L101 child(section): ${attendancePercent}%
L104 child(section): No classes held yet in this period.
L106 child(section): You need ${ATTENDANCE_THRESHOLD_EFFECTIVE}%. You can miss ${canStillMiss} more ${canStillMiss === 1 ? "class" : "classes"} this month.
[DEV] L108 child(section): Below the ${ATTENDANCE_THRESHOLD_EFFECTIVE}% requirement. Attend the next ${headroom.mustAttend} ${headroom.mustAttend === 1 ? "class" : "classes"} to recover.
[DEV] L109 child(section): Below the ${ATTENDANCE_THRESHOLD_EFFECTIVE}% requirement. Talk to your faculty about it.
L113 text(section): Present
L114 text(section): Absent
L115 text(section): Held
L121 text(section): Attendance History
L122 text(section): Review each scheduled class and your status for it.
L138 attr:description(Empty): No classes in this period
L148 attr:description(Empty): No classes in this period
L187 prop:title: Date
L194 prop:title: Day
L201 prop:title: Class Start Time
L209 prop:title: Present/Absent
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L106 child(section): Below the ${ATTENDANCE_THRESHOLD_EFFECTIVE}% requirement. Attend the next ${Math.max(1, Math.ceil((ATTENDANCE_THRESHOLD_EFFECTIVE / 100 * heldCount - presentCount) / (1 - ATTENDANCE_THRESHOLD_EFFECTIVE / 100)))} to recover.
```

#### `src/pages/Dashboard/course/Attendance/TakeAttendance.js` (branch: both (differs); 51 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js
```text
[DEV] L56 str: Discard your unsaved attendance changes?
[DEV] L63 str: Route change aborted to preserve unsaved attendance changes.
L75 prop:title: Student Name
L81 prop:title: Status
L155 str: Failed to load students or attendance.
L235 prop:content: Class scheduled successfully.
L251 prop:content: Failed to schedule class.
[DEV] L272 attr:message(Alert): Could not load the attendance roster
[DEV] L274 text(Alert): Retry
L281 text(div): Attendance Session
L284 str: ddd, D MMM YYYY
L285 child(div): Selected schedule
L289 child(div): ${selectedScheduleStart.format("hh:mm A")}${selectedScheduleEnd ? ` - ${selectedScheduleEnd.format("hh:mm A")}` : ""}
L289 child(div): - ${selectedScheduleEnd.format("hh:mm A")}
L290 child(div): Select a scheduled class to mark attendance.
L297 text(div): Ready to mark
L303 attr:title(CustomButton): Schedule Class
L304 attr:buttonType(CustomButton): primaryTrans
L309 attr:aria-label(div): Attendance marking summary
L310 text(div): Students
L311 text(div): Present
L312 text(div): Absent
L319 attr:placeholder(Input): Find a student by name
L320 attr:aria-label(Input): Find a student by name
L330 text(div): Mark all present
L337 text(div): Mark all absent
L353 text(div): absent ·
L353 text(div): present
L356 attr:title(CustomButton): Submitting…
L356 attr:title(CustomButton): Submit Attendance
L365 attr:description(Empty): No class scheduled for this date
L367 attr:title(CustomButton): Schedule Class
L368 attr:buttonType(CustomButton): primaryTrans
L378 attr:title(Modal): Submit Attendance
L385 attr:okText(Modal): Submitting…
L385 attr:okText(Modal): Confirm
L386 attr:cancelText(Modal): Cancel
[DEV] L398 text(div): Mark
[DEV] L399 text(div): absent
[DEV] L400 text(div): and
[DEV] L400 text(div): present?
[DEV] L406 attr:message(Alert): Attendance was only partially saved
[DEV] L406 attr:message(Alert): Attendance was not saved
L460 prop:content: Please select a class.
L474 prop:content: Nothing to submit — mark at least one student present or absent.
L500 prop:reason: Mark Absent
L510 prop:content: Attendance marked successfully.
L521 str: , and ${rejected - 5} more
[DEV] L526 prop:message: ${fulfilled} recorded, ${rejected} failed (${names}${more}). This class is not marked as taken until they are saved; Retry sends only the failed students.
[DEV] L527 prop:message: No attendance was saved. ${rejected} student record${rejected === 1 ? "" : "s"} failed (${names}${more}).
[DEV] L541 prop:message: Failed to mark attendance. Check the session and retry.
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L248 child(div): Available after class starts
[PROD-ONLY] L346 prop:content: Attendance can only be marked after the class starts.
[PROD-ONLY] L379 prop:content: Attendance can only be marked after the class starts.
[PROD-ONLY] L417 prop:content: Mark ${absentCount} ${absentCount === 1 ? 'student' : 'students'} absent and ${presentCount} ${presentCount === 1 ? 'student' : 'students'} present?
[PROD-ONLY] L446 prop:content: Failed to mark attendance.
[PROD-ONLY] L456 prop:content: Attendance partially saved: ${fulfilled} recorded, ${rejected} failed (${names}${more}).
[PROD-ONLY] L464 prop:content: Failed to mark attendance.
```

#### `src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx` (branch: both (differs); 33 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js
```text
L124 attr:description(Empty): Couldn't load attendance data for this month.
L125 text(Empty): Retry
L130 attr:description(Empty): No attendance data for this month
[DEV] L184 call:message.error: Couldn't generate the attendance report. Please try again.
L190 attr:aria-label(section): Faculty attendance summary
L192 text(section): Monthly class health
L193 child(section): ${attendancePercent}%
L196 child(section): ${presentCount} present marks across ${monthlyClassIds.length} scheduled sessions.
L197 child(section): No scheduled sessions found for this month.
L199 child(section): ${unmarkedClassIds.size} session${unmarkedClassIds.size === 1 ? "" : "s"} not yet marked, excluded from this percentage.
L204 text(section): Students
L205 text(section): Sessions
L206 text(section): Absences
L208 text(section): Not marked
L215 text(section): Monthly Attendance
L216 text(section): See each student’s attendance day by day for this month.
L219 text(section): Active days
[DEV] L226 text(section): Download Report
L231 attr:aria-label(div): Attendance legend
L232 text(section): P = Present
L233 text(section): A = Absent
L234 text(section): — = Not marked yet
L235 text(section): ✖ = No class
L239 text(section): Attendance by student and day for
L272 attr:aria-label(th): Student name
L298 text(th): Student Name
L309 attr:aria-label(th): ${dates?.[i]?.day ?? ""} ${dayNum}
L364 str: ${attendedCount} present, ${absentCount} absent, ${notMarkedSessionCount} not marked of ${sessionCount} sessions
L365 str: Not marked yet
L405 text(tr): P
L414 attr:aria-label(td): No class scheduled
L431 prop:title: Session Time
L436 prop:title: Attendance
```

#### `src/pages/Dashboard/course/Attendance/attendance.js` (branch: both (identical); 0 strings)
(no user-facing strings)

#### `src/pages/Dashboard/course/Classroom/classroom.js` (branch: both (differs); 58 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js
```text
L76 return: Just now
L77 return: ${diffMins}m ago
L79 return: ${diffHours}h ago
L81 return: ${diffDays}d ago
L89 return: Today
L90 return: Yesterday
L135 prop:label: Earlier
[DEV] L235 call:setRefreshError: Could not refresh the discussion. Showing the last messages we loaded.
L237 call:setLoadError: We could not load this discussion.
[DEV] L289 str: Discard your unsent discussion message?
[DEV] L293 str: Route change aborted to preserve an unsent discussion message.
L350 call:messageApi.error: Failed to post message.
L366 call:messageApi.error: Failed to update pin state.
L377 prop:title: Delete this message?
L378 prop:content: This cannot be undone.
L379 prop:okText: Delete
L381 prop:cancelText: Cancel
L391 call:messageApi.error: Failed to delete message.
L428 child(article): You
L428 child(article): User
L429 text(article): Faculty
L433 text(article): Pinned
L441 attr:title(Tooltip): Unpin
L441 attr:title(Tooltip): Pin
L445 attr:aria-label(Button): Unpin this message
L445 attr:aria-label(Button): Pin this message
L453 attr:title(Tooltip): Delete
L458 attr:aria-label(Button): Delete this message
L485 attr:message(Alert): We could not load this discussion.
L486 attr:description(Alert): Check your connection and try again.
L488 text(Alert): Retry
L498 text(div): Discussion unavailable
L499 text(div): This course is not linked to one of your classes yet, so there is no discussion to show.
L508 child(div): Start the conversation
L508 child(div): No messages yet
L511 child(div): Learners are far more likely to post once someone else has. Try a welcome note or this week's focus.
L512 child(div): Ask the first question — your classmates and faculty will see it here.
L518 str: Welcome! Use this space for questions about the course.
L521 text(div): Post a welcome message
L526 str: This week we are focusing on:
L529 text(div): Share this week's focus
L561 text(div): Discussions
L562 text(div): Keep course conversations in one place and follow along easily.
L577 text(div): Pinned by
L578 child(div): User
L579 child(div): · 1 of ${pinnedMessages.length}
L583 attr:title(Tooltip): Unpin this message
L588 attr:aria-label(Button): Unpin this message
L599 attr:aria-label(section): Course discussions
[DEV] L606 attr:message(Alert): Discussion refresh failed
L608 text(Alert): Retry
L619 text(div): new
[DEV] L629 child(div): Students can post questions here anytime — you'll see them appear in real time.
[DEV] L630 child(div): Have a doubt about anything in this course? Feel free to ask here.
L644 attr:placeholder(Input.TextArea): Write a message...
L648 attr:aria-label(Input.TextArea): Write a message
L657 text(div): Send
L660 text(div): Enter to send · Shift+Enter for a new line
```

#### `src/pages/Dashboard/course/Home/Home.js` (branch: both (differs); 57 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js
```text
L104 call:setCourseDetailsError: Course details are currently unavailable.
L109 call:setCourseDetailsError: Failed to load course details.
L150 str: ${getFacultyBasePath(router.pathname, loginUser?.facultyType)}/courses
[DEV] L183 str: Checking course signals
[DEV] L184 prop:title: Loading pending work
[DEV] L185 str: We are checking submissions and attendance before showing a status.
L187 prop:label: Open course content
[DEV] L193 str: Status unavailable
[DEV] L194 prop:title: Pending work could not be verified
[DEV] L195 str: Submission signals are incomplete. You can still open the course content while they are retried.
L197 prop:label: Open course content
L203 str: Needs review
L204 prop:title: ${facultyStats.pendingToGrade} submission${facultyStats.pendingToGrade === 1 ? "" : "s"} waiting
L205 str: Review pending learner work before it piles up.
L207 prop:label: Review work
L215 str: All clear
L216 prop:title: Nothing waiting on you
L217 str: No submissions pending review. Jump back into the course content.
L219 prop:label: Open course content
L227 str: Due soon
L228 prop:title: Assessment pending
L229 str: Complete the pending task.
L231 prop:label: Open task
L239 str: Upcoming live session
L240 prop:title: Live class scheduled
L241 str: Join from the live sessions tab.
L243 prop:label: View session
L252 str: Next up
L253 prop:title: Next lesson item
L254 str: Continue from the next pending item.
L256 prop:label: Continue
L271 str: Start here
L272 prop:title: Begin with the first lecture
L273 str: Open lectures to start the course in sequence.
L275 prop:label: Start learning
L292 prop:title: Reviews
[DEV] L295 prop:subtitle: Submission status unavailable
L297 prop:subtitle: Submissions need grading
L298 prop:subtitle: No pending grading right now
L304 prop:title: Attendance
[DEV] L307 prop:subtitle: Attendance status unavailable
L309 prop:subtitle: ${recentSessions} recent class sessions tracked
L310 prop:subtitle: No attendance sessions tracked yet
L327 text(div): Overview
L329 text(div): See progress, next steps, and updates for this course at a glance.
L369 attr:aria-label(section): Next action
L390 attr:title(Button): Loading course…
L405 child(div): Faculty course signals could not be loaded. You can still use the other course tabs.
[DEV] L406 child(div): Some faculty course signals are incomplete (${Object.entries(facultyStats.sourceErrors || {}).filter(([, failed]) => failed).map(([name]) => name).join(", ")}). Unknown metrics are shown as unavailable, not zero.
[DEV] L408 text(div): Retry signals
L417 text(div): Progress could not be loaded. You can still open course content.
L424 attr:aria-label(section): Pending work
L427 text(div): Pending work
L428 text(div): Items that need faculty attention.
L438 attr:title(button): Loading course…
L480 text(div): Some activity widgets could not be loaded. Please refresh to retry.
L487 text(div): Your class assignment is pending. Please contact your administrator.
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L262 prop:title: At-risk Students
[PROD-ONLY] L265 prop:subtitle: Needs attendance or submission follow-up
[PROD-ONLY] L266 prop:subtitle: No major learner risk signals
[PROD-ONLY] L282 prop:title: Performance
[PROD-ONLY] L285 prop:subtitle: No graded submissions yet
[PROD-ONLY] L286 prop:subtitle: Average across graded work
[PROD-ONLY] L306 child(div): See course structure, student activity, and the next actions at a glance.
[PROD-ONLY] L433 text(div): Needs attention
[PROD-ONLY] L434 text(div): students
[PROD-ONLY] L454 text(div): View all
[PROD-ONLY] L455 text(div): students
```

#### `src/pages/Dashboard/course/Home/HomeEditDrawer.js` (branch: both (identical); 12 strings)
used by: COLLEGE: college-admin/courses/[id].js
```text
L11 call:message.info: Course info update is not yet implemented.
L19 attr:title(DrawerWidget): Course Information
L25 attr:primaryButtonTitle(DrawerWidget): Cancel
L26 attr:secondaryButtonTitle(DrawerWidget): Save
L36 text(DrawerWidget): Course title
L38 attr:name(Form.Item): Course_title
L42 prop:message(Form.Item): Enter Course name
L47 attr:placeholder(Input): Course title
L52 text(DrawerWidget): Course info
L54 attr:name(Form.Item): Course_info
L58 prop:message(Form.Item): Enter Course info
L64 attr:placeholder(TextArea): Enter Course Info
```

#### `src/pages/Dashboard/course/Sudent/student.js` (branch: both (differs); 44 strings)
used by: FACULTY: teacher/courses/[courseId]/[...courseTab].js
```text
L50 return: tel:${digits}
L57 return: ${digits.slice(0, 5)} ${digits.slice(5)}
L59 return: +91 ${digits.slice(2, 7)} ${digits.slice(7)}
L107 attr:aria-label(button): View ${student.name} profile photo
L121 prop:title: Student
L133 child(span): Roll ${record.rollNo}
L133 child(span): Roll not assigned
L143 prop:title: Phone
L149 attr:aria-label(a): Call ${record.name}
L153 text(span): No number
L158 prop:title: Email
L163 attr:aria-label(a): Email ${record.name}
L167 text(span): No email
L259 call:setError: We couldn't load the class roster. Check your connection and try again.
L300 child(div): No matching students
L300 child(div): No students yet
L303 child(div): Try searching by name, roll number, or contact number.
L304 child(div): Students will appear here once they are enrolled in this class.
L321 text(div): Students
L326 attr:aria-label(div): Students overview
L328 text(div): Class list
L329 text(div): Students
L332 child(div): Students enrolled in ${selectedClassName}.
L333 child(div): Students enrolled in this class.
L336 attr:aria-label(div): Roster summary
[DEV] L341 child(div): ${missingRollCount} without a roll number
[DEV] L341 child(div): All have roll numbers
L345 text(div): contacts
L361 str: min(160px, 100%)
L362 attr:placeholder(Select): Select Class
L363 attr:aria-label(Select): Select class to view its roster
L369 attr:placeholder(Input): Search by name, roll no, phone or email
L373 attr:aria-label(Input): Search students
L378 text(div): Showing
L379 text(div): of
L396 text(Alert): Retry
L404 text(div): No class selected
L405 text(div): This course is not linked to one of your classes yet.
L425 attr:description(Empty): No students found
L448 text(div): Roll No
L453 text(div): Contact
L487 attr:alt(img): ${selectedStudent.name} profile
L495 child(div): Roll ${selectedStudent.rollNo}
L495 child(div): Roll not assigned
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L336 text(div): roll missing
```

#### `src/pages/Dashboard/course/syllabus/liveclass.js` (branch: both (differs); 40 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js | COLLEGE: college-admin/courses/[id].js
```text
[DEV] L19 return: Zoom
[DEV] L20 return: Google Meet
[DEV] L21 return: Microsoft Teams
[DEV] L22 return: Webex
[DEV] L23 return: Whereby
[DEV] L32 return: ${minutes} min
[DEV] L34 return: ${hours} h${minutes % 60 ? ` ${minutes % 60} min` : ""}
[DEV] L34 return: ${minutes % 60} min
[DEV] L36 return: ${days} day${days === 1 ? "" : "s"}
L60 str: Live Class
L77 call:message.warning: The meeting link isn't available yet.
[DEV] L84 call:message.success: Meeting link copied
[DEV] L86 call:message.error: Couldn't copy the link
[DEV] L116 prop:label: Ended
[DEV] L118 prop:label: Live now
[DEV] L120 prop:label: Starts in ${humanizeUntil(start)}
[DEV] L121 prop:label: Scheduled
[DEV] L128 text(div): Live session
L135 attr:title(Popconfirm): Delete the live class
L136 attr:description(Popconfirm): Are you sure you want to delete this live class?
L140 call:message.success: Live class deleted successfully
L144 call:message.error: Failed to delete
L147 attr:okText(Popconfirm): Yes
L148 attr:cancelText(Popconfirm): No
[DEV] L150 attr:aria-label(Button): Delete live class
[DEV] L173 child(div): ${startDay.format("dddd, DD MMM YYYY")} ·
[DEV] L173 str: dddd, DD MMM YYYY
[DEV] L175 child(div): – ${end.format("h:mm A")}
[DEV] L176 text(div): min
[DEV] L179 str: dddd, DD MMM YYYY
[DEV] L181 text(div): on
[DEV] L189 child(div): This session has already ended.
[DEV] L191 child(div): The session is live. Join now.
L192 child(div): A live class session is available. Click the button to join.
[DEV] L196 attr:aria-label(Button): Copy meeting link
[DEV] L199 text(div): Session ended
L209 text(div): Join Meeting
L216 text(div): No meeting link available yet. The link will appear here once the session is scheduled.
[DEV] L223 text(div): Attended this session?
[DEV] L224 attr:disabledReason(MarkCompleteButton): Completion status could not be verified. Retry lesson state before marking this item complete.
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L125 child(div): - ${displayEndTime}
```

#### `src/pages/Dashboard/course/syllabus/resource.js` (branch: both (differs); 32 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js | COLLEGE: college-admin/courses/[id].js
```text
[DEV] L46 return: Link
[DEV] L48 return: File
[DEV] L50 return: ${Math.round(kb)} KB
[DEV] L50 return: ${(kb / 1024).toFixed(1)} MB
L78 new Error: Resource is not available
L82 new Error: Resource file is unavailable
L88 call:messageApi.error: Resource file is unavailable. Contact your instructor.
L99 call:messageApi.success: Resource removed
L102 call:messageApi.error: Could not remove Resource
L112 attr:aria-label(article): Resource
L119 text(article): Resource
[DEV] L122 child(article): For your class
[DEV] L122 child(article): Shared with your class
L132 attr:aria-label(Button): Edit Resource
L133 attr:title(Popconfirm): Remove this Resource?
L133 attr:description(Popconfirm): The lesson entry will be hidden; stored files are retained.
L134 attr:okText(Popconfirm): Remove
L134 attr:cancelText(Popconfirm): Cancel
L135 attr:aria-label(Button): Remove Resource
[DEV] L141 attr:aria-label(section): About this resource
L146 attr:message(Alert): Some Resource files are unavailable. Contact your instructor.
[DEV] L148 attr:aria-label(section): Materials
[DEV] L149 text(article): Materials
L172 attr:aria-label(Button): Open file: ${title}
L172 text(article): Open
L175 attr:aria-label(Button): Open link: ${title}
L175 text(article): Open
L176 text(article): Unavailable
L182 attr:description(Empty): No Resource materials
L184 attr:title(Drawer): Edit Resource
[DEV] L192 text(article): Finished with these materials?
[DEV] L193 attr:disabledReason(MarkCompleteButton): Completion status could not be verified. Retry lesson state before marking this item complete.
```

#### `src/pages/Dashboard/course/syllabus/syllabus.js` (branch: both (differs); 95 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js
```text
L40 prop:label: Resource
L42 prop:label: YouTube
L43 prop:label: Assignment
L44 prop:label: Quiz
L45 prop:label: Live session
L45 str: Live sessions
L52 prop:label: Video
L53 prop:label: Resources
L54 prop:label: Quiz
L55 prop:label: Assignment
L56 prop:label: Live Session
L61 prop:title: Learning Path
L66 prop:emptyTitle: No roadmap items yet
L67 prop:emptyDescription: Create lessons and add content to show the learner roadmap.
L68 str: Open roadmap
L69 str: Back to Learning Path
L72 prop:title: Course Blueprint
L77 prop:emptyTitle: No lessons yet
L78 prop:emptyDescription: Lessons are managed by the admin team. Once lessons are available, faculty can add lectures, resources, assessments, and live classes here.
L79 str: Back to Blueprint
L91 prop:label: All
L92 prop:label: Lectures
L93 prop:label: Resources
L94 prop:label: Assessments
L95 prop:label: Live sessions
L166 return: Untitled
L196 return: YouTube
L197 return: Video
L198 return: Lecture
L202 return: Resource
L203 return: Assignment
L204 return: Quiz
L205 return: Live session
L206 return: Lecture
L207 return: Content
L219 return: View lecture
L220 return: View resource
L221 return: View assessment
L222 return: View live session
L223 return: View item
L303 str: Untitled quiz
L304 str: Untitled quiz
L321 attr:description(Empty): No content selected
L366 str: min(calc(100dvh - 180px), 720px)
L366 str: min(680px, calc(100dvh - 180px))
L369 attr:description(Empty): Quiz preview is unavailable
L375 attr:description(Empty): No viewer available for ${getRoadmapContentLabel(type)}
[DEV] L548 prop:message: Content unavailable
[DEV] L549 prop:description: This item is not currently published for learners.
[DEV] L557 prop:message: Content locked
[DEV] L748 call:setLessonsLoadError: Could not load lessons for this course.
[DEV] L790 prop:message: Content locked
[DEV] L790 prop:message: Content unavailable
L815 prop:message: Lesson not found
L816 prop:description: The linked lesson could not be found. It may have been removed or renamed.
L885 text(div): Keep moving forward, one lesson at a time.
[DEV] L899 attr:message(Alert): Could not load course lessons
[DEV] L901 text(Alert): Retry
L906 text(div): Not assigned to a class
L907 text(div): You need to be assigned to a class to view this course. Please contact your administrator.
[DEV] L922 attr:message(Alert): Some course state could not be loaded
[DEV] L927 attr:description(Alert): . The visible course content is kept, but completion/counts may be incomplete until you retry.
[DEV] L932 text(Alert): Retry state
L937 attr:aria-label(div): Course roadmap
L938 attr:aria-label(div): Roadmap content filters
L977 prop:label: Completed
L979 prop:label: In progress
L980 prop:label: Not started
L998 child(div): Untitled lesson
L1002 text(div): Continue here
L1010 attr:aria-label(div): Lesson ${lessonIndex + 1} contents
L1035 attr:aria-label(Button): Add content to this lesson
[DEV] L1036 text(div): Add content
[DEV] L1075 attr:aria-label(button): ${destinationLabel}: ${title}${done ? ", completed" : expired ? ", deadline passed, view answers" : locked ? ", locked" : quizDeadlineUnavailable ? ", unavailable, deadline missing" : ""}
L1075 attr:aria-label(button): , completed
[DEV] L1075 attr:aria-label(button): , deadline passed, view answers
[DEV] L1075 attr:aria-label(button): , locked
[DEV] L1075 attr:aria-label(button): , unavailable, deadline missing
[DEV] L1087 child(div): · ${live.label}
[DEV] L1088 child(div): · ${rowDue.past ? "Was due" : "Due"} ${rowDue.label}
[DEV] L1088 child(div): Was due
[DEV] L1088 child(div): Due
[DEV] L1092 text(div): Draft · hidden from students
[DEV] L1094 text(div): Locked
[DEV] L1096 text(div): Unavailable · deadline missing
[DEV] L1100 text(div): Missed
[DEV] L1102 text(div): Live now
[DEV] L1104 text(div): Ended
[DEV] L1106 text(div): Not submitted
[DEV] L1108 text(div): % watched
L1118 child(div): No ${getFilterLabel(roadmapContentFilter)} in this lesson.
[DEV] L1120 child(div): Nothing here yet — use Add content above to add the first item.
L1121 child(div): No content in this lesson yet.
[DEV] L1185 str: min(760px, 94vw)
[DEV] L1185 str: min(1120px, 92vw)
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L643 prop:message: Could not load lessons
[PROD-ONLY] L644 prop:description: Please try again later.
[PROD-ONLY] L907 attr:aria-label(button): ${destinationLabel}: ${title}${done ? ", completed" : ""}
[PROD-ONLY] L930 child(div): Nothing here yet — use the actions below to add the first item.
```

#### `src/pages/Dashboard/course/syllabus/syllabusDetail.js` (branch: both (differs); 31 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js | COLLEGE: college-admin/courses/[id].js
```text
L41 prop:label: Resources
L65 return: Untitled content
L73 str: Live Class
L74 str: Live Class
L107 str: Add content
L108 str: No lesson content yet
L253 text(div): Loading
L272 text(div): Previous lesson
L277 text(div): Next lesson
L285 child(div): Loading...
L296 child(div): ${contentUnitLabel}s
[DEV] L343 attr:message(Alert): Lesson completion state could not be fully verified
[DEV] L344 attr:description(Alert): Content stays available, but completion badges and completion-dependent actions are held until this state is refreshed.
[DEV] L345 text(Alert): Retry state
[DEV] L353 attr:message(Alert): Lesson content may be out of date
[DEV] L355 text(Alert): Retry
[DEV] L359 text(div): Loading lesson content…
[DEV] L364 attr:message(Alert): Lesson content could not be loaded
[DEV] L366 text(Alert): Retry
L374 text(div): Drag the grip handle to reorder content for this class.
[DEV] L401 text(div): Content locked
L412 attr:aria-label(div): Lesson navigation
L418 text(div): Previous lesson
L423 text(div): Next lesson
[DEV] L475 call:setLessonContentLoadError: Please try again.
L476 prop:message: Could not load lesson content
L476 prop:description: Please try again later.
L489 prop:message: Could not load lesson metrics
L489 prop:description: Please try again later.
L556 text(div): This content type isn't supported yet
L557 text(div): Contact your instructor if this looks wrong.
--- present only on prod-2026 version of this file ---
[PROD-ONLY] L468 attr:title(iframe): Quiz
[PROD-ONLY] L470 str: min(calc(100dvh - 180px), 720px)
[PROD-ONLY] L470 str: min(680px, calc(100dvh - 180px))
[PROD-ONLY] L471 attr:description(Empty): Quiz preview is unavailable
```

#### `src/pages/Dashboard/course/syllabus/video.js` (branch: both (differs); 10 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js | COLLEGE: college-admin/courses/[id].js
```text
L158 attr:contentType(ContentTitle): Video
L162 attr:aria-label(button): Edit content
L166 attr:title(Popconfirm): Delete the video
L167 attr:description(Popconfirm): Are you sure to delete this video?
L173 prop:content: Video deleted successfully
L184 prop:content: Failed to delete
L190 attr:okText(Popconfirm): Yes
L191 attr:cancelText(Popconfirm): No
L193 attr:aria-label(button): Delete content
L210 text(div): Video not available
```

#### `src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx` (branch: both (differs); 38 strings)
used by: LEARNER: learn/allAssignments.js, learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/allAssignments.js, teacher/courses/[courseId]/[...courseTab].js | COLLEGE: college-admin/courses/[id].js
```text
L99 attr:title(iframe): Submitted assignment PDF preview
L106 text(iframe): Preview not available.
L106 text(iframe): Open PDF
L150 str: Assignment submissions
L184 call:setLoadError: Failed to load submissions
L185 prop:content: Failed to load submissions
[DEV] L278 attr:message(Alert): Submissions could not be loaded
[DEV] L280 text(Alert): Retry
L283 attr:description(Empty): No submissions yet
[DEV] L291 attr:message(Alert): Showing the last loaded submissions
[DEV] L293 text(Alert): Retry
[DEV] L328 child(List): Graded
[DEV] L328 child(List): Pending
L345 attr:placeholder(Select): Select student
[DEV] L367 attr:aria-label(Button): Previous student
[DEV] L376 attr:aria-label(Button): Next student
L389 text(Modal): Written Response
L400 child(Modal): Uploaded PDF
L400 child(Modal): Uploaded File
L403 text(Modal): Open file
L407 text(Modal): Unable to load this file
L416 child(Modal): Repository Link
L416 child(Modal): Submitted Link
L436 attr:description(Empty): Unable to load this submitted file
L442 child(Modal): Repository Link
L442 child(Modal): Submitted Link
L453 attr:description(Empty): Select a student to view their submission
L459 child(Modal): Graded: ${selectedStudent?.pointsObtained} pts
L461 child(Modal): Graded: ${grades} pts
L462 child(Modal): Grade pending
L473 attr:placeholder(Input): Grade points
L489 text(Modal): Submit grade
L491 text(Modal): Edit grade
[DEV] L510 prop:content: Enter a score before submitting
L517 prop:content: Could not resolve this submission
[DEV] L523 prop:content: This submission belongs to a different assignment. Reopen the assignment and try again.
L535 prop:content: Grade submitted
L552 prop:content: Failed to submit grade
```

#### `src/pages/Dashboard/course/syllabus/youtube.js` (branch: both (differs); 10 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js | COLLEGE: college-admin/courses/[id].js
```text
L169 attr:contentType(ContentTitle): YouTube Video
L178 attr:title(Popconfirm): Delete the YouTube video
L179 attr:description(Popconfirm): Are you sure you want to delete this YouTube video?
L183 prop:content: YouTube video deleted successfully
L187 prop:content: Failed to delete
L190 attr:okText(Popconfirm): Yes
L191 attr:cancelText(Popconfirm): No
L203 text(div): Video unavailable. It may be region-blocked or removed.
L204 text(div): Open on YouTube
L209 attr:aria-label(div): Embedded YouTube video
```

#### `src/utils/assignmentReport.js` (branch: lms-dev-2026 only; 6 strings)
used by: FACULTY: teacher/report/assignment/[contentId].js
```text
L8 return: Student ${sub.studentId}
L8 return: Unknown student
L20 return: Student ${rosterStudentId(entry)}
L20 return: Unknown student
L101 prop:title: Untitled assignment
L114 str: MMM D, YYYY [at] h:mm A
```

#### `src/utils/assignmentSchema.js` (branch: both (identical); 19 strings)
used by: LEARNER: learn/allAssignments.js, learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/allAssignments.js, teacher/courses/[courseId]/[...courseTab].js | COLLEGE: college-admin/courses/[id].js
```text
L17 prop:label: Written Response
L18 prop:label: PDF Upload
L19 prop:label: File Upload
L20 prop:label: Repository Link
L21 prop:label: Website / External Link
L25 prop:label: Instructions
L27 prop:label: File
L28 prop:label: Link
L93 prop:title: Instructions
L107 prop:title: Assignment PDF
L107 prop:title: Assignment File
L126 prop:title: Reference Link
L177 prop:title: Written Response
L187 prop:title: Repository Link
L187 prop:title: External Link
L196 prop:title: Submitted File
L219 prop:title: Written Response
L233 prop:title: Submitted File
L251 prop:title: Submission Link
```

#### `src/utils/attendanceConstants.js` (branch: both (differs); 4 strings)
used by: LEARNER: learn/attendance.js, learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js
```text
[DEV] L30 prop:label: Scheduled
[DEV] L31 prop:label: Absent
[DEV] L32 prop:label: Not marked
[DEV] L33 prop:label: Present
```

#### `src/utils/clientErrorReporting.js` (branch: both (differs); 5 strings)
used by: LEARNER: learn/allAssignments.js, learn/calendar.js, learn/courses/[courseId]/[...courseTab].js, learn/my-placements/placement.js (+2 more) | FACULTY: teacher/allAssignments.js, teacher/calendar.js, teacher/courses/[courseId]/[...courseTab].js, teacher/profile.js | MENTOR: mentor/projects/[projectId].js | COLLEGE: college-admin/courses/[id].js, college-admin/jobs/[jobId]/applications.js, college-admin/jobs/[jobId]/index.js, college-admin/jobs/[jobId]/interviews.js (+5 more)
```text
L3 const:DEDUPE_KEY: 42lms_client_error_dedupe_v1
[DEV] L63 str: Route change aborted
L91 str: Request failed
L95 str: Session expired while the user was mid-action
[DEV] L131 str: Route change aborted
```

#### `src/utils/clientSettings.js` (branch: both (identical); 0 strings)
(no user-facing strings)

#### `src/utils/constants.js` (branch: both (identical); 0 strings)
(no user-facing strings)

#### `src/utils/courseClassAssignment.js` (branch: both (identical); 0 strings)
(no user-facing strings)

#### `src/utils/courseListingUtils.js` (branch: both (differs); 18 strings)
used by: LEARNER: learn/courses/index.js | FACULTY: teacher/courses/index.js
```text
L30 return: ${path}?${params.join("&")}
L34 return: id:${course.clsid}
L35 return: legacy:${course?.batchName || ""}:${course?.academicYear || ""}:${course?.sectionName || "Unknown"}
L35 return: Unknown
L63 str: Your class is not configured. Please contact your administrator.
L64 str: Your assigned class is missing. Please contact your administrator.
L65 str: Your class has no batch. Please contact your administrator.
L66 str: Your assigned batch is missing. Please contact your administrator.
L67 str: Your batch has no program. Please contact your administrator.
L68 str: Your assigned program is missing. Please contact your administrator.
L69 str: Your current semester is not configured. Please contact your administrator.
L80 prop:name: Invalid course record ${index + 1}
L86 prop:name: Course identifier missing ${index + 1}
L90 prop:name: Duplicate course mapping ${index + 1}
L105 prop:name: Course name unavailable
L131 prop:name: Invalid teaching assignment ${index + 1}
L136 prop:name: Duplicate or invalid teaching assignment ${index + 1}
L148 prop:name: Course information unavailable
```

#### `src/utils/courseUtils/contentAvailability.js` (branch: lms-dev-2026 only; 3 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js, learn/courses/index.js | FACULTY: teacher/courses/[courseId]/[...courseTab].js, teacher/courses/index.js | COLLEGE: college-admin/courses/[id].js
```text
L50 prop:reason: This item is unavailable.
L66 prop:reason: This item is not currently published for learners.
L80 prop:reason: Complete the required prerequisite to unlock this item.
```

#### `src/utils/courseUtils/contentCompletion.js` (branch: both (identical); 0 strings)
(no user-facing strings)

#### `src/utils/courseUtils/contentOrder.js` (branch: both (identical); 0 strings)
(no user-facing strings)

#### `src/utils/courseUtils/quizContent.js` (branch: both (identical); 1 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js | COLLEGE: college-admin/courses/[id].js
```text
L7 str: Untitled quiz
```

#### `src/utils/courseUtils/syllabusUtils.js` (branch: both (identical); 1 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js | COLLEGE: college-admin/courses/[id].js
```text
L16 new Error: Lesson content id is required
```

#### `src/utils/csvExport.js` (branch: both (identical); 1 strings)
used by: COLLEGE: college-admin/audit.js, college-admin/calendar.js, college-admin/electives.js, college-admin/jobs/[jobId]/interviews.js (+7 more)
```text
L14 return: "${s.replace(/"/g, '""')}"
```

#### `src/utils/dateUtils.js` (branch: both (differs); 0 strings)
(no user-facing strings)

#### `src/utils/downloadAssignmentReportPdf.js` (branch: lms-dev-2026 only; 7 strings)
used by: FACULTY: teacher/report/assignment/[contentId].js
```text
L36 str: Assignment report
L51 prop:label: Submitted
L52 prop:label: Average score
L53 prop:label: On time / Late
L54 prop:label: Total points
L80 str: Not graded
L105 str: Not submitted (${report.notSubmitted.length})
```

#### `src/utils/downloadMonthlyAttendancePdf.js` (branch: lms-dev-2026 only; 8 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js
```text
L40 str: Monthly Attendance Report
L52 prop:label: Students
L53 prop:label: Sessions held
L54 prop:label: Overall attendance
L55 prop:label: Below ${ATTENDANCE_THRESHOLD}%
L78 str: Not marked
L78 str: Attendance %
L109 str: P = Present A = Absent — = Not marked yet × = No class
```

#### `src/utils/downloadQuizReportPdf.js` (branch: lms-dev-2026 only; 10 strings)
used by: FACULTY: teacher/report/quiz/[quizId].js
```text
L45 str: Quiz report
L59 prop:label: Submitted
L60 prop:label: Average score
L61 prop:label: Questions
L62 prop:label: Total points
L85 str: Question accuracy
L89 str: Worst-answered first
L99 str: Not answered yet
L117 str: Student scores
L125 str: Not scored
```

#### `src/utils/driveDescription.js` (branch: lms-dev-2026 only; 1 strings)
used by: LEARNER: learn/my-placements/jobs/[jobId].js, learn/my-placements/jobs/index.js, learn/profile.js | FACULTY: teacher/profile.js | COLLEGE: college-admin/profile.js
```text
L34 str: <p>${escapeHtml(p.trim()).replace(/\r?\n/g, "<br>")}</p>
```

#### `src/utils/errorHandlers.js` (branch: both (identical); 9 strings)
used by: LEARNER: learn/profile.js | FACULTY: teacher/profile.js | COLLEGE: college-admin/profile.js
```text
L44 prop:title: ${accountLabel} Already Exists
L51 text(div): Please login with your existing credentials instead of creating a new account.
L56 prop:okText: Go to Login
L87 str: An unexpected error occurred
L93 prop:title: Registration Failed
L106 str: An error occurred. Please try again.
L127 str: Error updating. Please try again.
L163 prop:title: ${sectionName} Update Failed
L169 text(div): Please correct the issue and try again.
```

#### `src/utils/facultyCourseDetail.js` (branch: both (identical); 7 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js
```text
L6 new Error: Invalid course identifier
L17 new Error: Course not found
L41 new Error: No active teaching assignment for this course
L60 return: ${parts.join("/")}${query ? `?${query}` : ""}
L60 return: ?${query}
L69 return: ${pathname}${query ? `?${query}` : ""}
L69 return: ?${query}
```

#### `src/utils/formErrors.js` (branch: lms-dev-2026 only; 1 strings)
used by: LEARNER: learn/allQuizzes.js, learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/allQuizzes.js, teacher/courses/[courseId]/[...courseTab].js | COLLEGE: college-admin/courses/[id].js
```text
L48 str: The form could not be saved. Please review it and try again.
```

#### `src/utils/helper.js` (branch: both (identical); 2 strings)
used by: LEARNER: learn/calendar.js, learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/calendar.js, teacher/courses/[courseId]/[...courseTab].js | COLLEGE: college-admin/courses/[id].js
```text
L68 return: ${month}/${date}/${year}
L80 new Error: File must smaller than ${sizeInMb}MB!
```

#### `src/utils/icsExport.js` (branch: both (differs); 0 strings)
(no user-facing strings)

#### `src/utils/interviewConflicts.js` (branch: both (differs); 6 strings)
used by: COLLEGE: college-admin/calendar.js, college-admin/jobs/[jobId]/interviews.js
```text
L95 return: ${company}::${name}
L103 return: Conflict
L106 return: Candidate & interviewer conflict
L107 return: Candidate double-booked
L108 return: Interviewer double-booked
L109 return: Conflict
```

#### `src/utils/jobTagUtils.js` (branch: both (differs); 25 strings)
used by: LEARNER: learn/my-placements/jobs/[jobId].js, learn/my-placements/jobs/index.js
```text
L40 return: Today
L41 return: Yesterday
L42 return: ${days} days ago
L43 return: ${Math.floor(days / 7)} weeks ago
L67 prop:text: Full-time
L68 prop:text: Internship
[DEV] L69 str: internship + full-time
[DEV] L69 prop:text: Internship + full-time
[DEV] L70 prop:text: Apprenticeship
L71 prop:text: Part-time
L72 prop:text: Contract
L73 prop:text: Remote
L74 prop:text: Freelance
L78 prop:text: Applied
L79 prop:text: Shortlisted
L80 prop:text: Assessment
L81 prop:text: Interview
L82 prop:text: Offered
L83 prop:text: Hired
L84 prop:text: Rejected
L85 prop:text: Withdrawn
L88 prop:text: Waitlisted
L93 prop:text: Scheduled
L94 prop:text: Confirmed
L95 prop:text: Reschedule requested
```

#### `src/utils/learnerApiUtils.js` (branch: both (identical); 0 strings)
(no user-facing strings)

#### `src/utils/learnerCourseDetail.js` (branch: both (identical); 5 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js
```text
L3 new Error: Invalid course identifier
L6 new Error: Invalid course identifier
L11 new Error: Course request canceled
L14 new Error: Course not found
L27 return: ?${query.join("?")}
```

#### `src/utils/learnerValidation.js` (branch: both (identical); 0 strings)
(no user-facing strings)

#### `src/utils/monthlyAttendanceReport.js` (branch: lms-dev-2026 only; 0 strings)
(no user-facing strings)

#### `src/utils/placementApplicationIdentity.js` (branch: lms-dev-2026 only; 0 strings)
(no user-facing strings)

#### `src/utils/placementDateTime.js` (branch: lms-dev-2026 only; 0 strings)
(no user-facing strings)

#### `src/utils/placementsAppliedLookup.js` (branch: both (identical); 1 strings)
used by: LEARNER: learn/my-placements/jobs/[jobId].js
```text
L12 new Error: We couldn't verify whether you already applied. Check the status before submitting.
```

#### `src/utils/placementsStudentActionPolicy.js` (branch: lms-dev-2026 only; 0 strings)
(no user-facing strings)

#### `src/utils/projectBoardUndo.js` (branch: both (identical); 1 strings)
used by: LEARNER: learn/projects/[projectId].js | MENTOR: mentor/projects/[projectId].js
```text
L24 str: To Do
```

#### `src/utils/projectEditorVersion.js` (branch: both (identical); 1 strings)
used by: LEARNER: learn/projects/[projectId].js | MENTOR: mentor/projects/[projectId].js
```text
L10 new Error: ${label} changed while you were editing it. Refresh and reopen the editor before saving.
```

#### `src/utils/projectErrorModal.jsx` (branch: both (differs); 17 strings)
used by: LEARNER: learn/projects/[projectId].js | MENTOR: mentor/projects/[projectId].js | COLLEGE: college-admin/projects/readiness/index.js, college-admin/projects/workspaces/[workspaceId]/meetings.js, college-admin/projects/workspaces/[workspaceId]/overview.js, college-admin/projects/workspaces/[workspaceId]/resources.js (+8 more)
```text
L14 str: Something went wrong. Please try again.
L20 prop:title: This was updated by someone else
L22 prop:content: Someone else changed this while you were working on it. Refresh the page to see the latest version, then try again.
L23 prop:okText: Refresh
L31 prop:title: Action needs attention
L41 prop:title: You don't have permission to do that
L46 prop:content: Your role doesn't allow this action on this project. If you think that's wrong, check with your mentor or admin.
L54 prop:title: Your session has expired
L56 prop:content: Please sign in again to continue.
L64 prop:title: This item is no longer available
L64 prop:title: Check the details and try again
L74 prop:title: Connection problem
L76 prop:content: We couldn't reach the server. Check your connection and try again.
L84 prop:title: Server error
L86 prop:content: Something went wrong on our end. Please try again in a moment.
L93 prop:title: Couldn't complete that action
L102 str: Couldn't complete that action
```

#### `src/utils/projectListOrdering.js` (branch: both (identical); 0 strings)
(no user-facing strings)

#### `src/utils/projectMeetingTime.js` (branch: both (identical); 0 strings)
(no user-facing strings)

#### `src/utils/projectTeams.js` (branch: lms-dev-2026 only; 0 strings)
(no user-facing strings)

#### `src/utils/quizReport.js` (branch: lms-dev-2026 only; 4 strings)
used by: FACULTY: teacher/report/quiz/[quizId].js
```text
L5 return: Student ${attempt.learnerId}
L5 return: Unknown student
L102 prop:title: Untitled quiz
L113 str: MMM D, YYYY [at] h:mm A
```

#### `src/utils/resourceUploadToR2.js` (branch: both (identical); 5 strings)
used by: LEARNER: learn/courses/[courseId]/[...courseTab].js | FACULTY: teacher/courses/[courseId]/[...courseTab].js | COLLEGE: college-admin/courses/[id].js
```text
L14 new Error: Choose a non-empty Resource file
L16 new Error: Invalid Resource upload folder
L18 new Error: Select a course before uploading a Resource, including class-specific files
L33 new Error: Resource upload authorization did not return a usable URL
L39 new Error: Resource upload failed (HTTP ${result.status})
```

#### `src/utils/resumeUploadUtils.js` (branch: both (identical); 4 strings)
used by: LEARNER: learn/my-placements/jobs/[jobId].js, learn/profile.js | FACULTY: teacher/profile.js | COLLEGE: college-admin/profile.js
```text
L82 str: Invalid file.
L91 str: Resume must be a valid PDF or Word file (.pdf, .doc, .docx). Please check the file is not renamed.
L94 str: Resume must be under ${RESUME_MAX_BYTES / 1024 / 1024} MB.
L113 str: The file does not appear to be a valid PDF. Please upload a genuine PDF file.
```

#### `src/utils/safeHref.js` (branch: lms-dev-2026 only; 0 strings)
(no user-facing strings)

#### `src/utils/scoreDistribution.js` (branch: lms-dev-2026 only; 1 strings)
used by: FACULTY: teacher/report/assignment/[contentId].js, teacher/report/quiz/[quizId].js
```text
L10 prop:label: Below 60%
```

#### `src/utils/uploadToR2.js` (branch: both (identical); 8 strings)
used by: LEARNER: learn/allAssignments.js, learn/courses/[courseId]/[...courseTab].js, learn/my-placements/placement.js, learn/profile.js (+1 more) | FACULTY: teacher/allAssignments.js, teacher/courses/[courseId]/[...courseTab].js, teacher/profile.js | MENTOR: mentor/projects/[projectId].js | COLLEGE: college-admin/courses/[id].js, college-admin/profile.js
```text
L44 return: application/octet-stream
L62 new Error: Invalid file: size must be a positive number
L91 new Error: Backend upload failed: missing publicUrl/key
L97 new Error: Invalid presign response: missing uploadUrl or key
L101 new Error: Invalid presign response: missing publicUrl for non-video upload
L113 new Error: Upload failed: ${putResponse.status} ${putResponse.statusText}${text ? ` - ${text.slice(0, 200)}` : ""}
L113 new Error: - ${text.slice(0, 200)}
L126 new Error: Backend upload failed: missing publicUrl/key
```

#### `src/utils/urlValidation.js` (branch: both (identical); 8 strings)
used by: LEARNER: learn/profile.js | FACULTY: teacher/profile.js | COLLEGE: college-admin/profile.js
```text
L43 prop:message: LinkedIn URL must be from linkedin.com domain
L47 prop:message: GitHub URL must be from github.com domain
L51 prop:message: Twitter URL must be from twitter.com or x.com domain
L55 prop:message: Google Scholar URL must be from scholar.google.com domain
L59 prop:message: ResearchGate URL must be from researchgate.net domain
L81 prop:message: Please enter a valid URL (must start with http:// or https://)
L112 prop:message: Invalid URL format
L127 prop:message: Please enter a valid URL (must start with http:// or https://)
```

#### `src/utils/youtubeLink.js` (branch: lms-dev-2026 only; 0 strings)
(no user-facing strings)

## 5. Notes
- Files in section 4: 240. Shell files in section 2: 24.
- Dashboard/course/* "tab" components and superadmin/sections/* components are included in section 4 (they are the real UI of faculty/learner course tabs and the college-admin pages).
