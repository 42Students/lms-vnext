"use client";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

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
    <form onSubmit={preview} className="space-y-4 rounded-xl border border-border bg-surface p-4 sm:p-6">
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
        <textarea rows={8} maxLength={131072} value={csv}
          onChange={(event) => { setCsv(event.target.value); setResult(null); }}
          className="w-full rounded-md border border-border bg-surface p-3 font-mono text-sm text-foreground" />
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
        className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
        Download safe error CSV
      </a>
      {result.rows.length === 0 ? <p className="text-sm text-body">No learner rows were supplied.</p> : (
        <div className="max-h-[35rem] overflow-auto rounded-xl border border-border">
          <table className="w-full min-w-[30rem] text-left text-sm">
            <thead className="bg-muted"><tr>
              <th scope="col" className="px-3 py-2">Row</th>
              <th scope="col" className="px-3 py-2">Email</th>
              <th scope="col" className="px-3 py-2">Validation</th>
            </tr></thead>
            <tbody>{result.rows.map((row) => <tr key={row.rowNumber} className="border-t border-border">
              <td className="px-3 py-2">{row.rowNumber}</td>
              <td className="px-3 py-2 break-all">{row.email}</td>
              <td className="px-3 py-2">{row.status.replaceAll("_", " ")}</td>
            </tr>)}</tbody>
          </table>
        </div>
      )}
    </section> : null}
    <p className="text-xs leading-5 text-muted-foreground">
      Preview only. No memberships, capacity reservations or activity events are written.
      A future confirmed import must recheck membership and capacity under a transaction.
    </p>
  </div>;
}
