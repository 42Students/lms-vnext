import {describe,it,expect} from "vitest";
import {parseSuperAdminAnnouncementParams as parse} from "@/modules/announcements/super-admin-list-query";
describe("Super Admin DB10 blank announcement search",()=>{
 it("accepts empty and whitespace-only form query",()=>{
  expect(parse({q:""})?.q).toBeUndefined();
  expect(parse({q:"   "})?.q).toBeUndefined();
  expect(parse({q:"\t "})?.q).toBeUndefined();
 });
 it("keeps nonempty literal search",()=>expect(parse({q:"  pinned%_  "})?.q).toBe("pinned%_"));
 it("denies repeated or unknown filters",()=>{
  expect(parse({q:["first","second"]})).toBeNull();
  expect(parse({q:"abc",other:"x"})).toBeNull();
 });
});
