import {describe,expect,it} from "vitest";
import {facultyLiveSaveFeedback} from "@/modules/courses/faculty-live-save-feedback";
describe("Faculty schedule recovery messages",()=>{
 it("tells staff to refresh stale sessions and reschedule conflicts",()=>{
  expect(facultyLiveSaveFeedback("LESSON_CONTENT_STALE_VERSION")).toContain("Refresh");
  expect(facultyLiveSaveFeedback("SCHEDULE_EVENT_CONFLICT")).toContain("another slot");
 });
 it("never reflects arbitrary error content into the UI",()=>{
  expect(facultyLiveSaveFeedback("<script>alert(1)</script>")).not.toContain("<script>");
 });
});
