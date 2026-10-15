import {describe,it,expect} from "vitest";
import {auditFindingsQuerySchema,auditFindingPriority,trackerAuditFindingsInput} from "@/modules/bug-tracker/audit-findings-board-model";
describe("audit findings",()=>{
 it("orders urgency and uses actual persisted tracker statuses",()=>{
 expect(auditFindingPriority("CRITICAL")).toBeLessThan(auditFindingPriority("LOW"));
 expect(auditFindingsQuerySchema.parse({status:"READY_FOR_RETEST"}).status).toBe("READY_FOR_RETEST");
 expect(auditFindingsQuerySchema.safeParse({status:"IN_PROGRESS"}).success).toBe(false);
 });
 it("maps only validated filters to the existing scoped tracker service",()=>{
 const query=auditFindingsQuerySchema.parse({status:"CHECKING",severity:"MAJOR",q:" issue "});
 expect(trackerAuditFindingsInput(query)).toEqual({status:"CHECKING",severity:"MAJOR",q:"issue",sort:"newest",limit:50,beforeCreatedAt:undefined,beforeId:undefined});
 expect(auditFindingsQuerySchema.safeParse({organizationId:"foreign"}).success).toBe(false);
 expect(auditFindingsQuerySchema.safeParse({beforeId:"11111111-1111-4111-8111-111111111111"}).success).toBe(false);
 });
});
