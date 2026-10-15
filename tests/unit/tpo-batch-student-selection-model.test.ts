import {expect,it} from "vitest";
import {selectTpoBatchStudentView} from "@/modules/placements/tpo-batch-student-selection-model";
it("composes scoped page search, decision, source, registration and order",()=>{
 const rows=[{membershipId:"1",name:"A",decision:"ELIGIBLE",ambiguous:false,source:"LEARNER",registration:{choice:"PLACEMENTS"}},{membershipId:"2",name:"B",decision:"NOT_DECIDED",ambiguous:true,source:"NONE",registration:{choice:null}}];
 const opts={q:"B",decision:"NEEDS_REVIEW" as const,source:"NONE" as const,registration:"UNRECORDED" as const,order:"REVIEW_FIRST" as const};
 expect(selectTpoBatchStudentView(rows,opts,true).map(r=>r.membershipId)).toEqual(["2"]);
 expect(selectTpoBatchStudentView(rows,opts,false)).toHaveLength(0);
 expect(rows).toHaveLength(2);
});
