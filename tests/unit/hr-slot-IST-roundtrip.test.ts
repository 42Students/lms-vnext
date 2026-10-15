import {expect,it} from "vitest";
import {parseIstLocalSlot} from "@/modules/placements/hr-interview-slot-model";
it("rejects invalid India-local month/day combinations regardless of locale display order",()=>{
 expect(parseIstLocalSlot("2026-12-20T09:30")).toBe("2026-12-20T09:30:00+05:30");
 expect(()=>parseIstLocalSlot("2026-02-30T10:30")).toThrow("INVALID_IST_DATE");
 expect(()=>parseIstLocalSlot("2026-13-20T09:30")).toThrow();
});
