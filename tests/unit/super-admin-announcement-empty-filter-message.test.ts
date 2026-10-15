import {describe,it,expect} from "vitest";
import {announcementHistoryEmptyMessage as message} from "@/modules/announcements/admin-history-empty-model";
describe("Super Admin notice empty state",()=>{
 it("distinguishes filtered no-match",()=>expect(message({hasFilters:true})).toContain("Clear filters"));
 it("describes unfiltered new tenant history",()=>expect(message({hasFilters:false})).toContain("No announcements have been published"));
 it("never claims DB10 publication success",()=>{
  expect(message({hasFilters:false})).not.toContain("published successfully");
 });
});
