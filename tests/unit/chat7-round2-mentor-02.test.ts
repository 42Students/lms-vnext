import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {compareMentorProjects} from "@/modules/projects/mentor-project-order-model";

describe("chat-7 mentor filters navigation and natural order",()=>{
it("MEN-projects-meetings-06 legacy mentor status filter choices",()=>{
 const code=readFileSync("src/components/projects/project-participant-list-controls.tsx","utf8");
 expect(code).toContain("mentorStatusOptions");
 expect(code).toContain("[\"READY\",\"Ready\"]");
 expect(code).toContain("[\"BLOCKED\",\"Blocked\"]");

});
it("MEN-projects-meetings-07 mentor-specific page sizes and total-range text",()=>{
 const code=readFileSync("src/components/projects/project-participant-list-controls.tsx","utf8");
 expect(code).toContain("[10,25,50]");
 expect(code).toContain(" of \"+total+\" projects");

});
it("MEN-projects-meetings-09 number-aware Team ordering",()=>{
 const code=readFileSync("src/modules/projects/mentor-project-order-model.ts","utf8");
 expect(code).toContain("const teamPattern=");
 expect(code).toContain("Number(left[2])");
 expect(code).toContain("compareTeamTitles(a.title,b.title)");
 const p=(id:string,title:string,status="ACTIVE")=>({id,title,status,updatedAt:new Date("2099-01-01T00:00:00Z")});
 const rows=[p("10","Team 10"),p("2","Team 2"),p("1","Team 1"),p("a","Team 3","ARCHIVED")];
 expect(rows.sort((a,b)=>compareMentorProjects(a,b,"TITLE")).map(p=>p.title)).toEqual(["Team 1","Team 2","Team 10","Team 3"]);
});
it("MEN-projects-meetings-12 distinct legacy navigation tabs",()=>{
 const code=readFileSync("src/components/projects/mentor-project-tabs.tsx","utf8");
 expect(code).toContain("key: \"sprints\", label: \"Sprints & releases\"");
 expect(code).toContain("key: \"board\", label: \"Board\"");
 expect(code).toContain("key: \"performance\", label: \"Performance\"");

});
it("MEN-projects-meetings-13 legacy task and meeting deep-link aliases",()=>{
 const code=readFileSync("src/components/projects/mentor-project-tabs.tsx","utf8");
 expect(code).toContain("=== \"tasks\" ? \"board\"");
 expect(code).toContain("=== \"meetings\" ? \"team\"");

});
});
