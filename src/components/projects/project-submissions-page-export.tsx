"use client";

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

function csvField(input: string | number | null) {
  const value = String(input ?? "");
  const safe = /^[=+@\-\t\r]/.test(value) ? "'" + value : value;
  return '"' + safe.replaceAll('"','""') + '"';
}

export function ProjectSubmissionsPageExport({ rows }: { rows: readonly SubmissionRow[] }) {
  function exportPage() {
    const headings = ["Workspace","Submission type","Review status","Pending (days)","Submitted",
      "Revisions","Reviewed by","Source link","Demo link","Version"];
    const data = rows.map(row => [row.workspace,row.submissionType,row.status,row.pendingDays,
      row.submittedAt,row.revisions,row.reviewedBy,row.sourceUrl,row.demoUrl,row.version]);
    const csv = "\ufeff" + [headings,...data].map(row => row.map(csvField).join(",")).join("\r\n");
    const objectUrl = URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = "project-submissions-page.csv";
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }
  return <button type="button" onClick={exportPage} disabled={rows.length===0}
    className="min-h-10 rounded-md border border-border px-3 py-2 text-sm font-semibold disabled:opacity-50">
    Export CSV
  </button>;
}
