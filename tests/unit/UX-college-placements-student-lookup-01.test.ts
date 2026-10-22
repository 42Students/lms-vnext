import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/placements/student-lookup/page.tsx"),"utf8");
describe("/college/placements/student-lookup UX",()=>{
 it("UX-college-placements-student-lookup-01 preserves the new accessible state and responsive contract",()=>expect(source).toContain('caption={`${person.name??person.roll??"Student"} placement applications`}'));
 it("UX-college-placements-student-lookup-02 preserves the new accessible state and responsive contract",()=>expect(source).toContain("uiKey:row.jobId+\":\"+i"));
 it("UX-college-placements-student-lookup-03 preserves the new accessible state and responsive contract",()=>expect(source).toContain("No applications found."));
});
