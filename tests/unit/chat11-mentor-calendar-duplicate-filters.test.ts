
import {expect,it} from "vitest";
import {singleValueMentorFilters} from "@/modules/projects/mentor-filter-query";
import {mentorCalendarFiltersSchema} from "@/modules/projects/mentor-calendar-filter-model";
it("does not choose one of two contradictory calendar selectors",()=>{
 expect(singleValueMentorFilters({status:["REQUESTED","CANCELLED"]})).toBeNull();
 expect(singleValueMentorFilters({attention:["OVERDUE_REQUESTED","SOON_SCHEDULED"]})).toBeNull();
 expect(mentorCalendarFiltersSchema.safeParse(singleValueMentorFilters({status:["REQUESTED"]})).success).toBe(true);
});
