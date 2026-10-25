import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(name:string)=>readFileSync(join(process.cwd(),"src/app/(authenticated)",name,"page.tsx"),"utf8");
describe("UX teacher rollout first ten route source contracts",()=>{
 it("UX-teacher-allAssignments-01 keeps PageHeader title and assessment overview unchanged",()=>{const page=read("teacher/allAssignments"); expect(page).not.toContain("text-[#"); expect(page).not.toContain("min-h-10"); expect(page).toContain("min-w-0"); });
 it("UX-teacher-allQuizzes-01 keeps initialQuizId deep link unchanged",()=>{const page=read("teacher/allQuizzes"); expect(page).not.toContain("text-[#"); expect(page).not.toContain("min-h-10"); expect(page).toContain("min-w-0"); });
 it("UX-teacher-calendar-01 presents the newest Faculty timetable with the full schedule retained",()=>{const page=read("teacher/calendar"); expect(page).toContain("FacultyPrototypeSchedule"); expect(page).toContain("Advanced schedule and full calendar"); expect(page).toContain("min-w-0"); });
 it("UX-teacher-contacts-01 keeps redirect to /teacher/contacts/allContacts retained",()=>{const page=read("teacher/contacts"); expect(page).toContain('redirect("/teacher/contacts/allContacts")'); });
 it("UX-teacher-contacts-contactsTab-01 keeps search and role filters unchanged",()=>{const page=read("teacher/contacts/[contactsTab]"); expect(page).not.toContain("text-[#"); expect(page).not.toContain("min-h-10"); expect(page).toContain("min-w-0"); });
 it("UX-teacher-contacts-contactsTab-membershipId-01 keeps contact privacy and directory return query unchanged",()=>{const page=read("teacher/contacts/[contactsTab]/[membershipId]"); expect(page).not.toContain("text-[#"); expect(page).not.toContain("min-h-10"); expect(page).toContain("min-w-0"); });
 it("UX-teacher-courses-01 presents the newest Courses directory while retaining Section filters",()=>{const page=read("teacher/courses"); expect(page).toContain("FacultyPrototypeCourseDirectory"); expect(page).toContain("FacultyCourseList"); expect(page).toContain("min-w-0"); });
 it("UX-teacher-courses-deliveryId-01 keeps invalid delivery ids still 404",()=>{const page=read("teacher/courses/[deliveryId]"); expect(page).toContain("validFacultyDefaultDeliveryId"); expect(page).toContain("facultyCourseTabHref"); });
 it("UX-teacher-courses-deliveryId-courseTab-01 keeps invalid lesson id still 404 and unsupported tabs redirect home",()=>{const page=read("teacher/courses/[deliveryId]/[...courseTab]"); expect(page).toContain("getFacultyCourseWorkspace"); expect(page).toContain("notFound()"); });
 it("UX-teacher-courses-deliveryId-assessment-health-01 keeps source-backed published health data and empty text unchanged",()=>{const page=read("teacher/courses/[deliveryId]/assessment-health"); expect(page).not.toContain("text-[#"); expect(page).not.toContain("min-h-10"); expect(page).toContain("min-w-0"); });
});
