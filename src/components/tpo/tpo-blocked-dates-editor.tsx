"use client";
import { Disclosure } from "@/components/ui/disclosure";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {InlineNotice} from "@/components/ui/inline-notice";
import {EmptyState} from "@/components/ui/empty-state";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {useConfirmFlow} from "@/components/ui/use-confirm-flow";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {filterTpoBlockedDates,tpoBlockedDatesEmptyMessage} from "@/modules/placements/tpo-blocked-date-filter-model";
import {groupTpoBlockedDays} from "@/modules/placements/tpo-blocked-range-display";
import {tpoIndiaCalendarDay} from "@/modules/placements/tpo-local-date-model";
type BlockedDay={id:string;day:string;reason:string;updatedAt:string};
export function TpoBlockedDatesEditor({items}:{items:readonly BlockedDay[]}){
 const router=useRouter(),[startDay,setStartDay]=useState(""),[endDay,setEndDay]=useState(""),[reason,setReason]=useState("");
 const [showPast,setShowPast]=useState(false);
 const {askConfirm,dialog}=useConfirmFlow();
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
  <form className="grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-3)] border-b border-border pb-[var(--lms-space-4)] min-[768px]:grid-cols-2 min-[1280px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)_auto]"
   onSubmit={e=>{e.preventDefault();if(!validRange||busy)return;
    void request("/api/placements/tpo/settings/blocked-dates","POST",{startDay,endDay,reason:reason.trim()||"Blocked"});}}>
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">From
    <Input type="date" required min={today} value={startDay} disabled={busy}
     onChange={e=>{setStartDay(e.target.value);if(endDay&&endDay<e.target.value)setEndDay(e.target.value);}}
     className="min-h-11 w-full min-[768px]:min-h-9"/></label>
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Until
    <Input type="date" required min={startDay||today} value={endDay} disabled={busy}
     onChange={e=>setEndDay(e.target.value)}
     className="min-h-11 w-full min-[768px]:min-h-9"/></label>
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Label (optional)
    <Input value={reason} disabled={busy} maxLength={500} onChange={e=>setReason(e.target.value)}
     placeholder="Blocked" className="min-h-11 w-full min-[768px]:min-h-9"/></label>
   
   <Button type="submit" className="min-h-11 w-full min-[768px]:min-h-9 min-[1280px]:w-auto self-end"
    disabled={busy||!validRange||(reason.trim().length>0&&reason.trim().length<3)}>Block dates</Button>
   {reason.trim().length>0&&reason.trim().length<3?
    <div className="min-w-0 min-[768px]:col-span-2 min-[1280px]:col-span-4">
      <InlineNotice tone="error" message="Use at least 3 characters for a label, or leave it blank."/>
    </div>:null}
  </form>
  <Disclosure title="Filter blocked dates" className="min-w-0" contentClassName="pt-[var(--lms-space-2)]">
   <div className="grid min-w-0 gap-[var(--lms-space-3)] border-b border-border pb-[var(--lms-space-4)] min-[768px]:grid-cols-2">
    <label className="grid min-w-0 gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Filter by month
      <Input type="month" value={month} onChange={e=>setMonth(e.target.value)}
        className="min-h-11 min-[768px]:min-h-9 w-full"/>
    </label>
    <label className="grid min-w-0 gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Search reasons
      <Input type="search" maxLength={100} value={search} onChange={e=>setSearch(e.target.value)}
        placeholder="Reason or YYYY-MM-DD"
        className="min-h-11 min-[768px]:min-h-9 w-full"/>
    </label>
   </div>
  </Disclosure>
  <p role="status" className="text-xs text-muted-foreground">Showing {visible.length} of {items.length} blocked days across {ranges.length} displayed ranges · Maximum 90 days per range</p>
  {pastCount>0?<Button type="button" variant="secondary" onClick={()=>setShowPast(value=>!value)}
   className="min-h-11 min-[768px]:min-h-9">{showPast?"Hide past blocked dates":`Show past blocked dates (${pastCount})`}</Button>:null}
  {visible.length===0?<EmptyState title={!showPast&&pastCount>0?"No upcoming blocked dates.":tpoBlockedDatesEmptyMessage(items.length)}/>:
   <ul className="grid min-w-0 gap-2 min-[768px]:grid-cols-2">{ranges.map(range=><li key={range.startDay+":"+range.endDay}
    className="flex min-w-0 flex-col items-stretch gap-[var(--lms-space-3)] border-b border-border py-[var(--lms-space-4)]">
    <div className="min-w-0"><strong>{range.startDay===range.endDay?range.startDay:range.startDay+" – "+range.endDay}</strong><p className="break-words text-sm">{range.reason}</p><p className="text-xs text-muted-foreground">{range.items.length} day(s) · Individual day removal below</p></div>
    {range.items.length>1?<Button type="button" variant="secondary" disabled={busy} onClick={async()=>{
     if(!(await askConfirm("Remove all "+range.items.length+" blocked days in this range?")))return;
     void request("/api/placements/tpo/settings/blocked-dates/range","DELETE",{
      startDay:range.startDay,endDay:range.endDay,
      versions:range.items.map(item=>({id:item.id,expectedVersion:item.updatedAt})),
     });
    }} className="min-h-11 w-full min-[768px]:min-h-9 min-[768px]:w-auto">Remove whole range</Button>:null}
    <Disclosure title={`Manage individual days (${range.items.length})`} className="min-w-0 w-full">
     <div className="mt-[var(--lms-space-2)] flex max-h-48 min-w-0 flex-wrap gap-[var(--lms-space-2)] overflow-y-auto">{range.items.map(item=><Button key={item.id} variant="secondary" type="button" disabled={busy} onClick={async()=>{
     if(!(await askConfirm("Remove "+item.day+" from blocked dates?")))return;
     void request("/api/placements/tpo/settings/blocked-dates/"+item.id,"DELETE",{expectedVersion:item.updatedAt});
    }} className="min-h-11 min-[768px]:min-h-9">Remove {item.day}</Button>)}</div></Disclosure></li>)}</ul>}
  {error?<InlineNotice tone="error" message={error} onDismiss={()=>setError("")}/>:null}
  {notice?<InlineNotice tone="success" message={notice}/>:null}
  {dialog}
 </section>;
}
