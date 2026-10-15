import {it,expect} from "vitest";
import {parseFacultyResultsSearchParams} from "@/modules/courses/faculty-results-model";
it("rejects repeated and unknown selectors instead of silently choosing the first",()=>{
 expect(parseFacultyResultsSearchParams({kind:["ALL","QUIZ"]}).success).toBe(false);
 expect(parseFacultyResultsSearchParams({deliveryId:"",other:"x"}).success).toBe(false);
 expect(parseFacultyResultsSearchParams({kind:"QUIZ",search:"abc"}).success).toBe(true);
});
