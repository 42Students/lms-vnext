import {describe,it,expect} from "vitest";
import {collegeContactsQuerySchema,collegeContactsHref,collegeContactLiteralPattern,contactAcademicFiltersCompatible,clearedCollegeContactsHref} from "@/modules/people/college-contacts-model";

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

describe("College contact academic program selector",()=>{it("persists a strict program UUID to the server and CSV URL",()=>{const programId="00000000-0000-4000-8000-000000000101";expect(collegeContactsHref(collegeContactsQuerySchema.parse({programId}))).toContain("programId="+programId);expect(collegeContactsQuerySchema.safeParse({programId:"other-college"}).success).toBe(false);});});

describe("College Contacts active class selection",()=>{it("persists only a strict section UUID",()=>{const sectionId="00000000-0000-4000-8000-000000000102";expect(collegeContactsHref(collegeContactsQuerySchema.parse({sectionId}))).toContain("sectionId="+sectionId);expect(collegeContactsQuerySchema.safeParse({sectionId:"other-tenant"}).success).toBe(false);});});

describe("Contacts employment type filter",()=>{it("round-trips bounded Faculty employment type",()=>{expect(collegeContactsHref(collegeContactsQuerySchema.parse({employmentType:"VISITING"}))).toContain("employmentType=VISITING");expect(collegeContactsQuerySchema.safeParse({employmentType:"X".repeat(129)}).success).toBe(false);});});

describe("Active Faculty teaching-role contact filter",()=>{it("round-trips only registered teaching roles",()=>{const input=collegeContactsQuerySchema.parse({teachingRole:"CO_TEACHER"});expect(collegeContactsHref(input)).toContain("teachingRole=CO_TEACHER");expect(collegeContactsQuerySchema.safeParse({teachingRole:"PROFESSOR"}).success).toBe(false);});});

describe("Contact Faculty academic-title text facet",()=>{it("escapes LIKE wildcard input, validates and retains search on CSV URL",()=>{expect(collegeContactLiteralPattern("50%_")).toBe("%50\\%\\_%");const query=collegeContactsQuerySchema.parse({facultyTitleQ:"Associate Prof."});expect(collegeContactsHref(query)).toContain("facultyTitleQ=Associate+Prof.");expect(collegeContactsQuerySchema.safeParse({facultyTitleQ:"x".repeat(81)}).success).toBe(false);});});

describe("Contacts contradictory academic facets",()=>{it("rejects incompatible no-enrollment and no-class selections",()=>{const defaults=collegeContactsQuerySchema.parse({});for(const inconsistent of [{enrollment:"NONE" as const,programId:"00000000-0000-4000-8000-000000000101"},{enrollment:"NONE" as const,classPresence:"ASSIGNED" as const},{classPresence:"NONE" as const,sectionId:"00000000-0000-4000-8000-000000000102"}])expect(contactAcademicFiltersCompatible({...defaults,...inconsistent})).toBe(false);expect(contactAcademicFiltersCompatible(defaults)).toBe(true);});});
