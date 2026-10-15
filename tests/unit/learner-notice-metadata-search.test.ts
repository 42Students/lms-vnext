import {expect,it} from "vitest";
import {searchLearnerNotices} from "@/modules/placements/learner-notices-search-model";
it("matches saved sender and audience labels within the already visible scope",()=>{
 const rows=[{id:"a",title:"Schedule",message:"Monday",senderLabel:"Placement cell",audienceLabel:"College"},
 {id:"b",title:"Exam",message:"Friday",senderLabel:"Faculty",audienceLabel:"Class"}];
 expect(searchLearnerNotices(rows,"PLACEMENT").map(x=>x.id)).toEqual(["a"]);
 expect(searchLearnerNotices(rows,"class").map(x=>x.id)).toEqual(["b"]);
 expect(searchLearnerNotices(rows,"confidential")).toEqual([]);
});
