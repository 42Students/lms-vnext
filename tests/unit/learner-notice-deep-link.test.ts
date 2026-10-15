import {expect,it} from "vitest";
import {learnerNoticeFocusPage,learnerNoticeHref} from "@/modules/placements/learner-notice-deep-link-model";
import {readLearnerNoticeFilters} from "@/modules/placements/learner-notices-query-model";
it("deep-links only to loaded authorized notices and the containing page",()=>{
 const ids=Array.from({length:20},(_,i)=>({id:"00000000-0000-4000-8000-"+String(i+1).padStart(12,"0")}));
 const focus=ids[17].id;
 expect(learnerNoticeFocusPage(ids,1,focus)).toEqual({page:2,found:true});
 expect(learnerNoticeFocusPage(ids,1,"00000000-0000-4000-8000-999999999999").found).toBe(false);
 expect(learnerNoticeHref("../../admin")).toBeNull();
 expect(learnerNoticeHref(focus)).toContain("focus="+focus);
 expect(readLearnerNoticeFilters({focus}).focus).toBe(focus);
});
