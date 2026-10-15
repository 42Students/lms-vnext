import {describe,expect,it} from "vitest";
import {strictTraceRouteParams} from "@/modules/module-access/admin-trace-route-params";
describe("Super Admin trace query normalization",()=>{
 it("accepts singleton values without inventing membership IDs",()=>{
  expect(strictTraceRouteParams({q:"Asha",page:"2"})).toMatchObject({q:"Asha",page:"2",membershipId:undefined});
 });
 it("rejects duplicate or unexpected parameters",()=>{
  expect(strictTraceRouteParams({membershipId:["one","two"]})).toBeNull();
  expect(strictTraceRouteParams({overridesOnly:["all","locked"]})).toBeNull();
  expect(strictTraceRouteParams({foo:"bar"})).toBeNull();
 });
});
