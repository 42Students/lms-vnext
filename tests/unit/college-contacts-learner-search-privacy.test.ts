import {describe,it,expect} from "vitest";
import {visibleContactDetails} from "@/modules/people/college-contacts-privacy";
describe("contacts learner email disclosure",()=>{it("keeps raw email unavailable for student and dual-role views",()=>{
 const item=visibleContactDetails({email:"learner@college.edu",phone:null,isLearner:true});
 expect(item.email).toBe("l•••@college.edu");
 expect(item.email).not.toBe("learner@college.edu");
});});
