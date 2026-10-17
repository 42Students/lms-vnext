import { z } from "zod";
import { COLLEGE_ADMIN_SETUP_PHASES } from "./admin-dashboard-navigation";

export const collegeSetupChecklistQuerySchema = z.object({}).strict();

export type CollegeSetupStepKey = (typeof COLLEGE_ADMIN_SETUP_PHASES)[number]["steps"][number]["key"];

export type CollegeSetupEvidence = {
  key: string;
  count: number;
};

export const COLLEGE_SETUP_DEEP_LINKS: Readonly<Record<string, string>> = {
  departments: "/college/departments",
  "course-list": "/college/courses",
  lessons: "/college/lessons",
  "lesson-content": "/college/videos",
  programs: "/college/programs",
  semesters: "/college/semesters",
  "semester-courses": "/college/semester-courses",
  "academic-periods": "/college/academics",
  batches: "/college/batches",
  classes: "/college/classes",
  faculty: "/college/faculty",
  "faculty-assignment": "/college/faculty-assignment",
  students: "/college/students",
  "lecture-halls": "/college/lecture-halls",
  jobs: "/college/placements",
};

export function collegeChecklistProjection(
  counts: Readonly<Record<string, number>>,
) {
  return COLLEGE_ADMIN_SETUP_PHASES.map(phase => ({
    title: phase.title,
    steps: phase.steps.map(step => {
      const count = counts[step.key];
      if (count === undefined || !Number.isSafeInteger(count) || count < 0)
        throw new Error("SETUP_COUNT_UNAVAILABLE:" + step.key);
      return {
        key: step.key,
        label: step.label,
        count,
        hasRecords: count > 0,
        href: COLLEGE_SETUP_DEEP_LINKS[step.key] ?? null,
      };
    }),
  }));
}
