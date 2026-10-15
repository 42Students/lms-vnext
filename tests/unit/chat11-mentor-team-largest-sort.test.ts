
import {it,expect} from "vitest";
import {compareMentorProjectsByTeamSize} from "@/modules/projects/mentor-project-order-model";
import {mentorProjectListQuerySchema} from "@/modules/projects/mentor-project-list-query";
const p=(id:string,status="ACTIVE")=>({id,title:id,status,updatedAt:new Date("2026-10-01")});
it("ranks authorized active team sizes and keeps archived last",()=>{
 expect(compareMentorProjectsByTeamSize(p("large"),p("small"),9,3,"LARGEST")).toBeLessThan(0);
 expect(compareMentorProjectsByTeamSize(p("archive","ARCHIVED"),p("active"),20,1,"LARGEST")).toBeGreaterThan(0);
 expect(mentorProjectListQuerySchema.parse({sort:"TEAM_SIZE_DESC"}).sort).toBe("TEAM_SIZE_DESC");
});
