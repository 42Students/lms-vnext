import {describe,expect,it} from "vitest";
import {PgDialect} from "drizzle-orm/pg-core";
import {latestReviewedProjectSubmissionSql} from "@/modules/projects/admin-submission-kpi-model";
import {readFileSync} from "node:fs";

describe("IIT Dharwad Projects: dashboard counts navigate to equivalent result sets",()=>{
  it("PROJ-BREAK-reports-51 counts only current, not reopened, approved delivery",()=>{
    const rendered=new PgDialect().sqlToQuery(latestReviewedProjectSubmissionSql());
    const statement=rendered.sql.replace(/\s+/g," ");
    expect(statement).toContain("coalesce((");
    expect(statement).toContain("sub.status = 'APPROVED'");
    expect(statement).toContain("sub.reopened_at is null");
    expect(statement).toContain('sub.project_id = "project_instances"."id"');
    expect(statement).toContain("order by sub.version desc limit 1");
    expect(statement).toContain("false");
    expect(rendered.params).toEqual([]);
    const service=readFileSync("src/modules/projects/admin-insights-service.ts","utf8");
    expect(service).toContain("const latestApproved=latestReviewedProjectSubmissionSql();");
    expect(service).toContain("reviewed: sql<number>`count(*) filter (where ${latestApproved})`");
  });
  it("PROJ-BREAK-reports-50 Pending and Needs-action cards target ACTIVE workspaces, not archived history",()=>{
    const page=readFileSync("src/components/projects/project-admin-submissions-page.tsx","utf8");
    expect(page).toContain('basePath+"?status=ACTIVE"');
    expect(page).toContain('queuePath+"?status=ACTIVE&submissionStatus=SUBMITTED"');
    expect(page).toContain('queuePath+"?status=ACTIVE&submissionStatus=CHANGES_REQUESTED"');
    expect(page).toContain('queuePath+"?submissionStatus=APPROVED"');
    expect(page).toContain("summary.pendingReview");
    expect(page).toContain("summary.needsStudentAction");
    expect(page).toContain("summary.reviewed");
  });
});
