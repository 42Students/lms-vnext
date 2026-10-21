"use client";
import Link from "next/link";
import {useEffect,useRef,useState} from "react";
import {Button} from "@/components/ui/button";
import {TPO_MORE_GROUPS} from "@/modules/placements/tpo-utility-model";
import {apiFetch} from "@/lib/api-fetch";

type Counts={requests:number;messages:number;notifications:number;team:number|null};
function showBadge(count:number){return count>99?"99+":String(count);}

/** Existing tenant-scoped /api/tpo/shell-counts endpoint is the single batched
 * source for pending requests and unread recruiter messages. Never show 0 on a
 * failed read: badges are then unknown, while destinations remain available. */
export function TpoMoreNavigation(){
 const [counts,setCounts]=useState<Counts|null>(null);
 const [error,setError]=useState(false);
 const [busy,setBusy]=useState(true);
 const inFlight=useRef(false);
 async function refresh(){
  if(inFlight.current)return;
  inFlight.current=true;setBusy(true);setError(false);
  try{
   const reply=await apiFetch<Counts>("/api/tpo/shell-counts",{
    credentials:"same-origin",cache:"no-store",timeoutMs:15000,
   });
   if(!Number.isSafeInteger(reply.requests)||reply.requests<0||
      !Number.isSafeInteger(reply.messages)||reply.messages<0)throw new Error("Invalid count response");
   setCounts(reply);
  }catch{setError(true);}
  finally{inFlight.current=false;setBusy(false);}
 }
 useEffect(()=>{void refresh();},[]);
 return <div className="min-w-0 space-y-4">
  {error?<div role="alert" className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-3 text-sm">
   <span>Waiting requests and unread messages could not be counted.</span>
   <Button type="button" variant="secondary" onClick={()=>void refresh()} disabled={busy}
    className="min-h-11 md:min-h-9">{busy?"Retrying…":"Retry"}</Button>
  </div>:null}
  <nav aria-label="More TPO destinations" className="grid gap-4 border-b border-border pb-4 min-[900px]:grid-cols-[1.2fr_0.8fr]">
   {TPO_MORE_GROUPS.map(group=><section key={group.heading} aria-label={group.heading}
    className={"min-w-0 space-y-3 border border-border p-4 "+(group.heading==="Work"?"min-[900px]:row-span-2":"")}>
    <div><h2 className="text-xs font-semibold uppercase tracking-wide text-foreground">{group.heading}</h2>
     <p className="mt-1 text-sm text-body">{group.description}</p></div>
    <div className="grid min-w-0 grid-cols-1 border-t border-border">
     {group.links.map(item=>{
      const count=item.href==="/tpo/requests"?counts?.requests:item.href==="/tpo/messages"?counts?.messages:undefined;
      return <Link key={item.href} href={item.href}
       className="group block min-h-16 min-w-0 border-b border-border px-3 py-3 transition-colors hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] min-[768px]:min-h-9">
       <div className="flex min-w-0 items-start justify-between gap-3">
        <h3 className="min-w-0 break-words text-base font-semibold text-link">{item.label}
         {count!==undefined&&count>0?<span aria-label={count+" waiting"} className="ml-2 inline-flex min-w-6 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-xs font-semibold text-on-primary">{showBadge(count)}</span>:null}
        </h3><span aria-hidden="true" className="shrink-0 text-link">→</span>
       </div>
       <p className="mt-2 max-w-prose break-words text-sm leading-6 text-body">{item.description}</p>
      </Link>;
     })}
    </div>
   </section>)}
  </nav>
 </div>;
}
