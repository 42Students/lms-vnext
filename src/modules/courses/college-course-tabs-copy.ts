/** Exact legacy wording for College Admin course tabs (COL-course-tabs-20, COL-course-tabs-21). */
export const COLLEGE_COURSE_TAB_COPY = {
  lessonsTitle: "Lessons",
  videosTitle: "Videos",
  progressTitle: "Course Progress",
  progressDescription:
    "See measured completion for a class and course, then focus on the students furthest behind.",
  lessonColumns: { name: "Lesson Name", course: "Course", order: "Order", studentsSeeIt: "Students see it" },
  assessmentColumns: { course: "Course", audience: "Audience", results: "Results" },
  visible: "Visible",
  hidden: "Hidden",
  resultsReleased: "Released",
  resultsWithheld: "Withheld",
  audienceShared: "All sections taking this course",
  audienceOneSection: "One section",
} as const;

/** Students see a lesson only when both its learning path and the lesson are published. */
export function collegeLessonVisibilityLabel(item: { pathStatus: string; status: string; visibleToStudents: boolean }) {
  return item.pathStatus === "PUBLISHED" && item.status === "ACTIVE" && item.visibleToStudents
    ? COLLEGE_COURSE_TAB_COPY.visible : COLLEGE_COURSE_TAB_COPY.hidden;
}

export function collegeAudienceLabel(deliverySpecific: boolean) {
  return deliverySpecific ? COLLEGE_COURSE_TAB_COPY.audienceOneSection : COLLEGE_COURSE_TAB_COPY.audienceShared;
}

export function collegeResultsLabel(resultsPublished: boolean) {
  return resultsPublished ? COLLEGE_COURSE_TAB_COPY.resultsReleased : COLLEGE_COURSE_TAB_COPY.resultsWithheld;
}

/** `PUBLISHED` becomes `Published`; raw enum words are not shown to admins. */
export function collegeStatusLabel(status: string) {
  const lower = status.toLowerCase().replaceAll("_", " ");
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export type CollegeCourseTab =
  | "lessons" | "videos" | "resources" | "live-classes"
  | "assignments" | "quizzes" | "course-progress";

/** COL-course-tabs-22: legacy Alert shown when the admin has no college. */
export const COLLEGE_NOT_ASSIGNED_TITLE = "Admin not assigned to a college";
export const COLLEGE_NOT_ASSIGNED_DESCRIPTION: Record<CollegeCourseTab, string> = {
  lessons: "You must be assigned to a college to view and manage lessons. Contact your administrator.",
  videos: "You must be assigned to a college to view and manage lesson content. Contact your administrator.",
  resources: "You must be assigned to a college to view and manage lesson content. Contact your administrator.",
  "live-classes": "You must be assigned to a college to view and manage lesson content. Contact your administrator.",
  assignments: "You must be assigned to a college to view assignments. Contact your administrator.",
  quizzes: "You must be assigned to a college to manage quizzes. Contact your administrator.",
  "course-progress": "You must be assigned to a college to view course progress. Contact your administrator.",
};

/** COL-course-tabs-23: named load-failure alerts (legacy wording) shown with Retry. */
export const COLLEGE_TAB_LOAD_ERROR_TITLE: Record<CollegeCourseTab, string> = {
  lessons: "Could not load lessons",
  videos: "Lesson content could not be loaded",
  resources: "Resources could not be loaded",
  "live-classes": "Lesson content could not be loaded",
  assignments: "Assignments could not be loaded",
  quizzes: "Quizzes could not be loaded",
  "course-progress": "Could not load course progress.",
};

/** Shown above a list when only the authoring options failed to load. */
export const COLLEGE_AUTHORING_OPTIONS_ERROR: Record<CollegeCourseTab, string> = {
  lessons: "Courses could not be loaded",
  videos: "Courses could not be loaded",
  resources: "Courses could not be loaded",
  "live-classes": "Courses could not be loaded",
  assignments: "Course list unavailable",
  quizzes: "Quiz setup options could not be loaded",
  "course-progress": "Some course-progress filters could not be loaded.",
};
