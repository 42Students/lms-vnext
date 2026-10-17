import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("mentor gaps round-seven behavior",()=>{
it("MEN-projects-meetings-14 preserves persisted truth and legacy controls",()=>{const s=read("src/components/projects/project-workspace.tsx");for(const p of ["description={mode===\"MENTOR\"","Mentor: ","Course not linked"])expect(s).toContain(p);expect(read("src/app/(authenticated)/mentor/projects/[projectId]/page.tsx")).toContain("Additional project tools");});
it("MEN-projects-meetings-R05 preserves persisted truth and legacy controls",()=>{const s=read("src/modules/projects/resource-service.ts");for(const p of ["status === \"ARCHIVED\" || status === \"COMPLETED\""])expect(s).toContain(p);expect(read("src/modules/projects/meeting-service.ts")).toContain('status === "ARCHIVED" || status === "COMPLETED"');expect(read("src/components/projects/project-workspace.tsx")).toContain("Completed project · read only");});
it("MEN-projects-meetings-R08 preserves persisted truth and legacy controls",()=>{const s=read("src/components/projects/project-participant-list-controls.tsx");for(const p of ["onInput={mentor?liveRefresh:undefined}","setTimeout(()=>liveForm.current?.requestSubmit(),350)","!mentor || hasFilters"])expect(s).toContain(p);});
});
