import { describe, expect, it } from "vitest";
import {
  templateDirectoryHref,
  templateDirectoryPages,
  templateDirectoryQuerySchema,
  parseSuperAdminTemplateDirectoryQuery,
  TEMPLATE_DIRECTORY_PAGE_SIZE,
} from "@/modules/projects/super-admin-template-directory-model";

describe("IIT Dharwad Projects: Super Admin template catalogue query resilience", () => {
  it("PROJ-BREAK-ux-40 malformed search, unknown lifecycle or gigantic page fails validation", () => {
    for (const input of [
      { q: "a".repeat(101) },
      { page: 0 },
      { page: -1 },
      { page: "Infinity" },
      { page: "NaN" },
      { page: 1001 },
      { page: "2.5" },
      { status: "DELETED" },
      { status: "ARCHIVED", force: true },
    ]) {
      expect(templateDirectoryQuerySchema.safeParse(input).success, JSON.stringify(input)).toBe(false);
    }
    expect(templateDirectoryQuerySchema.parse({})).toEqual({
      q: "", status: "ALL", page: 1,
    });
  });

  it("PROJ-BREAK-templates-107 forged, repeated and contradictory admin catalogue URL fields are rejected",()=>{
    expect(parseSuperAdminTemplateDirectoryQuery({q:"  Dharwad  ",status:"PUBLISHED",page:"2"}))
      .toMatchObject({success:true,data:{q:"Dharwad",status:"PUBLISHED",page:2}});
    for(const invalid of [
      {q:["own","other"]},{status:["PUBLISHED","ARCHIVED"]},
      {page:["1","2"]},{page:"0x10"},{page:"1e2"},
      {page:""},{page:" "},{page:"1001"},
      {collegeId:"other-tenant"},{sort:"secret"},{status:"PUBLISHED",force:"true"},
    ]){
      expect(parseSuperAdminTemplateDirectoryQuery(invalid).success,JSON.stringify(invalid)).toBe(false);
    }
  });

  it("PROJ-BREAK-scale-25 pagination never emits NaN, Infinity, zero or negative page counts", () => {
    expect(TEMPLATE_DIRECTORY_PAGE_SIZE).toBe(20);
    for (const total of [Number.NaN, Infinity, -Infinity, -1, Number.NEGATIVE_INFINITY]) {
      expect(templateDirectoryPages(total)).toBe(1);
    }
    expect(templateDirectoryPages(0)).toBe(1);
    expect(templateDirectoryPages(20)).toBe(1);
    expect(templateDirectoryPages(21)).toBe(2);
    expect(templateDirectoryPages(2000)).toBe(100);
  });

  it("PROJ-BREAK-ux-41 template directory links encode hostile search strings without injected query keys", () => {
    const query = templateDirectoryQuerySchema.parse({
      q: "&status=PUBLISHED#fragment",
      status: "ARCHIVED",
      page: 3,
    });
    const path = templateDirectoryHref(query);
    const result = new URL(path, "https://college.example");
    expect(result.pathname).toBe("/admin/projects/templates");
    expect(result.searchParams.getAll("q")).toEqual(["&status=PUBLISHED#fragment"]);
    expect(result.searchParams.getAll("status")).toEqual(["ARCHIVED"]);
    expect(result.searchParams.getAll("page")).toEqual(["3"]);
    expect(result.searchParams.size).toBe(3);
    expect(templateDirectoryHref(templateDirectoryQuerySchema.parse({})))
      .toBe("/admin/projects/templates");
  });
});
