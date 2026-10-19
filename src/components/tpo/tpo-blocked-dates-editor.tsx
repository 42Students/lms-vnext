"use client";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {InlineNotice} from "@/components/ui/inline-notice";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {filterTpoBlockedDates,tpoBlockedDatesEmptyMessage} from "@/modules/placements/tpo-blocked-date-filter-model";
import {groupTpoBlockedDays} from "@/modules/placements/tpo-blocked-range-display";
import {tpoIndiaCalendarDay} from "@/modules/placements/tpo-local-date-model";
type BlockedDay={id:string;day:string;reason:string;updatedAt:string};
export function TpoBlockedDatesEditor({items}:{items:readonly BlockedDay[]}){
 const router=useRouter(),[startDay,setStartDay]=useState(""),[endDay,setEndDay]=useState(""),[reason,setReason]=useState("");
 const [showPast,setShowPast]=useState(false);
 const today=tpoIndiaCalendarDay(new Date());
 const rangeLength=startDay&&endDay?Math.round((Date.parse(endDay+"T00:00:00Z")-Date.parse(startDay+"T00:00:00Z"))/86400000)+1:0;
 const validRange=startDay>=today&&rangeLength>=1&&rangeLength<=90;
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [search,setSearch]=useState(""),[month,setMonth]=useState("");
 const filtered=filterTpoBlockedDates(items,search,month);
 const pastCount=filtered.filter(item=>item.day<today).length;
 const visible=showPast?filtered:filtered.filter(item=>item.day>=today);
 const ranges=groupTpoBlockedDays(visible);
 async function request(url:string,method:"POST"|"DELETE",body:Record<string,unknown>){
  setBusy(true);setError("");setNotice("");
  try{
   await apiFetch(url,{method,credentials:"same-origin",
    headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
   setNotice("Blocked dates saved");if(method==="POST"){setStartDay("");setEndDay("");setReason("");}
   router.refresh();
  }catch(e){const code=e instanceof FriendlyFetchError?e.code:null;
   setError(code==="DATE_IN_PAST"?"Past dates cannot be blocked.":
    code==="DATE_RANGE_INVALID"?"Pick a range of up to 90 days.":
    code==="DATE_EXISTS"?"A day in this range is already blocked.":
    e instanceof Error?e.message:"Blocked dates could not be updated.");}finally{setBusy(false);}
 }
 return <section className="min-w-0 space-y-4">
  <form className="grid min-w-0 gap-3 border-b border-border pb-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_2fr_auto]"
   onSubmit={e=>{e.preventDefault();if(!validRange||busy)return;
    void request("/api/placements/tpo/settings/blocked-dates","POST",{startDay,endDay,reason:reason.trim()||"Blocked"});}}>
   <label className="text-sm">From
    <Input type="date" required min={today} value={startDay} disabled={busy}
     onChange={e=>{setStartDay(e.target.value);if(endDay&&endDay<e.target.value)setEndDay(e.target.value);}}
     className="mt-1 min-h-11 sm:min-h-9 w-full"/></label>
   <label className="text-sm">Until
    <Input type="date" required min={startDay||today} value={endDay} disabled={busy}
     onChange={e=>setEndDay(e.target.value)}
     className="mt-1 min-h-11 sm:min-h-9 w-full"/></label>
   <label className="text-sm">Label (optional)
    <Input value={reason} disabled={busy} maxLength={500} onChange={e=>setReason(e.target.value)}
     placeholder="Blocked" className="mt-1 min-h-11 sm:min-h-9 w-full"/></label>
   {reason.trim().length>0&&reason.trim().length<3?<p role="alert" className="self-end text-xs text-error">Use at least 3 characters for a label, or leave it blank.</p>:null}
   <Button type="submit" className="min-h-11 sm:min-h-9 self-end"
    disabled={busy||!validRange||(reason.trim().length>0&&reason.trim().length<3)}>Block dates</Button>
  </form>
  <div className="grid gap-3 border-b border-border pb-4 sm:grid-cols-2">
    <label className="grid min-w-0 gap-1 text-sm font-semibold text-body">Filter by month
      <Input type="month" value={month} onChange={e=>setMonth(e.target.value)}
        className="min-h-11 sm:min-h-9 w-full"/>
    </label>
    <label className="grid min-w-0 gap-1 text-sm font-semibold text-body">Search reasons
      <Input type="search" maxLength={100} value={search} onChange={e=>setSearch(e.target.value)}
        placeholder="Reason or YYYY-MM-DD"
        className="min-h-11 sm:min-h-9 w-full"/>
    </label>
  </div>
  <p role="status" className="text-xs text-muted-foreground">Showing {visible.length} of {items.length} blocked days across {ranges.length} displayed ranges · Maximum 90 days per range</p>
  {pastCount>0?<Button type="button" variant="secondary" onClick={()=>setShowPast(value=>!value)}
   className="min-h-11 sm:min-h-9">{showPast?"Hide past blocked dates":`Show past blocked dates (${pastCount})`}</Button>:null}
  {visible.length===0?<p role="status" className="text-sm text-muted-foreground">{!showPast&&pastCount>0?"No upcoming blocked dates.":tpoBlockedDatesEmptyMessage(items.length)}</p>:
   <ul className="grid min-w-0 gap-2 sm:grid-cols-2">{ranges.map(range=><li key={range.items[0].id}
    className="flex min-w-0 flex-wrap justify-between gap-3 rounded-[var(--lms-canvas-radius,12px)] border border-border bg-surface p-3">
    <div className="min-w-0"><strong>{range.startDay===range.endDay?range.startDay:range.startDay+" – "+range.endDay}</strong><p className="break-words text-sm">{range.reason}</p><p className="text-xs text-muted-foreground">{range.items.length} day(s) · Individual day removal below</p></div>
    {range.items.length>1?<Button type="button" variant="secondary" disabled={busy} onClick={()=>{
     if(!window.confirm("Remove all "+range.items.length+" blocked days in this range?"))return;
     void request("/api/placements/tpo/settings/blocked-dates/range","DELETE",{
      startDay:range.startDay,endDay:range.endDay,
      versions:range.items.map(item=>({id:item.id,expectedVersion:item.updatedAt})),
     });
    }} className="min-h-11 sm:min-h-9">Remove whole range</Button>:null}
    <details className="min-w-0">
     <summary className="cursor-pointer text-sm font-semibold text-primary-text">Manage individual days ({range.items.length})</summary>
     <div className="mt-2 flex max-h-48 flex-wrap gap-1 overflow-y-auto">{range.items.map(item=><Button key={item.id} variant="secondary" type="button" disabled={busy} onClick={()=>{
     if(!window.confirm("Remove "+item.day+" from blocked dates?"))return;
     void request("/api/placements/tpo/settings/blocked-dates/"+item.id,"DELETE",{expectedVersion:item.updatedAt});
    }} className="min-h-11 sm:min-h-9">Remove {item.day}</Button>)}</div></details></li>)}</ul>}
  {error?<InlineNotice tone="error" message={error} onDismiss={()=>setError("")}/>:null}
  {notice?<p role="status" className="text-sm">{notice}</p>:null}
 </section>;
}
