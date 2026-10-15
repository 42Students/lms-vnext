import {expect,it} from "vitest";
import {facultyResponseFollowUpQuerySchema,parseFacultyFollowUpSearchParams} from "@/modules/courses/faculty-response-followup-model";
it("accepts only supported bounded follow-up page sizes",()=>{
  for(const size of [5,10,"5","10"]){
    expect(facultyResponseFollowUpQuerySchema.safeParse({pageSize:size}).success).toBe(true);
  }
  for(const size of [0,20,"05","5.0","1e1",""," 10 "]){
    expect(parseFacultyFollowUpSearchParams({pageSize:String(size)}).success).toBe(false);
  }
});
