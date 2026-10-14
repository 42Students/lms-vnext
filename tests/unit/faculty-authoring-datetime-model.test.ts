import {describe,expect,it} from "vitest";
import {assignmentActionAvailable,authoringLocalDateTime,authoringDueInstant}
 from "@/modules/courses/faculty-authoring-datetime-model";
describe("Faculty assignment due date and lifecycle view",()=>{
 it("displays the stored ISO instant as device-local datetime-local",()=>{
  const instant="2026-10-21T04:00:00.000Z";
  expect(authoringDueInstant(authoringLocalDateTime(instant))).toBe(instant);
  expect(authoringLocalDateTime(null)).toBe("");
  expect(authoringDueInstant("")).toBeNull();
  expect(()=>authoringDueInstant("invalid")).toThrow(/valid/);
 });
 it("does not offer archived or published draft edits",()=>{
  expect(assignmentActionAvailable(null,"CREATE")).toBe(true);
  expect(assignmentActionAvailable("DRAFT","EDIT")).toBe(true);
  expect(assignmentActionAvailable("PUBLISHED","EDIT")).toBe(false);
  expect(assignmentActionAvailable("PUBLISHED","ARCHIVE")).toBe(true);
  expect(assignmentActionAvailable("ARCHIVED","ARCHIVE")).toBe(false);
 });
});
