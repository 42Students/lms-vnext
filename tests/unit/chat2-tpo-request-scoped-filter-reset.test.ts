import {describe,it,expect} from "vitest";
import {tpoRequestClearAdvancedHref,globalTpoRequestsQuerySchema} from "../../src/modules/placements/tpo-global-requests-model";
describe("TPO request queue reset",()=>{
 it("retains approved tab rather than silently switching to pending",()=>{
  const url=new URL(tpoRequestClearAdvancedHref("APPROVED"),"http://localhost");
  expect(url.searchParams.get("status")).toBe("APPROVED");
  expect(url.searchParams.get("page")).toBe("1");
  expect(url.searchParams.has("age")).toBe(false);
  expect(url.searchParams.has("requestType")).toBe(false);
 });
 it("uses only an accepted status enum",()=>{
  expect(globalTpoRequestsQuerySchema.safeParse({status:"FORGED"}).success).toBe(false);
 });
});
