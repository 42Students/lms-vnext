import {describe,it,expect} from "vitest";
import {collegeContactsQuerySchema,collegeContactsHref} from "@/modules/people/college-contacts-model";

describe("Contact profile availability",()=>{it("round-trips valid facet through filtered contact links and rejects unsupported options",()=>{
 const q=collegeContactsQuerySchema.parse({profile:"UNPROFILED"});expect(collegeContactsHref(q)).toContain("profile=UNPROFILED");expect(collegeContactsQuerySchema.safeParse({profile:"PRIVATE"}).success).toBe(false);
});});

describe("Learner active enrollment",()=>{it("validates and preserves query and URL state",()=>{const x=collegeContactsQuerySchema.parse({enrollment:"ACTIVE"});expect(collegeContactsHref(x)).toContain("enrollment=ACTIVE");expect(collegeContactsQuerySchema.safeParse({enrollment:"UNSUPPORTED"}).success).toBe(false);});});

describe("Faculty current teaching",()=>{it("validates and preserves query and URL state",()=>{const x=collegeContactsQuerySchema.parse({teaching:"ASSIGNED"});expect(collegeContactsHref(x)).toContain("teaching=ASSIGNED");expect(collegeContactsQuerySchema.safeParse({teaching:"UNSUPPORTED"}).success).toBe(false);});});

describe("Learner roll number availability",()=>{it("validates typed choice and navigation state",()=>{const parsed=collegeContactsQuerySchema.parse({rollPresence:"PRESENT"});expect(collegeContactsHref(parsed)).toContain("rollPresence=PRESENT");expect(collegeContactsQuerySchema.safeParse({rollPresence:"HIDDEN"}).success).toBe(false);});});
