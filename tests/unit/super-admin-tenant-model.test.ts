import {describe,expect,it} from "vitest";
import {tenantReadQuerySchema,tenantPage} from "@/modules/colleges/super-admin-tenant-model";
const rows=[{name:"Alpha",code:"A",organizationName:"North",organizationId:"1"},
 {name:"Beta",code:"B",organizationName:"South",organizationId:"2"}];
describe("Super Admin tenant directory model",()=>{
 it("filters only caller scoped rows",()=>{
  expect(tenantPage(rows,{q:"alpha",organizationId:"",page:1}).total).toBe(1);
  expect(tenantPage(rows,{q:"",organizationId:"2",page:1}).items[0]?.name).toBe("Beta");
 });
 it("rejects unexpected and malformed query",()=>{
  expect(tenantReadQuerySchema.safeParse({page:"0"}).success).toBe(false);
  expect(tenantReadQuerySchema.safeParse({collegeId:"forged"}).success).toBe(false);
 });
});
