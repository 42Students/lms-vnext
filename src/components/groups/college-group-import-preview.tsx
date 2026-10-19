"use client";
import { Textarea } from "@/components/ui/textarea";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";

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
      <label className="grid gap-2 text-sm font-semibold text-body">Select CSV file
        <input type="file" accept=".csv,text/csv" onChange={(event) =>
          void load(event.target.files?.[0] ?? null)}
          className="block min-h-11 max-w-full text-sm text-body" />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-body">CSV contents
        <Textarea rows={8} maxLength={131072} value={csv}
          onChange={(event) => { setCsv(event.target.value); setResult(null); }}
          className="w-full rounded-[var(--lms-control-radius)] border border-border bg-surface p-3 font-mono text-sm text-foreground" />
      </label>
      <Button type="submit" disabled={reading || pending || !csv.trim()}>
        {pending ? "Validating…" : "Preview only (no import)"}
      </Button>
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
    </form>
    {result ? <section aria-label="Student group CSV validation report" className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">
        Dry run: {result.ready} ready, {result.blocked} blocked, {result.total} examined
      </h2>
      <p className="text-sm text-body">{result.warning}</p>
      <a href={"data:text/csv;charset=utf-8," + encodeURIComponent(result.errorCsv)}
        download="group-import-validation-errors.csv"
        className="inline-flex min-h-10 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link">
        Download safe error CSV
      </a>
      {result.rows.length === 0 ? <p className="text-sm text-body">No learner rows were supplied.</p> : (
        <div className="max-h-[35rem] overflow-auto rounded-[var(--lms-control-radius)] border border-border">
          <DataTable<Result["rows"][number]>
            caption="Group import preview validation"
            rows={result.rows} getRowKey={row=>String(row.rowNumber)}
            empty={<p>No learner rows were supplied.</p>}
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
