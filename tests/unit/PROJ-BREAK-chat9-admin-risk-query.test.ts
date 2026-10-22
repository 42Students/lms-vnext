import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseProjectAdminRiskQuery } from "@/modules/projects/admin-risk-query-model";

describe("IIT Dharwad Projects: Super and College Admin risk dashboard URL breaker", () => {
  it("PROJ-BREAK-ux-14 accepts authorized bucket and list bounds without discarding current filters", () => {
    expect(parseProjectAdminRiskQuery({})).toMatchObject({
      success:true,data:{page:1,pageSize:25},
    });
    expect(parseProjectAdminRiskQuery({
      q:"  IIT Dharwad  ",riskBucket:"REVIEW",riskSort:"SEVERITY",status:"ACTIVE",
      page:"2",pageSize:"25",
    })).toMatchObject({
      success:true,data:{q:"IIT Dharwad",riskBucket:"REVIEW",riskSort:"SEVERITY",
        status:"ACTIVE",page:2,pageSize:25},
    });
  });
  it("PROJ-BREAK-ux-15 rejects malicious or unbounded pagination, sorts and risk status", () => {
    for(const input of [
      {riskBucket:"__proto__"},{riskSort:"SQL"},{status:"DISABLED"},
      {page:"0"},{page:"1e309"},{page:"100001"},{pageSize:"1000"},
      {pageSize:"-1"},{page:"1.1"},{q:"x".repeat(121)},
      {page:["0","1"]},
    ])expect(parseProjectAdminRiskQuery(input).success,JSON.stringify(input)).toBe(false);
  });
  it("PROJ-BREAK-ux-16 the page renders an actionable error before any DB risk-queue call", () => {
    const file=readFileSync(join(process.cwd(),
      "src/components/projects/project-admin-at-risk-page.tsx"),"utf8");
    expect(file.indexOf("if (!parsed.success)")).toBeGreaterThan(-1);
    expect(file.indexOf("if (!parsed.success)")).toBeLessThan(file.indexOf("listProjectAdminRiskQueue("));
    expect(file).toContain('title="Invalid project filters"');
    expect(file).toContain('basePath + "/at-risk"');
  });
});
