"use client";
import { Button } from "@/components/ui/button";
import { projectAdminCsv } from "@/modules/projects/project-admin-csv-model";

type SubmissionRow = {
  workspace: string;
  version: number;
  status: string;
  submissionType: string;
  pendingDays: number | null;
  submittedAt: string | null;
  revisions: number | null;
  submittedBy?:string|null;
  reviewedBy: string | null;
  reviewedAt?:string|null;
  reviewedByType?:string|null;
  sourceUrl: string | null;
  demoUrl: string | null;
};

export function ProjectSubmissionsPageExport({ rows }: { rows: readonly SubmissionRow[] }) {
  function exportPage() {
    const headings = ["Workspace","Submission type","Review status","Pending (days)","Submitted",
      "Submitted by","Revisions","Reviewed by","Reviewed at","Reviewer role",
      "Source link","Demo link","Version"];
    const data = rows.map(row => [row.workspace,row.submissionType,row.status,row.pendingDays,
      row.submittedAt,row.submittedBy??"",row.revisions,
      row.reviewedBy,row.reviewedAt??"",row.reviewedByType??"",
      row.sourceUrl,row.demoUrl,row.version]);
    const csv = projectAdminCsv([headings,...data]);
    const objectUrl = URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = "project-submissions-page.csv";
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }
  return <Button variant="secondary" type="button" onClick={exportPage} disabled={rows.length===0}
    className="">
    Export CSV
  </Button>;
}

/** Separate legacy unsubmitted report; never mix a zero-row submitted result. */
export function ProjectUnsubmittedPageExport({rows}:{
  rows:readonly {title:string;mentorName?:string|null;status:string;
    progressPercent:number;inactiveDays:number|null}[];
}){
  function exportPage(){
    const csv=projectAdminCsv([["Workspace","Mentor","Status","Progress","Inactive"],
      ...rows.map(row=>[row.title,row.mentorName??"",row.status,
        row.progressPercent+"%",row.inactiveDays??""])]);
    const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
    const anchor=document.createElement("a");
    anchor.href=url;anchor.download="project-not-submitted.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return <Button type="button" variant="secondary" disabled={rows.length===0}
    onClick={exportPage}>Export CSV</Button>;
}
