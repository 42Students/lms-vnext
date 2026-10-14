import {describe,expect,it} from "vitest";
import { adminContentHref,adminContentQuerySchema,contentTypesForKind,adminContentTypeLabel } from "@/modules/courses/super-admin-content-directory-model";
describe("Super Admin Videos directory pure model",()=>{
 it("includes hosted and YouTube videos, not other content",()=>{
  expect(contentTypesForKind("VIDEOS")).toEqual(["VIDEO","YOUTUBE"]);
  expect(adminContentTypeLabel("YOUTUBE")).toBe("YouTube");
 });
 it("enforces bounded query and stable navigation",()=>{
  expect(adminContentQuerySchema.safeParse({page:0}).success).toBe(false);
  expect(adminContentQuerySchema.safeParse({status:"PRIVATE"}).success).toBe(false);
  expect(adminContentHref("VIDEOS",{q:"React & SQL",status:"PUBLISHED",page:2}))
   .toContain("/admin/videos?q=React+%26+SQL&status=PUBLISHED&page=2");
 });
});
