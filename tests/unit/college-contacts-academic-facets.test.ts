import {describe,it,expect} from "vitest";
import {collegeContactsQuerySchema,collegeContactsHref} from "@/modules/people/college-contacts-model";

describe("Contact profile availability",()=>{it("round-trips valid facet through filtered contact links and rejects unsupported options",()=>{
 const q=collegeContactsQuerySchema.parse({profile:"UNPROFILED"});expect(collegeContactsHref(q)).toContain("profile=UNPROFILED");expect(collegeContactsQuerySchema.safeParse({profile:"PRIVATE"}).success).toBe(false);
});});
