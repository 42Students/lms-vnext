import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  COLLEGE_COMPANY_PAGE_SIZE,
  GLOBAL_COMPANY_PAGE_SIZE,
} from "@/modules/placements/admin-company-directory-model";

describe("Super Admin company catalogue pagination parity", () => {
  it("shows 50 canonical identities globally and 10 college relationships per page", () => {
    expect(GLOBAL_COMPANY_PAGE_SIZE).toBe(50);
    expect(COLLEGE_COMPANY_PAGE_SIZE).toBe(10);
  });

  it("pages canonical identities before college enrichment and does not mix paging units", () => {
    const service = readFileSync(
      "src/modules/placements/admin-company-directory-service.ts", "utf8",
    );
    const [collegePart, globalPart] = service.split(
      "/** Platform-wide canonical employer identities.",
    );
    expect(globalPart).toBeDefined();
    expect(collegePart).toContain(".limit(COLLEGE_COMPANY_PAGE_SIZE)");
    expect(collegePart).toContain("Math.ceil(total/COLLEGE_COMPANY_PAGE_SIZE)");
    expect(globalPart).toContain(".from(placementCompanies).where(filter)");
    expect(globalPart).toContain(".limit(GLOBAL_COMPANY_PAGE_SIZE)");
    expect(globalPart).toContain("Math.ceil(total/GLOBAL_COMPANY_PAGE_SIZE)");
    expect(globalPart).toContain("companyCollegeCount:");
    expect(globalPart).toContain("driveCount:");
  });

  it("counts active matching-college relations and jobs in the distinct global page", () => {
    const source = readFileSync("src/modules/placements/admin-company-directory-service.ts","utf8");
    const global = source.split("/** Platform-wide canonical employer identities.")[1];
    expect(global).toBeDefined();
    const relationCount = global!.split("companyCollegeCount:sql<number>")[1]!.split("driveCount:sql<number>")[0]!;
    expect(relationCount).toContain("count(distinct r.college_id)");
    expect(relationCount).toContain("r.status='ACTIVE'");
    expect(relationCount).toContain("r.archived_at is null");
    const drives = global!.split("driveCount:sql<number>")[1]!.split("lastActiveAt:sql<Date|null>")[0]!;
    const lastActive = global!.split("lastActiveAt:sql<Date|null>")[1]!.split("}).from(placementCompanies)")[0]!;
    for (const fragment of [drives,lastActive]) {
      expect(fragment).toContain("r.college_id=j.college_id");
      expect(fragment).toContain("r.status='ACTIVE'");
      expect(fragment).toContain("r.archived_at is null");
      expect(fragment).toContain("j.status!='ARCHIVED'");
      expect(fragment).toContain("j.archived_at is null");
    }
    expect(global).toContain(".from(placementCompanies).where(filter)");
    expect(global).toContain(".limit(GLOBAL_COMPANY_PAGE_SIZE)");
  });

  it("labels the global page export with its actual page cap", () => {
    const view = readFileSync(
      "src/components/admin/super-admin-global-company-catalogue.tsx", "utf8",
    );
    expect(view).toContain("up to {data.cap} authorized global companies");
    expect(view).not.toContain("up to 10 authorized global companies");
  });
});
