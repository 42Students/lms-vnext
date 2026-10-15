import {describe,it,expect} from "vitest";
import {collegeContactsQuerySchema,collegeContactsHref} from "@/modules/people/college-contacts-model";

describe("Contact profile availability",()=>{it("round-trips valid facet through filtered contact links and rejects unsupported options",()=>{
 const q=collegeContactsQuerySchema.parse({profile:"UNPROFILED"});expect(collegeContactsHref(q)).toContain("profile=UNPROFILED");expect(collegeContactsQuerySchema.safeParse({profile:"PRIVATE"}).success).toBe(false);
});});

describe("Learner active enrollment",()=>{it("validates and preserves query and URL state",()=>{const x=collegeContactsQuerySchema.parse({enrollment:"ACTIVE"});expect(collegeContactsHref(x)).toContain("enrollment=ACTIVE");expect(collegeContactsQuerySchema.safeParse({enrollment:"UNSUPPORTED"}).success).toBe(false);});});
