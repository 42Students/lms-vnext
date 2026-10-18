import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {projectAdminUnsubmittedHref,projectAdminSubmissionHref} from "@/modules/projects/admin-submissions-query-model";

describe("IIT Dharwad Projects: unsubmitted page never loses its filters",()=>{
  it("PROJ-BREAK-submissions-40 exact query, status and row-size survive pagination and are encoded",()=>{
    const href=projectAdminUnsubmittedHref("/college/projects/submissions",{
      q:"100% / IIT & other",status:"ACTIVE",pageSize:50,
    },3);
    const url=new URL(href,"https://example.invalid");
    expect(url.pathname).toBe("/college/projects/submissions");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      view:"NOT_SUBMITTED",q:"100% / IIT & other",status:"ACTIVE",
      pageSize:"50",page:"3",
    });
    expect(projectAdminUnsubmittedHref("/admin/projects/submissions",{},1))
      .toBe("/admin/projects/submissions?view=NOT_SUBMITTED");
    expect(href).not.toContain("submissionStatus");
  });

  it("PROJ-BREAK-submissions-47 changing tabs never resets search, workspace status or rows",()=>{
    const scope={q:"IIT & nearby",status:"ACTIVE" as const,pageSize:50};
    const all=projectAdminSubmissionHref("/admin/projects/submissions",scope);
    const review=projectAdminSubmissionHref("/admin/projects/submissions",scope,"UNDER_REVIEW");
    const unsubmitted=projectAdminUnsubmittedHref("/admin/projects/submissions",scope);
    expect(Object.fromEntries(new URL(all,"https://example.invalid").searchParams)).toEqual({
      q:"IIT & nearby",status:"ACTIVE",pageSize:"50",
    });
    expect(Object.fromEntries(new URL(review,"https://example.invalid").searchParams)).toEqual({
      q:"IIT & nearby",status:"ACTIVE",pageSize:"50",submissionStatus:"UNDER_REVIEW",
    });
    expect(Object.fromEntries(new URL(unsubmitted,"https://example.invalid").searchParams)).toEqual({
      view:"NOT_SUBMITTED",q:"IIT & nearby",status:"ACTIVE",pageSize:"50",
    });
    const code=readFileSync("src/components/projects/project-admin-submissions-page.tsx","utf8");
    expect(code).toContain('projectAdminSubmissionHref(queuePath,query,"UNDER_REVIEW")');
    expect(code).toContain('projectAdminSubmissionHref(queuePath,query,"LOCKED")');
    expect(code).toContain('projectAdminSubmissionHref(queuePath,query,"DRAFT_REVISING")');
  });
  it("PROJ-BREAK-submissions-41 the unsubmitted tab does not depend on summary or other delivery results",()=>{
    const source=readFileSync("src/components/projects/project-admin-submissions-page.tsx","utf8");
    expect(source).toContain('view==="ALL"?await Promise.all([');
    expect(source).toContain('view==="NOT_SUBMITTED"?await listProjectAdminUnsubmitted(');
    expect(source).toContain('status:query.status');
    expect(source).toContain('filterView="NOT_SUBMITTED"');
    expect(source).toContain('projectAdminUnsubmittedHref(queuePath,query,unsubmitted.page+1)');
    expect(source).toContain('projectAdminUnsubmittedHref(queuePath,query,unsubmitted.page-1)');
    const form=readFileSync("src/components/projects/project-admin-collection-controls.tsx","utf8");
    expect(form).toContain('name="view" value={filterView}');
    expect(form).toContain('filterView?"?view=NOT_SUBMITTED":"?"');
  });
});
