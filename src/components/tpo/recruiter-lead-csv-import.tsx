"use client";
import {Dialog} from "@/components/ui/dialog";
import {DataTable} from "@/components/ui/data-table";
import {StatusBadge} from "@/components/ui/status-badge";
import {safeReportCsvCell} from "@/components/placements/report-interactive-table-export-model";
import {ScrollCue} from "@/components/ui/scroll-cue";
import {Button} from "@/components/ui/button";
import {Tabs} from "@/components/ui/tabs";
import {FileUpload} from "@/components/ui/file-upload";
import {Checkbox} from "@/components/ui/checkbox";

import Link from "next/link";
import {recruiterXlsxToCsv} from "@/modules/placements/tpo-lead-xlsx-import-model";
import { useEffect, useRef, useState } from "react";
import {
  previewTpoLeadCsv,
  TPO_LEAD_CSV_MAX_CHARACTERS,
  TPO_LEAD_CSV_MAX_ROWS,
  type TpoLeadImportRowResult,
} from "@/modules/placements/tpo-lead-csv-import-model";

const template = "name,email,phone,companyName,designation,source\r\n" +
  "Example Recruiter,recruiter@example.org,,Example Company,HR,REFERRAL\r\n";

type Preview = ReturnType<typeof previewTpoLeadCsv>;
type ImportResponse = {
  counts: { total: number; created: number; duplicate: number; invalid: number; skipped:number };
  results: TpoLeadImportRowResult[];
};

export function RecruiterLeadCsvImport({ onImported }: { onImported: () => void }) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState("");
  const [rowGroup,setRowGroup]=useState<"ALL"|"NEW"|"EXISTING"|"INVALID"|"SKIPPED">("ALL");
  const [error, setError] = useState("");
  const [copyNotice,setCopyNotice]=useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [skipRows,setSkipRows]=useState<number[]>([]);
  const [reviewReady,setReviewReady]=useState(false);
  const [existing,setExisting]=useState<{row:number;leadId:string;name:string}[]>([]);
  const [previewStatus,setPreviewStatus]=useState<"idle"|"checking"|"ready"|"error">("idle");
  const previewSeq=useRef(0);
  const launchRef=useRef<HTMLButtonElement>(null);
  const fileRef=useRef<HTMLInputElement>(null);
  useEffect(()=>{if(open)fileRef.current?.focus();},[open]);

  async function chooseFile(file: File | undefined) {
    if (busy) return; // FileUpload clears its picker when disabled during commit; keep the confirmed preview.
    const sequence=++previewSeq.current;
    setExisting([]);
    setRowGroup("ALL");
    setPreviewStatus("idle");
    setResult(null);
    setSkipRows([]);
    setPreview(null);
    setReviewReady(false);
    setCsv("");
    setError("");setCopyNotice("");
    setFileName(file?.name ?? "");
    if (!file) return;
    if(!/\.(?:csv|xlsx)$/i.test(file.name)){
      setError("Choose a .csv or .xlsx recruiter import file.");
      return;
    }
    if (file.size > 10_000_000) {
      setError("Import file is too large (maximum 10 MB).");
      return;
    }
    try {
      const content = /\.xlsx$/i.test(file.name)?await recruiterXlsxToCsv(file):await file.text();
      if(content.length>TPO_LEAD_CSV_MAX_CHARACTERS)
        throw new Error("CSV_SIZE_LIMIT_EXCEEDED");
      const parsed = previewTpoLeadCsv(content);
      if(sequence!==previewSeq.current)return;
      setPreview(parsed);
      setCsv(content);
      setPreviewStatus("checking");
      const response=await fetch("/api/placements/tpo/leads/import/preview",{
        method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({csv:content}),
      });
      const data=await response.json() as {collisions?:{row:number;leadId:string;name:string}[];error?:string};
      if(!response.ok||!Array.isArray(data.collisions))throw new Error(data.error??"Could not check existing recruiters");
      if(sequence===previewSeq.current){setExisting(data.collisions);setPreviewStatus("ready");}
    } catch (cause) {
      if(sequence!==previewSeq.current)return;
      setPreviewStatus("error");
      setError(
        cause instanceof Error && cause.message.startsWith("CSV_")
          ? "Invalid import format: " + cause.message.replaceAll("_", " ")
          : "Could not validate this file or check existing recruiters. Choose it again to retry.",
      );
    }
  }

  async function commit() {
    const existingNumbers=new Set(existing.map(item=>item.row));
    const included=preview?.rows.filter(item=>item.lead&&!existingNumbers.has(item.row)&&!skipRows.includes(item.row)).length??0;
    if (!preview || !csv || included<=0 || busy || previewStatus!=="ready") return;
    if (!reviewReady) {
      setReviewReady(true);
      return;
    }
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/placements/tpo/leads/import", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: true, csv, skipRows:[...new Set([...skipRows,...existingNumbers])] }),
      });
      const data = await response.json() as ImportResponse & { error?: string };
      if (!response.ok || !Array.isArray(data.results)) {
        throw new Error(data.error ?? "Import failed");
      }
      setResult(data);
      onImported();
    } catch (cause) {
      setError(
        "Import could not be confirmed. Refresh recruiter leads before retrying. " +
        (cause instanceof Error ? cause.message : ""),
      );
    } finally {
      setBusy(false);
    }
  }

  function close() {
    if (busy) return;
    previewSeq.current++;
    setOpen(false);
    setPreview(null);
    setCsv("");
    setError("");
    setResult(null);
    setFileName("");
    setSkipRows([]);
    setReviewReady(false);
    setExisting([]);
    setPreviewStatus("idle");
    launchRef.current?.focus();
  }

  const existingNumbers=new Set(existing.map(item=>item.row));
  const newRows=preview?.rows.filter(item=>item.lead&&!existingNumbers.has(item.row)&&!skipRows.includes(item.row)).length??0;
  const previewRows=preview?.rows.filter(item=>{
    if(rowGroup==="ALL")return true;
    if(rowGroup==="INVALID")return !item.lead;
    if(rowGroup==="EXISTING")return existingNumbers.has(item.row);
    if(rowGroup==="SKIPPED")return Boolean(item.lead)&&skipRows.includes(item.row);
    return Boolean(item.lead)&&!existingNumbers.has(item.row)&&!skipRows.includes(item.row);
  })??[];
  return (
    <>
      <Button ref={launchRef} type="button" variant="secondary" className="min-h-11 md:min-h-9 print:hidden" aria-label="Import recruiter leads" onClick={() => setOpen(true)}>
        Import
      </Button>
      <Dialog open={open} onOpenChange={next=>{if(!next)close();}}
         title="Import recruiter leads" dismissible={!busy}
         description="Review every imported row before creating any recruiter leads.">
          <section className="min-w-0 space-y-4">
            <div className="min-w-0">
                <p id="recruiter-import-help" className="text-sm text-body leading-[22px]">
                  Upload CSV or Excel (.xlsx), with the required headings:
                  name, email, phone, companyName, designation, source.
                  Maximum {TPO_LEAD_CSV_MAX_ROWS} data rows. Column order may vary; company is also accepted for companyName. Name and one contact method are required.
                </p>
            </div>
            <details className="border-b border-border pb-3 text-sm text-body"><summary className="cursor-pointer py-2 font-semibold max-[767px]:flex max-[767px]:min-h-11 max-[767px]:items-center">Import steps</summary><p aria-label="Recruiter import steps" className="text-xs text-muted-foreground leading-[20px]">Choose a CSV or Excel file → Preview new, duplicate and invalid contacts → Review the import → Confirm and download results.</p></details>
            <a
              download="recruiter-leads-template.csv"
              href={"data:text/csv;charset=utf-8," + encodeURIComponent(template)}
              className="lms-inline-link inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-[650] text-link underline hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 print:hidden"
            >
              Download CSV template
            </a>
            <FileUpload ref={fileRef} className="print:hidden [&_input]:min-h-11 md:[&_input]:min-h-9" label="Choose CSV or Excel file" maxBytes={10_000_000}
              accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              disabled={busy} onFiles={files => void chooseFile(files?.[0])}/>
            {error ? <p role="alert" className="text-sm text-error leading-[22px]">{error}</p> : null}
            {preview ? (
              <div className="space-y-3">
                <p className="text-sm text-body leading-[22px]" role="status">
                  {preview.total} rows: {preview.valid} valid, {preview.invalid} invalid.
                  {previewStatus==="checking"?" Checking for existing recruiters…":previewStatus==="ready"?" Existing contacts checked in this college.":" Existing recruiter check is required before import."}
                  {preview.ignoredHeaders.length? " Ignored columns: "+preview.ignoredHeaders.join(", ")+".":""}
                </p>
                <p className="text-sm text-body leading-[22px]" role="status">New: {newRows} to import · Already recruiters: {existing.length} · To fix: {preview.invalid}. Uncheck any valid row to Skip row.</p>
                <div className="flex flex-col gap-2 md:flex-row md:flex-wrap print:hidden">
                  <Button className="w-full md:w-auto min-h-11 md:min-h-9" type="button" variant="secondary" disabled={busy||Boolean(result)}
                    onClick={()=>{setReviewReady(false);
                      setSkipRows(preview.rows.filter(row=>row.lead&&!existingNumbers.has(row.row)).map(row=>row.row));}}>
                    Skip all new rows
                  </Button>
                  <Button type="button" variant="secondary" className="w-full md:w-auto min-h-11 md:min-h-9" disabled={busy||Boolean(result)}
                    onClick={()=>{setReviewReady(false);setSkipRows([]);}}>
                    Include all new rows
                  </Button>
                </div>
                <div className="print:hidden"><Tabs ariaLabel="Import preview groups" renderPanel={false} controlledOnly value={rowGroup}
                   onValueChange={next=>setRowGroup(next as typeof rowGroup)}
                   items={[{value:"ALL",label:"All",count:preview.rows.length},
                    {value:"NEW",label:"New",count:newRows},
                    {value:"EXISTING",label:"Already recruiters",count:existingNumbers.size},
                    {value:"INVALID",label:"To fix",count:preview.invalid},
                    {value:"SKIPPED",label:"Skipped",count:skipRows.length}]}/></div>
                <ScrollCue axis="y" label="Recruiter import preview rows" viewportClassName="max-h-72 print:max-h-none print:overflow-visible">
                  <DataTable rows={previewRows} getRowKey={item=>String(item.row)} caption="Recruiter import preview"
                    empty={<p>No rows in this group.</p>}
                    columns={[
                      {key:"name",header:"Name",mobilePriority:"primary",cell:item=>item.name||"Unnamed"},
                      {key:"row",header:"File row",mobilePriority:"secondary",cell:item=>item.row},
                      {key:"status",header:"Validation",mobilePriority:"secondary",cell:item=><span>
                        <StatusBadge tone={item.error?"error":existingNumbers.has(item.row)?"info":skipRows.includes(item.row)?"warning":"success"}>{item.error??(existingNumbers.has(item.row)?"Already recruiter":skipRows.includes(item.row)?"Skip row":"New")}</StatusBadge>
                        {existing.find(entry=>entry.row===item.row)?
                          <Link className="lms-inline-link ml-2 inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] focus-visible:underline" href={"/tpo/recruiters/"+encodeURIComponent(existing.find(entry=>entry.row===item.row)!.leadId)}>Open</Link>:null}
                      </span>},
                      {key:"include",header:"Include",mobilePriority:"action",cell:item=><label className="inline-flex min-h-11 items-center gap-2 text-sm"><Checkbox aria-label={"Include row "+item.row}
                        disabled={!item.lead||existingNumbers.has(item.row)||busy||Boolean(result)}
                        checked={Boolean(item.lead)&&!existingNumbers.has(item.row)&&!skipRows.includes(item.row)}
                        onChange={event=>{setReviewReady(false);setSkipRows(previous=>event.target.checked?previous.filter(row=>row!==item.row):[...previous,item.row]);}}/> Include</label>},
                    ]}/>
                </ScrollCue>
                {reviewReady&&!result ? <p role="status" className="border-l-[3px] border-warning-border bg-warning-subtle px-4 py-3 text-sm text-body leading-[22px]">
                  Import {newRows} recruiter lead row(s) from {fileName}. {preview.invalid} invalid row(s) will be skipped. Existing contacts will be reported as duplicates. Each created lead receives an audit entry.
                </p>:null}
                {!result ? (
                  <Button
                    type="button"
                    variant="primary"
                    disabled={busy || previewStatus!=="ready" || newRows <= 0}
                    className="min-h-11 w-full md:min-h-9 md:w-auto print:hidden"
                    loading={busy}
                    onClick={() => void commit()}
                  >
                    {busy ? "Importing…" : reviewReady ? "Confirm import" : "Review and confirm import"}
                  </Button>
                ) : null}
              </div>
            ) : null}
            {result ? (
              <div className="space-y-3" aria-live="polite">
                <div className="flex flex-col gap-2 md:flex-row md:flex-wrap print:hidden">
                <Button type="button" variant="secondary" className="min-h-11 w-full md:min-h-9 md:w-auto" onClick={()=>{
                  const header="Row,Status,Reason";
                  const cell=safeReportCsvCell;
                  const lines=result.results.map(item=>[String(item.row),item.status,item.reason??""].map(cell).join(","));
                  const blob=new Blob(["\uFEFF"+[header,...lines].join("\r\n")+"\r\n"],{type:"text/csv;charset=utf-8"});
                  const url=URL.createObjectURL(blob);const link=document.createElement("a");
                  link.href=url;link.download="recruiter-import-results.csv";
                  document.body.appendChild(link);
                  try { link.click(); }
                  finally { link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000); }
                }}>Download row results CSV</Button>
                <Button type="button" variant="secondary" className="min-h-11 w-full md:min-h-9 md:w-auto" onClick={()=>void navigator.clipboard.writeText(
                  result.results.filter(item=>item.status!=="created").map(item=>
                    "Row "+item.row+": "+item.status+(item.reason?" — "+item.reason:"")).join("\n")
                ).then(()=>setCopyNotice("Non-created rows copied."),()=>setCopyNotice("Could not copy these results."))}>
                  Copy rows not imported
                </Button>
                </div>
                {copyNotice?<p role="status" aria-live="polite" className="text-xs text-body leading-[20px]">{copyNotice}</p>:null}
                <h3 className="font-semibold text-[var(--lms-heading)]">Import results</h3>
                <p className="text-sm text-body leading-[22px]">
                  {result.counts.created} created, {result.counts.duplicate} duplicate,
                  {" "}{result.counts.invalid} invalid, {result.counts.skipped??0} skipped. {result.counts.total} rows processed.
                </p>
                <ScrollCue axis="y" label="Recruiter import result rows" viewportClassName="max-h-72 print:max-h-none print:overflow-visible">
                  <DataTable rows={result.results} getRowKey={item=>String(item.row)} caption="Recruiter import results"
                    empty={<p>No import results to display.</p>}
                    columns={[
                      {key:"row",header:"File row",mobilePriority:"primary",cell:item=>item.row},
                      {key:"status",header:"Status",mobilePriority:"secondary",cell:item=><StatusBadge tone={item.status==="created"?"success":item.status==="duplicate"?"info":item.status==="invalid"?"error":"warning"}>{item.status}</StatusBadge>},
                      {key:"details",header:"Details",mobilePriority:"secondary",cell:item=>item.leadId?
                        <Link href={"/tpo/recruiters/"+encodeURIComponent(item.leadId)}
                          className="lms-inline-link inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] focus-visible:underline">
                          Open created lead
                        </Link>:(item.reason??"—")},
                    ]}/>
                </ScrollCue>
              </div>
            ) : null}
            <details className="border-t border-border pt-3 text-xs text-muted-foreground"><summary className="cursor-pointer min-h-11 py-3 font-semibold md:min-h-9">Import safety and audit details</summary><p>
              Imports cannot change an existing contact. Invalid and duplicate rows are skipped.
              Imported leads receive a staff-attributed audit entry; a failed transaction
              does not leave half-written lead/audit pairs.
            </p></details>
          </section>
      </Dialog>
    </>
  );
}
