import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
it("UX-teacher-profile-details-01 /teacher/profile/details keeps access and honest feedback",()=>{
 const s=readFileSync(join(process.cwd(),"src/app/(authenticated)/teacher/profile/details/page.tsx"),"utf8");
 expect(s).toContain("notFound()");
 expect(s).toContain("getCurrentRequestContext");
 expect(s).toContain('<PageHeader title="About & details"');
 expect(s).toContain('<Breadcrumbs items={[{label:"Profile",href:"/teacher/profile"},{label:"About & details"}]}/>');
 expect(s).toContain("role=\"status\"");
});
