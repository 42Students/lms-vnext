import {describe,it,expect} from "vitest";
import {collegeContentTypes,collegeContentHref,collegeContentQuerySchema}
 from "@/modules/courses/college-content-aggregate-model";
import {collegeLiveClassQuerySchema,liveClassSearchParams,liveClassIstSchedule,collegeLiveClassHref,istDayBoundary}
 from "@/modules/courses/college-live-classes-model";
describe("college live class read model",()=>{
 it("uses only migrated LIVE_CLASS type and strict college-independent parameters",()=>{
  expect(collegeContentTypes("LIVE_CLASS")).toEqual(["LIVE_CLASS"]);
  expect(collegeLiveClassQuerySchema.safeParse({collegeId:"foreign"}).success).toBe(false);
  expect(collegeLiveClassQuerySchema.safeParse({format:"VIDEO"}).success).toBe(false);
  expect(liveClassSearchParams({q:["a","b"]})).toBeNull();
  expect(collegeLiveClassQuerySchema.safeParse({page:1001}).success).toBe(false);
  expect(collegeLiveClassQuerySchema.safeParse({courseCode:"x".repeat(65)}).success).toBe(false);
  expect(collegeLiveClassHref({...collegeLiveClassQuerySchema.parse({courseCode:"CS A"}),page:2})).toContain("courseCode=CS+A");
  expect(collegeLiveClassQuerySchema.parse({view:"UPCOMING"}).view).toBe("UPCOMING");
  expect(collegeLiveClassQuerySchema.safeParse({view:"COMING"}).success).toBe(false);
  expect(collegeLiveClassQuerySchema.safeParse({from:"2026-11-02",to:"2026-11-01"}).success).toBe(false);
  expect(collegeLiveClassQuerySchema.safeParse({from:"2026-10-01",to:"2026-11-02"}).success).toBe(false);
  expect(collegeLiveClassQuerySchema.safeParse({from:"2026-02-30"}).success).toBe(false);
  expect(collegeLiveClassQuerySchema.parse({from:"2026-11-01"}).from).toBe("2026-11-01");
  expect(istDayBoundary("2026-11-01").toISOString()).toBe("2026-10-31T18:30:00.000Z");
  expect(collegeLiveClassHref({...collegeLiveClassQuerySchema.parse({view:"PAST"}),page:2})).toContain("view=PAST");
  const q=collegeContentQuerySchema.parse({q:"a & b",page:2});
  const href=collegeContentHref("LIVE_CLASS",q);
  expect(new URL(href,"https://example.test").pathname).toBe("/college/live-classes");
  expect(href).toContain("q=a+%26+b");
 });
 it("formats bounded time evidence in IST, not server-local timezone",()=>{
  expect(liveClassIstSchedule(null,null)).toBe("Schedule not recorded");
  expect(liveClassIstSchedule(new Date("2026-10-15T05:00:00Z"),
    new Date("2026-10-15T06:00:00Z"))).toContain("IST");
 });
});
