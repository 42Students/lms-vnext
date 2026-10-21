"use client";
import { Button } from "@/components/ui/button";

import {useState} from "react";
import Link from "next/link";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";

type Item={id:string;time:string;event:string;message:string;path:string;requestId:string|null};
type LogPage={configured:boolean;items:Item[];nextPageToken:string|null;anchorAt?:string};
export function TrackerIssueLogsPanel({publicId}:{publicId:string}){
  const [busy,setBusy]=useState(false);
  const [loaded,setLoaded]=useState(false);
  const [logs,setLogs]=useState<Item[]>([]);
  const [notice,setNotice]=useState("");
  const [overflow,setOverflow]=useState(0);
  const [morePages,setMorePages]=useState(false);
  const [anchorAt,setAnchorAt]=useState("");
  async function load(){
    if(busy)return;
    setBusy(true);setNotice("");
    try{
      const data=await apiFetch<LogPage>(
        "/api/tracker/issues/"+encodeURIComponent(publicId)+"/nearby-logs",{cache:"no-store"});
      const anchor=Date.parse(data.anchorAt??"");
      const ranked=[...data.items].sort((a,b)=>{
        const left=Math.abs(Date.parse(a.time)-anchor);
        const right=Math.abs(Date.parse(b.time)-anchor);
        return (Number.isFinite(left)?left:Infinity)-(Number.isFinite(right)?right:Infinity) ||
          a.time.localeCompare(b.time) || a.id.localeCompare(b.id);
      });
      setLogs(ranked.slice(0,8));setOverflow(Math.max(0,ranked.length-8));
      setMorePages(Boolean(data.nextPageToken));setAnchorAt(data.anchorAt??"");
      setLoaded(true);
      if(!data.configured)setNotice("Live logs are not configured for this deployment.");
    }catch(error){
      setNotice(error instanceof FriendlyFetchError?error.message:
        "Could not load nearby logs. Try again.");
    }finally{setBusy(false);}
  }
  return <section className="space-y-3 border-b border-border pb-5">
    <h2 className="font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">Logs around this report</h2>
    <p className="text-sm text-body leading-[22px]">Find warnings and errors from the five minutes before and after the report.</p>
    <Button variant="secondary" type="button" disabled={busy} loading={busy} className="min-h-11 w-full md:min-h-9 md:w-auto" onClick={()=>void load()}
     >
      {busy?"Loading nearby logs…":notice.startsWith("Could not")?"Retry":"Load warnings and errors from that moment"}
    </Button>
    {busy?<div role="status" aria-label="Loading nearby logs" className="animate-pulse space-y-2">
      <div className="h-5 w-2/3 rounded bg-muted"/><div className="h-5 w-full rounded bg-muted"/>
    </div>:null}
    {notice?<p role={notice.startsWith("Could not")?"alert":"status"} className="text-sm text-body leading-[22px]">{notice}</p>:null}
    {loaded&&!logs.length?<p className="text-sm text-body leading-[22px]">No warnings or errors were logged around that time.</p>:null}
    {logs.length?<ul className="divide-y divide-border border-y border-border">{logs.map(entry=>
      <li key={entry.id} className="py-3 text-sm">
        <p className="flex flex-wrap items-center gap-2 break-words [overflow-wrap:anywhere] font-semibold">
          <span className="rounded border border-border px-2 py-0.5 text-xs">{/error|fatal|critical/i.test(entry.event)?"ERROR":"WARNING"}</span>
          {entry.event} · {entry.time}
          {anchorAt&&Number.isFinite(Date.parse(entry.time))?
            <code className="text-xs font-normal text-muted-foreground">{Math.round((Date.parse(entry.time)-Date.parse(anchorAt))/1000)}s</code>:null}
        </p>
        <p className="mt-1 whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-body">
          {entry.message.slice(0,200)}{entry.message.length>200?"…":""}
        </p>
        <p className="mt-1 break-all text-xs text-muted-foreground leading-[20px]">{entry.path}</p>
        <Link className="mt-2 inline-flex min-h-9 items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
          href={"/tracker/logs?query="+encodeURIComponent(entry.requestId??entry.event)}>
          Open in Logs
        </Link>
      </li>)}</ul>:null}
    {(overflow>0||morePages)?<p role="status" className="text-sm text-body">
      {overflow>0?overflow+" more matching logs"+(morePages?" (and additional pages)":""):"More matching logs available"}.
      {" "}<Link href="/tracker/logs" className="font-semibold text-primary-text underline">View all logs</Link>
    </p>:null}
  </section>;
}
