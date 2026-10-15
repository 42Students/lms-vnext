import {describe,it,expect} from "vitest";
import {tpoGridTimeLabel} from "@/modules/placements/tpo-grid-time-label";
describe("TPO applications spreadsheet time label",()=>{
 it("does not render Invalid Date or expose invalid imported timestamps",()=>{
  expect(tpoGridTimeLabel("not-a-date")).toBe("Date unavailable");
  expect(tpoGridTimeLabel("")).toBe("Date unavailable");
  expect(tpoGridTimeLabel(null)).toBe("Date unavailable");
 });
 it("formats confirmed instants in the college IST timezone",()=>{
  expect(tpoGridTimeLabel("2026-10-15T00:00:00.000Z")).toContain("IST");
  expect(tpoGridTimeLabel("2026-10-15T00:00:00.000Z")).not.toContain("Invalid");
 });
});
