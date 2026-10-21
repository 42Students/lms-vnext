"use client";
import {Checkbox} from "@/components/ui/checkbox";
import {Textarea} from "@/components/ui/textarea";
import {DataTable} from "@/components/ui/data-table";
import {StatusBadge} from "@/components/ui/status-badge";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {Dialog} from "@/components/ui/dialog";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
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
type AcademicWriteRow={
  studentCode:string;cgpa?:number;activeBacklogs?:number;pastBacklogs?:number;
  tenthPercentage?:number;twelfthPercentage?:number;diplomaPercentage?:number;
  undergraduatePercentage?:number;postgraduatePercentage?:number;
  gapYears?:number;isLateralEntry?:boolean;passingYear?:number;
  legacyOrigin?:{rowNumber:number;rollNumber:string;batch:string|null;gender:string|null};
};
type PreviewRow = Partial<Omit<AcademicRow,"studentCode">> & {
  studentCode:string;
  match: "WILL_UPDATE" | "CANT_MATCH";
  name: string | null;
  oldCgpa: number | null;
  oldBacklogs: number | null;
  importRow?:AcademicWriteRow|null;
  issue?:string|null;
};

export function TpoAcademicImportWorkspace() {
  const router = useRouter();
  const {showToast}=useToast();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [discardOpen,setDiscardOpen]=useState(false);
  const [previewTab,setPreviewTab]=useState<"WILL_UPDATE"|"CANT_MATCH">("WILL_UPDATE");
  const [skipAcknowledged,setSkipAcknowledged]=useState(false);
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
      setCsv(value);setPreview(null);setLegacyRows(null);setSkipAcknowledged(false);
      setExcluded([]);setError("");setNotice("");
    }catch(error){setError(error instanceof Error?error.message:"Invalid Excel or CSV file.");}
  }

  async function send(action: "PREVIEW" | "IMPORT", rows: AcademicWriteRow[]) {
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
        :await (async()=>{
          const rows:PreviewRow[]=[];
          for(let index=0;index<parsed.length;index+=200){
            const chunk=await send("PREVIEW",parsed.slice(index,index+200));
            if(!Array.isArray(chunk.preview?.rows))throw new Error("Academic preview interrupted. No records were imported.");
            rows.push(...chunk.preview.rows);
          }
          return {preview:{rows}};
         })();
      if(!Array.isArray(result.preview?.rows))throw Error("Could not process the academic details. Please try again.");
      const rows = result.preview.rows as PreviewRow[];
      setPreview(rows);setPreviewTab("WILL_UPDATE");setSkipAcknowledged(false);
      setExcluded(rows.filter(row => row.match !== "WILL_UPDATE").map(row => row.studentCode));
    } catch (cause) {
      setPreview(null);
      setError(cause instanceof Error ? cause.message : "Preview unavailable");
    } finally { setBusy(false); }
  }

  async function commit() {
    if (!preview) return;
    const unmatched=preview.filter(row=>row.match!=="WILL_UPDATE");
    if(unmatched.length&&!skipAcknowledged){setError("Review and explicitly skip unmatched rows before importing.");return;}
    const selected = preview.filter(row => !excluded.includes(row.studentCode));
    const matched = selected.filter(row => row.match === "WILL_UPDATE");
    if (!matched.length) { setError("Select at least one matched academic record."); return; }
    setBusy(true); setError("");
    let completed=0;
    const importedIds:string[]=[];
    try {
      for(let index=0;index<matched.length;index+=200){
        const batch=matched.slice(index,index+200);
        const result=await send("IMPORT",batch.map(row=>row.importRow??({
          studentCode:row.studentCode,
          ...(row.cgpa!==undefined&&row.cgpa!==null?{cgpa:row.cgpa}:{}),
          ...(row.activeBacklogs!==undefined&&row.activeBacklogs!==null?{activeBacklogs:row.activeBacklogs}:{}),
        })));
        if(typeof result.result?.updated!=="number"||typeof result.result?.skipped!=="number")
          throw new Error("Academic import acknowledgement missing.");
        completed+=result.result.updated;
        if(result.result.skipped>0)throw new Error("A batch skipped records. Recheck and re-preview the remaining rows.");
        importedIds.push(...batch.map(row=>row.studentCode));
        setExcluded(current=>[...new Set([...current,...importedIds])]);
      }
      showToast({tone:"success",title:"Import saved"});
      setNotice("Updated "+completed+" academic record(s) in "+
        Math.ceil(matched.length/200)+" verified batch(es).");
      setPreview(null);setExcluded([]);router.refresh();
    }catch(cause){
      setError((cause instanceof FriendlyFetchError&&cause.status===409
        ?"These records changed while you were working. "
        :"Import interrupted. ")+completed+
        " academic record(s) were confirmed saved. Those rows are now unselected. Re-preview before retrying the remaining rows.");
      router.refresh();
    }finally{setBusy(false);}
  }

  const unresolved=Boolean(preview?.some(row=>row.match==="CANT_MATCH"));
  const dirty=Boolean(preview||legacyRows||csv.trim()!=="studentCode,cgpa,activeBacklogs");
  function requestClose(){
    if(busy||guardedPending)return;
    if(dirty&&!notice){setDiscardOpen(true);return;}
    setOpen(false);
  }
  return <div className="min-w-0">
    <Button variant="secondary" type="button" className="min-h-11 md:min-h-9 print:hidden" onClick={() => open ? requestClose() : setOpen(true)}
      aria-expanded={open}
      >
      Import academic details
    </Button>
    <Dialog open={open} onOpenChange={value=>{if(!value)requestClose();else setOpen(true);}}
      dismissible={!busy&&!guardedPending} title="Import academic details"
      description="Preview matched academic details before saving any changes."
      className="!max-w-[820px]" bodyClassName="max-h-[75dvh] space-y-3 overflow-y-auto">
      <p className="text-sm text-body">Match learners using their college roll numbers before importing CGPA, marks, backlogs, gaps or passing-year values. Verified corrections may include CGPA, marks, backlogs, gap years and passing year. Only selected matched learners are updated.</p>
      <details className="border-b border-border pb-3 text-sm text-muted-foreground">
        <summary className="cursor-pointer py-2 text-[13px] font-semibold max-[767px]:flex max-[767px]:min-h-11 max-[767px]:items-center">Academic CSV requirements</summary><p>
        Upload up to 5,000 rows of .xlsx or CSV for a scoped preview.
        Roll numbers are matched to active learners in this college, and
        ambiguous or duplicate rolls stay in Can't match. Verified imports
        are committed sequentially in batches of at most 200 rows. All supported numeric academic columns are preserved through
        preview and confirmation, with legacy batch and roll provenance.
        Nothing is silently discarded.
      </p></details>
      <p aria-label="Import with preview steps" className="text-xs text-muted-foreground print:hidden leading-[20px]">
        Choose file or paste rows → Preview matched and unmatched records → Confirm selected import.
      </p>
      <a download="academic-import-template.csv"
        href="data:text/csv;charset=utf-8,roll%2Ccgpa%2CtenthPct%2CtwelfthPct%2CugPct%2CgapYears%2CpassingYear%2Cbatch%2CactiveBacklogs%0A24A001%2C8.5%2C91%2C90%2C85%2C0%2C2026%2CBatch%202026%2C0%0A"
        className="lms-inline-link inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-[650] text-link underline hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 print:hidden">
        Download a template
      </a>
      <FileUpload className="print:hidden [&_input]:min-h-11 md:[&_input]:min-h-9" label="Drop a CSV or XLSX file here, or click to choose" accept=".csv,.xlsx,text/csv" maxBytes={10_000_000}
         disabled={busy} onFiles={files => void upload(files?.[0] ?? null)}/>
      <details className="border-t border-border pt-3 print:hidden"><summary className="min-h-11 cursor-pointer py-3 text-[13px] font-semibold md:min-h-9">Or paste CSV rows</summary><label className="block min-w-0 text-[13px] font-semibold leading-4">Or paste CSV rows
        <Textarea value={csv} onChange={event => {
          setCsv(event.target.value); setPreview(null); setError(""); setNotice("");
        }} rows={5} maxLength={5_000_000}
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
          Unmatched rows must be explicitly acknowledged as skipped before import.
        </p>
        <div role="tablist" aria-label="Import preview categories" className="flex flex-wrap gap-2">
          <Button type="button" role="tab" variant={previewTab==="WILL_UPDATE"?"primary":"secondary"} aria-selected={previewTab==="WILL_UPDATE"} onClick={()=>setPreviewTab("WILL_UPDATE")}>Will update ({preview.filter(row=>row.match==="WILL_UPDATE").length})</Button>
          <Button type="button" role="tab" variant={previewTab==="CANT_MATCH"?"primary":"secondary"} aria-selected={previewTab==="CANT_MATCH"} onClick={()=>setPreviewTab("CANT_MATCH")}>Can\u0027t match ({preview.filter(row=>row.match==="CANT_MATCH").length})</Button>
        </div>
        <DataTable rows={preview.filter(row=>row.match===previewTab)} getRowKey={row=>row.studentCode+":"+row.match}
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
            {key:"cgpa",header:"CGPA",mobilePriority:"secondary",cell:row=><span>{row.oldCgpa??"—"} → {row.cgpa??"unchanged"}</span>},
            {key:"backlogs",header:"Backlogs",mobilePriority:"secondary",cell:row=><span>{row.oldBacklogs??"—"} → {row.activeBacklogs??"unchanged"}</span>},
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
        {unresolved?<label className="flex min-h-11 items-center gap-2 text-sm">
          <Checkbox checked={skipAcknowledged} disabled={busy} onChange={event=>setSkipAcknowledged(event.target.checked)}/>
          I reviewed the unmatched students and agree to skip those rows ({preview.filter(row=>row.match==="CANT_MATCH").length}).
        </label>:null}
        <Button variant="primary" type="button" className="min-h-11 w-full md:min-h-9 md:w-auto print:hidden" disabled={busy || (unresolved&&!skipAcknowledged) || preview.every(row => excluded.includes(row.studentCode))}
          onClick={() => setConfirmOpen(true)}
          >
          Confirm import
        </Button>
      </div>}
      <Dialog open={confirmOpen} onOpenChange={value=>{if(!busy&&!guardedPending)setConfirmOpen(value);}}
        title="Import verified academic details"
        description={"Import "+(preview?.filter(row=>row.match==="WILL_UPDATE"&&!excluded.includes(row.studentCode)).length??0)+" selected academic records? Only supplied academic fields change; missing values are preserved."}
        footer={<div className="flex w-full flex-col-reverse gap-2 md:flex-row md:justify-end"><Button variant="secondary" className="min-h-11 w-full md:min-h-9 md:w-auto" disabled={busy||guardedPending} onClick={()=>setConfirmOpen(false)}>Cancel</Button>
          <Button className="min-h-11 w-full md:min-h-9 md:w-auto" loading={busy||guardedPending} disabled={busy||guardedPending} onClick={()=>void runGuarded(async()=>{setConfirmOpen(false);await commit();})}>Confirm import</Button></div>}>
        <p className="text-sm leading-[22px]">Your verified academic values and import choices are kept below if the import cannot be completed.</p>
      </Dialog>
      {error && <p role="alert" className="border-l-2 border-warning bg-warning-subtle px-3 py-3 text-sm text-error leading-[22px]">{error}</p>}
      {notice && <p role="status" className="text-sm text-body leading-[22px]">{notice}</p>}
    </Dialog>
    <ConfirmDialog open={discardOpen} onOpenChange={setDiscardOpen}
      title="Discard academic import?" description="Your unsaved file and academic import selections will be lost."
      confirmVariant="danger" confirmLabel="Discard changes" onConfirm={()=>{
        setDiscardOpen(false);setOpen(false);setPreview(null);setLegacyRows(null);
        setCsv("studentCode,cgpa,activeBacklogs\n");setExcluded([]);setSkipAcknowledged(false);
      }}/>
  </div>;
}
