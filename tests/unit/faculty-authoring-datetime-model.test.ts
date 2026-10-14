import {describe,expect,it} from "vitest";
import {assignmentActionAvailable,authoringLocalDateTime,authoringDueInstant}
 from "@/modules/courses/faculty-authoring-datetime-model";
describe("Faculty assignment due date and lifecycle view",()=>{
 it("displays and saves the stored deadline in IST on any device",()=>{
  const instant="2026-10-21T04:00:00.000Z";
  expect(authoringLocalDateTime(instant)).toBe("2026-10-21T09:30");
  expect(authoringDueInstant(authoringLocalDateTime(instant))).toBe(instant);
  expect(authoringDueInstant("2026-10-21T00:15")).toBe("2026-10-20T18:45:00.000Z");
  expect(authoringDueInstant("2028-02-29T23:59")).toBe("2028-02-29T18:29:00.000Z");
  for (const invalid of ["2026-02-29T09:00", "2026-04-31T09:00", "2026-10-21T24:00", "0000-01-01T00:00", "2026-10-21T09:00Z"]) {
    expect(() => authoringDueInstant(invalid)).toThrow(/IST/);
  }
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
