import { describe, expect, it } from "vitest";
import {
  CLASSES_EXPORT_CAP, collegeClassesExportSchema, classesExportHref,
  readClassesExportParams, renderCollegeClassesCsv,
} from "@/modules/academics/college-classes-export-model";

describe("College classes safe CSV export", () => {
  it("validates filters and excludes client-selected tenant and paging", () => {
    expect(CLASSES_EXPORT_CAP).toBe(Number.MAX_SAFE_INTEGER);
    expect(collegeClassesExportSchema.parse({q:" science "})).toMatchObject({q:"science"});
    expect(collegeClassesExportSchema.safeParse({collegeId:"fake"}).success).toBe(false);
    expect(collegeClassesExportSchema.safeParse({page:7}).success).toBe(false);
    expect(readClassesExportParams(new URLSearchParams("q=x&q=y"))).toBeNull();
    expect(collegeClassesExportSchema.safeParse({maximumCapacity:0}).success).toBe(false);
    expect(collegeClassesExportSchema.safeParse({minimumCapacity:50,maximumCapacity:49}).success).toBe(false);
    expect(collegeClassesExportSchema.safeParse({capacityState:"UNSET",minimumCapacity:1}).success).toBe(false);
    expect(collegeClassesExportSchema.safeParse({minimumCapacity:49,maximumCapacity:50}).success).toBe(true);
    expect(collegeClassesExportSchema.safeParse({capacityState:"INVALID"}).success).toBe(false);
    expect(classesExportHref({q:"",status:"ALL",capacityState:"UNSET"})).toContain("capacityState=UNSET");
    expect(collegeClassesExportSchema.safeParse({cohortCode:"x".repeat(65)}).success).toBe(false);
    expect(classesExportHref({q:"",status:"ALL",cohortCode:"B&26"})).toContain("cohortCode=B%2626");
    expect(classesExportHref({q:"",status:"ALL",maximumCapacity:36})).toContain("maximumCapacity=36");
    const href = classesExportHref({q:"Math & Science",status:"ARCHIVED"});
    expect(new URL(href,"http://local").searchParams.get("q")).toBe("Math & Science");
  });
  it("exports every filtered class with the current columns and safe CSV escaping", () => {
    const row = {
      id: "class-1", name: "=1+1", linkedProgramId: "prog-1",
      cohortId: "batch-1", periodStart: "2026-10-01",
      periodEnd: "2026-12-31", minSize: 10, capacity: 50,
    };
    const csv = renderCollegeClassesCsv([row, { ...row, id: "class-2", name: 'Lab, "B"' }], true);
    expect(csv.startsWith("\ufeff")).toBe(true);
    expect(csv).toContain('"Class/Section Name"');
    expect(csv).toContain('"\'=1+1"');
    expect(csv).toContain('"Lab, ""B"""');
    expect(csv).toContain('"prog-1"');
    expect(csv).toContain('"batch-1"');
    expect(csv).toContain('"50"');
    expect(csv.split("\r\n")).toHaveLength(3);
    expect(csv).not.toContain("EXPORT TRUNCATED");
    // Imported/older class records can omit optional values. Preserve the
    // exact CSV column count and encode missing values as blank cells.
    const sparseCsv=renderCollegeClassesCsv([{
      ...row,linkedProgramId:null,periodStart:null,periodEnd:null,
      minSize:null,capacity:null,
    }],false);
    expect(sparseCsv.split("\r\n")).toHaveLength(2);
    expect(sparseCsv).toContain(',"",""');
  });
 it("cohortStatus is applied to classes CSV",()=>{
  expect(collegeClassesExportSchema.safeParse({cohortStatus:"INVALID"}).success).toBe(false);
  expect(classesExportHref({q:"",status:"ACTIVE",cohortStatus:"ACTIVE"})).toContain("cohortStatus=ACTIVE");
 });

 it("programStatus is applied to classes CSV",()=>{
  expect(collegeClassesExportSchema.safeParse({programStatus:"INVALID"}).success).toBe(false);
  expect(classesExportHref({q:"",status:"ACTIVE",programStatus:"ACTIVE"})).toContain("programStatus=ACTIVE");
 });

  it("periodCode is preserved in safe class CSV export",()=>{
    expect(collegeClassesExportSchema.safeParse({periodCode:"x".repeat(65)}).success).toBe(false);
    expect(classesExportHref({q:"",status:"ACTIVE",periodCode:"B&26"})).toContain("periodCode=B%2626");
  });

  it("classCode is preserved in safe class CSV export",()=>{
    expect(collegeClassesExportSchema.safeParse({classCode:"x".repeat(65)}).success).toBe(false);
    expect(classesExportHref({q:"",status:"ACTIVE",classCode:"B&26"})).toContain("classCode=B%2626");
  });

 it("rejects reversed period date bounds in class CSV",()=>{
  expect(collegeClassesExportSchema.safeParse({periodStartsOnOrAfter:"2026-12-30",periodEndsOnOrBefore:"2026-12-29"}).success).toBe(false);
  expect(collegeClassesExportSchema.safeParse({periodStartsOnOrAfter:"2026-12-29",periodEndsOnOrBefore:"2026-12-30"}).success).toBe(true);
 });
});
