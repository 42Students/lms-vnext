import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {projectAdminElapsedDays} from "@/modules/projects/admin-submission-age-model";
import {safeProjectAdminUtcIso} from "@/modules/projects/project-admin-date-model";

describe("IIT Dharwad Projects: submission and inactivity date resilience",()=>{
  const now=new Date("2026-10-19T00:00:00.000Z");
  it("PROJ-BREAK-dates-78 counts complete elapsed UTC days without locale rounding",()=>{
    expect(projectAdminElapsedDays(new Date("2026-10-17T23:59:59.999Z"),now)).toBe(1);
    expect(projectAdminElapsedDays(new Date("2026-10-18T00:00:00.000Z"),now)).toBe(1);
    expect(projectAdminElapsedDays(new Date("2026-10-18T00:00:00.001Z"),now)).toBe(0);
    expect(projectAdminElapsedDays(new Date("2026-10-19T03:00:00.000Z"),now)).toBe(0);
  });
  it("PROJ-BREAK-dates-79 invalid dates and null do not become NaN or crash exported CSV",()=>{
    const bad=new Date(Number.NaN);
    expect(projectAdminElapsedDays(null,now)).toBeNull();
    expect(projectAdminElapsedDays(bad,now)).toBeNull();
    expect(projectAdminElapsedDays(now,bad)).toBeNull();
    expect(safeProjectAdminUtcIso(bad)).toBe("Date unavailable");
    expect(safeProjectAdminUtcIso(now)).toBe("2026-10-19T00:00:00.000Z");
  });
  it("PROJ-BREAK-dates-80 page and export share safe date helpers without direct throwing ISO conversions",()=>{
    const page=readFileSync("src/components/projects/project-admin-submissions-page.tsx","utf8");
    expect(page).toContain("projectAdminElapsedDays(row.updatedAt,renderedAt)");
    expect(page).toContain("projectAdminElapsedDays(submission.submittedAt,renderedAt)");
    expect(page).toContain("safeProjectAdminUtcIso(submission.submittedAt)");
    expect(page).not.toContain("submittedAt?.toISOString()");
    expect(page).not.toContain("Math.floor((renderedAt.getTime()-submission.submittedAt.getTime())");
  });
});
