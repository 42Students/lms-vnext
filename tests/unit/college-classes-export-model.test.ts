import { describe, expect, it } from "vitest";
import {
  CLASSES_EXPORT_CAP, collegeClassesExportSchema, classesExportHref,
  readClassesExportParams, renderCollegeClassesCsv,
} from "@/modules/academics/college-classes-export-model";

describe("College classes safe CSV export", () => {
  it("validates filters and excludes client-selected tenant and paging", () => {
    expect(CLASSES_EXPORT_CAP).toBe(1000);
    expect(collegeClassesExportSchema.parse({q:" science "})).toMatchObject({q:"science"});
    expect(collegeClassesExportSchema.safeParse({collegeId:"fake"}).success).toBe(false);
    expect(collegeClassesExportSchema.safeParse({page:7}).success).toBe(false);
    expect(readClassesExportParams(new URLSearchParams("q=x&q=y"))).toBeNull();
    expect(collegeClassesExportSchema.safeParse({maximumCapacity:0}).success).toBe(false);
    expect(classesExportHref({q:"",status:"ALL",maximumCapacity:36})).toContain("maximumCapacity=36");
    const href = classesExportHref({q:"Math & Science",status:"ARCHIVED"});
    expect(new URL(href,"http://local").searchParams.get("q")).toBe("Math & Science");
  });
  it("neutralizes formulas, quotes cells, BOM-prefixes and flags truncation", () => {
    const csv=renderCollegeClassesCsv([{
      name:"=1+1",code:" +formula",programName:"Program, \"A\"",
      cohortName:"2026",periodName:"Oct",capacity:null,activeLearners:0,status:"ACTIVE",
    }],true);
    expect(csv.startsWith("\ufeff")).toBe(true);
    expect(csv).toContain("\"'=1+1\"");
    expect(csv).toContain("\"' +formula\"");
    expect(csv).toContain("\"Program, \"\"A\"\"\"");
    expect(csv).toContain("EXPORT TRUNCATED");
    expect(csv).toContain("Only first 1,000");
  });
});
