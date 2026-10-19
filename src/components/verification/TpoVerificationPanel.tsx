import { Select } from "@/components/ui/select";
"use client";
import { Button } from "@/components/ui/button";
import {useRouter,useSearchParams} from "next/navigation";
import type {VerificationTab} from "@/modules/verification/queue-tabs";
import {useState} from "react";
import {useToast} from "@/components/ui/toast";
import {VerificationWorkspace,type VerificationQueueCard} from "./VerificationWorkspace";
import {VerificationReviewDrawer} from "./VerificationReviewDrawer";
import {TpoRosterVerificationBulk} from "@/components/tpo/tpo-roster-verification-bulk";
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
  <div className="flex flex-wrap gap-3">
   <Button variant="secondary" type="button"  onClick={()=>router.refresh()}>Refresh</Button>
   {serverTab==="WAITING"&&waiting.length>0?<Button variant="secondary" type="button" className="text-primary-text"
    onClick={()=>{setSelected(null);setSequenceRows(waiting);setSequenceIndex(0);}}>Review one by one ({waiting.length})</Button>:null}
  </div>
  {serverTab==="WAITING"?<Button variant="secondary" type="button" className="text-primary-text"
   onClick={()=>navigate({tab:"WAITING",waitingState:"UPDATE_PENDING",page:"1"})}>Updates to verified details</Button>:null}
  <section aria-label="Verification filters" className="grid gap-3 rounded-xl border border-border p-3 sm:grid-cols-2">
   <label className="text-sm font-semibold">Marksheets
    <Select value={filters.marksheets} onChange={e=>update("marksheets",e.target.value as TpoVerificationLocalFilters["marksheets"])}
     className="mt-1 block min-h-10 w-full rounded border border-border bg-surface px-3">
     <option value="ANY">Any</option><option value="MISSING">Missing</option><option value="PRESENT">All uploaded</option>
    </Select>
   </label>
   <label className="text-sm font-semibold">Needs a closer look
    <Select value={filters.attention} onChange={e=>update("attention",e.target.value as TpoVerificationLocalFilters["attention"])}
     className="mt-1 block min-h-10 w-full rounded border border-border bg-surface px-3">
     <option value="ALL">All requests</option><option value="MISSING_DOCUMENT">Missing document</option>
     <option value="WAITING_OVER_WEEK">Waiting over a week</option>
    </Select>
   </label>
   <p className="text-xs text-muted-foreground sm:col-span-3">Showing {visible.length} of {rows.length} records from the server-filtered authorized page. Status, section, batch and branch filters apply before pagination.</p>
  </section>
  {serverTab==="WAITING"&&visible.length>0?
   <TpoRosterVerificationBulk key={"queue:"+JSON.stringify(filters)+serverTab+serverKind} rows={visible} scope="verification"/>:null}
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
