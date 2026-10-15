import { describe,expect,it } from "vitest";
import { mentorProjectListQuerySchema } from "@/modules/projects/mentor-project-list-query";
import { matchesMentorProjectWork } from "@/modules/projects/mentor-project-work-model";
import { matchesMentorProjectAttention } from "@/modules/projects/mentor-project-attention-filter-model";
describe("Mentor Project filter call-site types",()=>{
 it("passes schema-inferred Mentor facets directly to helpers",()=>{
   const query=mentorProjectListQuerySchema.parse({work:"HAS_OPEN_TASKS",attention:"MENTOR_STALLED"});
   expect(matchesMentorProjectWork(query.work,{total:2,open:1})).toBe(true);
   expect(matchesMentorProjectAttention(query.attention,new Set(["STALLED"]))).toBe(true);
 });
});
