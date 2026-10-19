"use client";
import {Textarea} from "@/components/ui/textarea";
import {DataTable} from "@/components/ui/data-table";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {Dialog} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {useGuardedAction} from "@/hooks/use-guarded-action";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { parseTpoAcademicImportCsv } from "@/modules/placements/tpo-academic-preview-import-model";

type AcademicRow = ReturnType<typeof parseTpoAcademicImportCsv>[number];
type PreviewRow = AcademicRow & {
  match: "WILL_UPDATE" | "CANT_MATCH";
  name: string | null;
  oldCgpa: number | null;
  oldBacklogs: number | null;
};

export function TpoAcademicImportWorkspace() {
  const router = useRouter();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [csv, setCsv] = useState("studentCode,cgpa,activeBacklogs\n");
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmOpen,setConfirmOpen] = useState(false);
  const {run:runGuarded,pending:guardedPending}=useGuardedAction();

  async function upload(file: File | null) {
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) {
      setError("Choose a CSV file to import academic details.");
      return;
    }
    if (file.size > 200000) {
      setError("This file is too large. Please split it into smaller CSV files.");
      return;
    }
    const value = await file.text();
    setCsv(value); setPreview(null); setExcluded([]); setError(""); setNotice("");
  }

  async function send(action: "PREVIEW" | "IMPORT", rows: AcademicRow[]) {
    return apiFetch<{preview?:{rows:PreviewRow[]};result?:{updated:number;skipped:number}}>(
      "/api/placements/tpo/students/academic-import", {
        method:"POST",headers:{"content-type":"application/json"},
        body:JSON.stringify({action,rows,skipUnmatched:action==="IMPORT"}),
      });
  }

  async function validate() {
    let parsed: AcademicRow[];
    try { parsed = parseTpoAcademicImportCsv(csv); }
    catch (cause) {
      setError(cause instanceof Error ? cause.message : "Invalid CSV");
      setPreview(null); return;
    }
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await send("PREVIEW", parsed);
      if(!Array.isArray(result.preview?.rows))throw Error("Could not process the academic details. Please try again.");
      const rows = result.preview.rows as PreviewRow[];
      setPreview(rows);
      setExcluded(rows.filter(row => row.match !== "WILL_UPDATE").map(row => row.studentCode));
    } catch (cause) {
      setPreview(null);
      setError(cause instanceof Error ? cause.message : "Preview unavailable");
    } finally { setBusy(false); }
  }

  async function commit() {
    if (!preview) return;
    const selected = preview.filter(row => !excluded.includes(row.studentCode));
    const matched = selected.filter(row => row.match === "WILL_UPDATE");
    if (!matched.length) { setError("Select at least one matched academic record."); return; }
    setBusy(true); setError("");
    try {
      const result = await send("IMPORT", matched.map(row => ({
        studentCode: row.studentCode, cgpa: row.cgpa, activeBacklogs: row.activeBacklogs,
      })));
      if(typeof result.result?.updated!=="number" || typeof result.result?.skipped!=="number")throw Error("Could not confirm the import results. Please check the records before retrying.");
      const receipt = result.result as { updated: number; skipped: number };
      setNotice("Updated " + receipt.updated + " academic record(s). " +
        (receipt.skipped ? receipt.skipped + " unmatched skipped." : "All selected rows saved."));
      setPreview(null); setExcluded([]); router.refresh();
    } catch (cause) {
      setError(cause instanceof FriendlyFetchError && cause.status===409
        ? "This changed while you were working. Your academic import choices are kept below. Preview again before importing."
        : "Could not process the academic details. Review your selections and try again.");
    } finally { setBusy(false); }
  }

  return <div className="min-w-0">
    <Button variant="secondary" type="button" onClick={() => setOpen(value => !value)}
      aria-expanded={open} aria-controls={id}
      >
      Import academic details
    </Button>
    {open && <section id={id} aria-label="Import academic details"
      className="mt-3 max-w-4xl space-y-3">
      <h2 className="text-lg font-semibold">Import academic details</h2>
      <p className="text-sm text-muted-foreground">
        Upload a CSV with student membership IDs, CGPA (0–10), and active backlogs.
        Review all matches before importing. Academic data is verified for your college only.
      </p>
      <a download="academic-import-template.csv"
        href="data:text/csv;charset=utf-8,studentCode%2Ccgpa%2CactiveBacklogs%0A"
        className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-primary-text">
        Download template
      </a>
      <label className="block text-sm font-semibold">Choose CSV file
        <input type="file" accept=".csv,text/csv" onChange={event => void upload(event.target.files?.[0] ?? null)}
          className="mt-1 block w-full rounded-[var(--lms-control-radius)] border border-border bg-surface p-2 text-sm" />
      </label>
      <label className="block text-sm font-semibold">Or paste CSV rows
        <Textarea value={csv} onChange={event => {
          setCsv(event.target.value); setPreview(null); setError(""); setNotice("");
        }} rows={5} maxLength={200000}
          className="mt-1 font-mono text-xs" />
      </label>
      <Button variant="secondary" disabled={busy} type="button" onClick={() => void validate()}
        >
        {busy ? "Checking…" : "Preview matches"}
      </Button>
      {preview && <div className="space-y-3">
        <p role="status" className="text-sm">
          {preview.filter(row => row.match === "WILL_UPDATE").length} will update;
          {" "}{preview.filter(row => row.match === "CANT_MATCH").length} can&apos;t match.
        </p>
        <DataTable rows={preview} getRowKey={row=>row.studentCode}
          caption="Academic import preview"
          empty={<p>No students were found in the import preview.</p>}
          columns={[
            {key:"include",header:"Include",mobilePriority:"action",cell:row=>
              <input type="checkbox" aria-label={"Include "+row.studentCode}
                checked={!excluded.includes(row.studentCode)}
                disabled={row.match!=="WILL_UPDATE"}
                onChange={event=>setExcluded(current=>event.target.checked
                  ?current.filter(id=>id!==row.studentCode):[...current,row.studentCode])}/>},
            {key:"id",header:"Student ID",mobilePriority:"primary",cell:row=><span className="break-all font-mono text-xs">{row.studentCode}</span>},
            {key:"name",header:"Student",mobilePriority:"secondary",cell:row=>row.name??"—"},
            {key:"cgpa",header:"CGPA",mobilePriority:"secondary",cell:row=><span>{row.oldCgpa??"—"} → {row.cgpa}</span>},
            {key:"backlogs",header:"Backlogs",mobilePriority:"secondary",cell:row=><span>{row.oldBacklogs??"—"} → {row.activeBacklogs}</span>},
            {key:"result",header:"Result",mobilePriority:"secondary",cell:row=>row.match==="WILL_UPDATE"?"Will update":"Can't match"},
          ]}/>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={preview.filter(row => row.match === "WILL_UPDATE")
            .every(row => !excluded.includes(row.studentCode))}
            onChange={event => setExcluded(event.target.checked
              ? preview.filter(row => row.match !== "WILL_UPDATE").map(row => row.studentCode)
              : preview.map(row => row.studentCode))} />
          Select all matched students
        </label>
        <Button variant="secondary" type="button" disabled={busy || preview.every(row => excluded.includes(row.studentCode))}
          onClick={() => setConfirmOpen(true)}
          >
          Confirm import
        </Button>
      </div>}
      <Dialog open={confirmOpen} onOpenChange={value=>{if(!busy&&!guardedPending)setConfirmOpen(value);}}
        title="Import verified academic details"
        description={"Import "+(preview?.filter(row=>row.match==="WILL_UPDATE"&&!excluded.includes(row.studentCode)).length??0)+" selected academic records? This updates their recorded CGPA and active backlogs."}
        footer={<><Button variant="secondary" disabled={busy||guardedPending} onClick={()=>setConfirmOpen(false)}>Cancel</Button>
          <Button disabled={busy||guardedPending} onClick={()=>void runGuarded(async()=>{setConfirmOpen(false);await commit();})}>Confirm import</Button></>}>
        <p className="text-sm">Your academic import choices are kept below if the import cannot be completed.</p>
      </Dialog>
      {error && <p role="alert" className="text-sm text-error">{error}</p>}
      {notice && <p role="status" className="text-sm text-body">{notice}</p>}
    </section>}
  </div>;
}
