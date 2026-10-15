import {expect,it} from "vitest";
import {learnerNoticeEmptyLabel} from "@/modules/placements/learner-notice-empty-label-model";
import {learnerNoticeFilterHref} from "@/modules/placements/learner-notices-navigation-model";
it("explains filtered placement-cell notices without claiming that no official notices exist",()=>{
 expect(learnerNoticeEmptyLabel(5,false,"placement-cell")).toContain("match these filters");
 expect(learnerNoticeEmptyLabel(3,true,"all")).toContain("pinned");
 expect(learnerNoticeFilterHref({pinned:true,unread:true,recent:false,q:"",alertQ:"offer",source:"placement-cell"})).toContain("source=placement-cell");
});
