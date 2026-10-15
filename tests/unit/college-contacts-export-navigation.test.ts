import {describe,it,expect} from "vitest";
import {collegeContactsExportSchema} from "@/modules/people/college-contacts-export-model";
describe("contacts export navigation",()=>{it("preserves selected contacts tab and search",()=>{
 const f=collegeContactsExportSchema.parse({tab:"STUDENT",q:"Math",status:"ACTIVE"});
 expect(f.tab).toBe("STUDENT");expect(f.q).toBe("Math");
});});