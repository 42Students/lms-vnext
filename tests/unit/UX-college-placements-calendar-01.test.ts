import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/placements/calendar/page.tsx"),"utf8");
describe("/college/placements/calendar UX",()=>{
 it("UX-college-placements-calendar-01 keeps audited user-visible behavior",()=>expect(source).toContain("PlacementCalendarWorkspace"));
 it("UX-college-placements-calendar-02 keeps audited user-visible behavior",()=>expect(source).toContain("audience=\"COLLEGE_ADMIN\""));
});
