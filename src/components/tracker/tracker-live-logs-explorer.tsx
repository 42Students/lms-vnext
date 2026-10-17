"use client";

import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";

type Entry={id:string;time:string;event:string;message:string;path:string;requestId:string|null;component:string|null};
type Page={configured:boolean;items:Entry[];nextPageToken:string|null};
function mergeEntries(existing:Entry[],incoming:Entry[]):Entry[]{
  const seen=new Set(existing.map(item=>item.id));
  return [...existing,...incoming.filter(item=>{if(seen.has(item.id))return false;seen.add(item.id);return true;})];
}
export function trackerLogMarkdown(rows:readonly Entry[]):string{
  return ["# Tracker live log report",
    "Generated from redacted log records visible to the authorized administrator.",
    ...rows.map(row=>[
      "## "+row.time+" · "+row.event,
      "Route: "+row.path,
      "Component: "+(row.component??"unknown"),
      "Reference: "+(row.requestId??"not recorded"),
      "Details: "+row.message,
    ].join("\n"))].join("\n\n");
}
export function TrackerLiveLogsExplorer({initialQuery=""}:{initialQuery?:string}){
  const [windowMinutes,setWindowMinutes]=useState("60");
  const [query,setQuery]=useState(initialQuery);
  const [items,setItems]=useState<Entry[]>([]);
  const [nextPage,setNextPage]=useState<string|null>(null);
  const [configured,setConfigured]=useState<boolean|null>(null);
  const [pending,setPending]=useState(false);
  const [notice,setNotice]=useState("");
  const [reportOpen,setReportOpen]=useState(false);
  const [exporting,setExporting]=useState(false);
  const locked=useRef(false);
  async function fetchPage(pageToken?:string):Promise<Page>{
    const params=new URLSearchParams({windowMinutes,query:query.trim()});
    if(pageToken)params.set("pageToken",pageToken);
    return apiFetch<Page>("/api/tracker/live-logs?"+params.toString(),{cache:"no-store"});
  }
  async function load(older=false){
    if(locked.current)return;
    locked.current=true;setPending(true);setNotice("");
    try{
      const result=await fetchPage(older?nextPage??undefined:undefined);
      setConfigured(result.configured);
      setItems(previous=>older?mergeEntries(previous,result.items):result.items);
      setNextPage(result.nextPageToken);
      if(!result.configured)setNotice("Live Cloud Logging is not configured. Known Errors remain available below.");
      else if(!older&&!result.items.length)setNotice("No matching errors in the selected page and time window.");
    }catch(error){
      setNotice(error instanceof FriendlyFetchError?error.message:friendlyApiError({}));
    }finally{locked.current=false;setPending(false);}
  }
  useEffect(()=>{
    const abort=new AbortController();
    const initial=async()=>{
      try{
        const initialParams=new URLSearchParams({windowMinutes:"60",query:initialQuery});
        const r=await apiFetch<Page>("/api/tracker/live-logs?"+initialParams.toString(),{signal:abort.signal});
        if(abort.signal.aborted)return;
        setItems(r.items);setNextPage(r.nextPageToken);setConfigured(r.configured);
      }catch{
        if(!abort.signal.aborted)setNotice("Live logs could not be loaded. Try again.");
      }
    };
    void initial();
    return ()=>abort.abort();
  },[initialQuery]);
  async function copy(text:string){
    try{await navigator.clipboard.writeText(text);setNotice("Copied.");}
    catch{setNotice("Copy is unavailable. Select the text manually.");}
  }
  function download(rows:Entry[],format:"csv"|"markdown"){
    const contents=format==="markdown"?trackerLogMarkdown(rows):
      ["Time,Event,Route,Component,Reference,Message",
       ...rows.map(row=>[row.time,row.event,row.path,row.component??"",row.requestId??"",row.message]
         .map(value=>'"'+value.replaceAll('"','""')+'"').join(","))].join("\n");
    const blob=new Blob([contents],{type:format==="csv"?"text/csv;charset=utf-8":"text/markdown;charset=utf-8"});
    const href=URL.createObjectURL(blob);
    const anchor=document.createElement("a");anchor.href=href;
    anchor.download=format==="csv"?"tracker-logs.csv":"tracker-logs-for-claude.md";
    anchor.click();URL.revokeObjectURL(href);
    setNotice("Downloaded "+rows.length+" log entries.");
  }
  async function downloadRange(format:"csv"|"markdown"){
    if(exporting||pending)return;
    setExporting(true);setNotice("Preparing export…");
    try{
      let rows:Entry[]=[];let cursor:string|null=null;
      // Download a bounded, privacy-redacted snapshot. Provider pagination is
      // not claimed complete when the 240-entry export limit is reached.
      for(let i=0;i<20;i++){
        const response:Page=await fetchPage(cursor??undefined);
        if(!response.configured)break;
        rows=mergeEntries(rows,response.items);
        cursor=response.nextPageToken;
        if(!cursor)break;
      }
      if(!rows.length){setNotice("No matching log entries to download.");return;}
      download(rows,format);
      if(cursor)setNotice("Downloaded the first "+rows.length+" entries. Narrow the time range to export more.");
    }catch(error){setNotice(error instanceof FriendlyFetchError?error.message:"Could not prepare logs. Try again.");}
    finally{setExporting(false);}
  }
  return <section className="space-y-4 rounded-xl border border-border bg-surface p-5" aria-label="Live logs">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-lg font-semibold">Live Google Cloud Logging</h2>
        <p className="mt-1 text-sm text-body">Redacted error entries (ERROR and above) from the configured deployment namespace.</p>
      </div>
      <span role="status" className="text-xs text-muted-foreground">
        {configured===false?"Not configured":configured===true?"Live source enabled":"Checking live source"}
      </span>
    </div>
    <div className="flex flex-wrap items-end gap-3">
      <label className="grid gap-1 text-sm font-semibold">Time window
        <select value={windowMinutes} onChange={event=>setWindowMinutes(event.target.value)}
          className="min-h-10 rounded-md border border-border bg-background px-3">
          <option value="15">Last 15 minutes</option><option value="60">Last hour</option>
          <option value="360">Last 6 hours</option><option value="1440">Last 24 hours</option>
        </select>
      </label>
      <label className="grid min-w-44 flex-1 gap-1 text-sm font-semibold">Search this page
        <input type="search" maxLength={150} value={query} onChange={event=>setQuery(event.target.value)}
          placeholder="Message, route, reference" className="min-h-10 rounded-md border border-border bg-background px-3"/>
      </label>
      <button type="button" onClick={()=>void load()} disabled={pending||exporting}
        className="min-h-10 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">
        {pending?"Loading…":"Refresh newer"}
      </button>
      <button type="button" onClick={()=>void downloadRange("csv")} disabled={pending||exporting||configured!==true}
        className="min-h-10 rounded-md border border-border px-3 text-sm font-semibold disabled:opacity-50">
        {exporting?"Exporting…":"Download logs"}
      </button>
      <button type="button" onClick={()=>setReportOpen(true)} disabled={!items.length}
        className="min-h-10 rounded-md border border-border px-3 text-sm font-semibold">
        Report for Claude
      </button>
    </div>
    {notice?<p role={notice.startsWith("Could not")?"alert":"status"} className="text-sm text-body">{notice}</p>:null}
    {items.length?<ol className="space-y-2">
      {items.map(item=><li key={item.id} id={"log-"+item.requestId}
        className="rounded-lg border border-border p-3 text-sm">
        <details>
          <summary className="cursor-pointer font-semibold">
            {new Date(item.time).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} · {item.event} · {item.path}
          </summary>
          <p className="mt-2 whitespace-pre-wrap break-words text-body">{item.message}</p>
          <p className="mt-2 text-xs text-muted-foreground">Reference: {item.requestId??"Not recorded"} · {item.component??"server"}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button type="button" onClick={()=>void copy(trackerLogMarkdown([item]))}
              className="font-semibold text-primary-text underline">Copy for Claude</button>
            <button type="button" onClick={()=>void copy(window.location.origin+"/tracker/logs?query="+encodeURIComponent(item.requestId??item.event))}
              className="font-semibold text-primary-text underline">Copy permalink</button>
            <Link href={"/tracker?context="+encodeURIComponent(
              [item.event,item.path,item.message,"Reference: "+(item.requestId??"none")].join("\n").slice(0,450))}
              className="font-semibold text-primary-text underline">Report this</Link>
          </div>
        </details>
      </li>)}
    </ol>:<p className="text-sm text-body">No live errors loaded.</p>}
    {nextPage?<button type="button" onClick={()=>void load(true)} disabled={pending||exporting}
      className="min-h-10 rounded-md border border-border px-3 text-sm font-semibold disabled:opacity-50">
      Load older
    </button>:null}
    {reportOpen?<div role="dialog" aria-modal="true" aria-label="Report for Claude"
      className="rounded-lg border border-border bg-background p-4">
      <h3 className="font-semibold">Report for Claude</h3>
      <p className="mt-1 text-sm text-body">Copy a redacted report or download the selected time range.</p>
      <textarea readOnly value={trackerLogMarkdown(items)} rows={8}
        className="mt-3 w-full rounded border border-border bg-surface p-3 text-xs"/>
      <div className="mt-3 flex flex-wrap gap-3">
        <button type="button" onClick={()=>void copy(trackerLogMarkdown(items))}
          className="font-semibold text-primary-text underline">Copy report</button>
        <button type="button" onClick={()=>void downloadRange("markdown")} disabled={exporting}
          className="font-semibold text-primary-text underline">Download report</button>
        <button type="button" onClick={()=>setReportOpen(false)}
          className="font-semibold text-primary-text underline">Close</button>
      </div>
    </div>:null}
  </section>;
}
