import {expect,it} from "vitest";
import {parseIstLocalSlot} from "@/modules/placements/hr-interview-slot-model";
it("converts India-local date input deterministically with explicit offset",()=>{
 expect(parseIstLocalSlot("2026-10-20T10:30")).toBe("2026-10-20T10:30:00+05:30");
 expect(()=>parseIstLocalSlot("2026-02-30T10:30")).toThrow();
 expect(()=>parseIstLocalSlot("2026-10-20T10:30Z")).toThrow();
});
