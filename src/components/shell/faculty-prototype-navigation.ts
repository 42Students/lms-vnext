import type { ShellNavItem } from "./shell-model";

/** The four primary destinations in the newest Faculty prototype.
 * Detailed grading, reports, class discussions and profile remain reachable
 * through their feature pages and the header. */
export const FACULTY_PROTOTYPE_NAV: readonly ShellNavItem[] = [
  {label:"Today",href:"/teacher",shortLabel:"T"},
  {label:"Courses",href:"/teacher/courses",shortLabel:"C"},
  {label:"Assignments & quizzes",href:"/teacher/assessments",shortLabel:"A"},
  {label:"Class schedule",href:"/teacher/calendar",shortLabel:"S"},
];

export function facultyPrototypeSidebarActive(pathname:string,href:string):boolean {
  if(href==="/teacher") return pathname==="/teacher";
  if(href==="/teacher/courses") return pathname.startsWith("/teacher/courses/");
  if(href==="/teacher/assessments") return pathname==="/teacher/assessments" ||
    pathname.startsWith("/teacher/allAssignments") ||
    pathname.startsWith("/teacher/allQuizzes") ||
    pathname.startsWith("/teacher/report/") ||
    pathname.startsWith("/teacher/results");
  return pathname===href || pathname.startsWith(href+"/");
}
