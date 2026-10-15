import {it,expect} from "vitest";
import {batchStudentViewSchema,filterBatchStudentNames,batchStudentPageHref} from "@/modules/placements/tpo-batch-student-view-model";
it("searches only the supplied authorized learner slice, preserving source",()=>{
 const rows=[{name:"Akhila"},{name:"Phanindra"}];
 expect(filterBatchStudentNames(rows," AKH ")).toEqual([rows[0]]);
 expect(rows).toHaveLength(2);
});
it("enforces bounded search terms and keeps pagination context",()=>{
 expect(batchStudentViewSchema.safeParse({q:"a".repeat(101)}).success).toBe(false);
 expect(batchStudentPageHref("cohort",2,{q:"A B"})).toContain("page=2&q=A+B");
});
