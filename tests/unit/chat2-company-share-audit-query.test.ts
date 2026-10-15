import {describe,it,expect} from "vitest";
import {parseCompanyShareAuditQuery} from "../../src/modules/placements/company-share/audit-query-model";

describe("company-share audit query validation",()=>{
 it("defaults only omitted filters",()=>{
  const result=parseCompanyShareAuditQuery({});
  expect(result.success&&result.data).toEqual({kind:"ALL",page:1});
 });
 it("supports filtered history pages",()=>{
  const result=parseCompanyShareAuditQuery({kind:"CSV",page:"25"});
  expect(result.success&&result.data).toEqual({kind:"CSV",page:25});
 });
 it.each([{kind:"UNKNOWN"},{page:"0"},{page:"NaN"},{page:"10001"}])("rejects bad filters instead of hiding them: %j",raw=>{
  expect(parseCompanyShareAuditQuery(raw).success).toBe(false);
 });
});
