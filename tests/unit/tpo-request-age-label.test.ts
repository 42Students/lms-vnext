import {it,expect} from "vitest";
import {tpoRequestAgeLabel} from "@/modules/placements/tpo-global-requests-model";
const now=new Date("2026-10-15T12:00:00Z");
it("uses one page clock and exact elapsed intervals, not browser-local calendar dates",()=>{
 expect(tpoRequestAgeLabel(new Date("2026-10-15T11:01:00Z"),now)).toBe("Less than 1 hour old");
 expect(tpoRequestAgeLabel(new Date("2026-10-15T10:00:00Z"),now)).toBe("2 hours old");
 expect(tpoRequestAgeLabel(new Date("2026-10-14T11:00:00Z"),now)).toBe("1 day old");
 expect(tpoRequestAgeLabel(new Date("2026-10-13T11:00:00Z"),now)).toBe("2 days old");
 expect(tpoRequestAgeLabel(new Date("2026-10-16T12:00:00Z"),now)).toBe("Less than 1 hour old");
});
