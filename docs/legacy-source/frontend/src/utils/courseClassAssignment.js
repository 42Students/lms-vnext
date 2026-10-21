export function normalizeCourseClassId(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getCourseClassAssignments(course = {}) {
  return Array.isArray(course?.courseClassAssignments) ? course.courseClassAssignments : [];
}

export function resolveCourseClassAssignment({
  loginClassId,
  assignments = [],
  selectedClass = null,
  preferFirstAssignment = false,
} = {}) {
  const normalizedAssignments = (Array.isArray(assignments) ? assignments : [])
    .map((assignment) => ({
      ...assignment,
      classId: normalizeCourseClassId(assignment?.classId ?? assignment?.id),
    }))
    .filter((assignment) => assignment.classId != null);

  const selectedClassId = normalizeCourseClassId(selectedClass?.classId ?? selectedClass?.id ?? selectedClass);
  const currentClassId = normalizeCourseClassId(loginClassId);

  if (selectedClassId != null) {
    const selectedMatch = normalizedAssignments.find((assignment) => assignment.classId === selectedClassId);
    if (selectedMatch) return selectedMatch;
  }

  if (currentClassId != null) {
    const currentMatch = normalizedAssignments.find((assignment) => assignment.classId === currentClassId);
    if (currentMatch) return currentMatch;

    if (normalizedAssignments.length === 0) {
      return {
        classId: currentClassId,
        className: selectedClass?.className ?? `Class ${currentClassId}`,
      };
    }
  }

  if (normalizedAssignments.length === 1) {
    return normalizedAssignments[0];
  }

  if (preferFirstAssignment && normalizedAssignments.length > 0) {
    return normalizedAssignments[0];
  }

  return null;
}
