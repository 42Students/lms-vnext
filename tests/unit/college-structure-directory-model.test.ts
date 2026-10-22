import {classesExportHref} from "@/modules/academics/college-classes-export-model";
import { describe, expect, it } from "vitest";
import {
  classCapacityLabel,
  collegeStructureHref,
  collegeStructureQuerySchema,
  collegeClassQuerySchema,
  collegeElectiveQuerySchema,
  collegeStructureTotalPages,
  electiveSelectionLabel,
  readCollegeStructureParams,
} from "@/modules/academics/college-structure-directory-model";

describe("College Admin classes/electives read-only filters", () => {
  it("parses bounded filters and refuses a caller-controlled college", () => {
    expect(collegeStructureQuerySchema.parse({})).toEqual({
      q: "", status: "ACTIVE", page: 1, pageSize: 25,
    });
    expect(collegeStructureQuerySchema.parse({
      q: "  Science  ", status: "ARCHIVED", page: "3",
    })).toEqual({ q: "Science", status: "ARCHIVED", page: 3, pageSize: 25 });
    for (const invalid of [
      { collegeId: "00000000-0000-4000-8000-000000000001" },
      { page: "0" },
      { page: "1001" },
      { status: "DISABLED" },
      { q: "x".repeat(101) },
      { programId: "not-a-uuid" },
    ]) {
      expect(collegeStructureQuerySchema.safeParse(invalid).success).toBe(false);
    }
  });

  it("handles empty program picker and refuses duplicate query values", () => {
    expect(readCollegeStructureParams({ programId: "", status: "ACTIVE" }))
      .toEqual({ status: "ACTIVE" });
    expect(readCollegeStructureParams({ page: ["1", "2"] })).toBeNull();
    expect(collegeStructureQuerySchema.safeParse(
      readCollegeStructureParams({ page: ["1", "2"] }),
    ).success).toBe(false);
  });

  it("builds fixed relative routes with escaped search text", () => {
    const query = collegeClassQuerySchema.parse({ q: "x & y", status: "ALL", page: 2 });
    const url = new URL(collegeStructureHref("CLASSES", query), "https://example.test");
    expect(url.pathname).toBe("/college/classes");
    expect(url.searchParams.get("q")).toBe("x & y");
    expect(url.searchParams.has("collegeId")).toBe(false);
    expect(collegeStructureHref("ELECTIVES", collegeElectiveQuerySchema.parse({ q: "", status: "ACTIVE", page: 1 })))
      .toBe("/college/electives");
    expect(collegeClassQuerySchema.parse({ minimumCapacity: "36" }).minimumCapacity).toBe(36);
    expect(collegeClassQuerySchema.safeParse({ minimumCapacity: 0 }).success).toBe(false);
    expect(collegeClassQuerySchema.safeParse({ maximumCapacity: 0 }).success).toBe(false);
    expect(collegeClassQuerySchema.safeParse({ maximumCapacity: 100001 }).success).toBe(false);
    expect(readCollegeStructureParams({maximumCapacity:""})).toEqual({});
    expect(collegeStructureQuerySchema.safeParse({ minimumCapacity: 36 }).success).toBe(false);
    expect(collegeStructureHref("CLASSES", collegeClassQuerySchema.parse({ ...query, minimumCapacity: 36 }))).toContain("minimumCapacity=36");
    expect(collegeStructureHref("CLASSES", collegeClassQuerySchema.parse({ ...query, maximumCapacity: 36 }))).toContain("maximumCapacity=36");
    expect(collegeStructureTotalPages(0)).toBe(1);
    expect(collegeElectiveQuerySchema.parse({ semesterNumber: "1" }).semesterNumber).toBe(1);
    expect(collegeElectiveQuerySchema.safeParse({ semesterNumber: 25 }).success).toBe(false);
    expect(collegeElectiveQuerySchema.safeParse({ minimumCredits: 0 }).success).toBe(false);
    expect(collegeElectiveQuerySchema.safeParse({ minimumCredits: 501 }).success).toBe(false);
    expect(readCollegeStructureParams({minimumCapacity:"",semesterNumber:"",minimumCredits:""})).toEqual({});
    expect(collegeClassQuerySchema.safeParse({ semesterNumber: 1 }).success).toBe(false);
    expect(collegeStructureHref("ELECTIVES", collegeElectiveQuerySchema.parse({ q: "x & y", status: "ALL", page: 2, semesterNumber: 1 }))).toContain("semesterNumber=1");
    expect(collegeStructureHref("ELECTIVES", collegeElectiveQuerySchema.parse({ q: "x & y", status: "ALL", page: 2, minimumCredits: 3 }))).toContain("minimumCredits=3");
    expect(collegeStructureTotalPages(26)).toBe(2);
  });

  it("does not fabricate capacity or elective choice rules", () => {
    expect(classCapacityLabel(null)).toBe("Not configured");
    expect(classCapacityLabel(60)).toBe("60");
    expect(electiveSelectionLabel(1, 1)).toBe("Select 1");
    expect(electiveSelectionLabel(1, 3)).toBe("Select 1–3");
  });
  it("cohortStatus classes query is validated and retained in navigation",()=>{
    expect(collegeClassQuerySchema.safeParse({cohortStatus:"INVALID"}).success).toBe(false);
    expect(collegeStructureHref("CLASSES",collegeClassQuerySchema.parse({cohortStatus:"ACTIVE"}))).toContain("cohortStatus=ACTIVE");
  });

  it("programStatus classes query is validated and retained in navigation",()=>{
    expect(collegeClassQuerySchema.safeParse({programStatus:"INVALID"}).success).toBe(false);
    expect(collegeStructureHref("CLASSES",collegeClassQuerySchema.parse({programStatus:"ACTIVE"}))).toContain("programStatus=ACTIVE");
  });

  it("periodState electives query is validated and retained in navigation",()=>{
    expect(collegeElectiveQuerySchema.safeParse({periodState:"INVALID"}).success).toBe(false);
    expect(collegeStructureHref("ELECTIVES",collegeElectiveQuerySchema.parse({periodState:"LINKED"}))).toContain("periodState=LINKED");
  });

  it("elective program lifecycle is validated and retained in navigation",()=>{
    expect(collegeElectiveQuerySchema.safeParse({programStatus:"OTHER"}).success).toBe(false);
    expect(collegeStructureHref("ELECTIVES",collegeElectiveQuerySchema.parse({programStatus:"ARCHIVED"}))).toContain("programStatus=ARCHIVED");
  });

  it("periodCode is an exact bounded class code filter, not arbitrary SQL",()=>{
    expect(collegeClassQuerySchema.safeParse({periodCode:"x".repeat(65)}).success).toBe(false);
    expect(readCollegeStructureParams({periodCode:""})).toEqual({});
    expect(collegeStructureHref("CLASSES",collegeClassQuerySchema.parse({periodCode:"A&26"}))).toContain("periodCode=A%2626");
  });

  it("classCode is an exact bounded class code filter, not arbitrary SQL",()=>{
    expect(collegeClassQuerySchema.safeParse({classCode:"x".repeat(65)}).success).toBe(false);
    expect(readCollegeStructureParams({classCode:""})).toEqual({});
    expect(collegeStructureHref("CLASSES",collegeClassQuerySchema.parse({classCode:"A&26"}))).toContain("classCode=A%2626");
  });

  it("choiceMode validates persisted elective evidence and navigation",()=>{
    expect(collegeElectiveQuerySchema.safeParse({choiceMode:"ASSUMED"}).success).toBe(false);
    expect(collegeStructureHref("ELECTIVES",collegeElectiveQuerySchema.parse({choiceMode:"FLEXIBLE"}))).toContain("choiceMode=FLEXIBLE");
  });

  it("offeringState validates persisted elective evidence and navigation",()=>{
    expect(collegeElectiveQuerySchema.safeParse({offeringState:"ASSUMED"}).success).toBe(false);
    expect(collegeStructureHref("ELECTIVES",collegeElectiveQuerySchema.parse({offeringState:"HAS_ACTIVE"}))).toContain("offeringState=HAS_ACTIVE");
  });

  it("elective academicYearState is not inferred from the period",()=>{
    expect(collegeElectiveQuerySchema.safeParse({academicYearState:"ASSUMED"}).success).toBe(false);
    expect(collegeStructureHref("ELECTIVES",collegeElectiveQuerySchema.parse({academicYearState:"MISSING"}))).toContain("academicYearState=MISSING");
  });

  it("elective linked period code is bounded and escaped",()=>{
    expect(collegeElectiveQuerySchema.safeParse({periodCode:"x".repeat(65)}).success).toBe(false);
    expect(readCollegeStructureParams({periodCode:""})).toEqual({});
    expect(collegeStructureHref("ELECTIVES",collegeElectiveQuerySchema.parse({periodCode:"P&26"}))).toContain("periodCode=P%2626");
  });

  it("omits blank exact-code selectors and rejects repeated values", () => {
    expect(readCollegeStructureParams({classCode:"",periodCode:""})).toEqual({});
    expect(readCollegeStructureParams({classCode:["A","B"]})).toBeNull();
    expect(readCollegeStructureParams({periodCode:["A","B"]})).toBeNull();
  });

  it("validates and carries academic period status through class paging and CSV",()=>{
    const query=collegeClassQuerySchema.parse({periodLifecycle:"ACTIVE"});
    expect(collegeStructureHref("CLASSES",query)).toContain("periodLifecycle=");
    expect(classesExportHref(query)).toContain("periodLifecycle=");
    expect(collegeClassQuerySchema.safeParse({periodLifecycle:"INVALID"}).success).toBe(false);
  });
  it("validates and carries exact program code in class pages and CSV",()=>{
    const query=collegeClassQuerySchema.parse({programCode:"A&26"});
    expect(collegeStructureHref("CLASSES",query)).toContain("programCode=A%2626");
    expect(classesExportHref(query)).toContain("programCode=A%2626");
    expect(collegeClassQuerySchema.safeParse({programCode:"x".repeat(65)}).success).toBe(false);
    expect(readCollegeStructureParams({programCode:""})).toEqual({});
  });
  it("validates and carries exact class name in class pages and CSV",()=>{
    const query=collegeClassQuerySchema.parse({className:"A&26"});
    expect(collegeStructureHref("CLASSES",query)).toContain("className=A%2626");
    expect(classesExportHref(query)).toContain("className=A%2626");
    expect(collegeClassQuerySchema.safeParse({className:"x".repeat(256)}).success).toBe(false);
    expect(readCollegeStructureParams({className:""})).toEqual({});
  });
  it("validates and carries exact cohort name in class pages and CSV",()=>{
    const query=collegeClassQuerySchema.parse({cohortName:"A&26"});
    expect(collegeStructureHref("CLASSES",query)).toContain("cohortName=A%2626");
    expect(classesExportHref(query)).toContain("cohortName=A%2626");
    expect(collegeClassQuerySchema.safeParse({cohortName:"x".repeat(256)}).success).toBe(false);
    expect(readCollegeStructureParams({cohortName:""})).toEqual({});
  });
  it("Saved section schedule validates persisted evidence and retains class/export filters",()=>{
    const query=collegeClassQuerySchema.parse({schedulePresence:"NO_EVENTS"});
    expect(collegeStructureHref("CLASSES",query)).toContain("schedulePresence=NO_EVENTS");
    expect(classesExportHref(query)).toContain("schedulePresence=NO_EVENTS");
    expect(collegeClassQuerySchema.safeParse({schedulePresence:"INFERRED"}).success).toBe(false);
  });
  it("Current section Faculty assignments validates persisted evidence and retains class/export filters",()=>{
    const query=collegeClassQuerySchema.parse({facultyCoverage:"NO_FACULTY"});
    expect(collegeStructureHref("CLASSES",query)).toContain("facultyCoverage=NO_FACULTY");
    expect(classesExportHref(query)).toContain("facultyCoverage=NO_FACULTY");
    expect(collegeClassQuerySchema.safeParse({facultyCoverage:"INFERRED"}).success).toBe(false);
  });
  it("Authored section course deliveries validates persisted evidence and retains class/export filters",()=>{
    const query=collegeClassQuerySchema.parse({deliveryPresence:"NO_DELIVERIES"});
    expect(collegeStructureHref("CLASSES",query)).toContain("deliveryPresence=NO_DELIVERIES");
    expect(classesExportHref(query)).toContain("deliveryPresence=NO_DELIVERIES");
    expect(collegeClassQuerySchema.safeParse({deliveryPresence:"INFERRED"}).success).toBe(false);
  });
  it("bounds period start date on or after in Class directory and CSV navigation",()=>{
    const query=collegeClassQuerySchema.parse({periodStartsOnOrAfter:"2026-07-01"});
    expect(collegeStructureHref("CLASSES",query)).toContain("periodStartsOnOrAfter=2026-07-01");
    expect(classesExportHref(query)).toContain("periodStartsOnOrAfter=2026-07-01");
    expect(collegeClassQuerySchema.safeParse({periodStartsOnOrAfter:"2026-15-41"}).success).toBe(false);
    expect(readCollegeStructureParams({periodStartsOnOrAfter:""})).toEqual({});
  });
  it("bounds period end date on or before in Class directory and CSV navigation",()=>{
    const query=collegeClassQuerySchema.parse({periodEndsOnOrBefore:"2026-12-31"});
    expect(collegeStructureHref("CLASSES",query)).toContain("periodEndsOnOrBefore=2026-12-31");
    expect(classesExportHref(query)).toContain("periodEndsOnOrBefore=2026-12-31");
    expect(collegeClassQuerySchema.safeParse({periodEndsOnOrBefore:"2026-15-41"}).success).toBe(false);
    expect(readCollegeStructureParams({periodEndsOnOrBefore:""})).toEqual({});
  });
  it("validates exact department code and retains it in scoped pages and CSV",()=>{
    const query=collegeClassQuerySchema.parse({departmentCode:"CS&IT"});
    expect(collegeStructureHref("CLASSES",query)).toContain("departmentCode=CS%26IT");
    expect(classesExportHref(query)).toContain("departmentCode=CS%26IT");
    expect(collegeClassQuerySchema.safeParse({departmentCode:"x".repeat(65)}).success).toBe(false);
    expect(readCollegeStructureParams({departmentCode:""})).toEqual({});
  });
  it("Exact elective slot name is bounded and persists in elective page links",()=>{
    const query=collegeElectiveQuerySchema.parse({slotName:"A&26"});
    expect(collegeStructureHref("ELECTIVES",query)).toContain("slotName=A%2626");
    expect(collegeElectiveQuerySchema.safeParse({slotName:"x".repeat(151)}).success).toBe(false);
    expect(readCollegeStructureParams({slotName:""})).toEqual({});
  });
  it("Exact elective program code is bounded and persists in elective page links",()=>{
    const query=collegeElectiveQuerySchema.parse({programCode:"A&26"});
    expect(collegeStructureHref("ELECTIVES",query)).toContain("programCode=A%2626");
    expect(collegeElectiveQuerySchema.safeParse({programCode:"x".repeat(65)}).success).toBe(false);
    expect(readCollegeStructureParams({programCode:""})).toEqual({});
  });
  it("Elective owning department code is bounded and persists in elective page links",()=>{
    const query=collegeElectiveQuerySchema.parse({departmentCode:"A&26"});
    expect(collegeStructureHref("ELECTIVES",query)).toContain("departmentCode=A%2626");
    expect(collegeElectiveQuerySchema.safeParse({departmentCode:"x".repeat(65)}).success).toBe(false);
    expect(readCollegeStructureParams({departmentCode:""})).toEqual({});
  });
  it("Minimum required elective choices uses bounded saved values and URL persistence",()=>{
    const q=collegeElectiveQuerySchema.parse({minimumRequiredPicks:1});
    expect(collegeStructureHref("ELECTIVES",q)).toContain("minimumRequiredPicks=1");
    expect(collegeElectiveQuerySchema.safeParse({minimumRequiredPicks:-1}).success).toBe(false);
    expect(collegeElectiveQuerySchema.safeParse({minimumRequiredPicks:1001}).success).toBe(false);
    expect(readCollegeStructureParams({minimumRequiredPicks:""})).toEqual({});
  });
  it("Maximum allowed elective choices uses bounded saved values and URL persistence",()=>{
    const q=collegeElectiveQuerySchema.parse({maximumAllowedPicks:2});
    expect(collegeStructureHref("ELECTIVES",q)).toContain("maximumAllowedPicks=2");
    expect(collegeElectiveQuerySchema.safeParse({maximumAllowedPicks:0}).success).toBe(false);
    expect(collegeElectiveQuerySchema.safeParse({maximumAllowedPicks:1001}).success).toBe(false);
    expect(readCollegeStructureParams({maximumAllowedPicks:""})).toEqual({});
  });
  it("Semester from uses bounded saved values and URL persistence",()=>{
    const q=collegeElectiveQuerySchema.parse({semesterFrom:1});
    expect(collegeStructureHref("ELECTIVES",q)).toContain("semesterFrom=1");
    expect(collegeElectiveQuerySchema.safeParse({semesterFrom:0}).success).toBe(false);
    expect(collegeElectiveQuerySchema.safeParse({semesterFrom:25}).success).toBe(false);
    expect(readCollegeStructureParams({semesterFrom:""})).toEqual({});
  });
  it("validates semester through and preserves page filters",()=>{
    const q=collegeElectiveQuerySchema.parse({semesterThrough:1});
    expect(collegeStructureHref("ELECTIVES",q)).toContain("semesterThrough=");
    expect(collegeElectiveQuerySchema.safeParse({semesterThrough:0}).success).toBe(false);
  });
  it("validates linked academic-period lifecycle and preserves page filters",()=>{
    const q=collegeElectiveQuerySchema.parse({periodLifecycle:"ACTIVE"});
    expect(collegeStructureHref("ELECTIVES",q)).toContain("periodLifecycle=");
    expect(collegeElectiveQuerySchema.safeParse({periodLifecycle:"INFERRED"}).success).toBe(false);
  });
  it("validates elective description availability and preserves page filters",()=>{
    const q=collegeElectiveQuerySchema.parse({descriptionPresence:"MISSING"});
    expect(collegeStructureHref("ELECTIVES",q)).toContain("descriptionPresence=");
    expect(collegeElectiveQuerySchema.safeParse({descriptionPresence:"INFERRED"}).success).toBe(false);
  });
  it("validates elective linked period starts on or after for the elective directory",()=>{
    const q=collegeElectiveQuerySchema.parse({periodStartsOnOrAfter:"2026-07-01"});
    expect(collegeStructureHref("ELECTIVES",q)).toContain("periodStartsOnOrAfter=2026-07-01");
    expect(collegeElectiveQuerySchema.safeParse({periodStartsOnOrAfter:"2026-13-39"}).success).toBe(false);
  });
  it("validates elective linked period ends on or before for the elective directory",()=>{
    const q=collegeElectiveQuerySchema.parse({periodEndsOnOrBefore:"2026-12-31"});
    expect(collegeStructureHref("ELECTIVES",q)).toContain("periodEndsOnOrBefore=2026-12-31");
    expect(collegeElectiveQuerySchema.safeParse({periodEndsOnOrBefore:"2026-13-39"}).success).toBe(false);
  });
 it("rejects elective semester interval on the College Admin electives page",()=>{
  const invalid=collegeElectiveQuerySchema.safeParse({semesterFrom:5,semesterThrough:4});
  expect(invalid.success).toBe(false);
  if(!invalid.success)expect(invalid.error.issues.some(issue=>issue.message.includes("Last semester must not precede first semester"))).toBe(true);
  expect(collegeElectiveQuerySchema.safeParse({semesterFrom:4,semesterThrough:4}).success).toBe(true);
 });
 it("rejects elective required versus allowed picks on the College Admin electives page",()=>{
  const invalid=collegeElectiveQuerySchema.safeParse({minimumRequiredPicks:4,maximumAllowedPicks:3});
  expect(invalid.success).toBe(false);
  if(!invalid.success)expect(invalid.error.issues.some(issue=>issue.message.includes("Maximum allowed choices cannot be below minimum required choices"))).toBe(true);
  expect(collegeElectiveQuerySchema.safeParse({minimumRequiredPicks:2,maximumAllowedPicks:3}).success).toBe(true);
 });
 it("rejects elective linked period date interval on the College Admin electives page",()=>{
  const invalid=collegeElectiveQuerySchema.safeParse({periodStartsOnOrAfter:"2026-12-01",periodEndsOnOrBefore:"2026-11-30"});
  expect(invalid.success).toBe(false);
  if(!invalid.success)expect(invalid.error.issues.some(issue=>issue.message.includes("Linked period end limit cannot precede its start limit"))).toBe(true);
  expect(collegeElectiveQuerySchema.safeParse({periodStartsOnOrAfter:"2026-07-01",periodEndsOnOrBefore:"2026-12-31"}).success).toBe(true);
 });
 it("rejects exact elective semester inside selected interval on the College Admin electives page",()=>{
  const invalid=collegeElectiveQuerySchema.safeParse({semesterNumber:3,semesterFrom:4,semesterThrough:6});
  expect(invalid.success).toBe(false);
  if(!invalid.success)expect(invalid.error.issues.some(issue=>issue.message.includes("Exact semester must fall within the selected semester interval"))).toBe(true);
  expect(collegeElectiveQuerySchema.safeParse({semesterNumber:4,semesterFrom:4,semesterThrough:6}).success).toBe(true);
 });
 it("rejects unlinked elective period without linked-only selectors on the College Admin electives page",()=>{
  const invalid=collegeElectiveQuerySchema.safeParse({periodState:"UNLINKED",periodLifecycle:"ACTIVE"});
  expect(invalid.success).toBe(false);
  if(!invalid.success)expect(invalid.error.issues.some(issue=>issue.message.includes("Unlinked electives cannot be filtered by a linked academic period"))).toBe(true);
  expect(collegeElectiveQuerySchema.safeParse({periodState:"LINKED",periodLifecycle:"ACTIVE"}).success).toBe(true);
 });
 it("rejects reversed class period date bounds",()=>{
  expect(collegeClassQuerySchema.safeParse({periodStartsOnOrAfter:"2026-12-30",periodEndsOnOrBefore:"2026-12-29"}).success).toBe(false);
  expect(collegeClassQuerySchema.safeParse({periodStartsOnOrAfter:"2026-12-29",periodEndsOnOrBefore:"2026-12-30"}).success).toBe(true);
 });
});
