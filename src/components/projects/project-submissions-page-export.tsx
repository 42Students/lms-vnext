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
  revisions: number;
  reviewedBy: string | null;
  sourceUrl: string | null;
  demoUrl: string | null;
};

export function ProjectSubmissionsPageExport({ rows,view="ALL" }: { rows: readonly SubmissionRow[]; view?:"ALL"|"NOT_SUBMITTED" }) {
  function exportPage() {
    const headings=view==="NOT_SUBMITTED"?["Workspace","Status","Progress"]:["Workspace","Submission type","Review status","Submitted at"];
    const data=rows.map(row=>view==="NOT_SUBMITTED"?[row.workspace,row.status,String(row.pendingDays??0)+"%"]:[row.workspace,row.submissionType,row.status,row.submittedAt]);
    const csv = projectAdminCsv([headings,...data]);
    const objectUrl = URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = view==="NOT_SUBMITTED"?"project-not-submitted.csv":"project-submissions.csv";
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }
  return <Button variant="secondary" type="button" onClick={exportPage} disabled={rows.length===0}
    className="">
    Export displayed page CSV
  </Button>;
}
