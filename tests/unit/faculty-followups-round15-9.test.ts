import {it,expect} from "vitest";
import {parseFacultyFollowUpSearchParams} from "@/modules/courses/faculty-response-followup-model";
it("does not silently accept duplicate or forged Section selectors",()=>{
 expect(parseFacultyFollowUpSearchParams({kind:["QUIZ","ALL"]}).success).toBe(false);
 expect(parseFacultyFollowUpSearchParams({membershipId:"secret"}).success).toBe(false);
 expect(parseFacultyFollowUpSearchParams({kind:"ASSIGNMENT"}).success).toBe(true);
});
