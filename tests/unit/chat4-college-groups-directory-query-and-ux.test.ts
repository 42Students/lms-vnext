import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  collegeGroupsDirectoryHref,
  collegeGroupsDirectoryQuerySchema,
  parseCollegeGroupsDirectoryParams,
} from "@/modules/groups/college-group-directory-query-model";

const page = () => readFileSync(join(process.cwd(),"src/app/(authenticated)/college/groups/page.tsx"),"utf8");

describe("College Admin Student groups directory query and role journey", () => {
  it("COL-GROUPS-DIRECTORY-01 rejects repeated, forged, signed, exponent and overflowing page controls", () => {
    expect(parseCollegeGroupsDirectoryParams({})).toEqual({offset:0});
    expect(parseCollegeGroupsDirectoryParams({
      kind:"STUDY_GROUP",status:"ACTIVE",offset:"50",
    })).toEqual({kind:"STUDY_GROUP",status:"ACTIVE",offset:50});
    for (const raw of [
      {offset:["0","500"]},{kind:["STUDY_GROUP","ELECTIVE"]},
      {status:["ACTIVE","CLOSED"]},{organizationId:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"},
      {collegeId:"11111111-1111-4111-8111-111111111111"},
      {status:"MISSING"},{kind:"anything other than stored kind"},
      {offset:"1e2"},{offset:"0x20"},{offset:" 50"},
      {offset:"+50"},{offset:"-1"},{offset:"1.0"},
      {offset:"NaN"},{offset:"Infinity"},{offset:"100001"},
      {offset:"01"},{offset:"3foo"},
    ]) expect(parseCollegeGroupsDirectoryParams(raw)).toBeNull();
    expect(parseCollegeGroupsDirectoryParams({
      kind:"",status:"",offset:"",
    })).toEqual({offset:0});
    expect(collegeGroupsDirectoryQuerySchema.safeParse({offset:0}).success).toBe(true);
  });

  it("COL-GROUPS-DIRECTORY-02 maintains canonical pagination without exposing raw query params", () => {
    expect(collegeGroupsDirectoryHref({offset:0})).toBe("/college/groups");
    expect(collegeGroupsDirectoryHref({
      kind:"STUDY_GROUP",status:"ACTIVE",offset:50,
    })).toBe("/college/groups?kind=STUDY_GROUP&status=ACTIVE&offset=50");
    expect(() => collegeGroupsDirectoryHref({offset:-1})).toThrow();
    expect(() => collegeGroupsDirectoryHref({
      kind:"MALFORMED VALUE",offset:0,
    })).toThrow();
  });

  it("COL-GROUPS-DIRECTORY-03 checks college manage permission before even parsing malformed filters or listing groups", () => {
    const code = page();
    const role = code.indexOf('requirePermission(context, "academics.manage"');
    const parse = code.indexOf("parseCollegeGroupsDirectoryParams(await searchParams)");
    const listing = code.indexOf("listCollegeGroups(context, {");
    expect(role).toBeGreaterThan(-1);
    expect(parse).toBeGreaterThan(role);
    expect(listing).toBeGreaterThan(parse);
    expect(code).not.toContain("Number.parseInt(one(params.offset)");
    expect(code).toContain('title="Invalid group filters"');
    expect(code).toContain("Clear filters");
    expect(code).toContain("No groups found");
    expect(code).toContain("Managed elsewhere");
    expect(code).toContain("Showing {offset + 1}");
    expect(code).toContain("collegeGroupsDirectoryHref");
  });

  it("UX-COL-GROUPS-ONE-CANVAS-01 uses an unboxed filter area and existing responsive table actions", () => {
    const code = page();
    expect(code).toContain('className="flex flex-wrap items-end gap-3 border-t border-border pt-4"');
    expect(code).not.toContain("flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4");
    expect(code).toContain("min-h-11");
    expect(code).toContain("<DataTable");
    expect(code).toContain("<StatusBadge");
    expect(code).toContain("CollegeGroupActions");
    expect(code).toContain("Previous");
    expect(code).toContain("Next");
  });
});
