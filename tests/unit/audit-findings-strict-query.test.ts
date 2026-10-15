import {describe,expect,it} from "vitest";
import {parseAuditFindingsSearchParams} from "@/modules/bug-tracker/audit-findings-board-model";
describe("scoped audit findings URL contracts",()=>{
 it("rejects repeated/unknown fields instead of selecting first values",()=>{
  expect(parseAuditFindingsSearchParams({status:["NEW","CLOSED"]})).toBeNull();
  expect(parseAuditFindingsSearchParams({q:"bug",collegeId:"foreign"})).toBeNull();
  expect(parseAuditFindingsSearchParams({beforeId:"92b172ff-3817-44bf-9b48-e9afab2e93d0"})).toBeNull();
 });
 it("accepts valid empty and filtered state",()=>{
  expect(parseAuditFindingsSearchParams({})).toMatchObject({status:"ALL",severity:"ALL",q:""});
  expect(parseAuditFindingsSearchParams({status:"NEW",severity:"CRITICAL"})).toMatchObject({status:"NEW",severity:"CRITICAL"});
 });
});