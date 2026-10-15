
import {expect,it} from "vitest";
import {singleValueMentorExportFilters} from "@/modules/projects/mentor-filter-query";
import {mentorTaskReviewQuerySchema} from "@/modules/projects/mentor-task-review-model";
const allowed=["age","projectId","priority"] as const;
it("refuses repeated keys before project- and age-scoped CSV reads",()=>{
 expect(singleValueMentorExportFilters(new URLSearchParams("age=ALL&age=OLDER_THAN_30_DAYS"),allowed)).toBeNull();
 expect(singleValueMentorExportFilters(new URLSearchParams("unexpected=1"),allowed)).toBeNull();
 const unique=singleValueMentorExportFilters(new URLSearchParams("priority=HIGH&age=LAST_7_DAYS"),allowed);
 expect(mentorTaskReviewQuerySchema.parse(unique)).toMatchObject({priority:"HIGH",age:"LAST_7_DAYS"});
});
