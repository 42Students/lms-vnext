import {expect,it} from "vitest";
import {searchLearnerNotices} from "@/modules/placements/learner-notices-search-model";
it("matches visible notice text across whitespace and case without adding unseen rows",()=>{
 const rows=[{id:"a",title:"Campus   Drive",message:"Join on Monday",senderLabel:"Placement Cell",audienceLabel:"Program"},
 {id:"b",title:"Course",message:"Quiz",senderLabel:"Faculty",audienceLabel:"Class"}];
 expect(searchLearnerNotices(rows,"CAMPUS drive").map(x=>x.id)).toEqual(["a"]);
 expect(searchLearnerNotices(rows,"placement\tcell").map(x=>x.id)).toEqual(["a"]);
 expect(searchLearnerNotices(rows,"private")).toEqual([]);
 expect(rows).toHaveLength(2);
});
