import {expect,it} from "vitest";
import {facultyResultsQuerySchema,parseFacultyResultsSearchParams} from "@/modules/courses/faculty-results-model";
it("accepts only supported bounded results page sizes",()=>{
  for(const size of [5,10,"5","10"]){
    expect(facultyResultsQuerySchema.safeParse({pageSize:size}).success).toBe(true);
  }
  for(const size of [0,20,"05","5.0","1e1",""," 10 "]){
    expect(parseFacultyResultsSearchParams({pageSize:String(size)}).success).toBe(false);
  }
});
