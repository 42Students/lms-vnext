import {describe,it,expect} from "vitest";
import {auditFindingStatusPayload,canChangeAuditFindingStatus,auditFindingStatusInput} from "@/modules/bug-tracker/audit-finding-status-action-model";
describe("Super Admin audit finding status confirmation",()=>{
 it("sends only version and validated status to the existing audited endpoint",()=>{
  expect(auditFindingStatusPayload(3,"CHECKING")).toEqual({expectedVersion:3,status:"CHECKING"});
  expect(auditFindingStatusInput.safeParse({expectedVersion:3,status:"INVALID"}).success).toBe(false);
 });
 it("disables no-ops and pending changes",()=>{
  expect(canChangeAuditFindingStatus("NEW","NEW",false)).toBe(false);
  expect(canChangeAuditFindingStatus("NEW","CHECKING",true)).toBe(false);
  expect(canChangeAuditFindingStatus("NEW","CHECKING",false)).toBe(true);
 });
});