import {describe,it,expect} from "vitest";
import {collegeAdminProfileSections} from "@/modules/people/college-admin-profile-view-model";
import type {OwnAccountSummary} from "@/modules/people/own-account-service";
const account:OwnAccountSummary={
 displayName:"College Admin",email:"admin@example.test",phoneE164:null,
 college:{name:"Example College",code:"COL",organizationName:"Example Org"},
 roles:["COLLEGE_ADMIN"],isSuperAdmin:false,
};
describe("College Admin legacy profile sections",()=>{
  it("uses only the four legacy profile section names",()=>{
    const parts=collegeAdminProfileSections(account);
    expect(parts.map(section=>section.key)).toEqual(["personal","contact","address","social"]);
  });
  it("does not infer absent personal contact or private address/social details",()=>{
    const parts=collegeAdminProfileSections(account);
    expect(parts[1].fields.find(f=>f.label==="Mobile")?.value).toBeNull();
    expect(parts[2].fields).toEqual([]);
    expect(parts[3].fields).toEqual([]);
    expect(JSON.stringify(parts)).not.toContain("identityUid");
    expect(JSON.stringify(parts)).not.toContain("COLLEGE_ADMIN");
  });
});
