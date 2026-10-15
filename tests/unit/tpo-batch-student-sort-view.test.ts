import {it,expect} from "vitest";
import {sortBatchStudentView,batchStudentViewSchema} from "@/modules/placements/tpo-batch-student-view-model";
it("prioritizes ambiguous then undecided, with deterministic name/ID ties",()=>{
 const data=[{membershipId:"3",name:"Z",ambiguous:false,decision:"ELIGIBLE"},{membershipId:"2",name:"B",ambiguous:false,decision:"NOT_DECIDED"},{membershipId:"1",name:"A",ambiguous:true,decision:"ELIGIBLE"}];
 expect(sortBatchStudentView(data,"REVIEW_FIRST").map(r=>r.membershipId)).toEqual(["1","2","3"]);
 expect(sortBatchStudentView(data,"NAME_DESC")[0].name).toBe("Z");
 expect(data[0].membershipId).toBe("3");
 expect(batchStudentViewSchema.safeParse({order:"DATE_DESC"}).success).toBe(false);
});
