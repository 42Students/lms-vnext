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

/** Legacy bookmarks can contain a numeric mapping/course ID or a slug.
 * Only the persisted, faculty-scoped resolver may convert them to a UUID.
 * `ref=course` explicitly requests course-identity resolution; the route
 * must not guess a delivery when multiple sections teach that course. */
export function legacyFacultyCourseRouteIntent(
 rawCourse:string,query:Readonly<Record<string,string|string[]|undefined>>,
):{course:string;classHint:string|null;preferCourse:boolean}|null{
 const course=rawCourse.trim();
 if(!course||course.length>160||!/^[A-Za-z0-9_-]+$/.test(course))return null;
 const ref=typeof query["ref"]==="string"?query["ref"]:null;
 const classHint=typeof query["cls"]==="string"?query["cls"]:null;
 if(classHint&&(!/^[A-Za-z0-9_-]+$/.test(classHint)||classHint.length>160))return null;
 return {course,classHint,preferCourse:ref==="course"};
}
