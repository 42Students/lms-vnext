import {describe,it,expect} from "vitest";
import {can} from "@/modules/permissions/policy";
import {effectiveTpoVerifierSetting} from "@/modules/verification/switch-state";
describe("TPO verification setting gate",()=>{it("requires grant and enabled switch, not just a role",()=>{
 const context={user:{id:"u",identityUid:"id",platformStatus:"ACTIVE" as const,systemRoles:[]},
 membership:{id:"m",collegeId:"c",organizationId:"o",status:"ACTIVE" as const,roles:["TPO" as const]}};
 expect(can(context,"profile-verification.review",{collegeId:"c",organizationId:"o",tpoVerificationEnabled:false,tpoVerificationAdministrator:true})).toBe(false);
 expect(can(context,"profile-verification.review",{collegeId:"c",organizationId:"o",tpoVerificationEnabled:true,tpoVerificationAdministrator:true})).toBe(true);
});});

describe("server-loaded TPO setting",()=>{it("renders the persisted false or true without a separate hydration fetch",()=>{
 expect(effectiveTpoVerifierSetting(undefined)).toBe(true);
 expect(effectiveTpoVerifierSetting({enabled:false})).toBe(false);
 expect(effectiveTpoVerifierSetting({enabled:true})).toBe(true);
});});
