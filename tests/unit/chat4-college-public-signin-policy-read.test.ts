import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks=vi.hoisted(()=>({getDb:vi.fn(),execute:vi.fn(),select:vi.fn(),limit:vi.fn()}));
vi.mock("@/db/client",()=>({getDb:()=>mocks.getDb()}));
import {
 effectiveCollegeSignInMethod,
 effectiveCollegeSignInCapabilities,
} from "@/modules/colleges/public-signin-policy-service";

const id="11111111-1111-4111-8111-111111111111";
beforeEach(()=>{
 for(const fn of Object.values(mocks))fn.mockReset();
 const query={
  from(){return this;},
  where(){return this;},
  limit:(n:number)=>mocks.limit(n),
 };
 mocks.select.mockReturnValue(query);
 mocks.getDb.mockReturnValue({execute:mocks.execute,select:mocks.select});
});

describe("COL-tenant-public-signin-01 resolved-host policy and fail-closed channel access",()=>{
 it("does not query a tenant when the verified host resolver supplied no college",async()=>{
  await expect(effectiveCollegeSignInMethod(null)).resolves.toBe("EMAIL_AND_PHONE");
  await expect(effectiveCollegeSignInCapabilities(null)).resolves.toEqual({
   email:true,phone:true,primary:"EMAIL",
  });
  expect(mocks.getDb).not.toHaveBeenCalled();
  expect(mocks.execute).not.toHaveBeenCalled();
 });
 it("handles a college whose policy migration is not yet installed without selecting a nonexistent table",async()=>{
  mocks.execute.mockResolvedValue({rows:[{present:false}]});
  await expect(effectiveCollegeSignInMethod(id)).resolves.toBe("EMAIL_AND_PHONE");
  expect(mocks.select).not.toHaveBeenCalled();
 });
 it("unconfigured college defaults to the documented dual-channel policy",async()=>{
  mocks.execute.mockResolvedValue({rows:[{present:true}]});
  mocks.limit.mockResolvedValue([]);
  expect(await effectiveCollegeSignInMethod(id)).toBe("EMAIL_AND_PHONE");
  expect(mocks.select).toHaveBeenCalledTimes(1);
  expect(mocks.limit).toHaveBeenCalledWith(1);
 });
 it.each([
  ["EMAIL_ONLY",{email:true,phone:false,primary:"EMAIL"}],
  ["PHONE_ONLY",{email:false,phone:true,primary:"PHONE"}],
  ["PHONE_AND_EMAIL",{email:true,phone:true,primary:"PHONE"}],
  ["EMAIL_AND_PHONE",{email:true,phone:true,primary:"EMAIL"}],
 ] as const)("enforces persisted %s rather than enabling blocked channels",async (method,capabilities)=>{
  mocks.execute.mockResolvedValue({rows:[{present:true}]});
  mocks.limit.mockResolvedValue([{method}]);
  const result=await effectiveCollegeSignInCapabilities(id);
  expect(result).toEqual(capabilities);
  expect(mocks.execute).toHaveBeenCalledTimes(1);
  expect(mocks.limit).toHaveBeenCalledTimes(1);
 });
 it("never treats a corrupt persisted policy as a permissive unconfigured policy",async()=>{
  mocks.execute.mockResolvedValue({rows:[{present:true}]});
  mocks.limit.mockResolvedValue([{method:"UNRECOGNIZED_CHANNEL"}]);
  await expect(effectiveCollegeSignInMethod(id)).rejects.toBeDefined();
  expect(mocks.select).toHaveBeenCalledTimes(1);
 });
});
