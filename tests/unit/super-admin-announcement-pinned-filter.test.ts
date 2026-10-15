import {describe,it,expect} from "vitest";
import {parseSuperAdminAnnouncementParams as parse} from "@/modules/announcements/super-admin-list-query";
import {announcementAdminListSchema} from "@/modules/announcements/validation";
import {parseAnnouncementAdminApiQuery as api} from "@/modules/announcements/admin-api-query";
describe("persisted announcement pin history",()=>{
 it.each(["PINNED","UNPINNED"])("round trips %s",pinned=>{
  expect(parse({pinned})?.pinned).toBe(pinned);
  expect(announcementAdminListSchema.parse({pinned}).pinned).toBe(pinned);
  expect(api(new URLSearchParams("pinned="+pinned))?.pinned).toBe(pinned);
 });
 it("does not accidentally filter Any",()=>expect(parse({pinned:""})?.pinned).toBeUndefined());
 it("rejects malformed pin state and duplicates",()=>{
  expect(parse({pinned:"yes"})).toBeNull();
  expect(api(new URLSearchParams("pinned=PINNED&pinned=UNPINNED"))).toBeNull();
 });
});
