import {expect,it} from "vitest";
import {learnerNoticePageWasClamped} from "@/modules/placements/learner-notice-page-recovery-model";
it("explains a stale page only when an existing filtered list was clamped",()=>{
 expect(learnerNoticePageWasClamped(10,2,23,false)).toBe(true);
 expect(learnerNoticePageWasClamped(10,2,23,true)).toBe(false);
 expect(learnerNoticePageWasClamped(10,1,0,false)).toBe(false);
 expect(learnerNoticePageWasClamped(2,2,20,false)).toBe(false);
});
