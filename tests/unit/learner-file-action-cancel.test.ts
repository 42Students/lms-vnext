import {describe,it,expect} from "vitest";
import {learnerFileUploadMayCancel} from "@/modules/courses/learner-file-action-cancel-model";
describe("learner Assignment file cancellation",()=>{
 it("permits cancellation only while uploading bytes",()=>{
  expect(learnerFileUploadMayCancel("UPLOAD")).toBe(true);
  expect(learnerFileUploadMayCancel("SUBMIT")).toBe(false);
  expect(learnerFileUploadMayCancel(null)).toBe(false);
 });
});
