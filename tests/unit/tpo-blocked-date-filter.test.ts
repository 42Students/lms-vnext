import {expect,it} from "vitest";
import {filterTpoBlockedDates,tpoBlockedDatesEmptyMessage} from "@/modules/placements/tpo-blocked-date-filter-model";
it("filters date-only values without timezone conversion or mutating audit records",()=>{
 const items=[{day:"2026-10-15",reason:"Exams"},{day:"2026-11-02",reason:"Holiday"}];
 expect(filterTpoBlockedDates(items,"exam","2026-10")).toEqual([items[0]]);
 expect(filterTpoBlockedDates(items,"","2026-11")).toEqual([items[1]]);
 expect(tpoBlockedDatesEmptyMessage(items.length)).toContain("match");
 expect(items[0].day).toBe("2026-10-15");
});
