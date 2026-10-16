/** Exact legacy wording of Courses.js and FacultyAssignment.js (lms-dev-2026): COL-courses-content-06/-13/-15. */
export const COLLEGE_COURSES_COPY = {
  createTitle: "Create New Course",
  existingTitle: "Existing Courses",
  departmentLabel: "Department",
  nameLabel: "Course Name",
  namePlaceholder: "e.g., Data Structures and Algorithms",
  studentsSeeIt: "Students see it",
  visible: "Visible",
  hidden: "Hidden",
  createFailed: "Course was not created",
  deleteFailed: "Course was not deleted",
  retry: "Retry",
  createdMessage: (name: string) => `Created course “${name}”. Next, add lessons and map it to the right semester.`,
} as const;

export const FACULTY_ASSIGNMENT_ROLE_LABELS: Readonly<Record<string, string>> = {
  PRIMARY: "Primary Instructor",
  CO_TEACHER: "Co-Teacher",
  TA: "Teaching Assistant",
  TEACHING_ASSISTANT: "Teaching Assistant",
};

export function facultyAssignmentRoleLabel(role: string) {
  return FACULTY_ASSIGNMENT_ROLE_LABELS[role] ?? role;
}

export function courseVisibleToStudentsLabel(status: string) {
  return status === "ACTIVE" ? COLLEGE_COURSES_COPY.visible : COLLEGE_COURSES_COPY.hidden;
}

export const FACULTY_ASSIGNMENT_COPY = {
  title: "Faculty Assignments",
  description:
    "Connect faculty to the right class, course, semester and teaching role. Account status and profile changes stay on the Faculty roster.",
  createTitle: "Create teaching assignment",
  createFailed: "Teaching assignment was not created",
  roleLabel: "Role",
  columns: { faculty: "Faculty", course: "Course", class: "Class", role: "Role", active: "Active", actions: "Actions" },
  yes: "Yes",
  no: "No",
} as const;
