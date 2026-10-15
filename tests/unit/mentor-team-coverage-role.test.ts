import { describe, it, expect } from "vitest";
import { mentorTeamCoverageQuerySchema as schema,selectMentorTeamCoverage as select,mentorTeamCoverageHref as href } from "@/modules/projects/mentor-team-coverage-model";
const row=(projectId:string,isPrimaryMentor:boolean)=>({projectId,title:projectId,status:"ACTIVE",learners:2,mentors:1,hasPrimaryMentor:true,isPrimaryMentor});
describe("Mentor team role coverage",()=>{
 it("isolates own primary and supporting assignments",()=>{const rows=[row("primary",true),row("supporting",false)];
  expect(select(rows,schema.parse({assignment:"PRIMARY"})).items.map(r=>r.projectId)).toEqual(["primary"]);
  expect(select(rows,schema.parse({assignment:"SUPPORTING"})).items.map(r=>r.projectId)).toEqual(["supporting"]);});
 it("retains facet through pagination and rejects invalid roles",()=>{expect(href(schema.parse({assignment:"PRIMARY",page:3}))).toContain("assignment=PRIMARY");expect(schema.safeParse({assignment:"ADMIN"}).success).toBe(false);});
});