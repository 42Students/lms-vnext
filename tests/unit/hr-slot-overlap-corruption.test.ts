import {expect,it} from "vitest";
import {slotsOverlap} from "@/modules/placements/hr-interview-slot-model";
const span=(a:string,b:string)=>({startAt:new Date(a),endAt:new Date(b)});
it("fails closed on invalid intervals instead of treating capacity as available",()=>{
 expect(slotsOverlap(span("invalid","2026-10-20T10:00Z"),span("2026-10-20T11:00Z","2026-10-20T12:00Z"))).toBe(true);
 expect(slotsOverlap(span("2026-10-20T10:00Z","2026-10-20T10:00Z"),span("2026-10-20T11:00Z","2026-10-20T12:00Z"))).toBe(true);
 expect(slotsOverlap(span("2026-10-20T11:00Z","2026-10-20T10:00Z"),span("2026-10-20T11:00Z","2026-10-20T12:00Z"))).toBe(true);
});
it("still permits genuinely adjacent slots and detects overlaps",()=>{
 expect(slotsOverlap(span("2026-10-20T10:00Z","2026-10-20T11:00Z"),span("2026-10-20T11:00Z","2026-10-20T12:00Z"))).toBe(false);
 expect(slotsOverlap(span("2026-10-20T10:00Z","2026-10-20T11:30Z"),span("2026-10-20T11:00Z","2026-10-20T12:00Z"))).toBe(true);
});
