
import {expect,it} from "vitest";
import {singleValueMentorExportFilters} from "@/modules/projects/mentor-filter-query";
import {mentorCalendarFiltersSchema} from "@/modules/projects/mentor-calendar-filter-model";
const allowed=["sprint","join","projectId","attention","status","type","projectState","search","period"];
it("rejects duplicated or unknown meeting CSV filters before scoped reads",()=>{
 expect(singleValueMentorExportFilters(new URLSearchParams("status=REQUESTED&status=CANCELLED"),allowed)).toBeNull();
 expect(singleValueMentorExportFilters(new URLSearchParams("collegeId=foreign"),allowed)).toBeNull();
 const parsed=singleValueMentorExportFilters(new URLSearchParams("attention=OVERDUE_REQUESTED&status=REQUESTED"),allowed);
 expect(mentorCalendarFiltersSchema.parse(parsed)).toMatchObject({status:"REQUESTED",attention:"OVERDUE_REQUESTED"});
});
