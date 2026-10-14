import {describe,expect,it} from "vitest";
import {adminUsersQuerySchema,adminUsersHref,adminUsersPageCount,roleForPeopleTab,adminPeopleSearchState} from "@/modules/people/admin-user-directory-model";
describe("Super Admin user-role directory query",()=>{
 it("supports only allowed statuses, known roles, bounded pages",()=>{
  expect(adminUsersQuerySchema.safeParse({platformStatus:"DISABLED"}).success).toBe(true);
  expect(adminUsersQuerySchema.safeParse({platformStatus:"SUSPENDED"}).success).toBe(false);
  expect(adminUsersQuerySchema.safeParse({role:"HR"}).success).toBe(false);
  expect(adminUsersQuerySchema.safeParse({page:100001}).success).toBe(false);
 });
 it("preserves filters in scoped pagination URLs",()=>{
  expect(adminUsersHref({tab:"ALL",q:"x",role:"FACULTY",membershipStatus:"ACTIVE",platformStatus:"ALL",page:2}))
    .toBe("/admin/people/directory?q=x&role=FACULTY&membershipStatus=ACTIVE&page=2");
  expect(adminUsersPageCount(31)).toBe(2);
  expect(adminPeopleSearchState({tab:"STUDENT",role:"TPO"})).toEqual({
    hiddenTab:"STUDENT",showExplicitRoleFilter:false,effectiveRole:"LEARNER",
  });
  expect(adminPeopleSearchState({tab:"ALL",role:"TPO"}).showExplicitRoleFilter).toBe(true);
  expect(roleForPeopleTab({tab:"STUDENT",role:"ALL"})).toBe("LEARNER");
  expect(roleForPeopleTab({tab:"FACULTY",role:"TPO"})).toBe("FACULTY");
  expect(adminUsersHref({tab:"STUDENT",q:"",role:"ALL",membershipStatus:"ALL",platformStatus:"ALL",page:1}))
    .toBe("/admin/people/directory?tab=STUDENT");
 });
});
