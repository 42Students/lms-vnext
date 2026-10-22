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
 it("validates job types inside the college-scoped edit transaction", () => {
  const file=readFileSync(join(process.cwd(),
   "src/modules/placements/tpo-drive-edit-service.ts"),"utf8");
  expect(file).toContain("eq(placementTpoJobTypes.collegeId,collegeId)");
  expect(file).toContain("resolveTpoDriveJobTypeChoice(");
  expect(file).toContain('new PlacementsServiceError("PLACEMENT_JOB_TYPE_INVALID")');
  expect(file).toContain("countsAsPlaced:selectedJobType.countsAsPlaced");
 });
});
