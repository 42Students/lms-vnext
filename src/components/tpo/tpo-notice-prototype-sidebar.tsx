"use client";
import Link from "next/link";
import {useState} from "react";

export type TpoNoticePrototypeListRow={
 id:string;title:string;senderName:string|null;createdAt:string;
 scheduledAt:string|null;expiresAt:string|null;
 isPinned:boolean;audienceKind:string|null;
};
function formatDate(value:string){
 const date=new Date(value);
 return Number.isFinite(date.getTime())?new Intl.DateTimeFormat("en-IN",{
  timeZone:"Asia/Kolkata",day:"numeric",month:"short",hour:"numeric",minute:"2-digit"
 }).format(date):"Date unavailable";
}
function state(row:TpoNoticePrototypeListRow,now:number){
 const scheduled=row.scheduledAt?new Date(row.scheduledAt).getTime():null;
 const ended=row.expiresAt?new Date(row.expiresAt).getTime():null;
 return scheduled!==null&&scheduled>now?"GOING OUT LATER":ended!==null&&ended<=now?"ENDED":"SHOWING NOW";
}
export function TpoNoticePrototypeSidebar({rows,activeId,tab,mine,page,nowIso}:{
 rows:readonly TpoNoticePrototypeListRow[];activeId:string|null;
 tab:"yours"|"from-42"|"deleted";mine:boolean;page:number;nowIso:string;
}){
 const [q,setQ]=useState("");
 const now=new Date(nowIso).getTime();
 const search=q.trim().toLocaleLowerCase("en");
 const filtered=rows.filter(row=>!search||[row.title,row.senderName??""].some(text=>
  text.toLocaleLowerCase("en").includes(search)));
 const base=new URLSearchParams({tab});
 if(mine)base.set("mine","0");
 if(page>1)base.set("page",String(page));
 function href(id:string){const params=new URLSearchParams(base);params.set("notice",id);
  return "/tpo/announcements?"+params.toString();}
 const groups=["GOING OUT LATER","SHOWING NOW","ENDED"] as const;
 return <aside className="min-w-0 overflow-hidden rounded-xl border border-border bg-surface"
  aria-label="Announcement list" data-testid="tpo.announcements.prototype-list">
  <div className="space-y-3 border-b border-border p-4">
   {tab==="yours"?<Link href="/tpo/announcements?tab=yours&compose=1"
    className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-3 text-sm font-semibold text-on-primary">
    + New announcement
   </Link>:null}
   <label className="sr-only" htmlFor="tpo-notice-search">Search loaded announcements</label>
   <input id="tpo-notice-search" type="search" value={q} onChange={event=>setQ(event.target.value)}
    placeholder="Search announcements on this page"
    className="min-h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground"/>
  </div>
  <div className="max-h-[72vh] overflow-y-auto">
   {groups.map(group=>{
    const matches=filtered.filter(row=>tab==="deleted"?group==="ENDED":state(row,now)===group);
    return matches.length?<section key={group} aria-label={group}>
     <h2 className="bg-surface-secondary px-4 py-2 text-xs font-bold tracking-wide text-muted-foreground">{group}</h2>
     <ul className="divide-y divide-border">{matches.map(row=><li key={row.id}>
      <Link href={href(row.id)} aria-current={activeId===row.id?"page":undefined}
       className={"block min-h-11 px-4 py-3 hover:bg-primary-subtle "+(activeId===row.id?
        "border-l-[3px] border-primary bg-primary-subtle":"")}>
       <p className="flex items-start justify-between gap-2">
        <strong className="min-w-0 break-words text-sm text-foreground">{row.isPinned?"📌 ":""}{row.title}</strong>
        <span className="shrink-0 text-[11px] text-muted-foreground">{formatDate(row.createdAt)}</span>
       </p>
       <p className="mt-1 text-xs text-body">{row.audienceKind?.replaceAll("_"," ").toLowerCase()??"College"}
        {" · "}{row.senderName??"Placement team"}</p>
      </Link>
     </li>)}</ul>
    </section>:null;
   })}
   {!filtered.length?<p role="status" className="p-4 text-sm text-muted-foreground">
    {rows.length?"No announcements match this page's search.":"No announcements on this page."}
   </p>:null}
  </div>
  <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
   Showing {filtered.length} of {rows.length} announcements on this page. Older items may be on later pages.
  </p>
 </aside>;
}
