import { describe, expect, it } from "vitest";
import {
  collegeIdSchema, collegeOrganizationIdSchema, collegeCodeSchema, collegeNameSchema,
  createCollegeInputSchema, updateCollegeInputSchema,
} from "@/modules/colleges/validation";
import {
  organizationIdSchema, organizationNameSchema,
  createOrganizationInputSchema, renameOrganizationInputSchema,
} from "@/modules/organizations/validation";

const organizationId="50000000-0000-4000-8000-000000000001";
const collegeId="40000000-0000-4000-8000-000000000001";

describe("chat-4 College and Organization create/edit validation",()=>{
  it("COL-tenant-validation-01 validates distinct UUID tenant identifiers without string coercion",()=>{
    expect(collegeIdSchema.parse(collegeId)).toBe(collegeId);
    expect(collegeOrganizationIdSchema.parse(organizationId)).toBe(organizationId);
    expect(organizationIdSchema.parse(organizationId)).toBe(organizationId);
    for(const value of ["", "undefined", "1", "../secrets", "not-a-uuid", 42, null]){
      expect(collegeIdSchema.safeParse(value).success).toBe(false);
      expect(organizationIdSchema.safeParse(value).success).toBe(false);
    }
  });

  it("COL-tenant-validation-02 normalizes college codes and rejects invalid/reserved URL characters",()=>{
    expect(collegeCodeSchema.parse("  Eng-College01  ")).toBe("eng-college01");
    for(const code of ["", "ab", "a".repeat(64), "college name", "college_name", "college/one", "@foo", "café"]){
      expect(collegeCodeSchema.safeParse(code).success).toBe(false);
    }
    expect(collegeCodeSchema.parse("abc")).toBe("abc");
    expect(collegeCodeSchema.parse("a-1")).toBe("a-1");
  });

  it("COL-tenant-validation-03 requires an actual college name and bounds text fields",()=>{
    expect(collegeNameSchema.parse("  Engineering College  ")).toBe("Engineering College");
    expect(collegeNameSchema.safeParse("  ").success).toBe(false);
    expect(collegeNameSchema.safeParse("n".repeat(256)).success).toBe(false);
    expect(createCollegeInputSchema.safeParse({organizationId,name:"Institute",code:"inst"}).success).toBe(true);
    expect(createCollegeInputSchema.safeParse({organizationId:"other",name:"Institute",code:"inst"}).success).toBe(false);
    expect(createCollegeInputSchema.safeParse({organizationId,name:"",code:"inst"}).success).toBe(false);
    expect(createCollegeInputSchema.safeParse({organizationId,name:"Institute",code:"ab"}).success).toBe(false);
    expect(createCollegeInputSchema.safeParse({organizationId,name:"Institute",code:"inst",city:"x".repeat(129)}).success).toBe(false);
    expect(createCollegeInputSchema.safeParse({organizationId,name:"Institute",code:"inst",postalCode:"x".repeat(33)}).success).toBe(false);
  });

  it("COL-tenant-validation-04 requires at least one actual update and applies per-field caps",()=>{
    expect(updateCollegeInputSchema.safeParse({}).success).toBe(false);
    expect(updateCollegeInputSchema.safeParse({name:"Institute Two"}).success).toBe(true);
    expect(updateCollegeInputSchema.safeParse({city:"Hyderabad"}).success).toBe(true);
    expect(updateCollegeInputSchema.safeParse({logoObjectPath:null}).success).toBe(true);
    expect(updateCollegeInputSchema.safeParse({name:""}).success).toBe(false);
    expect(updateCollegeInputSchema.safeParse({state:"x".repeat(129)}).success).toBe(false);
    expect(updateCollegeInputSchema.safeParse({postalCode:"x".repeat(33)}).success).toBe(false);
  });

  it("COL-tenant-validation-05 collapses internal whitespace of organization names across both mutations",()=>{
    expect(organizationNameSchema.parse("  Example   University \t Campus ")).toBe("Example University Campus");
    expect(createOrganizationInputSchema.parse({name:"  Example   University "}).name).toBe("Example University");
    expect(renameOrganizationInputSchema.parse({name:" A \n Institute "}).name).toBe("A Institute");
    for(const raw of ["", "   ", "o".repeat(256)]){
      expect(createOrganizationInputSchema.safeParse({name:raw}).success).toBe(false);
      expect(renameOrganizationInputSchema.safeParse({name:raw}).success).toBe(false);
    }
  });
});
