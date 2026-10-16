/** Exact report-field options from lms2-fe/prod-2026 src/data/bugTrackerData.js. */
export type TrackerLocationOption = { value: string; label: string; children?: TrackerLocationOption[] };

export const REPORTER_OPTIONS = [
  { value: "Akhila", label: "Akhila" },
  { value: "Himaja", label: "Himaja" },
  { value: "Mounika", label: "Mounika" },
  { value: "Sadwik", label: "Sadwik" },
  { value: "Phanindra", label: "Phanindra" },
];

export const ACCOUNT_OPTIONS = [
  { value: "LEARNER", label: "Learner / Student" },
  { value: "FACULTY", label: "Faculty / Teacher" },
  { value: "MENTOR", label: "Mentor" },
  { value: "COLLEGE_ADMIN", label: "College Admin" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "NOT_SURE", label: "Not Sure" },
];

export const ENVIRONMENT_OPTIONS = [
  { value: "LOCAL", label: "Local" },
  { value: "DEVELOPMENT", label: "Development" },
  { value: "UAT", label: "UAT" },
  { value: "PRODUCTION", label: "Production" },
  { value: "OTHER", label: "Other" },
  { value: "NOT_SURE", label: "Not Sure" },
];

export const ISSUE_TYPE_OPTIONS = [
  "Not Working", "Blank Page", "Page Not Loading", "Loading Forever", "Slow Loading",
  "Wrong Data", "Data Missing", "Data Not Saving", "Data Not Updating", "Duplicate Data",
  "Deleted Data Still Showing", "Wrong Count", "API Error", "Server Error / 500",
  "Permission / Access Issue", "Wrong Account Data", "Cross-Account / Role Issue",
  "Login / OTP Issue", "Button Issue", "Dropdown Issue", "Form Issue", "Validation Issue",
  "Search Issue", "Filter Issue", "Pagination Issue", "Navigation Issue", "Upload Issue",
  "Download Issue", "Video / File Issue", "Notification Issue", "UI / Alignment",
  "Responsive / Mobile", "Text / Spelling", "Incorrect Message", "Unexpected Behaviour",
  "Crash / Error", "Other",
].map((label) => ({ value: label, label }));

export const SEVERITY_OPTIONS = [
  { value: "BLOCKER", label: "Blocker" },
  { value: "CRITICAL", label: "Critical" },
  { value: "MAJOR", label: "Major" },
  { value: "MINOR", label: "Minor" },
  { value: "UI_ONLY", label: "UI Only" },
  { value: "SUGGESTION", label: "Suggestion" },
  { value: "NOT_SURE", label: "Not Sure" },
];

export const STATUS_OPTIONS = [
  { value: "NEW", label: "New" },
  { value: "CHECKING", label: "Checking" },
  { value: "FIXING", label: "Fixing" },
  { value: "READY_FOR_RETEST", label: "Ready for Retest" },
  { value: "CLOSED", label: "Closed" },
];

export const RESOLUTION_OPTIONS = [
  { value: "FIXED", label: "Fixed" },
  { value: "DUPLICATE", label: "Duplicate" },
  { value: "NOT_A_BUG", label: "Not a Bug" },
  { value: "CANNOT_REPRODUCE", label: "Cannot Reproduce" },
  { value: "WONT_FIX", label: "Won't Fix" },
];

export const AFFECTED_LAYER_OPTIONS = [
  { value: "FRONTEND", label: "Frontend" },
  { value: "BACKEND", label: "Backend" },
  { value: "BOTH", label: "Frontend + Backend" },
  { value: "UNKNOWN", label: "Not Sure Yet" },
];

export const REGRESSION_TEST_OPTIONS = [
  { value: "NOT_REVIEWED", label: "Not Reviewed" },
  { value: "NOT_REQUIRED", label: "Not Required" },
  { value: "PLANNED", label: "Planned" },
  { value: "ADDED", label: "Added" },
];

const leaf = (value: string): TrackerLocationOption => ({ value, label: value });
const branch = (value: string, children: (string | TrackerLocationOption)[]): TrackerLocationOption => ({ value, label: value, children: children.map((item) =>
  typeof item === "string" ? leaf(item) : item
)});

export const LOCATION_OPTIONS = [
  branch("Login / Authentication", ["Login / OTP", "Account Selection", "Session / Logout", "Other"]),
  branch("Dashboard", ["Overview", "Cards / Metrics", "Navigation", "Other"]),
  branch("Courses", [
    branch("List / Overview", ["Course Card", "Search / Filter", "Pagination", "Other"]),
    branch("Course Details", ["Overview", "Navigation", "Content", "Other"]),
    branch("Learning Path", ["Lesson Dropdown", "Lesson Content", "Progress", "Resource / File", "Other"]),
    branch("Lesson", ["Lesson Details", "Lesson Content", "Resource / File", "Video", "Other"]),
    branch("Course Progress", ["Progress Table", "Counts / Metrics", "Other"]),
  ]),
  branch("Assignments", [
    branch("List / Overview", ["Assignment Card", "Search / Filter", "Other"]),
    branch("Assignment Details", ["Instructions", "Submission", "Files", "Status", "Other"]),
    branch("Create / Edit", ["Form", "Validation", "Attachments", "Other"]),
  ]),
  branch("Quizzes / Exams", [
    branch("List / Overview", ["Quiz Card", "Search / Filter", "Other"]),
    branch("Exam / Attempt", ["Question", "Answer / Option", "Code Editor", "Timer", "Proctoring", "Navigation", "Other"]),
    branch("Results", ["Score", "Question Review", "Other"]),
  ]),
  branch("Attendance", [
    branch("Attendance View", ["Calendar / Date", "Table", "Status", "Counts", "Other"]),
    branch("Mark Attendance", ["Student List", "Status", "Save", "Other"]),
  ]),
  branch("Calendar / Class Schedule", [
    branch("Calendar View", ["Event", "Date / Time", "Navigation", "Other"]),
    branch("Class Schedule", ["Schedule Card", "Create / Edit", "Lecture Hall", "Other"]),
  ]),
  branch("Projects", [
    branch("Templates", ["List", "Template Details", "Create / Edit", "Lifecycle", "Other"]),
    branch("Workspaces", ["List", "Workspace Details", "Members", "Other"]),
    branch("Project Details", ["Overview", "Sprints", "Tasks", "Resources", "Meetings", "Activity", "Other"]),
    branch("Submissions", ["Submission Details", "Files", "Status", "Other"]),
  ]),
  branch("Placements", [
    branch("Jobs", ["Jobs List", "Job Details", "Create / Edit", "Other"]),
    branch("Applications", ["Applications List", "Application Details", "Status", "Other"]),
    branch("Interviews", ["Interview Details", "Feedback", "Status", "Other"]),
    branch("Hiring Dashboard", ["Metrics", "Table", "Filter", "Other"]),
    branch("Companies", ["Companies List", "Company Details", "Other"]),
  ]),
  branch("People", [
    branch("Students", ["List", "Student Details", "Create / Edit", "Bulk Import", "Other"]),
    branch("Faculty / Teachers", ["List", "Faculty Details", "Create / Edit", "Course Mapping", "Other"]),
    branch("People Directory", ["List", "Search / Filter", "Other"]),
  ]),
  branch("Academic Setup", [
    branch("Departments", ["List", "Create / Edit", "Other"]),
    branch("Programs", ["List", "Create / Edit", "Program Structure", "Other"]),
    branch("Batches", ["List", "Create / Edit", "Promotion", "Other"]),
    branch("Classes", ["List", "Create / Edit", "Other"]),
    branch("Semesters", ["List", "Create / Edit", "Other"]),
    branch("Semester Courses", ["List", "Mapping", "Other"]),
    branch("Faculty Assignment", ["List", "Assignment", "Other"]),
    branch("Lecture Halls", ["List", "Create / Edit", "Other"]),
  ]),
  branch("Notifications", ["Notifications List", "Notification Details", "Read / Unread", "Other"]),
  branch("Profile", ["Profile View", "Edit Profile", "Files / Resume", "Other"]),
  branch("Settings", [
    branch("General Settings", ["Form", "Save", "Other"]),
    branch("Module Access", ["Module List", "Permissions", "Other"]),
    branch("Tenants", ["Tenant List", "Tenant Details", "Domain / Branding", "Other"]),
  ]),
  branch("Audit", ["Activity Log", "Search / Filter", "Details", "Other"]),
  branch("Other", ["Other"]),
];

