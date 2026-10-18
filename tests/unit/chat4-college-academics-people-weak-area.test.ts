import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {requireActiveAcademicMembership,requireAcademicRole} from "@/modules/academics/a2-scope";
import {
 renderBatchCsv,renderSemesterCsv,academicExportHref,
 semesterCsvSchema,batchCsvSchema,ACADEMIC_EXPORT_CAP,
} from "@/modules/academics/college-academic-export-model";
import {
 parseCollegeRoleDirectorySearchParams,roleDirectoryIstDayStart,
 roleDirectoryNextIstDayStart,roleDirectoryDateWindowValid,
 describeCollegeDirectoryContext,assertCompatibleCollegeRoleDirectoryFilters,
 selectedDirectoryValueNotListed,collegeRoleDirectoryFilterMessage,
 collegeRoleDirectoryQuerySchema,
} from "@/modules/people/college-role-directory-model";
import type {MembershipRole} from "@/modules/identity/constants";

const collegeId="11111111-1111-4111-8111-111111111111";
function membership(status:"ACTIVE"|"SUSPENDED"|"ENDED",roles:MembershipRole[]){
 return {id:"member",collegeId,organizationId:"org",status,roles};
}
const source=(file:string)=>readFileSync(file,"utf8");

describe("College academics/people weak-area behavioural ledger",()=>{
 it("COL-academics-A2-01 never treats an ended or suspended membership as a learner or faculty",()=>{
  expect(()=>requireActiveAcademicMembership(membership("ACTIVE",["LEARNER"]))).not.toThrow();
  for(const status of ["SUSPENDED","ENDED"] as const){
   expect(()=>requireActiveAcademicMembership(membership(status,["LEARNER"]))).toThrow("MEMBERSHIP_NOT_ACTIVE");
   expect(()=>requireAcademicRole(membership(status,["LEARNER"]),"LEARNER")).toThrow("MEMBERSHIP_NOT_ACTIVE");
  }
  expect(()=>requireAcademicRole(membership("ACTIVE",["LEARNER"]),"LEARNER")).not.toThrow();
  expect(()=>requireAcademicRole(membership("ACTIVE",["FACULTY"]),"FACULTY")).not.toThrow();
  expect(()=>requireAcademicRole(membership("ACTIVE",["LEARNER"]),"FACULTY")).toThrow("FACULTY_ROLE_REQUIRED");
  expect(()=>requireAcademicRole(membership("ACTIVE",["FACULTY"]),"LEARNER")).toThrow("LEARNER_ROLE_REQUIRED");
  const scope=source("src/modules/academics/a2-scope.ts");
  expect(scope).toContain('eq(colleges.status, "ACTIVE")');
  expect(scope).toContain('eq(organizations.status, "ACTIVE")');
  expect(scope).toContain("row.membershipCollegeId !== row.collegeId");
 });

 it("COL-academics-CSV-01 uses neutralized formula cells, fixed field order, declared row cap and recorded data only",()=>{
  expect(ACADEMIC_EXPORT_CAP).toBe(1000);
  expect(semesterCsvSchema.safeParse({minimumCredits:10,maximumCredits:9}).success).toBe(false);
  expect(semesterCsvSchema.safeParse({creditState:"UNSET",minimumCredits:10}).success).toBe(false);
  expect(semesterCsvSchema.safeParse({minimumCredits:9,maximumCredits:10}).success).toBe(true);
  expect(batchCsvSchema.safeParse({startOnOrAfter:"2026-10-19",startOnOrBefore:"2026-10-18"}).success).toBe(false);
  expect(batchCsvSchema.safeParse({progression:"MISSING",currentTerm:2}).success).toBe(false);
  expect(batchCsvSchema.safeParse({progression:"MISSING",yearStart:2026}).success).toBe(false);
  expect(batchCsvSchema.safeParse({progression:"RECORDED",currentTerm:2}).success).toBe(true);
  const batches=renderBatchCsv([{
   name:"=IMPORTXML(1)",code:"B-1",status:"ACTIVE",programName:"B.Tech",
   programCode:"CS",currentTermNumber:null,currentAcademicYearStart:null,
   activeSections:2,activeEnrolledLearners:0,
  }],true);
  expect(batches).toContain("'=IMPORTXML(1)");
  expect(batches).toContain("EXPORT TRUNCATED");
  expect(batches).toContain("Active learner enrollments");
  expect(batches).toContain(',"","",');
  const semesters=renderSemesterCsv([{
   name:"-cmd",termNumber:2,programName:"B.Tech",programCode:"CS",
   totalCredits:null,isActive:false,mappedCourses:0,
  }],false);
  expect(semesters).toContain("'-cmd");
  expect(semesters).toContain("INACTIVE");
  expect(semesters).not.toContain("EXPORT TRUNCATED");
  expect(academicExportHref("SEMESTERS",{q:"A&B",status:"ALL",termNumber:3}))
   .toContain("q=A%26B");
  expect(academicExportHref("BATCHES",{q:"",status:"ALL",startOnOrAfter:"2026-10-01"}))
   .toContain("startOnOrAfter=2026-10-01");
  const service=source("src/modules/academics/college-academic-export-service.ts");
  expect(service).toContain("semesterCsvSchema.parse(raw)");
  expect(service).toContain("batchCsvSchema.parse(raw)");
  expect(service).toContain("listCollegeBatches(context,{...query,page})");
  expect(service).toContain("listCollegeSemesters(context,{...query,page})");
 });

 it("COL-people-DIRECTORY-01 rejects duplicated, foreign, cross-role and out-of-range filters",()=>{
  expect(parseCollegeRoleDirectorySearchParams({})).toMatchObject({page:1,pageSize:25});
  for(const raw of [
   {q:["A","B"]},{untrustedScope:collegeId},{page:"0"},{pageSize:"100"},
   {joinedFrom:"2026-10-19",joinedThrough:"2026-10-18"},
   {sectionId:"javascript:alert(1)"},{q:"x".repeat(101)},
  ]){
   expect(()=>parseCollegeRoleDirectorySearchParams(raw)).toThrow();
  }
  const faculty=collegeRoleDirectoryQuerySchema.parse({sectionId:collegeId});
  expect(()=>assertCompatibleCollegeRoleDirectoryFilters("FACULTY",faculty)).toThrow("FACULTY_SECTION_FILTER_UNSUPPORTED");
  const learner=collegeRoleDirectoryQuerySchema.parse({teaching:"ASSIGNED"});
  expect(()=>assertCompatibleCollegeRoleDirectoryFilters("LEARNER",learner)).toThrow("LEARNER_TEACHING_FILTER_UNSUPPORTED");
  expect(collegeRoleDirectoryFilterMessage(new Error("FACULTY_SECTION_FILTER_UNSUPPORTED")))
   .toContain("other directory");
  expect(collegeRoleDirectoryFilterMessage(new Error("SQL secret 123"))).not.toContain("123");
 });

 it("COL-people-DIRECTORY-02 keeps IST date-window boundaries exclusive and never duplicates class labels",()=>{
  expect(roleDirectoryDateWindowValid({joinedFrom:"2026-10-18",joinedThrough:"2026-10-18"})).toBe(true);
  expect(roleDirectoryDateWindowValid({joinedFrom:"2026-10-19",joinedThrough:"2026-10-18"})).toBe(false);
  expect(roleDirectoryIstDayStart("2026-10-18").toISOString()).toBe("2026-10-17T18:30:00.000Z");
  expect(roleDirectoryNextIstDayStart("2026-10-18").toISOString()).toBe("2026-10-18T18:30:00.000Z");
  const row={program:"B.Tech",cohort:"2026",sections:["B","A","A"],activeTeachingAssignments:0};
  expect(describeCollegeDirectoryContext("LEARNER",row)).toBe("B.Tech · 2026 · A, B");
  expect(describeCollegeDirectoryContext("FACULTY",{...row,activeTeachingAssignments:1})).toBe("1 active course teaching assignment");
  expect(selectedDirectoryValueNotListed(collegeId,[])).toBe(true);
  expect(selectedDirectoryValueNotListed(collegeId,[collegeId])).toBe(false);
  const service=source("src/modules/people/college-visible-directory-export.ts");
  expect(service).toContain('assertPersistedPlatformPermission(tx,context,"people.manage"');
  expect(service).toContain("inArray(collegeMemberships.id,ids)");
  expect(service).toContain("escapeRoleDirectoryCsvCell");
  const tx=service.indexOf("getDb().transaction(async tx=>");
  const guard=service.indexOf("assertPersistedPlatformPermission(tx,context");
  const read=service.indexOf("return tx.select(");
  expect(tx).toBeGreaterThan(-1);
  expect(guard).toBeGreaterThan(tx);
  expect(read).toBeGreaterThan(guard);
 });
});
