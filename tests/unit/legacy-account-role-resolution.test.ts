import {describe,it,expect} from "vitest";
import {resolveLegacyAccountRole,reconcileLegacyAccountRoleEvidence} from "@/modules/identity/constants";

describe("legacy portal role to vNext membership/profile import mapping",()=>{
  const cases=[
    ["LEARNER",null,null,"MEMBERSHIP","LEARNER"],
    ["FACULTY",null,35,"MEMBERSHIP","FACULTY"],
    ["FACULTY","MENTOR",35,"MEMBERSHIP","MENTOR"],
    ["FACULTY","TPO",35,"MEMBERSHIP","TPO"],
    ["FACULTY","ADMIN",35,"MEMBERSHIP","COLLEGE_ADMIN"],
    ["FACULTY","ADMIN",0,"SYSTEM","SUPER_ADMIN"],
    ["RECRUITER",null,15,"RECRUITER_PROFILE","RECRUITER"],
    ["ADMIN",null,15,"MEMBERSHIP","COLLEGE_ADMIN"],
    ["USER",null,0,"UNMAPPED",null],
  ] as const;
  for(const [userType,facultyType,id,kind,role] of cases){
    it(userType+"/"+String(facultyType)+"/"+String(id),()=>{
      const result=resolveLegacyAccountRole(userType,facultyType,id);
      expect(result.kind).toBe(kind);
      expect("role" in result?result.role:null).toBe(role);
    });
  }
  it("refuses to trust conflicting stored and claimed faculty types",()=>{
    expect(reconcileLegacyAccountRoleEvidence({
      userType:"FACULTY",facultyType:"FACULTY",legacyPersonId:22,
      claimedUserType:"FACULTY",claimedFacultyType:"ADMIN",claimedSubjectId:22,
    })).toEqual({kind:"UNMAPPED"});
  });
  it("does not promote a faculty identity to superadmin from a forged claim",()=>{
    expect(reconcileLegacyAccountRoleEvidence({
      userType:"FACULTY",facultyType:"ADMIN",legacyPersonId:25,
      claimedUserType:"FACULTY",claimedFacultyType:"ADMIN",claimedSubjectId:"0",
    })).toEqual({kind:"UNMAPPED"});
  });
});
