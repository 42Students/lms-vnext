import {describe,expect,it} from "vitest";
import {adminContentHref,adminContentQuerySchema,contentTypesForKind} from "@/modules/courses/super-admin-content-directory-model";
describe("Super Admin resource directory pure model",()=>{
 it("returns only resource type, not video or live events",()=>{
  expect(contentTypesForKind("RESOURCES")).toEqual(["RESOURCE"]);
  expect(contentTypesForKind("RESOURCES")).not.toContain("VIDEO");
 });
 it("rejects rogue scope keys, invalid status/page and round trips a filtered URL",()=>{
  expect(adminContentQuerySchema.safeParse({collegeId:"other"}).success).toBe(false);
  expect(adminContentQuerySchema.safeParse({page:"0"}).success).toBe(false);
  expect(adminContentQuerySchema.safeParse({status:"SHARED"}).success).toBe(false);
  expect(adminContentHref("RESOURCES",{q:"A+B",status:"PUBLISHED",page:2}))
   .toContain("/admin/resources?q=A%2BB&status=PUBLISHED&page=2");
 });
});
