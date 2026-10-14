export type FacultyAssessmentFilterQuery = {
  deliveryId?: string;
  status?: string;
  search?: string;
};

/** Client-side search only over server-authorized Faculty teaching data.
 * The backend has already enforced membership and exact delivery scope. */
export function filterFacultyAssessments<T extends {
  deliveryId: string;
  status: string;
  title: string;
  description: string | null;
  courseName: string;
  courseCode: string;
  sectionName: string;
  lessonName: string;
}>(
  items: readonly T[],
  query: FacultyAssessmentFilterQuery,
): T[] {
  const term = (query.search ?? "").trim().toLocaleLowerCase();
  return items.filter((item) => {
    if (query.deliveryId && item.deliveryId !== query.deliveryId) return false;
    if (query.status && item.status !== query.status) return false;
    if (!term) return true;
    const searchable = [
      item.title, item.description, item.courseCode,
      item.courseName, item.sectionName, item.lessonName,
    ].filter(Boolean).join(" ").toLocaleLowerCase();
    return searchable.includes(term);
  });
}
