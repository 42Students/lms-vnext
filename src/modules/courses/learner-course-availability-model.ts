/** Learner course cards must not act as navigation when the course cannot open.
 * Keep the legacy locked/inactive/past-semester distinctions in one place
 * so badges, assistive technology, and action visibility agree. */
export type LearnerCourseAvailability = {
  readOnly: boolean;
  course: {
    courseEnabled?: boolean;
    courseAllowedForDisplay?: number | null;
    courseStatus?: string;
  };
};

export function learnerCourseUnavailableReason(row: LearnerCourseAvailability): string | null {
  if (row.course.courseEnabled === false || row.course.courseAllowedForDisplay === 0) {
    return "Content locked: not visible to students";
  }
  if (row.course.courseStatus && row.course.courseStatus !== "ACTIVE") {
    return "Course inactive: shown for reference";
  }
  if (row.readOnly) {
    return "Not your current semester: shown for reference";
  }
  return null;
}
