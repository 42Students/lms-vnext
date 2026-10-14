import { z } from "zod";

export const collegeTermCourseAddSchema = z.object({
  programTermId: z.string().uuid(),
  courseId: z.string().uuid(),
  type: z.enum(["CORE", "ELECTIVE"]),
  credits: z.number().int().min(0).max(30).nullable(),
}).strict();
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
    default: return "Mapping update was not saved. Refresh and review the values.";
  }
}
