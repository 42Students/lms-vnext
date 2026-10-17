import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("mentor roster history and public spotlight",()=>{
 it("MEN-projects-meetings-25 shows mentor-first active/inactive roster and restricted public bio",()=>{
   const service=read("src/modules/projects/workspace-view-service.ts");
   const ui=read("src/components/projects/project-workspace.tsx");
   expect(service).toContain('access.access === "MENTOR"');
   expect(service).toContain("mentorRoster,");
   expect(service).toContain("projectMembers.endedAt");
   expect(service).toContain("collegeMemberships.status");
   expect(service).toContain("facultyProfiles.profileDocument");
   expect(service).toContain("projectMembers.role} = 'MENTOR'");
   expect(ui).toContain('active?"Active":"Inactive"');
   expect(ui).toContain('member.academicTitle?.trim()');
   expect(ui).toContain("safeProjectExternalHref(member.linkedIn)");
   expect(ui).toContain("No mentor bio yet");
 });
});
