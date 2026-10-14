import { z } from "zod";
import {parseFacultyContactsQuery} from "./faculty-contacts-filter-model";
import {CoursesServiceError} from "./errors";

export const facultyContactDetailParamsSchema = z.object({
  contactsTab: z.enum(["allContacts", "teachers", "students"]),
  membershipId: z.string().uuid(),
}).strict();

export function facultyContactRoleLabel(role: string) {
  if (role === "LEARNER") return "Student";
  if (role === "COLLEGE_ADMIN") return "College Admin";
  return role.toLowerCase().split("_")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

export function facultyContactTabMatches(
  tab: z.infer<typeof facultyContactDetailParamsSchema>["contactsTab"],
  roles: readonly string[],
) {
  if (tab === "teachers") return roles.includes("FACULTY");
  if (tab === "students") return roles.includes("LEARNER");
  return true;
}

export function facultyContactDetailHref(tab: string, membershipId: string) {
  return "/teacher/contacts/" + encodeURIComponent(tab) +
    "/" + encodeURIComponent(membershipId);
}

/** An unavailable or foreign directory member should never disclose presence. */
export function facultyContactDetailHidden(error:unknown):boolean {
 return error instanceof CoursesServiceError &&
  ["MEMBERSHIP_NOT_FOUND","FACULTY_TEACHING_SCOPE_REQUIRED"].includes(error.code);
}

/** Preserve only validated public-directory search state in detail navigation. */
export function facultyContactDirectoryQuery(raw:unknown):string {
 const valid=parseFacultyContactsQuery(raw);
 if(!valid)return "";
 const params=new URLSearchParams();
 if(valid.search)params.set("q",valid.search);
 if(valid.page>1)params.set("page",String(valid.page));
 if(valid.pageSize!==10)params.set("pageSize",String(valid.pageSize));
 return params.size?"?"+params.toString():"";
}
