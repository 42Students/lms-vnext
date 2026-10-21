"use client";
import { FileUpload } from "@/components/ui/file-upload";
import { Textarea } from "@/components/ui/textarea";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";

type ImportResult = {
  requested: number; added: number; waitlisted: number; errors: number;
  results: { rowNumber: number; email: string; status: string }[];
  errorCsv: string;
};
type Result = {
  groupId: string; status: string; total: number; ready: number; blocked: number;
  rows: { rowNumber: number; email: string; status: string }[];
  warning: string; errorCsv: string;
};

export function CollegeGroupImportPreview({ groupId }: { groupId: string }) {
  const [csv, setCsv] = useState("email\n");
  const csvRevision = useRef(0);
  const [result, setResult] = useState<Result | null>(null);
  const [imported, setImported] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [reading, setReading] = useState(false);
  async function load(file: File | null) {
    if (!file) return;
    const revision = ++csvRevision.current;
    setError("");
    setResult(null);
    setImported(null);
    if (file.size > 524288) {
      setError("CSV file exceeds the 512 KiB maximum.");
      return;
    }
    setReading(true);
    try { const next = await file.text(); if (revision === csvRevision.current) setCsv(next); }
    catch { if (revision === csvRevision.current) setError("The selected CSV could not be read."); }
    finally { setReading(false); }
  }
  function preview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    setImported(null);
    const revision = csvRevision.current;
    const submittedCsv = csv;
    startTransition(async () => {
      try {
        const response = await fetch("/api/college/groups/import-preview", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ groupId, csv: submittedCsv }),
        });
        const payload: unknown = await response.json();
        if (!response.ok) {
          const code = typeof payload === "object" && payload !== null &&
            "error" in payload && typeof payload.error === "string"
            ? payload.error : "Import preview failed";
          throw new Error(code);
        }
        if (revision === csvRevision.current) setResult(payload as Result);
      } catch (cause) {
        if (revision === csvRevision.current) setError(cause instanceof Error ? cause.message : "Unable to preview CSV");
      }
    });
  }
  function confirm() {
    if (!result || !result.ready || pending || reading) return;
    setError("");
    setImported(null);
    const revision = csvRevision.current;
    const submittedCsv = csv;
    startTransition(async () => {
      try {
        const response = await fetch("/api/college/groups/import", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ groupId, csv: submittedCsv }),
        });
        const payload: unknown = await response.json();
        if (!response.ok) {
          const code = typeof payload === "object" && payload !== null &&
            "error" in payload && typeof payload.error === "string"
            ? payload.error : "Import failed";
          throw new Error(code);
        }
        if (revision === csvRevision.current) setImported(payload as ImportResult);
      } catch (cause) {
        if (revision === csvRevision.current) setError(cause instanceof Error ? cause.message : "Unable to import members");
      }
    });
  }
  return <div className="min-w-0 space-y-4">
    <form onSubmit={preview} className="min-w-0 space-y-3 border-b border-border pb-4">
      <p className="text-sm text-body leading-[22px]">
        Upload a CSV with one column named <code>Email</code>. Maximum 2,000 rows and 512 KiB.
        Only currently active learners in this college are eligible.
      </p>
      <FileUpload label="Select CSV file" accept=".csv,text/csv" maxBytes={524288}
        disabled={pending||reading} onFiles={files=>void load(files?.[0]??null)}/>
      <Button type="submit" loading={pending || reading} className="min-h-11 w-full md:min-h-9 md:w-auto" disabled={reading || pending || !csv.trim()}>
        {pending ? "Validating…" : "Preview members"}
      </Button>
      <details className="min-w-0 border-t border-border pt-3">
        <summary className="min-h-11 cursor-pointer py-2 font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">CSV contents</summary>
        <label className="mt-3 grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">CSV contents
          <Textarea rows={8} maxLength={524288} value={csv}
            onChange={(event) => { csvRevision.current++; setCsv(event.target.value); setResult(null); setImported(null); setError(""); }}
            className="font-mono text-sm" />
        </label>
      </details>
      {error ? <Alert tone="error">{error}</Alert> : null}
    </form>
    {result ? <section aria-label="Student group CSV validation report" className="min-w-0 space-y-3">
      <h2 className="text-lg font-semibold text-[var(--lms-heading)]">
        Dry run: {result.ready} ready, {result.blocked} blocked, {result.total} examined
      </h2>
      {result.warning ? <Alert tone="warning">{result.warning}</Alert> : null}
      {!imported && result.ready > 0 ? <Button type="button" loading={pending}
        disabled={pending || reading} onClick={confirm}>
        Confirm import of {result.ready} eligible learner{result.ready===1?"":"s"}
      </Button> : null}
      <a href={"data:text/csv;charset=utf-8," + encodeURIComponent(result.errorCsv)}
        download="group-import-validation-errors.csv"
        className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
        Download safe error CSV
      </a>
      {result.rows.length === 0 ? <EmptyState title="No learner rows" description="No learner rows were supplied."/> : (
        <div className="max-h-[35rem] min-w-0 overflow-auto border-y border-border">
          <DataTable<Result["rows"][number]>
            caption="Group import preview validation"
            rows={result.rows} getRowKey={row=>String(row.rowNumber)}
            empty={<EmptyState title="No learner rows" description="No learner rows were supplied."/>}
            columns={[
              {key:"row",header:"Row",mobilePriority:"primary",cell:row=>row.rowNumber},
              {key:"email",header:"Email",mobilePriority:"secondary",cell:row=><span className="break-all">{row.email}</span>},
              {key:"validation",header:"Validation",mobilePriority:"secondary",cell:row=>row.status.replaceAll("_"," ")},
            ]}/>
        </div>
      )}
    </section> : null}
    {imported ? <section aria-label="Confirmed group import results" className="min-w-0 space-y-3">
      <h2 className="text-lg font-semibold text-[var(--lms-heading)]">
        Import complete: {imported.added} added, {imported.waitlisted} waitlisted, {imported.errors} not added
      </h2>
      <Alert tone={imported.errors?"warning":"success"}>
        {imported.requested} learner rows processed. Each membership was rechecked when written.
      </Alert>
      {imported.errors > 0 ? <a href={"data:text/csv;charset=utf-8,"+encodeURIComponent(imported.errorCsv)}
        download="group-import-errors.csv" className="inline-flex min-h-11 items-center font-semibold text-link underline">
        Download import errors
      </a> : null}
      <div className="max-h-[35rem] min-w-0 overflow-auto border-y border-border">
        <DataTable<ImportResult["results"][number]>
          caption="Confirmed group membership import"
          rows={imported.results} getRowKey={row=>String(row.rowNumber)}
          columns={[
            {key:"row",header:"Row",cell:row=>row.rowNumber},
            {key:"email",header:"Email",cell:row=><span className="break-all">{row.email}</span>},
            {key:"result",header:"Result",cell:row=>row.status.replaceAll("_"," ")},
          ]}/>
      </div>
    </section> : null}
    <p className="text-xs leading-5 text-muted-foreground">
      Preview never writes memberships. Confirmed import rechecks active learner eligibility and
      capacity for each row and records partial successes without rolling them back.
    </p>
  </div>;
}
