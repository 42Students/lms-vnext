import {z} from "zod";
export const facultyCourseTabs = [
  { path: "home", label: "Overview" },
  { path: "blueprint", label: "Blueprint" },
  { path: "students", label: "Students" },
  { path: "attendanceDetail", label: "Attendance" },
  { path: "discussions", label: "Discussions" },
] as const;

export type FacultyCourseTab = (typeof facultyCourseTabs)[number]["path"];

export function isFacultyCourseTab(value: string): value is FacultyCourseTab {
  return facultyCourseTabs.some((tab) => tab.path === value);
}

export function facultyCourseTabHref(deliveryId: string, tab: FacultyCourseTab) {
  return "/teacher/courses/" + encodeURIComponent(deliveryId) + "/" + tab;
}

/** Unknown and nested legacy deep links are canonicalized to Overview. */
export function facultyCourseTabFromPath(pathname: string): FacultyCourseTab {
  const segment = pathname.split("/").filter(Boolean).at(-1) ?? "";
  return isFacultyCourseTab(segment) ? segment : "home";
}

export function validFacultyDefaultDeliveryId(raw:unknown):raw is string {
 return z.string().uuid().safeParse(raw).success;
}
