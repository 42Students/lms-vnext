
import {it,expect} from "vitest";
import {compareMentorProjectsByTeamSize} from "@/modules/projects/mentor-project-order-model";
import {mentorProjectListQuerySchema} from "@/modules/projects/mentor-project-list-query";
const p=(id:string,status="ACTIVE")=>({id,title:id,status,updatedAt:new Date("2026-10-01")});
it("finds the smallest active project team without surfacing archived teams first",()=>{
 expect(compareMentorProjectsByTeamSize(p("small"),p("large"),1,9,"SMALLEST")).toBeLessThan(0);
 expect(compareMentorProjectsByTeamSize(p("archive","ARCHIVED"),p("active"),0,9,"SMALLEST")).toBeGreaterThan(0);
 expect(mentorProjectListQuerySchema.parse({sort:"TEAM_SIZE_ASC"}).sort).toBe("TEAM_SIZE_ASC");
});
