import {describe,expect,it} from "vitest";
import {AuthorizationError} from "@/modules/permissions/policy";
import type {RequestContext} from "@/modules/identity/context";
import {ownLearnerProfilePrincipalMatches,type LearnerProfilePrincipal} from "@/modules/people/learner-profile-access-model";
import {learnerProfileAcademicRecovery} from "@/modules/people/learner-profile-recovery-model";
const ctx:RequestContext={user:{id:"actor",identityUid:"id",platformStatus:"ACTIVE",systemRoles:[]},membership:{id:"member",collegeId:"college",organizationId:"org",status:"ACTIVE",roles:["LEARNER"]}};
const own:LearnerProfilePrincipal={membershipId:"member",userId:"actor",collegeId:"college",organizationId:"org",status:"ACTIVE",platformStatus:"ACTIVE",role:"LEARNER"};
describe("profile ownership and partial academic recovery",()=>{
  it("matches actual own active learner and rejects every mismatched persisted scope",()=>{
    expect(ownLearnerProfilePrincipalMatches(ctx,own)).toBe(true);
    expect(ownLearnerProfilePrincipalMatches(ctx,null)).toBe(false);
    for(const [key,value] of Object.entries({membershipId:"foreign",userId:"foreign",collegeId:"foreign",organizationId:"foreign",status:"SUSPENDED",platformStatus:"DISABLED",role:"FACULTY"})){
      expect(ownLearnerProfilePrincipalMatches(ctx,{...own,[key]:value})).toBe(false);
    }
    expect(ownLearnerProfilePrincipalMatches({...ctx,membership:{...ctx.membership!,roles:["TPO"]}},own)).toBe(false);
    expect(ownLearnerProfilePrincipalMatches({...ctx,user:{...ctx.user,platformStatus:"DISABLED"}},own)).toBe(false);
  });
  it("separates an unavailable academic read from an actual missing enrollment",()=>{
    expect(learnerProfileAcademicRecovery({status:"fulfilled",value:{enrollment:null}})).toEqual({available:true,summary:{enrollment:null}});
    expect(learnerProfileAcademicRecovery({status:"rejected",reason:new Error("private database details")})).toEqual({available:false,summary:null});
  });
  it("propagates authorization revocation instead of rendering a partial profile",()=>{
    const denial=new AuthorizationError("academics.read");
    expect(()=>learnerProfileAcademicRecovery({status:"rejected",reason:denial})).toThrow(denial);
  });
});
