import { z } from "zod";

const querySchema = z.string().trim().transform((value) => value.slice(0, 100)).catch("");
export function learnerCourseMatchesSearch(
  row: { course: { courseName: string; courseCode: string; programName: string; sectionName: string; cohortName?:string; academicPeriodName: string; periodStartDate?:string; periodEndDate?:string }; instructorNames: readonly string[] },
  rawQuery: unknown,
): boolean {
  const needle = querySchema.parse(rawQuery).toLocaleLowerCase("en-IN");
  if (!needle) return true;
  return [
    row.course.courseName, row.course.courseCode, row.course.programName,
    row.course.sectionName, row.course.cohortName??"", row.course.academicPeriodName,
    row.course.periodStartDate?.slice(0,4)??"",row.course.periodEndDate?.slice(0,4)??"",
    ...row.instructorNames,
  ].some(value => value.toLocaleLowerCase("en-IN").includes(needle));
}
