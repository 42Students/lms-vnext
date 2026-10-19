"use client";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Dialog} from "@/components/ui/dialog";

type Entry={id:string;time:string;event:string;message:string;path:string;requestId:string|null;component:string|null;
  knownErrorId?:string|null;muted?:boolean|null};
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
/** CSV data is redacted by the server, but spreadsheet programs can still
 * execute formulas in quoted CSV cells. Neutralise formula prefixes and bound
 * embedded newlines without changing the immutable source records. */
export function trackerLogCsv(rows:readonly Entry[]):string{
 const cell=(value:string)=>{
 const clean=value.replace(/[\r\n]+/g," ");
 const inert=/^\s*[=+\-@]/.test(clean)?"'"+clean:clean;
  return '"'+inert.replaceAll('"','""')+'"';
 };
 return ["Time,Event,Route,Component,Reference,Message",
  ...rows.map(row=>[row.time,row.event,row.path,row.component??"",row.requestId??"",row.message]
   .map(cell).join(","))].join("\n");
}
export function TrackerLiveLogsExplorer({initialQuery=""}:{initialQuery?:string}){
  const [windowMinutes,setWindowMinutes]=useState("60");
  const [minimumSeverity,setMinimumSeverity]=useState<"ERROR"|"WARNING">("ERROR");
  const [query,setQuery]=useState(initialQuery);
  const [items,setItems]=useState<Entry[]>([]);
  const [nextPage,setNextPage]=useState<string|null>(null);
  const [configured,setConfigured]=useState<boolean|null>(null);
  const [pending,setPending]=useState(false);
  const [notice,setNotice]=useState("");
  const [reportOpen,setReportOpen]=useState(false);
  const [exporting,setExporting]=useState(false);
  const [muteTarget,setMuteTarget]=useState<{id:string;muted:boolean}|null>(null);
  const [muteReason,setMuteReason]=useState("");
  const [mutating,setMutating]=useState(false);
  const locked=useRef(false);
  async function fetchPage(pageToken?:string):Promise<Page>{
    const params=new URLSearchParams({windowMinutes,minimumSeverity,query:query.trim()});
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
        const initialParams=new URLSearchParams({windowMinutes:"60",minimumSeverity:"ERROR",query:initialQuery});
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
    const contents=format==="markdown"?trackerLogMarkdown(rows):trackerLogCsv(rows);
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
  async function toggleKnownErrorMute(){
    if(!muteTarget||mutating)return;
    setMutating(true);setNotice("");
    try{
      const nextMuted=!muteTarget.muted;
      await apiFetch("/api/tracker/logs/known-errors/"+encodeURIComponent(muteTarget.id),{
        method:"PATCH",headers:{"content-type":"application/json"},
        body:JSON.stringify({action:"MUTE",muted:nextMuted,
          ...(nextMuted&&muteReason.trim()?{reason:muteReason.trim()}:{}),}),
        timeoutMs:15_000,
      });
      setItems(previous=>previous.map(item=>item.knownErrorId===muteTarget.id?
        {...item,muted:nextMuted}:item));
      setMuteTarget(null);setMuteReason("");
      setNotice(nextMuted?"Known error muted.":"Known error unmuted.");
    }catch(error){
      setNotice(error instanceof FriendlyFetchError?error.message:
        "Could not update this known error. Try again.");
    }finally{setMutating(false);}
  }
  return <section className="space-y-4 border-b border-border pb-5" aria-label="Live logs">
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
        <Select value={windowMinutes} onChange={event=>setWindowMinutes(event.target.value)}
         >
          <option value="15">Last 15 minutes</option><option value="60">Last hour</option>
          <option value="360">Last 6 hours</option><option value="1440">Last 24 hours</option>
        </Select>
      </label>
      <label className="grid gap-1 text-sm font-semibold">Minimum severity
        <Select value={minimumSeverity} onChange={event=>setMinimumSeverity(event.target.value as "ERROR"|"WARNING")}
         >
          <option value="ERROR">Error and above</option>
          <option value="WARNING">Warning and above</option>
        </Select>
      </label>
      <label className="grid min-w-44 flex-1 gap-1 text-sm font-semibold">Search this page
        <Input type="search" maxLength={150} value={query} onChange={event=>setQuery(event.target.value)}
          placeholder="Message, route, reference"/>
      </label>
      <Button variant="primary" type="button" onClick={()=>void load()} disabled={pending||exporting}
       >
        {pending?"Loading…":"Refresh newer"}
      </Button>
      <Button variant="secondary" type="button" onClick={()=>void downloadRange("csv")} disabled={pending||exporting||configured!==true}
       >
        {exporting?"Exporting…":"Download logs"}
      </Button>
      <Button variant="secondary" type="button" onClick={()=>setReportOpen(true)} disabled={!items.length}
       >
        Report for Claude
      </Button>
    </div>
    {notice?<p role={notice.startsWith("Could not")?"alert":"status"} className="text-sm text-body">{notice}</p>:null}
    {items.length?<ol className="space-y-2">
      {items.map(item=><li key={item.id} id={"log-"+item.requestId}
        className="rounded-lg border border-border p-3 text-sm">
        <details>
          <summary className="inline-flex min-h-9 cursor-pointer items-center font-semibold">
            {new Date(item.time).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} · {item.event} · {item.path}
          </summary>
          <p className="mt-2 whitespace-pre-wrap break-words text-body">{item.message}</p>
          <p className="mt-2 text-xs text-muted-foreground">Reference: {item.requestId??"Not recorded"} · {item.component??"server"}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Button variant="ghost" className="underline text-primary-text" type="button" onClick={()=>void copy(trackerLogMarkdown([item]))}
             >Copy for Claude</Button>
            <Button variant="ghost" className="underline text-primary-text" type="button" onClick={()=>void copy(window.location.origin+"/tracker/logs?query="+encodeURIComponent(item.requestId??item.event))}
             >Copy permalink</Button>
            <Link href={"/tracker?context="+encodeURIComponent(
              [item.event,item.path,item.message,"Reference: "+(item.requestId??"none")].join("\n").slice(0,450))}
              className="inline-flex min-h-9 items-center font-semibold text-primary-text underline">Report this</Link>
            {item.knownErrorId?<>
              <Link href={"/tracker/logs#known-error-"+item.knownErrorId}
                className="inline-flex min-h-9 items-center font-semibold text-primary-text underline">Known error details</Link>
              <Button variant="ghost" className="underline text-primary-text" type="button" disabled={mutating}
                onClick={()=>{setMuteReason("");setMuteTarget({id:item.knownErrorId!,muted:item.muted===true});}}
               >
                {item.muted?"Unmute this error":"Mute this error"}
              </Button>
            </>:<Link href="/tracker/logs#known-errors"
              className="inline-flex min-h-9 items-center font-semibold text-primary-text underline">Open Known Errors</Link>}
          </div>
        </details>
      </li>)}
    </ol>:<p role="status" className="text-sm text-body">No live errors loaded.</p>}
    {nextPage?<Button variant="secondary" type="button" onClick={()=>void load(true)} disabled={pending||exporting}
     >
      Load older
    </Button>:null}
    <ConfirmDialog open={muteTarget!==null} onOpenChange={next=>{if(!next&&!mutating)setMuteTarget(null);}}
      title={muteTarget?.muted?"Unmute this known error?":"Mute this known error?"}
      description="This updates the stored error signature for every matching log. It does not erase log records."
      confirmLabel={muteTarget?.muted?"Unmute":"Mute error"} pending={mutating}
      onConfirm={()=>void toggleKnownErrorMute()}>
      {!muteTarget?.muted?<label className="grid gap-1 text-sm font-semibold">
        Reason (optional)
        <Input value={muteReason} maxLength={255} onChange={event=>setMuteReason(event.target.value)}
         />
      </label>:null}
    </ConfirmDialog>
    <Dialog open={reportOpen} onOpenChange={setReportOpen} title="Report for Claude">
      <p className="mt-1 text-sm text-body">Copy a redacted report or download the selected time range.</p>
      <Textarea readOnly aria-label="Redacted tracker log report" value={trackerLogMarkdown(items)} rows={8}
       />
      <div className="mt-3 flex flex-wrap gap-3">
        <Button variant="ghost" className="underline text-primary-text" type="button" onClick={()=>void copy(trackerLogMarkdown(items))}
         >Copy report</Button>
        <Button variant="ghost" className="underline text-primary-text" type="button" onClick={()=>void downloadRange("markdown")} disabled={exporting}
         >Download report</Button>
        <Button variant="ghost" className="underline text-primary-text" type="button" onClick={()=>setReportOpen(false)}
         >Close</Button>
      </div>
    </Dialog>
  </section>;
}
