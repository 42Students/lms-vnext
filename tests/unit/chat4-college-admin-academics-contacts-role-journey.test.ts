import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { RequestContext } from "@/modules/identity/context";
import { can, requirePermission, AuthorizationError } from "@/modules/permissions/policy";
import {
  collegeContactsQuerySchema,
  collegeContactsTabHref,
  collegeContactsWithoutMemberHref,
  clearedCollegeContactsHref,
  parseCollegeContactsSearchParams,
} from "@/modules/people/college-contacts-model";
import { contactRecordLinks } from "@/modules/people/college-contacts-links";

const org = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const college = "11111111-1111-4111-8111-111111111111";
const foreign = "22222222-2222-4222-8222-222222222222";
const member = "33333333-3333-4333-8333-333333333333";
const admin: RequestContext = {
  user: { id:"user",identityUid:"uid",platformStatus:"ACTIVE",systemRoles:[] },
  membership: { id:member,organizationId:org,collegeId:college,status:"ACTIVE",roles:["COLLEGE_ADMIN"] },
};
const source = (path: string) => readFileSync(join(process.cwd(),path),"utf8");
const scope = (id = college) => ({ collegeId:id,organizationId:org });

describe("College Admin people and academic journey security", () => {
  it("COL-ADMIN-JOURNEY-01 grants academic and people mutations only to the active same-tenant College Admin", () => {
    for(const permission of ["academics.manage","people.manage","department.manage","college.manage","membership.lifecycle.manage"] as const){
      expect(can(admin,permission,scope())).toBe(true);
      expect(() => requirePermission(admin,permission,scope())).not.toThrow();
      expect(can(admin,permission,scope(foreign))).toBe(false);
      expect(() => requirePermission(admin,permission,scope(foreign))).toThrow(AuthorizationError);
      expect(can({...admin,membership:{...admin.membership!,status:"SUSPENDED"}},permission,scope())).toBe(false);
      expect(can({...admin,membership:{...admin.membership!,status:"ENDED"}},permission,scope())).toBe(false);
      expect(can({...admin,user:{...admin.user,platformStatus:"DISABLED"}},permission,scope())).toBe(false);
      expect(can({...admin,membership:{...admin.membership!,roles:["FACULTY"]}},permission,scope())).toBe(false);
      expect(can({...admin,membership:{...admin.membership!,roles:["LEARNER"]}},permission,scope())).toBe(false);
      expect(can({...admin,membership:{...admin.membership!,roles:["TPO"]}},permission,scope())).toBe(false);
    }
    expect(can(admin,"organization.manage",{organizationId:org})).toBe(false);
    expect(can(admin,"admin-scope.select")).toBe(false);
  });

  it("COL-ADMIN-JOURNEY-02 contacts user flow preserves filters on tabs and clears exact bookmarks safely", () => {
    const filter = collegeContactsQuerySchema.parse({
      tab:"STUDENT",audience:"DUAL",membershipId:member,q:"Ananya",page:9,pageSize:50,
    });
    const all = new URL(collegeContactsTabHref(filter,"ALL"),"https://example.edu");
    expect(all.pathname).toBe("/college/contacts");
    expect(all.searchParams.get("tab")).toBeNull();
    expect(all.searchParams.get("membershipId")).toBe(member);
    expect(all.searchParams.get("q")).toBe("Ananya");
    expect(all.searchParams.get("page")).toBeNull();
    const removed = new URL(collegeContactsWithoutMemberHref(filter),"https://example.edu");
    expect(removed.searchParams.get("membershipId")).toBeNull();
    expect(removed.searchParams.get("q")).toBe("Ananya");
    expect(removed.searchParams.get("page")).toBeNull();
    expect(clearedCollegeContactsHref("STUDENT")).toBe("/college/contacts?tab=STUDENT");
    expect(() => parseCollegeContactsSearchParams({tab:"FACULTY",audience:"LEARNER_ONLY"})).toThrow("INVALID_CONTACT_ROLE_AUDIENCE");
  });

  it("COL-ADMIN-JOURNEY-03 role-specific links use membership IDs rather than untrusted user identities", () => {
    expect(contactRecordLinks({membershipId:member,roles:["LEARNER"]})).toEqual([
      {label:"Student details",href:"/college/students/"+member},
    ]);
    expect(contactRecordLinks({membershipId:member,roles:["FACULTY"]})).toEqual([
      {label:"Faculty details",href:"/college/faculty/"+member},
    ]);
    expect(contactRecordLinks({membershipId:member,roles:["FACULTY","LEARNER"]})).toHaveLength(2);
    expect(contactRecordLinks({membershipId:member,roles:[]})).toEqual([]);
  });

  it("COL-ADMIN-JOURNEY-04 contacts page gates role before reads and maintains masked student CSV, partial, empty and recovery", () => {
    const page=source("src/app/(authenticated)/college/contacts/page.tsx");
    const redirect=page.indexOf('hasMembershipRole(context,"COLLEGE_ADMIN")');
    const read=page.indexOf("listCollegeContacts(context,filter)");
    expect(redirect).toBeGreaterThan(-1);
    expect(read).toBeGreaterThan(redirect);
    expect(page).toContain("parseCollegeContactsSearchParams(raw)");
    expect(page).toContain("Invalid contact filters");
    expect(page).toContain("Reset contact filters");
    expect(page).toContain("Student contact details are masked");
    expect(page).toContain("Exports are capped at 1,000");
    expect(page).toContain("No matching contacts in this college.");
    expect(page).toContain("First 200 classes shown.");
    expect(page).toContain("Faculty contacts");
    expect(page).toContain("min-h-11");
    const service=source("src/modules/people/college-contacts-service.ts");
    expect(service).toContain('assertPersistedPlatformPermission(tx,context,"people.manage"');
    expect(service).toContain("eq(collegeMemberships.collegeId,claim.collegeId)");
    expect(service).toContain("isLearner:memberRoles.includes(\"LEARNER\")");
    expect(service).toContain("A masked learner contact must not become guessable via search queries.");
    expect(service).toContain('eq(membershipRoles.role,role)');
  });

  it("COL-ADMIN-JOURNEY-05 class/elective pages reject malformed filters rather than reading a wider dataset", () => {
    for(const kind of ["classes","electives"]){
      const page=source("src/app/(authenticated)/college/"+kind+"/page.tsx");
      expect(page).toContain("readCollegeStructureParams(await searchParams)");
      expect(page).toContain(".safeParse(raw)");
      expect(page).toContain("<ErrorState");
      expect(page).toContain("Clear filters");
    }
  });
});
