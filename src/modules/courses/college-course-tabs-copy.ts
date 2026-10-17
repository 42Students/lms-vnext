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
