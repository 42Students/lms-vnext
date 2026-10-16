"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FACULTY_CSV_COLUMNS } from "@/modules/people/college-faculty-csv-columns";
import { neutralStudentCsvCell } from "@/modules/people/college-student-csv-model";

type Row={row:number;status:string;detail:string;membershipId?:string};
type Report={preview:boolean;valid:number;invalid:number;structuralErrors:string[];results:Row[]};
const header=FACULTY_CSV_COLUMNS.join(",");
export function CollegeFacultyCsvImport(){
  const router=useRouter();
  const [csv,setCsv]=useState(header+"\n");
  const [report,setReport]=useState<Report|null>(null);
  const [error,setError]=useState("");
  const [confirmed,setConfirmed]=useState(false);
  const [pending,start]=useTransition();
  async function submit(action:"PREVIEW"|"IMPORT"){
    setError("");
    const response=await fetch("/api/college/faculty/import",{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({action,csv,confirm:action==="IMPORT"?confirmed:false}),
    });
    const payload=await response.json().catch(()=>null);
    if(!response.ok||!payload?.report)throw Error(payload?.error??"CSV import failed");
    setReport(payload.report as Report);
    if(action==="IMPORT"){setConfirmed(false);router.refresh();}
  }
  const run=(action:"PREVIEW"|"IMPORT")=>start(async()=>{
    try{await submit(action);}catch(reason){
      setError(reason instanceof Error?reason.message:"Import unavailable");
    }
  });
  const csvResult=report?.results.map(item=>[item.row,item.status,item.detail,item.membershipId??""]
    .map(neutralStudentCsvCell).join(",")).join("\r\n")??"";
  return <div className="space-y-5">
    <section className="space-y-3 rounded-xl border border-border bg-surface p-5">
      <h2 className="text-lg font-semibold">Bulk register faculty</h2>
      <p className="text-sm text-muted-foreground">
        Choose CSV (up to 500 rows, 1 MB). Validate before creating faculty.
        Each row reports its own result; successful registrations are not rolled back.
      </p>
      <p className="break-words font-mono text-xs">{header}</p>
      <a download="faculty-template.csv" href={"data:text/csv;charset=utf-8,"+encodeURIComponent(header+"\n")}
        className="inline-flex min-h-10 items-center rounded border border-border px-3 text-sm font-semibold text-primary-text">
        Download CSV template
      </a>
      <label className="grid gap-2 text-sm font-semibold">Choose CSV
        <input type="file" accept=".csv,text/csv" onChange={async event=>{
          const file=event.currentTarget.files?.[0];
          if(!file)return;
          if(file.size>1000000){setError("File exceeds 1 MB");return;}
          setCsv(await file.text());setReport(null);setConfirmed(false);setError("");
        }}/>
      </label>
      <label className="grid gap-2 text-sm font-semibold">CSV contents
        <textarea rows={10} value={csv} onChange={event=>{
          setCsv(event.target.value);setReport(null);setConfirmed(false);
        }} className="rounded-md border border-border bg-surface p-3 font-mono text-xs"/>
      </label>
      <button type="button" disabled={pending||!csv.trim()} onClick={()=>run("PREVIEW")}
        className="min-h-11 rounded bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">
        {pending?"Validating…":"Validate CSV"}
      </button>
      {error&&<p role="alert" className="text-sm text-error">{error}</p>}
    </section>
    {report&&<section className="space-y-4 rounded-xl border border-border bg-surface p-5">
      <h2 className="text-lg font-semibold">{report.preview?"Preview":"Faculty registration results"}</h2>
      <p role="status" className="text-sm">{report.valid} valid; {report.invalid} invalid.</p>
      {report.structuralErrors.length>0&&<p role="alert">{report.structuralErrors.join(", ")}</p>}
      <a download="faculty-import-report.csv"
        href={"data:text/csv;charset=utf-8,"+encodeURIComponent("row,status,detail,membershipId\r\n"+csvResult)}
        className="inline-flex min-h-10 items-center rounded border border-border px-3 text-sm font-semibold text-primary-text">
        Download row report
      </a>
      <div className="max-h-[32rem] overflow-auto">
        <table className="w-full text-left text-sm"><thead><tr>
          {["Row","Status","Reason"].map(label=><th key={label} className="p-2">{label}</th>)}
        </tr></thead><tbody>{report.results.map(item=><tr key={item.row} className="border-t border-border">
          <td className="p-2">{item.row}</td><td className="p-2">{item.status}</td><td className="p-2">{item.detail}</td>
        </tr>)}</tbody></table>
      </div>
      {report.preview&&report.valid>0&&report.structuralErrors.length===0&&
      <div className="space-y-3">
        <label className="flex gap-2 text-sm">
          <input type="checkbox" checked={confirmed} onChange={event=>setConfirmed(event.target.checked)}/>
          I understand valid rows create real faculty memberships; partial failures require manual review.
        </label>
        <button type="button" disabled={pending||!confirmed} onClick={()=>run("IMPORT")}
          className="min-h-11 rounded bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">
          {pending?"Registering…":"Confirm faculty registration"}
        </button>
      </div>}
    </section>}
  </div>;
}
