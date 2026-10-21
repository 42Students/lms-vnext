/** Resolve old numeric teaching-assignment links and newer explicitly typed course-ID links. */
export async function resolveNumericFacultyCourse({
  identifier, facultyId, preferCourseId = false, getMapping, getCourse,
}) {
  const id = Number(identifier);
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error("Invalid course identifier");
  if (!preferCourseId) {
    const mapping = await getMapping({ mappingId: id }).catch(() => null);
    if (mapping?.course?.id != null && mapping?.facultyId != null &&
        Number(mapping.facultyId) === Number(facultyId)) {
      return { source: "mapping", course: mapping.course, classId: mapping.classId ?? null };
    }
  }
  const response = await getCourse({ courseId: id });
  const course = response?.data?.data ?? response?.data;
  if (!course || typeof course !== "object" || course.id == null) {
    throw new Error("Course not found");
  }
  return { source: "course", course, classId: null };
}

/** Only active classes actually assigned to this faculty and this course may become page context. */
export function resolveFacultyCourseClass({
  assignments, course, facultyId, requestedClassId, existingClassId, preferredClassId,
}) {
  const classes = new Map();
  (Array.isArray(assignments) ? assignments : []).forEach((assignment) => {
    if (assignment?.is_active === false ||
        Number(assignment?.faculty_id) !== Number(facultyId) ||
        Number(assignment?.course_id) !== Number(course?.id) ||
        assignment?.class_id == null) return;
    const id = Number(assignment.class_id);
    if (!Number.isSafeInteger(id) || id <= 0) return;
    if (!classes.has(id)) classes.set(id, {
      classId: id, className: assignment.class_name || `Class ${id}`,
    });
  });
  const options = [...classes.values()].sort((a, b) => a.classId - b.classId);
  // Course overview may be separately browsable under college policy, but the Faculty
  // class-scoped workspace must never render without an active teaching assignment.
  if (options.length === 0) throw new Error("No active teaching assignment for this course");
  const find = (id) => options.find((option) => option.classId === Number(id));
  return {
    options,
    selected: find(requestedClassId) || find(preferredClassId) ||
      find(existingClassId) || options[0],
  };
}

export function canonicalCourseHref(asPath, oldIdentifier, slug) {
  if (!slug) return null;
  const [pathname, rawSearch = ""] = String(asPath).split("?");
  const parts = pathname.split("/");
  const index = parts.indexOf(String(oldIdentifier));
  if (index === -1) return null;
  parts[index] = encodeURIComponent(String(slug));
  const params = new URLSearchParams(rawSearch);
  params.delete("ref");
  const query = params.toString();
  return `${parts.join("/")}${query ? `?${query}` : ""}`;
}

export function canonicalClassHref(asPath, classId) {
  const [pathname, rawSearch = ""] = String(asPath).split("?");
  const params = new URLSearchParams(rawSearch);
  if (classId == null) params.delete("cls");
  else params.set("cls", String(classId));
  const query = params.toString();
  return `${pathname}${query ? `?${query}` : ""}`;
}
