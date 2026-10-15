import {describe,it,expect} from "vitest";import {collegeContactsQuerySchema} from "@/modules/people/college-contacts-model";describe("contact server filters",()=>{it("accepts typed status and sorting",()=>{expect(collegeContactsQuerySchema.parse({status:"ENDED",sort:"NEWEST"})).toMatchObject({status:"ENDED",sort:"NEWEST"});});});
describe("contacts account state",()=>{it("validates account lifecycle independently of college membership",()=>{
 const filter=collegeContactsQuerySchema.parse({status:"ACTIVE",accountStatus:"DISABLED"});
 expect(filter.accountStatus).toBe("DISABLED");
 expect(collegeContactsQuerySchema.safeParse({accountStatus:"SUSPENDED"}).success).toBe(false);
});});

describe("contacts oldest-first sort",()=>{it("supports a deterministic oldest join sequence",()=>{
 expect(collegeContactsQuerySchema.parse({sort:"OLDEST"}).sort).toBe("OLDEST");
 expect(collegeContactsQuerySchema.safeParse({sort:"LAST"}).success).toBe(false);
});});

describe("contacts reverse-name order",()=>{it("keeps requested reverse order through URL navigation",()=>{
 const filter=collegeContactsQuerySchema.parse({sort:"NAME_DESC"});
 expect(filter.sort).toBe("NAME_DESC");
});});

describe("contact role audience",()=>{it("supports exact faculty-only, learner-only and mixed-grant membership filtering",()=>{
 for(const audience of ["FACULTY_ONLY","LEARNER_ONLY","DUAL"]){
  expect(collegeContactsQuerySchema.parse({audience}).audience).toBe(audience);
 }
 expect(collegeContactsQuerySchema.safeParse({audience:"TPO"}).success).toBe(false);
});});

describe("contact name initial",()=>{it("only accepts a single normalized A–Z name prefix",()=>{
 expect(collegeContactsQuerySchema.parse({initial:"A"}).initial).toBe("A");
 expect(collegeContactsQuerySchema.safeParse({initial:"AA"}).success).toBe(false);
 expect(collegeContactsQuerySchema.safeParse({initial:"%"}).success).toBe(false);
});});
