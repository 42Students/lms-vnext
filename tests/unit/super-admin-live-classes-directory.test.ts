import {describe,expect,it} from "vitest";
import {adminContentHref,adminContentQuerySchema,contentTypesForKind,adminContentTypeLabel} from "@/modules/courses/super-admin-content-directory-model";
describe("Super Admin Live Classes directory pure model",()=>{
 it("only includes persisted LIVE_CLASS content, never VIDEO or RESOURCE",()=>{
  expect(contentTypesForKind("LIVE_CLASSES")).toEqual(["LIVE_CLASS"]);
  expect(adminContentTypeLabel("LIVE_CLASS")).toBe("Live class");
 });
 it("requires recognized status and bounded page with URL-safe search",()=>{
  expect(adminContentQuerySchema.safeParse({page:"1001"}).success).toBe(false);
  expect(adminContentQuerySchema.safeParse({status:"CANCELLED"}).success).toBe(false);
  expect(adminContentQuerySchema.safeParse({q:["one","two"]}).success).toBe(false);
  expect(adminContentHref("LIVE_CLASSES",{q:"Physics & AI",status:"PUBLISHED",page:2}))
   .toContain("/admin/live-classes?q=Physics+%26+AI&status=PUBLISHED&page=2");
 });
});
