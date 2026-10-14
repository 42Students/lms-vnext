import { describe, expect, it } from "vitest";
import { facultyContactDetailParamsSchema, facultyContactTabMatches }
  from "@/modules/courses/faculty-contact-detail-model";
import type { FacultyContactRow } from "@/components/courses/faculty-contacts-table";

describe("Public-only Faculty directory projection",()=>{
  it("only requires public fields and carries no private contact attributes",()=>{
    const row:FacultyContactRow={
      membershipId:"11111111-1111-4111-8111-111111111111",
      displayName:"Teacher A",departmentName:"Computer Science",roles:["FACULTY"],
    };
    expect(Object.keys(row).sort()).toEqual([
      "departmentName","displayName","membershipId","roles",
    ]);
    expect(JSON.stringify(row)).not.toMatch(/email|phone|photo|aadhaar|pan/i);
  });
  it("remains exact-tab and identifier scoped",()=>{
    expect(facultyContactTabMatches("teachers",["FACULTY"])).toBe(true);
    expect(facultyContactTabMatches("students",["FACULTY"])).toBe(false);
    expect(facultyContactDetailParamsSchema.safeParse({
      contactsTab:"students",membershipId:"not-a-uuid",
    }).success).toBe(false);
  });
});
