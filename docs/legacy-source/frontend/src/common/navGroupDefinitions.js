// Shared college-admin / superadmin navigation taxonomy. Paths remain role-relative.
export const SHARED_GROUP_DEFINITIONS = {
  academic: {
    title: "Academic Setup",
    items: [
      { path: "departments", label: "Departments" },
      { path: "programs", label: "Programs" },
      { path: "semesters", label: "Semesters" },
      { path: "semester-courses", label: "Semester–Course Mapping" },
      { path: "batches", label: "Batches" },
      { path: "classes", label: "Classes" },
      { path: "batch-promotion", label: "Batch Promotion" },
      { path: "lecture-halls", label: "Lecture Halls" },
      { path: "electives", label: "Electives" },
      { path: "attendance", label: "Attendance" },
    ],
  },
  content: {
    title: "Courses & Content",
    items: [
      { path: "courses", label: "Courses" },
      { path: "lessons", label: "Lessons" },
      { path: "lesson-content", label: "Video", query: { type: "video" } },
      { path: "lesson-content", label: "Resources", query: { type: "resources" } },
      { path: "lesson-content", label: "Live Classes", query: { type: "live-classes" } },
      { path: "assignments", label: "Assignments" },
      { path: "quizzes", label: "Quizzes" },
      { path: "course-progress", label: "Progress" },
    ],
  },
  people: {
    title: "People",
    items: [
      { path: "teachers", label: "Faculty" },
      { path: "faculty-assignment", label: "Faculty Assignment" },
      { path: "students", label: "Students" },
      { path: "people", label: "People Directory" },
    ],
  },
  placements: {
    title: "Placements",
    items: [
      { path: "jobs", label: "Drives" },
      { path: "companies", label: "Companies" },
      { path: "calendar", label: "Interviews" },
      { path: "hiring-dashboard", label: "Analytics" },
    ],
  },
};

// Projects are intentionally role-specific: super admins author templates; college admins run workspaces.
export function buildPathToGroup(groupsObj) {
  return Object.entries(groupsObj).reduce((acc, [groupKey, group]) => {
    group.items.forEach((item) => {
      if (item.path in acc && acc[item.path] !== groupKey && process.env.NODE_ENV !== "production") {
        console.warn(`[nav] "${item.path}" is listed in both "${acc[item.path]}" and "${groupKey}"; the first wins.`);
      }
      if (!(item.path in acc)) acc[item.path] = groupKey;
      const [firstSegment] = item.path.split("/");
      if (firstSegment && !(firstSegment in acc)) acc[firstSegment] = groupKey;
    });
    return acc;
  }, {});
}

export function buildGroupDefaultPath(groupsObj) {
  return (groupKey) => groupsObj[groupKey]?.items?.[0]?.path;
}
