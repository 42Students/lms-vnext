import {afterEach,describe,expect,it,vi} from "vitest";
import {effectiveCollegeSignInMethod,effectiveCollegeSignInCapabilities}
 from "@/modules/colleges/public-signin-policy-service";

const {state,read} = vi.hoisted(()=>({
 state:{table:true,record:"PHONE_ONLY" as string|null},
 read:vi.fn(),
}));
vi.mock("@/db/client",()=>({
 getDb:()=>({
  execute:async()=>({rows:[{present:state.table}]}),
  select:()=>({from:()=>({where:()=>({limit:async()=>{
   read();
   return state.record===null?[]:[{method:state.record}];
  }})})}),
 }),
}));
afterEach(()=>{state.table=true;state.record="PHONE_ONLY";read.mockReset();});

describe("Public host-derived college sign-in policy behaviour",()=>{
 it("SA-tenants-public-signin-01 no selected host or unregistered migration preserves legacy email-and-phone fallback",async()=>{
  expect(await effectiveCollegeSignInMethod(null)).toBe("EMAIL_AND_PHONE");
  expect(read).not.toHaveBeenCalled();
  state.table=false;
  expect(await effectiveCollegeSignInMethod("11111111-1111-4111-8111-111111111111"))
   .toBe("EMAIL_AND_PHONE");
  expect(read).not.toHaveBeenCalled();
  state.table=true;state.record=null;
  expect(await effectiveCollegeSignInMethod("11111111-1111-4111-8111-111111111111"))
   .toBe("EMAIL_AND_PHONE");
  expect(read).toHaveBeenCalledTimes(1);
 });
 it("SA-tenants-public-signin-02 enforced PHONE_ONLY and EMAIL_ONLY policies cannot silently reopen a prohibited channel",async()=>{
  const college="11111111-1111-4111-8111-111111111111";
  expect(await effectiveCollegeSignInMethod(college)).toBe("PHONE_ONLY");
  expect(await effectiveCollegeSignInCapabilities(college)).toEqual({
   email:false,phone:true,primary:"PHONE",
  });
  state.record="EMAIL_ONLY";
  expect(await effectiveCollegeSignInCapabilities(college)).toEqual({
   email:true,phone:false,primary:"EMAIL",
  });
  state.record="PHONE_AND_EMAIL";
  expect(await effectiveCollegeSignInCapabilities(college)).toEqual({
   email:true,phone:true,primary:"PHONE",
  });
 });
 it("SA-tenants-public-signin-03 corrupted stored method fails closed instead of falling back to BOTH",async()=>{
  state.record="UNRECOGNIZED";
  await expect(effectiveCollegeSignInMethod("11111111-1111-4111-8111-111111111111"))
   .rejects.toBeDefined();
 });
});
