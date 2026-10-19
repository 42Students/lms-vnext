"use client";
import { Select } from "@/components/ui/select";

import {DataTable} from "@/components/ui/data-table";

import { useState } from "react";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
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
  const {pending,run:guardRun}=useGuardedAction({busyLabel:"Importing..."});
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(action: "PREVIEW" | "IMPORT") {
    setError(null);
    const payload=await apiFetch<{report:Report}>("/api/people/student-import",{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({action,csv,programId,cohortId,sectionId:sectionId||undefined,
        confirm:action==="IMPORT"?confirm:false}),
    });
    if(!payload?.report)throw Error("Unable to validate student CSV. Please try again.");
    setReport(payload.report as Report);
    if (action === "IMPORT") {
      setConfirm(false);
      router.refresh();
    }
  }

  const csvDownload = report ? "data:text/csv;charset=utf-8," +
    encodeURIComponent("\uFEFF" + studentImportReportCsv(report.results)) : null;

  return <div className="space-y-6">
    <section className="border-t border-border pt-4">
      <h2 className="text-lg font-semibold text-foreground">Upload or paste CSV</h2>
      <p className="mt-2 text-sm text-body">
        Maximum 500 learner rows and 1 MB. Use the exact header order below.
        Choose a program and batch from the selectors; you do not need to copy their IDs into legacy CSV rows.
        Indian 10-digit mobile numbers are normalized to +91 for the legacy template.
        The dry run checks format, college ownership, duplicate rows and existing account conflicts. All rows must validate before import.
      </p>
      <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{TEMPLATE}</p>
      <a download="student-import-template.csv"
        href={"data:text/csv;charset=utf-8,"+encodeURIComponent(TEMPLATE+"\n")}
        className="mt-2 inline-flex min-h-11 items-center rounded-[var(--lms-control-radius,9px)] border border-border px-3 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">
        Download CSV template
      </a>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1 text-sm font-semibold">Program
          <Select required value={programId}
            onChange={event=>{setProgramId(event.target.value);setCohortId("");setSectionId("");setReport(null);}}
            className="min-h-11 rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)] text-base sm:text-sm">
            <option value="">Choose program</option>
            {choices.programs.map(option=><option key={option.id} value={option.id}>{option.name}</option>)}
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold">Batch
          <Select required value={cohortId}
            onChange={event=>{setCohortId(event.target.value);setSectionId("");setReport(null);}}
            className="min-h-11 rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)] text-base sm:text-sm">
            <option value="">Choose batch</option>
            {choices.batches.filter(option=>option.programId===programId).map(option=>
              <option key={option.id} value={option.id}>{option.name}</option>)}
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold">Class/Section
          <Select value={sectionId}
            onChange={event=>{setSectionId(event.target.value);setReport(null);}}
            className="min-h-11 rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)] text-base sm:text-sm">
            <option value="">No class placement</option>
            {choices.classes.filter(option=>option.cohortId===cohortId).map(option=>
              <option key={option.id} value={option.id}>{option.name} · capacity {option.capacity??"unlimited"}</option>)}
          </Select>
        </label>
      </div>
      <label className="mt-4 grid gap-2 text-sm font-semibold text-body">
        Choose local CSV file
        <input type="file" accept=".csv,text/csv" className="max-w-full text-sm"
          onChange={async event => {
            const file = event.currentTarget.files?.[0];
            if (!file) return;
            if (file.size > 1000000) { setError("File exceeds 1 MB"); return; }
            setCsv(await file.text()); setReport(null); setConfirm(false); setError(null);
          }} />
      </label>
      <label className="mt-4 grid gap-2 text-sm font-semibold text-body">
        CSV contents
        <textarea value={csv} onChange={event => {
          setCsv(event.target.value); setReport(null); setConfirm(false);
        }} rows={8} spellCheck={false}
          className="w-full rounded-[var(--lms-control-radius,9px)] border border-border bg-surface p-3 font-mono text-xs text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)] text-base sm:text-sm" />
      </label>
      <button type="button" disabled={pending || !csv.trim() || !programId || !cohortId} onClick={() => guardRun(async () => {
        try { await submit("PREVIEW"); } catch (reason) {
          setError(reason instanceof Error ? reason.message : "Validation failed");
        }
      })} className="mt-4 min-h-11 rounded-[var(--lms-control-radius,9px)] bg-primary px-5 text-sm font-semibold text-on-primary disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">
        {pending ? "Validating..." : "Preview validation"}
      </button>
      {error ? <p role="alert" className="mt-3 text-sm text-error">{error}</p> : null}
    </section>

    {report ? <section aria-label="CSV validation and result report"
      className="space-y-4 - border-t border-border pt-4">
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
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius,9px)] border border-border px-4 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">
        Export neutralized result CSV
      </a> : null}
      <DataTable<StudentCsvResult> caption="Student CSV validation and import results"
        rows={report.results} getRowKey={item=>String(item.row)}
        columns={[
          {key:"row",header:"Row",cell:item=>item.row,mobilePriority:"primary"},
          {key:"status",header:"Status",cell:item=>item.status,mobilePriority:"secondary"},
          {key:"reason",header:"Reason",cell:item=>item.detail,mobilePriority:"secondary"},
        ]}
        empty={<p className="text-sm text-body">No row-level results are available.</p>}/>

      {report.preview && report.valid > 0 && report.invalid === 0 && report.structuralErrors.length === 0 ? <div className="space-y-3">
        <label className="flex items-start gap-2 text-sm text-body">
          <input type="checkbox" checked={confirm} onChange={event => setConfirm(event.target.checked)}
            className="mt-1" />
          I understand that importing creates real identities and memberships, successful rows are not rolled back,
          and any partial onboarding requires manual enrollment recovery.
        </label>
        <button type="button" disabled={!confirm || pending}
          onClick={() => guardRun(async () => {
            try { await submit("IMPORT"); } catch (reason) {
              setError(reason instanceof Error ? reason.message : "Import failed");
            }
          })}
          className="min-h-11 rounded-[var(--lms-control-radius,9px)] bg-primary px-5 text-sm font-semibold text-on-primary disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">
          {pending ? "Importing..." : "Confirm import of validated rows"}
        </button>
      </div> : null}
    </section> : null}
  </div>;
}
