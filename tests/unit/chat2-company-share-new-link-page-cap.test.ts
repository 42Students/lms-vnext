import {describe,it,expect} from "vitest";
import {prependCompanyShareLink,COMPANY_SHARE_PAGE_SIZE} from "../../src/modules/placements/company-share/link-page-model";
describe("company link create visible page",()=>{
 it("prepends new links while maintaining page size",()=>{
  const rows=Array.from({length:COMPANY_SHARE_PAGE_SIZE},(_,i)=>({id:String(i)}));
  const result=prependCompanyShareLink(rows,{id:"new"});
  expect(result).toHaveLength(COMPANY_SHARE_PAGE_SIZE);
  expect(result[0]?.id).toBe("new");
  expect(result.some(r=>r.id==="24")).toBe(false);
 });
 it("does not duplicate an issued link when server refresh races",()=>{
  expect(prependCompanyShareLink([{id:"new"},{id:"old"}],{id:"new"}).map(x=>x.id)).toEqual(["new","old"]);
 });
});
