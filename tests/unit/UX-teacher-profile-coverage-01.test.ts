import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
it("UX-teacher-profile-01 /teacher/profile keeps access and honest feedback",()=>{
 const s=readFileSync(join(process.cwd(),"src/app/(authenticated)/teacher/profile/page.tsx"),"utf8");
 expect(s).toContain("getCurrentRequestContext");
 expect(s).toContain('<PageHeader title="Profile"');
 expect(s).toContain("getOwnFacultyProfileWithRuntime(context)");
 expect(s).toContain("aria-label=\"Profile shortcuts\"");
});
