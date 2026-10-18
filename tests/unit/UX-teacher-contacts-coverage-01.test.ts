import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const pathname="src/app/(authenticated)/teacher/contacts/page.tsx";
describe("Faculty UX route /teacher/contacts",()=>{
 it("UX-teacher-contacts-01: retains routing, access and learner-facing states",()=>{
 const source=readFileSync(join(process.cwd(),pathname),"utf8");
 expect(source).toContain("redirect(\"/teacher/contacts/allContacts\")");
 });
});
