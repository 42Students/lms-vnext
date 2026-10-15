import {expect,it} from "vitest";
import {learnerNoticeMissing} from "@/modules/placements/learner-notice-deep-link-model";
it("shows a generic unavailable-notice message only for a validated missing focus",()=>{
 expect(learnerNoticeMissing(null,false)).toBe(false);
 expect(learnerNoticeMissing("00000000-0000-4000-8000-000000000001",true)).toBe(false);
 expect(learnerNoticeMissing("00000000-0000-4000-8000-000000000001",false)).toBe(true);
});
