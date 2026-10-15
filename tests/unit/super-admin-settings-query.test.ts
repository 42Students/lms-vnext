import {describe,expect,it} from "vitest";
import {parseAdminInventoryQuery} from "@/modules/platform-settings/admin-inventory-filter";
describe("Super Admin settings read-only URL safety",()=>{
 it("rejects unknown query keys and duplicated section/query selectors",()=>{
  expect(parseAdminInventoryQuery({q:["sms","attendance"]})).toBeNull();
  expect(parseAdminInventoryQuery({section:["sms","operations"]})).toBeNull();
  expect(parseAdminInventoryQuery({section:"sms",token:"unexpected"})).toBeNull();
 });
 it("accepts known source inventory filters without expanding scope",()=>{
  expect(parseAdminInventoryQuery({section:"sms",q:"Exotel"})).toEqual({section:"sms",q:"Exotel"});
  expect(parseAdminInventoryQuery({})).toEqual({section:"ALL",q:""});
 });
});
