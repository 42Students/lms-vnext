"use client";
import { Button } from "@/components/ui/button";

import {useState} from "react";
import Link from "next/link";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";

type Item={id:string;time:string;event:string;message:string;path:string;requestId:string|null};
type LogPage={configured:boolean;items:Item[];nextPageToken:string|null};
export function TrackerIssueLogsPanel({publicId}:{publicId:string}){
  const [busy,setBusy]=useState(false);
  const [loaded,setLoaded]=useState(false);
  const [logs,setLogs]=useState<Item[]>([]);
  const [notice,setNotice]=useState("");
  async function load(){
    if(busy)return;
    setBusy(true);setNotice("");
    try{
      const data=await apiFetch<LogPage>(
        "/api/tracker/issues/"+encodeURIComponent(publicId)+"/nearby-logs",{cache:"no-store"});
      setLogs(data.items);setLoaded(true);
      if(!data.configured)setNotice("Live logs are not configured for this deployment.");
    }catch(error){
      setNotice(error instanceof FriendlyFetchError?error.message:
        "Could not load nearby logs. Try again.");
    }finally{setBusy(false);}
  }
  return <section className="space-y-3 border-b border-border pb-5">
    <h2 className="text-lg font-semibold">Logs around this report</h2>
    <p className="text-sm text-body">Find warnings and errors from the ten minutes before and after the report.</p>
    <Button variant="secondary" type="button" disabled={busy} onClick={()=>void load()}
     >
      {busy?"Loading nearby logs…":"Load warnings and errors from that moment"}
    </Button>
    {notice?<p role="status" className="text-sm text-body">{notice}</p>:null}
    {loaded&&!logs.length?<p className="text-sm text-body">No matching warnings or errors were found.</p>:null}
    {logs.length?<ul className="divide-y divide-border border-y border-border">{logs.map(entry=>
      <li key={entry.id} className="py-3 text-sm">
        <p className="font-semibold">{entry.event} · {entry.time}</p>
        <p className="mt-1 text-body">{entry.message}</p>
        <p className="mt-1 text-xs text-muted-foreground">{entry.path}</p>
        <Link className="mt-2 inline-flex min-h-9 items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
          href={"/tracker/logs?query="+encodeURIComponent(entry.requestId??entry.event)}>
          Open in Logs
        </Link>
      </li>)}</ul>:null}
  </section>;
}
