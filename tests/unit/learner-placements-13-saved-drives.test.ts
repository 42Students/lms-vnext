import {describe,it,expect} from "vitest";
import {learnerSavedDriveIds,learnerSavedDriveSummary,learnerSavedDriveCopy} from "@/modules/placements/learner-saved-drives-model";

describe("LEARNER-placements-13 saved drive bookmarks",()=>{
 it("LEARNER-placements-13 deduplicates role options sharing one drive",()=>{
  expect(learnerSavedDriveIds([{jobId:"a"},{jobId:"a"},{jobId:"b"}])).toEqual(["a","b"]);
 });
 it("LEARNER-placements-13 never counts expired or inaccessible saved IDs as open jobs",()=>{
  const summary=learnerSavedDriveSummary(["a","c"],["a","b","b"]);
  expect(summary.saved).toBe(1);
  expect(summary.expired).toBe(1);
  expect([...summary.visibleIds]).toEqual(["a"]);
 });
 it("LEARNER-placements-13 uses the exact legacy saved-drive button and toast text",()=>{
  expect(learnerSavedDriveCopy(false)).toMatchObject({action:"Save for later",toast:"Saved for later",iconLabel:"Not saved",showToast:true});
  expect(learnerSavedDriveCopy(true)).toMatchObject({action:"Remove from saved jobs",toast:"Removed from saved jobs",iconLabel:"Saved",showToast:true});
  expect(learnerSavedDriveCopy(false,"LIST")).toMatchObject({toast:null,showToast:false});
 });
});