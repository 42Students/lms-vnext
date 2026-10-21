"use client";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {useRouter,useSearchParams} from "next/navigation";
import type {VerificationTab} from "@/modules/verification/queue-tabs";
import {useState} from "react";
import {useToast} from "@/components/ui/toast";
import {VerificationWorkspace,type VerificationQueueCard} from "./VerificationWorkspace";
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
    onClick={()=>{setSelected(null);setSequenceRows(waiting);setSequenceIndex(0);}}>Review one by one ({waiting.length})</Button>:null}
   {serverTab==="WAITING"?<Button variant="secondary" type="button" className="min-h-11 w-full sm:w-auto md:min-h-9"
    onClick={()=>navigate({tab:"WAITING",waitingState:"UPDATE_PENDING",page:"1"})}>Updates to verified details</Button>:null}
  </div>
  <section aria-label="Verification filters" className="grid min-w-0 gap-3 border-b border-border pb-4 sm:grid-cols-2">
   <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Marksheets
    <Select value={filters.marksheets} onChange={e=>update("marksheets",e.target.value as TpoVerificationLocalFilters["marksheets"])}
     className="mt-1 block min-h-11 w-full min-w-0 md:min-h-9">
     <option value="ANY">Any</option><option value="MISSING">Missing</option><option value="PRESENT">All uploaded</option>
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
   <details className="border-b border-border pb-3">
    <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9 md:py-2">Verify profiles / Send back for correction</summary>
    <TpoRosterVerificationBulk key={"queue:"+JSON.stringify(filters)+serverTab+serverKind} rows={visible} scope="verification"/>
   </details>:null}
  {nudgeRows.length?<details className="border-b border-border pb-3">
   <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-primary-text md:min-h-9 md:py-2">
    Act on selected → Send a message
   </summary>
   <TpoStudentNudgePanel rows={nudgeRows}/>
  </details>:null}
  <VerificationWorkspace key={JSON.stringify(filters)+serverTab+serverKind} rows={visible}
   legacyTpoCopy initialTab={serverTab} initialKind={serverKind} counts={counts}
   disableLocalSearch preserveServerOrder showTabCounts={true}
   onTabChange={tab=>navigate({tab,page:"1",waitingState:tab==="WAITING"?(params.get("waitingState")??"ALL"):"ALL",waitingSince:tab==="WAITING"?(params.get("waitingSince")??"ALL"):"ALL"})}
   onKindChange={kind=>navigate({kind,page:"1"})}
   onReview={row=>{setSequenceIndex(null);setSelected(row);}} />
  {active&&<VerificationReviewDrawer
   key={active.learnerMembershipId+active.section} row={active}
   apiBase="/api/tpo/verification"
   onClose={()=>sequenceIndex!==null?finishSequential():setSelected(null)}
   sequenceProgress={sequenceIndex===null?undefined:(sequenceIndex+1)+" of "+sequenceRows.length}
   onNext={nextSequential} onFinish={finishSequential}
   onSaved={saved} />}
 </section>;
}
