"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LEGACY_STUDENT_CSV_COLUMNS, studentImportReportCsv, type StudentCsvResult } from "@/modules/people/college-student-csv-model";

type Report = {
  preview: boolean;
  structuralErrors: string[];
  valid: number;
  invalid: number;
  results: StudentCsvResult[];
};

const TEMPLATE = LEGACY_STUDENT_CSV_COLUMNS.join(",");
type Choices = {programs: {id:string;name:string}[]; batches:{id:string;name:string;programId:string}[];
  classes:{id:string;name:string;cohortId:string;capacity:number|null}[]};

export function CollegeStudentCsvImport({ choices }: {choices:Choices}) {
  const router = useRouter();
  const [csv, setCsv] = useState(TEMPLATE + "\n");
  const [programId,setProgramId] = useState("");
  const [cohortId,setCohortId] = useState("");
  const [sectionId,setSectionId] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(action: "PREVIEW" | "IMPORT") {
    setError(null);
    const response = await fetch("/api/people/student-import", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, csv, programId, cohortId, sectionId:sectionId||undefined,
        confirm: action === "IMPORT" ? confirm : false }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.report) {
      throw new Error(payload?.error ?? "Unable to validate student CSV");
    }
    setReport(payload.report as Report);
    if (action === "IMPORT") {
      setConfirm(false);
      router.refresh();
    }
  }

  const csvDownload = report ? "data:text/csv;charset=utf-8," +
    encodeURIComponent("\uFEFF" + studentImportReportCsv(report.results)) : null;

  return <div className="space-y-6">
    <section className="rounded-xl border border-border bg-surface p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-foreground">Upload or paste CSV</h2>
      <p className="mt-2 text-sm text-body">
        Maximum 100 learner rows and 100 KB. Use the exact header order below.
        Every row must include an E.164 phone number and the registered program/batch UUIDs.
        The dry run validates format and college ownership; existing identity conflicts are checked during import.
      </p>
      <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{TEMPLATE}</p>
      <a download="student-import-template.csv"
        href={"data:text/csv;charset=utf-8,"+encodeURIComponent(TEMPLATE+"\n")}
        className="mt-2 inline-flex min-h-10 items-center rounded border border-border px-3 text-sm font-semibold text-primary-text">
        Download CSV template
      </a>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1 text-sm font-semibold">Program
          <select required value={programId}
            onChange={event=>{setProgramId(event.target.value);setCohortId("");setSectionId("");setReport(null);}}
            className="min-h-11 rounded border border-border bg-surface px-3">
            <option value="">Choose program</option>
            {choices.programs.map(option=><option key={option.id} value={option.id}>{option.name}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold">Batch
          <select required value={cohortId}
            onChange={event=>{setCohortId(event.target.value);setSectionId("");setReport(null);}}
            className="min-h-11 rounded border border-border bg-surface px-3">
            <option value="">Choose batch</option>
            {choices.batches.filter(option=>option.programId===programId).map(option=>
              <option key={option.id} value={option.id}>{option.name}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold">Class/Section
          <select value={sectionId}
            onChange={event=>{setSectionId(event.target.value);setReport(null);}}
            className="min-h-11 rounded border border-border bg-surface px-3">
            <option value="">No class placement</option>
            {choices.classes.filter(option=>option.cohortId===cohortId).map(option=>
              <option key={option.id} value={option.id}>{option.name} · capacity {option.capacity??"unlimited"}</option>)}
          </select>
        </label>
      </div>
      <label className="mt-4 grid gap-2 text-sm font-semibold text-body">
        Choose local CSV file
        <input type="file" accept=".csv,text/csv" className="max-w-full text-sm"
          onChange={async event => {
            const file = event.currentTarget.files?.[0];
            if (!file) return;
            if (file.size > 1000000) { setError("File exceeds 1 MB"); return; }
            setCsv(await file.text()); setReport(null); setConfirm(false);
          }} />
      </label>
      <label className="mt-4 grid gap-2 text-sm font-semibold text-body">
        CSV contents
        <textarea value={csv} onChange={event => {
          setCsv(event.target.value); setReport(null); setConfirm(false);
        }} rows={8} spellCheck={false}
          className="w-full rounded-md border border-border bg-surface p-3 font-mono text-xs text-foreground" />
      </label>
      <button type="button" disabled={pending || !csv.trim() || !programId || !cohortId} onClick={() => startTransition(async () => {
        try { await submit("PREVIEW"); } catch (reason) {
          setError(reason instanceof Error ? reason.message : "Validation failed");
        }
      })} className="mt-4 min-h-11 rounded-md bg-primary px-5 text-sm font-semibold text-on-primary disabled:opacity-50">
        {pending ? "Validating..." : "Preview validation"}
      </button>
      {error ? <p role="alert" className="mt-3 text-sm text-error">{error}</p> : null}
    </section>

    {report ? <section aria-label="CSV validation and result report"
      className="space-y-4 rounded-xl border border-border bg-surface p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-foreground">
        {report.preview ? "Dry-run report" : "Import result"}
      </h2>
      <p className="text-sm text-body">{report.valid} structurally valid; {report.invalid} invalid.
        {report.preview ? " No learner has been created or enrolled." :
          " Import is per-row. PARTIAL means onboarding succeeded but enrollment did not."}</p>
      {report.structuralErrors.length ? <p role="alert" className="text-sm text-error">
        {report.structuralErrors.join(", ")}
      </p> : null}
      {csvDownload ? <a href={csvDownload} download="student-import-result.csv"
        className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
        Export neutralized result CSV
      </a> : null}
      <div className="overflow-x-auto">
        {report.results.length ? <table className="w-full min-w-[30rem] text-left text-sm">
          <thead><tr><th className="px-3 py-2">Row</th>
            <th className="px-3 py-2">Status</th><th className="px-3 py-2">Reason</th></tr></thead>
          <tbody>{report.results.map(item => <tr key={item.row} className="border-t border-border">
            <td className="px-3 py-3">{item.row}</td>
            <td className="px-3 py-3">{item.status}</td>
            <td className="px-3 py-3">{item.detail}</td>
          </tr>)}</tbody>
        </table> : <p className="text-sm text-body">No row-level results are available.</p>}
      </div>
      {report.preview && report.valid > 0 && report.structuralErrors.length === 0 ? <div className="space-y-3">
        <label className="flex items-start gap-2 text-sm text-body">
          <input type="checkbox" checked={confirm} onChange={event => setConfirm(event.target.checked)}
            className="mt-1" />
          I understand that importing creates real identities and memberships, successful rows are not rolled back,
          and any partial onboarding requires manual enrollment recovery.
        </label>
        <button type="button" disabled={!confirm || pending}
          onClick={() => startTransition(async () => {
            try { await submit("IMPORT"); } catch (reason) {
              setError(reason instanceof Error ? reason.message : "Import failed");
            }
          })}
          className="min-h-11 rounded-md bg-primary px-5 text-sm font-semibold text-on-primary disabled:opacity-50">
          {pending ? "Importing..." : "Confirm import of validated rows"}
        </button>
      </div> : null}
    </section> : null}
  </div>;
}
