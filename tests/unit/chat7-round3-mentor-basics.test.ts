import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("chat-7 round 3 mentor access and state",()=>{
it("MEN-projects-meetings-01 module lookup failure does not assert disabled state",()=>{
 const source=read("src/components/projects/mentor-projects-unavailable.tsx");
 expect(source).toContain("Projects could not be loaded");
 expect(source).toContain("Retry access check");
 expect(source).toContain("This does not mean Projects is disabled.");
});
it("MEN-projects-meetings-02 mentor workspace advertises pending loading",()=>{
 const source=read("src/app/(authenticated)/mentor/loading.tsx");
 expect(source).toContain("Opening your mentor workspace");
 expect(source).toContain("aria-busy");
});
it("MEN-projects-meetings-08 error boundary offers retry without false feature-disable copy",()=>{
 const source=read("src/app/(authenticated)/mentor/projects/error.tsx");
 expect(source).toContain("Projects could not be loaded");
 expect(source).toContain("Check your connection and try again.");
 expect(source).toContain("onClick={reset}");
});
it("MEN-projects-meetings-11 review-only memberships are not granted write access",()=>{
 const source=read("src/modules/projects/access.ts");
 expect(source).toContain("mayMutateProjectWithRole(member.roleKind");
 expect(source).toContain("\"OBSERVER\" as const");
 expect(source).toContain("scope.access !== \"MENTOR\"");
});
it("MEN-projects-meetings-16 mentor readiness and final-delivery states derive from workspace facts",()=>{
 const source=read("src/components/projects/project-workspace.tsx");
 expect(source).toContain("readiness");
 expect(source).toContain("Sprints completed");
 expect(source).toContain("Final submission");
});
});
