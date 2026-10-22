import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const pathname="src/app/(authenticated)/teacher/contacts/[contactsTab]/[membershipId]/page.tsx";
describe("Faculty UX route /teacher/contacts/[contactsTab]/[membershipId]",()=>{
 it("UX-teacher-contacts-contactstab-membershipid-01: retains routing, access and learner-facing states",()=>{
 const source=readFileSync(join(process.cwd(),pathname),"utf8");
 expect(source).toContain("getCurrentRequestContext");
 expect(source).toContain("getFacultyContactDetail(context,parsed.data)");
 expect(source).toContain("facultyContactDetailHidden(error)");
 expect(source).toContain("No active roles recorded");
 expect(source).toContain('role="status"');
 });
});
