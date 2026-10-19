"use client";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {DataTable} from "@/components/ui/data-table";
import { useRef, useState } from "react";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import { useRouter } from "next/navigation";
import { FACULTY_CSV_COLUMNS } from "@/modules/people/college-faculty-csv-columns";
import { neutralStudentCsvCell } from "@/modules/people/college-student-csv-model";
import {facultyCsvResponseBelongsToDraft} from "@/modules/people/college-faculty-csv-draft-model";

type Row={row:number;status:string;detail:string;membershipId?:string};
type Report={preview:boolean;valid:number;invalid:number;structuralErrors:string[];results:Row[]};
const header=FACULTY_CSV_COLUMNS.join(",");
export function CollegeFacultyCsvImport(){
  const router=useRouter();
  const csvRevision=useRef(0);
  const [csv,setCsv]=useState(header+"\n");
  const [report,setReport]=useState<Report|null>(null);
  const [error,setError]=useState("");
  const [confirmed,setConfirmed]=useState(false);
  const {pending,run:guardRun}=useGuardedAction({busyLabel:"Importing..."});
  async function submit(action:"PREVIEW"|"IMPORT"){
    const revision=csvRevision.current;
    const submittedCsv=csv;
    setError("");
    const payload=await apiFetch<{report:Report}>("/api/college/faculty/import",{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({action,csv:submittedCsv,confirm:action==="IMPORT"?confirmed:false}),
    });
    if(!payload?.report)throw Error("CSV import could not be completed. Please try again.");
    // A validation response for a replaced draft must never re-enable import.
    if(action==="PREVIEW" && !facultyCsvResponseBelongsToDraft(revision,csvRevision.current))return;
    setReport(payload.report as Report);
    if(action==="IMPORT"){setConfirmed(false);router.refresh();}
  }
  const run=(action:"PREVIEW"|"IMPORT")=>void guardRun(async()=>{
    try{await submit(action);}catch{
      setError("Faculty import is unavailable. Please try again.");
    }
  });
  const csvResult=report?.results.map(item=>[item.row,item.status,item.detail,item.membershipId??""]
    .map(neutralStudentCsvCell).join(",")).join("\r\n")??"";
  return <div className="space-y-5">
    <section className="space-y-3 border-t border-border pt-5">
      <h2 className="text-lg font-semibold">Bulk register faculty</h2>
      <p className="text-sm text-muted-foreground">
        Choose CSV (up to 500 rows, 1 MB). Validate before creating faculty.
        Each row reports its own result; successful registrations are not rolled back.
      </p>
      <p className="break-words font-mono text-xs">{header}</p>
      <a download="faculty-template.csv" href={"data:text/csv;charset=utf-8,"+encodeURIComponent(header+"\n")}
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-link">
        Download CSV template
      </a>
      <label className="grid gap-2 text-sm font-semibold">Choose CSV
        <input type="file" accept=".csv,text/csv" disabled={pending} onChange={async event=>{
          const file=event.currentTarget.files?.[0];
          if(!file)return;
          const version=++csvRevision.current;
          setReport(null);setConfirmed(false);setError("");
          if(file.size>1000000){setError("File exceeds 1 MB");return;}
          try{
            const contents=await file.text();
            if(facultyCsvResponseBelongsToDraft(version,csvRevision.current))setCsv(contents);
          }catch{
            if(facultyCsvResponseBelongsToDraft(version,csvRevision.current))setError("Unable to read CSV. Choose the file again.");
          }
        }}/>
      </label>
      <label className="grid gap-2 text-sm font-semibold">CSV contents
        <Textarea rows={10} value={csv} disabled={pending} onChange={event=>{
          csvRevision.current++;
          setCsv(event.target.value);setReport(null);setConfirmed(false);
        }} className="rounded-[var(--lms-control-radius)] border border-border bg-surface p-3 font-mono text-xs"/>
      </label>
      <Button variant="primary" type="button" disabled={pending||!csv.trim()} onClick={()=>run("PREVIEW")}
        className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">
        {pending?"Validating…":"Validate CSV"}
      </Button>
      {error&&<p role="alert" className="text-sm text-error">{error}</p>}
    </section>
    {report&&<section className="space-y-4 border-t border-border pt-5">
      <h2 className="text-lg font-semibold">{report.preview?"Preview":"Faculty registration results"}</h2>
      <p role="status" className="text-sm">{report.valid} valid; {report.invalid} invalid.</p>
      {report.structuralErrors.length>0&&<p role="alert">{report.structuralErrors.join(", ")}</p>}
      <a download="faculty-import-report.csv"
        href={"data:text/csv;charset=utf-8,"+encodeURIComponent("row,status,detail,membershipId\r\n"+csvResult)}
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-link">
        Download row report
      </a>
      <DataTable<Row> caption="Faculty CSV import row results" rows={report.results}
        getRowKey={item=>String(item.row)}
        columns={[
          {key:"row",header:"Row",cell:item=>item.row,mobilePriority:"primary"},
          {key:"status",header:"Status",cell:item=>item.status,mobilePriority:"secondary"},
          {key:"reason",header:"Reason",cell:item=>item.detail,mobilePriority:"secondary"},
        ]}
        empty={<p className="text-sm text-body">No row-level results are available.</p>}/>

      {report.preview&&report.valid>0&&report.structuralErrors.length===0&&
      <div className="space-y-3">
        <label className="flex gap-2 text-sm">
          <input type="checkbox" checked={confirmed} onChange={event=>setConfirmed(event.target.checked)}/>
          I understand valid rows create real faculty memberships; partial failures require manual review.
        </label>
        <Button variant="primary" type="button" disabled={pending||!confirmed} onClick={()=>run("IMPORT")}
          className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">
          {pending?"Registering…":"Confirm faculty registration"}
        </Button>
      </div>}
    </section>}
  </div>;
}
