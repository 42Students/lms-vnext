import {describe,it,expect} from "vitest";
import {signInPolicyReadState} from "@/modules/colleges/signin-policy-read-model";
describe("Super Admin stored sign-in state",()=>{
 it("does not invent a preference before migration or first setup",()=>{
 expect(signInPolicyReadState(false,null)).toEqual({kind:"MIGRATION_PENDING",method:null});
 expect(signInPolicyReadState(true,null)).toEqual({kind:"NOT_CONFIGURED",method:null});
 });
 it("accepts only the approved legacy options",()=>{
 expect(signInPolicyReadState(true,"EMAIL_ONLY")).toEqual({kind:"CONFIGURED",method:"EMAIL_ONLY"});
 expect(signInPolicyReadState(true,"NO_AUTH")).toEqual({kind:"INVALID_POLICY",method:null});
 });
});
