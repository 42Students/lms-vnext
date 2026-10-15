import {describe,it,expect} from "vitest";
import {auditFindingsQuerySchema,auditFindingPriority} from "@/modules/bug-tracker/audit-findings-board-model";
describe("audit findings filters",()=>{
 it("places critical findings first",()=>{expect(auditFindingPriority("CRITICAL")).toBeLessThan(auditFindingPriority("LOW"));});
 it("rejects scope injection and unbounded paging",()=>{expect(auditFindingsQuerySchema.safeParse({collegeId:"other"}).success).toBe(false);expect(auditFindingsQuerySchema.safeParse({page:-1}).success).toBe(false);});
});
