import {expect,it} from "vitest";
import {globalTpoRequestsQuerySchema,isTpoRequestOlderThan} from "@/modules/placements/tpo-global-requests-model";
it("treats age as a strict older-than threshold and uses an explicit server clock",()=>{
 const now=new Date("2026-10-15T10:00:00Z");
 expect(isTpoRequestOlderThan(new Date("2026-10-08T09:59:59Z"),now,7)).toBe(true);
 expect(isTpoRequestOlderThan(new Date("2026-10-08T10:00:00Z"),now,7)).toBe(false);
 expect(isTpoRequestOlderThan(new Date("2026-10-14T10:00:00Z"),now,7)).toBe(false);
 expect(globalTpoRequestsQuerySchema.safeParse({age:"UNKNOWN"}).success).toBe(false);
});
