import {expect,it} from "vitest";
import {filterLearnerNoticesBySource} from "@/modules/placements/learner-notice-source-filter-model";
import {readLearnerNoticeFilters} from "@/modules/placements/learner-notices-query-model";
import {learnerNoticeFilterHref} from "@/modules/placements/learner-notices-navigation-model";
it("filters membership-visible notices to TPO authors without treating all college notices as placement notices",()=>{
 const rows=[{id:"a",senderLabel:"Placement cell"},{id:"b",senderLabel:"College administration"},{id:"c",senderLabel:null}];
 expect(filterLearnerNoticesBySource(rows,"placement-cell").map(x=>x.id)).toEqual(["a"]);
 expect(filterLearnerNoticesBySource(rows,"all")).toHaveLength(3);
 expect(readLearnerNoticeFilters({source:"placement-cell"}).source).toBe("placement-cell");
 expect(readLearnerNoticeFilters({source:"COLLEGE"}).invalid).toBe(true);
 expect(learnerNoticeFilterHref({pinned:true,unread:false,recent:false,q:"",source:"placement-cell"})).toContain("source=placement-cell");
});
