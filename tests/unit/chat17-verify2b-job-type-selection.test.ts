import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { resolveTpoDriveJobTypeChoice } from "@/modules/placements/tpo-job-type-selection-model";

const builtins = [
 {label:"Full-time",countsAsPlaced:true},
 {label:"Internship",countsAsPlaced:false},
];
const configured = [
 {label:"Full-time",active:false,countsAsPlaced:true},
 {label:"Special role",active:true,countsAsPlaced:false},
 {label:"Hidden legacy",active:false,countsAsPlaced:false},
];
const empty = {label:"Full-time",countsAsPlaced:true};

describe("college drive job-type selection", () => {
 it("preserves a historical inactive label only when left unchanged", () => {
  expect(resolveTpoDriveJobTypeChoice(" Hidden legacy ",
   {label:"Hidden legacy",countsAsPlaced:false},configured,builtins))
   .toEqual({label:"Hidden legacy",countsAsPlaced:false});
  expect(resolveTpoDriveJobTypeChoice("Hidden legacy",empty,configured,builtins)).toBeNull();
 });
 it("rejects hidden builtins, unknown labels, null, and whitespace", () => {
  expect(resolveTpoDriveJobTypeChoice("Full-time",
   {label:"Special role",countsAsPlaced:false},configured,builtins)).toBeNull();
  expect(resolveTpoDriveJobTypeChoice("Unknown",empty,configured,builtins)).toBeNull();
  expect(resolveTpoDriveJobTypeChoice(null,empty,configured,builtins)).toBeNull();
  expect(resolveTpoDriveJobTypeChoice(" ",empty,configured,builtins)).toBeNull();
 });
 it("maps an active custom label and keeps its placed-count rule", () => {
  expect(resolveTpoDriveJobTypeChoice(" special   role ",empty,configured,builtins))
   .toEqual({label:"Special role",countsAsPlaced:false});
  expect(resolveTpoDriveJobTypeChoice("Internship",empty,configured,builtins))
   .toEqual({label:"Internship",countsAsPlaced:false});
 });
 it("DB019 preserves nullable historic policy and never invents true on unchanged label",()=>{
  expect(resolveTpoDriveJobTypeChoice(" Full-time ",
    {label:"Full-time",countsAsPlaced:null},[],builtins))
    .toEqual({label:"Full-time",countsAsPlaced:null});
  expect(resolveTpoDriveJobTypeChoice("Hidden legacy",
    {label:"Hidden legacy",countsAsPlaced:null},configured,builtins))
    .toEqual({label:"Hidden legacy",countsAsPlaced:null});
 });
 it("DB019 college configured placed decision overrides builtin, missing custom policy fails closed",()=>{
  const local=[
    {label:"Full-time",active:true,countsAsPlaced:false},
    {label:"Unaudited",active:true,countsAsPlaced:null},
  ];
  expect(resolveTpoDriveJobTypeChoice("Full-time",
    {label:"Internship",countsAsPlaced:false},local,builtins))
    .toEqual({label:"Full-time",countsAsPlaced:false});
  expect(resolveTpoDriveJobTypeChoice("Unaudited",empty,local,builtins))
    .toBeNull();
 });
 it("DB019 all drive writers preserve explicit college policy instead of defaulting to true",()=>{
  const job=readFileSync(join(process.cwd(),"src/modules/placements/job-service.ts"),"utf8");
  const admin=readFileSync(join(process.cwd(),
    "src/modules/placements/super-admin-published-drive-edit-service.ts"),"utf8");
  expect(job).toContain("configured?.countsAsPlaced ?? builtin?.countsAsPlaced");
  expect(job).not.toContain("builtin?.countsAsPlaced ?? configured?.countsAsPlaced ?? true");
  expect(admin).toContain("const countsAsPlaced=sameType?job.countsAsPlaced:");
  expect(admin).toContain("configured?.countsAsPlaced??builtin?.countsAsPlaced");
 });
 it("validates job types inside the college-scoped edit transaction", () => {
  const file=readFileSync(join(process.cwd(),
   "src/modules/placements/tpo-drive-edit-service.ts"),"utf8");
  expect(file).toContain("eq(placementTpoJobTypes.collegeId,collegeId)");
  expect(file).toContain("resolveTpoDriveJobTypeChoice(");
  expect(file).toContain('new PlacementsServiceError("PLACEMENT_JOB_TYPE_INVALID")');
  expect(file).toContain("countsAsPlaced:selectedJobType.countsAsPlaced");
 });
});
