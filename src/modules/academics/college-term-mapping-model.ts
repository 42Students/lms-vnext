import { z } from "zod";

export const collegeTermCourseAddSchema = z.object({
  programTermId: z.string().uuid(),
  courseId: z.string().uuid(),
  type: z.enum(["CORE", "ELECTIVE"]),
  credits: z.number().int().min(1).max(10),
}).strict();
export const collegeTermCourseUpdateSchema = z.object({
  credits: z.number().int().min(1).max(10),
  position: z.number().int().min(1).max(100000),
}).strict();

/** 1-indexed reordering contract shared by the service and regression tests. */
export function reorderTermCourseIds(ids: readonly string[], movingId: string, position: number) {
  if (!ids.includes(movingId) || position < 1 || position > ids.length || !Number.isInteger(position)) {
    throw new Error("TERM_COURSE_POSITION_INVALID");
  }
  const next = ids.filter(id => id !== movingId);
  next.splice(position - 1, 0, movingId);
  return next;
}

export const collegeTermCourseUnmapSchema = z.object({ confirm: z.literal(true) }).strict();
export const collegeTermCourseIdSchema = z.string().uuid();

export function nextTermCourseOrder(orders: readonly number[]) {
  return Math.max(0, ...orders) + 1;
}

export function collegeTermMappingErrorMessage(code: string) {
  switch (code) {
    case "TERM_NOT_FOUND": return "The selected semester is unavailable in your college.";
    case "COURSE_NOT_FOUND": return "The selected course is unavailable in your college.";
    case "TERM_COURSE_DUPLICATE": return "This course is already mapped to the selected semester.";
    case "TERM_COURSE_IN_USE": return "A current active batch offering is using this semester-course mapping.";
    case "TERM_COURSE_NOT_FOUND": return "This semester-course mapping is not available.";
    case "TERM_COURSE_POSITION_INVALID": return "Choose a position within this semester course list.";
    default: return "Mapping update was not saved. Refresh and review the values.";
  }
}

/** Exact legacy wording of SemesterCourseMapping.js (COL-academic-setup-11). */
export const TERM_MAPPING_COPY = {
  addButton: "Add Courses to Semester",
  removeButton: "Remove",
  courseTypeLabel: "Course Type",
  core: "Core (Mandatory)",
  elective: "Elective",
  columns: { semester: "Semester", courseName: "Course Name", courseCode: "Course Code", type: "Type", credits: "Credits", actions: "Actions" },
  removeTitle: (course: string) => `Remove “${course}” from this semester?`,
  addedMessage: (count: number) => `Added ${count} course(s) to this semester.`,
  removedMessage: (course: string) => `Removed “${course}” from this semester.`,
} as const;
