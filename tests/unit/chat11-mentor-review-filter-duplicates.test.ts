
import {expect,it} from "vitest";
import {singleValueMentorFilters} from "@/modules/projects/mentor-filter-query";
import {mentorReviewQuerySchema} from "@/modules/projects/mentor-portfolio-model";
it("refuses contradictory age/assignment filters on the Mentor delivery queue",()=>{
 const unsafe=singleValueMentorFilters({age:["OLDER_THAN_30_DAYS","ALL"]});
 expect(mentorReviewQuerySchema.safeParse(unsafe).success).toBe(false);
 expect(singleValueMentorFilters({assignment:["PRIMARY","SUPPORTING"]})).toBeNull();
 expect(mentorReviewQuerySchema.safeParse(singleValueMentorFilters({age:["OLDER_THAN_30_DAYS"]})).success).toBe(true);
});
