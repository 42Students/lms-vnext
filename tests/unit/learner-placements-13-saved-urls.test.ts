import {describe,it,expect} from "vitest";
import {readLearnerDriveUrl,learnerDriveQueryWithChanges} from "@/modules/placements/learner-drive-url-model";

describe("LEARNER-placements-13 saved tab URL",()=>{
 it("LEARNER-placements-13 parses a bookmarked saved view while retaining role filters",()=>{
  const value=readLearnerDriveUrl("saved=1&q=engineer&page=2");
  expect(value.savedOnly).toBe(true);
  expect(value.page).toBe(2);
  expect(value.filters.search).toBe("engineer");
 });
 it("LEARNER-placements-13 strips malformed or duplicate saved filters",()=>{
  expect(readLearnerDriveUrl("saved=2").savedOnly).toBe(false);
  expect(readLearnerDriveUrl("saved=1&saved=1").savedOnly).toBe(false);
 });
 it("LEARNER-placements-13 clears stale pagination when switching All and Saved",()=>{
  const url=learnerDriveQueryWithChanges("q=dev&page=3", {saved:"1"});
  expect(new URLSearchParams(url).get("saved")).toBe("1");
  expect(new URLSearchParams(url).get("page")).toBeNull();
  expect(new URLSearchParams(learnerDriveQueryWithChanges(url,{saved:null})).get("saved")).toBeNull();
 });
});