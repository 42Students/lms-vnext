
import {expect,it} from "vitest";
import {singleValueMentorFilters} from "@/modules/projects/mentor-filter-query";
import {mentorTaskReviewQuerySchema} from "@/modules/projects/mentor-task-review-model";
it("refuses ambiguous review version, age and priority query values",()=>{
 expect(singleValueMentorFilters({version:["1","2"]})).toBeNull();
 expect(singleValueMentorFilters({age:["LAST_7_DAYS","OLDER_THAN_30_DAYS"]})).toBeNull();
 expect(singleValueMentorFilters({priority:["HIGH","LOW"]})).toBeNull();
 expect(mentorTaskReviewQuerySchema.safeParse(singleValueMentorFilters({version:["1"],priority:["HIGH"]})).success).toBe(true);
});
