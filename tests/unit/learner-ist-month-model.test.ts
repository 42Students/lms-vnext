import {describe,expect,it} from "vitest";
import {istCalendarDay,istDayAgenda,istMonthGridKeys} from "@/components/academics/learner-ist-month-model";
describe("IST-safe learner schedule calendar",()=>{
  it("groups UTC instants at India midnight regardless of local timezone",()=>{
    expect(istCalendarDay("2026-10-01T18:29:59.000Z")).toBe("2026-10-01");
    expect(istCalendarDay("2026-10-01T18:30:00.000Z")).toBe("2026-10-02");
    expect(istDayAgenda([
      {startsAt:"2026-10-01T18:30:00.000Z",id:"late"},
      {startsAt:"2026-10-02T01:00:00.000Z",id:"early"},
    ],"2026-10-02").map(x=>x.id)).toEqual(["late","early"]);
  });
  it("renders six full Sunday-first weeks across month/year boundaries",()=>{
    const grid=istMonthGridKeys(2026,10);
    expect(grid).toHaveLength(42);
    expect(grid[0]).toBe("2026-09-27");
    expect(grid[4]).toBe("2026-10-01");
    expect(grid[41]).toBe("2026-11-07");
    expect(()=>istMonthGridKeys(2026,13)).toThrow();
  });
});
