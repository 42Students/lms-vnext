"use client";
import { FileUpload } from "@/components/ui/file-upload";
import { Textarea } from "@/components/ui/textarea";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";

type Result = {
  groupId: string; status: string; total: number; ready: number; blocked: number;
  rows: { rowNumber: number; email: string; status: string }[];
  warning: string; errorCsv: string;
};

export function CollegeGroupImportPreview({ groupId }: { groupId: string }) {
  const [csv, setCsv] = useState("email\n");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [reading, setReading] = useState(false);
  async function load(file: File | null) {
    if (!file) return;
    setError("");
    setResult(null);
    if (file.size > 131072) {
      setError("CSV file exceeds the 128 KiB maximum.");
      return;
    }
    setReading(true);
    try { setCsv(await file.text()); }
    catch { setError("The selected CSV could not be read."); }
    finally { setReading(false); }
  }
  function preview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/college/groups/import-preview", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ groupId, csv }),
        });
        const payload: unknown = await response.json();
        if (!response.ok) {
          const code = typeof payload === "object" && payload !== null &&
            "error" in payload && typeof payload.error === "string"
            ? payload.error : "Import preview failed";
          throw new Error(code);
        }
        setResult(payload as Result);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to preview CSV");
      }
    });
  }
  return <div className="space-y-5">
    <form onSubmit={preview} className="space-y-4 border-b border-border pb-4">
      <p className="text-sm text-body">
        Upload a CSV with one column named <code>email</code>. Maximum 500 rows and 128 KiB.
        Only currently active learners in this college are eligible.
      </p>
      <FileUpload label="Select CSV file" accept=".csv,text/csv" maxBytes={131072}
        disabled={pending||reading} onFiles={files=>void load(files?.[0]??null)}/>
      <label className="grid gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">CSV contents
        <Textarea rows={8} maxLength={131072} value={csv}
          onChange={(event) => { setCsv(event.target.value); setResult(null); }}
          className="font-mono text-sm" />
      </label>
      <Button type="submit" loading={pending || reading} className="min-h-11 md:min-h-9" disabled={reading || pending || !csv.trim()}>
        {pending ? "Validating…" : "Preview only (no import)"}
      </Button>
      {error ? <Alert tone="error">{error}</Alert> : null}
    </form>
    {result ? <section aria-label="Student group CSV validation report" className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">
        Dry run: {result.ready} ready, {result.blocked} blocked, {result.total} examined
      </h2>
      {result.warning ? <Alert tone="warning">{result.warning}</Alert> : null}
      <a href={"data:text/csv;charset=utf-8," + encodeURIComponent(result.errorCsv)}
        download="group-import-validation-errors.csv"
        className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
        Download safe error CSV
      </a>
      {result.rows.length === 0 ? <EmptyState title="No learner rows" description="No learner rows were supplied."/> : (
        <div className="max-h-[35rem] min-w-0 overflow-auto">
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
    <p className="text-xs leading-5 text-muted-foreground">
      Preview only. No memberships, capacity reservations or activity events are written.
      A future confirmed import must recheck membership and capacity under a transaction.
    </p>
  </div>;
}
