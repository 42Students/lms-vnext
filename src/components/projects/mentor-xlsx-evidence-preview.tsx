"use client";

import {useState} from "react";
import {recruiterXlsxToCsv} from "@/modules/placements/tpo-lead-xlsx-import-model";
import {mentorXlsxTrialSummary,type MentorXlsxTrialSummary}
 from "@/modules/projects/mentor-xlsx-trial-summary-model";

const MAX_SPREADSHEET=4_000_000;
/** Preview only a browser-readable authorized same-origin reference. Never
 * relay arbitrary provider URLs or credentials through our application. */
export function MentorXlsxEvidencePreview({href,name}:{
 href:string;name:string;
}){
 const [summary,setSummary]=useState<MentorXlsxTrialSummary|null>(null);
 const [error,setError]=useState<string|null>(null);
 const [loading,setLoading]=useState(false);
 async function load(){
  if(loading)return;
  let sameOrigin=false;
  try{
   const url=new URL(href,window.location.href);
   sameOrigin=url.origin===window.location.origin&&
    (url.protocol==="https:"||(window.location.protocol==="http:"&&url.protocol==="http:"));
  }catch{/* Invalid evidence URL */}
  if(!sameOrigin){
   setError("The provider link cannot be previewed inside this project. Open the original file.");
   return;
  }
  setLoading(true);setError(null);setSummary(null);
  try{
   const response=await fetch(href,{credentials:"same-origin",redirect:"error",cache:"no-store"});
   if(!response.ok||!response.body)throw new Error("The authorized file could not be opened.");
   if(Number(response.headers.get("content-length")??"0")>MAX_SPREADSHEET)
    throw new Error("The spreadsheet is too large to preview.");
   const reader=response.body.getReader();
   let length=0;const chunks:Uint8Array[]=[];
   try{
    while(true){
     const {done,value}=await reader.read();
     if(done)break;
     length+=value.byteLength;
     if(length>MAX_SPREADSHEET)throw new Error("The spreadsheet is too large to preview.");
     chunks.push(value);
    }
   }finally{await reader.cancel().catch(()=>undefined);}
   const bytes=new Uint8Array(length);let offset=0;
   for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
   const file=new File([bytes.buffer as ArrayBuffer],name,{type:
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
   const csv=await recruiterXlsxToCsv(file);
   const parsed=mentorXlsxTrialSummary(csv);
   if(!parsed.headers.length)throw new Error("The first worksheet is empty.");
   setSummary(parsed);
  }catch(e){
   setError(e instanceof Error?e.message:"The spreadsheet preview is unavailable.");
  }finally{setLoading(false);}
 }
 return <section className="space-y-2" aria-label="Spreadsheet trial summary">
  <h5 className="font-semibold">First worksheet · trial summary</h5>
  <p className="text-xs text-muted-foreground">
   This is a read-only first-sheet preview. Numeric column totals are calculated
   only when every populated data row contains a numeric value. They are not
   interpreted as grades, submissions or official trial results.
  </p>
  <button type="button" disabled={loading} onClick={()=>void load()}
    className="rounded border border-border px-3 py-2 text-sm font-semibold disabled:opacity-60">
    {loading?"Reading spreadsheet…":summary?"Reload spreadsheet summary":"Load spreadsheet summary"}
  </button>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {summary?<div className="space-y-2">
    <p className="text-sm">{summary.totalDataRows} data rows ·
      {" "}{summary.headers.length} columns · first 12 rows shown</p>
    {summary.numericTotals.length?<ul className="text-sm">
      {summary.numericTotals.slice(0,10).map((v,i)=>
        <li key={i}>{v.header}: {v.total.toLocaleString("en-IN")}
          {" "}({v.count} numeric rows)</li>)}
    </ul>:<p className="text-sm">No fully numeric columns to total.</p>}
    <div className="max-w-full overflow-auto" role="region"
      aria-label="First spreadsheet rows" tabIndex={0}>
      <table className="w-full border-collapse text-xs">
        <thead><tr>{summary.headers.map((name,i)=>
          <th key={i} scope="col" className="border border-border p-2 text-left">
            {name}</th>)}</tr></thead>
        <tbody>{summary.rows.map((row,i)=><tr key={i}>
          {row.map((cell,j)=><td key={j}
            className="border border-border p-2">{cell}</td>)}
        </tr>)}</tbody>
      </table>
    </div>
  </div>:null}
 </section>;
}
