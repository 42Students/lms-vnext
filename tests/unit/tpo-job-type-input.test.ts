import {it,expect} from "vitest";
import {tpoJobTypeNameSchema} from "@/modules/placements/tpo-configuration-model";
it("normalizes and bounds custom job type labels",()=>{
 expect(tpoJobTypeNameSchema.parse(" Internship ")).toBe("Internship");
 expect(tpoJobTypeNameSchema.safeParse(" ".repeat(101)).success).toBe(false);
});