import {expect,it} from "vitest";
import {mentorActivityQuerySchema as portfolio} from "@/modules/projects/mentor-portfolio-model";
import {mentorProjectActivityQuerySchema as exact,mentorProjectActivityEventTypes as types} from "@/modules/projects/mentor-project-activity-model";
it("exposes only registered evaluation events in authorized Mentor history",()=>{
 expect(portfolio.parse({view:"EVALUATIONS"}).view).toBe("EVALUATIONS");
 expect(exact.parse({projectId:"10000000-0000-4000-8000-000000000001",view:"EVALUATIONS"}).view).toBe("EVALUATIONS");
 expect(types("EVALUATIONS")).toEqual(["projects.evaluation.recorded"]);
 expect(portfolio.safeParse({view:"RAW_METADATA"}).success).toBe(false);
});
