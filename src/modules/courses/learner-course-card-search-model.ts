import { z } from "zod";

const querySchema = z.string().trim().transform((value) => value.slice(0, 100)).catch("");
export function learnerCourseMatchesSearch(
  row: { course: { courseName: string; courseCode: string; programName: string; sectionName: string; academicPeriodName: string }; instructorNames: readonly string[] },
  rawQuery: unknown,
): boolean {
  const needle = querySchema.parse(rawQuery).toLocaleLowerCase("en-IN");
  if (!needle) return true;
  return [
    row.course.courseName, row.course.courseCode, row.course.programName,
    row.course.sectionName, row.course.academicPeriodName, ...row.instructorNames,
  ].some(value => value.toLocaleLowerCase("en-IN").includes(needle));
}
