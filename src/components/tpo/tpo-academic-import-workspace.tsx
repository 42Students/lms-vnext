"use client";
import {Checkbox} from "@/components/ui/checkbox";
import {Textarea} from "@/components/ui/textarea";
import {DataTable} from "@/components/ui/data-table";
import {StatusBadge} from "@/components/ui/status-badge";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {Dialog} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {FileUpload} from "@/components/ui/file-upload";
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
    <Button variant="secondary" type="button" className="min-h-11 md:min-h-9 print:hidden" onClick={() => setOpen(value => !value)}
      aria-expanded={open} aria-controls={id}
      >
      Import academic details
    </Button>
    {open && <section id={id} aria-label="Import academic details"
      className="mt-3 w-full min-w-0 max-w-4xl space-y-3 border-y border-border py-4">
      <h2 className="text-lg font-semibold">Import academic details</h2>
      <p className="text-sm text-muted-foreground">
        One row per student, matched by student membership ID. Upload a CSV with
        CGPA (0–10) and active backlogs. The first row must be the column headings.
        Nothing is saved until you review the matches and confirm import.
        A roll number alone cannot identify a membership in this vNext workflow.
      </p>
      <p aria-label="Import with preview steps" className="text-xs text-muted-foreground print:hidden">
        Choose file or paste rows → Preview matched and unmatched records → Confirm selected import.
      </p>
      <a download="academic-import-template.csv"
        href="data:text/csv;charset=utf-8,studentCode%2Ccgpa%2CactiveBacklogs%0A"
        className="lms-inline-link inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-link underline hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 print:hidden">
        Download a template
      </a>
      <FileUpload className="print:hidden [&_input]:min-h-11 md:[&_input]:min-h-9" label="Drop a CSV file here, or click to choose" accept=".csv,text/csv" maxBytes={200_000}
         disabled={busy} onFiles={files => void upload(files?.[0] ?? null)}/>
      <label className="block text-sm font-semibold print:hidden">Or paste CSV rows
        <Textarea value={csv} onChange={event => {
          setCsv(event.target.value); setPreview(null); setError(""); setNotice("");
        }} rows={5} maxLength={200000}
          className="mt-1 min-h-32 w-full min-w-0 font-mono text-sm" />
      </label>
      <Button variant="secondary" className="min-h-11 md:min-h-9 print:hidden" disabled={busy} type="button" onClick={() => void validate()}
        >
        {busy ? "Checking…" : "Preview import"}
      </Button>
      {preview && <div className="space-y-3">
        <p role="status" className="text-sm">
          Will update {preview.filter(row => row.match === "WILL_UPDATE").length}
          {" · "}Can&apos;t match {preview.filter(row => row.match === "CANT_MATCH").length}.
          Unmatched rows are excluded from confirmation.
        </p>
        <DataTable rows={preview} getRowKey={row=>row.studentCode}
          caption="Academic import preview"
          empty={<p>No rows found. The first row must be the column headings.</p>}
          columns={[
            {key:"include",header:"Include",mobilePriority:"action",cell:row=>
              <Checkbox aria-label={"Include "+row.studentCode}
                checked={!excluded.includes(row.studentCode)}
                disabled={row.match!=="WILL_UPDATE"}
                onChange={event=>setExcluded(current=>event.target.checked
                  ?current.filter(id=>id!==row.studentCode):[...current,row.studentCode])}/>},
            {key:"id",header:"Student ID",mobilePriority:"primary",cell:row=><span className="break-all font-mono text-xs">{row.studentCode}</span>},
            {key:"name",header:"Student",mobilePriority:"secondary",cell:row=>row.name??"—"},
            {key:"cgpa",header:"CGPA",mobilePriority:"secondary",cell:row=><span>{row.oldCgpa??"—"} → {row.cgpa}</span>},
            {key:"backlogs",header:"Backlogs",mobilePriority:"secondary",cell:row=><span>{row.oldBacklogs??"—"} → {row.activeBacklogs}</span>},
            {key:"result",header:"Result",mobilePriority:"secondary",cell:row=><StatusBadge tone={row.match==="WILL_UPDATE"?"success":"warning"}>{row.match==="WILL_UPDATE"?"Will update":"Can't match"}</StatusBadge>},
          ]}/>
        <label className="flex min-h-11 items-center gap-2 text-sm print:hidden">
          <Checkbox checked={preview.filter(row => row.match === "WILL_UPDATE")
            .every(row => !excluded.includes(row.studentCode))}
            onChange={event => setExcluded(event.target.checked
              ? preview.filter(row => row.match !== "WILL_UPDATE").map(row => row.studentCode)
              : preview.map(row => row.studentCode))} />
          Select all matched students
        </label>
        <Button variant="secondary" type="button" className="min-h-11 md:min-h-9 print:hidden" disabled={busy || preview.every(row => excluded.includes(row.studentCode))}
          onClick={() => setConfirmOpen(true)}
          >
          Confirm import
        </Button>
      </div>}
      <Dialog open={confirmOpen} onOpenChange={value=>{if(!busy&&!guardedPending)setConfirmOpen(value);}}
        title="Import verified academic details"
        description={"Import "+(preview?.filter(row=>row.match==="WILL_UPDATE"&&!excluded.includes(row.studentCode)).length??0)+" selected academic records? This updates their recorded CGPA and active backlogs."}
        footer={<><Button variant="secondary" className="min-h-11 md:min-h-9" disabled={busy||guardedPending} onClick={()=>setConfirmOpen(false)}>Cancel</Button>
          <Button className="min-h-11 md:min-h-9" disabled={busy||guardedPending} onClick={()=>void runGuarded(async()=>{setConfirmOpen(false);await commit();})}>Confirm import</Button></>}>
        <p className="text-sm">Your academic import choices are kept below if the import cannot be completed.</p>
      </Dialog>
      {error && <p role="alert" className="border-l-2 border-warning bg-warning-subtle px-3 py-3 text-sm text-error">{error}</p>}
      {notice && <p role="status" className="text-sm text-body">{notice}</p>}
    </section>}
  </div>;
}
