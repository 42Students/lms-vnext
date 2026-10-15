import {expect,it} from "vitest";
import {searchLearnerAlertPreview} from "@/modules/placements/learner-alert-preview-search-model";
import {readLearnerNoticeFilters} from "@/modules/placements/learner-notices-query-model";
import {learnerNoticeFilterHref} from "@/modules/placements/learner-notices-navigation-model";
it("only searches already scoped personal previews and retains filters",()=>{
 const rows=[{id:"own",title:"Offer  decision",body:"Review by Friday"},{id:"other",title:"Interview",body:"Tomorrow"}];
 expect(searchLearnerAlertPreview(rows,"OFFER decision").map(x=>x.id)).toEqual(["own"]);
 const parsed=readLearnerNoticeFilters({unread:"1",alertQ:"  offer "});
 expect(parsed).toMatchObject({unread:true,alertQ:"offer",invalid:false});
 const href=learnerNoticeFilterHref({pinned:true,unread:true,recent:false,q:"",sort:"oldest",alertQ:"offer"});
 expect(href).toContain("alertQ=offer");
 expect(searchLearnerAlertPreview(rows,"missing")).toEqual([]);
});
