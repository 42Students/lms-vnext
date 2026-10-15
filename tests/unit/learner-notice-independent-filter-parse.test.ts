import {expect,it} from "vitest";
import {readLearnerNoticeFilters} from "@/modules/placements/learner-notices-query-model";
it("recovers valid membership-visible filters when another query input is malformed",()=>{
 const p=readLearnerNoticeFilters({pinned:"1",sort:["latest","oldest"],q:"  Placement  ",page:"4"});
 expect(p).toMatchObject({pinned:true,sort:"pinned",q:"Placement",page:4,invalid:true});
 const q=readLearnerNoticeFilters({pinned:"1",page:"0",unread:"1",collegeId:"other"});
 expect(q).toMatchObject({pinned:true,unread:true,page:1,invalid:true});
 expect(readLearnerNoticeFilters({sort:"oldest",recent:"1"}).invalid).toBe(false);
});
