import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {hrProfileDetailsSaveReceiptSchema} from "@/modules/placements/recruiter-profile-details-model";
const data={profile:{
 displayName:"Asha Rao",title:"Recruiter",phone:"9876543210",changed:true,
 userUpdatedAt:"2099-01-02T09:00:00.000Z",profileUpdatedAt:"2099-01-02T09:00:00.000Z",
}};
describe("HR-BREAK-PROFILE-RECEIPT-48 save must receive a persisted complete recruiter profile",()=>{
 it("accepts the exact authorized persistence response, including a no-change retry",()=>{
  expect(hrProfileDetailsSaveReceiptSchema.safeParse(data).success).toBe(true);
  expect(hrProfileDetailsSaveReceiptSchema.safeParse({profile:{...data.profile,
   changed:false,phone:"",title:null}}).success).toBe(true);
 });
 it.each([
  null,false,"<html>Sign in</html>",{}, {profile:null},
  {profile:{...data.profile,displayName:""}},
  {profile:{...data.profile,userUpdatedAt:"wrong"}},
  {profile:{...data.profile,profileUpdatedAt:"wrong"}},
  {profile:{...data.profile,changed:"true"}},
  {profile:{...data.profile,phone:"+191234567890"}},
  {profile:{...data.profile,phone:"invalid"}},
 ])("never overwrites an unsent draft from a forged HTTP-200 result %j",value=>{
  expect(hrProfileDetailsSaveReceiptSchema.safeParse(value).success).toBe(false);
 });
 it("checks JSON before setting saved/form state or optimistic timestamps",()=>{
  const src=readFileSync("src/components/hr/recruiter-profile-details-editor.tsx","utf8");
  expect(src).toContain('redirect:"error"');
  const parsed=src.indexOf("hrProfileDetailsSaveReceiptSchema.safeParse(responseBody)");
  expect(parsed).toBeGreaterThan(0);
  expect(src.indexOf("setSaved(next);setForm(next);")).toBeGreaterThan(parsed);
  expect(src.indexOf("setVersions({userUpdatedAt:confirmed.userUpdatedAt")).toBeGreaterThan(parsed);
  expect(src).toContain("Your changes are still here; try again.");
 });
});
