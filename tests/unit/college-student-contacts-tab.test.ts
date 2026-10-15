import {describe,expect,it} from "vitest";
import {collegeContactsQuerySchema,collegeContactsHref} from "@/modules/people/college-contacts-model";
import {visibleContactDetails} from "@/modules/people/college-contacts-privacy";
describe("Student contacts tab",()=>{it("never returns raw student email in cards",()=>{
 const card=visibleContactDetails({email:"learner@example.edu",phone:"+919123456789",isLearner:true});
 expect(card.email).not.toBe("learner@example.edu");
 expect(card.phone).not.toContain("9123456789");
 expect(collegeContactsHref({...collegeContactsQuerySchema.parse({}),tab:"STUDENT"})).toContain("tab=STUDENT");
});});