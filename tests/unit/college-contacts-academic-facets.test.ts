import {describe,it,expect} from "vitest";
import {collegeContactsQuerySchema,collegeContactsHref,clearedCollegeContactsHref} from "@/modules/people/college-contacts-model";

describe("Contact profile availability",()=>{it("round-trips valid facet through filtered contact links and rejects unsupported options",()=>{
 const q=collegeContactsQuerySchema.parse({profile:"UNPROFILED"});expect(collegeContactsHref(q)).toContain("profile=UNPROFILED");expect(collegeContactsQuerySchema.safeParse({profile:"PRIVATE"}).success).toBe(false);
});});

describe("Learner active enrollment",()=>{it("validates and preserves query and URL state",()=>{const x=collegeContactsQuerySchema.parse({enrollment:"ACTIVE"});expect(collegeContactsHref(x)).toContain("enrollment=ACTIVE");expect(collegeContactsQuerySchema.safeParse({enrollment:"UNSUPPORTED"}).success).toBe(false);});});

describe("Faculty current teaching",()=>{it("validates and preserves query and URL state",()=>{const x=collegeContactsQuerySchema.parse({teaching:"ASSIGNED"});expect(collegeContactsHref(x)).toContain("teaching=ASSIGNED");expect(collegeContactsQuerySchema.safeParse({teaching:"UNSUPPORTED"}).success).toBe(false);});});

describe("Learner roll number availability",()=>{it("validates typed choice and navigation state",()=>{const parsed=collegeContactsQuerySchema.parse({rollPresence:"PRESENT"});expect(collegeContactsHref(parsed)).toContain("rollPresence=PRESENT");expect(collegeContactsQuerySchema.safeParse({rollPresence:"HIDDEN"}).success).toBe(false);});});

describe("Learner registration availability",()=>{it("validates typed choice and navigation state",()=>{const parsed=collegeContactsQuerySchema.parse({registrationPresence:"PRESENT"});expect(collegeContactsHref(parsed)).toContain("registrationPresence=PRESENT");expect(collegeContactsQuerySchema.safeParse({registrationPresence:"HIDDEN"}).success).toBe(false);});});

describe("Faculty academic-title availability",()=>{it("validates typed choice and navigation state",()=>{const parsed=collegeContactsQuerySchema.parse({titlePresence:"PRESENT"});expect(collegeContactsHref(parsed)).toContain("titlePresence=PRESENT");expect(collegeContactsQuerySchema.safeParse({titlePresence:"HIDDEN"}).success).toBe(false);});});

describe("Faculty primary-department coverage",()=>{it("validates an exact typed filter and carries it in the contact URL",()=>{const query=collegeContactsQuerySchema.parse({departmentPresence:"ASSIGNED"});expect(collegeContactsHref(query)).toContain("departmentPresence=ASSIGNED");expect(collegeContactsQuerySchema.safeParse({departmentPresence:"OTHER"}).success).toBe(false);});});

describe("Learner active-class placement",()=>{it("validates an exact typed filter and carries it in the contact URL",()=>{const query=collegeContactsQuerySchema.parse({classPresence:"ASSIGNED"});expect(collegeContactsHref(query)).toContain("classPresence=ASSIGNED");expect(collegeContactsQuerySchema.safeParse({classPresence:"OTHER"}).success).toBe(false);});});

describe("College Contacts cohort selector",()=>{it("validates strict cohort UUIDs, retaining the applied URL choice",()=>{const id="00000000-0000-4000-8000-000000000123";expect(collegeContactsHref(collegeContactsQuerySchema.parse({cohortId:id}))).toContain("cohortId="+id);expect(collegeContactsQuerySchema.safeParse({cohortId:"foreign"}).success).toBe(false);});});

describe("Contacts faculty department selector",()=>{it("preserves only a valid department UUID in the URL",()=>{const id="00000000-0000-4000-8000-000000000124";expect(collegeContactsHref(collegeContactsQuerySchema.parse({facultyDepartmentId:id}))).toContain("facultyDepartmentId="+id);expect(collegeContactsQuerySchema.safeParse({facultyDepartmentId:"injected"}).success).toBe(false);});});

describe("Clear contacts filters",()=>{it("clears academic and lifecycle facets while preserving the contact tab",()=>{expect(clearedCollegeContactsHref("STUDENT")).toBe("/college/contacts?tab=STUDENT");expect(clearedCollegeContactsHref("ALL")).toBe("/college/contacts");});});
