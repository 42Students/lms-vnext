import {it,expect} from "vitest";
import {batchStudentPageHref,batchStudentViewSchema} from "@/modules/placements/tpo-batch-student-view-model";
it("retains legacy q-only pagination links without injecting undefined filter values",()=>{
 const href=batchStudentPageHref("batch-id",2,{q:"A B"});
 expect(href).toContain("page=2&q=A+B");
 expect(href).not.toContain("undefined");
 expect(href).not.toContain("order=");
});
it("preserves every explicitly selected filter while retaining bounded defaults",()=>{
 const query=batchStudentViewSchema.parse({decision:"ELIGIBLE",source:"CLASS",registration:"RECORDED",order:"REVIEW_FIRST"});
 const href=batchStudentPageHref("batch-id",1,query);
 expect(href).toContain("decision=ELIGIBLE");
 expect(href).toContain("order=REVIEW_FIRST");
});
