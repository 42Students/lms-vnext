"use client";
import Link from "next/link";
import {useEffect,useRef,useState} from "react";
import {Button} from "@/components/ui/button";
import {TPO_MORE_GROUPS} from "@/modules/placements/tpo-utility-model";
import {apiFetch} from "@/lib/api-fetch";

type Counts={requests:number;messages:number;notifications:number;team:number|null};
function showBadge(count:number){
 return Number.isFinite(count)&&count>0?(count>99?"99+":String(count)):null;
}

/** 20px outlined icons follow the legacy More directory's Ant-icon proportions.
 * No external icon package is installed in the vNext application. */
function MoreIcon({href}:{href:string}){
 const paths:Record<string,string>={
  "/tpo/batches":"M3 21V7l9-4 9 4v14M9 21v-7h6v7M3 10h18",
  "/tpo/requests":"M4 12l5 5L20 6M4 3h16v18H4V3",
  "/tpo/calendar":"M3 6h18v15H3V6M7 3v6M17 3v6M3 11h18",
  "/tpo/announcements":"M3 10h4l11-5v14L7 14H3v-4M7 14l2 6h3",
  "/tpo/messages":"M3 4h18v14H8l-5 4V4M7 9h10M7 13h7",
  "/tpo/settings?tab=team":"M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8M4 21v-3a8 8 0 0 1 16 0v3H4",
  "/tpo/team":"M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8M4 21v-3a8 8 0 0 1 16 0v3H4",
  "/tpo/reports":"M4 3h12l4 4v14H4V3M16 3v5h4M8 16h8M8 12h5",
  "/tpo/notifications":"M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
  "/tpo/settings":"M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M18.4 5.6l-2.1 2.1m-8.6 8.6-2.1 2.1M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
  "/tpo/audit":"M12 6v6l4 2M3 12a9 9 0 1 0 3-6M3 4v4h4",
  "/tpo/profile":"M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8M4 21v-3a8 8 0 0 1 16 0v3H4",
 };
 return <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"
   fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"
   strokeLinecap="round"><path d={paths[href]??paths["/tpo/reports"]}/></svg>;
}

/** The lightweight endpoint enforces the active TPO membership and college.
 * Cache only inside this mounted component; never share tenant counts globally. */
export function TpoMoreNavigation(){
 const [counts,setCounts]=useState<Counts|null>(null);
 const [error,setError]=useState(false);
 const [busy,setBusy]=useState(true);
 const inFlight=useRef(false);
 const lastSuccess=useRef(0);
 const mounted=useRef(true);
 async function refresh(force=false){
  if(inFlight.current||(!force&&lastSuccess.current&&Date.now()-lastSuccess.current<5000))return;
  inFlight.current=true;setBusy(true);setError(false);
  try{
   const reply=await apiFetch<Counts>("/api/tpo/shell-counts",{
    credentials:"same-origin",cache:"no-store",timeoutMs:15000,
   });
   if(!Number.isSafeInteger(reply.requests)||reply.requests<0||
      !Number.isSafeInteger(reply.messages)||reply.messages<0)throw new Error("Invalid count response");
   if(mounted.current){setCounts(reply);lastSuccess.current=Date.now();}
  }catch{if(mounted.current)setError(true);}
  finally{inFlight.current=false;if(mounted.current)setBusy(false);}
 }
 useEffect(()=>{
  mounted.current=true;
  void refresh();
  return ()=>{mounted.current=false;};
 },[]);
 return <div className="min-w-0 space-y-[14px]">
  {error?<div role="alert" data-testid="tpo.more.counts-failed"
    className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm text-muted-foreground">
   <span>Waiting requests and unread messages could not be counted.</span>
   <Button type="button" variant="secondary" onClick={()=>void refresh(true)} disabled={busy}
    className="min-h-11 md:min-h-9">{busy?"Retrying…":"Retry"}</Button>
  </div>:null}
  <nav aria-label="More TPO destinations"
   className="grid grid-cols-1 gap-[15px] min-[900px]:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] min-[900px]:gap-[18px]">
   {TPO_MORE_GROUPS.map(group=>{
    const titleId="tpo-more-"+group.heading.toLowerCase();
    return <section key={group.heading} aria-labelledby={titleId}
      className={"min-w-0 "+(group.heading==="Work"?"min-[900px]:row-span-2":"")}>
     <h2 id={titleId}
       className="mb-[7px] ml-1 text-xs font-bold uppercase leading-[1.2] tracking-[0.09em] text-muted-foreground">
       {group.heading}
     </h2>
     <div className="overflow-hidden rounded-[13px] border border-[var(--lms-canvas-border)] bg-white shadow-[0_4px_18px_rgba(26,45,72,0.04)]">
      {group.links.map(item=>{
       const count=item.href==="/tpo/requests"?counts?.requests:
         item.href==="/tpo/messages"?counts?.messages:undefined;
       const badge=count===undefined?null:showBadge(count);
       return <Link key={item.href} href={item.href}
        className="group flex min-h-16 min-w-0 items-center gap-3 border-t border-[var(--lms-canvas-border)] bg-white px-3 py-[11px] transition-colors duration-150 first:border-t-0 hover:bg-[var(--lms-primary-subtle)] focus-visible:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--lms-primary)] min-[768px]:min-h-[68px] min-[768px]:px-[14px] min-[768px]:py-3">
        <span aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-[#e6ebf1] bg-[var(--lms-neutral-50)] text-[var(--lms-neutral-500)] min-[768px]:size-[38px]">
         <MoreIcon href={item.href}/>
        </span>
        <span className="min-w-0 flex-1">
         <span className="block text-[14px] font-[650] leading-[1.3] text-[#27364d] group-hover:text-[var(--lms-primary)]">{item.label}</span>
         <span className="mt-[2px] block break-words text-xs leading-[1.4] text-muted-foreground">{item.description}</span>
        </span>
        {badge?<span aria-label={item.href==="/tpo/messages"?count+" unread messages":count+" waiting requests"} className="inline-flex min-w-6 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-xs font-bold text-on-primary">{badge}</span>:null}
        <svg aria-hidden="true" className="size-3 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-[2px] group-hover:text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 5 7 7-7 7"/></svg>
       </Link>;
      })}
     </div>
    </section>;
   })}
  </nav>
 </div>;
}
