import {describe,expect,it} from "vitest";
import {
 academicDirectorySearchParams,academicDirectoryHref,
 academicDirectoryPageCount,
 collegeSemesterDirectorySchema,collegeBatchDirectorySchema,
} from "@/modules/academics/college-academic-directory-model";

describe("COL-academics-directory-FILTER-01 strict college semester/batch URL filters",()=>{
 it("retains exact legacy search and page-size choices with normalized decimal inputs",()=>{
  const params=academicDirectorySearchParams({
   q:"  computing ",page:"0002",pageSize:"50",termNumber:"4",
   minimumCredits:"0",maximumCredits:"24",status:"ACTIVE",
  });
  expect(params).not.toBeNull();
  expect(collegeSemesterDirectorySchema.parse(params)).toMatchObject({
   q:"computing",page:2,pageSize:50,termNumber:4,
   minimumCredits:0,maximumCredits:24,status:"ACTIVE",
  });
  expect(collegeSemesterDirectorySchema.parse({})).toMatchObject({
   page:1,pageSize:10,status:"ALL",
  });
 });
 it("denies unknown, array-valued and forged URL fields instead of broadening results",()=>{
  for(const input of [
   {organizationId:"other-college"},
   {collegeId:"another-college"},
   {private:""},
   {q:["alpha","beta"]},
   {page:["1","2"]},
   {yearStart:["2099","2100"]},
  ])expect(academicDirectorySearchParams(input)).toBeNull();
 });
 it("does not coerce hex, exponent, whitespace or fractional numerics for semesters or batches",()=>{
  const badSemester=[
   {page:"0x10"},{page:"1e2"},{page:" 2 "},{page:"1.5"},
   {pageSize:"0x19"},{pageSize:"2.5e1"},
   {termNumber:"0x4"},{termNumber:"4e0"},
   {minimumCredits:"0x14"},{maximumCredits:"5e1"},
  ];
  const badBatch=[
   {yearStart:"0x833"},{yearStart:"2.099e3"},
   {currentTerm:"1e1"},{currentTerm:"0x4"},
   {page:"1e2"},{pageSize:"0x32"},
  ];
  for(const value of badSemester)
   expect(collegeSemesterDirectorySchema.safeParse(value).success).toBe(false);
  for(const value of badBatch)
   expect(collegeBatchDirectorySchema.safeParse(value).success).toBe(false);
 });
 it("preserves range/credit and progression contradictions rather than silently dropping them",()=>{
  expect(collegeSemesterDirectorySchema.safeParse({
   minimumCredits:40,maximumCredits:20,
  }).success).toBe(false);
  expect(collegeSemesterDirectorySchema.safeParse({
   creditState:"UNSET",minimumCredits:1,
  }).success).toBe(false);
  expect(collegeBatchDirectorySchema.safeParse({
   progression:"MISSING",currentTerm:4,
  }).success).toBe(false);
  expect(collegeBatchDirectorySchema.safeParse({
   startOnOrAfter:"2099-12-31",startOnOrBefore:"2099-01-01",
  }).success).toBe(false);
 });
 it("round-trips authorized semester/batch filters without losing status and page size",()=>{
  const semester=collegeSemesterDirectorySchema.parse({
   q:"capstone",page:"3",pageSize:"50",
   termNumber:"4",minimumCredits:"15",maximumCredits:"24",
   status:"ACTIVE",
  });
  const semesterUrl=new URL(academicDirectoryHref("SEMESTERS",semester),"https://example.test");
  expect(semesterUrl.pathname).toBe("/college/semesters");
  expect(collegeSemesterDirectorySchema.parse(
   academicDirectorySearchParams(Object.fromEntries(semesterUrl.searchParams)))).toEqual(semester);
  const batch=collegeBatchDirectorySchema.parse({
   q:"2099",yearStart:"2099",page:"2",pageSize:"25",
   currentTerm:"4",status:"ACTIVE",progression:"RECORDED",
  });
  const batchUrl=new URL(academicDirectoryHref("BATCHES",batch),"https://example.test");
  expect(batchUrl.pathname).toBe("/college/batches");
  expect(collegeBatchDirectorySchema.parse(
   academicDirectorySearchParams(Object.fromEntries(batchUrl.searchParams)))).toEqual(batch);
  expect(academicDirectoryPageCount(0,25)).toBe(1);
  expect(academicDirectoryPageCount(26,25)).toBe(2);
 });
});
