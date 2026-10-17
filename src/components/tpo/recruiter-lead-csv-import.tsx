"use client";

import Link from "next/link";
import {recruiterXlsxToCsv} from "@/modules/placements/tpo-lead-xlsx-import-model";
import { useEffect, useRef, useState } from "react";
import {
  previewTpoLeadCsv,
  TPO_LEAD_CSV_MAX_CHARACTERS,
  TPO_LEAD_CSV_MAX_ROWS,
  type TpoLeadImportRowResult,
} from "@/modules/placements/tpo-lead-csv-import-model";

const inputClass = "min-h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground";
const buttonClass = "inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground disabled:opacity-50";
const primaryClass = "inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-50";

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
  const modalRef=useRef<HTMLElement>(null);
  const fileRef=useRef<HTMLInputElement>(null);
  useEffect(()=>{
    if(!open)return;
    fileRef.current?.focus();
    const onKey=(event:KeyboardEvent)=>{
      if(event.key==="Escape"){event.preventDefault();if(!busy)close();return;}
      if(event.key!=="Tab"||!modalRef.current)return;
      const items=Array.from(modalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]),input:not([disabled]),a[href],textarea:not([disabled])'));
      const first=items[0],last=items[items.length-1];
      if(!first||!last)return;
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    };
    window.addEventListener("keydown",onKey);
    return ()=>window.removeEventListener("keydown",onKey);
  },[open,busy]);

  async function chooseFile(file: File | undefined) {
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
      <button ref={launchRef} type="button" className={buttonClass} onClick={() => setOpen(true)}>
        Import leads CSV
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation">
          <section ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label="Import recruiter leads"
            className="max-h-[90vh] w-full max-w-3xl space-y-4 overflow-y-auto rounded-xl border border-border bg-surface p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Import recruiter leads</h2>
                <p className="mt-2 text-sm text-body">
                  Upload CSV or Excel (.xlsx), with the required headings:
                  name, email, phone, companyName, designation, source.
                  Maximum {TPO_LEAD_CSV_MAX_ROWS} data rows. Column order may vary; company is also accepted for companyName. Name and one contact method are required.
                </p>
              </div>
              <button className={buttonClass} type="button" onClick={close} disabled={busy}>
                Close
              </button>
            </div>
            <a
              download="recruiter-leads-template.csv"
              href={"data:text/csv;charset=utf-8," + encodeURIComponent(template)}
              className="text-sm font-semibold text-primary-text hover:underline"
            >
              Download CSV template
            </a>
            <label className="block text-sm font-semibold text-foreground">
              Choose CSV or Excel file
              <input ref={fileRef}
                className={inputClass + " mt-2"}
                type="file"
                accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                disabled={busy}
                onChange={event => void chooseFile(event.target.files?.[0])}
              />
            </label>
            {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
            {preview ? (
              <div className="space-y-3">
                <p className="text-sm text-body" role="status">
                  {preview.total} rows: {preview.valid} valid, {preview.invalid} invalid.
                  {previewStatus==="checking"?" Checking for existing recruiters…":previewStatus==="ready"?" Existing contacts checked in this college.":" Existing recruiter check is required before import."}
                  {preview.ignoredHeaders.length? " Ignored columns: "+preview.ignoredHeaders.join(", ")+".":""}
                </p>
                <p className="text-sm text-body">New: {newRows} to import · Already recruiters: {existing.length} · To fix: {preview.invalid}. Uncheck any valid row to Skip row.</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={buttonClass} disabled={busy||Boolean(result)}
                    onClick={()=>{setReviewReady(false);
                      setSkipRows(preview.rows.filter(row=>row.lead&&!existingNumbers.has(row.row)).map(row=>row.row));}}>
                    Skip all new rows
                  </button>
                  <button type="button" className={buttonClass} disabled={busy||Boolean(result)}
                    onClick={()=>{setReviewReady(false);setSkipRows([]);}}>
                    Include all new rows
                  </button>
                </div>
                <nav aria-label="Import preview groups" className="flex flex-wrap gap-2">
                  {([["ALL","All"],["NEW","New"],["EXISTING","Already recruiters"],
                    ["INVALID","To fix"],["SKIPPED","Skipped"]] as const).map(([value,label])=>
                    <button key={value} type="button" aria-pressed={rowGroup===value}
                      className={rowGroup===value?primaryClass:buttonClass}
                      onClick={()=>setRowGroup(value)}>{label}</button>)}
                </nav>
                <div className="max-h-56 overflow-auto rounded-lg border border-border">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-surface-secondary text-muted-foreground">
                      <tr>
                        <th scope="col" className="px-3 py-2">CSV row</th>
                        <th scope="col" className="px-3 py-2">Name</th>
                        <th scope="col" className="px-3 py-2">Validation</th>
                        <th scope="col" className="px-3 py-2">Include</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.length===0?<tr><td colSpan={4} className="px-3 py-5 text-center text-sm text-muted-foreground">
                        No rows in this group.
                      </td></tr>:null}
                      {previewRows.map(item => (
                        <tr key={item.row} className="border-t border-border">
                          <td className="px-3 py-2">{item.row}</td>
                          <td className="px-3 py-2">{item.name || "Unnamed"}</td>
                          <td className="px-3 py-2">{item.error ?? (existingNumbers.has(item.row)?"Already recruiter":skipRows.includes(item.row)?"Skip row":"New")}{existing.find(entry=>entry.row===item.row)? <Link className="ml-2 text-primary-text underline" href={"/tpo/recruiters/"+existing.find(entry=>entry.row===item.row)!.leadId}>Open</Link>:null}</td>
                          <td className="px-3 py-2"><input type="checkbox" aria-label={"Include row "+item.row}
                            disabled={!item.lead || existingNumbers.has(item.row) || busy || Boolean(result)} checked={Boolean(item.lead)&&!existingNumbers.has(item.row)&&!skipRows.includes(item.row)}
                            onChange={e=>{setReviewReady(false);setSkipRows(previous=>e.target.checked?previous.filter(row=>row!==item.row):[...previous,item.row]);}}/></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {reviewReady&&!result ? <p role="status" className="rounded-md border border-border bg-surface-secondary p-3 text-sm text-foreground">
                  Import {newRows} recruiter lead row(s) from {fileName}. {preview.invalid} invalid row(s) will be skipped. Existing contacts will be reported as duplicates. Each created lead receives an audit entry.
                </p>:null}
                {!result ? (
                  <button
                    type="button"
                    className={primaryClass}
                    disabled={busy || previewStatus!=="ready" || newRows <= 0}
                    onClick={() => void commit()}
                  >
                    {busy ? "Importing…" : reviewReady ? "Confirm import" : "Review and confirm import"}
                  </button>
                ) : null}
              </div>
            ) : null}
            {result ? (
              <div className="space-y-3" aria-live="polite">
                <button type="button" className={buttonClass} onClick={()=>void navigator.clipboard.writeText(
                  result.results.filter(item=>item.status!=="created").map(item=>
                    "Row "+item.row+": "+item.status+(item.reason?" — "+item.reason:"")).join("\n")
                ).then(()=>setCopyNotice("Non-created rows copied."),()=>setCopyNotice("Could not copy these results."))}>
                  Copy rows not imported
                </button>
                {copyNotice?<p role="status" className="text-xs text-body">{copyNotice}</p>:null}
                <h3 className="font-semibold text-foreground">Import results</h3>
                <p className="text-sm text-body">
                  {result.counts.created} created, {result.counts.duplicate} duplicate,
                  {" "}{result.counts.invalid} invalid, {result.counts.skipped??0} skipped. {result.counts.total} rows processed.
                </p>
                <div className="max-h-56 overflow-auto rounded-lg border border-border">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-surface-secondary">
                      <tr>
                        <th scope="col" className="px-3 py-2">CSV row</th>
                        <th scope="col" className="px-3 py-2">Status</th>
                        <th scope="col" className="px-3 py-2">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.results.map(item => (
                        <tr key={item.row} className="border-t border-border">
                          <td className="px-3 py-2">{item.row}</td>
                          <td className="px-3 py-2">{item.status}</td>
                          <td className="px-3 py-2">
                            {item.leadId ? (
                              <Link href={"/tpo/recruiters/" + encodeURIComponent(item.leadId)}
                                className="font-semibold text-primary-text hover:underline">
                                Open created lead
                              </Link>
                            ) : (item.reason ?? "—")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Imports cannot change an existing contact. Invalid and duplicate rows are skipped.
              Imported leads receive a staff-attributed audit entry; a failed transaction
              does not leave half-written lead/audit pairs.
            </p>
          </section>
        </div>
      ) : null}
    </>
  );
}
