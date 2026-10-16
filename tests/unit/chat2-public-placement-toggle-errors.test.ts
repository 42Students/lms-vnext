import {describe,expect,it} from "vitest";
import {PUBLIC_PLACEMENT_TOGGLE_ERRORS} from "@/components/placements/tpo-public-placement-toggle";
describe("TPO-campaigns-public-32 publication UI error copy",()=>{
 it("explains the minimum privacy cohort",()=>expect(PUBLIC_PLACEMENT_TOGGLE_ERRORS.small).toContain("five consented learners"));
 it("explains unavailable publication storage",()=>expect(PUBLIC_PLACEMENT_TOGGLE_ERRORS.unavailable).toContain("unavailable"));
});
