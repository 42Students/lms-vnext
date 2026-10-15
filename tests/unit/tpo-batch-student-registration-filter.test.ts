import {it,expect} from "vitest";
import {filterBatchStudentRegistration,batchStudentViewSchema} from "@/modules/placements/tpo-batch-student-view-model";
it("never infers missing choices when registration storage is unavailable",()=>{
 const rows=[{registration:null},{registration:{choice:null}},{registration:{choice:"PLACEMENTS"}}];
 expect(filterBatchStudentRegistration(rows,"UNRECORDED",false)).toEqual([]);
 expect(filterBatchStudentRegistration(rows,"UNRECORDED",true)).toEqual([rows[1]]);
 expect(filterBatchStudentRegistration(rows,"RECORDED",true)).toEqual([rows[2]]);
 expect(batchStudentViewSchema.safeParse({registration:"CONSENTED"}).success).toBe(false);
});
