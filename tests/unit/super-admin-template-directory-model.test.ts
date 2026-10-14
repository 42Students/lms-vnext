import {describe,expect,it} from "vitest";
import {templateDirectoryQuerySchema,templateDirectoryPages,templateDirectoryHref} from "@/modules/projects/super-admin-template-directory-model";
describe("Super Admin template catalogue filters",()=>{
 it("supports exact status, limited page and search",()=>{
  expect(templateDirectoryQuerySchema.safeParse({status:"PUBLISHED",page:"2"}).success).toBe(true);
  expect(templateDirectoryQuerySchema.safeParse({status:"DELETED"}).success).toBe(false);
  expect(templateDirectoryQuerySchema.safeParse({page:"1001"}).success).toBe(false);
  expect(templateDirectoryQuerySchema.safeParse({collegeId:"forged"}).success).toBe(false);
 });
 it("retains filters in internal next-page route",()=>{
  expect(templateDirectoryHref({q:"alpha",status:"DRAFT",page:2}))
   .toBe("/admin/projects/templates?q=alpha&status=DRAFT&page=2");
  expect(templateDirectoryPages(41)).toBe(3);
 });
});
