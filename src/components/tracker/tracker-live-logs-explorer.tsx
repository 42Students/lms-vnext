"use client";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineNotice } from "@/components/ui/inline-notice";
import { Disclosure } from "@/components/ui/disclosure";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {useEffect,useMemo,useRef,useState} from "react";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [minimumSeverity,setMinimumSeverity]=useState<"ERROR"|"WARNING">("WARNING");
  const [groupSimilar,setGroupSimilar]=useState(true);
  const [autoRefresh,setAutoRefresh]=useState(false);
  const [rateLimited,setRateLimited]=useState(false);
  const [stale,setStale]=useState(false);
  const [lastSuccessfulAt,setLastSuccessfulAt]=useState<Date|null>(null);
  const [query,setQuery]=useState(initialQuery);
  const [appliedFilters,setAppliedFilters]=useState("60|WARNING|"+initialQuery.trim());
  const currentFilters=windowMinutes+"|"+minimumSeverity+"|"+query.trim();
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
  const currentFiltersRef=useRef(currentFilters);
  currentFiltersRef.current=currentFilters;
  const fetchGeneration=useRef(0);
  const periodicReload=useRef<()=>Promise<void>>(async()=>{});
  const grouped=useMemo(()=>{
    if(!groupSimilar)return items.map(item=>({item,count:1}));
    const groups=new Map<string,{item:Entry;count:number}>();
    for(const item of items){
      const key=[item.event,item.path,item.component??"",item.message].join("|");
      const existing=groups.get(key);
      if(existing)existing.count+=1;
      else groups.set(key,{item,count:1});
    }
    return [...groups.values()];
  },[groupSimilar,items]);
  async function fetchPage(pageToken?:string):Promise<Page>{
    const params=new URLSearchParams({windowMinutes,minimumSeverity,query:query.trim()});
    if(pageToken)params.set("pageToken",pageToken);
    return apiFetch<Page>("/api/tracker/live-logs?"+params.toString(),{cache:"no-store"});
  }
  async function load(older=false){
    if(locked.current||(older&&currentFilters!==appliedFilters))return;
    const loadingFilters=currentFilters;
    const generation=++fetchGeneration.current;
    locked.current=true;setPending(true);setNotice("");
    try{
      const result=await fetchPage(older?nextPage??undefined:undefined);
      if(generation!==fetchGeneration.current||loadingFilters!==currentFiltersRef.current)return;
      setConfigured(result.configured);
      setRateLimited(false);setStale(false);setLastSuccessfulAt(new Date());
      setAppliedFilters(loadingFilters);
      setItems(previous=>older?mergeEntries(previous,result.items):
        loadingFilters===appliedFilters?mergeEntries(result.items,previous):result.items);
      setNextPage(result.nextPageToken);
      if(!result.configured)setNotice("Live Cloud Logging is not configured. Known Errors remain available below.");
      else if(!older&&!result.items.length)setNotice("No matching errors in the selected page and time window.");
    }catch(error){
      if(generation!==fetchGeneration.current||loadingFilters!==currentFiltersRef.current)return;
      const status=error instanceof FriendlyFetchError?error.status:0;
      if(status===429){setRateLimited(true);setAutoRefresh(false);}
      setStale(items.length>0);
      setNotice(status===429?"Too many requests. Auto-refresh paused; try again later.":
        status===403?"You do not have permission to view these logs.":
        status===401?"Your session has expired. Sign in again.":
        status===502||status===503?"The live log service is temporarily unavailable. Try again.":
        error instanceof FriendlyFetchError?error.message:friendlyApiError({}));
    }finally{locked.current=false;setPending(false);}
  }
  periodicReload.current=()=>load(false);
  useEffect(()=>{
    if(!autoRefresh||rateLimited)return;
    const refresh=()=>{
      if(document.hidden||reportOpen||muteTarget!==null||pending)return;
      void periodicReload.current();
    };
    const timer=window.setInterval(refresh,30_000);
    document.addEventListener("visibilitychange",refresh);
    return ()=>{
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange",refresh);
    };
  },[autoRefresh,rateLimited,reportOpen,muteTarget,pending]);
  useEffect(()=>{
    const abort=new AbortController();
    const initial=async()=>{
      try{
        const initialParams=new URLSearchParams({windowMinutes:"60",minimumSeverity:"WARNING",query:initialQuery});
        const r=await apiFetch<Page>("/api/tracker/live-logs?"+initialParams.toString(),{signal:abort.signal});
        if(abort.signal.aborted||currentFiltersRef.current!=="60|WARNING|"+initialQuery.trim())return;
        setItems(r.items);setNextPage(r.nextPageToken);setConfigured(r.configured);
        setStale(false);setLastSuccessfulAt(new Date());
        setAppliedFilters("60|WARNING|"+initialQuery.trim());
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
      setNotice(nextMuted?"Muted — this error type won’t be surfaced as noise going forward.":"Unmuted — this error type will be surfaced again.");
    }catch(error){
      setNotice(error instanceof FriendlyFetchError?error.message:
        "Could not update this known error. Try again.");
    }finally{setMutating(false);}
  }
  return <section className="min-w-0 space-y-4 border-b border-border pb-5" aria-label="Live logs">
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">Live Google Cloud Logging</h2>
        <p className="mt-1 text-sm text-body leading-[22px]">Redacted log entries from the configured deployment namespace. Warning and above by default.</p>
      </div>
      <span role="status" className="text-xs text-muted-foreground">
        {configured===false?"Not configured":configured===true?"Live source enabled":"Checking live source"}
      </span>
    </div>
    <div className="grid min-w-0 gap-3 md:grid-cols-[max-content_max-content_minmax(0,1fr)_auto] md:items-end">
      <label className="grid w-full min-w-0 basis-full gap-[6px] text-[length:var(--lms-font-sm)] font-semibold md:w-auto md:basis-auto leading-4 text-[13px] text-[var(--lms-neutral-400)]">Time window
        <Select value={windowMinutes} onChange={event=>setWindowMinutes(event.target.value)} className="min-h-11 w-full min-w-0 md:min-h-9">
          <option value="15">Last 15 minutes</option><option value="60">Last hour</option>
          <option value="360">Last 6 hours</option><option value="1440">Last 24 hours</option>
        </Select>
      </label>
      <label className="grid w-full min-w-0 basis-full gap-[6px] text-[length:var(--lms-font-sm)] font-semibold md:w-auto md:basis-auto leading-4 text-[13px] text-[var(--lms-neutral-400)]">Minimum severity
        <Select value={minimumSeverity} onChange={event=>setMinimumSeverity(event.target.value as "ERROR"|"WARNING")} className="min-h-11 w-full min-w-0 md:min-h-9">
          <option value="ERROR">Error and above</option>
          <option value="WARNING">Warning and above</option>
        </Select>
      </label>
      <label className="grid w-full min-w-0 basis-full gap-[6px] text-[length:var(--lms-font-sm)] font-semibold md:min-w-44 md:basis-auto md:flex-1 leading-4 text-[13px] text-[var(--lms-neutral-400)]">Search this page
        <Input type="search" maxLength={150} value={query} onChange={event=>setQuery(event.target.value)}
          placeholder="Message, route, reference" className="min-h-11 w-full min-w-0 md:min-h-9"/>
      </label>
      <Button variant="primary" type="button" onClick={()=>void load()} loading={pending} disabled={pending||exporting} className="min-h-11 w-full md:min-h-9 md:w-auto">
        {pending?"Loading…":"Refresh newer"}
      </Button>
    </div>
    <div className="flex min-w-0 flex-wrap items-center gap-5 text-sm">
      <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 md:min-h-9">
        <Checkbox checked={groupSimilar} onChange={event=>setGroupSimilar(event.target.checked)} />
        Group similar
      </label>
      <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 md:min-h-9">
        <Checkbox checked={autoRefresh} disabled={rateLimited}
          onChange={event=>setAutoRefresh(event.target.checked)} />
        Auto-refresh every 30 seconds
      </label>
      {lastSuccessfulAt?<span className="text-xs text-muted-foreground">
        Last loaded {lastSuccessfulAt.toLocaleTimeString("en-IN",{timeZone:"Asia/Kolkata"})} IST
      </span>:null}
    </div>
    <Disclosure title="Export and report tools" className="border-t border-border" contentClassName="px-2 pb-3">
     <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
      <Button variant="secondary" type="button" onClick={()=>void downloadRange("csv")} loading={exporting} disabled={pending||exporting||configured!==true} className="min-h-11 w-full sm:w-auto md:min-h-9">
        {exporting?"Exporting…":"Download logs"}
      </Button>
      <Button variant="secondary" type="button" onClick={()=>setReportOpen(true)} disabled={!items.length} className="min-h-11 w-full sm:w-auto md:min-h-9">
        Report for Claude
      </Button>
     </div>
    </Disclosure>
    {stale?<InlineNotice tone="warning" message="Showing previously loaded results. Refresh or retry for the latest logs."/>:null}
    {rateLimited?<InlineNotice tone="warning" message="Rate limit reached. Automatic refresh is paused."/>:null}
    {notice?<InlineNotice tone={/could not|unavailable|failed|expired|permission|too many/i.test(notice)?"error":"info"} message={notice}/>:null}
    {stale?<Button type="button" variant="secondary" onClick={()=>void load()} disabled={pending}>
      Retry
    </Button>:null}
    {items.length?<ol className="min-w-0 divide-y divide-border border-y border-border">
      {grouped.map(({item,count})=><li key={item.id} id={"log-"+item.requestId}
        className="min-w-0 py-3 text-sm">
        <Disclosure summaryClassName="min-w-0 break-words [overflow-wrap:anywhere]" title={new Date(item.time).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})+" · "+item.event+" · "+item.path+(count>1?" · "+count+" similar":"")}>
          <p className="mt-2 whitespace-pre-wrap break-words text-body">{item.message}</p>
          <p className="mt-2 text-xs text-muted-foreground leading-[20px]">Reference: {item.requestId??"Not recorded"} · {item.component??"server"}</p>
          <div className="mt-3 flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Button variant="ghost" className="min-h-11 w-full sm:w-auto md:min-h-9" type="button" onClick={()=>void copy(trackerLogMarkdown([item]))}
             >Copy for Claude</Button>
            <Button variant="ghost" className="min-h-11 w-full sm:w-auto md:min-h-9" type="button" onClick={()=>void copy(window.location.origin+"/tracker/logs?query="+encodeURIComponent(item.requestId??item.event))}
             >Copy permalink</Button>
            <Link href={"/tracker?context="+encodeURIComponent(
              [item.event,item.path,item.message,"Reference: "+(item.requestId??"none")].join("\n").slice(0,450))}
              className="inline-flex min-h-11 w-full items-center font-semibold text-primary-text underline sm:w-auto md:min-h-9 focus-visible:underline">Report this</Link>
            {item.knownErrorId?<>
              <Link href={"/tracker/logs#known-error-"+item.knownErrorId}
                className="inline-flex min-h-11 w-full items-center font-semibold text-primary-text underline sm:w-auto md:min-h-9 focus-visible:underline">Known error details</Link>
              <Button variant="ghost" className="min-h-11 w-full sm:w-auto md:min-h-9" type="button" disabled={mutating}
                onClick={()=>{setMuteReason("");setMuteTarget({id:item.knownErrorId!,muted:item.muted===true});}}
               >
                {item.muted?"Unmute this error":"Mute this error"}
              </Button>
            </>:<Link href="/tracker/logs#known-errors"
              className="inline-flex min-h-11 w-full items-center font-semibold text-primary-text underline sm:w-auto md:min-h-9 focus-visible:underline">Open Known Errors</Link>}
          </div>
        </Disclosure>
      </li>)}
    </ol>:<EmptyState title="No live errors loaded" description="Load or refresh live logs to see the latest authorized error events."/>}
    {nextPage&&currentFilters===appliedFilters?<Button variant="secondary" type="button" onClick={()=>void load(true)} loading={pending} disabled={pending||exporting} className="min-h-11 w-full sm:w-auto md:min-h-9">
      Load older
    </Button>:null}
    <ConfirmDialog open={muteTarget!==null} onOpenChange={next=>{if(!next&&!mutating)setMuteTarget(null);}}
      title={muteTarget?.muted?"Unmute this known error?":"Mute this known error?"}
      description="This updates the stored error signature for every matching log. It does not erase log records."
      confirmLabel={muteTarget?.muted?"Unmute":"Mute error"} pending={mutating}
      onConfirm={()=>void toggleKnownErrorMute()}>
      {!muteTarget?.muted?<label className="grid gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">
        Reason (optional)
        <Input value={muteReason} maxLength={255} onChange={event=>setMuteReason(event.target.value)}
         />
      </label>:null}
    </ConfirmDialog>
    <Dialog open={reportOpen} onOpenChange={setReportOpen} title="Report for Claude"
     footer={<div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
       <Button variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" type="button" onClick={()=>setReportOpen(false)}>Close</Button>
       <Button variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" type="button" onClick={()=>void downloadRange("markdown")} loading={exporting} disabled={exporting}>Download report</Button>
       <Button variant="primary" className="min-h-11 w-full sm:w-auto md:min-h-9" type="button" onClick={()=>void copy(trackerLogMarkdown(items))}>Copy report</Button>
     </div>}>
      <p className="mt-1 text-sm text-body leading-[22px]">Copy a redacted report or download the selected time range.</p>
      <Textarea className="w-full min-w-0" readOnly aria-label="Redacted tracker log report" value={trackerLogMarkdown(items)} rows={8}
       />

    </Dialog>
  </section>;
}
