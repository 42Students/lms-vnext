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
