import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("Chat-7 mentor Projects round-seven gaps",()=>{
it("MEN-projects-meetings-01 retains the reviewed mentor legacy and resilience contract",()=>{const s=read("src/components/projects/mentor-projects-unavailable.tsx");for(const phrase of ["Projects could not be loaded","This does not mean Projects is disabled.","Retry access check"])expect(s).toContain(phrase);});
it("MEN-projects-meetings-02 retains the reviewed mentor legacy and resilience contract",()=>{const s=read("src/app/(authenticated)/mentor/loading.tsx");for(const phrase of ["Opening your mentor workspace"])expect(s).toContain(phrase);});
it("MEN-projects-meetings-08 retains the reviewed mentor legacy and resilience contract",()=>{const s=read("src/app/(authenticated)/mentor/projects/error.tsx");for(const phrase of ["Projects could not be loaded","Check your connection","Retry"])expect(s).toContain(phrase);});
it("MEN-projects-meetings-18 retains the reviewed mentor legacy and resilience contract",()=>{const s=read("src/components/projects/project-workspace.tsx");for(const phrase of ["mode!==\"ADMIN\"?<div","Definition of done","Who’s who"])expect(s).toContain(phrase);});
it("MEN-projects-meetings-23 retains the reviewed mentor legacy and resilience contract",()=>{const s=read("src/components/projects/project-workspace.tsx");for(const phrase of ["About this project","Deliverables","aria-label=\"Final submission\""])expect(s).toContain(phrase);});
it("MEN-projects-meetings-37 retains the reviewed mentor legacy and resilience contract",()=>{const s=read("src/components/projects/project-lifecycle-actions.tsx");for(const phrase of ["Ship this release?","Complete every linked sprint","ConfirmDialog"])expect(s).toContain(phrase);});
it("MEN-projects-meetings-38 retains the reviewed mentor legacy and resilience contract",()=>{const s=read("src/components/projects/project-workspace.tsx");for(const phrase of ["Tasks: {facts.done}/{facts.total} done","No tasks yet","mode===\"ADMIN\"?\"Execution\":\"Releases and Sprints\""])expect(s).toContain(phrase);});
it("MEN-projects-meetings-R03 retains the reviewed mentor legacy and resilience contract",()=>{const s=read("src/modules/projects/validation.ts");for(const phrase of [".transform(() => \"Asia/Kolkata\" as const)"])expect(s).toContain(phrase);});
});
