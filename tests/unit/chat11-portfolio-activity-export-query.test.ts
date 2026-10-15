
import {expect,it} from "vitest";
import {singleValueMentorExportFilters} from "@/modules/projects/mentor-filter-query";
import {mentorActivityQuerySchema} from "@/modules/projects/mentor-portfolio-model";
const allowed=["assignment","projectId","importance","window"];
it("requires a single value per exported activity filter",()=>{
 expect(singleValueMentorExportFilters(new URLSearchParams("importance=HIGH&importance=LOW"),allowed)).toBeNull();
 expect(singleValueMentorExportFilters(new URLSearchParams("private=1"),allowed)).toBeNull();
 const params=singleValueMentorExportFilters(new URLSearchParams("assignment=PRIMARY&importance=HIGH"),allowed);
 expect(mentorActivityQuerySchema.parse(params)).toMatchObject({assignment:"PRIMARY",importance:"HIGH"});
});
