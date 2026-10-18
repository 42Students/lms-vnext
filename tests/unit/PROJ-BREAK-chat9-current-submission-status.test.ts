import {describe,expect,it} from "vitest";
import {PgDialect} from "drizzle-orm/pg-core";
import {readFileSync} from "node:fs";
import {isCurrentProjectSubmissionSql} from "@/modules/projects/admin-submission-current-version-model";

describe("IIT Dharwad project submissions: latest status belongs to the current version",()=>{
  it("PROJ-BREAK-reports-71 rejects historic pending-review versions after resubmission",()=>{
    const query=new PgDialect().sqlToQuery(isCurrentProjectSubmissionSql());
    const rendered=query.sql.replace(/\s+/g," ");
    expect(rendered).toContain('"project_submissions"."version" = (');
    expect(rendered).toContain("select max(latest.version)");
    expect(rendered).toContain('latest.project_id = "project_submissions"."project_id"');
    expect(rendered).not.toContain('latest.project_id = "project_id"');
    expect(query.params).toEqual([]);
  });

  it("PROJ-BREAK-reports-72 operational shortcuts exclude stale versions but All keeps history",()=>{
    const source=readFileSync("src/modules/projects/admin-insights-service.ts","utf8");
    const queue=source.slice(source.indexOf("export async function listProjectAdminSubmissionQueue"));
    expect(queue).toContain('query.submissionStatus?isCurrentProjectSubmissionSql():undefined');
    expect(queue).toContain('query.submissionStatus==="UNDER_REVIEW"');
    expect(queue).toContain('query.submissionStatus==="LOCKED"');
    expect(queue).toContain('query.submissionStatus==="DRAFT_REVISING"');
    expect(queue).toContain('query.submissionStatus==="APPROVED"');
    expect(queue).toContain('eq(projectInstances.collegeId, college.id)');
    expect(queue).toContain('.where(where)');
    expect(queue).toContain('db.select({ value: count() })');
    expect(queue).toContain('.limit(query.pageSize)');
  });
});
