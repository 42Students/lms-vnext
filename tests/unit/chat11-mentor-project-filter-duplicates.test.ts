
import {expect,it} from "vitest";
import {singleValueMentorFilters} from "@/modules/projects/mentor-filter-query";
import {mentorProjectListQuerySchema} from "@/modules/projects/mentor-project-list-query";
it("does not silently choose an attacker-controlled repeated project filter",()=>{
 expect(singleValueMentorFilters({status:["ACTIVE","ARCHIVED"]})).toBeNull();
 expect(mentorProjectListQuerySchema.safeParse(singleValueMentorFilters({status:["ACTIVE","ARCHIVED"]})).success).toBe(false);
 expect(mentorProjectListQuerySchema.safeParse(singleValueMentorFilters({status:["ACTIVE"]})).success).toBe(true);
 expect(singleValueMentorFilters({work:["ALL_DONE","NO_TASKS"]})).toBeNull();
});
