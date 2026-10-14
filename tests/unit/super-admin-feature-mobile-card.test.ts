import { describe, expect, it } from "vitest";
import { collegeModuleCardSummary, describeModuleDecision } from "@/modules/module-access/admin-read-model";
describe("Super Admin mobile feature matrix projections",()=>{
  it("projects only source-backed enabled/locked/rule metrics",()=>{
    const rows=[
      {enabled:true,locked:true,source:"PERSISTED" as const},
      {enabled:false,locked:false,source:"SOURCE_DEFAULT" as const},
      {enabled:true,locked:false,source:"PERSISTED" as const},
    ];
    expect(collegeModuleCardSummary(rows)).toEqual({enabled:2,disabled:1,locked:1,persisted:2});
  });
  it("describes persisted locks without implying a student entitlement",()=>{
    expect(describeModuleDecision({source:"PERSISTED",level:"COLLEGE",locked:true}))
      .toBe("Persisted college rule · locked");
    expect(collegeModuleCardSummary([])).toEqual({enabled:0,disabled:0,locked:0,persisted:0});
  });
});
