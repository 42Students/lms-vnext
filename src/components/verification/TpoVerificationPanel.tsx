"use client";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {useRouter,useSearchParams} from "next/navigation";
import type {VerificationTab} from "@/modules/verification/queue-tabs";
import {useState} from "react";
import {useToast} from "@/components/ui/toast";
import {VerificationWorkspace,type VerificationQueueCard} from "./VerificationWorkspace";
import {TpoVerificationPrototypeQueue} from "./TpoVerificationPrototypeQueue";
import {VerificationReviewDrawer} from "./VerificationReviewDrawer";
import {TpoRosterVerificationBulk} from "@/components/tpo/tpo-roster-verification-bulk";
import {TpoStudentNudgePanel} from "@/components/tpo/tpo-student-nudge-panel";
import {filterTpoVerificationRows,defaultTpoVerificationFilters,type TpoVerificationLocalFilters} from "@/modules/verification/tpo-queue-local-filters";

/** Same locked review, private receipt and stale-version path as College Admin. */
export function TpoVerificationPanel({rows,counts,serverTab,serverKind}:{rows:VerificationQueueCard[];counts?:Record<VerificationTab,number>;serverTab:VerificationTab;serverKind:"ALL"|"EDUCATION"|"IDENTITY"}){
 const router=useRouter(),params=useSearchParams();
 const {showToast}=useToast();
 function navigate(patch:Record<string,string>){
  const next=new URLSearchParams(params.toString());
  Object.entries(patch).forEach(([key,value])=>{if(value)next.set(key,value);else next.delete(key);});
  router.push("/tpo/verification?"+next.toString());
 }
 const [selected,setSelected]=useState<VerificationQueueCard|null>(null);
 const [sequenceIndex,setSequenceIndex]=useState<number|null>(null);
 const [sequenceRows,setSequenceRows]=useState<VerificationQueueCard[]>([]);
 const [filters,setFilters]=useState<TpoVerificationLocalFilters>(defaultTpoVerificationFilters);
 const [asOf]=useState(()=>new Date());
 const visible=filterTpoVerificationRows(rows,filters,asOf);
 const waiting=visible.filter(row=>row.status==="SUBMITTED"||row.status==="UPDATE_PENDING");
 // Shortcut totals are scoped to the authorized server page, not a college-wide count.
 const pageMissing=rows.filter(row=>row.section==="EDUCATION"&&row.missingMarksheet).length;
 const pageUpdates=rows.filter(row=>row.status==="UPDATE_PENDING").length;
 const pageOverdue=rows.filter(row=>(row.status==="SUBMITTED"||row.status==="UPDATE_PENDING")&&
  asOf.getTime()-row.submittedAt.getTime()>7*86400000).length;
 const activeUpdate=params.get("waitingState")==="UPDATE_PENDING";
 function toggleAttention(value:"MISSING_DOCUMENT"|"WAITING_OVER_WEEK"){
  setFilters(old=>({...old,marksheets:"ANY",attention:old.attention===value?"ALL":value}));
  setSelected(null);setSequenceIndex(null);
 }
 function toggleMissing(){
  setFilters(old=>({...old,marksheets:old.marksheets==="MISSING"?"ANY":"MISSING",attention:"ALL"}));
  setSelected(null);setSequenceIndex(null);
 }
 // The legacy Send a message action targets distinct students, not each
 // Education/Identity section. The existing TPO endpoint independently
 // authorizes each recipient and writes an audited in-app notification.
 const nudgeRows=[...new Map(visible.map(row=>[
  row.learnerMembershipId,{id:row.learnerMembershipId,label:row.learnerName,registered:null},
 ])).values()];
 const active=sequenceIndex===null?selected:sequenceRows[sequenceIndex]??null;
 function finishSequential(completed=false){
  if(sequenceIndex!==null&&sequenceIndex<sequenceRows.length-1&&!completed){
   const remaining=sequenceRows.length-sequenceIndex-1;
   showToast({tone:"info",title:"Stopped at "+(sequenceIndex+1)+" of "+sequenceRows.length+". The other "+remaining+" are still in the queue."});
  }
  setSequenceIndex(null);setSelected(null);router.refresh();
 }
 function nextSequential(){
  if(sequenceIndex===null)return;
  if(sequenceIndex+1>=sequenceRows.length){finishSequential(true);return;}
  setSequenceIndex(sequenceIndex+1);
 }
 function saved(action?:"VERIFY"|"SEND_BACK"){
  showToast({tone:"success",title:action==="VERIFY"?(active?.section==="EDUCATION"?"Education":"Identity")+" verified. The student has been told.":"Sent back. The student sees your reason."});
  if(sequenceIndex!==null)nextSequential();else setSelected(null);
  router.refresh();
 }
 function update<K extends keyof TpoVerificationLocalFilters>(key:K,value:TpoVerificationLocalFilters[K]){
  setFilters(old=>({...old,[key]:value}));setSelected(null);setSequenceIndex(null);
 }
 return <section className="min-w-0 space-y-3">
  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
   <Button variant="secondary" type="button" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={()=>router.refresh()}>Refresh</Button>
   {serverTab==="WAITING"&&waiting.length>0?<Button variant="primary" type="button" className="min-h-11 w-full sm:w-auto md:min-h-9"
    onClick={()=>{setSelected(null);setSequenceRows(waiting);setSequenceIndex(0);}}>Start with the first of {waiting.length}</Button>:null}
  </div>
  {serverTab==="WAITING"?<div aria-label="Needs a closer look on this page" className="flex min-w-0 flex-wrap items-center gap-2 border-b border-border pb-3">
   <span className="mr-1 text-sm font-semibold text-body">Needs a closer look:</span>
   <Button variant="secondary" type="button" aria-pressed={filters.marksheets==="MISSING"}
    onClick={toggleMissing} className="min-h-11 md:min-h-9">A marksheet missing · {pageMissing}</Button>
   <Button variant="secondary" type="button" aria-pressed={activeUpdate}
    onClick={()=>navigate({tab:"WAITING",waitingState:activeUpdate?"ALL":"UPDATE_PENDING",page:"1"})}
    className="min-h-11 md:min-h-9">Updates to verified details · {pageUpdates}</Button>
   <Button variant="secondary" type="button" aria-pressed={filters.attention==="WAITING_OVER_WEEK"}
    onClick={()=>toggleAttention("WAITING_OVER_WEEK")} className="min-h-11 md:min-h-9">Waiting over a week · {pageOverdue}</Button>
   <span className="w-full text-xs text-muted-foreground">Counts on this server-filtered page only. Select a shortcut again to clear it.</span>
  </div>:null}
  <section aria-label="Verification filters" className="grid min-w-0 gap-3 border-b border-border pb-4 sm:grid-cols-2">
   <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Marksheets
    <Select value={filters.marksheets} onChange={e=>update("marksheets",e.target.value as TpoVerificationLocalFilters["marksheets"])}
     className="mt-1 block min-h-11 w-full min-w-0 md:min-h-9">
     <option value="ANY">All marksheet states</option><option value="MISSING">Some missing</option><option value="PRESENT">All uploaded</option>
    </Select>
   </label>
   <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Needs a closer look
    <Select value={filters.attention} onChange={e=>update("attention",e.target.value as TpoVerificationLocalFilters["attention"])}
     className="mt-1 block min-h-11 w-full md:min-h-9">
     <option value="ALL">All requests</option><option value="MISSING_DOCUMENT">Missing document</option>
     <option value="WAITING_OVER_WEEK">Waiting over a week</option>
    </Select>
   </label>
   <p className="text-xs text-muted-foreground sm:col-span-2">Showing {visible.length} of {rows.length} records from the server-filtered authorized page. Status, section, batch and branch filters apply before pagination.</p>
  </section>
  {serverTab==="WAITING"&&visible.length>0?
   <section aria-label="Act on verification checks" className="border-b border-border pb-3">
    <p className="text-sm text-muted-foreground">Act on all {waiting.length} waiting checks in this view, or select individual Education and Identity checks below.</p>
    <TpoRosterVerificationBulk key={"queue:"+JSON.stringify(filters)+serverTab+serverKind} rows={visible} scope="verification"/>
   </section>:null}
  {nudgeRows.length?<details className="border-b border-border pb-3">
   <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-primary-text md:min-h-9 md:py-2">
    Send a message to students in this view
   </summary>
   <TpoStudentNudgePanel rows={nudgeRows}/>
  </details>:null}
  <TpoVerificationPrototypeQueue rows={visible} active={active}
   onReview={row=>{setSequenceIndex(null);setSelected(row);}}/>
  <details className="min-w-0 border-y border-border py-3">
   <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-link">
    Advanced verification table, sorting and filters
   </summary>
   <div className="min-w-0 pt-3">
  <VerificationWorkspace key={JSON.stringify(filters)+serverTab+serverKind} rows={visible}
   legacyTpoCopy initialTab={serverTab} initialKind={serverKind} {...(counts !== undefined ? {counts} : {})}
   disableLocalSearch preserveServerOrder showTabCounts={true}
   onTabChange={tab=>navigate({tab,page:"1",waitingState:tab==="WAITING"?(params.get("waitingState")??"ALL"):"ALL",waitingSince:tab==="WAITING"?(params.get("waitingSince")??"ALL"):"ALL"})}
   onKindChange={kind=>navigate({kind,page:"1"})}
   onReview={row=>{setSequenceIndex(null);setSelected(row);}} />
   </div>
  </details>
  {active&&<VerificationReviewDrawer
   key={active.learnerMembershipId+active.section} row={active}
   apiBase="/api/tpo/verification"
   onClose={()=>sequenceIndex!==null?finishSequential():setSelected(null)}
   {...(sequenceIndex !== null ? {sequenceProgress:(sequenceIndex+1)+" of "+sequenceRows.length} : {})}
   onNext={nextSequential} onFinish={finishSequential}
   onSaved={saved} />}
 </section>;
}
