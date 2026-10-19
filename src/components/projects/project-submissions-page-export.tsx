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

export function ProjectSubmissionsPageExport({ rows }: { rows: readonly SubmissionRow[] }) {
  function exportPage() {
    const headings = ["Workspace","Submission type","Review status","Pending (days)","Submitted",
      "Revisions","Reviewed by","Source link","Demo link","Version"];
    const data = rows.map(row => [row.workspace,row.submissionType,row.status,row.pendingDays,
      row.submittedAt,row.revisions,row.reviewedBy,row.sourceUrl,row.demoUrl,row.version]);
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
