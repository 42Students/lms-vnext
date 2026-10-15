import {describe,expect,it} from "vitest";
import {authoringDueInstant,authoringLocalDateTime} from "@/modules/courses/faculty-authoring-datetime-model";
describe("Faculty live class fixed IST wall time",()=>{
 it("uses the same instant across device time zones",()=>{
  const instant=authoringDueInstant("2026-11-02T09:30");
  expect(instant).toBe("2026-11-02T04:00:00.000Z");
  expect(authoringLocalDateTime(instant)).toBe("2026-11-02T09:30");
 });
 it("rejects invalid wall clock dates rather than falling back to device timezone",()=>{
  expect(()=>authoringDueInstant("2026-02-30T09:30")).toThrow();
 });
});
