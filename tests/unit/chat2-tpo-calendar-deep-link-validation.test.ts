import {describe,it,expect} from "vitest";
import {parseTpoCalendarUrl} from "../../src/modules/placements/tpo-calendar-url-model";
describe("TPO calendar URL validation",()=>{
 it("accepts a valid IST schedule calendar day and filter",()=>{
  expect(parseTpoCalendarUrl({date:"2026-10-15",view:"week",kind:"ROUND",company:"Company"}).success).toBe(true);
 });
 it("rejects calendar rollover dates, invalid views and unbounded names",()=>{
  expect(parseTpoCalendarUrl({date:"2026-02-30"}).success).toBe(false);
  expect(parseTpoCalendarUrl({view:"all-years"}).success).toBe(false);
  expect(parseTpoCalendarUrl({company:"x".repeat(151)}).success).toBe(false);
 });
 it("permits empty event-kind selection and omitted filters",()=>{
  expect(parseTpoCalendarUrl({kind:""}).success).toBe(true);
  expect(parseTpoCalendarUrl({}).success).toBe(true);
 });
});
