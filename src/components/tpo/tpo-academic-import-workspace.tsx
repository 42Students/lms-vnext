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
import {useToast} from "@/components/ui/toast";
import {recruiterXlsxToCsv} from "@/modules/placements/tpo-lead-xlsx-import-model";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { parseTpoAcademicImportCsv,parseTpoLegacyAcademicImportCsv,
  type TpoLegacyAcademicStagingRow } from "@/modules/placements/tpo-academic-preview-import-model";

type AcademicRow = ReturnType<typeof parseTpoAcademicImportCsv>[number];
type PreviewRow = AcademicRow & {
  match: "WILL_UPDATE" | "CANT_MATCH";
  name: string | null;
  oldCgpa: number | null;
  oldBacklogs: number | null;
};

export function TpoAcademicImportWorkspace() {
  const router = useRouter();
  const {showToast}=useToast();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [csv, setCsv] = useState("studentCode,cgpa,activeBacklogs\n");
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [legacyRows,setLegacyRows]=useState<TpoLegacyAcademicStagingRow[]|null>(null);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmOpen,setConfirmOpen] = useState(false);
  const {run:runGuarded,pending:guardedPending}=useGuardedAction();

  async function upload(file: File | null) {
    if (!file) return;
    if (!/\.(csv|xlsx)$/i.test(file.name)) {
      setError("Choose an Excel (.xlsx) or CSV file.");
      return;
    }
    if (file.size > 10_000_000) {
      setError("Academic import files must be smaller than 10 MB.");
      return;
    }
    try{
      const value=/\.xlsx$/i.test(file.name)
        ?await recruiterXlsxToCsv(file):await file.text();
      setCsv(value);setPreview(null);setLegacyRows(null);
      setExcluded([]);setError("");setNotice("");
    }catch(error){setError(error instanceof Error?error.message:"Invalid Excel or CSV file.");}
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
    let legacy:TpoLegacyAcademicStagingRow[]|null=null;
    try{parsed=parseTpoAcademicImportCsv(csv);setLegacyRows(null);}
    catch{
      try{legacy=parseTpoLegacyAcademicImportCsv(csv);parsed=[];setLegacyRows(legacy);}
      catch(cause){
       setError(cause instanceof Error?cause.message:"Invalid CSV");
       setPreview(null);setLegacyRows(null);return;
      }
    }
    setBusy(true); setError(""); setNotice("");
    try {
      const result=legacy
        ?await apiFetch<{preview:{rows:PreviewRow[]}}>(
           "/api/placements/tpo/students/academic-import",{
            method:"POST",headers:{"content-type":"application/json"},
            body:JSON.stringify({action:"LEGACY_PREVIEW",rows:legacy}),
           })
        :await send("PREVIEW",parsed);
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
    if(matched.length>200){
      setError("Select at most 200 verified rows in one import.");
      return;
    }
    if (!matched.length) { setError("Select at least one matched academic record."); return; }
    setBusy(true); setError("");
    try {
      const result = await send("IMPORT", matched.map(row => ({
        studentCode: row.studentCode, cgpa: row.cgpa, activeBacklogs: row.activeBacklogs,
      })));
      if(typeof result.result?.updated!=="number" || typeof result.result?.skipped!=="number")throw Error("Could not confirm the import results. Please check the records before retrying.");
      const receipt = result.result as { updated: number; skipped: number };
      showToast({tone:"success",title:"Import saved"});
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
      <h2 className="font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">Import academic details</h2>
      <details className="border-b border-border pb-3 text-sm text-muted-foreground">
        <summary className="cursor-pointer py-2 text-[13px] font-semibold max-[767px]:flex max-[767px]:min-h-11 max-[767px]:items-center">Academic CSV requirements</summary><p>
        Upload up to 5,000 rows of .xlsx or CSV for a scoped preview.
        Roll numbers are matched to active learners in this college, and
        ambiguous or duplicate rolls stay in Can't match. Verified imports
        are committed in batches of at most 200 rows. Fields beyond CGPA
        and active backlogs are preserved in preview, but cannot yet be
        saved by this limited writer. Nothing is silently discarded.
      </p></details>
      <p aria-label="Import with preview steps" className="text-xs text-muted-foreground print:hidden leading-[20px]">
        Choose file or paste rows → Preview matched and unmatched records → Confirm selected import.
      </p>
      <a download="academic-import-template.csv"
        href="data:text/csv;charset=utf-8,studentCode%2Ccgpa%2CactiveBacklogs%0A"
        className="lms-inline-link inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-[650] text-link underline hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 print:hidden">
        Download a template
      </a>
      <FileUpload className="print:hidden [&_input]:min-h-11 md:[&_input]:min-h-9" label="Drop a CSV or XLSX file here, or click to choose" accept=".csv,.xlsx,text/csv" maxBytes={10_000_000}
         disabled={busy} onFiles={files => void upload(files?.[0] ?? null)}/>
      <details className="border-t border-border pt-3 print:hidden"><summary className="min-h-11 cursor-pointer py-3 text-[13px] font-semibold md:min-h-9">Or paste CSV rows</summary><label className="block min-w-0 text-[13px] font-semibold leading-4">Or paste CSV rows
        <Textarea value={csv} onChange={event => {
          setCsv(event.target.value); setPreview(null); setError(""); setNotice("");
        }} rows={5} maxLength={200000}
          className="mt-1.5 min-h-32 w-full min-w-0 font-mono text-sm" />
      </label></details>
      <Button variant="secondary" loading={busy} className="min-h-11 w-full md:min-h-9 md:w-auto print:hidden" disabled={busy} type="button" onClick={() => void validate()}
        >
        {busy ? "Checking…" : "Preview import"}
      </Button>
      {preview && <div className="space-y-3">
        <p role="status" className="text-sm leading-[22px]">
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
                disabled={busy || row.match!=="WILL_UPDATE"}
                onChange={event=>setExcluded(current=>event.target.checked
                  ?current.filter(id=>id!==row.studentCode):[...current,row.studentCode])}/>},
            {key:"id",header:"Student ID",mobilePriority:"primary",cell:row=><span className="break-all font-mono text-xs">{row.studentCode}</span>},
            {key:"name",header:"Student",mobilePriority:"secondary",cell:row=>row.name??"—"},
            {key:"cgpa",header:"CGPA",mobilePriority:"secondary",cell:row=><span>{row.oldCgpa??"—"} → {row.cgpa}</span>},
            {key:"backlogs",header:"Backlogs",mobilePriority:"secondary",cell:row=><span>{row.oldBacklogs??"—"} → {row.activeBacklogs}</span>},
            {key:"result",header:"Result",mobilePriority:"secondary",cell:row=><span>
              <StatusBadge tone={row.match==="WILL_UPDATE"?"success":"warning"}>{row.match==="WILL_UPDATE"?"Will update":"Can't match"}</StatusBadge>
              {"issue" in row && typeof row.issue==="string"?<span className="block text-xs text-error">{row.issue}</span>:null}
            </span>},
          ]}/>
        <label className="flex min-h-11 items-center gap-2 text-sm print:hidden">
          <Checkbox disabled={busy} checked={preview.filter(row => row.match === "WILL_UPDATE")
            .every(row => !excluded.includes(row.studentCode))}
            onChange={event => setExcluded(event.target.checked
              ? preview.filter(row => row.match !== "WILL_UPDATE").map(row => row.studentCode)
              : preview.map(row => row.studentCode))} />
          Select all matched students
        </label>
        <Button variant="primary" type="button" className="min-h-11 w-full md:min-h-9 md:w-auto print:hidden" disabled={busy || preview.every(row => excluded.includes(row.studentCode))}
          onClick={() => setConfirmOpen(true)}
          >
          Confirm import
        </Button>
      </div>}
      <Dialog open={confirmOpen} onOpenChange={value=>{if(!busy&&!guardedPending)setConfirmOpen(value);}}
        title="Import verified academic details"
        description={"Import "+(preview?.filter(row=>row.match==="WILL_UPDATE"&&!excluded.includes(row.studentCode)).length??0)+" selected academic records? This updates their recorded CGPA and active backlogs."}
        footer={<div className="flex w-full flex-col-reverse gap-2 md:flex-row md:justify-end"><Button variant="secondary" className="min-h-11 w-full md:min-h-9 md:w-auto" disabled={busy||guardedPending} onClick={()=>setConfirmOpen(false)}>Cancel</Button>
          <Button className="min-h-11 w-full md:min-h-9 md:w-auto" loading={busy||guardedPending} disabled={busy||guardedPending} onClick={()=>void runGuarded(async()=>{setConfirmOpen(false);await commit();})}>Confirm import</Button></div>}>
        <p className="text-sm leading-[22px]">Your academic import choices are kept below if the import cannot be completed.</p>
      </Dialog>
      {error && <p role="alert" className="border-l-2 border-warning bg-warning-subtle px-3 py-3 text-sm text-error leading-[22px]">{error}</p>}
      {notice && <p role="status" className="text-sm text-body leading-[22px]">{notice}</p>}
    </section>}
  </div>;
}
