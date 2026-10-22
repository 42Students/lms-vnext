import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
it("UX-teacher-profile-contacts-01 /teacher/profile/contacts keeps access and honest feedback",()=>{
 const s=readFileSync(join(process.cwd(),"src/app/(authenticated)/teacher/profile/contacts/page.tsx"),"utf8");
 expect(s).toContain("getCurrentRequestContext");
 expect(s).toContain('<PageHeader title="Contact details"');
 expect(s).toContain("getOwnFacultyContactAvailability(context,{}");
 expect(s).toContain("These identity fields are managed by your college");
 expect(s).toContain("role=\"status\"");
});
