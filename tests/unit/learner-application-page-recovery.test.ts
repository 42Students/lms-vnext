import {expect,it} from "vitest";
import {learnerApplicationPage} from "@/modules/placements/learner-application-pagination-model";
it("clamps stale pages after application filters without claiming more records",()=>{
 expect(learnerApplicationPage(31,3,20)).toEqual({page:2,pages:2,start:20,end:31,corrected:true});
 expect(learnerApplicationPage(0,10,20)).toEqual({page:1,pages:1,start:0,end:0,corrected:true});
 expect(learnerApplicationPage(21,2,20)).toEqual({page:2,pages:2,start:20,end:21,corrected:false});
 expect(()=>learnerApplicationPage(-1,1,20)).toThrow();
});
