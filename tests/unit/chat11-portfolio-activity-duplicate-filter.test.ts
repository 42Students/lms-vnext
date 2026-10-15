
import {expect,it} from "vitest";
import {singleValueMentorFilters} from "@/modules/projects/mentor-filter-query";
import {mentorActivityQuerySchema} from "@/modules/projects/mentor-portfolio-model";
it("never selects one of two conflicting importance or assignment selections",()=>{
 expect(singleValueMentorFilters({importance:["HIGH","LOW"]})).toBeNull();
 expect(singleValueMentorFilters({assignment:["PRIMARY","SUPPORTING"]})).toBeNull();
 expect(mentorActivityQuerySchema.safeParse(singleValueMentorFilters({importance:["HIGH"]})).success).toBe(true);
});
