"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {Button} from "@/components/ui/button";

type Row={id:string;jobTitle:string;applicationStatus:string;lastUpdated:string};
type Preview={rows:Row[];totalStaleCount:number;truncated:boolean;cutoff:string};
function showDate(raw:string){
 const date=new Date(raw);
 return Number.isFinite(date.getTime())
  ?new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(date)
  :"Date unavailable";
}
/** Legacy in-page retention disclosure. No student identifiers are fetched
 * until expanded; the GET resolves college from authorized request context.
 */
export function CollegeRetentionInlinePreview(){
 const [open,setOpen]=useState(false);
 const [refresh,setRefresh]=useState(0);
 const [data,setData]=useState<Preview|null>(null);
 const [loading,setLoading]=useState(false),[error,setError]=useState(false);
 useEffect(()=>{
  if(!open)return;
  const controller=new AbortController();
  setLoading(true);setError(false);
  void fetch("/api/college/placements/retention",{
   credentials:"same-origin",cache:"no-store",signal:controller.signal,
  }).then(async response=>{
   if(!response.ok)throw Error("Retention preview unavailable");
   return await response.json() as Preview;
  }).then(result=>{
   if(controller.signal.aborted)return;
   setData(result);setLoading(false);
  }).catch(()=>{
   if(controller.signal.aborted)return;
   setError(true);setData(null);setLoading(false);
  });
  return ()=>controller.abort();
 },[open,refresh]);
 return <section className="min-w-0 border-t border-border pt-3" aria-label="Data retention report">
  <Button type="button" variant="secondary" aria-expanded={open}
   aria-controls="college-retention-preview" onClick={()=>setOpen(value=>!value)}>
   Data retention report <span aria-hidden="true">{open?"⌃":"⌄"}</span>
  </Button>
  {open?<div id="college-retention-preview" className="mt-3 space-y-3 border border-border p-3 text-sm">
   {loading?<p role="status">Loading data retention report…</p>:
    error?<div role="alert" className="space-y-2">
     <p>Couldn&apos;t load the data retention report.</p>
     <Button type="button" variant="secondary"
      onClick={()=>setRefresh(value=>value+1)}>Retry</Button>
    </div>:data?<div className="space-y-3">
     <p role="status"><strong>{data.totalStaleCount.toLocaleString("en-IN")}</strong>
      {" "}rejected/withdrawn application(s) with no activity in the last 180 days.</p>
     <p className="text-xs text-muted-foreground">Cutoff: {showDate(data.cutoff)} IST. This report is read-only and does not delete records.</p>
     {data.rows.length?<ul className="max-h-[300px] divide-y divide-border overflow-y-auto" aria-label="Retention review sample">
      {data.rows.map(row=><li key={row.id} className="flex min-w-0 flex-wrap items-center justify-between gap-2 py-2">
       <span className="min-w-0 break-words">{row.jobTitle}</span>
       <span className="text-xs text-muted-foreground">{row.applicationStatus} · {showDate(row.lastUpdated)}</span>
      </li>)}
     </ul>:<p>No applications needing review.</p>}
     {data.truncated?<p role="status" className="text-xs text-muted-foreground">
      Showing first {data.rows.length} of {data.totalStaleCount} records. Open the full report to review other matches.
     </p>:null}
     <Link href="/college/placements/retention?olderThanDays=180"
      className="inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2">
      Open full retention report →
     </Link>
    </div>:null}
  </div>:null}
 </section>;
}
