import { describe, expect, it } from "vitest";
import { facultyContentPatch } from "@/modules/courses/faculty-content-edit-model";

describe("Faculty Section-owned Blueprint content updates", () => {
  it("normalizes Resource metadata without changing ownership", () => {
    expect(facultyContentPatch({ kind:"RESOURCE", title:" A ", notes:" B ", url:"" }))
      .toEqual({ title:"A", notes:"B", externalUrl:null });
  });
  it("requires content and HTTPS; respects existing private Resource storage", () => {
    expect(() => facultyContentPatch({ kind:"RESOURCE", title:"A", notes:"", url:"" })).toThrow();
    expect(facultyContentPatch({ kind:"RESOURCE", title:"A", notes:"", url:"", hasStoredResource:true }))
      .toHaveProperty("title","A");
    expect(() => facultyContentPatch({ kind:"RESOURCE", title:"A", notes:"", url:"http://example.test" })).toThrow("HTTPS");
  });
  it("rejects non-YouTube domains and invalid duration", () => {
    const base = { kind:"YOUTUBE" as const, title:"Video", notes:"", url:"https://youtu.be/x", duration:"20" };
    expect(facultyContentPatch(base)).toHaveProperty("durationSeconds",20);
    expect(() => facultyContentPatch({...base, url:"https://example.test"})).toThrow("youtube.com");
    expect(() => facultyContentPatch({...base, duration:"0"})).toThrow("Duration");
  });
  it("rejects backwards live-class schedule and normalizes valid instants", () => {
    const base = {kind:"LIVE_CLASS" as const, title:"Class", notes:"", url:"https://meet.example.test", starts:"2026-10-13T09:00", ends:"2026-10-13T10:00"};
    expect(facultyContentPatch(base)).toHaveProperty("startsAt","2026-10-13T03:30:00.000Z");
    expect(() => facultyContentPatch({...base, ends:base.starts})).toThrow("after");
  });
});
