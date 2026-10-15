
import {expect,it} from "vitest";
import {singleValueMentorFilters} from "@/modules/projects/mentor-filter-query";
import {mentorProjectActivityQuerySchema} from "@/modules/projects/mentor-project-activity-model";
const projectId="11111111-1111-4111-8111-111111111111";
it("does not silently choose one exact-project history filter",()=>{
 const bad=singleValueMentorFilters({view:["TASKS","TEAM"]});
 expect(mentorProjectActivityQuerySchema.safeParse(bad?{projectId,...bad}:null).success).toBe(false);
 const valid=singleValueMentorFilters({view:["TASKS"]});
 expect(mentorProjectActivityQuerySchema.parse({projectId,...valid}).view).toBe("TASKS");
});
